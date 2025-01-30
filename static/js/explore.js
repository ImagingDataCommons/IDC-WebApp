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
        tablesorter: 'libs/jquery.tablesorter.min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        jquerydt: 'libs/jquery.dataTables.min',
        base: 'base',
        image_search: 'image_search',
        tippy: 'libs/tippy-bundle.umd.min',
        '@popperjs/core': 'libs/popper.min',
        session_security: 'session_security/script'
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
        'jquerydt': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'tablesorter': ['jquery'],
        'underscore': {exports: '_'},
        'session_security': ['jquery'],
        'image_search': ['jquery', 'underscore', 'base', 'jquerydt', 'jqueryui', 'bootstrap']
    }
});

require([
    'image_search',
    'tables',
    'jquery',
    'tippy',
    'base', // This must always be loaded
    'jqueryui',
    'jquerydt',
    'bootstrap',
    'tablesorter',

], function (image_search, tables,$, tippy, base) {

    window.selProjects= new Object();
    window.glblcart = new Object();
    window.partitions= new Array();
    window.filtergrp_list=new Array();

    //sesssionStorage.setItem("cartHist",JSON.stringify(window.cartHist));
    window.partitions = new Array();

    window.studymp=new Object();
    window.projstudymp = new Object();
    window.casestudymp = new Object();
    window.collection = JSON.parse(document.getElementById('collections').textContent);
    var lst = Object.keys(window.collection).sort();
    window.collectionData = new Array();
    window.programs = JSON.parse(document.getElementById('programs').textContent);
    var ind = 0;

    for (program in window.programs) {
        for (project in window.programs[program]['projects']) {
            var col = project;
            var disp = window.programs[program]['projects'][project]['display'];
            var val = window.programs[program]['projects'][project]['val'];
            window.collectionData.push([col, disp, val, val]);
            window.selProjects[project]=new Object();
        }
    }

    window.casesTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
    window.studyTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
    window.seriesTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};


    var saving_cohort = false;


    $('#external-web-warning').on('show.bs.modal', function(){
        $('#collection-modal').hide();
    })

    $('#save-cohort-modal').on('show.bs.modal', function() {

        var modality_join = $('.join_val').filter(':checked').prop('value');
        var filters = {};
        $('.search-scope .search-checkbox-list input:checked , ' +
            '#search_orig_set .search-checkbox-list input:checked, ' +
            '#search_related_set .search-checkbox-list input:checked, ' +
            '#search_derived_set .search-checkbox-list input:checked').each(function(){

            if (!$(this).hasClass('hide-zeros')) {
                let modal_filter_block = '';
                 if ($(this).parents('.search-scope').length > 0) {
                    modal_filter_block = '#selected-filters-prog-set';
                } else if ($(this).parents('#search_orig_set').length > 0) {
                    modal_filter_block = '#selected-filters-orig-set';
                } else if ($(this).parents('#search_related_set').length > 0) {
                    modal_filter_block = '#selected-filters-rel-set';
                } else if ($(this).parents('#search_derived_set').length > 0) {
                    modal_filter_block = '#selected-filters-der-set';
                }

                if (!($(this).data('filter-attr-id')===1)) {
                    if ($(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).length <= 0) {
                        $(`${modal_filter_block}`).append('<p class="cohort-filter-display ' + $(this).data('filter-attr-id')
                            + '"><span class="attr">' + $(this).data('filter-display-attr') + ':</span></p>');
                    }


                    if ( ($(this).data('filter-display-attr')=='Modality') && (filters[$(this).data('filter-attr-id')])  ){
                          $(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).append(
                         '<span class="val">' + modality_join + '</span>'
                        );
                     }


                    $(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).append(
                         '<span class="val">' + $(this).data('filter-display-val') + '</span>'
                    );
                    if (!filters[$(this).data('filter-attr-id')]) {
                        if ($(this).data('filter-display-attr')=='Modality'){
                            filters[$(this).data('filter-attr-id')] = {};
                            filters[$(this).data('filter-attr-id')]['values']=[]
                            filters[$(this).data('filter-attr-id')]['op']=modality_join
                        }
                        else {
                            filters[$(this).data('filter-attr-id')] = [];
                        }
                    }
                    if ($(this).data('filter-display-attr')=='Modality'){
                        filters[$(this).data('filter-attr-id')]['values'].push($(this).prop('value'));
                    }
                    else {
                        filters[$(this).data('filter-attr-id')].push($(this).prop('value'));
                    }

                }
            }
        });

        $('.ui-slider').each(function() {
            let modal_filter_block = '';
            if ($(this).parents('#program_set').length > 0) {
                modal_filter_block = '#selected-filters-prog-set';
            } else if ($(this).parents('#search_orig_set').length > 0) {
                modal_filter_block = '#selected-filters-orig-set';
            } else if ($(this).parents('#search_related_set').length > 0) {
                modal_filter_block = '#selected-filters-rel-set';
            } else if ($(this).parents('#search_derived_set').length > 0) {
                modal_filter_block = '#selected-filters-der-set';
            }

            var $this = $(this);
            var left_val = $this.slider("values", 0);
            var right_val = $this.slider("values", 1);
            var min = $this.slider("option", "min");
            var max = $this.slider("option", "max");

            if ($this.parent().hasClass('isActive') &&  ($this.parent().hasClass('wNone') && $this.siblings().find('.noneBut').find('input:checked').length>0) ) {
                if ($(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).length <= 0) {
                    $(`${modal_filter_block}`).append('<p class="cohort-filter-display ' + $(this).data('filter-attr-id')
                        + '"><span class="attr">' + $(this).data('filter-display-attr') + ':</span></p>');
                }
                $(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).append(
                    '<span class="val">None,' + left_val + " to " + right_val + '</span>'
                );
                filters[$(this).data('filter-attr-id')] = ["None",[left_val, right_val]];

            } else if ($this.parent().hasClass('isActive')) {
                if ($(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).length <= 0) {
                    $(`${modal_filter_block}`).append('<p class="cohort-filter-display ' + $(this).data('filter-attr-id')
                        + '"><span class="attr">' + $(this).data('filter-display-attr') + ':</span></p>');
                }
                $(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).append(
                    '<span class="val">' + left_val + " to " + right_val + '</span>'
                );
                filters[$this.data('filter-attr-id')] = [left_val, right_val];

            } else if ($this.parent().hasClass('wNone') && $this.siblings().find('.noneBut').find('input:checked').length>0){
                if ($(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).length <= 0) {
                    $(`${modal_filter_block}`).append('<p class="cohort-filter-display ' + $(this).data('filter-attr-id')
                        + '"><span class="attr">' + $(this).data('filter-display-attr') + ':</span></p>');
                }
                $(`${modal_filter_block} p.` + $(this).data('filter-attr-id')).append(
                    '<span class="val">None</span>'
                );
                filters[$this.data('filter-attr-id')] = ["None"];
            }
        });

        $('#save-cohort-modal .selected-filters').each(function(){
            if($(this).find('span').length <= 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
        $('input[name="selected-filters"]').prop('value', JSON.stringify(filters));
    });

    $('#save-cohort-modal').on('hide.bs.modal', function(e) {
        if(saving_cohort) {
            e.preventDefault();
            return false;
        }
        $('#save-cohort-modal .selected-filters p').remove();
        $('input[name="selected-filters"]').prop('value', '');
        $('#saving-cohort').css('display','none');
        $(this).find('input[type="submit"]').prop("disabled","");
    });

    $('#save-cohort-form, #apply-edits-form').on('submit', function(e) {

        $('#unallowed-chars-alert').hide();
        $('#name-too-long-alert-modal').hide();

        var name = $('#save-cohort-name').val() || $('#edit-cohort-name').val();
        var desc = $('#save-cohort-desc').val() || $('#edit-cohort-desc').val();

        var unallowed = (name.match(base.blacklist) || []).concat(desc ? desc.match(base.blacklist) || [] : []);

        if(unallowed.length > 0) {
            $('.unallowed-chars').text(unallowed.join(", "));
            $('#unallowed-chars-alert').show();
            e.preventDefault();
            return false;
        }

        if(name.length > 255) {
            $('#name-too-long-alert-modal').show();
            e.preventDefault();
            return false;
        }
        $(this).find('input[type="submit"]').attr("disabled","disabled");
        $('#saving-cohort').css('display','inline-block');
        saving_cohort = true;
        $('#save-cohort-modal').prop("saving", "saving");
    });

    $('#collection_modal_button').on("click", function(){
        $('#collection-modal').removeClass('in');
        $('#collection-modal').css("display","none");
    });

    var cart_info = function(type) {
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

    tippy('.bq-string-copy',{
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
    });

    tippy.delegate('.series-table', {
        content: 'Copied!',
        theme: 'blue',
        placement: 'right',
        arrow: true,
        interactive: true, // This is required for any table tooltip to show at the appropriate spot!
        target: '.copy-this',
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        trigger: "click",
        maxWidth: 85
    });

    tippy.delegate('.studies-table', {
        content: 'Copied!',
        theme: 'blue',
        placement: 'right',
        arrow: true,
        interactive: true, // This is required for any table tooltip to show at the appropriate spot!
        target: '.copy-this',
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        trigger: "click",
        maxWidth: 85
    });

    tippy.delegate('.projects-table', {
        content: 'Copied!',
        theme: 'blue',
        placement: 'right',
        arrow: true,
        interactive: true, // This is required for any table tooltip to show at the appropriate spot!
        target: '.copy-this',
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        trigger: "click",
        maxWidth: 85
    });

    const dynamicCartTip = {
        fn: (instance) => ({
            onShow() {
                instance.setContent(instance.props.dynamicTip(instance.reference));
            }
        })
    };

    tippy.delegate('.projects-table', {
        dynamicTip: function(ref){
            if($(ref).parent().hasClass('willAdd')) {
                return "add series to cart"
            }
            return "remove series from cart"
        },
        interactive: true,
        allowHTML: true,
        placement: 'right',
        content: 'add series to cart', // placeholder text
        target: '.shopping-cart-holder',
        plugins: [dynamicCartTip]
    });

    tippy.delegate('.cases-table', {
        dynamicTip: function(ref){
            if($(ref).parent().hasClass('willAdd')) {
                return "add series to cart"
            }
            return "remove series from cart"
        },
        interactive: true,
        allowHTML: true,
        placement: 'right',
        content: 'add series to cart', // placeholder text
        target: '.shopping-cart-holder',
        plugins: [dynamicCartTip]
    });

    tippy.delegate('.series-table', {
        dynamicTip: function(ref){
            if($(ref).parent().hasClass('willAdd')) {
                return "add series to cart"
            }
            return "remove series from cart"
        },
        interactive: true,
        allowHTML: true,
        placement: 'right',
        content: 'add series to cart', // placeholder text
        target: '.shopping-cart-holder',
        plugins: [dynamicCartTip]
    });

    tippy.delegate('.studies-table', {
        dynamicTip: function(ref){
            if($(ref).parent().hasClass('willAdd')) {
                return "add series to cart"
            }
            return "remove series from cart"
        },
        interactive: true,
        allowHTML: true,
        placement: 'right',
        content: 'add series to cart', // placeholder text
        target: '.shopping-cart-holder',
        plugins: [dynamicCartTip]
    });

    tippy.delegate('.cases-table', {
        content: 'Copied!',
        theme: 'blue',
        placement: 'right',
        arrow: true,
        interactive: true, // This is required for any table tooltip to show at the appropriate spot!
        target: '.copy-this',
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        trigger: "click",
        maxWidth: 85
    });

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

    tippy.delegate('#body', {
        content: function(reference) {
            return "Copied!";
        },
        theme: 'blue',
        placement: 'auto',
        arrow: true,
        target: '.copy-this',
        trigger: 'click',
        onShow(instance) {
            setTimeout(function() {
                instance.hide();
            }, 1000);
        },
        maxWidth: 85
    });

    $('.download-link').on('click', function(){
        $('#download-images').modal("hide");
    });
});
