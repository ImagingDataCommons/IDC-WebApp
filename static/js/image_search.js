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
        jquery: 'libs/jquery-3.7.1.min',
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
        cartutils: 'cartutils',
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
        'cartutils':['jquery'],
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
    'cartutils',
    'tippy',
    'jquery',
    'underscore',
    'base', // This must ALWAYS be loaded!
    'jquerydt',
    'jqueryui',
    'bootstrap'

], function(plotutils,filterutils,sliderutils, tables, cartutils, tippy,$, _, base) {


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




<<<<<<< HEAD
    window.updateFacetsData = function (newFilt) {
=======
            if (!(filtAtt in window.filterObj)){
                window.filterObj[filtAtt] = new Object();
            }
            window.filterObj[filtAtt]['rng'] = attVal;
            window.filterObj[filtAtt]['type'] = 'ebtw';
        }
        if (updateNow) {
            mkFiltText();
            updateFacetsData(true);
        }
     };

    var mkFiltText = function () {
        var hasTcga = false;
        var tcgaColSelected = false;
        if ((window.filterObj.hasOwnProperty('Program')) && (window.filterObj.Program.indexOf('TCGA')>-1)){
            tcgaColSelected = true;
            $('#tcga_clinical_heading').children('a').removeClass('disabled');
        }  else {
            $('#tcga_clinical_heading').children('a').addClass('disabled');
            if (!($('#tcga_clinical_heading').children('a')).hasClass('collapsed')){
                $('#tcga_clinical_heading').children('a').click();
            }
        }

        var curKeys = Object.keys(filterObj).sort();
        oStringA = new Array();
        accessStr = ''
        var collection = new Array();
        var accessStr=''
        for (i = 0; i < curKeys.length; i++) {
            var addKey = true;
            var curKey = curKeys[i];
            if (curKey.startsWith('Program')) {
                curArr = filterObj[curKey];
                for (var j = 0; j < curArr.length; j++) {
                    if (!(('Program.' + curArr[j]) in filterObj)) {
                        var colName = $('#' + curArr[j]).filter('.collection_name')[0].innerText;
                        collection.push(colName);
                    }
                }
            }
            else
                {
                var realKey="";
                if (curKey.endsWith('_rng')){
                    realKey = curKey.substring(0, curKey.length - 4).split('.').pop();
                }
                else{
                    realKey = curKey.split('.').pop();
                }
                if (curKey.endsWith('_rng') && $('#' + realKey ).hasClass('isQuant')) {
                //var realKey = curKey.substring(0, curKey.length - 4).split('.').pop();
                var disp = $('#' + realKey + '_heading').children().children('.attDisp')[0].innerText;
                if (curKey.startsWith('tcga_clinical') && tcgaColSelected) {
                    disp = 'tcga.' + disp;
                    hasTcga = true;
                } else if (curKey.startsWith('tcga_clinical') && !tcgaColSelected) {
                    addKey = false;
                    break;
                }
                if (addKey) {
                    var fStr = '';
                    if ('rng' in filterObj[curKey]) {
                        if (Array.isArray(filterObj[curKey]['rng'][0])) {
                            pset = new Array()
                            for (var ind = 0; ind < filterObj[curKey]['rng'].length; ind++) {
                                pair = filterObj[curKey]['rng'][ind];
                                pset.push(pair[0].toString() + '-' + pair[1].toString());
                            }
                            fStr += pset.join(", ")
                        } else {
                            fStr += filterObj[curKey]['rng'][0].toString() + '-' + (filterObj[curKey]['rng'][1]).toString();
                        }
                    }
                    if (('rng' in filterObj[curKey]) && ('none' in filterObj[curKey])) {
                        fStr += ', ';
                    }
                    if ('none' in filterObj[curKey]) {
                        fStr += 'None';
                    }

                    var nstr = '<span class="filter-type">' + disp + '</span> IN (<span class="filter-att">' + fStr + '</span>)';
                    oStringA.push(nstr);
                }
            }
                else {
                //var realKey = curKey.split('.').pop();
                var disp = $('#' + realKey + '_heading').children().children('.attDisp')[0].innerText;
                if (curKey.startsWith('tcga_clinical') && tcgaColSelected) {
                    disp = 'tcga.' + disp;
                    hasTcga = true;
                } else if (curKey.startsWith('tcga_clinical') && !tcgaColSelected) {
                    addKey = false;
                    break;
                }
                if (addKey) {
                    var valueSpans = $('#' + realKey + '_list').children().children().children('input:checked').siblings('.value');
                    oVals = new Array();
                    valueSpans.each(function () {
                        oVals.push($(this).text())
                    });

                    var oArray = oVals.sort().map(item => '<span class="filter-att">' + item.toString() + '</span>');
                    nstr = '<span class="filter-type">' + disp + '</span>';
                    var joinElem = $('#' + curKey).find('.join_val').filter(':checked');
                    if (joinElem.length > 0) {
                        var joinstr = joinElem.attr("value");
                        nstr += 'IN (' + oArray.join(joinstr) + ')';
                    } else {
                        nstr += 'IN (' + oArray.join("") + ')';
                    }
                    if (curKey === 'access') {
                        accessStr = nstr;
                    } else {
                        oStringA.push(nstr);
                    }
                }
            }
          }
        }
        if (hasTcga && tcgaColSelected) {
            $('#search_def_warn').show();
        } else {
            $('#search_def_warn').hide();
        }

        if (collection.length>0){
            var oArray = collection.sort().map(item => '<span class="filter-att">' + item.toString() + '</span>');
            nstr = '<span class="filter-type">Collection</span>';
            nstr += 'IN (' + oArray.join("") + ')';
            oStringA.unshift(nstr);
        }
        if (accessStr.length>0){
            oStringA.unshift(accessStr);
        }
        if (oStringA.length > 0) {
            var oString = oStringA.join(" AND");
            document.getElementById("search_def").innerHTML = '<p>' + oString + '</p>';
            document.getElementById('filt_txt').value=oString;
        } else {
            document.getElementById("search_def").innerHTML = '<span class="placeholder">&nbsp;</span>';
            document.getElementById('filt_txt').value="";
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
            mkFiltText();

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

    var updateTablesAfterFilter = function (collFilt, collectionsData){
        var rmSelCases = new Array();
        var usedCollectionData = new Array();
        rmCases = []
        var hasColl = collFilt.length>0 ? true : false;
        for (var i=0;i<window.collectionData.length;i++){
            var cRow = window.collectionData[i];
            var projId=cRow[0];
            if ( (projId in collectionsData) && (!hasColl || (collFilt.indexOf(projId)>-1)) ){
                cRow[3] = collectionsData[projId]['count'];
            }
            else {
               cRow[3] = 0;
            }
            if (cRow[3]===0){
                var projIndex = window.selItems.selProjects.indexOf(projId);
                if (projIndex !==-1) window.selItems.selProjects.splice(projIndex,1);
                if (window.selItems.selCases.hasOwnProperty(projId)) {
                       selCases= window.selItems.selCases[projId];
                       for (j=0;j<selCases.length;j++){
                           var selCase = selCases[j];
                           rmSelCases.push(selCase);
                           delete window.selItems.selStudies[selCase];
                       }

                    delete window.selItems.selCases[projId];
                }
            }
            else {
                usedCollectionData.push(cRow);
            }

        }

        updateProjectTable(usedCollectionData);
        updateCaseTable(false, false, true, [false,false], rmSelCases,'');
    }

    window.updateProjectSelection = function(rowA){
    var purgeChildSelections=[false,false]
    var rowsAdded=false;
    var rowsRemoved=false;

    rowA.forEach(function(row) {
    projid = $(row).data('projectid');
    if ($(row).children('.ckbx').children().is(':checked')) {
        if (window.selItems.selProjects.indexOf(projid) < 0) {
            window.selItems.selProjects.push(projid);
            rowsAdded = true
        }
    } else {
        rowsRemoved = true;
        var removedProjects = new Array();
        if (window.selItems.selProjects.indexOf(projid) > -1) {
            ind = window.selItems.selProjects.indexOf(projid);
            window.selItems.selProjects.splice(ind, 1);
            removedProjects.push(projid);
        }
        if (removedProjects.length > 0) {
            purgeChildSelections = cleanChildSelections(removedProjects, 'projects', false);
        }
    }
    });

    var caseID='';
    if ($('#cases_panel').find('.caseID_inp').length>0){
    caseID = $('#cases_panel').find('.caseID_inp').val().trim();
    }
    updateCaseTable(rowsAdded, rowsRemoved, false, purgeChildSelections,[],caseID);
    }

    window.updateMultipleRows=function(table,add,type){
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
            updateCasesOrStudiesSelection(rowA, type);
        }
    }

    window.updateCasesOrStudiesSelection = function(rowA, type){
        var purgeChildTables=[false];
        var rowsAdded= ($(rowA[0]).children('.ckbx').children().is(':checked') )?true:false

        if (rowsAdded) {
            $(rowA).each(function() {

                if (type === 'cases') {
                    parentid = $(this).data('projectid');
                    childid = $(this).data('caseid');
                    curDic = window.selItems.selCases;
                    nextDic = window.selItems.selStudies;
                } else if (type === 'studies') {
                    parentid = $(this).data('caseid');
                    childid = $(this).data('studyid');
                    curDic = window.selItems.selStudies;
                }
                if (!(parentid in curDic)) {
                    curDic[parentid] = new Array();
                }
                if (curDic[parentid].indexOf(childid) < 0) {
                    curDic[parentid].push(childid)
                }

            });
        }
        else {
            rowsRemoved = new Array();
            $(rowA).each(function(){
                if (type === 'cases') {
                    parentid = $(this).data('projectid');
                    childid = $(this).data('caseid');
                    curDic = window.selItems.selCases;
                    nextDic = window.selItems.selStudies;
                }
                else if (type === 'studies') {
                    parentid = $(this).data('caseid');
                    childid = $(this).data('studyid');
                    curDic = window.selItems.selStudies;
                }

                if (parentid in curDic) {
                    if (curDic[parentid].indexOf(childid) > -1) {
                        ind = curDic[parentid].indexOf(childid);
                        curDic[parentid].splice(ind, 1);
                        rowsRemoved.push(childid);
                        if (curDic[parentid].length==0){
                            delete curDic[parentid];
                        }
                    }

                }
             });
             if ( (type ==='cases') && (rowsRemoved.length > 0)) {
                 purgeChildTables = cleanChildSelections(rowsRemoved, 'cases',false);
             }

        }
        if (type==='cases'){
            var studyID="";
            if ($('#studies_tab').find('.studyID-inp').length>0) {
                studyID=$('#studies_tab').find('.studyID-inp').val();
            }
            updateStudyTable(rowsAdded,!rowsAdded,false,purgeChildTables, studyID);
        }
        else if (type==='studies'){
            var seriesID="";
            if ($('#series_tab').find('.seriesID-inp').length>0) {
                seriesID=$('#series_tab').find('.seriesID-inp').val();
            }
            updateSeriesTable(rowsAdded,!rowsAdded,false,seriesID);
        }
    }

    cleanChildSelections = function(removedItems,itemType,cleanAll){
        var removedChildItems = new Array();
        var itemsRemoved = false;
        var updateChildTable = new Array();
        if (itemType ==='projects'){
            childDic=window.selItems.selCases
        }
        else if (itemType==='cases'){
            childDic=window.selItems.selStudies
        }
        if (cleanAll){
            removedItems = Object.keys(childDic);
        }
        for (i=0;i<removedItems.length;i++){
            id = removedItems[i];
            if (id in childDic)
            {
                removedChildItems = removedChildItems.concat(childDic[id]);
                delete childDic[id];
            }
        }
        if ((itemType==='projects') && ((removedChildItems.length>0)|| cleanAll)){
            let ret = cleanChildSelections(removedChildItems,'cases',cleanAll);
            updateChildTable = [true,ret[0]];
        }

        else {
            updateChildTable= ((removedChildItems.length>0) || cleanAll) ? [true]:[false]
        }
        return updateChildTable;
    }

    updateProjectTable = function(collectionData) {
        $('#proj_table').DataTable().destroy();
        $('#proj_table').DataTable(
            {
                "dom": '<"dataTables_controls"ilpf>rt<"bottom"><"clear">',
                "order": [[1, "asc"]],
                "data": collectionData,
                "createdRow": function (row, data, dataIndex) {
                    $(row).data('projectid', data[0]);
                    $(row).attr('id', 'project_row_' + data[0]);
                    $(row).on('click', function(event) {
                        var elem = event.target;
                        if ((!$(elem).hasClass('collection_info')) && (!$(elem).hasClass('copy-this-table')) && (!$(elem).hasClass('fa-copy'))){
                            if (!$(elem).parent().hasClass('ckbx')) {
                                ckbx = $(elem).closest('tr').find('.ckbx').children()
                                ckbx.prop("checked", !ckbx.prop("checked"));
                             }
                        updateProjectSelection([$(this)]);
                       }
                       if ($(elem).hasClass('collection_info')){
                           displayInfo($(elem));
                       }
                    });
                    $(row).find('.collection_info').on("mouseenter", function(e){
                        $(e.target).addClass('fa-lg');
                        $(e.target).parent().parent().data("clickForInfo",false);;
                      });
                $(row).find('.collection_info').on("mouseleave", function(e){
                      $(e.target).parent().parent().data("clickForInfo",false);
                      $(e.target).removeClass('fa-lg');
                  //$(e.target).css('style','background:transparent')
                  });


                },
                "columnDefs": [
                    {className: "ckbx text_data", "targets": [0]},
                    {className: "collex_name", "targets": [1]},
                    {className: "projects_table_num_cohort", "targets": [3]},
                ],
                "columns": [
                    {
                        "type": "html", "orderable": false, render: function (data) {
                            if (window.selItems.selProjects.indexOf(data)>-1) {
                                return '<input type="checkbox" checked>'
                            }
                            else {
                                return '<input type="checkbox">'
                            }
                        }
                    },
                    {"type": "html", "orderable": true, render: function (td, data, row){
                        return '<span id="'+row[0]+'"class="collection_name value">'+row[1]+'</span>\n' +
                            '<span><i class="collection_info fa-solid fa-info-circle" value="'+row[0]+'" data-filter-display-val="'+row[1]+'"></i></span>'+
                            ' <a class="copy-this-table" role="button" content="' + row[0] +
                                '" title="Copy the IDC collection_id to the clipboard"><i class="fa-solid fa-copy"></i></a>'

                        }},
                    {"type": "num", orderable: true},
                    {
                        "type": "num", orderable: true, "createdCell": function (td, data, row) {
                            $(td).attr('id', 'patient_col_' + row[0]);
                            return;
                        }
                    }
                ]
            }
        );
        //"createdCell":function(td,data,row){$(td).attr("id","patient_col_"+row[1]);}
        $('#proj_table').children('tbody').attr('id', 'projects_table');
        $('#proj_table')[0].style.width=null;
    }

    //checkClientCache(request,'cases');

    var updateCache = function(cache,request,backendReqStrt, backendReqLength,data, colOrder){
        cache.lastRequest = request;
        cache.backendReqStrt=backendReqStrt;
        cache.backendReqLength=backendReqLength;
        cache.cacheLength = data['res'].length;
        cache.recordsTotal = data['cnt'];
        cache.data = data['res'];
        cache.colOrder = colOrder;

    }

    var checkClientCache = function(request, type){
        var cache;
        var reorderNeeded = false;
        var updateNeeded = true;
        if (request.draw ===1){
            updateNeeded = true;
        }
        else {
            if (type === 'cases') {
                cache = window.casesCache;
            } else if (type === 'studies') {
                cache = window.studiesCache;
            } else if (type === 'series') {
                cache = window.seriesCache;
            }

            if ((cache.lastRequest.order[0]['column'] === request.order[0]['column']) && (cache.lastRequest.order[0]['dir'] === request.order[0]['dir'])) {
                if ( (cache.backendReqStrt<=request.start) && ( (cache.backendReqStrt+cache.backendReqLength) >= (request.start+request.length)  )){
                    updateNeeded=false;
                }
                else {
                    updateNeeded = true;
                }
            } else if (cache.cacheLength===cache.recordsTotal){
                updateNeeded = false;
                reorderNeeded=true;
            }
            else {
                updateNeeded = true;
            }
        }
        return [updateNeeded , reorderNeeded];
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

    window.updateCaseTable = function(rowsAdded, rowsRemoved, refreshAfterFilter,updateChildTables, rmSelCases, caseID) {
        $('#cases_tab').data('rowsremoved',rowsRemoved);
        $('#cases_tab').data('refreshafterfilter',refreshAfterFilter);
        $('#cases_tab').data('updatechildtables',updateChildTables);
        if ($('#cases_tab_wrapper').find('.dataTables_controls').length>0){
            pageRows = parseInt($('#cases_tab_wrapper').find('.dataTables_length select').val());
        } else {
            pageRows = 10;
        }
        $('#cases_tab').DataTable().destroy();
        try{
            $('#cases_tab').DataTable({
                "iDisplayLength": pageRows,
                "autoWidth": false,
                "dom": '<"dataTables_controls"ilp>rt<"bottom"><"clear">',
                "order": [[2, "asc"]],
                "createdRow": function (row, data, dataIndex) {
                    $(row).attr('id', 'case_' + data['PatientID'])
                    $(row).attr('data-projectid', data['collection_id']);
                    $(row).attr('data-caseid', data['PatientID']);
                    $(row).addClass('text_head');
                    $(row).addClass('project_' + data['collection_id']);
                    $(row).on('click', function(event){
                        var elem = event.target;

                        if (!($(elem).is('a')) && !($(elem).hasClass('fa-copy'))){
                            if (!$(elem).parent().hasClass('ckbx')) {
                                ckbx = $(elem).closest('tr').find('.ckbx').children()
                                ckbx.prop("checked", !ckbx.prop("checked"));
                            }
                            updateCasesOrStudiesSelection([$(this)], 'cases');
                        }

                    })
                },
                "columnDefs": [
                    {className: "ckbx", "targets": [0]},
                    {className: "col1 project-name", "targets": [1]},
                    {className: "col1 case-id", "targets": [2]},
                    {className: "col1 numrows study-count", "targets": [3]},
                    {className: "col1", "targets": [4]},
                ],
                "columns": [
                    {"type": "html", "orderable": false, "data": "PatientID",
                        render: function (PatientID, type, row) {
                            collection_id = row['collection_id'][0];
                            if ((collection_id in window.selItems.selCases) && (window.selItems.selCases[collection_id].indexOf(PatientID) > -1)) {
                                return '<input type="checkbox" class="tbl-sel" checked="true">';
                            } else {
                                return '<input type="checkbox" class="tbl-sel">';
                            }
                        }
                    },

                    {"type": "text", "orderable": true, data: 'collection_id', render: function (data) {
                            var projectNm = $('#' + data).filter('.collection_name')[0].innerText;
                            return projectNm;
                        }
                    },
                    {"type": "text", "orderable": true, data: 'PatientID', render: function (data) {
                            return data +
                            ' <a class="copy-this-table" role="button" content="' + data +
                                '" title="Copy Case ID to the clipboard"><i class="fa-solid fa-copy"></i></a>';
                        }
                    },
                    {"type": "num", "orderable": true, data: 'unique_study'},
                    {"type": "num", "orderable": true, data: 'unique_series'}
                ],
                "processing": true,
                "serverSide": true,
                "ajax": function (request, callback, settings) {
                    var backendReqLength = 500;
                    var backendReqStrt = Math.max(0, request.start - Math.floor(backendReqLength * 0.5));

                    var rowsRemoved = $('#cases_tab').data('rowsremoved');
                    var refreshAfterFilter = $('#cases_tab').data('refreshafterfilter');
                    var updateChildTables = $('#cases_tab').data('updatechildtables');
                    var checkIds = new Array();
                    var cols = ['', 'collection_id', 'PatientID', 'StudyInstanceUID', 'SeriesInstanceUID'];
                    var ssCallNeeded = true;
                    if (window.selItems.selProjects.length === 0) {
                        ssCallNeeded = false;
                        $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                        updateChildTables = cleanChildSelections([], 'cases', true);
                        studyID = '';
                        if ($('#studies_tab_wrapper').find('.studyID_inp').length > 0) {
                            studyID = $('#studies_tab_wrapper').find('.studyID_inp').val().trim();
                        }

                        updateStudyTable(false, true, refreshAfterFilter, [updateChildTables[1]], studyID);
                        callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                    } else {
                        var ret = checkClientCache(request, 'cases');
                        var ssCallNeeded = ret[0];
                        var reorderNeeded = ret[1];

                        if (ssCallNeeded) {
                            if (refreshAfterFilter) {
                                for (projid in window.selItems.selCases) {
                                    checkIds = checkIds.concat(window.selItems.selCases[projid])

                                }
                            }
                            var curFilterObj = JSON.parse(JSON.stringify(parseFilterObj()));
                            curFilterObj.collection_id = window.selItems.selProjects;
                            if (caseID.trim().length > 0) {
                                curFilterObj.PatientID = caseID;
                                if (checkIds.indexOf(caseID) > -1) {
                                    checkIds = [caseID];
                                }
                                for (projid in window.selItems.selCases) {
                                    if (window.selItems.selCases[projid].indexOf(caseID) > -1) {
                                        window.selItems.selCases[projid].splice(window.selItems.selCases[projid].indexOf(caseID), 1);
                                        rmSelCases.push.apply(rmSelCases, window.selItems.selCases[projid]);
                                        window.selItems.selCases[projid] = [caseID];
                                    } else {
                                        rmSelCases.push.apply(rmSelCases, window.selItems.selCases[projid]);
                                        delete window.selItems.selCases[projid];
                                    }
                                }

                            }
                            var filterStr = JSON.stringify(curFilterObj);
                            let url = '/tables/cases/';
                            url = encodeURI(url);
                            ndic = {'filters': filterStr, 'limit': 2000}
                            ndic['checkids'] = JSON.stringify(checkIds);

                            ndic['offset'] = backendReqStrt;
                            ndic['limit'] = backendReqLength;

                            if (typeof (request.order) !== 'undefined') {
                                if (typeof (request.order[0].column) !== 'undefined') {
                                    ndic['sort'] = cols[request.order[0].column];
                                }
                                if (typeof (request.order[0].dir) !== 'undefined') {
                                    ndic['sortdir'] = request.order[0].dir;
                                }
                            }

                        var csrftoken = $.getCookie('csrftoken');
                        $('.spinner').show();
                        $.ajax({
                            url: url,
                            dataType: 'json',
                            data: ndic,
                            type: 'post',
                            contentType: 'application/x-www-form-urlencoded',
                            beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
                            success: function (data) {
                                window.casesCache = new Object();
                                colSort = ["", "collection_id", "PatientID", "unique_study", "unique_series"];
                                updateCache(window.casesCache, request, backendReqStrt, backendReqLength, data, colSort);
                                dataset = data['res'].slice(request.start - backendReqStrt, request.start - backendReqStrt + request.length);
                                /* for (set in dataset) {
                                    set['ids'] = {'PatientID': set['PatientID'], 'collection_id': set['collection_id']}
                                }*/
                                if (dataset.length > 0) {
                                    $('#cases_tab').children('thead').children('tr').children('.ckbx').removeClass('notVis');
                                } else {
                                    $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                }

                                if (refreshAfterFilter && ((data['diff'].length > 0) || (rmSelCases.length > 0))) {
                                    if (data['diff'].length > 0) {
                                        for (projid in window.selItems.selCases) {
                                            for (var i = 0; i < window.selItems.selCases[projid].length; i++) {
                                                caseid = window.selItems.selCases[projid][i];
                                                var ind = data['diff'].indexOf(caseid);
                                                if (ind > -1) {
                                                    window.selItems.selCases[projid].splice(i, 1);
                                                    i--;
                                                }
                                            }
                                            if (window.selItems.selCases[projid].length === 0) {
                                                delete window.selItems.selCases[projid];
                                            }
                                        }
                                    }
                                    updateChildTables = cleanChildSelections(data['diff'], 'cases', false);
                                    var studyID = '';
                                    if ($('#studies_tab').find('.studyID_inp').length > 0) {
                                        studyID = $('#studies_tab').find('.studyID_inp').val().trim();
                                    }
                                    updateStudyTable(false, true, true, true, studyID);
                                } else if (updateChildTables[0]) {
                                    var studyID = "";
                                    if ($('.studies_tab').find('#study_id').length > 0) {
                                        studyID = $('#studies_tab').find('.studyID-inp').val();
                                    }
                                    updateStudyTable(false, true, false, [updateChildTables[1]], studyID);
                                }
                                callback({
                                    "data": dataset,
                                    "recordsTotal": data["cnt"],
                                    "recordsFiltered": data["cnt"]
                                });
                            },
                            error: function () {
                                console.log("problem getting data");
                                alert("There was an error fetching server data. Please alert the systems administrator")
                                $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                            },
                            complete: function() {
                                $('.spinner').hide();
                            }
                            });
                        } else {
                            if (reorderNeeded) {
                                reorderCacheData(window.casesCache, request, $('#cases_table_head'));
                            }
                            dataset = window.casesCache.data.slice(request.start - window.casesCache.backendReqStrt, request.start - window.casesCache.backendReqStrt + request.length);
                            window.casesCache.lastRequest = request;
                            callback({
                                "data": dataset,
                                "recordsTotal": window.casesCache.recordsTotal,
                                "recordsFiltered": window.casesCache.recordsTotal
                            })
                        }
                    }
                }
            });
        }
        catch(err){
            alert("The following error occurred trying to update the case table:" +err+". Please alert the systems administrator");
        }

        $('#cases_tab').on('draw.dt', function(){
            $('#cases_table_head').children('tr').children().each(function(){
                this.style.width=null;
                }
            );
        })

        $('#cases_tab').find('tbody').attr('id','cases_table');
        $('#cases_panel').find('.dataTables_controls').find('.dataTables_length').after('<div class="dataTables_goto_page"><label>Page </label><input class="goto-page-number" type="number"><button onclick="changePage(\'cases_tab_wrapper\')">Go</button></div>');
        $('#cases_panel').find('.dataTables_controls').find('.dataTables_paginate').after('<div class="dataTables_filter"><strong>Find by Case ID:</strong><input class="caseID_inp" type="text-box" value="'+caseID+'"><button onclick="filterTable(\'cases_panel\',\'caseID\')">Go</button></div>');
    }

    window.updateStudyTable = function(rowsAdded, rowsRemoved, refreshAfterFilter,updateChildTables,studyID) {
        let nonViewAbleModality= new Set([""]);
        $('#studies_tab').data('rowsremoved',rowsRemoved);
        $('#studies_tab').data('refreshafterfilter',refreshAfterFilter);
        $('#studies_tab').data('updatechildtables',updateChildTables);
        if ($('#studies_tab_wrapper').find('.dataTables_controls').length>0){
            pageRows = parseInt($('#studies_tab_wrapper').find('.dataTables_length select').val());
        }
        else {
            pageRows = 10;
        }
        $('#studies_tab').DataTable().destroy();

        try {
            $('#studies_tab').DataTable({
                "iDisplayLength": pageRows,
                "autoWidth": false,
                "dom": '<"dataTables_controls"ilp>rt<"bottom"><"clear">',
                "order": [[1, "asc"]],
                "createdRow": function (row, data, dataIndex) {
                    $(row).attr('id', 'study_' + data['StudyInstanceUID'])
                    $(row).attr('data-studyid', data['StudyInstanceUID']);
                    $(row).attr('data-caseid', data['PatientID']);
                    $(row).addClass('text_head');
                    $(row).addClass('project_' + data['collection_id']);
                    $(row).addClass('case_' + data['PatientID']);
                    $(row).on('click', function(event){
                        var elem = event.target;
                        if (!($(elem).is('a')) && !($(elem).hasClass('fa-download'))
                            && !($(elem).hasClass('fa-copy')) && !($(elem).hasClass('fa-eye'))
                            && !($(elem).hasClass('tippy-box'))  && !($(elem).parents().hasClass('tippy-box'))
                            && !($(elem).hasClass('viewer-toggle')) && !($(elem).parents().hasClass('viewer-toggle'))
                        ) {
                            if (!$(elem).parent().hasClass('ckbx')) {
                                ckbx = $(elem).closest('tr').find('.ckbx').children()
                                ckbx.prop("checked", !ckbx.prop("checked"));
                            }
                            updateCasesOrStudiesSelection([$(this)], 'studies')
                        }
                    })
                },
                "columnDefs": [
                    {className: "ckbx", "targets": [0]},
                    {className: "col1 case-id", "targets": [1]},
                    {className: "col2 study-id study-id-col study-id-tltp", "targets": [2]},
                    {className: "col1 study-date", "targets": [3]},
                    {className: "col1 study-description", "targets": [4]},
                    {className: "col1 numrows series-count", "targets": [5]},
                    {className: "ohif open-viewer", "targets": [6]},
                    {className: "download", "targets": [7]},

                ],
                "columns": [
                    {
                        "type": "html",
                        "orderable": false,
                        data: 'StudyInstanceUID',
                        render: function (data, type, row) {
                            var PatientID = row['PatientID'];
                            if ((PatientID in window.selItems.selStudies) && (window.selItems.selStudies[PatientID].indexOf(data) > -1)) {
                                return '<input type="checkbox" class="tbl-sel" checked="true">';
                            } else {
                                return '<input type="checkbox" class="tbl-sel">';
                            }
                        }
                    },{
                        "type": "text", "orderable": true, data: 'PatientID', render: function (data) {
                            return data;
                        }
                    },{
                        "type": "text", "orderable": true, data: 'StudyInstanceUID', render: function (data) {
                            return pretty_print_id(data) +
                            ' <a class="copy-this-table" role="button" content="' + data +
                                '" title="Copy StudyInstanceUID to the clipboard"><i class="fa-solid fa-copy"></i></a>';
                        },
                        "createdCell": function (td, data) {
                            $(td).data('study-id', data);
                            return;
                        }
                    },{
                        "type": "text", "orderable": true, data: 'StudyDate', render: function (data) {
                            // fix when StudyData is an array of values
                            var dt = new Date(Date.parse(data));
                            var dtStr = (dt.getUTCMonth() + 1).toLocaleString('en-US', {minimumIntegerDigits: 2}) + "-" + dt.getUTCDate().toLocaleString('en-US', {minimumIntegerDigits: 2}) + "-" + dt.getUTCFullYear().toString();
                            return dtStr;
                        }
                    },
                    {"type": "num", "orderable": true, data: 'StudyDescription'},
                    {"type": "num", "orderable": true, data: 'unique_series'},
                    {
                        "type": "html",
                        "orderable": false,
                        data: 'StudyInstanceUID',
                        render: function (data, type, row) {
                            var coll_id="";
                            if (Array.isArray(row['collection_id'])){
                                coll_id=row['collection_id'][0];
                            }
                            else {
                                coll_id=row['collection_id']
                            }
                            if (row['access'].includes('Limited') ) {
                                return '<i class="fa-solid fa-circle-minus coll-explain"></i>';
                            }
                            else {
                                let modality = row['Modality'];
                                let is_xc = (modality === "XC" || (Array.isArray(modality) && modality.includes("XC")));
                                if ( (Array.isArray(modality) && modality.some(function(el){
                                    return nonViewAbleModality.has(el)
                                }) ) || nonViewAbleModality.has(modality) )   {
                                    return '<a href="/" onclick="return false;"><i class="fa-solid fa-eye-slash not-viewable"></i>';
                                } else if (( Array.isArray(modality) && modality.includes('SM')) || (modality === 'SM')) {
                                    return '<a href="' + SLIM_VIEWER_PATH + data + '" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-eye"></i>'
                                 } else {
                                    let v2_link = is_xc ? "" : OHIF_V2_PATH + data;
                                    let v3_link = OHIF_V3_PATH + "=" + data;
                                    let v2_element = '<li title="Not available for this modality."><a class="disabled" href="'
                                        + v2_link + '" target="_blank" rel="noopener noreferrer">OHIF v2</a></li>';
                                    let default_viewer = (modality === "XC" || (Array.isArray(modality) && modality.includes("XC"))) ? v3_link : v2_link;
                                    let volView_element = '<li title="VolView is disabled for this Study."><a class="disabled">VolView ' +
                                        '<i class="fa-solid fa-external-link external-link-icon" aria-hidden="true">' +
                                        '</a></li>';
                                    let bucket = Array.isArray(row['aws_bucket']) ? row['aws_bucket'][0] : row['aws_bucket'];
                                    if(!is_xc) {
                                        if(bucket.indexOf(",") < 0) {
                                            let volView_link = VOLVIEW_PATH + "=[" + row['crdc_series_uuid'].map(function (i) {
                                                return "s3://" + row['aws_bucket'] + "/" + i;
                                            }).join(",") + ']"';
                                            volView_element = '<li><a class="external-link" href="" url="'+volView_link+'" ' +
                                                'data-toggle="modal" data-target="#external-web-warning">VolView ' +
                                                '<i class="fa-solid fa-external-link external-link-icon" aria-hidden="true">' +
                                                '</a></li>';
                                        }
                                        v2_element = '<li><a href="'+v2_link+'" target="_blank" rel="noopener noreferrer">OHIF v2</a></li>';
                                    }

                                    return '<a href="' + default_viewer + '" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-eye"></i>' +
                                        '<div class="dropdown viewer-toggle">' +
                                        '<a id="btnGroupDropViewers" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i class="fa-solid fa-caret-down"></i></a>' +
                                        '<ul class="dropdown-menu viewer-menu" aria-labelledby="btnGroupDropViewers">' +
                                        v2_element +
                                        '<li><a href="'+v3_link+'" target="_blank" rel="noopener noreferrer">OHIF v3</a></li>' +
                                        volView_element +
                                        '</ul>' +
                                        '</div>';
                                }
                            }
                        }
                    }, {
                          "type":"html",
                          "orderable": false,
                          data: 'StudyInstanceUID', render: function (data, type, row){
                              return '<i class="fa fa-download study-export" data-series-count="'+row['unique_series']
                                  +'" data-uid="'+data+'"data-toggle="modal" data-target="#export-manifest-modal"></i>'
                          }

                      }
                ],
                "processing": true,
                "serverSide": true,
                "ajax": function (request, callback, settings, refreshAfterFilter) {
                    var backendReqLength = 500;
                    var backendReqStrt = Math.max(0, request.start - Math.floor(backendReqLength * 0.5));

                    var rowsRemoved = $('#studies_tab').data('rowsremoved');
                    var refreshAfterFilter = $('#studies_tab').data('refreshafterfilter');
                    var updateChildTables = [$('#studies_tab').data('updatechildtables')];
                    var checkIds = new Array();
                    var cols = ['', 'PatientID', 'StudyInstanceUID', 'StudyDate','StudyDescription', 'SeriesInstanceUID'];
                    var ssCallNeeded = true;

                    var caseArr = new Array();
                    for (projectid in window.selItems.selCases) {
                        for (var i = 0; i < window.selItems.selCases[projectid].length; i++) {
                            caseArr.push(window.selItems.selCases[projectid][i]);
                        }
                    }

                    if (caseArr.length === 0) {
                        ssCallNeeded = false;
                        $('#studies_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                        if (refreshAfterFilter || updateChildTables[0]) {
                            var seriesID = "";
                            if ($('.series_tab').find('#series_id').length > 0) {
                                seriesID = $('#series_tab').find('.seriesID-inp').val();
                            }
                            updateSeriesTable(false, true, false,seriesID)
                        }
                        callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"});
                    } else {
                        var ret = checkClientCache(request, 'studies');
                        ssCallNeeded = ret[0];
                        var reorderNeeded = ret[1];
                        if (ssCallNeeded) {
                            var curFilterObj = parseFilterObj();
                            curFilterObj.collection_id = window.selItems.selProjects;
                            curFilterObj.PatientID = caseArr;
                            if (studyID.trim().length > 0) {
                                curFilterObj.StudyInstanceUID = studyID;
                                if (checkIds.indexOf(studyID) > -1) {
                                    checkIds = [studyID];
                                }
                                for (caseId in window.selItems.selStudies){
                                    if (window.selItems.selStudies[caseId].indexOf(studyID)>-1){
                                        window.selItems.selStudies[caseId]=[studyID]
                                    } else {
                                        delete window.selItems.selStudies[caseId];
                                    }
                                }
                            } else if (refreshAfterFilter){
                                for (caseId in window.selItems.selStudies){
                                    checkIds=checkIds.concat(window.selItems.selStudies[caseId])
                                }
                            }
                            var filterStr = JSON.stringify(curFilterObj);
                            let url = '/tables/studies/';
                            url = encodeURI(url);
                            ndic = {'filters': filterStr, 'limit': 2000}
                            ndic['offset'] = backendReqStrt;
                            ndic['limit'] = backendReqLength;
                            if (typeof (request.order) !== 'undefined') {
                                if (typeof (request.order[0].column) !== 'undefined') {
                                    ndic['sort'] = cols[request.order[0].column];
                                }
                               if (typeof (request.order[0].dir) !== 'undefined') {
                                   ndic['sortdir'] = request.order[0].dir;
                               }
                            }
                            var csrftoken = $.getCookie('csrftoken');
                            $.ajax({
                                url: url,
                                dataType: 'json',
                                data: ndic,
                                type: 'post',
                                contentType: 'application/x-www-form-urlencoded',
                                beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
                                success: function (data) {
                                    window.studiesCache = new Object();
                                    colSort = ["", "PatientID", "StudyInstanceUID","StudyDate","StudyDescription","unique_series"]
                                    updateCache(window.studiesCache, request, backendReqStrt, backendReqLength, data, colSort);
                                    dataset = data['res'].slice(request.start - backendReqStrt, request.start - backendReqStrt + request.length);
                                    if (dataset.length > 0) {
                                        $('#studies_tab').children('thead').children('tr').children('.ckbx').removeClass('notVis');
                                    } else {
                                        $('#studies_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    }

                                    if (refreshAfterFilter || updateChildTables[0]) {
                                        var seriesID = "";
                                        if ($('.series_tab').find('#series_id').length > 0) {
                                            seriesID = $('#series_tab').find('.seriesID-inp').val();
                                        }
                                        updateSeriesTable(false, true, false,seriesID)
                                    }
                                    callback({
                                        "data": dataset,
                                        "recordsTotal": data["cnt"],
                                        "recordsFiltered": data["cnt"]
                                    })

                                },
                                error: function () {
                                    console.log("problem getting data");
                                    alert("There was an error fetching server data. Please alert the systems administrator");
                                    $('#studies_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                                }
                            });
                        } else {
                            if (reorderNeeded) {
                                reorderCacheData(window.studiesCache, request, $('#studies_table_head'));
                            }
                            dataset = window.studiesCache.data.slice(request.start - window.studiesCache.backendReqStrt, request.start - window.studiesCache.backendReqStrt + request.length);
                            window.studiesCache.lastRequest = request;
                            callback({
                                "data": dataset,
                                "recordsTotal": window.studiesCache.recordsTotal,
                                "recordsFiltered": window.studiesCache.recordsTotal
                            })
                        }
                    }
                }
            });
        }
        catch(err){
            alert("The following error was reported when processing server data: "+ err +". Please alert the systems administrator")
        }

        $('#studies_tab').on('draw.dt', function(){
            $('#studies_table_head').children('tr').children().each(function(){
                this.style.width=null;
                }
            );
        })

        $('#studies_tab').children('tbody').attr('id','studies_table');
        $('#studies_tab_wrapper').find('.dataTables_controls').find('.dataTables_length').after('<div class="dataTables_goto_page"><label>Page </label><input class="goto-page-number" type="number"><button onclick="changePage(\'studies_tab_wrapper\')">Go</button></div>');
        $('#studies_tab_wrapper').find('.dataTables_controls').find('.dataTables_paginate').after('<div class="dataTables_filter"><strong>Find by Study Instance UID:</strong><input class="studyID_inp" type="text-box" value="'+studyID+'"><button onclick="filterTable(\'studies_tab_wrapper\',\'studyID\')">Go</button></div>');
    }

    window.updateSeriesTable = function(rowsAdded, rowsRemoved, refreshAfterFilter,seriesID) {
        var nonViewAbleModality= new Set(["PR","SEG","RTSTRUCT","RTPLAN","RWV", "SR", "ANN"])
        var nonViewAbleSOPClassUID= new Set(["1.2.840.10008.5.1.4.1.1.66"])
        var slimViewAbleModality=new Set(["SM"])
        $('#series_tab').attr('data-rowsremoved', rowsRemoved);
        $('#series_tab').attr('data-refreshafterfilter', refreshAfterFilter);
        if ($('#series_tab_wrapper').find('.dataTables_controls').length>0){
            pageRows = parseInt($('#series_tab_wrapper').find('.dataTables_length select').val());
        }
        else {
            pageRows = 10;
        }
        $('#series_tab').DataTable().destroy();
        try {
            $('#series_tab').DataTable({
                "iDisplayLength": pageRows,
                 "autoWidth": false,
                 "dom": '<"dataTables_controls"ilp>rt<"bottom"><"clear">',
                 "order": [[0, "asc"]],
                 "createdRow": function (row, data, dataIndex) {
                    $(row).attr('id', 'series_' + data['SeriesInstanceUID'])
                    $(row).attr('data-crdc',  data['crdc_series_uuid'])
                    $(row).attr('data-aws',  data['aws_bucket'])
                    $(row).attr('data-gcs',  data['gcs_bucket'])
                    $(row).addClass('text_head');
                 },
                "columnDefs": [
                    {className: "col1 study-id study-id-col study-id-tltp", "targets": [0]},
                    {className: "series-id series-id-tltp", "targets": [1]},
                    {className: "series-number", "targets": [2]},
                    {className: "col1 modality", "targets": [3]},
                    {className: "col1 body-part-examined", "targets": [4]},
                    {className: "series-description", "targets": [5]},
                    {className: "ohif open-viewer", "targets": [6]},
                    {className: "download", "targets": [7]},

                 ],
                  "columns": [
                  {
                    "type": "text", "orderable": true, data: 'StudyInstanceUID', render: function (data) {
                        return pretty_print_id(data) +
                            ' <a class="copy-this-table" role="button" content="' + data +
                                '"  title="Copy StudyInstanceUID to the clipboard"><i class="fa-solid fa-copy"></i></a>';
                    }, "createdCell": function (td, data) {
                        $(td).data('study-id', data);
                        return;
                    }
                }, {
                    "type": "text", "orderable": true, data: 'SeriesInstanceUID', render: function (data) {
                        return pretty_print_id(data) +
                            ' <a class="copy-this-table" role="button" content="' + data +
                                '"  title="Copy SeriesInstanceUID to the clipboard"><i class="fa-solid fa-copy"></i></a>';
                    }, "createdCell": function (td, data) {
                        $(td).data('series-id', data);
                        return;
                    }
                },
                {"type": "num", "orderable": true, data: 'SeriesNumber'},
                {"type": "text", "orderable": true, data: 'Modality'},
                {"type": "text", "orderable": true, data: 'BodyPartExamined'},
                {
                    "type": "text", "orderable": true, data: 'SeriesDescription', render: function (data) {
                        if (data.length > 1) {
                            return data[0] + ',...';
                        } else if (data.length === 1) {
                            return data[0];
                        } else {
                            return '';
                        }
                    },
                    "createdCell": function (td, data) {
                        if (data.length > 1) {
                            $(td).attr('data-description', data);
                            $(td).addClass('description-tip');
                            return;

                        }
                    },
                }, {
                    "type": "html",
                    "orderable": false,
                    data: 'SeriesInstanceUID',
                    render: function (data, type, row) {
                        let coll_id="";
                        let modality = row['Modality'];
                        let is_xc = (modality === "XC" || (Array.isArray(modality) && modality.includes("XC")));
                        if (Array.isArray(row['collection_id'])){
                            coll_id=row['collection_id'][0];
                        } else {
                            coll_id=row['collection_id']
                        }
                        if (row['access'].includes('Limited') ) {
                            return '<i class="fa-solid fa-circle-minus coll-explain"></i>';
                        }
                        else if ( (Array.isArray(row['Modality']) && row['Modality'].some(function(el){
                            return nonViewAbleModality.has(el)
                        }) ) || nonViewAbleModality.has(row['Modality'])
                            || (Array.isArray(row['SOPClassUID']) && row['SOPClassUID'].some(function(el){
                            return nonViewAbleSOPClassUID.has(el)
                        }) ) ||  nonViewAbleSOPClassUID.has(row['SOPClassUID'])) {
                            let tooltip = //is_xc ? "not-viewable" :
                                "no-viewer-tooltip";
                            return `<a href="/" onclick="return false;"><i class="fa-solid fa-eye-slash ${tooltip}"></i>`;
                        } else if (  ( Array.isArray(modality) && modality.some(function(el){
                            return slimViewAbleModality.has(el)}
                        ) ) || (slimViewAbleModality.has(row['Modality']))) {
                            return '<a href="' + SLIM_VIEWER_PATH + row['StudyInstanceUID'] + '/series/' + data +
                                '" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-eye"></i>'
                        } else {
                            let v2_link = is_xc ? "" : OHIF_V2_PATH + row['StudyInstanceUID'] + '?SeriesInstanceUID=' + data;
                            let v3_link = OHIF_V3_PATH + "=" + row['StudyInstanceUID'] + '&SeriesInstanceUIDs=' + data;
                            let default_viewer = (modality === "XC" || (Array.isArray(modality) && modality.includes("XC"))) ? v3_link : v2_link;
                            let volView_link = is_xc ? "" : VOLVIEW_PATH + "=[s3://" + row['aws_bucket'] + '/' + row['crdc_series_uuid']+']"';
                            let v2_element = '<li title="Not available for this modality."><a class="disabled" href="'
                                + v2_link + '" target="_blank" rel="noopener noreferrer">OHIF v2</a></li>';
                            let volView_element = '<li title="VolView is disabled for this Study."><a class="disabled">VolView ' +
                                        '<i class="fa-solid fa-external-link external-link-icon" aria-hidden="true">' +
                                        '</a></li>';

                            if(!is_xc) {
                                v2_element = '<li><a href="' + v2_link + '" target="_blank" rel="noopener noreferrer">OHIF v2</a></li>';
                                volView_element = '<li><a class="external-link" href="" url="' + volView_link + '" ' +
                                    'data-toggle="modal" data-target="#external-web-warning">VolView ' +
                                    '<i class="fa-solid fa-external-link external-link-icon" aria-hidden="true">' +
                                    '</a></li>';
                            }

                            return '<a href="' + default_viewer + '" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-eye"></i>' +
                                '<div class="dropdown viewer-toggle">' +
                                '<a id="btnGroupDropViewers" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i class="fa-solid fa-caret-down"></i></a>' +
                                '<ul class="dropdown-menu viewer-menu" aria-labelledby="btnGroupDropViewers">' +
                                v2_element +
                                '<li><a href="'+v3_link+'" target="_blank" rel="noopener noreferrer">OHIF v3</a></li>' +
                                volView_element +
                                '</ul></div>';
                        }
                    }
                }, {
                      "type":"html",
                      "orderable": false,
                      data: 'SeriesInstanceUID', render: function (data){
                          return '<i class="fa fa-download series-export" data-uid="'+data+'"data-toggle="modal" data-target="#export-manifest-modal"></i>'
                      }
                  }
            ],
            "processing": true,
            "serverSide": true,
            "ajax": function (request, callback, settings, refreshAfterFilter) {
                     var backendReqLength = 500;

                var backendReqStrt = Math.max(0, request.start - Math.floor(backendReqLength * 0.5));
                var rowsRemoved = $('#series_tab').data('rowsremoved');
                var refreshAfterFilter = $('#series_tab').data('refreshafterfilter');
                var cols = ['StudyInstanceUID', 'SeriesInstanceUID','SeriesNumber', 'Modality', 'BodyPartExamined', 'SeriesDescription']
                var ssCallNeeded = true;
                var caseArr = new Array();
                for (caseid in window.selItems.selCases) {
                    for (var i = 0; i < window.selItems.selCases[caseid].length; i++) {
                        caseArr.push(window.selItems.selCases[caseid][i]);
                    }
                }
                var studyArr = new Array();
                for (caseid in window.selItems.selStudies) {
                    for (var i = 0; i < window.selItems.selStudies[caseid].length; i++) {
                        studyArr.push(window.selItems.selStudies[caseid][i]);
                    }
                }
                if (studyArr.length == 0) {
                    ssCallNeeded = false;
                    $('#series_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                    callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"});
                } else {
                    var ret = checkClientCache(request, 'series');
                    ssCallNeeded = ret[0]
                    var reorderNeeded = ret[1];

                    if (ssCallNeeded) {
                        var curFilterObj = new Object();
                        curFilterObj.collection_id = window.selItems.selProjects;
                        curFilterObj.PatientID = caseArr;
                        curFilterObj.StudyInstanceUID = studyArr;
                        if (seriesID.trim().length > 0) {
                                curFilterObj.SeriesInstanceUID = seriesID;
                        }

                        var filterStr = JSON.stringify(curFilterObj);

                        let url = '/tables/series/';
                        url = encodeURI(url);
                        ndic = {'filters': filterStr, 'limit': 2000}

                        ndic['offset'] = backendReqStrt;
                        ndic['limit'] = backendReqLength;

                        if (typeof (request.order) !== 'undefined') {
                            if (typeof (request.order[0].column) !== 'undefined') {
                                ndic['sort'] = cols[request.order[0].column];
                            }
                            if (typeof (request.order[0].dir) !== 'undefined') {
                                ndic['sortdir'] = request.order[0].dir;
                            }
                        }
                        var csrftoken = $.getCookie('csrftoken');
                        $.ajax({
                            url: url,
                            dataType: 'json',
                            data: ndic,
                            type: 'post',
                            contentType: 'application/x-www-form-urlencoded',
                            beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
                            success: function (data) {
                                window.seriesCache = new Object();
                                var colSort = ['StudyInstanceUID', 'SeriesInstanceUID','SeriesNumber', 'Modality', 'BodyPartExamined', 'SeriesDescription']
                                updateCache(window.seriesCache, request, backendReqStrt, backendReqLength, data, colSort)
                                dataset = data['res'].slice(request.start - backendReqStrt, request.start - backendReqStrt + request.length);

                                callback({
                                    "data": dataset,
                                    "recordsTotal": data["cnt"],
                                    "recordsFiltered": data["cnt"]
                                })
                            },
                            error: function () {
                                console.log("problem getting data");
                                alert("There was an error fetching server data. Please alert the systems administrator")
                                $('#series_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                            }
                        });
                    } else {
                        if (reorderNeeded) {
                            reorderCacheData(window.seriesCache, request, $('#series_table_head'));
                        }
                        dataset = window.seriesCache.data.slice(request.start - window.seriesCache.backendReqStrt, request.start - window.seriesCache.backendReqStrt + request.length);
                        window.seriesCache.lastRequest = request;
                        callback({
                            "data": dataset,
                            "recordsTotal": window.seriesCache.recordsTotal,
                            "recordsFiltered": window.seriesCache.recordsTotal
                        })
                    }
                }
              }
           });
        }
        catch(err){
            alert("The following error was reported when processing server data: "+ err +". Please alert the systems administrator");
        }

        $('#series_tab').on('draw.dt', function(){
            $('#series_table_head').children('tr').children().each(function(){
                this.style.width=null;
            });
        });
        $('#series_tab').children('tbody').attr('id','series_table');
        $('#series_tab_wrapper').find('.dataTables_controls').find('.dataTables_length').after('<div class="dataTables_goto_page"><label>Page </label><input class="goto-page-number" type="number"><button onclick="changePage(\'series_tab_wrapper\')">Go</button></div>');
        $('#series_tab_wrapper').find('.dataTables_controls').find('.dataTables_paginate').after('<div class="dataTables_filter"><strong>Find by Series Instance UID:</strong><input class="seriesID_inp" type="text-box" value="'+seriesID+'"><button onclick="filterTable(\'series_tab_wrapper\',\'seriesID\')">Go</button></div>');

    }

    var pretty_print_id = function (id) {
        var newId = id.slice(0, 8) + '...' + id.slice(id.length - 8, id.length);
        return newId;
    }

    window.updateSearchScope = function (searchElem) {
        var project_scope = searchElem.selectedOptions[0].value;
        mkFiltText();
        updateFacetsData(true);
    }

    var updateCollectionTotals = function(listId, progDic){
        var reformDic = new Object();
        reformDic[listId] = new Object();
        for (item in progDic){
            if ((item !=='All') && (item !=='None') && (item in window.programs) && (Object.keys(progDic[item]['projects']).length>0)){
                if ( Object.keys(window.programs[item]['projects']).length===-1) {
                    nitem=Object.keys(progDic[item]['projects'])[0];
                    reformDic[listId][nitem]=new Object();
                    reformDic[listId][nitem]['count'] = progDic[item]['val'];
                } else {
                    reformDic[listId][item]=new Object();
                    reformDic[listId][item]['count'] = progDic[item]['val'];
                    reformDic[item] =  new Object();
                    for (project in progDic[item]['projects']){
                        reformDic[item][project]=new Object();
                        reformDic[item][project]['count']=progDic[item]['projects'][project]['val'];
                    }
                }
            }
        }
        updateFilterSelections('program_set', {'unfilt':reformDic});
        updateColl(false);
    }

    var parseFilterObj = function (){
        var hasTcgaCol=false;
        if ((window.filterObj.hasOwnProperty('Program')) && (window.filterObj.Program.indexOf('TCGA')>-1)){
            hasTcgaCol=true;
        }
        collObj=new Array();
        filtObj = new Object();
        for (ckey in window.filterObj){
            if (ckey ==='Program'){
                for (ind=0;ind<window.filterObj[ckey].length;ind++){
                    program = window.filterObj[ckey][ind];
                    if (program in window.projSets){
                        if (!('Program.'+program in window.filterObj)){
                           collObj= collObj.concat(window.projSets[program]);
                        }
                    }
                   
                }
            } else if (ckey.startsWith('Program.')){
                 for (ind=0;ind<window.filterObj[ckey].length;ind++){
                     collObj.push(window.filterObj[ckey][ind]);
                 }
            } else if (!(ckey).startsWith('tcga_clinical') || hasTcgaCol){
                nmA = ckey.split('.');
                nm=nmA[nmA.length-1];
                if (nm.endsWith('_rng')){
                    if (window.filterObj[ckey].type==='none'){
                        nm=nm.replace('_rng','');
                    } else {
                        nm = nm.replace('_rng', '_' + window.filterObj[ckey].type);
                    }
                    if (  ('rng' in window.filterObj[ckey]) && ('none' in window.filterObj[ckey]) ){
                        if (Array.isArray(window.filterObj[ckey]['rng'][0])){
                            filtObj[nm] = [...window.filterObj[ckey]['rng']];
                            filtObj[nm].push('None');
                        }
                        else{
                          filtObj[nm] = [window.filterObj[ckey]['rng'],'None']
                        }
                    } else if ('rng' in window.filterObj[ckey]){
                        filtObj[nm] = window.filterObj[ckey]['rng']
                    } else if ('none' in window.filterObj[ckey]){
                        noneKey=nm.replace('_rng','');
                        filtObj[noneKey]=['None'];
                    }
                } else {
                    filtObj[nm] = window.filterObj[ckey];
                }
            }
        }
        if (collObj.length>0){
            filtObj['collection_id']= collObj.sort();
        }
        return filtObj;
    };

    var update_bq_filters = function() {
        let filters = parseFilterObj();
        if (Object.keys(filters).length <= 0) {
            $('.bq-string-display').attr("disabled","disabled");
            $('.bq-string-display').attr("title","Select a filter to enable this feature.");
            $('.bq-string').html("");
            $('#export-manifest-form input[name="filters"]').val("");
        } else {
            $('.bq-string-display').removeAttr("disabled");
            $('.bq-string-display').attr("title","Click to display this filter as a BQ string.");
            $('.bq-string-display').attr('filter-params', JSON.stringify(filters));
            $('#export-manifest-form input[name="filters"]').val(JSON.stringify(filters));
        }
    };

    var update_filter_url = function() {
        let filters = parseFilterObj();
        if (Object.keys(filters).length <= 0) {
            $('.get-filter-uri').attr("disabled","disabled");
            $('#export-manifest').attr("disabled","disabled");
            $('#export-manifest').attr("data-no-filters", "true");
            if(!$('#export-manifest').attr('data-pending-manifest')) {
                $('#export-manifest').attr("title", "Select a filter to enable this feature.");
            }
            $('.get-filter-uri').attr("title","Select a filter to enable this feature.");
            $('.filter-url').html("");
            $('.copy-url').removeAttr("content");
            $('.copy-url').attr("disabled","disabled");
            $('.hide-filter-uri').triggerHandler('click');
            $('.url-too-long').hide();
            $('#export-manifest-form').attr(
                'action',
                $('#export-manifest-form').data('uri-base')
            );
        } else {
            $('.get-filter-uri').removeAttr("disabled");
            $('#export-manifest').removeAttr("data-no-filters");
            if(!$('#export-manifest').attr('data-pending-manifest')) {
                $('#export-manifest').removeAttr("disabled");
                $('#export-manifest').attr("title", "Export these search results as a manifest for downloading.");
            }
            $('.copy-url').removeAttr("disabled");
            $('.get-filter-uri').attr("title","Click to display this filter set's query URL.");
            let url = BASE_URL+"/explore/filters/?";
            let encoded_filters = []
            for (let i in filters) {
                if (filters.hasOwnProperty(i)) {
                    let vals = filters[i];
                    if(!Array.isArray(filters[i])) {
                        vals = filters[i]['values'];
                        encoded_filters.push(i+"_op="+encodeURI(filters[i]['op']));
                    }
                    _.each(vals, function (val) {
                        encoded_filters.push(i+"="+encodeURI(val));
                    });
                }
            }
            url += encoded_filters.join("&");
            url.length > 2048 && $('.url-too-long').show();
            url.length <= 2048 && $('.url-too-long').hide();
            $('.filter-url').html(url);
            $('.copy-url').attr("content",url);
        }
    };

    var updateFacetsData = function (newFilt) {
        update_filter_url();
        update_bq_filters();
        if (window.location.href.search(/\/filters\//g) >= 0) {
            if (!first_filter_load) {
                window.history.pushState({}, '', window.location.origin + "/explore/")
            } else {
                first_filter_load = false;
            }
        }
>>>>>>> e2ea25b12b9c59660f62427bdfdb43cff3f91d26
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
        $('.spinner').show();
        $.ajax({
            url: url,
            data: ndic,
            dataType: 'json',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
            success: function (data) {
                try {
                    //cartutils.setCartHistWinFromLocal();
                    let curInd = window.cartHist.length-1;
                    if (cartHist[curInd].selections.length>0){
                        let cartSel = new Object();
                        cartSel['filter']= parsedFiltObj;
                        cartSel['selections']= new Array();
                        cartSel['partitions']= new Array();
                        cartSel['pageid'] = window.pageid;
                        window.cartHist.push(cartSel);
                    }
                    else{
                        window.cartHist[curInd]['filter'] = parsedFiltObj;
                        window.cartHist[curInd]['pageid'] = parsedFiltObj;
                    }
                    //cartutils.setLocalFromCartHistWin();
                    if(data.total <= 0) {
                        base.showJsMessage(
                           "warning zero-results",
                           "Your filters returned zero results!",
                           true
                       );
                        $('#export-manifest, #save-cohort-btn').attr('disabled', 'disabled');
                    } else {
                        $('.zero-results').remove();
                        $('#export-manifest, #save-cohort-btn').removeAttr('disabled');
                    }
                    let file_parts_count = (is_cohort ? cohort_file_parts_count : data.totals.file_parts_count);
                    let display_file_parts_count = (is_cohort ? cohort_display_file_parts_count : data.totals.display_file_parts_count);
                    let isFiltered = Boolean($('#search_def p').length > 0);


                    $('#search_def_stats').attr('filter-series-count',(data.total > 0 ? data.totals.SeriesInstanceUID: 0));
                    let totals = data.totals;
                    $('#search_def_stats').html(totals.PatientID.toString() +
                            " Cases, " + totals.StudyInstanceUID.toString() +
                            " Studies, and " + totals.SeriesInstanceUID.toString() +
                            " Series in this cohort. " +
                            "Size on disk: " + totals.disk_size);

                    if(data.total > 0 && data.totals.SeriesInstanceUID > 65000) {
                        $('#s5cmd-max-exceeded').show();
                        $('#download-s5cmd').attr('disabled','disabled');
                        $('#s5cmd-button-wrapper').addClass('manifest-disabled');
                    } else {
                        $('#s5cmd-max-exceeded').hide();
                        $('#s5cmd-button-wrapper').removeClass('manifest-disabled');
                        $('#download-s5cmd').removeAttr('disabled');
                    }
                    $('input[name="async_download"]').val(
                        (data.total > 0 && data.totals.SeriesInstanceUID > 65000) ? "True" : "False"
                    );
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
                        $('#search_def_stats').removeClass('notDisp');
                        $('#search_def_stats').html(data.totals.PatientID.toString() + " Cases, " +
                            data.totals.StudyInstanceUID.toString() + " Studies, and " +
                            data.totals.SeriesInstanceUID.toString() + " Series in this cohort. " +
                            "Size on disk: " + data.totals.disk_size);
                    } else if(isFiltered && data.total <= 0) {
                        $('#search_def_stats').removeClass('notDisp');
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
            },
            complete: function() {
                $('.spinner').hide();
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

            if ( ($('#'+filterId).closest('.search-configuration').find('.hide-zeros').length>0)  && ($('#'+filterId).closest('.search-configuration').find('.hide-zeros').prop('checked'))){
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
            console.debug($group.find("input:checked"));
            let checkboxes = $group.find("input:checked").not(".hide-zeros").not(".sort_val").not('.join_val');
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
                let checkboxes = $group.find("input:checked").not(".hide-zeros").not(".sort_val").not('.join_val');
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
            let min = $this.slider("option", "min");
            let max = $this.slider("option", "max");
            if(!Number.isNaN(min) && min !== null && !Number.isNaN(max) && max !== null) {
                let left_val = $this.slider("values", 0);
                let right_val = $this.slider("values", 1);
                left_val = (left_val === null || !Number.isNaN(left_val)) ? min : left_val;
                right_val = (right_val === null || !Number.isNaN(right_val)) ? max : right_val;
                if (left_val !== min || right_val !== max) {
                    sliders.push({
                       'id': slider_id,
                        'left_val': left_val,
                        'right_val': right_val,
                    });
                }
            }
        });
        let sliderStr = JSON.stringify(sliders);
        sessionStorage.setItem('anonymous_sliders', sliderStr);
    };


    $('#save-cohort-btn, #sign-in-dropdown').on('click', function() {
        if (!user_is_auth) {
            save_anonymous_selection_data();
            location.href=$(this).data('uri');
        }
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

        if (("cartedits" in localStorage) && (localStorage.getItem("cartedits") == "true")) {

            //window.cartHist = JSON.parse(sessionStorage.getItem("cartHist"));
            //setCartHistWinFromLocal();
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
            //var content = gtotals[0].toString()+" Collections, "+gtotals[1]+" Cases, "+gtotals[2]+" Studies, and "+gtotals[3]+" Series in the cart"
            var content = gtotals[3]+" series selected from "+gtotals[0]+" collections/"+ gtotals[1]+" Cases/"+gtotals[2]+ " studies in the cart"

            /* tippy('.cart-view', {
                           interactive: true,
                           allowHTML:true,
                          content: content
                        });*/
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
        else if ("cartHist" in localStorage){
            localStorage.removeItem("cartHist");
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
    }

     $(document).ready(function () {
        window.pageid = Math.random().toString(36).substr(2,8);


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
            $('input:checkbox').not('.hide-zeros').not('.tbl-sel').prop('checked',false);
            $('input:checkbox').not('.hide-zeros').not('.tbl-sel').prop('indeterminate',false);
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

        //cartutils.updateLocalCartAfterSessionChng();
        var cartSel = new Object();
        cartSel['filter']=new Object();
        cartSel['pageid'] = window.pageid
        cartSel['selections']= new Array();
        cartSel['partitions']= new Array();

        setCartHist = false;
        /*( setCartHist = cartutils.setCartHistWinFromLocal();
        if (!setCartHist){
              window.cartHist = new Array();
        }*/
         window.cartHist = new Array();
        window.cartHist.push(cartSel);


        /*
        if ('cartHist' in localStorage){
            cartutils.refreshCartAndFiltersFromScratch(true);
        }
        else {
            filterutils.load_preset_filters();
        }
        */


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


        initSort('num');
        if (document.contains(document.getElementById('history'))){
            updateViaHistory();
        }
    });

    window.onbeforeunload = function(){

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

        // was saving cart data in local storage. Not feasible to maintain global cart
        //cartutils.setLocalFromCartHistWin();
        //sessionStorage.setItem("cartHist", JSON.stringify(window.cartHist));
        //localStorage.setItem("cartDetails", JSON.stringify(window.cartDetails));
        //sessionStorage.setItem("glblcart", JSON.stringify(window.glblcart));
        //localStorage.setItem("src", "explore_page");

        var maxSeries=0;
        var maxStudies=0;
        var projA=[];

        for (proj in window.selProjects){
            if (('someInCart' in window.selProjects[proj]) && (window.selProjects[proj]['someInCart'])){
                maxSeries = maxSeries + window.selProjects[proj]['mxseries'];
                maxStudies = maxStudies + window.selProjects[proj]['mxstudies'];
                projA.push(proj);
            }

        }

        if (projA.length>0){
          localStorage.setItem("projA", JSON.stringify(projA));
          localStorage.setItem("maxSeries", maxSeries);
          localStorage.setItem("maxStudies", maxStudies);
        }
        else{
            if ("projA" in sessionStorage){
                localStorage.remove("projA");
            }
            if ("maxSeries" in sessionStorage){
                localStorage.remove("maxSeries");
            }
            if ("maxStudies" in sessionStorage){
                localStorage.remove("maxStudies");
            }
        }

    }

    window.onpageshow = function (){
        //alert('show');
        if ("cartcleared" in localStorage){
            localStorage.removeItem("cartcleared");
            window.resetCart();
        }
        else {
            updatecartedits();
        }

    }

});

