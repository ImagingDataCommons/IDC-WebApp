require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.7.1.min',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        'datatables.net': 'libs/jquery.dataTables.min',
        base: 'base',
        tooltips: 'tooltips'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'datatables.net': ['jquery']
    }
});


require(['jquery', 'datatables.net','jqueryui', 'bootstrap', 'base', 'tooltips'], function($) {
    let download_btn = $('.download-instances');
    if (!("showDirectoryPicker" in window)) {
        download_btn.attr('data-disabled-type','download-all-disabled');
        download_btn.addClass('is-disabled');
    }

    $('#collection_details').on('click', '.show-more, .show-less', function(){
        const clicked = $(this);
        if(clicked.hasClass('show-more')) {
            let xtra_vals = $(clicked.attr('data-show-target')).find('.extra-values');
            xtra_vals.removeClass('is-hidden');
            $('.show-more-count').hide();
        }
        if(clicked.hasClass('show-less')) {
            let xtra_vals = $(clicked.attr('data-hide-target')).find('.extra-values');
            xtra_vals.addClass('is-hidden');
            $('.show-more-count').show();
        }
        clicked.siblings('.show-sib').removeClass('is-hidden');
        clicked.addClass('is-hidden');
    });
});