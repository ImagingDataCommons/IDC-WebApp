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
        plotutils: 'plotutils'

    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'jquerydt': ['jquery'],
        'tablesorter': ['jquery'],
        'underscore': {exports: '_'},
        'session_security': ['jquery'],
        'filterutils': ['jquery'],
        'plotutils': ['jquery']
    }
});


require([
    'plotutils',
    'filterutils',
    'tables',
    'jquery',
    'underscore',
    'base', // This must ALWAYS be loaded!
    'jquerydt',
    'jqueryui',
    'bootstrap'
], function(plotutils,filterutils, tables,$, _, base) {

    const FLOAT_SLIDERS = filterutils.FLOAT_SLIDERS;

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


    window.fetchscript = function(){

        var url="/testscript/"
        var csrftoken = $.getCookie('csrftoken');
        var fstr="alert('sorry did not work')";
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'text',
            beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
            success: function (data) {
                fstr=data;
                $('.spinner').hide();
                window.testfunc= Function(fstr);
            },
            error: function(data){
                alert("There was an error fetching server data. Please alert the systems administrator")
                console.log('error loading data');
            }
        });
        //window.testfunc= Function(fstr);
    }

    window.toggleCharts=function(cntrl){
        if (cntrl==="hide"){
            $('.chart-content').addClass('hidden');
            $('.showchrt').removeClass('hidden');
            $('.hidechrt').addClass('hidden');
        }
        else if (cntrl==="show"){
            $('.chart-content').removeClass('hidden');
            $('.hidechrt').removeClass('hidden');
            $('.showchrt').addClass('hidden');
        }

    }

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

    window.setSlider = function (slideDiv, reset, strt, end, isInt, updateNow) {
        $('#' + slideDiv).closest('.hasSlider').find('.slider-message').addClass('notDisp');
        parStr=$('#'+slideDiv).data("attr-par");
        var max = $('#' + slideDiv).slider("option", "max");
        var divName = slideDiv.replace("_slide","");
        if (reset) {
            strt = $('#' + slideDiv).parent().attr('data-min');
            end = $('#' + slideDiv).parent().attr('data-max');
            $('#' + slideDiv).parent().removeClass('isActive');
            $('#' + slideDiv).siblings('.reset').addClass('disabled');
            $('#' + slideDiv).parent().find('.sliderset').find(':input').val('');
        } else {
            $('#' + slideDiv).parent().addClass('isActive');
            $('#' + slideDiv).siblings('.reset').removeClass('disabled');
        }
        $('#' + slideDiv).parent().attr('data-curminrng',strt);
        $('#' + slideDiv).parent().attr('data-curmaxrng',end);
        vals = [strt, end];
        $('#' + slideDiv).find(".slide_tooltip").each(function(index){
            $(this).text(vals[index].toString());
        });

        $('#' + slideDiv).slider("values", "0", strt);
        $('#' + slideDiv).slider("values", "1", end);
        var inpDiv = slideDiv.replace("_slide", "_input");
        var val = String(strt) + "-" + String(end);

        document.getElementById(inpDiv).value = val;
        nm=new Array();
        var filterCats= $('#'+divName).parentsUntil('.tab-pane','.list-group-item__body');
        for (var i=0;i<filterCats.length;i++){
            var ind = filterCats.length-1-i;
            nm.push(filterCats[ind].id);
        }
        nm.push(divName);
        filtAtt = nm.join('.')+ '_rng';
        if (reset) {
            if (  (window.filterObj.hasOwnProperty(filtAtt)) && (window.filterObj[filtAtt].hasOwnProperty('rng')) ) {
                delete window.filterObj[filtAtt]['rng'];
                if ('none' in window.filterObj[filtAtt]){
                    window.filterObj[filtAtt]['type']='none';
                } else {
                    delete window.filterObj[filtAtt];
                }
            }
        } else {
            var attVal = [];
            if (isInt) {
                attVal = [parseInt(strt), parseInt(end)];
            } else {
                attVal = [parseFloat(strt), parseFloat(end)];
            }

            if (!(filtAtt in window.filterObj)){
                window.filterObj[filtAtt] = new Object();
            }
            window.filterObj[filtAtt]['rng'] = attVal;
            window.filterObj[filtAtt]['type'] = 'ebtw';
        }
        if (updateNow) {
            filterutils.mkFiltText();
            updateFacetsData(true);
        }
     };


    window.showGraphs = function(selectElem){
        $(selectElem).parent().siblings('.graph-set').show();
        $(selectElem).parent().siblings('.less-graphs').show();
        $(selectElem).parent().hide();
    }
    window.hideGraphs = function(selectElem){
        $(selectElem).parent().siblings('.graph-set').hide();
        $(selectElem).parent().siblings('.more-graphs').show();
        $(selectElem).parent().hide();
    }

    window.toggleGraphOverFlow = function(id, showMore){
        if (showMore) {
            $('.' + id).parent().find('.more-graphs').hide();
            $('.' + id).parent().find('.less-graphs').show();
            $('.' + id).find('.chart-overflow').removeClass('hide-chart');
        }
        else {
            $('.' + id).parent().find('.more-graphs').show();
            $('.' + id).parent().find('.less-graphs').hide();
            $('.' + id).find('.chart-overflow').addClass('hide-chart')
        }
    }

    window.addNone = function(elem, parStr, updateNow) {
            var id = parStr+$(elem).closest('.list-group-item__body')[0].id+"_rng";

            if (elem.checked){
                if (!(id in window.filterObj)) {
                    window.filterObj[id] = new Array();
                    window.filterObj[id]['type']='none';
                }
                window.filterObj[id]['none'] = true;
                //$(elem).parent().parent().addClass('isActive');
            }

            else {
                if ((id in window.filterObj) && ('none' in window.filterObj[id])){
                    delete window.filterObj[id]['none'];
                    if (!('rng' in window.filterObj[id])){
                        delete window.filterObj[id];
                        //$(elem).parent().parent().removeClass('isActive');
                    }
                }
            }

            var slideNm = $(elem).parent()[0].id+"_slide";
            filterutils.mkFiltText();

            if (updateNow) {
                updateFacetsData(true);
            }
        }

    var mkSlider = function (divName, min, max, step, isInt, wNone, parStr, attr_id, attr_name, lower, upper, isActive,checked) {
        $('#'+divName).addClass('hasSlider');
        if (isActive){
            $('#'+divName).addClass('isActive');
        }

        var tooltipL = $('<div class="slide_tooltip tooltipL slide_tooltipT" />').text('stuff').css({
            position: 'absolute',
            top: -25,
            left: 0,
            transform: 'translateX(-50%)',

        });


         var tooltipR = $('<div class="slide_tooltip slide_tooltipB tooltipR" />').text('stuff').css({
           position: 'absolute',
           top: 20,
           right: 0,
             transform: 'translateX(50%)'
         });


          var labelMin = $('<div class="labelMin"/>').text(min).css({
              position: 'absolute',
              top:-7,
              left: -22,
            });


        var labelMax = $('<div class="labelMax" />').text(max);

        labelMax.css({
            position: 'absolute',
            top: -7,
            right: -14-8*max.toString().length,
            });

        var slideName = divName + '_slide';
        var inpName = divName + '_input';
        var strtInp = lower + '-' + upper;
        var nm=new Array();
        var filterCats= $('#'+divName).parentsUntil('.tab-pane','.list-group-item__body');
        for (var i=0;i<filterCats.length;i++){
            var ind = filterCats.length-1-i;
            nm.push(filterCats[ind].id);
        }
        nm.push(divName);
        var filtName = nm.join('.') + '_rng';
        //var filtName = nm;

        $('#' + divName).append('<div id="' + slideName + '"  data-attr-par="'+parStr+'"></div>');
        if ($('#'+divName).find('#'+inpName).length===0){
            $('#' + divName).append('<input id="' + inpName + '" type="text" value="' + strtInp + '" style="display:none">');
        }

        if (isActive){
            $('#'+divName).find('.reset').removeClass('disabled');
        }
        else {
            $('#'+divName).find('.reset').addClass('disabled');
        }

         $('#'+slideName).append(labelMin);

        $('#' + slideName).slider({
            values: [lower, upper],
            step: step,
            min: min,
            max: max,
            range: true,
            disabled: is_cohort,
            slide: function (event, ui) {
                $('#' + inpName).val(ui.values[0] + "-" + ui.values[1]);
                $(this).find('.slide_tooltip').each( function(index){
                    $(this).text( ui.values[index].toString() );
                    $(this).closest('.ui-slider').parent().find('.sliderset').find(':input')[index].value=ui.values[index].toString();
                });
            },

            stop: function (event, ui) {
                //setFromSlider(divName, filtName, min, max);
                $('#' + slideName).addClass('used');
                var val = $('#' + inpName)[0].value;
                var valArr = val.split('-');
                window.setSlider(slideName, false, valArr[0], valArr[1], isInt, true);

            }
        }).find('.ui-slider-range').append(tooltipL).append(tooltipR);


         $('#' + slideName).hover(
                function(){
                    //$(this).removeClass("ui-state-active");
                   $(this).parent().find('.slide_tooltip');
                }
              ,
                function(){
                   $(this).parent().find('.slide_tooltip');
                }
            );


         $('#' + slideName).find(".slide_tooltip").each(function(index){
                    if (index ==0) {
                        $(this).text(lower.toString());
                    }
                    else {
                        $(this).text(upper.toString());
                    }
               });

         $('#'+slideName).attr('min',min);
        $('#'+slideName).attr('max',max);


        $('#' + slideName).data("filter-attr-id",attr_id);
        $('#' + slideName).data("filter-display-attr",attr_name);

        $('#'+slideName).append(labelMax);
        $('#'+slideName).addClass('space-top-15');

    };






    window.updateSearchScope = function (searchElem) {
        var project_scope = searchElem.selectedOptions[0].value;
        filterutils.mkFiltText();
        updateFacetsData(true);
    }



    window.updateFacetsData = function (newFilt) {
        filterutils.update_filter_url();
        filterutils.update_bq_filters();
        if (window.location.href.search(/\/filters\//g) >= 0) {
            if (!first_filter_load) {
                window.history.pushState({}, '', window.location.origin + "/explore/")
            } else {
                first_filter_load = false;
            }
        }
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
                    var isFiltered = Boolean($('#search_def p').length > 0);
                    if (is_cohort) {
                        if (file_parts_count > display_file_parts_count) {
                            $('#file-export-option').prop('title', 'Your cohort exceeds the maximum for download.');
                            $('#file-export-option input').prop('disabled', 'disabled');
                            $('#file-export-option input').prop('checked', false);
                            $('#file-manifest').hide();
                            if (!user_is_social) {
                                $('#need-social-account').show();
                            } else {
                                $('#file-manifest-max-exceeded').show();
                                $('#bq-export-option input').prop('checked', true).trigger("click");
                            }
                        } else {
                            $('#file-manifest-max-exceeded').hide();
                            $('#file-manifest').show();

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
                        $('#search_def_stats').removeClass('notDisp');

                          mksearchtwo();

                       /* $('#search_def_stats').html(data.totals.PatientID.toString() +
                            " Cases, " + data.totals.StudyInstanceUID.toString() +
                            " Studies, and " + data.totals.SeriesInstanceUID.toString() +
                            " Series in this cohort. " +
                            "Size on disk: " + data.totals.disk_size); */

                        if (('filtered_counts' in data) && ('access' in data['filtered_counts']['origin_set']['All']['attributes']) && ('Limited' in data['filtered_counts']['origin_set']['All']['attributes']['access']) && (data['filtered_counts']['origin_set']['All']['attributes']['access']['Limited']['count']>0) ){
                            $('#search_def_access').removeClass('notDisp');
                            $('.access_warn').removeClass('notDisp');
                        }
                        else {
                            $('#search_def_access').addClass('notDisp');
                            $('.access_warn').addClass('notDisp');
                        }
                    } else {
                        if (isFiltered && data.total > 0) {
                            $('#save-cohort-btn').prop('disabled', '');
                            if (user_is_auth) {
                                $('#save-cohort-btn').prop('title', '');
                            }

                            /* $('#search_def_stats').removeClass('notDisp');
                            $('#search_def_stats').html(data.totals.PatientID.toString() + " Cases, " +
                                data.totals.StudyInstanceUID.toString()+" Studies, and " +
                                data.totals.SeriesInstanceUID.toString()+" Series in this manifest. " +
                                "Size on disk: " + data.totals.disk_size); */
                            if (('filtered_counts' in data) && ('origin_set' in data['filtered_counts']) && ('access' in data['filtered_counts']['origin_set']['All']['attributes']) && ('Limited' in data['filtered_counts']['origin_set']['All']['attributes']['access']) && (data['filtered_counts']['origin_set']['All']['attributes']['access']['Limited']['count']>0) ){
                               $('#search_def_access').removeClass('notDisp');
                               $('.access_warn').removeClass('notDisp');
                            } else {
                                $('#search_def_access').addClass('notDisp');
                                $('.access_warn').addClass('notDisp');
                            }
                        } else {
                            $('#search_def_access').addClass('notDisp');
                            $('.access_warn').addClass('notDisp');
                            $('#save-cohort-btn').prop('disabled', 'disabled');
                            if (data.total <= 0) {
                                //$('#search_def_stats').removeClass('notDisp');
                                //$('#search_def_stats').html('<span style="color:red">There are no cases matching the selected set of filters</span>');
                                //window.alert('There are no cases matching the selected set of filters.')
                            } else {
                                // $('#search_def_stats').addClass('notDisp');
                                //$('#search_def_stats').html("Don't show this!");
                            }
                            if (user_is_auth) {
                                $('#save-cohort-btn').prop('title', data.total > 0 ? 'Please select at least one filter.' : 'There are no cases in this cohort.');
                            } else {
                                $('#save-cohort-btn').prop('title', 'Log in to save.');
                            }
                        }
                    }
                    //updateCollectionTotals(data.total, data.origin_set.attributes.collection_id);

                    tables.updateCollectionTotals('Program', data.programs);
                    //updateFilterSelections('search_orig_set', data.origin_set.All.attributes);


                    dicofdic = {'unfilt': data.origin_set.All.attributes, 'filt': ''}
                    if (isFiltered) {
                        dicofdic['filt'] = data.filtered_counts.origin_set.All.attributes;
                    } else {
                        dicofdic['filt'] = data.origin_set.All.attributes;
                    }
                    updateFilterSelections('access_set', dicofdic);
                    updateFilterSelections('analysis_set', dicofdic);
                    updateFilterSelections('search_orig_set', dicofdic);
                    plotutils.createPlots('search_orig_set');

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
                                updateFilterSelections(data.derived_set[facetSet].name, dicofdic);
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
                        updateFilterSelections(derivedAttrs[i], {});
                    }

                    plotutils.createPlots('search_derived_set');

                    if (data.hasOwnProperty('related_set')) {
                        $('#search_related_set').removeClass('disabled');
                        dicofdic = {'unfilt': data.related_set.All.attributes, 'filt': ''}
                        if (isFiltered) {
                            dicofdic['filt'] = data.filtered_counts.related_set.All.attributes;
                        } else {
                            dicofdic['filt'] = data.related_set.All.attributes;
                        }
                        updateFilterSelections('search_related_set', dicofdic);
                        //createPlots('tcga_clinical');
                    } else {
                        $('#search_related_set').addClass('disabled');
                        updateFilterSelections('search_related_set', {});
                    }
                    plotutils.createPlots('search_related_set');
                    var collFilt = new Array();
                    if ('collection_id' in parsedFiltObj) {
                        collFilt = parsedFiltObj['collection_id'];
                        var ind = 0;

                        /*while (ind < window.selItems.selProjects.length) {
                            proj = window.selItems.selProjects[ind]
                            if ((collFilt.indexOf(proj) > -1)) {
                                ind++
                            } else {
                                window.selItems.selProjects.splice(ind, 1);
                                if (proj in window.selItems.selStudies) {
                                    delete window.selItems.selStudies[proj];
                                }
                            }
                        } */

                    }
                    updateTablesAfterFilter(collFilt, data.origin_set.All.attributes.collection_id, data.stats);

                    if ($('.search-configuration').find('#hide-zeros')[0].checked) {
                        addSliders('search_orig_set', false, true, '');
                        addSliders('quantitative', false, true, 'quantitative.');
                        addSliders('tcga_clinical', false, true, 'tcga_clinical.');
                    }


                }
                //changeAjax(false);
                finally {
                    deferred.resolve();
                }
            },
            error: function(data){
                alert("There was an error fetching server data. Please alert the systems administrator")
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

    var updateAttributeValues = function(attributeValList, dic){
        var allValues = attributeValList.children('li').children().children('input:checkbox');
        for (var i = 0; i < allValues.length; i++) {
            var elem = allValues.get(i);
            var val = $(elem)[0].value;
            var spans = $(elem).parent().find('span');
            var cntUf=0;
            if (dic.hasOwnProperty('unfilt') && dic['unfilt'].hasOwnProperty(val)) {
                cntUf = dic['unfilt'][val].count
            } else {
                cntUf = 0;
            }

            spans.filter('.case_count')[0].innerHTML = cntUf.toString();
            if (spans.filter('.plot_count').length>0) {
                var cntF = 0
                if (dic.hasOwnProperty('filt') && dic['filt'].hasOwnProperty(val)) {
                    cntF = dic['filt'][val].count
                } else {
                    cntF = 0;
                }

                spans.filter('.plot_count')[0].innerHTML = cntF.toString();
            }
        }
    }

    window.updateFilters = function (filterCat, dic, dataFetched, srch) {
        var numAttrAvail = 0;
        var numCnts=0;

        var headerCnt = $('#'+filterCat).filter('.collection_name').siblings().filter('.case_count');
        if (headerCnt.length>0){
            numCnts = headerCnt[0].innerHTML;
        }

        var showZeros = true;
        var searchDomain = $('#'+filterCat).closest('.search-configuration, #program_set, #analysis_set');
        //var isSearchConf = ($('#'+filterCat).closest('.search-configuration').find('#hide-zeros').length>0);
        if ((searchDomain.find('#hide-zeros').length>0) && (searchDomain.find('#hide-zeros').prop('checked'))){
            showZeros = false;
        }
        var textFilt=false;
        var textFiltVal='';
        if ($('#'+filterCat).children('.text-filter').length>0) {
            textFiltVal = $('#'+filterCat).children('.text-filter')[0].value;
        } else if ($('#'+filterCat).find('.collection_value').length>0){
            textFiltVal = $('#collection_search')[0].value;
        }

        if (!(textFiltVal==='')){
            textFilt=true;
        }

        if (  $('#'+filterCat).hasClass('isQuant') && dataFetched){
            if (dic.hasOwnProperty('unfilt') && dic['filt'].hasOwnProperty('min_max') ){
                if (dic['unfilt']['min_max'].hasOwnProperty('min')) {
                    $('#' + filterCat).attr('data-curmin', dic['unfilt']['min_max']['min']);
                } else {
                    $('#'+filterCat).attr('data-curmin','NA');
                }
                if (dic['unfilt']['min_max'].hasOwnProperty('max')) {
                    $('#' + filterCat).attr('data-curmax', dic['unfilt']['min_max']['max']);
                } else {
                    $('#'+filterCat).attr('data-curmax','NA');
                }
            } else {
                $('#'+filterCat).attr('data-curmin','NA');
                $('#'+filterCat).attr('data-curmax','NA');
            }
         }
        var filterList=$('#'+filterCat).children('ul');
        if (dataFetched){
            updateAttributeValues(filterList, dic);
        }

        var sorter= $('#'+filterCat).children('.sorter').find(":radio").filter(':checked');

        if ($('#'+filterCat).find('.collection_value').length>0){
            sorter= $('#Program').children('.sorter').find(":radio").filter(':checked');
        }

        if (sorter.length>0){
             if (sorter.val()==="alpha"){
                 const reRng= /^\d*\.?\d+\s+[Tt]o\s+\d*\.?\d+$/;

                 filterList.children('li').sort(
                    function (a,b){
                     var valA=$(a).children().children('.value').text().trim();
                     var valB=$(b).children().children('.value').text().trim();

                     if ( ($(a).children().children('input:checkbox')[0].checked || $(a).children().children('input:checkbox')[0].indeterminate) && !($(b).children().children('input:checkbox')[0].checked || $(b).children().children('input:checkbox')[0].indeterminate)){
                         return -1;
                     }
                     else if ( ($(b).children().children('input:checkbox')[0].checked || $(b).children().children('input:checkbox')[0].indeterminate) && !($(a).children().children('input:checkbox')[0].checked || $(a).children().children('input:checkbox')[0].indeterminate)){
                         return 1;
                     }

                     else if (reRng.test(valB) && reRng.test(valA)){
                         if ( parseFloat(valB.toLowerCase().split('to')[0].trim()) <  parseFloat(valA.toLowerCase().split('to')[0].trim())){
                             return 1;
                         }
                         else{
                             return -1;
                         }
                     }

                     else if (valB < valA){
                         return 1;
                     } else {
                         return -1;
                     }

                    }).appendTo(filterList);
             }
             else if (sorter.val()==="num"){
                 filterList.children('li').sort(
                    function (a,b){
                        if ( ($(a).children().children('input:checkbox')[0].checked || $(a).children().children('input:checkbox')[0].indeterminate) && !($(b).children().children('input:checkbox')[0].checked || $(b).children().children('input:checkbox')[0].indeterminate)){
                         return -1;
                         }
                         else if ( ($(b).children().children('input:checkbox')[0].checked || $(b).children().children('input:checkbox')[0].indeterminate) && !($(a).children().children('input:checkbox')[0].checked || $(a).children().children('input:checkbox')[0].indeterminate)){
                            return 1;
                         } else {

                            return (parseFloat($(a).children().children('.case_count').text()) < parseFloat($(b).children().children('.case_count').text()) ? 1 : -1)
                           }
                        }).appendTo(filterList);
             }
        }

        var allFilters = filterList.children('li').children().children('input:checkbox');

        var hasFilters=true;
        if (allFilters.length===0){
            hasFilters = false;
        }
        var checkedFilters=allFilters.children('li').children().children('input:checked');
        var showExtras = false;
        if ( ($('#' + filterCat).children('.more-checks').length>0) && $('#' + filterCat).children('.more-checks').hasClass("notDisp")) {
            showExtras = true;
        }
        //var allUnchecked = ((checkedFilters.length == 0) ? true : false)

        var numNonZero = 0;
        numCnts = 0;
        for (var i = 0; i < allFilters.length; i++) {

            var elem = allFilters.get(i);
            var val = $(elem).data('filterDisplayVal');
            var filtByVal = false;

            if ($(elem).siblings().filter('a').length===0) {
                if (textFilt && !(val.toLowerCase().includes(textFiltVal.toLowerCase()))) {
                    filtByVal = true;
                    $(elem).parent().parent().addClass('filtByVal');

                } else {
                    $(elem).parent().parent().removeClass('filtByVal');
                    if (srch){
                        let ctrl = $(elem).closest('.list-group-item').find('.list-group-item__heading').find('a');
                        if (ctrl.attr('aria-expanded')==='false'){
                            ctrl.click();
                        }
                    }
                }
            }
            let checked = $(elem).prop('checked');
            let spans = $(elem).parent().find('span');
            //var lbl = spans.get(0).innerHTML;
            let cntUf = parseInt(spans.filter('.case_count')[0].innerHTML);

            let isZero = true;
            if ( (cntUf>0) || checked)  {
                if (cntUf>0){
                    numNonZero++;
                }
                $(elem).parent().parent().removeClass('zeroed');
                isZero = false;
            } else {
                $(elem).parent().parent().addClass('zeroed');
                isZero = true;
            }
            let allChildrenHidden = false;
            if ( $(elem).parent().siblings().filter('.list-group-sub-item__body').length>0 ){
                if ($(elem).parent().siblings().filter('.list-group-sub-item__body').find('.checkbox').not('.notDisp').length===0){
                    allChildrenHidden = true;
                }
            }
            let thisAttrAvail = (( ( !isZero || showZeros) && !filtByVal  && !allChildrenHidden) || checked) ? true:false;
            if  ( thisAttrAvail){
                  numAttrAvail++;
                  numCnts+=cntUf;
            }

            if ( (numAttrAvail>5) && thisAttrAvail  ) {
                $(elem).parent().parent().addClass('extra-values');
            } else {
                $(elem).parent().parent().removeClass('extra-values');
            }

            if ( thisAttrAvail && (showExtras || (numAttrAvail<6)) ) {
                  $(elem).parent().parent().removeClass('notDisp');
            } else {
                $(elem).parent().parent().addClass('notDisp');
            }
        }

        if (hasFilters){
            if (numNonZero===0){
                $('#' + filterCat+'_heading').children('a').children().addClass('greyText');
                $('#' + filterCat+'_heading').children('a').children('.noCase').removeClass('notDisp');

            } else {
                $('#' + filterCat+'_heading').children('a').children().removeClass('greyText');
                $('#' + filterCat+'_heading').children('a').children('.noCase').addClass('notDisp');
            }

            var numMore = filterList.children('li').filter('.extra-values').length;
            if ($('#' + filterCat).children('.more-checks').children('.show-more').length>0){
                $('#' + filterCat).children('.more-checks').children('.show-more')[0].innerText = "show " + numMore.toString() + " more";
                if (numMore>0){
                    $('#' + filterCat).children('.more-checks').children('.show-more').removeClass('notDisp');
                    $('#' + filterCat).children('.less-checks').children('.show-less').removeClass('notDisp');
                } else {
                    $('#' + filterCat).children('.more-checks').children('.show-more').addClass('notDisp');
                    $('#' + filterCat).children('.less-checks').children('.show-less').addClass('notDisp');
                }
            }
            if ( numAttrAvail < 1)  {
                $('#' + filterCat).children('.more-checks').hide();
                $('#' + filterCat).children('.less-checks').hide();
                $('#' + filterCat).children('.check-uncheck').hide();
            } else if (showExtras) {
                $('#' + filterCat).children('.more-checks').hide();
                $('#' + filterCat).children('.less-checks').show();
                $('#' + filterCat).children('.check-uncheck').show();
            } else {
                $('#' + filterCat).children('.more-checks').show();
                $('#' + filterCat).children('.check-uncheck').show();
                if ($('#' + filterCat).children('.more-checks').children('.show-more').length>0){

                }
                $('#' + filterCat).children('.less-checks').hide();
            }
        }
        return [numAttrAvail, numCnts];
    }

    setAllFilterElements = function(hideEmpty,filtSet, srch=false){
        //var filtSet = ["search_orig_set","segmentation","quantitative","qualitative","tcga_clinical"];
        for (var i=0;i<filtSet.length;i++) {
            filterCats = filterutils.findFilterCats(filtSet[i], false);
            let resetParentVal=false;
            progInd = filterCats.indexOf('Program');
            if (progInd>-1){
                filterCats.splice(progInd,1);
                filterCats.push('Program');
                resetParentVal=true;
            }

            for (var j = 0; j < filterCats.length; j++) {
                let ret = updateFilters(filterCats[j],{},false,srch);
                if (resetParentVal && !(filterCats[j]==='Program')){
                    parentVal=$('#'+filterCats[j]).siblings().filter('.list-group-item__heading').find('.case_count');
                    parentVal[0].innerHTML=ret[1];
                    if (ret[0]===0){
                         $('#'+filterCats[j]).addClass('notDisp')
                    }
                    else{
                        $('#'+filterCats[j]).removeClass('notDisp')
                    }
                }
            }
        }

    }

    window.updateColl = function(srch){
        let checked=$('#Program').find('.hide-zeros')[0].checked;
        let filtSet=['program_set']
        /* for (program in window.programs){
            if (Object.keys(window.programs[program].projects).length>1){
                filtSet.push(program)
            }
        }*/

        setAllFilterElements(checked,filtSet,srch);
    }

    window.hideAtt = function(hideElem){
        let filtSet = ["search_orig_set","segmentation","quantitative","qualitative","tcga_clinical"];
        setAllFilterElements(hideElem.checked, filtSet);
        addSliders('search_orig_set', false, hideElem.checked,'');
        addSliders('quantitative', false, hideElem.checked,'quantitative.');
        addSliders('tcga_clinical',false, hideElem.checked,'tcga_clinical.');
    }

    var updateFilterSelections = function (id, dicofdic) {
        let filterCats = filterutils.findFilterCats(id,false);
        for (let i = 0; i < filterCats.length; i++) {
            let cat = filterCats[i]
            let filtDic = {'unfilt':'', 'filt':''}

            if ( (dicofdic.hasOwnProperty('unfilt')) &&  (dicofdic['unfilt'].hasOwnProperty(cat))){
                filtDic['unfilt']=dicofdic['unfilt'][cat]
            }
            if ( (dicofdic.hasOwnProperty('filt')) && (dicofdic['filt'].hasOwnProperty(cat))) {
                filtDic['filt']=dicofdic['filt'][cat]
            }
            updateFilters(filterCats[i], filtDic, true, false);
        }
    };


    var applyFilters = function(){
        filterutils.mkFiltText();
        updateFacetsData(true);
    }

    window.processUserChoice = function(){
        //alert('here');
        val=$('#filter-option-modal').find('input[name="filtchoice"]:checked').val();
        if (val=='new')
        {
            window.filterSet[window.filterSetNum].filterObj = JSON.parse(JSON.stringify(filterObjOld));
            filterObjOld = JSON.parse(JSON.stringify(filterObj));
            createNewFilterSet(filterObj, true);
        }
        else if (val=='update'){
            filterObjOld = JSON.parse(JSON.stringify(filterObj));
            for (project in window.selProjects) {
            initProjectData(project);
           }
            mksearchtwo();
            updateFacetsData(true);

        }
        else if (val=='cancel'){
            filterObj=JSON.parse(JSON.stringify(filterObjOld));
            window.filterSet[window.filterSetNum].filterObj = filterObj;
            updateFiltControls();
            filterutils.mkFiltText();
            mksearchtwo();


        }

        $('#filter-option-modal').removeClass('filtermoddisp');
        $('#filter-option-modal').addClass('filtermodnotdisp');

        if ($("#filter-option-modal").find("input:checkbox").prop("checked")){

            if ((!window.choiceMade) && (val == 'cancel') && (window.currentSet>0)){
               $('.search-scope').find("input:checkbox").attr("disabled",true);
             $('.search-configuration').find("input:checkbox").attr("disabled",true);
             alert('Based on these choices the filter definition will be fixed whenever items are added to the filter set');

            }
            window.choiceMade = true;
        }

    }

   var checkOtherSets = function(nm){
       selnm=-1;
       for (i=0;i<window.filterSet.length;i++){
           if (i!=nm){
               cset = window.filterSet[i].filterObj
               if (JSON.stringify(filterObj)==JSON.stringify(cset)){
                   selnm=i;
                   break;
               }
           }
       }
       return selnm;
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

        $('#' + filterId).find('input:checkbox').not('#hide-zeros').on('click', function () {
            filterutils.handleFilterSelectionUpdate(this, true, true);
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
                checkUncheckAll(this, true, true);

            }
        });

        $('#' + filterId).find('.uncheck-all').on('click', function () {
          if (!is_cohort){
              checkUncheckAll(this, false, false);

          }
        });
    };

    var checkUncheckAll = function(aelem, isCheck, checkSrch){
        //$('#' + filterId).find('.checkbox').find('input').prop('checked', true);
                var filterElems = new Object();
                filterElems = $(aelem).parentsUntil('.list-group-item, #program_set').filter('.list-group-item__body, .list-group-sub-item__body, #Program').children('ul').children();
                for (var ind = 0; ind < filterElems.length; ind++) {
                    var ckElem = new Object();
                    if ($(filterElems[ind]).children().filter('.list-group-item__heading').length > 0) {
                        ckElem = $(filterElems[ind]).children().filter('.list-group-item__heading').children().filter('input:checkbox')[0];
                    } else {
                        ckElem = $(filterElems[ind]).children().filter('label').children().filter('input:checkbox')[0];
                    }
                    var subListUsed=false
                    if (checkSrch) {
                        subListElem = $(ckElem).parent().parent().children('.list-group-sub-item__body')
                        if (subListElem.length > 0) {
                            subListUsed = true
                            subFilterElems = subListElem.find('ul').find('.checkbox')
                            for (var subInd = 0; subInd < subFilterElems.length; subInd++) {
                                subFilterElem = subFilterElems[subInd];
                                if (!$(subFilterElem).hasClass('filtByVal')) {
                                    subCkElem = $(subFilterElem).find('input:checkbox')[0];
                                    subCkElem.checked = isCheck;
                                    if ((subInd < subFilterElems.length - 1) || (ind < filterElems.length - 1)) {
                                        filterutils.handleFilterSelectionUpdate(subCkElem, false, false);
                                    } else {
                                        filterutils.handleFilterSelectionUpdate(subCkElem, true, true);
                                    }
                                }

                            }

                        } else if (!$(ckElem).parent().parent().hasClass('filtByVal')) {
                            ckElem.checked = isCheck;
                        }
                    } else {
                        ckElem.checked = isCheck;
                    }

                    //$(filterElem).prop('checked') = true;
                    if ((ind < filterElems.length - 1) && (!subListUsed)){
                        filterutils.handleFilterSelectionUpdate(ckElem, false, false);
                    } else if (!subListUsed) {
                        filterutils.handleFilterSelectionUpdate(ckElem, true, true);
                    }

                }

    }

    var clearFilter = function (filterElem) {
        if (filterElem.classList.contains('all')){
                for (cat in window.filterObj){
                    delete window.filterObj[cat];
                }
                //window.filterObj.collection_id = window.tcgaColls;
            }
        if (filterElem.classList.contains('all')){

        }
    };

    var addFilterBindings = function(id){
     var filterCats = filterutils.findFilterCats(id,false);
     for (var i=0;i<filterCats.length;i++){
         filterItemBindings(filterCats[i]);
    }
 };

    var addSliders = function(id, initialCreation, hideZeros, parStr){
        $('#'+id).find('.list-group-item__body.isQuant').each(function() {
            let attr_id = $(this).attr("id");
            let isInt = !FLOAT_SLIDERS.includes(attr_id);
            let min = parseFloat($(this).attr('data-min'));
            let max = parseFloat($(this).attr('data-max'));
            let lower = parseFloat($(this).attr('data-curminrng'));
            let upper = parseFloat($(this).attr('data-curmaxrng'));
            if (isInt){
                min=Math.floor(min);
                max=Math.ceil(max);
                lower=Math.floor(lower);
                upper=Math.ceil(upper);
            }
            else{
                min=parseFloat(min.toFixed(2));
                max=parseFloat(max.toFixed(2));
                lower=parseFloat(lower.toFixed(2));
                upper=parseFloat(upper.toFixed(2));
            }

            let addSlider = true;
            let isActive = $(this).hasClass('isActive');
            let wNone = $(this).hasClass('wNone');
            let checked = ($(this).find('.noneBut').length>0) ? $(this).find('.noneBut').find(':input')[0].checked : false;
            let txtLower = ($(this).find('.sl_lower').length>0) ? $(this).find('.sl_lower').val():'';
            let txtUpper = ($(this).find('.sl_lower').length>0) ? $(this).find('.sl_upper').val():'';
            let cntrNotDisp = ($(this).find('.cntr').length>0) ?$(this).find('.cntr').hasClass('notDisp'):true;


            if (initialCreation){
                let heading = $(this).prop('id') + '_heading';
                $('#'+heading).find('.fa-cog').attr('title', 'Control slider');
                $('#'+heading).find('.fa-search').remove();

                $(this).find('.more-checks').remove();
                $(this).find('.less-checks').remove();
                $(this).find('.sorter').remove();
                $('#'+this.id+'_list').addClass('hide');
            } else {
                let slideDivId = $(this).prop('id') + '_slide';
                curmin = parseFloat($(this).attr('data-curmin'));
                curmax = parseFloat($(this).attr('data-curmax'));
                if (isInt){
                    curmin = Math.floor(curmin);
                    curmax =Math.floor(curmax);
                }
                else{
                    curmin= parseFloat(curmin.toFixed(2));
                    curmax= parseFloat(curmax.toFixed(2));
                }
                $(this).find('#' + slideDivId).remove();
                $(this).find('.cntr').remove();
                //$(this).find('.noneBut').remove();
                let inpName = $(this).prop('id') + '_input';
                $(this).find('#'+inpName).remove();
                if (hideZeros) {
                    if ( ( (curmin === 'NA') || (curmax === 'NA')) && !isActive ){
                        addSlider = false;
                        $(this).removeClass('hasSlider');
                    } else if (isActive){
                        if (curmin === 'NA') {
                                min = lower;
                        } else {
                            min = Math.min(lower, curmin);
                        }
                        if (curmax === 'NA'){
                                max = upper;
                        } else {
                            max = Math.max(upper, curmax);
                        }
                    } else {
                            min = curmin;
                            max = curmax;
                            lower=min;
                            upper=max;
                    }
                } else if (!isActive){
                    lower=min;
                    upper=max;
                }
            }

            if (addSlider) {
                $(this).addClass('hasSlider');
                let step = max <=1 ? 0.05 : 1;
                let isInt = !FLOAT_SLIDERS.includes(attr_id);
                mkSlider($(this).prop('id'), min, max, step, isInt, wNone, parStr, $(this).data('filter-attr-id'), $(this).data('filter-display-attr'), lower, upper, isActive,checked);
                let cntrlDiv = $('<div class="cntr"></div>');
                cntrlDiv.append('<div class="sliderset" style="display:block;margin-bottom:8px">Lower: <input type="text" style="display:inline" size="5" class="sl_lower" value="'+ txtLower + '">' +
                    ' Upper: <input class="sl_upper" type="text" style="display:inline" size="5" class="upper" value="' + txtUpper + '">' +
                    '<div class="slider-message notDisp" style="color:red"><br>Please set lower and upper bounds to numeric values with the upper value greater than the lower, then press Return in either text box. </div></div>')
                cntrlDiv.append(  '<button class="reset" style="display:block;" onclick=\'setSlider("'+ this.id + '_slide", true,0,0,true, true,"'+parStr+'")\'>Clear Slider</button>');
                if (wNone){
                   cntrlDiv.append( '<span class="noneBut"><input type="checkbox"   onchange="addNone(this, \''+parStr+'\', true)"> None </span>');
                   cntrlDiv.find('.noneBut').find(':input')[0].checked = checked;
                }
                if (cntrNotDisp){
                    cntrlDiv.addClass('notDisp');
                }
                $(this).append(cntrlDiv);
                $(this).find('.sliderset').keypress(function(event){
                   var keycode = (event.keyCode ? event.keyCode : event.which);
                   if (keycode == '13'){

                   try {
                       let txtlower = parseFloat($(this).parent().find('.sl_lower').val());
                       let txtupper = parseFloat($(this).parent().find('.sl_upper').val());
                      if (txtlower<=txtupper){
                        setSlider($(this).closest('.hasSlider')[0].id+"_slide", false, txtlower, txtupper, false,true);
                      } else {
                          $(this).closest('.hasSlider').find('.slider-message').removeClass('notDisp');

                      }
                   }
                  catch(error){
                    $(this).closest('.hasSlider').find('.slider-message').removeClass('notDisp');
                    console.log(error);
                  }
               }
              });

            } else {
                $(this).removeClass('hasSlider');

            }

        });
     };

    var showFilters = [];
    var load_filters = function(filters) {
         var sliders = [];
        _.each(filters, function(group){
            _.each(group['filters'], function(filter) {
                let selector = 'div.list-group-item__body[data-filter-attr-id="' +
                    filter['id'] + '"], ' + 'div.list-group-sub-item__body[data-filter-attr-id="' +
                    filter['id'] + '"]';
                $(selector).parents('.collection-list').collapse('show');

                $(selector).each(function(index, selEle) {
                    let attValueFoundInside = false;
                    if ($(selEle).children('.ui-slider').length > 0) {
                        attValueFoundInside = true;
                        let pushSliders = false;
                        let left_val = 0;
                        let right_val = 0;
                        if (filter['values'].indexOf('None')>-1) {
                            var ckbx=$(selEle).find('.noneBut').children('input:checkbox')[0];
                            ckbx.checked=true;
                            var parStr=$(selEle).children('.ui-slider').data('attr-par');
                            addNone(ckbx, parStr, false);
                            if (filter['values'].length>1){
                                pushSliders=true;
                                var ind = (filter['values'].indexOf('None')+1)%2
                                var vals=JSON.parse(filter['values'][ind]);
                                left_val=vals[0];
                                right_val=vals[1];
                            }
                        } else {
                            pushSliders=true;
                            left_val=filter['values'][0].indexOf(".") >= 0 ? parseFloat(filter['values'][0]) : parseInt(filter['values'][0]);
                            right_val=filter['values'][1].indexOf(".") >= 0 ? parseFloat(filter['values'][1]) : parseInt(filter['values'][1]);
                        }

                        if (pushSliders) {
                            sliders.push({
                                'id': $('div.list-group-item__body[data-filter-attr-id="' + filter['id'] + '"]').children('.ui-slider')[0].id,
                                'left_val': left_val,
                                'right_val': right_val,
                            });
                        }
                     } else {
                       _.each(filter['values'], function (val) {
                           if (filter.hasOwnProperty('op')) {
                               if($(selEle).find('.join_val').length>0) {
                                   $(selEle).find('.join_val').filter('input[value=' + filter['op'].toUpperCase() + ']').prop("checked", true);
                               } else {
                                   (filter['op'] !== 'OR' && filter['op'] !== 'BTW') && base.showJsMessage(
                                       "warning",
                                       "Invalid operator seen for attribute '"+$(selEle).attr('id')+"'; default of OR used instead.",
                                       true
                                   );
                               }
                           }
                           if ($(selEle).find('input[data-filter-attr-id="' + filter['id'] + '"][value="' + val + '"]').length>0) {
                               attValueFoundInside = true;
                           }
                           $('input[data-filter-attr-id="' + filter['id'] + '"][value="' + val + '"]').prop("checked", true);
                           checkFilters($('input[data-filter-attr-id="' + filter['id'] + '"][value="' + val + '"]'));
                      });
                  }
                if (attValueFoundInside){

                    /*$(selEle).collapse('show');
                    $(selEle).find('.show-more').triggerHandler('click');
                    $(selEle).parents('.tab-pane.search-set').length > 0 && $('a[href="#' +
                    $(selector).parents('.tab-pane.search-set')[0].id + '"]').tab('show');
                     */
                    showFilters.push([selEle,selector]);
                }
               });
            });
        });
        if (sliders.length > 0) {
            load_sliders(sliders, false);
        }
        filterutils.mkFiltText();
        return updateFacetsData(true).promise();
     };

    var load_sliders = function(sliders, do_update) {
        _.each(sliders, function(slider) {
            var slider_id = slider['id'];
            var isInt = !FLOAT_SLIDERS.includes(slider_id.replace('_slide',''));
            setSlider(slider_id, false, slider['left_val'], slider['right_val'], isInt, false);
            //updatePlotBinsForSliders(slider_id);
        });

        if (do_update) {
            filterutils.mkFiltText();
            updateFacetsData(true).promise();
        }
     };

    var ANONYMOUS_FILTERS = {};
    var ANONYMOUS_SLIDERS = {};

    var save_anonymous_selection_data = function() {
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

    var load_anonymous_selection_data = function() {
        // Load anonymous filters from session storage and clear it, so it is not always there
        let filter_str = sessionStorage.getItem('anonymous_filters');
        ANONYMOUS_FILTERS = JSON.parse(filter_str);
        sessionStorage.removeItem('anonymous_filters');

        let slider_str = sessionStorage.getItem('anonymous_sliders');
        ANONYMOUS_SLIDERS = JSON.parse(slider_str);
        sessionStorage.removeItem('anonymous_sliders');
    };

    var load_filter_selections = function(selections) {
        _.each(selections,function(selectors){
            let selEle = selectors[0];
            let selector = selectors[1];
            $(selEle).collapse('show');
            $(selEle).parents('.tab-pane.search-set').length > 0 && $('a[href="#' + $(selector).parents('.tab-pane.search-set')[0].id + '"]').tab('show');
        });
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
    function load_preset_filters() {
        let loadPending = null;
        if (is_cohort && !cohort_loaded) {
             loadPending = load_filters(cohort_filters);
             loadPending.done(function () {
                 console.debug("Load pending complete.");
                 cohort_loaded = true;
                 $('input[type="checkbox"]').prop("disabled", "disabled");
                 $('#projects_table').find('input:checkbox').removeAttr("disabled");
                 //$('.check-all').prop("disabled","disabled");
                 // Re-enable checkboxes for export manifest dialog, unless not using social login
                 $('#export-manifest-modal input').removeAttr('disabled');

                 $('input#hide-zeros').prop("disabled", "");
                 $('input#hide-zeros').prop("checked", true);
                 $('input#hide-zeros').each(function(){$(this).triggerHandler('change')});
                 $('div.ui-slider').siblings('button').prop("disabled", true);
                 $('.noneBut').find('input:checkbox').prop("disabled",true);
             });
         } else {
             // Anonymously selected filters have precedence over filters for load.
             // check for localStorage key of saved filters from a login
             load_anonymous_selection_data();
             let has_sliders = (ANONYMOUS_SLIDERS !== null && ANONYMOUS_SLIDERS.length > 0);
             let has_filters = (ANONYMOUS_FILTERS !== null && ANONYMOUS_FILTERS[0]['filters'].length > 0);

             if (!(has_filters || has_sliders)) {
                 // No anonymous filters seen--check for filter URI
                if (filters_for_load && Object.keys(filters_for_load).length > 0) {
                     loadPending = load_filters(filters_for_load);
                     loadPending.done(function () {
                         //console.debug("External filter load done.");
                     });
                 }
             } else {
                 if (has_sliders) {
                     loadPending = load_sliders(ANONYMOUS_SLIDERS, !has_filters);
                     if (loadPending) {
                        loadPending.done(function () {
                             //console.debug("Sliders loaded from anonymous login.");
                         });
                     }
                 }
                 if (has_filters) {
                     loadPending = load_filters(ANONYMOUS_FILTERS);
                     loadPending.done(function () {
                         //console.debug("Filters loaded from anonymous login.");
                     });
                 }
             }
         }
         if (loadPending) {
             loadPending.done(function() {
                 load_filter_selections(showFilters);
             });
         }
     }

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
















    initProjectData = function(project){

        window.selProjects[project]['selCases']=new Object();
        window.selProjects[project]['state']={'view':false, 'checked':false};
        window.selProjects[project]['totalChild']=stats['patient_per_collec'][project];;
        window.selProjects[project]['numChildFullCheck']=0;
        window.selProjects[project]['numChildMixCheck'] = 0;
        window.selProjects[project]['numChildNoCheck']=stats['patient_per_collec'][project];
        window.selProjects[project]['numChecksAbove']=0;

        if (project in stats['patient_per_collec']){
            window.selProjects[project]['totalCases']=stats['patient_per_collec'][project];
        }

        if (project in stats['study_per_collec']){
            window.selProjects[project]['totalStudies']=stats['study_per_collec'][project];
        }
        if (project in stats['series_per_collec']){
            window.selProjects[project]['totalSeries']=stats['series_per_collec'][project];
        }

    }

    initCaseDataAndRow = function(projid, caseid, row, totalStudies){
        window.selProjects[projid].selCases[caseid] = new Object();
        window.selProjects[projid].selCases[caseid].selStudies = new Object();
        window.selProjects[projid].selCases[caseid]['state'] = new Object();
        window.selProjects[projid].selCases[caseid]['state']['view']=false;
        window.selProjects[projid].selCases[caseid]['state']['checked']=false;
        window.selProjects[projid].selCases[caseid]['totalChild'] = totalStudies;

        window.selProjects[projid].selCases[caseid]['numChildFullCheck'] = 0;
        window.selProjects[projid].selCases[caseid]['numChildMixCheck'] = 0;
        window.selProjects[projid].selCases[caseid]['numChildNoCheck'] = totalStudies;

        window.selProjects[projid].selCases[caseid]['numChecksAbove'] = 0;

        window.selProjects[projid].selCases[caseid]['totalStudies']=$(row).attr('data-totalstudies');
        window.selProjects[projid].selCases[caseid]['totalSeries']=$(row).attr('data-totalseries');
    }

    initStudyDataAndRow = function(projid, caseid, studyid, row,totalSeries){
        window.selProjects[projid].selCases[caseid].selStudies[studyid] = new Object();
        window.selProjects[projid].selCases[caseid].selStudies[studyid].selSeries = new Object();
        window.selProjects[projid].selCases[caseid].selStudies[studyid]['state'] = new Object();
        window.selProjects[projid].selCases[caseid].selStudies[studyid]['state']['view']=false;
        window.selProjects[projid].selCases[caseid].selStudies[studyid]['state']['checked']=false;
        window.selProjects[projid].selCases[caseid].selStudies[studyid]['totalChild'] = totalSeries;

        window.selProjects[projid].selCases[caseid].selStudies[studyid]['numChildFullCheck'] = 0;
        window.selProjects[projid].selCases[caseid].selStudies[studyid]['numChildMixCheck'] = 0;
        window.selProjects[projid].selCases[caseid].selStudies[studyid]['numChildNoCheck'] = totalSeries;

        window.selProjects[projid].selCases[caseid].selStudies[studyid]['totalSeries']=$(row).attr('data-totalseries');

    }


    removeFromView = function(type, ref){
        var projid=ref[0];
        var caseid='';
        var studyid='';
        var seriesid='';
        var parDic=new Object();
        var curDic = new Object();
        var childDic = new Object();
        var table='';
        var datatype='';
        var id='';
        var childType='';

        if (type=='project'){

            parDic=window.selProjects;
            curDic=window.selProjects[projid];
             id=projid;
            childDic=window.selProjects[projid].selCases;
            childType='case';
            table='projects_table';
            datatype='data-projectid'

        }
        if (type=='case'){
            caseid=ref[1]
            parDic=window.selProjects[projid].selCases
            id=caseid;
            curDic=window.selProjects[projid].selCases[caseid];
            childDic=window.selProjects[projid].selCases[caseid].selStudies;
            childType='study';
            table='cases_table';
            datatype='data-caseid';
        }
        if (type=='study'){
            caseid=ref[1];
            studyid=ref[2];
            parDic=window.selProjects[projid].selCases[caseid].selStudies;
            id=studyid;
            curDic=window.selProjects[projid].selCases[caseid].selStudies[studyid];
            table='studies_table';
            datatype='data-studyid';
        }

        if ( ($('#'+table).find('['+datatype+'="'+id+'"]').find('.fa-cart-shopping').hasClass('partselected')) || ('selection' in curDic['state']) ){
            curDic['state']['view']=false;
            if (!(type=='study')){
                  for (item in childDic){
                     childRef=[...ref,item]
                     removeFromView(childType,childRef)
                 }
              }

            }
        else{
            delete(parDic[id]);
        }

    }

    window.updateMultipleRowsa=function(table,add,type){
        rowA=$(table).find('tbody').children();
        rowArr = new Array();
        $(rowA).each(function(){
                $(this).children('.ckbx').children().prop("checked",add);
                rowArr.push($(this))
        });
        if (type === 'projects'){
            updateProjectSelection(rowArr);
        }
        else {
            updateCasesOrStudiesSelection(rowA, type, true);
        }
    }

    window.updateDescSelections =  function(dic,tbl,type){
        if (type ==='cases'){
            for (studyid in dic.selStudies){
                if ('select' in (dic.selStudies['state'])){
                    cref='#study_'+studyid;
                    $(tbl).find('#study_'+studyid).find('.fa-cart-shopping').removeClass('selected');
                    $(tbl).find('#study_'+studyid).find('.fa-cart-shopping').removeClass('unselected');
                    $(tbl).find('#study_'+studyid).find('.fa-cart-shopping').removeClass('partselected');


                    updateDescSelections = updateDescSelections(dic.selStudies[studyid],$('#series_table')[0],'studies');

                    if (('view' in dic.selStudies['state']) && (dic.selStudies['state']['view'])){
                        delete dic.selStudies[studyid]['state']['select']
                    }
                    else{
                        delete dic.selStudies[studyid];
                    }
                }

            }
        }
        else if (type ==='studies'){
            for (seriesid in dic.selSeries){
                if ('select' in (dic.selSeries['state'])){
                    cref='#series_'+seriesid;
                    $(tbl).find('#series_'+seriesid).find('.fa-cart-shopping').removeClass('selected');
                    $(tbl).find('#series_'+seriesid).find('.fa-cart-shopping').removeClass('unselected');
                    $(tbl).find('#series_'+seriesid).find('.fa-cart-shopping').removeClass('partselected');

                    if (('view' in dic.selSeries['state']) && (dic.selSeries['state']['view'])){
                        delete dic.selSeries[seriesid]['state']['select']
                    }
                    else{
                        delete dic.selSeries[seriesid];
                    }
                }

            }
        }


    }


    clearChildStates=function(id,selected,ptype){

        var tbls=[];
        var dataid=''

        if (ptype=='project')
        {
            tbls=['cases_table','studies_table','series_table'];
            dataid='data-projectid';
        }
        else if (ptype='case'){
            tbls=['studies_table','series_table'];
            dataid='data-caseid';
        }
        else if (ptype='study'){
            tbl=['series_table'];
            dataid='data-studyid';
        }


        var state="";
        var nstate="";
        if (selected){
            state="selected";
            nstate="unselected";
        }
        else{
            state="unselected";
            nstate="selected";
        }
        for (var i=0;i<tbls.length;i++)
        {
            tbl=tbls[i]
            $('#' + tbl).find('[' + dataid + '="'+ id + '"]').find('.fa-cart-shopping').each(function () {
                $(this).removeClass('partselected');
                $(this).removeClass(nstate);
                $(this).addClass(state);

            });
        }

    }

    clearProjectChildTableStates =function(projectid,selected){
        var state="";
        var nstate="";
        if (selected){
            state="selected";
            nstate="unselected";
        }
        else{
            state="unselected";
            nstate="selected";
        }

        $('#cases_table').find('[data-projectid='+projectid+']').find('.fa-cart-shopping').each(function(){
            $(this).removeClass('none');
            $(this).removeClass('partselected');
            $(this).removeClass(nstate);
            $(this).addClass(state);
        });
        $('#studies_table').find('[data-projectid='+projectid+']').find('.fa-cart-shopping').each(function(){
            $(this).removeClass('none');
            $(this).removeClass('partselected');
            $(this).removeClass(nstate);
            $(this).addClass(state);

        });
        $('#series_table').find('[data-projectid='+projectid+']').find('.fa-cart-shopping').each(function(){
            $(this).removeClass('none');
            $(this).removeClass('partselected');
            $(this).removeClass(nstate);
            $(this).addClass(state);
        });

    }

    clearCaseChildTableStates =function(caseid,selected){
        var state="";
        var nstate="";
        if (selected){
            state="selected";
            nstate="unselected";
        }
        else{
            state="unselected";
            nstate="selected";
        }
        $('#studies_table').find('[data-caseid='+caseid+']').find('.fa-cart-shopping').each(function(){
            $(this).removeClass('none');
            $(this).removeClass('partselected');
            $(this).removeClass(nstate);
            $(this).addClass(state);
        });
        $('#series_table').find('[data-caseid='+caseid+']').find('.fa-cart-shopping').each(function(){
            $(this).removeClass('none');
            $(this).removeClass('partselected');
            $(this).removeClass(nstate);
            $(this).addClass(state);
        });

    }

    clearStudyChildTableStates =function(studyid,selected){
        var state="";
        var nstate="";
        if (selected){
            state="selected";
            nstate="unselected";
        }
        else{
            state="unselected";
            nstate="selected";
        }

        $('#series_table').find('[data-studyid='+studyid+']').find('.fa-cart-shopping').each(function(){
            $(this).removeClass('none');
            $(this).removeClass('partselected');
            $(this).removeClass(nstate);
            $(this).addClass(state);
        });
    }




    clearChildSelections = function(ids){
        //items=['selProjects','selCases','selStudies','selSeries'];
        var curDic = new Object();
        var parDic= new Object();
        if ((ids.length==1) && (ids[0] in window.selProjects) && ('selCases' in window.selProjects[ids[0]])){

           parDic=window.selProjects[ids[0]];
           curDic=window.selProjects[ids[0]].selCases
        }
        else if ((ids.length==2) && (ids[0] in window.selProjects) && (ids[1] in window.selProjects[ids[0]].selCases) && ('selStudies' in window.selProjects[ids[0]].selCases[ids[1]].selStudies)){
            parDic=window.selProjects[ids[0]].selCases[ids[1]];
            curDic=window.selProjects[ids[0]].selCases[ids[1]].selStudies
        }
        else if ((ids.length==3) && (ids[0] in window.selProjects) && (ids[1] in window.selProjects[ids[0]].selCases) && (ids[2] in window.selProjects[ids[0]].selCases[ids[1]].selStudies) && ('selSeries' in window.selProjects[ids[0]].selCases[ids[1]].selStudies[ids[2]])){
            parDic=window.selProjects[ids[0]].selCases[ids[1]].selStudies[ids[2]];
            curDic=window.selProjects[ids[0]].selCases[ids[1]].selStudies[ids[2]].selSeries
        }

        for (nxtid in curDic){
            parDic.numChildFullCheck=0;
            parDic.numChildMixCheck=0;
            parDic.numChildNoCheck=parDic.totalChild;
          parDic.parselDescNum=0;
          if (curDic[nxtid]['state']['view']){
              if ('selection' in curDic[nxtid]['state']) {
                  delete curDic[nxtid]['state']['selection']
                  delete curDic[nxtid]['state']['checked'];
              }
              nids=[...ids,nxtid]
              clearChildSelections(nids);
          }
          else{
              delete curDic[nxtid]
          }
      }

    }
   /*
     window.selProjects[projid].selCases[caseid]['totalChild'] = totalStudies;

        window.selProjects[projid].selCases[caseid]['numChildFullCheck'] = 0;
        window.selProjects[projid].selCases[caseid]['numChildMixCheck'] = 0;
        window.selProjects[projid].selCases[caseid]['numChildNoCheck'] = totalStudies; */

    clearProjectChildSelections = function(projectid){
      for (caseid in window.selProjects[projectid].selCases){
          if (window.selProjects[projectid].selCases[caseid]['state']['view']){
              if ('selection' in window.selProjects[projectid].selCases[caseid]['state']) {
                  delete window.selProjects[projectid].selCases[caseid]['state']['selection']
              }
              clearCaseChildSelections(projectid,caseid);
          }
          else{
              delete window.selProjects[projectid].selCases[caseid]
          }
      }
    }

    clearCaseChildSelections = function(projectid,caseid){
      for (studyid in window.selProjects[projectid].selCases[caseid].selStudies){
          if (window.selProjects[projectid].selCases[caseid].selStudies[studyid]['state']['view']){
              if ('selection' in window.selProjects[projectid].selCases[caseid].selStudies[studyid]['state']) {
                  delete window.selProjects[projectid].selCases[caseid].selStudies[studyid]['state']['selection']
              }

              clearStudyChildSelections(projectid,caseid,studyid)
          }
          else{
              delete window.selProjects[projectid].selCases[caseid].selStudies[studyid];
          }
      }
    }

    clearStudyChildSelections = function(projectid,caseid,studyid){
      for (seriesid in window.selProjects[projectid].selCases[caseid].selStudies[studyid].selSeries){
          if (window.selProjects[projectid].selCases[caseid].selStudies[studyid].selSeries[seriesid]['state']['view']){
                if ('selection' in window.selProjects[projectid].selCases[caseid].selStudies[studyid].selSeries[seriesid]['state']) {
                    delete window.selProjects[projectid].selCases[caseid].selStudies[studyid].selSeries[seriesid]['state']['selection']
                }

          }
          else{
              delete window.selProjects[projectid].selCases[caseid].selStudies[studyid];
          }
      }
    }

    window.selectAllData =function(item){
        //alert('here');
        var rowsAdded=false;
        if ($(item).find('.fa-cart-shopping').hasClass('none')){
            rowsAdded=true;
            $(item).find('.fa-cart-shopping').removeClass('none');
            $(item).find('.fa-cart-shopping').addClass('selected');
        }
        else{
            $(item).find('.fa-cart-shopping').addClass('none');
            $(item).find('.fa-cart-shopping').removeClass('selected');
        }

        $('#projects_table').find('tr').each(function()
        {
            row=this
            elem=$(row).find('.fa-cart-shopping')[0]
            projid=$(row).attr('data-projectid');
            if (!(projid in window.selProjects))
                //if (1===1)
                {
                    window.selProjects[projid]=new Object();
                    window.selProjects[projid]['selCases']=new Object();
                    window.selProjects[projid]['state']={'selection':'none'}
                    window.selProjects[projid]['selDescNum']=0;
                    window.selProjects[projid]['unselDescNum']=0;
                    window.selProjects[projid]['partselDescNum']=0;
                    window.selProjects[projid]['viewDescNum']=0;

                }
            window.selProjects[projid]['totalCases']=$(row).attr('totalcases');
            window.selProjects[projid]['totalStudies']=$(row).attr('totalstudy');
            window.selProjects[projid]['totalSeries']=$(row).attr('totalseries');
            if (rowsAdded){

                $(elem).removeClass('none');
                $(elem).removeClass('unselected');
                $(elem).addClass('selected');
                $(elem).removeClass('partselected');
                window.selProjects[projid]['state']['selection']='selected';
                window.selProjects[projid]['state']['added']=true;

            }
            else{
                $(elem).removeClass('none');
                $(elem).removeClass('selected');
                $(elem).addClass('unselected');
                $(elem).removeClass('partselected');
                window.selProjects[projid]['state']['selection']='unselected';
                window.selProjects[projid]['state']['added']=false;
            }

            clearChildStates(projid,rowsAdded,'project');
            clearChildSelections([projid]);


        });
        mksearchtwo();

    }

    window.selectAllVisCases =function(item){
        //alert('here');
        parentUpdated = false;
        var rowsAdded=false;
        if ($(item).find('.fa-cart-shopping').hasClass('unselected')){
            rowsAdded=true;
            $(item).find('.fa-cart-shopping').removeClass('unselected');
            $(item).find('.fa-cart-shopping').addClass('selected');
        }
        else{
            $(item).find('.fa-cart-shopping').addClass('unselected');
            $(item).find('.fa-cart-shopping').removeClass('selected');
        }


        $('#cases_table').find('tr').each(function()
        {
            row=this;
            elem=$(row).find('.fa-cart-shopping')[0]
            projid=$(row).attr('data-projectid');
            caseid=$(row).attr('data-caseid');

            $('#projects_table').find('[data-projectid='+projid+']').find('.fa-cart-shopping').removeClass('none');
            $('#projects_table').find('[data-projectid='+projid+']').find('.fa-cart-shopping').removeClass('selected');
            $('#projects_table').find('[data-projectid='+projid+']').find('.fa-cart-shopping').removeClass('unselected');
            $('#projects_table').find('[data-projectid='+projid+']').find('.fa-cart-shopping').addClass('partselected');
            var totalCases=$('#projects_table').find('[data-projectid='+projid+']').attr('data-totalcases');
            var totalStudies=$('#projects_table').find('[data-projectid='+projid+']').attr('data-totalstudies');
            var totalSeries=$('#projects_table').find('[data-projectid='+projid+']').attr('data-totalseries');


            if (!(projid in window.selProjects))
                //if (1===1)
                {
                    window.selProjects[projid]=new Object();
                    window.selProjects[projid]['selCases']=new Object();
                    window.selProjects[projid]['state']={'selection':'none'}
                    window.selProjects[projid]['selDescNum']=0;
                    window.selProjects[projid]['unselDescNum']=0;
                    window.selProjects[projid]['partselDescNum']=0;
                    window.selProjects[projid]['viewDescNum']=0;
                    window.selProjects[projid]['totalCases']=totalCases;
                    window.selProjects[projid]['totalStudies']=totalStudies;
                    window.selProjects[projid]['totalSeries']=totalSeries;
                }

            if (!(caseid in window.selProjects[projid]['selCases'])){
                window.selProjects[projid].selCases[caseid]=new Object();
                window.selProjects[projid].selCases[caseid]['selStudies']=new Object();
                window.selProjects[projid].selCases[caseid]['state']={'selection':'none'};
                window.selProjects[projid].selCases[caseid]['selDescNum']=0;
                window.selProjects[projid].selCases[caseid]['unselDescNum']=0;
                window.selProjects[projid].selCases[caseid]['partselDescNum']=0;
                window.selProjects[projid].selCases[caseid]['viewDescNum']=0;
                 window.selProjects[projid].selCases[caseid]['totalStudies']=$(this).attr('data-totalstudies');
                 window.selProjects[projid].selCases[caseid]['totalSeries']=$(this).attr('data-totalseries');
            }


            if (rowsAdded){

                $(elem).removeClass('none');
                $(elem).removeClass('unselected');
                $(elem).addClass('selected');
                $(elem).removeClass('partselected');

                if ('selection' in window.selProjects[projid].selCases[caseid]['state']) {
                    if (window.selProjects[projid].selCases[caseid]['state']['selection'] === 'unselected') {
                        window.selProjects[projid].unselDescNum = window.selProjects[projid].unselDescNum - 1;
                    } else if (window.selProjects[projid].selCases[caseid]['state']['selection'] === 'partselected') {
                        window.selProjects[projid].partselDescNum = window.selProjects[projid].partselDescNum - 1;
                    }
                }
                window.selProjects[projid].selDescNum=window.selProjects[projid].selDescNum+1;
                window.selProjects[projid]['state']['selection']='partselected';

                window.selProjects[projid].selCases[caseid]['state']['selection']='selected';
                window.selProjects[projid].selCases[caseid]['state']['added']=true;


            }
            else{
                $(elem).removeClass('none');
                $(elem).removeClass('selected');
                $(elem).addClass('unselected');
                $(elem).removeClass('partselected');

                if ('selection' in window.selProjects[projid].selCases[caseid]['state']) {
                    if (window.selProjects[projid].selCases[caseid]['state']['selection'] === 'selected') {
                        window.selProjects[projid]['selDescNum'] = window.selProjects[projid]['selDescNum'] - 1;
                    } else if (window.selProjects[projid].selCases[caseid]['state']['selection'] === 'partselected') {
                                window.selProjects[projid]['partselDescNum'] = window.selProjects[projid]['partselDescNum'] - 1;
                    }
                }
                window.selProjects[projid]['unselDescNum']=window.selProjects[projid]['unselDescNum']+1;
                window.selProjects[projid]['state']['selection']='partselected';

                window.selProjects[projid].selCases[caseid]['state']['selection']='unselected';
                window.selProjects[projid].selCases[caseid]['state']['added']=false;
            }

            chnglvl= propagateSelection([projid,caseid], rowsAdded);
            if (chnglvl=='project'){
                clearChildStates(projid,rowsAdded,'project');
                clearChildSelections([projid]);
            }
            else{
                clearChildStates(caseid,rowsAdded,'case');
                clearChildSelections([projid,caseid]);
            }


        });
        mksearchtwo();

    }



    var updateCache = function(cache,request,backendReqStrt, backendReqLength,data, colOrder){
        cache.lastRequest = request;
        cache.backendReqStrt=backendReqStrt;
        cache.backendReqLength=backendReqLength;
        cache.cacheLength = data['res'].length;
        cache.recordsTotal = data['cnt'];
        cache.data = data['res'];
        cache.colOrder = colOrder;

    }


    reorderCacheData = function(cache,request,thead){
        function compCols(a,b,col,dir,isNum,hasAux,auxCol,auxIsNum){
            var cmp=0;
            if (isNum){
                cmp=parseFloat(a[col])- parseFloat(b[col]);
            }
            else {
                cmp=(a[col]>b[col] ? 1 :  a[col]==b[col]? 0: -1)
            }

            if (dir ==='desc'){
                cmp=-cmp;
            }

            if ((cmp === 0) && hasAux){
                if (auxIsNum){
                    cmp=parseFloat(a[auxCol])- parseFloat(b[auxCol]);
                }
                else {
                    cmp=(a[auxCol]>b[auxCol] ? 1 :  a[auxCol]==b[auxCol]? 0: -1)
                }

            }
            if (cmp==0){
                cmp=1;
            }
            return cmp;
        }


        var dir = request.order[0]['dir'];
        var colId = parseInt(request.order[0]['column']);
        var col = cache.colOrder[colId];
        var ntmp  = cache.data.slice(0,3);
        var rtmp = new Array();

        isNum = ( $(thead.children('tr').children().get(colId)).hasClass('numeric_data') ? true: false);
        hasAux = ( $(thead.children('tr').children().get(colId)).hasClass('has_aux') ? true: false);

        if (hasAux){
            auxColId = parseInt($(thead.children('tr').children().get(colId)).data('auxid'));
            auxCol = cache.colOrder[auxColId]
            auxIsNum = ( $(thead.children('tr').children().get(auxColId)).hasClass('numeric_data') ? true: false);
        }
        else {
            auxColId=-1
            auxCol=''
            auxIsNum= false;
        }

         cache.data.sort((a,b)=> compCols(a,b,col,dir,isNum,hasAux,auxCol,auxIsNum))

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

    window.filterTable = function(wrapper, type){
        var elem=$('#'+wrapper);
        var varStr=elem.find('.dataTables_controls').find('.'+type+'_inp').val();
        if (type ==="seriesID") {
            window.updateSeriesTable(false, false, true,varStr)
        }

        else if (type ==="studyID") {
            window.updateStudyTable(false, false, true, true, varStr)
        }
        else if (type==="caseID"){
            window.updateCaseTable(false, false,  true, [true,true], [],varStr)
        }
    }

    getKeysByState = function(dic,state){
        var ret=[]
        var keyArr=Object.keys(dic)
        for (i=0;i<keyArr.length;i++){
            var ckey=keyArr[i]
            if ( ('state' in dic[ckey]) && (state in dic[ckey]['state']) && (dic[ckey]['state'][state]) ){
                ret.push(ckey)
            }
        }
        return ret
    }
    getCasesByState = function(state){
        var ret=[];
        for (projid in window.selProjects){
            nkeys=getKeysByState(window.selProjects[projid].selCases,state);
            ret=[...ret,...nkeys];
        }
        return ret;
    }

    getStudiesByState = function(state){
        ret=[];
        for (projid in window.selProjects){
            nkeys=getKeysByState(window.selProjects[projid].selCases,state);
            ret=ret.concat(nkeys);
        }
        return ret;

    }

    addTotals = function(totals, lvl, curDic, alreadyAdded, isSelected) {
        var dictypes = ["selProjects", "selCases", "selStudies", "selSeries"]
        var tots = ["totalProjects","totalCases", "totalStudies", "totalSeries"]
        var nxtAdded = alreadyAdded;
        if (('state' in curDic) && ('checked' in curDic['state'])) {
            if (curDic['state']['checked']) {
                isSelected = (isSelected) ? false : true;
            }
        }

        if (alreadyAdded) {
            if (!isSelected) {
                for (var i = lvl + 1; i < tots.length; i++) {
                    totals[i] = totals[i] - parseInt(curDic[tots[i]]);
                }
                nxtAdded = false;

                if ((curDic['numChildMixCheck'] == 0) || (curDic['numChildFullCheck'] == 0)) {
                    totals[lvl] = totals[lvl] - 1;
                }
            }

        }

        if (!alreadyAdded) {
            if (isSelected) {
                totals[lvl] = totals[lvl] + 1;
                for (var i = lvl + 1; i < tots.length; i++) {
                    totals[i] = totals[i] + parseInt(curDic[tots[i]])
                }
                nxtAdded = true;
            } else if ((curDic['numChildMixCheck'] > 0) || (curDic['numChildFullCheck'] > 0)) {
                totals[lvl] = totals[lvl] + 1;
            }

        }

        if (lvl < 4) {
          var nlvl=lvl+1;
          var nxtDicO = curDic[dictypes[nlvl]]
          for (var ky  in nxtDicO) {
                var nxtDic=nxtDicO[ky]
                addTotals(totals, nlvl, nxtDic, nxtAdded, isSelected)
           }
        }

    }

    mksearchtwo =function() {
        var totals = [0, 0, 0, 0];
        for (project in window.selProjects) {
            var curDic = window.selProjects[project];
            addTotals(totals, 0, curDic, false, false)
        }

          $('#search_def_stats').removeClass('notDisp');
          $('#search_def_stats').html(totals[0].toString() + " Collections, " +
                                 totals[1].toString() + " Cases, " +
                                totals[2].toString()+" Studies, and " +
                                totals[3].toString()+" Series currently in the filterset<br>" +
              "? Collections, ? Cases, and ? Studies, and ? Series in the cart") ;

          window.currentCart=totals[0];
          window.currentSet= totals[0];
          val=$('#filter-option-modal').find('input[name="filtchoice"]:checked').val();

          if ((val=='cancel') && window.choiceMade && (window.currentSet>0)){
             $('.search-scope').find("input:checkbox").attr("disabled",true);
             $('.search-configuration').find("input:checkbox").attr("disabled",true);
          }
          else{
              $('.search-scope').find("input:checkbox").attr("disabled",false);
             $('.search-configuration').find("input:checkbox").attr("disabled",false);
          }


    }




    determineCheckTree = function(curDic){
        dicState='';
        if ( (curDic['numChildMixCheck']>0) ||   (curDic['numChildFullCheck']>0) ){
            dicState ='mix';
        }
        else if ( ('state' in curDic) && ('checked' in curDic['state'])){
            if (curDic['state']['checked']){
                dicState = 'full'
            }
            else{
                dicState = 'none';
            }
        }
        else{
            dicState='none';
        }
     return dicState;
    }

    propagateSelection = function(ids, isChecked){
        var dicSet=['selProjects', 'selCases', 'selStudies'];
        var tableSet=['projects_table', 'cases_table', 'studies_table'];
        var dataSet=['data-projectid','data-caseid','data-studyid']
        var parDicA=new Array();
        var parDic=window;
        var nclked = 0;
        for (var i=0;i<ids.length-1;i++){
            parDic=parDic[dicSet[i]][ids[i]];
            parDicA.push(parDic);

        }

        tableSet = tableSet.splice(0,ids.length-1).reverse();
        dataSet = dataSet.splice(0,ids.length-1).reverse();
        nids = [...ids].splice(0,ids.length-1).reverse();
        curDic=parDic[dicSet[ids.length-1]][ids[ids.length-1]]
        var dicSetR= dicSet.slice(0,ids.length).reverse();

        parDicA.reverse();
        var oldDicState;
        var curDicState;

         if (isChecked){
            oldDicState = 'none';
            curDicState = 'full';
        }
        else if (!isChecked){
            oldDicState ='full';
            curDicState='none';
        }
        if ( (curDic['numChildMixCheck']>0) ||   (curDic['numChildFullCheck']>0) ){
            oldDicState ='mix';
        }

        for (var i=0;i<parDicA.length;i++){
            parDic=parDicA[i];
            cdic=dicSetR[i];
            tableid=tableSet[i];
            dataid=dataSet[i];
            id = nids[i];
            var oldParDicState;
            var parsel='';
            oldParDicState = determineCheckTree(parDic);

            statemp={"full":"numChildFullCheck", "mix":"numChildMixCheck", "none":"numChildNoCheck"};

            parDic[statemp[oldDicState]] = parDic[statemp[oldDicState]] - 1;
            parDic[statemp[curDicState]] = parDic[statemp[curDicState]] + 1;


           if (parDic['numChildFullCheck']==parDic['totalChild']){
               if (!('state' in parDic)){
                   parDic['state'] = new Object();
                   parDic['state']['checked'] = true;
                   parDic['state']['view'] = false;
               }
               else{
                  parDic['state']['checked'] = (parDic['state']['checked']) ? false : true;
               }

               parDic['numChildFullCheck']=0;
               parDic['numChildMixCheck']=0;
               parDic['numChildNoCheck']=parDic['totalChild'];
               csets=parDic[cdic];
               for (ind in csets){
                   rdic=parDic[cdic][ind];
                   if ('state' in rdic){
                       rdic['state']['checked']=false;
                   }
                   rdic['numChildMixCheck']=0;
                   rdic['numChildFullCheck']=0;
                   rdic['numChildNoCheck']=rdic['totalChild'];
               }
           }

           var curParDicState = determineCheckTree(parDic);

           if (parDic['numChildNoCheck']<parDic['totalChild']){
               parsel='partselected';
           }
           else if ('state' in parDic){
               if (parDic['state']['checked']){
                   parsel='selected';
               }
               else{
                   parsel='unselected';
               }
           }
           else{
               parsel='selected';
           }

           $('#'+tableid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('partselected');
           $('#'+tableid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('unselected');
           $('#'+tableid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('selected');
           $('#'+tableid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').addClass(parsel);

           curDicState=curParDicState;
           oldDicState=oldParDicState;
        }
    }

    /*window.selProjects[project]['selCases']=new Object();
        window.selProjects[project]['state']={'view':false, 'checked':false};
        window.selProjects[project]['totalChild']=stats['patient_per_collec'][project];;
        window.selProjects[project]['numChildFullCheck']=0;
        window.selProjects[project]['numChildMixCheck']=0
        window.selProjects[project]['numChildNoCheck']=0;
        window.selProjects[project]['numClicksAbove']=0; */

    /*
    propagateSelection = function(ids, rowsAdded){
        var retval="";
        var tblid="";
        var dataid="";
        var id="";
        var nids=[];
        var total=0;
        var curDic = new Object();
        var parDic = new Object();
        var defaultAdd = false;


        if (ids.length==2){
            retval='case';
            tblid='projects_table';
            dataid='data-projectid';
            id=ids[0];
            curDic=window.selProjects[id]
            total=curDic.totalCases
            if (('state' in window.selProjects[id]) && ('added' in window.selProjects[id]['state'])) {
                defaultAdd = window.selProjects[id]['state']['added']
            }
            else{
                defaultAdd=false;
            }
        }
        else if (ids.length==3){
            retval='study';
            id=ids[1];
            tblid='cases_table';
            dataid='data-caseid';
            nids=[ids[0],ids[1]];
            curDic=window.selProjects[ids[0]].selCases[ids[1]];
            parDic=window.selProjects[ids[0]];
            total=curDic.totalStudies;
            if ( ('state' in curDic) && ('added' in curDic['state'])){
               defaultAdd= curDic['state']['added']
            }
            else if ( ('state' in parDic) && ('added' in parDic['state']))
            {
                defaultAdd= parDic['state']['added']
            }
            else{
                defaultAdd=false;
            }

        }
        else if (ids.length==4){
            retval='series';
            id=ids[2];
            tblid='series_table';
            dataid='data-seriesid';
            nids=[ids[0],ids[1],ids[2]];
            curDic=window.selProjects[ids[0]].selCases[ids[1]].selStudies[ids[2]];
            parDic=window.selProjects[ids[0]].selCases[ids[1]];
            total=curDic.totalSeries;
        }

        if (rowsAdded && ((defaultAdd && (curDic.unselDescNum==0) && (curDic.partselDescNum==0)) || (!defaultAdd && (curDic.selDescNum==total)) )){
            $('#'+tblid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('partselected');
            $('#'+tblid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('unselected');

            if (ids.length>2) {
                if (curDic['state']['view'] == 'unselected') {
                    parDic.unselDesc = parDic.unselDesc - 1;
                    parDic.selDesc = parDic.selDesc + 1
                } else if (curDic['state']['view'] == 'partselected') {
                    parDic.unselDesc = parDic.unselDesc - 1;
                    parDic.selDesc = parDic.selDesc + 1
                }
            }
            curDic['state']['added']=true;
            curDic['state']['selection']='selected';

            if (ids.length==2) {
                curDic['state']['selection']='selected';
                $('#' + tblid).find('[' + dataid + '="' + id + '"]').find('.fa-cart-shopping').addClass('selected');
                retval='project';
            }
            else{
                curDic['state']['selection']='selected';
                $('#' + tblid).find('[' + dataid + '="' + id + '"]').find('.fa-cart-shopping').addClass('selected');
                retval =propagateSelection(nids,rowsAdded)
            }

        }
        else if ((!rowsAdded) && ((!defaultAdd && (curDic.selDescNum==0) && (curDic.partselDescNum==0)) || (defaultAdd && (curDic.unselDescNum==total)) )   ){
          $('#'+tblid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('partselected');
          $('#'+tblid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('selected');
          $('#'+tblid).find('['+dataid+'="'+id+'"]').find('.fa-cart-shopping').removeClass('none');
          $('#' + tblid).find('[' + dataid + '="' + id + '"]').find('.fa-cart-shopping').addClass('unselected');

          if (ids.length>2) {
              if (curDic['state']['view'] == 'selected') {
                  parDic.selDesc = parDic.selDesc - 1;
                  parDic.unselDesc = parDic.unselDesc + 1
              } else if (curDic['state']['view'] == 'parselected') {
                  parDic.parselDesc = parDic.parselDesc - 1;
                  parDic.unselDesc = parDic.unselDesc + 1
              }
          }
            curDic['state']['added']=false;
            curDic['state']['selection']='unselected';
          curDic['state']['added']=false;
          if (ids.length==2){
             retval='project';
           }
          else {
             retval=propagateSelection(nids,rowsAdded);
           }
        }

    return retval;

    }

     */

    propagateCaseSelection =function(collection_id, PatientID, rowsAdded){
        if ((rowsAdded) && (window.selProjects[data['collection_id'][0]].selDescNum ===window.selProjects[data['collection_id'][0]].totalCases) ){
            window.selProjects[data['collection_id'][0]]['state']['selection']='none';
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('partselected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('unselected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').addClass('selected');

            clearProjectChildTableStates(data['collection_id'][0],rowsAdded);
            clearProjectChildSelections(data['collection_id'][0]);

        }
        else if ((!rowsAdded) && (window.selProjects[data['collection_id'][0]].unselDescNum === window.selProjects[data['collection_id'][0]].totalCases)  ){
            window.selProjects[data['collection_id'][0]]['state']['selection']='unselected'
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('partselected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('selected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').addClass('none');

            clearProjectChildTableStates(data['collection_id'][0],rowsAdded);
            clearProjectChildSelections(data['collection_id'][0]);
        }

        else{

            clearCaseChildTableStates(data['collection_id'][0],rowsAdded);
            clearCaseChildSelections(data['collection_id'][0], data['PatientID']);

        }

    }

    /*propagateSeriesSelection=function(collection_id, PatientID,StudyInstanceUID,rowsAdded){
        if ((rowsAdded) && (window.selProjects[collection_id].selDescNum === window.selProjects[collection_id].totalCases)){
            window.selProjects[data['collection_id'][0]]['state']['selection']='none';
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('partselected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('unselected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').addClass('none');

            clearProjectChildTableStates(data['collection_id'][0],rowsAdded);
            clearProjectChildSelections(data['collection_id'][0]);

        }
        else if ((!rowsAdded) && (window.selProjects[data['collection_id'][0]].unselDescNum === window.selProjects[data['collection_id'][0]].totalCases)  ){
            window.selProjects[data['collection_id'][0]]['state']['selection']='unselected'
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('partselected');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').removeClass('none');
            $('#projects_table').find('[data-projectid='+data['collection_id'][0]+']').find('.fa-cart-shopping').addClass('unselected');

            clearProjectChildTableStates(data['collection_id'][0],rowsAdded);
            clearProjectChildSelections(data['collection_id'][0]);

        }

        else{
                          clearCaseChildTableStates(data['collection_id'][0],rowsAdded);
                          clearCaseChildSelections(data['collection_id'][0], data['PatientID']);
        }

    } */

    determineStudySelection = function(collection_id, PatientID, StudyID){
        ret="unselected";
        hasPatientDic=false;
        patientDic=new Object();
        hasStudyDic=false;
        studyDic = new Object();

        if (PatientID in window.selProjects[collection_id].selCases){
            hasPatientDic=true;
            patientDic=window.selProjects[collection_id].selCases[PatientID];
            if (StudyID in patientDic.selStudies){
                hasStudyDic=true;
                studyDic= patientDic.selStudies[StudyID];
            }
        }

        if (hasStudyDic && ('selection' in studyDic['state']) ){
            ret=studyDic['state']['selection'];
        }
        else if (hasStudyDic && ('added' in studyDic['state']) ){
            if (studyDic['state']['added']){
                ret='selected';
            }
            else {
                ret='unselected';
            }

        }
        else if (hasPatientDic && ('selection' in patientDic['state']) && ( ( patientDic['state']['selection'] =='selected') || ( patientDic['state']['selection'] =='unselected')) ){
            ret=patientDic['state']['selection'];
        }
        else if (hasPatientDic && ('added' in patientDic['state']) ){
            if (hasStudyDic['state']['added']){
                ret='selected';
            }
            else {
                ret='selected';
            }

        }
        else if ( ('selection' in window.selProjects[collection_id]['state']) && (window.selProjects[collection_id]['state']['selection']=='selected')){
            ret='selected'
        }
        else if ( ('selection' in window.selProjects[collection_id]['state']) && (window.selProjects[collection_id]['state']['selection']=='unselected')){
            ret='unselected'
        }
        else if ( ('added' in window.selProjects[collection_id]['state']) && (window.selProjects[collection_id]['state']['added'])){
            ret='selected'
        }
        else if ( ('added' in window.selProjects[collection_id]['state']) && !(window.selProjects[collection_id]['state']['added'])){
            ret='unselected'
        }

        return ret;
    }


    var pretty_print_id = function (id) {
        var newId = id.slice(0, 8) + '...' + id.slice(id.length - 8, id.length);
        return newId;
    }

    var sortTable = function (tbl, curInd, asc) {
        var thd = $(tbl).find('thead').find('th')[curInd];
        var isSeries = ( ($(tbl).find('tbody')[0].id === 'series_table') ? true : false);
        rowSet = $(tbl).find('tbody').children();
        rowSet = rowSet.sort(function (a, b) {

            item1 = $(a).children()[curInd].innerText;
            item2 = $(b).children()[curInd].innerText;
            if (thd.classList.contains('numeric_data')) {
                item1 = parseFloat(item1);
                item2 = parseFloat(item2);
            }

            if (item1 ===item2){
                if ( isSeries && (curInd===0)){
                    var seriesNuma = parseInt( $(a).children()[1].innerText  );
                    var seriesNumb = parseInt( $(b).children()[1].innerText  );
                    if (seriesNuma === seriesNumb){
                        return 0;
                    } else if (((seriesNuma > seriesNumb) )){
                        return 1;
                    } else {
                        return -1;
                    }
                } else {
                   return 0;
                }
            } else if (((item1 > item2) && asc) || ((item2 > item1) && !asc)) {
                return 1;
            } else {
                return -1
            }
        });
        $(tbl).find('tbody').append(rowSet);
    };



    function updateFilterSetData(){
       window.filterSet[0]['caches']=[window.casesTableCache,window.studyTableCache,window.seriesTableCache];

    }



    createNewFilterSet = function(curfilt, csel){

        filtSet =new Object();
        filtSet.filterObj = curfilt;
        filtSet['selProjects']= new Object();
        for (program in window.programs) {
            for (project in window.programs[program]['projects']) {
                filtSet['selProjects'][project] = new Object();
                filtSet.selProjects[project]['selCases'] = new Object();
                filtSet.selProjects[project]['state'] = {'view': false, 'checked': false};
                filtSet.selProjects[project]['totalChild'] = window.selProjects[project]['totalChild'];
                filtSet.selProjects[project]['numChildFullCheck'] = 0;
                filtSet.selProjects[project]['numChildMixCheck'] = 0;
                filtSet.selProjects[project]['numChildNoCheck'] = window.selProjects[project]['numChildNoCheck'];
                filtSet.selProjects[project]['numChecksAbove'] = 0;
                filtSet.selProjects[project]['totalCases'] = window.selProjects[project]['totalCases'];
                filtSet.selProjects[project]['totalSeries'] = window.selProjects[project]['totalSeries'];
                filtSet.selProjects[project]['totalStudies'] = window.selProjects[project]['totalStudies'];
            }
        }


        filtSet.casesTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
        filtSet.studyTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
        filtSet.seriesTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
        filtSet.currentSet=0;
        /*
        filtSet['projects_panel'] = $('#projects_panel')[0].cloneNode(true);
        filterSet['cases_panel'] = $('#cases_panel')[0].cloneNode(true); */
        window.filterSet.push(filtSet);
        var nm1=(window.filterSet.length-1).toString();
        var nm2=window.filterSet.length.toString();
        var pg='filtstate'+nm1;
        $('#filtersetdiv').append(' <span id="filt'+nm1+'" class="filts" onclick="changeFilterSet('+nm1+', true)">Filterset '+nm2+'</span>')
        /* localStorage.setItem(pg, document.body.innerHTML);
        localStorage.setItem('divset',document.getElementById('#filtersetdiv').innerHTML); */

        if (csel){
            changeFilterSet(window.filterSet.length-1, true);

        }

    }

    updateFiltControls = function(){
     var filtVal={};
     for (var nkey in window.filterObj){
         var filtSet= window.filterObj[nkey];
         for (var i=0;i<filtSet.length;i++){
             var filt= filtSet[i];
             filtVal[filt]=1;
         }
      }
     $('input:checkbox').each(function(){
         if (this.hasAttribute('data-filter-display-val')){
            var val= this.getAttribute('data-filter-display-val') ;
            if (val in filtVal){
                $(this).prop("checked", true);
            }
            else{
                $(this).prop("checked", false);
            }
         }
     });

    }

    window.changeFilterSet =function(num, doUpdate){
        window.filterSetNum=num
        window.selProjects = window.filterSet[num]['selProjects'];
        window.casesTableCache = window.filterSet[num].casesTableCache;
        window.studyTableCache = window.filterSet[num].studyTableCache;
        window.seriesTableCache = window.filterSet[num].seriesTableCache;
        window.filterObj = window.filterSet[num].filterObj;

        /*
        $('#projects_panel').remove();
        //$('#projects_panel_container').append(window.filterSet[num]['projects_panel']);
        document.getElementById('projects_panel_container').appendChild(window.filterSet[num]['projects_panel']);

        $('#cases_panel').remove();
        */
        /* pg='filtstate'+num.toString();
        document.body.innerHTML=localStorage.getItem(pg);
        $('#filtersetdiv')[0].innerHTML==localStorage.getItem('divset'); */

        $('#filtersetdiv').find('.filts').removeClass('curfilt');
        $('#filtersetdiv').find('#filt'+num.toString()).addClass('curfilt');
        //$('#cases_panel_container').append(window.filterSet[num]['cases_panel']);
         if (doUpdate){
            updateFacetsData(true);
        }
         updateFiltControls();
         filterutils.mkFiltText();
         mksearchtwo();

    }

    initSort = function(sortVal){
        var sortdivs=$('body').find('.sorter')
        for (div in sortdivs){
            $(div).find(":input[value='" + sortVal + "']").click();
        }
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

        plotutils.createPlots('search_orig_set');
        plotutils.createPlots('search_derived_set');
        plotutils.createPlots('tcga_clinical');

        for (project in window.selProjects) {
            initProjectData(project);
        }
        tables.updateProjectTable(window.collectionData,stats);
        updateFilterSetData();



        $('.clear-filters').on('click', function () {
            $('input:checkbox').not('#hide-zeros').not('.tbl-sel').prop('checked',false);
            $('input:checkbox').not('#hide-zeros').not('.tbl-sel').prop('indeterminate',false);
            $('.ui-slider').each(function(){
                setSlider(this.id,true,0,0,true, false);
            })
            $('#search_def_warn').hide();
            window.filterObj= {};

            filterutils.mkFiltText();
            updateFacetsData(true);
            tables.initializeTableData();
             updateProjectTable(window.collectionData,stats);
            $('#cases_tab').DataTable().destroy();
            $('#studies_tab').DataTable().destroy();
            $('#series_tab').DataTable().destroy();
        });

        load_preset_filters();

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
        });


        initSort('num');
        if (document.contains(document.getElementById('history'))){
            updateViaHistory();
        }

    });


});
