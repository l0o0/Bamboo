'use strict';

/* global window, document, Components */
/* global Zotero, ZoteroPane, ZOTERO_CONFIG */
/* global Zscript, ZscriptChrome */
Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('chrome://zscript/content/zscript.js');
Components.utils.import('resource://zotero/config.js');

function debug(msg, err) {
    if (err) {
        Zotero.debug(`{Zscript} ${new Date} error: ${msg} (${err} ${err.stack})`)
    } else {
        Zotero.debug(`{Zscript} ${new Date}: ${msg}`)
    }
}


// needed as a separate function, because ZscriptChrome.zoteroOverlay.refreshZoteroPopup refers to `this`, and a bind would make it two separate functions in add/remove eventlistener
function refreshZoteroItemPopup() {
    // ZscriptChrome.zoteroOverlay.refreshZoteroPopup('item', document)
    debug("show popup");
    ZscriptChrome.zoteroOverlay.showPopup();
}


ZscriptChrome.zoteroOverlay = {
    /******************************************/
    // Window load handling
    /******************************************/
    init: function () {
        this.fullOverlay();
        debug("overlay init");
        document.getElementById('zotero-itemmenu')
            .addEventListener('popupshowing', refreshZoteroItemPopup, false)
    },

    unload: function () {
        var toolsPopup = document.getElementById('menu_ToolsPopup');
        toolsPopup.removeEventListener('popupshowing',
            ZscriptChrome.zoteroOverlay.prefsSeparatorListener, false);

        document.getElementById('zotero-itemmenu').removeEventListener('popupshowing', refreshZoteroItemPopup, false);
        // document.getElementById('zotero-collectionmenu').removeEventListener('popupshowing', refreshZoteroCollectionPopup, false)
    },

    /************************************/
    // Text
    /************************************/

    showPopup: function () {
        var zoteroMenu = document.getElementById('zotero-itemmenu');
        var scripts = Zscript._scripts;
        var enableScripts = ZscriptChrome.zoteroOverlay.scriptFilter(scripts);
        var separatorID = 'zscript-itemmenu-T1';
        var menuExists = document.getElementById(separatorID);

        if (menuExists === null) {
            debug("create menu");
            var separator = document.createElement('menuseparator');
            separator.setAttribute('id', separatorID);
            zoteroMenu.appendChild(separator);
            var zscriptMenu = document.createElement("menu");
            zscriptMenu.setAttribute("label", "Zscript");
            // Sub item menu as child of menu popup. Scripts are sub menu
            var zscriptMenuPopup = document.createElement("menupopup");
            zscriptMenuPopup.setAttribute("id", "zscript-menupopup");
            zscriptMenu.appendChild(zscriptMenuPopup);
            zoteroMenu.appendChild(zscriptMenu);
        }
        // Update submenu by enabled scripts
        if (Object.keys(enableScripts).length > 0) {
            var zscriptMenuPopup = document.getElementById("zscript-menupopup");
            while (zscriptMenuPopup.lastChild) {
                zscriptMenuPopup.removeChild(zscriptMenuPopup.lastChild);
            }

            for (let k in enableScripts) {
                debug(k);
                var itemMenu = document.createElement("menuitem");
                itemMenu.setAttribute("id", `zscript-itemmenu-${enableScripts[k].name}`);
                itemMenu.setAttribute("label", enableScripts[k].name);
                // itemMenu.setAttribute("oncommand", `Zscript.runCode('${k}');`);
                itemMenu.addEventListener('command',
                    function (event) {
                        event.stopPropagation();
                        ZscriptChrome.zoteroOverlay.runCode(k);
                    }, false);
                zscriptMenuPopup.appendChild(itemMenu);
            }
        }

    },

    scriptFilter: function (obj) {
        let result = {}, key;
        for (key in obj) {
            if (obj[key].disable === false) {
                result[key] = obj[key];
            }
        }
        return result;
    },

    runCode: async function (k) {
        var win = Zotero.getMainWindow();
        var code = Zscript._scripts[k].content;
        if (Zscript._scripts[k].isAsync) {
            debug("async");
            code = '(async function () {' + code + '})()';
            await win.eval(code);
        } else {
            debug("not async");
            win.eval(code);
        }
    },


    /******************************************/
    // XUL overlay functions
    /******************************************/
    fullOverlay: function () {
        // Add all Zscript overlay elements to the window
        ZscriptChrome.zoteroOverlay.overlayZoteroPane(document)
        // this.initKeys();

        // var toolsPopup = document.getElementById('menu_ToolsPopup')
        // toolsPopup.addEventListener('popupshowing',
        //     ZscriptChrome.zoteroOverlay.prefsSeparatorListener, false)
    },

    overlayZoteroPane: function (doc) {
        var menuPopup
        menuPopup = doc.getElementById('menu_ToolsPopup')
        ZscriptChrome.zoteroOverlay.prefsMenuItem(doc, menuPopup)
        ZscriptChrome.zoteroOverlay.zoteroPopup('item', doc)
        ZscriptChrome.zoteroOverlay.zoteroPopup('collection', doc)
    },

    // Unknown function
    pageloadListener: function (event) {
        if (event.originalTarget.location == Zscript.zoteroTabURL) {
            ZscriptChrome.zoteroOverlay.overlayZoteroPane(event.originalTarget);
        }
    },

    prefsMenuItem: function (doc, menuPopup) {
        // Add Zscript preferences item to Tools menu
        if (menuPopup === null) {
            // Don't do anything if elements not loaded yet
            return;
        }

        var zscriptMenuItem = doc.createElement('menuitem')
        var zscriptMenuItemID = 'zscript-preferences'
        zscriptMenuItem.setAttribute('id', zscriptMenuItemID)
        zscriptMenuItem.setAttribute(
            'label',
            Zscript.getString('zscript.preferences.menuitem')
        )
        zscriptMenuItem.addEventListener('command',
            function () {
                ZscriptChrome.openPreferences()
            }, false)

        menuPopup.appendChild(zscriptMenuItem)

        ZscriptChrome.registerXUL(zscriptMenuItemID, doc)
    },

    /******************************************/
    // Item menu functions
    /******************************************/
    // Create XUL for Zotero menu elements
    zoteroPopup: function (menuName, doc) {
        var zoteroMenu = doc.getElementById(`zotero-${menuName}menu`);
        if (zoteroMenu === null) {
            // Don't do anything if elements not loaded yet
            return;
        }
        let deletions = []
        for (let child of zoteroMenu.children) {
            if (child.id.startsWith("zscript")) {
                deletions.push(child)
            }
        }
        for (let child of deletions) {
            zoteroMenu.removeChild(child)
        }

        // var zscriptSeparator = doc.createElement('menuseparator');
        // var zscriptSeparatorID = `zscript-${menuName}menu-separator`;
        // zscriptSeparator.setAttribute('id', zscriptSeparatorID);
        // zoteroMenu.appendChild(zscriptSeparator);
        // ZscriptChrome.registerXUL(zscriptSeparatorID, doc);


        // Zscript submenu
        // var zscriptSubmenu = doc.createElement('menu');
        // var zscriptSubmenuID = `zscript-${menuName}menu-submenu`;
        // zscriptSubmenu.setAttribute('id', zscriptSubmenuID);
        // zscriptSubmenu.setAttribute(
        //     'label',
        //     Zscript.getString(`zscript.${menuName}menu.zscript`)
        // )
        // zoteroMenu.appendChild(zscriptSubmenu);
        // ZscriptChrome.registerXUL(zscriptSubmenuID, doc);

        // Zscript submenu popup
        // var zscriptSubmenuPopup = doc.createElement('menupopup');
        // zscriptSubmenuPopup.setAttribute('id', `zscript-${menuName}menu-submenupopup`);
        // zscriptSubmenu.appendChild(zscriptSubmenuPopup);
    },


    // Create Zotero item menu item
    zoteroMenuItem: function (menuName, functionName, IDPrefix, doc) {
        var menuFunc = doc.createElement('menuitem');
        menuFunc.setAttribute('id', IDPrefix + functionName);
        menuFunc.setAttribute(
            'label',
            Zscript.getString(`zscript.${menuName}menu.${functionName}`)
        )
        let match = functionName.match(/(.*_alt)(\d+)$/)
        if (match === null) {
            menuFunc.addEventListener('command',
                function (event) {
                    event.stopPropagation()
                    ZscriptChrome.zoteroOverlay[functionName]()
                }, false)
        } else {
            let base = match[1]
            let num = match[2]
            menuFunc.addEventListener('command',
                function (event) {
                    event.stopPropagation()
                    ZscriptChrome.zoteroOverlay[base](num)
                }, false)
        }
        return menuFunc;
    },
};
