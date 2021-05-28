'use script'

// Output symbols
var EXPORTED_SYMBOLS = ['Zscript']

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import('resource://gre/modules/Services.jsm');

/**
 * Zscript namespace
 */
var Zscript = {
    /********************************************/
    // Basic information
    /********************************************/
    id: 'zscript@linxzh.com',
    zoteroID: 'zotero@chnm.gmu.edu',
    zoteroTabURL: 'chrome://zotero/content/tab.xul',

    // TODO: bundle string here


    init: function () {

    },


    // Observers here
    observers: {
        observe: function (subject, topic, data) {

        },

        register: function () {
            Services.obs.addObserver(this, 'zscript-zoteroitemmenu-update',
                false);
        },

        unregister: function () {
            Services.obs.removeObserver(this, 'zscript-zoteroitemmenu-update',
                false);
        }
    },

}