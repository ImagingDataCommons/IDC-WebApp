require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    urlArgs: "v="+APP_VERSION,
    paths: {
        base: 'base'
    }
});

require([
    'base'
], function (base) {

});