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
});