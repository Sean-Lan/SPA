/*
 * spa.js
 * Root namespace module
 */

/* exported spa */
var spa = (function () {
    var initModule = function ( $container ) {
        spa.shell.initModule($container);
    };
    return { initModule: initModule };
}());

