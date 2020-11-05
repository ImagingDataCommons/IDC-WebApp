/**
 *
 * Copyright 2020, Institute for Systems Biology
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

require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.5.1',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        underscore: 'libs/underscore-min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        base: 'base',
        tippy: 'libs/tippy-bundle.umd.min',
        '@popperjs/core': 'libs/popper.min'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        '@popperjs/core': {
          exports: "@popperjs/core"
        },
        'tippy': {
          exports: 'tippy',
            deps: ['@popperjs/core']
        }
    }
});

require([
    'jquery',
    'jqueryui',
    'base',
    'tippy',
    'bootstrap',
    'assetscore'
    ,'assetsresponsive',
], function($, jqueryui, base, tippy, bootstrap) {
    A11y.Core();

    tippy('.manifest-size-warning',{
        content: 'Your cohort is too large to be downloaded in its entirety, and will be truncated at 65,000 records ' +
        'ordered by PatientID, StudyID, SeriesID, and InstanceID.',
        theme: 'light',
        placement: 'left',
        arrow: false
    });

    var downloadToken = new Date().getTime();

    $('#download-csv').on('click', function(e) {
        download_manifest("csv", $(this), e)
    });

    $('#download-tsv').on('click', function(e) {
        download_manifest("tsv", $(this), e)
    });

    $('#download-json').on('click', function(e) {
        download_manifest("json", $(this), e)
    });

    var download_manifest = function(file_type, clicked_button, e) {
        $('#unallowed-chars-alert').hide();
        $('#name-too-long-alert-modal').hide();

        var name = $('#export-manifest-name').val();
        var unallowed = (name.match(base.blacklist) || []);

        if (name.length == 0) {
            $('#download-csv').prop('title','Please input the name.');
            $('#export-manifest-name')[0].focus();
            e.preventDefault();
            return false;
        }

        if (clicked_button.is('[disabled=disabled]')) {
            e.preventDefault();
            return false;
        }

        if (unallowed.length > 0) {
            $('.unallowed-chars').text(unallowed.join(", "));
            $('#unallowed-chars-alert').show();
            e.preventDefault();
            return false;
        }

        if (name.length > 255) {
            $('#name-too-long-alert-modal').show();
            e.preventDefault();
            return false;
        }

        $('#export-manifest-form').submit();

        $('#download-csv').attr('disabled','disabled');
        $('#download-tsv').attr('disabled','disabled');
        $('#download-json').attr('disabled','disabled');

        $('#download-in-progress').modal('show');

        base.blockResubmit(function() {
            $('#download-csv').removeAttr('disabled');
            $('#download-tsv').removeAttr('disabled');
            $('#download-json').removeAttr('disabled');
            $('#download-in-progress').modal('hide');
        },downloadToken, 'downloadToken');

        var checked_fields = [];
        $('.field-checkbox').each(function()
        {
            var cb = $(this)[0];
            if (cb.checked)
            {
                checked_fields.push(cb.value);
            }
        });

        var checked_columns = [];
        $('.column-checkbox').each(function()
        {
           var cb = $(this)[0];
           if (cb.checked)
           {
               checked_columns.push(cb.value);
           }
        });

        var url = BASE_URL + '/cohorts/download_manifest/' + cohort_id + '/';
        url += ("?file_type=" + file_type);
        url += ("&file_name=" + name);
        url += ("&header_fields=" + JSON.stringify(checked_fields));
        url += ("&columns=" + JSON.stringify(checked_columns));
        url += ("&downloadToken=" + downloadToken);

        location.href = url;
    };

    $('.column-checkbox').change(function() {
        update_download_manifest_buttons();
    });

    $("#export-manifest-name").change(function(){
        update_download_manifest_buttons();
    });

    var update_download_manifest_buttons = function(){
        var num_selected_column =$('.column-checkbox:checked').length;
        var input_cohort_name_len = $('#export-manifest-name').val().length;

        if (input_cohort_name_len == 0 || num_selected_column == 0) {
            $('#download-csv').attr('disabled', 'disabled');
            $('#download-tsv').attr('disabled', 'disabled');
            $('#download-json').attr('disabled', 'disabled');
        }
        else
        {
            $('#download-csv').removeAttr('disabled');
            $('#download-tsv').removeAttr('disabled');
            $('#download-json').removeAttr('disabled');
        }

        if (num_selected_column == 0) {
            $('#no-column-alert-modal').show();
        }
        else
        {
            $('#no-column-alert-modal').hide();
        }
    };

    update_download_manifest_buttons();
});