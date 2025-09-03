/**
 *
 * Copyright 2025, Institute for Systems Biology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// initial design by @pieper 6/25/25
require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.7.1.min',
        base: 'base'
    }
});

require([
    'base', 'jquery'
], function (base, $) {

    const byte_level = Object.freeze({
        1: "KB",
        2: "MB",
        3: "GB",
        4: "TB",
        5: "PB"
    });

    const REQ_TYPE = Object.freeze({
        COLLECTION: 1,
        CASE: 2,
        STUDY: 3,
        SERIES: 4
    });

    function size_display_string(size) {
        if(size <= 0) {
            return "0 MB";
        }
        let byte_count = 0;
        let converted_size = size;
        while(converted_size > 1024) {
            byte_count += 1;
            converted_size /= 1024;
        }
        let bytes = (Math.round(converted_size*1000)/1000).toFixed(3);
        return `${bytes} ${byte_level[byte_count]}` ;
    }

    class DownloadProgressDisplay {
        msgBox = $('#floating-message');
        cancel_button = this.msgBox.find('.cancel-floating-message');
        close_button = this.msgBox.find('.close-floating-message');
        msgBoxContents = this.msgBox.find('.floating-message-content');
        msgBoxHeader = this.msgBox.find('.floating-message-header');

        // Updates floating message text elements and/or icons
        // messages: Object of DOM element contents to update of the form:
        //      { <subclass>: <HTML>, [<subclass>: <HTML>...] }
        //      subclass should be the final term in the element's floating-message class
        //          (eg. floating-message-header has a subclass of header)
        //      A falsey valye will empty all text elements
        // icon: string subclass of the icon to display. subclass should be the final term in the icon's
        //      floating-message-icon class (eg. floating-message-icon-download has a subclass of download)
        update(type, messages, icon) {
           let alert_box = this.msgBox.find('.alert');
            alert_box.removeClass();
            alert_box.addClass(`alert alert-dismissible alert-${type}`);
            let new_icon = (typeof icon === "string");
            (!icon || new_icon) && this.msgBox.find('.floating-message-icon').hide();
            (new_icon) && this.msgBox.find(`.floating-message-icon-${icon}`).show();
            if(messages) {
                for (const [loc, msg] of Object.entries(messages)) {
                    let updateTo = this.msgBox.find(`.floating-message-${loc}`);
                    updateTo.empty();
                    updateTo.append(`${msg}`);
                }
            } else {
                this.msgBox.find('.floating-messages').empty();
            }
        }

        // Sets up the download message box and displays it. Subsequent calls to this method
        // will completely override the current contents of the entire display. To update only the type, text
        // and/or icons, use update.
        show(type, contents, icon, withCancel, withClose) {
            withCancel ? this.cancel_button.show() : this.cancel_button.hide();
            withClose ? this.close_button.show() : this.close_button.hide();
            this.msgBoxContents.empty();
            this.msgBoxHeader.empty();
            type = type || "info";
            this.update(type, contents, icon)
            this.msgBox.show();
        }
    }

    class DownloadRequest {
        request_type = REQ_TYPE.SERIES;
        region = "us-east-1";

        constructor(request) {
            this.study_id = request['study_id'];
            this.collection_id = request['collection_id'];
            this.series_id = request['series_id'];
            this.modality = request['modality'];
            this.patient_id = request['patient_id'];
            this.bucket = request['bucket'];
            this.crdc_series_id = request['crdc_series_id'];
            this.directory = request['directory'];
            this.total_size = parseFloat(request['series_size']);

            if(this.series_id) {
                this.request_type = REQ_TYPE.SERIES;
            } else if(this.study_id) {
                this.request_type = REQ_TYPE.STUDY;
            } else if(this.patient_id) {
                this.request_type = REQ_TYPE.CASE;
            } else {
                this.request_type = REQ_TYPE.COLLECTION;
            }
        }

        get request_type() {
            return
        }

        async getAllS3ObjectKeys() {
            const allKeys = [];
            let isTruncated = true;
            let continuationToken = null;
            while (isTruncated) {
                let url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/?list-type=2`;
                if (this.crdc_series_id) {
                    url += `&prefix=${encodeURIComponent(this.crdc_series_id)}`;
                }
                if (continuationToken) {
                    url += `&continuation-token=${encodeURIComponent(continuationToken)}`;
                }
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                    }
                    const xmlText = await response.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                    const errorCode = xmlDoc.getElementsByTagName('Code')[0]?.textContent;
                    if (errorCode) {
                        const errorMessage = xmlDoc.getElementsByTagName('Message')[0]?.textContent;
                        throw new Error(`S3 API Error: ${errorCode} - ${errorMessage}`);
                    }
                    const keyElements = xmlDoc.getElementsByTagName('Key');
                    const keysOnPage = Array.from(keyElements).map(el => el.textContent);
                    allKeys.push(...keysOnPage);
                    isTruncated = xmlDoc.getElementsByTagName('IsTruncated')[0]?.textContent === 'true';
                    if (isTruncated) {
                        continuationToken = xmlDoc.getElementsByTagName('NextContinuationToken')[0]?.textContent;
                    } else {
                        continuationToken = null;
                    }
                } catch (error) {
                    console.error("Failed to fetch S3 data:", error);
                    throw error; // Re-throw the error to be handled by the caller
                }
            }
            return allKeys;
        }

        async loadAllKeys() {
            const s3_urls = [];
            await this.getAllS3ObjectKeys().then(keys => {
                keys.forEach((key) => {
                    if (key !== "") {
                        const keys = key.split("/");
                        const instance = keys[keys.length - 1];
                        s3_urls.push({
                            'url': `https://${this.bucket}.s3.us-east-1.amazonaws.com/${key}`,
                            'study': this.study_id,
                            'collection': this.collection_id,
                            'series': this.series_id,
                            'modality': this.modality,
                            'instance': instance,
                            'patient': this.patient_id,
                            'directory': this.directory
                        });
                    }
                });
            });
            return s3_urls;
        }
    }

    class DownloadQueueManager {
        WORKING_QUEUE_LIMIT = 2000;
        HOPPER_LIMIT = 4000;

        hopper = [];
        working_queue = [];

        queue_byte_size = 0;
        bytes_downloaded = 0;
        series_count = 0;
        start_time = -1;
        collections = new Set([]);
        cases = new Set([]);
        studies = new Set([]);

        cancellation_underway = false;

        get pending() {
            if(this.hopper.length <= 0 && this.working_queue.length <= 0) {
                return "";
            }
            let pending_items = [];
            this.hopper.length > 0 && pending_items.push(`${this.hopper.length} series`);
            this.working_queue.length > 0 && pending_items.push(`${this.working_queue.length} file(s)`);
            return pending_items.join(" and ");
        }

        get total_downloads_requested() {
            return size_display_string(this.queue_byte_size);
        }

        get total_bytes_downloaded() {
            return size_display_string(this.bytes_downloaded);
        }

        get total_duration_estimate() {
            if(this.start_time < 0 || this.bytes_downloaded <=0)
                return "Calculating..."
            let rate = this.bytes_downloaded/((Date.now()-this.start_time)/1000);
            let sec_remaining = Math.round((this.queue_byte_size-this.bytes_downloaded)/rate).toFixed(0);
            return `~${((sec_remaining-(sec_remaining%60))/60)}m${(sec_remaining%60) > 9 ? ':' : ':0'}${sec_remaining%60}s remaining @ ${size_display_string(rate)}ps`;
        }

        reset_queue_manager() {
            this.queue_byte_size = 0;
            this.bytes_downloaded = 0;
            this.series_count = 0;
            this.collections = new Set([]);
            this.cases = new Set([]);
            this.studies = new Set([]);
            this.cancellation_underway = false;
            this.start_time = -1;
        }

        get active_requests() {
            return (this.working_queue.length > 0);
        }

        set_start_time() {
            if(this.start_time < 0) this.start_time = Date.now();
        }

        cancel() {
            this.cancellation_underway = true;
            this._emptyQueues();
        }

        async _update_queue() {
            if(this.working_queue.length < this.WORKING_QUEUE_LIMIT && this.hopper.length > 0) {
                let request = this.hopper.pop();
                if(request)
                await request.loadAllKeys().then(keys => {
                    this.working_queue.push(...keys);
                });
            }
            // It's possible a cancellation came in while we were doing this. If so, re-empty the working_queue
            if(this.cancellation_underway) {
                this.working_queue.slice(0,this.working_queue.length);
            }
        }

        load(request) {
            let request_success = false;
            if(this.hopper.length < this.HOPPER_LIMIT && !this.cancellation_underway) {
                this.hopper.push(new DownloadRequest(request));
                this.queue_byte_size += parseFloat(request['series_size']);
                this.series_count += 1;
                this.studies.add(request['study_id']);
                this.collections.add(request['collection_id']);
                this.cases.add(request['patient_id']);
                request_success = true;
            }
            return request_success;
        }

        isEmpty() {
            return (this.working_queue.length <= 0 && this.hopper.length <= 0);
        }

        async get_download_item() {
            this.set_start_time();
            await this._update_queue();
            if(this.working_queue.length > 0 && !this.cancellation_underway) {
                return this.working_queue.pop();
            }
            return null;
        }

        _emptyQueues() {
            this.hopper.length = 0;
            this.working_queue.length = 0;
        }
    }

    function workerOnMessage(event) {
        if(event.data.message === 'update') {
            downloader_manager.add_to_done(parseFloat(event.data.size));
            let msg = `Download status: ${downloader_manager.in_progress} file(s) downloading${downloader_manager.pending_msg}...`;
            let progType = "download";
            downloader_manager.progressUpdate(msg, progType);
            return;
        }
        let thisWorker = event.target;
        let true_error = event.data.message === 'error' && event.data.error.name !== "AbortError";
        let cancellation = downloader_manager.pending_cancellation || (event.data.message === 'error' && event.data.error.name === "AbortError");
        if (true_error) {
            console.error(`Worker Error: ${JSON.stringify(event)}`);
            downloader_manager.statusMessage(`Encountered an error while downloading these files.`, 'error', "error", true, false);
        }
        if (event.data.message === 'done' || cancellation) {
            let msg = `Download status: ${downloader_manager.in_progress} file(s) downloading${downloader_manager.pending_msg}...`;
            let progType = "download";
            if (downloader_manager.queues.isEmpty()) {
                // This means the remaining downloads are all in-progress, or we cancelled
                msg = cancellation ? "Cleaning up cancelled downloads..." : msg;
                progType = cancellation ? "cancel" : (downloader_manager.in_progress <= 0 ? "done" : progType);
            }
            downloader_manager.progressUpdate(msg, progType);
        }
        if (downloader_manager.queues.isEmpty() || (thisWorker.downloadCount > downloader_manager.workerDownloadThreshold) || downloader_manager.pending_cancellation) {
            downloader_manager.finalizeWorker(thisWorker);
        } else {
            thisWorker.downloadCount += 1;
            downloader_manager.availableWorkers.push(thisWorker);
        }
        downloader_manager.triggerWorkerDownloads();
    }

    function workerOnError(event) {
        let thisWorker = event.target
        console.error('[Main] Error in worker:', event.message || "No message given", event);
        downloader_manager.statusMessage(`[Worker] Error in worker: ${event.message}`, 'error', "error", true, false);
        downloader_manager.finalizeWorker(thisWorker);
    }

    class DownloadManager {
        progressDisplay = new DownloadProgressDisplay();

        // Text blobs
        workerCode = `
            const abort_controller = new AbortController();
            let pending_abort = false;
            function abortFetch(msg) {
                abort_controller.abort({"name": "AbortError", "reason": msg || "Fetch aborted."});
                pending_abort = true;
            };
            
            async function createNestedDirectories(topLevelDirectoryHandle, path) {
                const pathSegments = path.split('/').filter((segment) => segment !== '');
                let currentDirectoryHandle = topLevelDirectoryHandle;
                for (const segment of pathSegments) {
                    try {
                        // Attempt to get the directory handle without creating it
                        const entry = await currentDirectoryHandle.getDirectoryHandle(segment, {
                            create: false
                        })
                        currentDirectoryHandle = entry;
                    } catch (error) {
                        // If the error is specifically about the directory not existing, create it
                        if (error.name === 'NotFoundError') {
                            const entry = await currentDirectoryHandle.getDirectoryHandle(segment, {
                                create: true
                            })
                            currentDirectoryHandle = entry;
                        } else {
                            // TODO: Handle other potential errors (e.g., name conflicts)
                            return false; // Indicate failure
                        }
                    }
                }
                // Return the last directory handle
                return currentDirectoryHandle;
            }
            
            self.onmessage = async function (event) {
                if(event.data['abort'] || pending_abort) {
                    abortFetch(event.data['reason']);
                    return;
                }
                const s3_url = event.data['url'];
                const metadata = event.data['metadata'];
                const modality = metadata['modality'];
                const patientID = metadata['patient'];
                const collection_id = metadata['collection'];
                const studyInstanceUID = metadata['study'];
                const seriesInstanceUID = metadata['series'];
                const fileName = metadata['instance'];
                try {
                    const directoryHandle = event.data['directoryHandle'];
                    const seriesDirectory = modality + "_" + seriesInstanceUID;
                    const filePath = [collection_id, patientID, studyInstanceUID, seriesDirectory].join("/");
                    const subDirectoryHandle = await createNestedDirectories(directoryHandle, filePath);
                    const fileHandle = await subDirectoryHandle.getFileHandle(fileName, {create: true});
                    const outputStream = await fileHandle.createWritable();
                    let response = await fetch(s3_url, {
                        signal: abort_controller.signal
                    });
                    if (!response.ok) {
                        if(pending_abort) {
                            console.log('User aborted downloads');
                        } else {
                            console.error('[Worker] Failed to fetch URL: '+s3_url, response.statusText);
                            self.postMessage({message: "error", error: "Failed to fetch URL"});
                        }
                        return;
                    }
                    let read = 0;
                    let lastReportTime = -1;
                    let thisChunkTime = -1;
                    for await(const chunk of response.body) {
                        if(abort_controller.signal.aborted) break;               
                        outputStream.write(chunk);
                        thisChunkTime = Date.now();
                        read += chunk.length;
                        if(lastReportTime < 0 || ((thisChunkTime-lastReportTime) > 300)) {
                            lastReportTime = Date.now();
                            self.postMessage({message: "update", size: read});
                            read = 0;
                         }
                    }
                    read > 0 && self.postMessage({message: "update", size: read});
                    await outputStream.close();
                    self.postMessage({message: "done", path: s3_url, localFilePath: filePath, size: response.headers.get('content-length')});
                } catch (error) {
                    let msg = error.name || "Unnamed Error" + " when attempting to fetch URL " + s3_url;
                    if(error.name === "AbortError" || (error.name === undefined && pending_abort)) {
                        msg = "Fetch was aborted. The user may have cancelled their downloads.";
                    } else {
                        console.error(msg);
                        console.error(error);
                    }
                    self.postMessage({message: 'error', path: s3_url, error: error, 'text': msg});
                }
            }    
        `;

        // Status
        pending_cancellation = false;

        // Workers
        availableWorkers = [];
        downloadWorkers = [];
        workerDownloadThreshold = 100;
        workerCodeBlob = null;
        workerObjectURL = null;
        workerLimit = navigator.hardwareConcurrency;

        lastProgressUpdate = -1;

        constructor() {
            this.queues = new DownloadQueueManager();
            this.workerCodeBlob = new Blob([this.workerCode], {type: 'application/javascript'});
        }

        get overall_progress() {
            return `${this.queues.total_bytes_downloaded} / ${this.queues.total_downloads_requested} downloaded (${this.queues.total_duration_estimate})`;
        }

        get all_requested() {
            return `${this.queues.total_downloads_requested} requested in ` +
                `${this.queues.collections.size} collection(s) / ` +
                `${this.queues.cases.size} case(s) / ` +
                `${this.queues.studies.size} ${this.queues.studies.size <= 1 ? "study" : "studies"} / ` +
                `${this.queues.series_count} series`;
        }

        get pending_msg() {
            let pending = this.queues.pending;
            if(pending.length > 0) {
                return `, ${pending} pending`;
            }
            return "";
        }

        get in_progress() {
            return this.downloadWorkers.length - this.availableWorkers.length;
        }

        add_to_done(downloaded_amount) {
            this.queues.bytes_downloaded += downloaded_amount;
        }

        // Replaces the current floating message contents with a new message, including a new icon if provided
        statusMessage(message, type, icon, withClose, withCancel) {
            let messages = {
                "content": message
            };
            if(!this.pending_cancellation && this.in_progress > 0) {
                messages['header'] = this.all_requested;
            }
            this.progressDisplay.show(type, messages, icon, withCancel, withClose);
        }

        // Updates the current floating message contents and display class
        // Will abort out of an update if there isn't a pending cancellation and the last update time was < 2 seconds
        // ago
        progressUpdate(message, progType) {
            if(this.lastProgressUpdate > 0 && Date.now()-this.lastProgressUpdate < 300 && !this.pending_cancellation)
                return;
            progType = progType || "download";
            let type = "info";
            let icon = progType || true;
            let prog = `${this.overall_progress} <br />`;
            switch(progType) {
                case "cancel":
                    type = "warning";
                    prog = "";
                    break;
                case "done":
                    type = "success";
                    break;
                case "error":
                    prog = "";
                    type = "error";
                    break;
                default:
                    break;
            }

            let messages = {
                "content": prog + message
            };
            if(!this.pending_cancellation && this.in_progress > 0) {
                messages['header'] = this.all_requested;
            }
            this.lastProgressUpdate = Date.now();
            this.progressDisplay.update(type, messages, icon);
        }

        finalizeWorker(worker) {
            worker.terminate();
            this.downloadWorkers = this.downloadWorkers.filter(w => w !== worker);
        }

        allocateWorker() {
            let downloadWorker = new Worker(this.workerObjectURL);
            downloadWorker.onmessage = workerOnMessage;
            downloadWorker.onerror = workerOnError;
            downloadWorker.downloadCount = 0;
            this.downloadWorkers.push(downloadWorker);
            return downloadWorker
        }

        async triggerWorkerDownloads() {
            if (this.queues.isEmpty() && this.downloadWorkers.length <= 0) {
                // One way or another, we're stopping
                // cleanup our worker object URL for now
                if (this.workerObjectURL) {
                    URL.revokeObjectURL(this.workerObjectURL);
                    this.workerObjectURL = null;
                }
                let msg = this.pending_cancellation ? 'Download cancelled.' : `Download complete.`;
                this.queues.reset_queue_manager();
                let type = this.pending_cancellation ? 'warning' : 'success';
                let icon = this.pending_cancellation ? 'cancel' : 'done';
                this.statusMessage(msg, type, icon, true, false);
                this.pending_cancellation = false;
            } else {
                if(!this.pending_cancellation) {
                    if (!this.workerObjectURL) {
                        this.workerObjectURL = URL.createObjectURL(this.workerCodeBlob);
                    }
                    while (!this.queues.isEmpty() && !this.pending_cancellation) {
                        let targetWorker = null;
                        if (this.availableWorkers.length > 0) {
                            targetWorker = this.availableWorkers.pop();
                        } else {
                            if (this.downloadWorkers.length <= this.workerLimit) {
                                targetWorker = this.allocateWorker();
                            } else {
                                break; // all workers busy and we can't add more
                            }
                        }
                        if(targetWorker) {
                            let item_to_download = await this.queues.get_download_item();
                            if(item_to_download) {
                                targetWorker.postMessage({
                                    'url': item_to_download['url'],
                                    'metadata': item_to_download,
                                    'directoryHandle': item_to_download['directory']
                                });
                                let msg = `Download status: ${this.in_progress} file(s) in progress${this.pending_msg}...`;
                                this.progressUpdate(msg, "download");
                            } else {
                                // For whatever reason, we didn't get an item to work on; put this worker back on the
                                // available set
                                this.availableWorkers.push(targetWorker);
                            }
                        } else {
                            break;
                        }
                    }
                }
            }
        }

        addRequest(request) {
            this.queues.load(request);
        }

        cancel() {
            this.pending_cancellation = true;
            $('.cancel-download').hide();
            $('.close-message-window').show();
            this.queues.cancel();
            this.downloadWorkers.forEach(worker => {
                worker.postMessage({'abort': true, 'reason': 'User cancelled download.'});
            });
        }

        beginDownloads() {
            if(!this.queues.isEmpty()) {
                if(this.in_progress <= 0) {
                    $('.cancel-download').show();
                    $('.close-message-window').hide();
                    this.statusMessage("Download underway.", 'info', "download", false, true);
                }
                this.triggerWorkerDownloads();
            }
        }
    }

    let downloader_manager = new DownloadManager();

    $('.container-fluid').on('click', '.cancel-download', function () {
        downloader_manager.cancel();
    });

    $('.container-fluid').on('click', '.download-all-instances', async function () {
        const clicked = $(this);
        let directoryHandle = await window.showDirectoryPicker({
            id: 'idc-downloads',
            startIn: 'downloads',
            mode: 'readwrite',
        });
        const collection_id = clicked.attr('data-collection');
        const study_id = clicked.attr('data-study');
        const patient_id = clicked.attr('data-patient');

        let series = [];
        if(clicked.hasClass('download-study') || clicked.hasClass('download-case')) {
            let study_uri = (study_id !== undefined && study_id !== null) ? `${study_id}/` : "";
            let response = await fetch(`${BASE_URL}/series_ids/${patient_id}/${study_uri}`);
            if (!response.ok) {
                console.error(`[ERROR] Failed to retrieve series IDs for study ${study_id}: ${response.status}`);
                return;
            }
            const series_data = await response.json();
            series.push(...series_data['result']);
        } else {
            series.push({
                "bucket": clicked.attr('data-bucket'),
                "crdc_series_id": clicked.attr('data-series'),
                "series_id": clicked.attr('data-series-id'),
                "modality": clicked.attr('data-modality'),
                "series_size": clicked.attr('data-series-size'),
                "study_id": study_id
            });
        }
        series.forEach(series_request => {
            downloader_manager.addRequest({
                'directory': directoryHandle,
                'bucket': series_request['bucket'],
                'crdc_series_id': series_request['crdc_series_id'],
                'series_id': series_request['series_id'],
                'collection_id': collection_id,
                'study_id': series_request['study_id'],
                'modality': series_request['modality'],
                'patient_id': patient_id,
                'series_size': series_request['series_size']
            });
        });
        downloader_manager.beginDownloads();
    });
});