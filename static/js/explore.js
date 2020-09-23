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
        tippy: 'libs/tippy-bundle.umd.min',
        //d3: 'libs/d3.v5.min',
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
        'tablesorter': ['jquery'],
        'base': ['jquery'],
        //'imagesearch':['d3'],

    }
});

require([
    'jquery',
    'tippy',
    'base',
    'imagesearch',
    'jqueryui',
    'bootstrap',
    'tablesorter',
    'cohortfilelist',
], function ($, tippy, base, imagesearch, d3, cohortfilelist) {
    var saving_cohort = false;

    $('#save-cohort-modal').on('show.bs.modal', function() {
        var filters = {};
        $('#program_set input:checked, ' +
            '#search_orig_set .search-checkbox-list input:checked, ' +
            '#search_related_set .search-checkbox-list input:checked, ' +
            '#search_derived_set .search-checkbox-list input:checked').each(function(){

            let modal_filter_block = '';
            if($(this).parents('#program_set').length > 0) {
                modal_filter_block = '#selected-filters-prog-set';
            } else if($(this).parents('#search_orig_set').length > 0) {
                modal_filter_block = '#selected-filters-orig-set';
            } else if($(this).parents('#search_related_set').length > 0) {
                modal_filter_block = '#selected-filters-rel-set';
            } else if($(this).parents('#search_derived_set').length > 0) {
                modal_filter_block = '#selected-filters-der-set';
            }

            if($(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).length <= 0) {
                $(`${modal_filter_block}`).append('<p class="cohort-filter-display '+$(this).data('filter-attr-id')
                    +'"><span class="attr">'+$(this).data('filter-display-attr')+':</span></p>');
            }
             $(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).append(
                 '<span class="val">'+$(this).data('filter-display-val')+'</span>'
             );
            if(!filters[$(this).data('filter-attr-id')]) {
                filters[$(this).data('filter-attr-id')] = [];
            }
            filters[$(this).data('filter-attr-id')].push($(this).prop('value'));
        });

        $('.ui-slider').each(function() {
            let modal_filter_block = '';
            if($(this).parents('#program_set').length > 0) {
                modal_filter_block = '#selected-filters-prog-set';
            } else if($(this).parents('#search_orig_set').length > 0) {
                modal_filter_block = '#selected-filters-orig-set';
            } else if($(this).parents('#search_related_set').length > 0) {
                modal_filter_block = '#selected-filters-rel-set';
            } else if($(this).parents('#search_derived_set').length > 0) {
                modal_filter_block = '#selected-filters-der-set';
            }

            var $this = $(this);
            var left_val = $this.slider("values", 0);
            var right_val = $this.slider("values", 1);
            var min = $this.slider("option", "min");
            var max = $this.slider("option", "max");
            if (left_val !== min || right_val !== max) {
                if($(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).length <= 0) {
                    $(`${modal_filter_block}`).append('<p class="cohort-filter-display '+$(this).data('filter-attr-id')
                        +'"><span class="attr">'+$(this).data('filter-display-attr')+':</span></p>');
                }
                 $(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).append(
                     '<span class="val">'+left_val + " to "+right_val+'</span>'
                 );
                filters[$(this).data('filter-attr-id')] = [left_val,right_val];
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
    });


    tippy('.collection_name', {
        content: function(reference) {
            let tooltip = collection_tooltips[$(reference).siblings('input.collection_value').attr('value')];
            if(tooltip) {
                return '<div class="collection-tooltip">'+tooltip+'</div>';
            }
            return '<span></span>';

        },
        theme: 'light',
        arrow: false,
        allowHTML: true,
        interactive: true
    });
});
