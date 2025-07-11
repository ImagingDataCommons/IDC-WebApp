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

// by @pieper 6/25/25
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

    let workerCode = `
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
                response = await fetch(s3_url)
                if (!response.ok) {
                    console.error('Worker: Failed to fetch URL:', s3_url, response.statusText);
                    self.postMessage({message: "error", error: "Failed to fetch URL"});
                    return
                }
                const arrayBuffer = await response.arrayBuffer();
                const seriesDirectory = modality + "_" + seriesInstanceUID;
                const filePath = [collection_id, patientID, studyInstanceUID, seriesDirectory].join("/");
                const blob = new Blob([arrayBuffer], {type: 'application/dicom'});
                const file = new File([blob], fileName, {type: 'application/dicom'});
                const subDirectoryHandle = await createNestedDirectories(directoryHandle, filePath);
                const fileHandle = await subDirectoryHandle.getFileHandle(fileName, {create: true});
                const writable = await fileHandle.createWritable();
                await writable.write(arrayBuffer);
                await writable.close();
                self.postMessage({message: "done", path: s3_url, localFilePath: filePath});
            } catch (error) {
                console.error("Error when attempting to fetch URL " + s3_url);
                console.error(error);
                self.postMessage({message: "error", path: s3_url, error: error});
            }
        }    
    `;

    let cancel_button = `
        <button type="button" class="cancel-download btn btn-default" text="Cancel remaining downloads">Cancel</button>
    `;
    let close_button = `
        <button type="button" class="close-message-window close-msg-box btn btn-primary" text="Close this window">Close</button>
    `;

    let downloadWorkers = [];
    let downloadWorker = null;
    const s3_urls = [];
    let pending_cancellation = false;

    const workerCodeBlob = new Blob([workerCode], { type: 'application/javascript' });
    let workerObjectURL = null;
    const workerDownloadThreshold = 100;
    const availableWorkers = [];

    function finalizeWorker(worker) {
      worker.terminate();
      downloadWorkers = downloadWorkers.filter(w => w !== worker);
    }

    // Replaces the current floating message contents with a new message, including a new icon if provided
    function statusMessage(message, type, icon, withClose, withCancel) {
        let buttons = [];
        withCancel && buttons.push(cancel_button);
        withClose && buttons.push(close_button);
      base.showFloatingMessage(type, message, true, null, icon, buttons);
    }

    // Updates the current floating message contents and display class
    function progressUpdate(message, type) {
      base.showFloatingMessage(type, message, false);
    }

    function workerOnMessage (event) {
      let thisWorker = event.target;
      if (event.data.message === 'error') {
        statusMessage(`Worker Error: ${JSON.stringify(event)}`, 'error', null, true, false);
      }
      if (event.data.message === 'done') {
        progressUpdate(`Download progress: ${s3_urls.length} remaining...`);
      }
      if (s3_urls.length == 0 || thisWorker.downloadCount > workerDownloadThreshold || pending_cancellation) {
        finalizeWorker(thisWorker);
      } else {
        thisWorker.downloadCount += 1;
        availableWorkers.push(thisWorker);
      }
      triggerWorkerDownloads();
    }

    function allocateWorker() {
      downloadWorker = new Worker(workerObjectURL);
      downloadWorker.onmessage = workerOnMessage;
      downloadWorker.onerror = function(event) {
        let thisWorker = event.target
        console.error('[Main] Error in worker:', event.message || "No message given", event);
        statusMessage(`[Worker] Error in worker: ${event.message}`, 'error', null, true, false);
        finalizeWorker(thisWorker);
      }
      downloadWorkers.downloadCount = 0;
      downloadWorkers.push(downloadWorker);
      return downloadWorker
    }

    let workerLimit = navigator.hardwareConcurrency;
    let directoryHandle = null;

    function triggerWorkerDownloads() {
      if (s3_urls.length == 0 && downloadWorkers.length == 0) {
          // cleanup
        if (workerObjectURL) {
            URL.revokeObjectURL(workerObjectURL);
            workerObjectURL = null;
        }
        let msg = pending_cancellation ? 'Download cancelled.' : `Download complete.`;
        let type = pending_cancellation ? 'warning' : 'info';
        statusMessage(msg, type, null, true, false);
        pending_cancellation = false;
      } else {
          if(!workerObjectURL){
            workerObjectURL = URL.createObjectURL(workerCodeBlob);
          }
        while (s3_urls.length > 0) {
          let targetWorker = null;
          if (availableWorkers.length > 0) {
            targetWorker = availableWorkers.pop();
          } else {
            if (downloadWorkers.length <= workerLimit) {
              targetWorker = allocateWorker();
            } else {
              break // all workers busy and we can't add more
            }
          }
          const s3_url = s3_urls.pop();
          targetWorker.postMessage({ 'url': s3_url['url'], 'metadata': s3_url, 'directoryHandle': directoryHandle });
        }
      }
    }

    async function getAllS3ObjectKeys(bucket, region, prefix) {
      const allKeys = [];
      let isTruncated = true;
      let continuationToken = null;
      while (isTruncated) {
        let url = `https://${bucket}.s3.${region}.amazonaws.com/?list-type=2`;
        if (prefix) {
          url += `&prefix=${encodeURIComponent(prefix)}`;
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

    async function beginDownload() {
      directoryHandle = await window.showDirectoryPicker({
          id: 'idc-downloads',
          startIn: 'downloads',
          mode: 'readwrite',
      });
      if (directoryHandle) {
          triggerWorkerDownloads();
      }
    }

    $('.container-fluid').on('click', '.cancel-download', function(){
        pending_cancellation = true;
        $('.cancel-download').hide();
        $('.close-message-window').show();
        s3_urls.splice(0, s3_urls.length);
    });

    $('.container-fluid').on('click', '.download-all-instances', function(){
        const bucket = $(this).attr('data-bucket');
        const crdc_series_id = $(this).attr('data-series');
        const series_id = $(this).attr('data-series-id');
        const collection_id = $(this).attr('data-collection');
        const study_id = $(this).attr('data-study');
        const modality = $(this).attr('data-modality');
        const patient_id = $(this).attr('data-patient');
        getAllS3ObjectKeys(bucket, "us-east-1", crdc_series_id).then( keys => {
          keys.forEach((key) => {
            if (key !== "") {
                const keys = key.split("/");
                const instance = keys[keys.length-1];
              s3_urls.push({
                  'url': `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`,
                  'study': study_id,
                  'collection': collection_id,
                  'series': series_id,
                  'modality': modality,
                  'instance': instance,
                  'patient': patient_id
              });
            }
          });
          if(s3_urls.length <= 0) {
              statusMessage('Error while parsing instance list!', 'error', null, true, false);
              return;
          }
          beginDownload().then(
              function(){
                  $('.cancel-download').show();
                  $('.close-message-window').hide();
                  statusMessage("Download underway.", 'message', '<i class="fa-solid fa-atom fa-spin"></i>', false, true);
              }
          );
        });
    });
});