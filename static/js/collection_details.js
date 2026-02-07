require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    urlArgs: "v="+APP_VERSION,
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
        let xtra_vals = $(clicked.attr('data-toggle-target')).find('.extra-values');
        if(clicked.hasClass('show-more')) {
            xtra_vals.removeClass('is-hidden');
            $('.show-more-count').addClass('is-hidden');
        }
        if(clicked.hasClass('show-less')) {
            xtra_vals.addClass('is-hidden');
            $('.show-more-count').removeClass('is-hidden');
        }
        clicked.siblings('.show-sib').removeClass('is-hidden');
        clicked.addClass('is-hidden');
    });
});