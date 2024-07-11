/**
 *
 * Copyright 2021, Institute for Systems Biology
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
        base: 'base',
        underscore: 'libs/underscore-min',
        tablesorter: 'libs/jquery.tablesorter.min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        jquerydt: 'libs/jquery.dataTables.min',
        session_security: 'session_security/script',
        tables: 'tables',
        filterutils: 'filterutils',
        plotutils: 'plotutils',
        sliderutils: 'sliderutils',
        tippy: 'libs/tippy-bundle.umd.min',
         '@popperjs/core': 'libs/popper.min'


    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'jquerydt': ['jquery'],
        'tablesorter': ['jquery'],
        'underscore': {exports: '_'},
        'session_security': ['jquery'],
        'filterutils': ['jquery'],
        'plotutils': ['jquery'],
        'sliderutils': ['jquery'],
        'tables':['jquery'],
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
    'plotutils',
    'filterutils',
    'sliderutils',
    'tables',
    'tippy',
    'jquery',
    'underscore',
    'base', // This must ALWAYS be loaded!
    'jquerydt',
    'jqueryui',
    'bootstrap'

], function(plotutils,filterutils,sliderutils, tables, tippy,$, _, base) {


    const FLOAT_SLIDERS = sliderutils.FLOAT_SLIDERS;

    $('.manifest-size-warning').hide();

    window.filterObj = {};
    window.projIdSel = [];
    window.studyIdSel = [];
    //window.tcgaColls = ["tcga_blca", "tcga_brca", "tcga_cesc", "tcga_coad", "tcga_esca", "tcga_gbm", "tcga_hnsc", "tcga_kich", "tcga_kirc", "tcga_kirp", "tcga_lgg", "tcga_lihc", "tcga_luad", "tcga_lusc", "tcga_ov", "tcga_prad", "tcga_read", "tcga_sarc", "tcga_stad", "tcga_thca", "tcga_ucec"];
    window.projSets = new Object();
    window.projSets['tcga']=["tcga_blca", "tcga_brca", "tcga_cesc", "tcga_coad", "tcga_esca", "tcga_gbm", "tcga_hnsc", "tcga_kich", "tcga_kirc", "tcga_kirp", "tcga_lgg", "tcga_lihc", "tcga_luad", "tcga_lusc", "tcga_ov", "tcga_prad", "tcga_read", "tcga_sarc", "tcga_stad", "tcga_thca", "tcga_ucec"];
    window.projSets['rider']=["rider_lung_ct", "rider_phantom_pet_ct","rider_breast_mri", "rider_neuro_mri","rider_phantom_mri", "rider_lung_pet_ct"];
    window.projSets['qin'] = ["qin_headneck","qin_lung_ct","qin_pet_phantom","qin_breast_dce_mri"];
    var first_filter_load = true;





    window.hidePanel=function(){
        $('#lh_panel').hide();
        $('#show_lh').show();
        $('#show_lh').removeClass('hidden');
        $('#rh_panel').removeClass('col-lg-9');
        $('#rh_panel').removeClass('col-md-9');
        $('#rh_panel').addClass('col-lg-12');
        $('#rh_panel').addClass('col-md-12');
    };

    window.showPanel=function(){
        $('#lh_panel').show();
        $('#show_lh').hide();
        $('#rh_panel').removeClass('col-lg-12');
        $('#rh_panel').removeClass('col-md-12');
        $('#rh_panel').addClass('col-lg-9');
        $('#rh_panel').addClass('col-md-9');
    };



    window.updateFacetsData = function (newFilt) {

        var url = '/explore/'
        var parsedFiltObj = filterutils.parseFilterObj();
        url = encodeURI('/explore/')

        ndic = {
            'totals': JSON.stringify(["PatientID", "StudyInstanceUID", "SeriesInstanceUID"]),
            'counts_only': 'False',
            'is_json': 'True',
            'is_dicofdic': 'True',
            'data_source_type': ($("#data_source_type option:selected").val() || 'S'),
            'filters':JSON.stringify(parsedFiltObj),
            'disk_size': 'True'
        }
        var csrftoken = $.getCookie('csrftoken');
        let deferred = $.Deferred();
        $.ajax({
            url: url,
            data: ndic,
            dataType: 'json',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
            success: function (data) {
                try {

                     let curInd = window.cartHist.length-1;
                    if (cartHist[curInd].selections.length>0){
                        //updateGlobalPartitions(window.cartHist[curInd]);
                        let cartSel = new Object();
                        cartSel['filter']= parsedFiltObj;
                        cartSel['selections']= new Array();
                        cartSel['partitions']= new Array();
                        window.cartHist.push(cartSel);
       }
                    else{
                        window.cartHist[curInd]['filter'] = parsedFiltObj;
                    }
                    window.cartDetails = cartDetails+'Changed filter definition to '+JSON.stringify(parsedFiltObj)+'\n\n'
                    window.cartStep++;

                    let file_parts_count = (is_cohort ? cohort_file_parts_count : data.totals.file_parts_count);
                    let display_file_parts_count = (is_cohort ? cohort_display_file_parts_count : data.totals.display_file_parts_count);
                    let isFiltered = Boolean($('#search_def p').length > 0);


                    $('#search_def_stats').attr('filter-series-count',data.totals.SeriesInstanceUID);
                    if(data.totals.SeriesInstanceUID > 65000) {
                        $('#s5cmd-max-exceeded').show();
                        $('#download-s5cmd').attr('disabled','disabled');
                        $('#s5cmd-button-wrapper').addClass('manifest-disabled');
                    } else {
                        $('#s5cmd-max-exceeded').hide();
                        $('#s5cmd-button-wrapper').removeClass('manifest-disabled');
                        $('#download-s5cmd').removeAttr('disabled');
                    }
                    if (file_parts_count > display_file_parts_count) {
                        $('#file-export-option').prop('title', 'Your cohort exceeds the maximum for download.');
                        $('#file-manifest-max-exceeded').show();
                        $('#file-export-option input').prop('disabled', 'disabled');
                        $('#file-export-option input').prop('checked', false);
                        $('#file-manifest').hide();
                        $('#file-part-select-box select').attr('disabled','disabled');
                        $('.file-manifest-button-wrapper a').attr('disabled','disabled');
                        $('.file-manifest-button-wrapper').addClass('manifest-disabled');
                    } else {
                        $('#file-manifest-max-exceeded').hide();
                        $('#file-manifest').show();
                        $('#file-part-select-box select').removeAttr('disabled');
                        $('.file-manifest-button-wrapper a').removeAttr('disabled');
                        $('.file-manifest-button-wrapper').removeClass('manifest-disabled');
                        var select_box_div = $('#file-part-select-box');
                        var select_box = select_box_div.find('select');
                        if (file_parts_count > 1) {
                            select_box_div.show();
                            for (let i = 0; i < display_file_parts_count; ++i) {
                                select_box.append($('<option/>', {
                                    value: i,
                                    text: "File Part " + (i + 1)
                                }));
                            }
                        } else {
                            select_box_div.hide();
                        }
                    }
                    if (('filtered_counts' in data) && ('origin_set' in data['filtered_counts']) &&
                        ('access' in data['filtered_counts']['origin_set']['All']['attributes']) &&
                        ('Limited' in data['filtered_counts']['origin_set']['All']['attributes']['access']) &&
                        (data['filtered_counts']['origin_set']['All']['attributes']['access']['Limited']['count']>0) ){
                        $('#search_def_access').removeClass('notDisp');
                        $('.access_warn').removeClass('notDisp');
                    }
                    else {
                        $('#search_def_access').addClass('notDisp');
                        $('.access_warn').addClass('notDisp');
                    }
                    if(is_cohort || (isFiltered && data.total > 0)) {
                        //$('#search_def_stats').removeClass('notDisp');
                        var content = data.totals.PatientID.toString() + " Cases, " +
                            data.totals.StudyInstanceUID.toString() + " Studies, and " +
                            data.totals.SeriesInstanceUID.toString() + " Series in this cohort. " +
                            "Size on disk: " + data.totals.disk_size;
                        $('#search_def_stats').html(content);

                           tippy('.cohort-summary', {
                           interactive: true,
                           allowHTML:true,
                          content: content
                        });

                    } else if(isFiltered && data.total <= 0) {
                        //$('#search_def_stats').removeClass('notDisp');
                        $('#search_def_stats').html('<span style="color:red">There are no cases matching the selected set of filters</span>');
                    } else {
                        $('#search_def_stats').addClass('notDisp');
                    }
                    if (is_cohort) {
                        ((file_parts_count > display_file_parts_count) && !user_is_social)  && $('#need-social-account').show();
                    } else {
                        data.total > 0 && $('#save-cohort-btn').removeAttr('disabled');
                        if (user_is_auth) {
                            $('#save-cohort-btn').prop('title', data.total > 0 ? 'Please select at least one filter.' : 'There are no cases in this cohort.');
                        } else {
                            $('#save-cohort-btn').prop('title', 'Log in to save.');
                        }
                    }


                    filterutils.updateCollectionTotals('Program', data.programs);
                    dicofdic = {'unfilt': data.origin_set.All.attributes, 'filt': ''}
                    isFiltered = Boolean($('#search_def p').length > 0);
                    if (isFiltered) {
                        dicofdic['filt'] = data.filtered_counts.origin_set.All.attributes;
                    } else {
                        dicofdic['filt'] = data.origin_set.All.attributes;
                    }
                    filterutils.updateFilterSelections('access_set', dicofdic);
                    filterutils.updateFilterSelections('analysis_set', dicofdic);
                    filterutils.updateFilterSelections('search_orig_set', dicofdic);

                    var derivedAttrs = Array.from($('#search_derived_set').children('.list-group').children('.list-group-item').children('.list-group-item__body').map(function () {
                        return this.id;
                    }));

                    if (data.hasOwnProperty('derived_set')) {
                        $('#search_derived_set').removeClass('disabled');
                        for (facetSet in data.derived_set) {
                            if ('attributes' in data.derived_set[facetSet]) {
                                dicofdic = {'unfilt': data.derived_set[facetSet].attributes, 'filt': ''}
                                if (isFiltered && data.filtered_counts.hasOwnProperty('derived_set')
                                    && data.filtered_counts.derived_set.hasOwnProperty(facetSet)
                                    && data.filtered_counts.derived_set[facetSet].hasOwnProperty('attributes')
                                ) {
                                    dicofdic['filt'] = data.filtered_counts.derived_set[facetSet].attributes;
                                } else if (isFiltered) {
                                    dicofdic['filt'] = {};
                                } else {
                                    dicofdic['filt'] = data.derived_set[facetSet].attributes;
                                }
                                filterutils.updateFilterSelections(data.derived_set[facetSet].name, dicofdic);
                                var derivedAttrIndex = derivedAttrs.indexOf(data.derived_set[facetSet].name);
                                if (derivedAttrIndex > -1) {
                                    derivedAttrs.splice(derivedAttrIndex, 1);
                                }
                            }
                        }

                    } else {
                        $('#search_derived_set').addClass('disabled');
                    }


                    for (var i = 0; i < derivedAttrs.length; i++) {
                        filterutils.updateFilterSelections(derivedAttrs[i], {});
                    }
                    if (data.hasOwnProperty('related_set')) {
                        $('#search_related_set').removeClass('disabled');
                        dicofdic = {'unfilt': data.related_set.All.attributes, 'filt': ''}
                        if (isFiltered) {
                            dicofdic['filt'] = data.filtered_counts.related_set.All.attributes;
                        } else {
                            dicofdic['filt'] = data.related_set.All.attributes;
                        }
                        filterutils.updateFilterSelections('search_related_set', dicofdic);
                    } else {
                        $('#search_related_set').addClass('disabled');
                        filterutils.updateFilterSelections('search_related_set', {});
                    }

                    var collFilt = new Array();
                    if ('collection_id' in parsedFiltObj) {
                        collFilt = parsedFiltObj['collection_id'];
                        var ind = 0;
                    }
                    //updateTablesAfterFilter(collFilt, data.origin_set.All.attributes.collection_id, data.stats);



                }

                catch(err){
                    console.log('error processing data');
                    alert("There was an error processing the server data. Please alert the systems administrator")
                }

                finally {
                    deferred.resolve([collFilt, data.origin_set.All.attributes.collection_id, data.stats, data.totals]);
                }
            },
            error: function(data){
                //alert("There was an error fetching server data. Please alert the systems administrator")
                console.log('error loading data');
            }
        });
        return deferred.promise();
    };


    window.resort = function(filterCat){
        updateFilters(filterCat,{},false, false);
    }

    window.resortColl = function() {
       updateFilters('program_set',{},false, false);
       for (program in window.programs) {
           if (Object.keys(window.programs[program].projects).length > 1) {
               updateFilters(program,{},false, false);
           }
       }
    }


    window.hideAtt = function(hideElem){
        let filtSet = ["search_orig_set","segmentation","quantitative","qualitative","tcga_clinical"];
        filterutils.setAllFilterElements(hideElem.checked, filtSet);
        addSliders('search_orig_set', false, hideElem.checked,'');
        addSliders('quantitative', false, hideElem.checked,'quantitative.');
        addSliders('tcga_clinical',false, hideElem.checked,'tcga_clinical.');
    }


    window.displayInfo = function(targ) {

        let collection_id=$(targ).attr('value');
        let collectionDisp=$(targ).data('filterDisplayVal')

        let pos =$(targ).parent().find('.collection_info, .analysis_info').offset();
        let info_icon = $(targ).parent().find('.collection_info, .analysis_info');
        let tooltip='';
        if ($(info_icon).hasClass('collection_info')){
            tooltip = collection_tooltips[collection_id];
        }
        else {
            tooltip = analysis_results_tooltips[collection_id];
        }

        $('#collection-modal').find('#collecton-modal-title').text(collectionDisp);
        $('#collection-modal').find('.modal-body').html(tooltip);

        $('#collection-modal').addClass('fade');
        $('#collection-modal').addClass('in');
        $('#collection-modal').css("display","block");
        var width=$('#collection-modal').find('.modal-content').outerWidth();
        var height =$('#collection-modal').find('.modal-content').outerHeight();
        $('#collection-modal').height(height);
            $('#collection-modal').width(width);

        $('#collection-modal').css({position:"absolute", top: Math.max((pos.top-height),0), left: pos.left })
    }




    var filterItemBindings = function (filterId) {

        $('#' + filterId).find('.join_val').on('click', function () {
            var attribute = $(this).closest('.list-group-item__body, .list-group-sub-item__body','.colections-list')[0].id;
            if (filterObj.hasOwnProperty(attribute) && (window.filterObj[attribute]['values'].length>1)){
                filterutils.mkFiltText();
                filterObj[attribute]['op']=$(this).attr('value');
                updateFacetsData(true);
            }
        });

        $('#' + filterId).find('.collection_info, .analysis_info').on("mouseenter", function(e){
            $(e.target).addClass('fa-lg');
         });

       $('#' + filterId).find('.collection_info, .analysis_info').on("mouseleave", function(e){
           $(e.target).removeClass('fa-lg');
       });

        $('#' + filterId).find('input:checkbox').not('#hide-zeros').on('click', function (e) {
            var targ=e.target;

            if ($(e.target).parent().find('.collection_info.fa-lg, .analysis_info.fa-lg').length>0){
                $(targ).prop("checked",!$(targ).prop("checked"));
                window.displayInfo(targ);
            }
            else{
              handleFilterSelectionUpdate(this, true, true);
            }

        });

        $('#' + filterId).find('.show-more').on('click', function () {
            $(this).parent().parent().children('.less-checks').show();
            $(this).parent().parent().children('.less-checks').removeClass('notDisp');
            $(this).parent().parent().children('.more-checks').addClass('notDisp');

            $(this).parent().hide();
            var extras = $(this).closest('.list-group-item__body, .collection-list, .list-group-sub-item__body').children('.search-checkbox-list').children('.extra-values')

            if ( ($('#'+filterId).closest('.search-configuration').find('#hide-zeros').length>0)  && ($('#'+filterId).closest('.search-configuration').find('#hide-zeros').prop('checked'))){
                extras=extras.not('.zeroed');
            }
            extras.removeClass('notDisp');
        });

        $('#' + filterId).find('.show-less').on('click', function () {
            $(this).parent().parent().children('.more-checks').show();
            $(this).parent().parent().children('.more-checks').removeClass('notDisp');
            $(this).parent().parent().children('.less-checks').addClass('notDisp');

            $(this).parent().hide();
            $(this).closest('.list-group-item__body, .collection-list, .list-group-sub-item__body').children('.search-checkbox-list').children('.extra-values').addClass('notDisp');
        });

        $('#' + filterId).find('.check-all').on('click', function () {
            if (!is_cohort) {
                filterutils.checkUncheckAll(this, true, true);

            }
        });

        $('#' + filterId).find('.uncheck-all').on('click', function () {
          if (!is_cohort){
              filterutils.checkUncheckAll(this, false, false);

          }
        });
    };










    const save_anonymous_selection_data = function() {
        let groups = [];

        // Get all checked filters
        let filters = [];

        // For collection list
        $('.collection-list').each(function() {
            let $group = $(this);
            let checkboxes = $group.find("input:checked").not(".hide-zeros").not(".sort_val");
            if (checkboxes.length > 0) {
                let values = [];
                let my_id = "";
                checkboxes.each(function() {
                    let $checkbox = $(this);
                    let my_value = $checkbox[0].value;
                    my_id = $checkbox.data('filter-attr-id');
                    values.push(my_value);
                });
                filters.push({
                    'id': my_id,
                    'values': values,
                });
            }
        });

        // For other list item groups
        $('.list-group-item__body').each(function() {
            let $group = $(this);
            let my_id = $group.data('filter-attr-id');
            if (my_id != null)
            {
                let checkboxes = $group.find("input:checked").not(".hide-zeros").not(".sort_val");
                if (checkboxes.length > 0)
                {
                    let values = [];
                    checkboxes.each(function() {
                        let $checkbox = $(this);
                        let my_value = $checkbox[0].value;
                        values.push(my_value);
                    });
                    filters.push({
                        'id': my_id,
                        'values': values,
                    });
                }
            }
        });

        groups.push({'filters': filters});
        var filterStr = JSON.stringify(groups);
        sessionStorage.setItem('anonymous_filters', filterStr);

        // Get all sliders with not default value
        var sliders = [];
        $('.ui-slider').each(function() {
            let $this = $(this);
            let slider_id = $this[0].id;
            let left_val = $this.slider("values", 0);
            let right_val = $this.slider("values", 1);
            let min = $this.slider("option", "min");
            let max = $this.slider("option", "max");
            if (left_val !== min || right_val !== max) {
                sliders.push({
                   'id': slider_id,
                    'left_val': left_val,
                    'right_val': right_val,
                });
            }
        });
        let sliderStr = JSON.stringify(sliders);
        sessionStorage.setItem('anonymous_sliders', sliderStr);
    };


    $('#save-cohort-btn').on('click', function() {
        if (!user_is_auth) {
            save_anonymous_selection_data();
            location.href=$(this).data('uri');
        }
    });

    $('#sign-in-dropdown').on('click', function() {
        save_anonymous_selection_data();
    });

    cohort_loaded = false;


    $('.fa-cog').on("click",function(){
         let srt = $(this).parent().parent().parent().find('.cntr')
         if (srt.hasClass('notDisp')) {
             srt.removeClass('notDisp');
         } else {
             srt.addClass('notDisp');
         }
         $(this).parent().parent().parent().find('.text-filter, .collection-text-filter').addClass('notDisp');
     });

    $('.fa-search').on("click",function(){
         //alert('hi');
         srch=$(this).parent().parent().parent().find('.text-filter, .collection-text-filter, .analysis-text-filter');

         if (srch.hasClass('notDisp')) {
             srch.removeClass('notDisp');
             srch[0].focus();
         } else {
             srch.addClass('notDisp');
         }
         $(this).parent().parent().parent().find('.cntr').addClass('notDisp');
    });

    const myObserver = new ResizeObserver(entries => {
         entries.forEach(entry => {
             htr = $('.vert').height();
             htsrch = $('.search-scope').height();
             ht = Math.max(2000,htr-htsrch+100);
             $('.search-con').css('max-height',ht+'px');
       });
     });
    myObserver.observe($('#rh_panel')[0]);
    myObserver.observe($('.search-scope')[0]);

    $(document).ajaxStart(function(){
        $('.spinner').show();
    });

    $(document).ajaxStop(function(){
        $('.spinner').hide();
    });


    updateViaHistory = function(){
        let history = JSON.parse(document.getElementById('history').textContent);
        if (history.hasOwnProperty('hz') && history['hz']){
            for (let ckey in history['hz']){
                if(history['hz'].hasOwnProperty(ckey)) {
                    if (history['hz'][ckey]) {
                        $('#'+ckey).find('.hide-zeros').click();
                    }
                }
            }
        }

        if (history.hasOwnProperty('sorter') && history['sorter']){
            for (let ckey in history['sorter']){
                if(history['sorter'].hasOwnProperty(ckey)) {
                    $('#'+ckey).find(':input').each(function(){
                        if ($(this).val() == history['sorter'][ckey]) {
                            $(this).click();
                        }
                    });
                }
            }
        }
    }


    window.changePage = function(wrapper){
        var elem=$('#'+wrapper);
        var valStr = elem.find('.dataTables_controls').find('.goto-page-number').val();
        try {
            var val =parseInt(valStr);
            if (Number.isInteger(val) && (val>0) ) {
                elem.find('table').DataTable().page(val-1).draw(false);
            }
        }
        catch(err){
           console.log(err);
        }

    }


    initSort = function(sortVal){
        var sortdivs=$('body').find('.sorter')
        for (div in sortdivs){
            $(div).find(":input[value='" + sortVal + "']").click();
        }
    }

    updatecartedits = function(){

        if (("cartedits" in sessionStorage) && (sessionStorage.getItem("cartedits") == "true")) {

            window.cartHist = JSON.parse(sessionStorage.getItem("cartHist"));
            var edits = window.cartHist[window.cartHist.length - 1]['selections'];

            var filt = Object();
            filt['StudyInstanceUID'] = new Array();
            var studymp = {};
            for (var i = 0; i < edits.length; i++) {
                var sel = edits[i]['sel'];
                var studyid = sel[2];
                filt['StudyInstanceUID'].push(studyid);
                var seriesid = sel[3];
                if (!(studyid in studymp)) {
                    studymp[studyid] = []
                }
                studymp[studyid].push(seriesid)

            }
            if ("studymp" in sessionStorage) {
                var studymp = JSON.parse(sessionStorage.getItem("studymp"));
                for (studyid in studymp) {
                    window.studymp[studyid]['val'] = studymp[studyid]
                }
            }
            if ("seriesdel" in sessionStorage) {
                window.seriesdel = JSON.parse(sessionStorage.getItem("seriesdel"));

            }



            cartutils.updateGlobalCart(false, studymp, 'series')
            window.updateTableCounts(1);
            var gtotals = cartutils.getGlobalCounts();
            var content = gtotals[0].toString()+" Collections, "+gtotals[1]+" Cases, "+gtotals[2]+" Studies, and "+gtotals[3]+" Series in the cart"
            tippy('.cart-view', {
                           interactive: true,
                           allowHTML:true,
                          content: content
                        });
            $('#cart_stats').html(cart) ;

            if (gtotals[0]>0){
                $('#cart_stats').removeClass('notDisp');
                $('#export-manifest-cart').removeAttr('disabled');
                $('#view-cart').removeAttr('disabled');
            }
            else{
                $('#cart_stats').addClass('notDisp');
                $('#export-manifest-cart').attr('disabled','disabled');
                $('#view-cart').attr('disabled','disabled');
            }


        }
        else if ("cartHist" in sessionStorage){
            sessionStorage.removeItem("cartHist");
        }
        if ("cartedits" in sessionStorage){
            sessionStorage.removeItem("cartedits");
        }
        if ("studymp" in sessionStorage){
            sessionStorage.removeItem("studymp");
        }
        if ("seriesdel" in sessionStorage) {
                sessionStorage.removeItem("seriesdel");
            }

        //alert('cart edits');
    }

     $(document).ready(function () {

        tables.initializeTableData();
        filterItemBindings('access_set');
        filterItemBindings('program_set');
        filterItemBindings('analysis_set');

        filterItemBindings('search_orig_set');
        filterItemBindings('search_derived_set');
        filterItemBindings('search_related_set');

        max = Math.ceil(parseInt($('#age_at_diagnosis').data('data-max')));
        min = Math.floor(parseInt($('#age_at_diagnosis').data('data-min')));

        //quantElem=['#SliceThickness', '#min_PixelSpacing', '#max_TotalPixelMatrixColumns', '#max_TotalPixelMatrixRows','#age_at_diagnosis']
        quantElem=['#SliceThickness', '#age_at_diagnosis']
        quantElem.forEach(function(elem){
            $(elem).addClass('isQuant');
            $(elem).addClass('wNone');
            $(elem).find('.text-filter').remove();
        });
        rngElem=['#min_PixelSpacing', '#max_TotalPixelMatrixColumns', '#max_TotalPixelMatrixRows',]
        rngElem.forEach(function(elem){
            $(elem).addClass('isRng');
        });

        $('#quantitative').find('.list-group-item__body').each(function() {
            $(this).addClass('isQuant');
            $(this).addClass('wNone');
            $(this).find('.text-filter').remove();
        });

        addSliders('search_orig_set',true, false,'');
        addSliders('tcga_clinical',true, false,'tcga_clinical.');
        addSliders('quantitative',true, false,'quantitative.');

        createPlots('search_orig_set');
        createPlots('search_derived_set');
        createPlots('tcga_clinical');

        for (project in window.selProjects) {
            tables.initProjectData(project);
        }
        updateProjectTable(window.collectionData,stats);

        $('.clear-filters').on('click', function () {
            $('input:checkbox').not('#hide-zeros').not('.tbl-sel').prop('checked',false);
            $('input:checkbox').not('#hide-zeros').not('.tbl-sel').prop('indeterminate',false);
            $('.ui-slider').each(function(){
                setSlider(this.id,true,0,0,true, false);
            })
            $('#search_def_warn').hide();
            window.filterObj= {};
            filterutils.mkFiltText();
            var updateDone = false;
           var updateWait = false;

               updateFacetsData(true);
               tables.initializeTableData();


        });

        filterutils.load_preset_filters();

        $('.hide-filter-uri').on('click',function() {
            $(this).hide();
            $('.get-filter-uri').show();
            $('.copy-url').hide();
            $('.filter-url').hide();
            $('.filter-url').addClass("is-hidden");
        });

        $('.get-filter-uri').on('click',function(){
            $(this).hide();
            $('.hide-filter-uri').show();
            $('.copy-url').show();
            $('.filter-url').show();
            $('.filter-url').removeClass("is-hidden");
        });

        $('.filter-url-container').append(
            $('<div>')
                .addClass('alert alert-warning alert-dismissible url-too-long')
                .html(
                    "Your query's URL exceeds the maximum length allowed (2048 characters). "
                    + "You will need to select fewer filters or the URL will not properly load when used."
                )
                .prepend(
                    '<button type="button" class="close" data-hide="alert"><span aria-hidden="true">'
                    +'&times;</span><span class="sr-only">Close</span></button>'
                ).attr("style","display: none;")
        );


        $(window).on("beforeunload",function(){
            console.log("beforeunload called");
            let hs = new Object();
            hs['hz'] = new Object();
            hs['sorter'] = new Object();
            $('body').find('.hide-zeros').each(function(){
                let pfar = $(this).closest('.collection-list, .search-configuration, #analysis_set ');
                let pid = pfar[0].id;
                let checked = pfar.find('.hide-zeros')[0].checked;
                hs['hz'][pid] = checked;
            });

            $('body').find('.sorter').each(function(){
                let pfar = $(this).closest('.collection-list, .list-group-item__body ');
                let pid = pfar[0].id;
                let sort = $(this).find('input:checked').val()
                hs['sorter'][pid] = sort;
            });



            let url = encodeURI('/uihist/')
            let nhs = {'his':JSON.stringify(hs)}
            let csrftoken = $.getCookie('csrftoken');
            let deferred = $.Deferred();
           /*
            $.ajax({
                url: url,
                data: nhs,
                dataType: 'json',
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
                success: function (data) {
                },
                error: function(data){
                    console.debug('Error saving ui preferences.');
                },
                complete: function(data) {
                    deferred.resolve();
                }
            });
        */
        });



        initSort('num');
        if (document.contains(document.getElementById('history'))){
            updateViaHistory();
        }

        //updatecartedits();

    });

    window.onbeforeunload = function(){
        sessionStorage.setItem("cartHist", JSON.stringify(window.cartHist));
        sessionStorage.setItem("cartDetails", JSON.stringify(window.cartDetails));
        //sessionStorage.setItem("glblcart", JSON.stringify(window.glblcart));
        sessionStorage.setItem("src", "explore_page");
        //sessionStorage.setItem("cartDetails", windowcartDetails);

    }
    window.onpageshow = function (){
        //alert('show');
        if ("cartcleared" in sessionStorage){
            sessionStorage.removeItem("cartcleared");
            window.resetCart();
        }
        else {
            updatecartedits();
        }

    }





});

