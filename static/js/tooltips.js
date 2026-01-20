/**
 *
 * Copyright 2024, Institute for Systems Biology
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
        jquery: 'libs/jquery-3.7.1.min',
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
        'underscore': {exports: '_'}
    }
});

require([
    'jquery',
    'tippy',
    'base', // This must always be loaded
    'jqueryui',
    'bootstrap'

], function ($, tippy, base) {

    let cart_info = function(type) {
        return '<p><span class="cart-info-tip case1">' +
            `<i class="fa-solid fa-cart-shopping shopping-cart "></i></span> <span>All series from this ${type} are in the cart</span></p>`+
            '<p><span class="cart-info-tip case2">' +
            `<i class="fa-solid fa-cart-shopping shopping-cart case2"></i></span> <span>Some series from this ${type} are in the cart</span></p>` +
             '<p><span class="cart-info-tip case3">' +
            `<i class="fa-solid fa-cart-shopping shopping-cart case3"></i></span> <span>No series from this ${type} are in the cart</span></p>`+
            '<p>Note: clicking the cart icons only add or remove series belonging to ' +
            '<b>studies</b> that match the current filter</p>';
    };

    tippy.delegate('#projects_table_head', {
        interactive: true,
        target:'.cart-info',
        allowHTML:true,
        theme:'light',
        placement:'right',
        content: cart_info("collection")
    });

    tippy.delegate('#cases_table_head', {
        interactive: true,
        target:'.cart-info',
        allowHTML:true,
        theme:'light',
        placement:'right',
        content: cart_info("case")
    });

    tippy.delegate('#studies_table_head', {
        interactive: true,
        target:'.cart-info',
        allowHTML:true,
        theme:'light',
        placement:'right',
        content: cart_info("study")
    });

    tippy.delegate('#series_table_head', {
        interactive: true,
        target:'.cart-info',
        allowHTML:true,
        theme:'light',
        placement:'right',
        content: '<p><span class="cart-info-tip case1">' +
            '<i class="fa-solid fa-cart-shopping shopping-cart "></i></span> <span>This series is in the cart</span></p>'+
             '<p><span class="cart-info-tip case3">' +
            '<i class="fa-solid fa-cart-shopping shopping-cart case3"></i></span> <span>This series is not the cart</span></p>'
    });

    tippy('.case-info', {
        interactive: true,
        content: 'The Case ID attribute in the portal corresponds to the DICOM Patient ID attribute'
    });

    tippy('.explainer', {
        interactive: true,
        allowHTML:true,
        content: 'As some attributes have non mutually exclusive values the charts may contain non zero counts for these ' +
            'values even when they are not selected in the left hand panel. ' +
            'See <a href="https://learn.canceridc.dev/portal/data-exploration-and-cohorts/exploring-imaging-data#understanding-counts-in-the-search-results" target="_blank" rel="noopener noreferrer">here</a> for a detailed explanation.'
    });

    tippy('.tooltip_filter_info',{
        content: 'Each chart below reports the number of cases (or patients) for all values within a given attribute, ' +
            'given the currently defined filter set. Once a case is selected, all series for that case, including those ' +
            'that do not meet the search criteria, are included. For example, cases selected based on the presence of CT ' +
            'modality may also contain PET modality, and thus counts for both values will appear in the chart, and the ' +
            'manifest.',
        theme: 'light',
        placement: 'right-end',
        arrow: false
    });

    tippy('.tooltip_chart_info',{
        content: 'Counts shown below are the number of cases (or patients) for each attribute value. Counts for each ' +
            'attribute (e.g. Modality) are unchanged by the values (e.g. PET) selected (checked) for that attribute. ' +
            'They only change based on the values selected for all other attributes.',
        theme: 'light',
        placement: 'right-end',
        arrow: false
    });

    tippy('.filterset_info',{
        content: 'Go ask Bill',
        theme: 'light',
        placement: 'right-end',
        arrow: false
    });

    tippy('.checkbox-none',{
        content: 'Filtering on the \'None\' attribute is not currently supported within derived data.',
        theme: 'light',
        placement: 'top-start',
        arrow: false
    });

    tippy.delegate('.studies-table', {
        content: 'Some or all of the images in this collection are not publicly available.',
        theme: 'dark',
        placement: 'right',
        arrow: false,
        interactive:true,
        target: '.coll-explain',
        maxWidth: 130
    });

    tippy.delegate('.series-table', {
        content: function(reference) {
            if($(reference).hasClass('not-viewable')) {
                return 'No valid viewer is available for this modality.'
            }
            return 'Please open at the study level to view this series.';
        },
        theme: 'dark',
        placement: 'right',
        arrow: false,
        interactive:true,
        target: ['.no-viewer-tooltip', '.not-viewable'],
        maxWidth: 130
    });

    tippy.delegate('.studies-table', {
        content: 'This study cannot be viewed.',
        theme: 'dark',
        placement: 'right',
        arrow: false,
        interactive:true,
        target: ['.no-viewer-tooltip', '.not-viewable'],
        maxWidth: 130
    });

    const copy_tip = {
        content: 'Copied!',
        theme: 'blue',
        placement: 'right',
        arrow: true,
        trigger: 'disabled',
        interactive: true, // This is required for any table tooltip to show at the appropriate spot!
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        maxWidth: 85
    };

    tippy('.bq-string-copy', copy_tip);

    tippy.delegate('.series-table', copy_tip);

    tippy.delegate('.studies-table', copy_tip);

    tippy.delegate('.projects-table', copy_tip);

    const dynamicTipFunc = {
        fn: (instance) => ({
            onShow() {
                instance.setContent(instance.props.dynamicTip(instance.reference));
            }
        })
    };

    const appendToAncestor = function(instance) {
        let appendTo = $(instance.reference).parents('.download-col, .filter-download-menu, .cart-download-menu');
        appendTo.length > 0 && instance.setProps({"appendTo": appendTo[0]});
    };

    // Dynamic tippy instance which will append itself to a table cell instead of the parent element of the tip target,
    // to prevent weird wrapping issues with text
    const dynamicTipFuncDL = {
        fn: (instance) => ({
            onCreate() {
                appendToAncestor(instance);
            },
            onTrigger() {
                appendToAncestor(instance);
            },
            onShow() {
                instance.setContent(instance.props.dynamicTip(instance.reference));
            }
        })
    };

    const chromium_only = "Direct download is only available in Chromium browsers.";
    const disabled_download_tooltip = {
        plugins: [dynamicTipFuncDL],
        dynamicTip: function(ref){
            if($(ref).hasClass('download-size-disabled')) {
                return "This set of images is over 3TB in size. Please use manifest download to obtain these images.";
            }
            return chromium_only;
        },
        content: chromium_only,
        theme: 'dark',
        placement: 'left',
        arrow: false,
        interactive:true,
        target: '.download-all-disabled',
        maxWidth: 200
    };

    const cart_tooltip = {
        dynamicTip: function(ref){
            if($(ref).parentsUntil('tbody').filter('tr').hasClass('extraInFilter') || !($(ref).parentsUntil('tbody').filter('tr').hasClass('someInCart'))) {
                return "add series to cart"
            }
            return "remove series from cart"
        },
        interactive: true,
        allowHTML: true,
        placement: 'right',
        theme: 'dark',
        content: 'add series to cart', // placeholder text
        target: '.shopping-cart-holder',
        plugins: [dynamicTipFunc]
    };

    const manifest_tooltip = {
        dynamicTip: function(ref){
            let table_type = $(ref).parents('table').attr('data-table-type');
            if(table_type === 'series') {
                return 'Download a manifest file for this series to use with a download tool.'
            }
            return `Download a manifest file for all the series in this ${table_type} to use with a download tool.`;
        },
        content: 'Download a manifest file.', // placeholder text
        theme: 'dark',
        placement: 'right',
        arrow: false,
        interactive:true,
        target: '.export-button',
        maxWidth: 200,
        plugins: [dynamicTipFuncDL]
    };

    let disabled_messages = {
        'download-all-disabled': chromium_only,
        'download-size-disabled': "This set of files is over 3TB in size. Please use manifest download to obtain these files.",
        'download-count-disabled': "This set of files contains over 65000 records. Please use manifest download to obtain these files.",
        'download-cart-disabled': "Add items to the cart to enable this feature.",
        'download-cohort-disabled': "Select a filter to enable this feature."
    };
    const download_tooltip = {
        dynamicTip: function(ref){
            if($(ref).hasClass('is-disabled')){
                return disabled_messages[$(ref).attr('data-disabled-type')];
            }
            let download_type = $(ref).attr('data-download-type');
            return `Download all of the files in this ${download_type}.`;
        },
        content: 'Download all files.', // placeholder text
        theme: 'dark',
        placement: 'right',
        arrow: false,
        interactive:true,
        target: '.download-instances',
        maxWidth: 200,
        plugins: [dynamicTipFuncDL]
    };

    const download_col_tooltip = {
        content: 'Download images', // placeholder
        theme: 'dark',
        placement: 'left',
        arrow: false,
        interactive:true,
        target: '.download-col',
        maxWidth: 200
    };

    tippy.delegate('.projects-table', cart_tooltip);

    tippy.delegate('.cases-table', cart_tooltip);

    tippy.delegate('.series-table', download_col_tooltip);

    tippy.delegate('.studies-table', download_col_tooltip);

    tippy.delegate('.series-table', {
        dynamicTip: function(ref){
            if ($(ref).parentsUntil('tbody').filter('tr').hasClass('someInCart')) {
                return "remove from cart"
            }
            return "add to cart"
        },
        interactive: true,
        allowHTML: true,
        placement: 'right',
        content: 'add series to cart', // placeholder text
        target: '.shopping-cart-holder',
        plugins: [dynamicTipFunc]
    });

    tippy.delegate('.studies-table', cart_tooltip);

    tippy.delegate('.cases-table', copy_tip);

    tippy.delegate('#body', {
        content: 'Get the citation list for this cohort.',
        theme: 'dark',
        placement: 'left',
        arrow: false,
        interactive:true,
        target: '.citations-button',
        maxWidth: 200
    });

    tippy.delegate('.studies-table', manifest_tooltip);

    tippy.delegate('.series-table', manifest_tooltip);

    tippy.delegate('.series-table', {
        content: 'Some or all of the images in this collection are not publicly available.',
        theme: 'dark',
        placement: 'right',
        arrow: false,
        interactive:true,
        target: '.coll-explain',
        maxWidth: 130
    });

    tippy.delegate('.series-table', {
        content: function(reference) {
            return $(reference).data('description');
        },
        theme: 'dark',
        placement: 'right',
        arrow: false,
        target: '.description-tip',
        interactive: true, // This is required for any table tooltip to show at the appropriate spot!
        maxWidth: 800
    });

    tippy.delegate('#body', disabled_download_tooltip);
    tippy.delegate('#body', download_tooltip);

    tippy.delegate('#body', {
        content: function(reference) {
            return "Copied!";
        },
        theme: 'blue',
        placement: 'auto',
        arrow: true,
        target: '.copy-this',
        trigger: 'click',
        interactive: true,
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        maxWidth: 85
    });
});
