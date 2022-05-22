/* Some code in this plugin are copied from Zotero plugin Zscript
Zscript https://github.com/wshanks/Zscript

*/

'use script'

// Output symbols
var EXPORTED_SYMBOLS = ['Zscript']

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://zotero/config.js');

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
    _menuFunctions: {
        item: [],
        collection: ['copyZoteroCollectionSelectLink', 'copyZoteroCollectionURI']
    },

    _bundle: Cc['@mozilla.org/intl/stringbundle;1'].
        getService(Components.interfaces.nsIStringBundleService).
        createBundle('chrome://zscript/locale/zscript.properties'),
    _scripts: {
        T1: {
            name: "T1",
            description: "A simple demo 1",
            disable: false,
            isAsync: false,
            content: "var v1='hello world1';\n alert(v1);"
        },
        T2: {
            name: "T2",
            description: "A simple demo 2",
            disable: false,
            isAsync: true,
            content: "var res = await Zotero.HTTP.request('GET', \"http://www.baidu.com\");\nZotero.debug(res.responseText);"
        },
        T3: {
            name: "T3",
            description: "A simple demo 3",
            disable: false,
            isAsync: false,
            content: "Zotero.debug(Zscript._scripts);"
        }
    },

    init: function () {
        if (Zotero.Prefs.get("zscript.script") === undefined) {
            Zotero.Prefs.set("zscript.script", JSON.stringify(Zscript._scripts));
        } else {
            Zscript._scripts = JSON.parse(Zotero.Prefs.get("zscript.script"));
        }
        this.observers.register();
        this.prepareWindows()
    },

    prepareWindows: function () {
        // Load scripts for previously opened windows
        var windows = Services.wm.getEnumerator('navigator:browser');
        while (windows.hasMoreElements()) {
            this.loadWindowChrome(windows.getNext());
        }

        // Add listener to load scripts in windows opened in the future
        Services.wm.addListener(this.windowListener);
    },


    windowListener: {
        onOpenWindow: function (xulWindow) {
            var domWindow = xulWindow
                .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIDOMWindow)

            domWindow.addEventListener('load', function listener() {
                domWindow.removeEventListener('load', listener, false)

                if (domWindow.document.documentElement.
                    getAttribute('windowtype') == 'navigator:browser') {
                    Zscript.loadWindowChrome(domWindow)
                }
            }, false)
        },

        onCloseWindow: function (_xulWindow) { },

        onWindowTitleChange: function (_xulWindow, _newTitle) { }
    },

    loadWindowChrome: function (scope) {
        // Define ZscriptChrome as window property so it can be deleted on
        // shutdown
        scope.ZscriptChrome = {};

        Services.scriptloader.loadSubScript(
            'chrome://zscript/content/zscriptChrome.js', scope);
        // scope.ZscriptChrome.init();

        Services.scriptloader.loadSubScript(
            'chrome://zscript/content/zoteroOverlay.js', scope);
        scope.ZscriptChrome.zoteroOverlay.init();
    },

    // Observers here
    observers: {
        observe: function (subject, topic, data) {
            var windows = Services.wm.getRnumerator("navigator:browser");
            var tmpWin;

            switch (topic) {
                case "zscript-zoteroitemmenu-update": {
                    while (windows.hasMoreElements()) {
                        tmpWin = windows.getNext();
                        // Load overlay when no overlay is loaded
                        if ((typeof tmpWin.ZscriptChrome) != "undefined" &&
                            (typeof tmpWin.ZscriptChrome.zoteroOverlay) != "undefined") {
                            // tmpWin.ZscriptChrome.zoteroOverlay.refreshZoteroPopup('menu');
                            debug("AAAA");
                            tmpWin.ZscriptChrome.zoteroOverlay.showPopup();
                        }
                    }
                    break;
                }

                default:
            }
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

    /********************************************/
    // General use utility functions
    /********************************************/
    openLink: function (url) {
        // first construct an nsIURI object using the ioservice
        var ioservice = Cc['@mozilla.org/network/io-service;1']
            .getService(Ci.nsIIOService);

        var uriToOpen = ioservice.newURI(url, null, null);

        var extps = Cc['@mozilla.org/uriloader/external-protocol-service;1']
            .getService(Ci.nsIExternalProtocolService);

        // now, open it!
        extps.loadURI(uriToOpen, null);
    },

    escapeForRegExp: function (str) {
        // Escape all symbols with special regular expression meanings
        // Function taken from http://stackoverflow.com/a/6969486
        return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    },

    getString: function (name) {
        let match = name.match(/(.*_alt)(\d+)$/)
        if (match === null) {
            return Zscript._bundle.GetStringFromName(name)
        } else {
            let base = match[1]
            let num = match[2]
            return Zscript._bundle.formatStringFromName(base, [num], 1)
        }
    }
}

/**
 * A new branch of Zotero preference
 */
Zscript.Prefs = {
    init: function () {
        this.prefBranch = Services.prefs.getBranch("extensions.zscript.");
        this.setDefaults();
        this.register();
    }
}