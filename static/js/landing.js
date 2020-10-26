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
        sapien: 'sapien'
    },
    shim: {
        '@popperjs/core': {
          exports: "@popperjs/core"
        },
        'tippy': {
          exports: 'tippy',
            deps: ['@popperjs/core']
        },
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'sapien': {
            exports: 'Sapien'
        },
        tippy: 'libs/tippy-bundle.umd.min',
        '@popperjs/core': 'libs/popper.min'
    }
});

require([
    'jquery',
    'sapien',
    'jqueryui',
    'bootstrap',
    'assetscore'
    ,'assetsresponsive',
    'base'
], function($, Sapien, jqueryui, bootstrap) {
    A11y.Core();

    $('.img-example').on('click',function(){
        if(!$(this).hasClass('selected')) {
            $('.'+$('.img-example.selected').data('display-target')).hide();
            $('.img-example.selected').toggleClass('selected');
            $(this).toggleClass('selected');
            $('.'+$(this).data('display-target')).show();
        }
    });

    $('#download-manifest').on('click', function() {
        // $('#unallowed-chars-alert').hide();
        // $('#name-too-long-alert-modal').hide();
        //
        // var name = $('#export-manifest-name').val();
        // var unallowed = (name.match(base.blacklist));
        //
        // if(unallowed.length > 0) {
        //     $('.unallowed-chars').text(unallowed.join(", "));
        //     $('#unallowed-chars-alert').show();
        //     e.preventDefault();
        //     return false;
        // }
        //
        // if(name.length > 255) {
        //     $('#name-too-long-alert-modal').show();
        //     e.preventDefault();
        //     return false;
        // }
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

        var url = BASE_URL + '/cohorts/download_manifest/' + '1' + '/';
        // url += ("?cohort_name=" + name);
        url += ("?header_fields=" + JSON.stringify(checked_fields));
        url += ("&columns=" + JSON.stringify(checked_columns));

        location.href = url;

        // var url = BASE_URL + '/cohorts/download_manifest/' + '1' + '/';
        //  $.ajax({
        //     type: 'GET',
        //     url: url,
        //     dataType: 'json',
        //     data: {header_fields: JSON.stringify(checked_fields),
        //         columns: JSON.stringify(checked_columns)},
        //     success: function (data) {
        //         if(data.result) {
        //             var msgs = [];
        //             if(data.result.msg) {
        //                 msgs.push(data.result.msg);
        //             }
        //             if(data.result.note) {
        //                 msgs.push(data.result.note)
        //             }
        //             base.setReloadMsg('info',msgs);
        //         }
        //                         console.log(data);
        //
        //         // window.location.reload(true);
        //     },
        //     error: function (e) {
        //         console.error('Failed to download manifest' + JSON.parse(e.responseText).msg);
        //     }
        // })
    });
});