require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.5.1',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        underscore: 'libs/underscore-min',
        tablesorter: 'libs/jquery.tablesorter.min',
        base: 'base',
        imagesearch: 'image_search',
        cohortfilelist: 'cohort_filelist',
        plotly: 'libs/plotly-latest.min'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'tablesorter': ['jquery'],
        'base': ['jquery'],
        'imagesearch': ['plotly']
    }
});

require([
    'jquery',
    'base',
    'imagesearch',
    'plotly',
    'jqueryui',
    'bootstrap',
    'tablesorter',
    'cohortfilelist',
], function ($, base, imagesearch, plotly, cohortfilelist) {

    $('.filter-panel li.checkbox').on('change', 'input', function() {
        if($('#search_def p').length > 0) {
            $('#save-cohort-btn').prop('disabled','');
            if(user_is_auth) {
                $('#save-cohort-btn').prop('title','');
            }
        } else {
            $('#save-cohort-btn').prop('disabled','disabled');
            if(user_is_auth) {
                $('#save-cohort-btn').prop('title','Please select at least one filter.');
            }
        }
    });

    // Resets forms in modals on cancel. Suppressed warning when leaving page with dirty forms
    $('#save-cohort-modal').on('show.bs.modal', function() {
        var filters = {};
        $('#search_orig_set .search-checkbox-list input:checked').each(function(){
            $('#selected-filters-orig-set').append('<span>'+$(this).data('filter-display-attr')+': '+$(this).data('filter-display-val')+'</span>');
            if(!filters[$(this).data('filter-attr-id')]) {
                filters[$(this).data('filter-attr-id')] = [];
            }
            filters[$(this).data('filter-attr-id')].push($(this).prop('value'));
        });
        $('#search_related_set .search-checkbox-list input:checked').each(function(){
            $('#selected-filters-rel-set').append('<span>'+$(this).data('filter-display-attr')+': '+$(this).data('filter-display-val')+'</span>');
            if(!filters[$(this).data('filter-attr-id')]) {
                filters[$(this).data('filter-attr-id')] = [];
            }
            filters[$(this).data('filter-attr-id')].push($(this).prop('value'));
        });
        $('#search_derived_set .search-checkbox-list input:checked').each(function(){
            $('#selected-filters-der-set').append('<span>'+$(this).data('filter-display-attr')+': '+$(this).data('filter-display-val')+'</span>');
            if(!filters[$(this).data('filter-attr-id')]) {
                filters[$(this).data('filter-attr-id')] = [];
            }
            filters[$(this).data('filter-attr-id')].push($(this).prop('value'));
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

    $('#save-cohort-modal').on('hide.bs.modal', function() {
        $('#save-cohort-modal .selected-filters span').remove();
        $('input[name="selected-filters"]').prop('value', '');
    });

    // Bootstrap and jQueryUI are not friends, because they overwrite each other's tooltip
    // We want the jQueryUI tooltip, since it lets you use DOM elements.
    // If bootstrap loaded first, revert the tooltip, copy it into a new function name, and
    // restore Bootstrap's
    if($.fn.tooltip.noConflict) {
        var bsTooltip = $.fn.tooltip.noConflict();
        $.fn.jqTooltip = $.fn.tooltip;
        $.fn.tooltip = bsTooltip;
    // If jQueryUI loaded first, just save it out; bootstrap will eventually clobber it,
    // but now we have a copy safe and sound.
    } else {
        $.fn.jqTooltip = $.fn.tooltip;
    }

    $('.collection_name').jqTooltip({
        hide: {
            duration: 200,
            delay: 900
        },
        items: 'span.collection_name',
        content: function() {
            return $('<div>' + collection_tooltips[$(this).siblings('input.collection_value').attr('value')]+'</div>')
        }
    });

});
