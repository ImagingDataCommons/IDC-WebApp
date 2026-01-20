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
        session_security: 'session_security/script',
        tooltips: 'tooltips'
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
    'tooltips'

], function (image_search, tables,$, tippy, base) {

    window.selProjects= new Object();
    window.glblcart = new Object();
    window.partitions= new Array();
    window.filtergrp_list=new Array();

    //sesssionStorage.setItem("cartHist",JSON.stringify(window.cartHist));
    window.partitions = new Array();

    window.collection = JSON.parse(document.getElementById('collections').textContent);
    var lst = Object.keys(window.collection).sort();
    window.collectionData = new Array();
    window.programs = JSON.parse(document.getElementById('programs').textContent);
    var ind = 0;

    for (program in window.programs) {
        for (project in window.programs[program]['projects']) {
            let id = project;
            let disp = window.programs[program]['projects'][project]['display'];
            let subjCount = window.programs[program]['projects'][project]['val'];
            let license = window.programs[program]['projects'][project]['license'];
            window.collectionData.push([id, disp, subjCount, subjCount, license]);
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

    $('.container-fluid').on('click', '.collapse-all', function(){
        let targets = $(this).hasClass('search-scope-toggle') ? '.search-scope-item' : '.search-config-item';
        $(targets).collapse('hide');
    });

    $('.container-fluid').on('click', '.open-all', function(){
        let targets = $(this).hasClass('search-scope-toggle') ? '.search-scope-item' : '.search-config-item';
        $(targets).collapse('show');
    });
});
