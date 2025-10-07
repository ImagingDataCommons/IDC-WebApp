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
        cartutils: 'cartutils',
        tippy: 'libs/tippy-bundle.umd.min',
         '@popperjs/core': 'libs/popper.min',
        citations_modal: 'citations_modal'
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
        'tablesorter': ['jquery'],
        'underscore': {exports: '_'},
        'session_security': ['jquery'],
        'cartutils': ['jquery'],
        'export-manifest':['jquery'],
        'citations_modal': ['jquery']
    }
});


require([
    'cartutils',
    'tables',
    'jquery',
    'tippy',
    'underscore',
    'base', // This must ALWAYS be loaded!
    'jquerydt',
    'jqueryui',
    'bootstrap',
    'citations_modal'
], function(cartutils, tables, $, tippy, _, base) {

    var ajaxtriggered = false;

    window.resetCartPageView = function(){
        localStorage.setItem("cartcleared","yes");
        window.history.back();
    }

    tippy.delegate('#cart-table', {
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

    setCartDetailsModal = function(){
        var contentArray= [];
        for (var i=0;i< window.cartHist.length;i++){
            var cartDetail = window.cartHist[i];
            var filter = cartDetail.filter;
            let is_filtered = (Object.keys(filter).length > 0);
            let filter_match = is_filtered ? " which match the filter" : "";
            let filter_div = "", adjustment_div = "";
            var selections = cartDetail.selections;
            if (selections.length>0){
                if(is_filtered) {
                    let filter_set = [];
                    for(attr in filter) {
                        filter_set.push(`<span class="filter-type">${attr}</span> in (${filter[attr].map(d => '<span class="filter-att">'+d+'</span>').join("")})`);
                    }
                    filter_div = `<div class="cart-filter-display"><span class="filter-title">Filter: </span>${filter_set.join(" AND ")}</div>`;
                }
                for (var j=0;j<selections.length;j++){
                    var selectext= "";
                    var selec = selections[j];
                    let op = selec.added ? "Added" : "Removed";
                    if (selec.sel.length == 4){
                        selectext += `<span class="adjustments-op">${op}</span> series ${selec.sel[3]} from 
                            <span class="adjustment-type">collection</span> <span class="adjustment-att">${selec.sel[0]}, 
                            <span class="adjustment-type">case</span> <span class="adjustment-att">${selec.sel[1]}</span>, 
                            <span class="adjustment-type">study</span> <span class="adjustment-att">${selec.sel[2]}</span>`;
                    } else {
                        selectext += `<span class="adjustments-op">${op}</span> series from 
                            <span class="adjustment-type">collection</span> <span class="adjustment-att">${selec.sel[0]}</span>`
                        if (selec.sel.length > 1) {
                            selectext += `, <span class="adjustment-type">case </span> <span class="adjustment-att">${selec.sel[1]}</span>`
                        }
                        if (selec.sel.length > 2) {
                            selectext += `, <span class="adjustment-type">study</span> <span class="adjustment-att">${selec.sel[2]}</span>`
                        }
                        selectext += filter_match
                    }
                    adjustment_div = `<div class="cart-adjustment-display">${selectext}</div>`;
                }
            }
            contentArray.push(`${filter_div}${adjustment_div}`)
        }
        let content = `<ul>${contentArray.map(d => `<li class="cart-def-list">${d}`).join("")}</ul>`;
        console.log(content);
        $('#cart-description-modal').find('.modal-body').html(content);
    }

     $(document).ready(function () {
         let navelem = $("a[href='/explore/']");
         navelem.addClass('navexplore');
         if (document.referrer.includes('explore')){
             navelem.attr('href', 'javascript:window.history.back()')
         }
         window.mxseries = parseInt(JSON.parse(document.getElementById('mxseries').textContent));
         //window.totseries = parseInt(JSON.parse(document.getElementById('totseries').textContent));
         window.mxstudies = parseInt(JSON.parse(document.getElementById('mxstudies').textContent));
         window.cartHist = JSON.parse(document.getElementById('carthist').textContent);

         setCartDetailsModal();

         window.updatePartitionsFromScratch();
         var ret =cartutils.formcartdata();
         window.partitions = ret[0];
         window.filtergrp_list = ret[1];


         ajaxtriggered = true;

        cartutils.updateCartTable();
         $('.filter-tab.manifest-file').hide();
         $('.filter-tab.manifest-bq').hide();

         $('#download-s5cmd').addClass('iscart');
         $('#download-idc-index').addClass('iscart');
         $('#export-manifest-form').attr('action','/explore/manifest/');
    });
});
