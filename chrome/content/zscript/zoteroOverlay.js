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
    ZscriptChrome.zoteroOverlay.refreshZoteroPopup('item', document)
}


ZscriptChrome.zoteroOverlay = {
    /******************************************/
    // Window load handling
    /******************************************/
    init: function () {
        this.fullOverlay();
        document.getElementById('zotero-itemmenu')
            .addEventListener('popupshowing', refreshZoteroItemPopup, false)
    },

    unload: function () {
        var toolsPopup = document.getElementById('menu_ToolsPopup')
        toolsPopup.removeEventListener('popupshowing',
            ZscriptChrome.zoteroOverlay.prefsSeparatorListener, false)

        document.getElementById('zotero-itemmenu').removeEventListener('popupshowing', refreshZoteroItemPopup, false)
        document.getElementById('zotero-collectionmenu').removeEventListener('popupshowing', refreshZoteroCollectionPopup, false)
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

        var zscriptSeparator = doc.createElement('menuseparator');
        var zscriptSeparatorID = `zscript-${menuName}menu-separator`;
        zscriptSeparator.setAttribute('id', zscriptSeparatorID);
        zoteroMenu.appendChild(zscriptSeparator);
        ZscriptChrome.registerXUL(zscriptSeparatorID, doc);

        this.createMenuItems(menuName, zoteroMenu, `zscript-zotero${menuName}menu-`,
            true, doc);

        // Zscript submenu
        var zscriptSubmenu = doc.createElement('menu');
        var zscriptSubmenuID = `zscript-${menuName}menu-submenu`;
        zscriptSubmenu.setAttribute('id', zscriptSubmenuID);
        zscriptSubmenu.setAttribute(
            'label',
            Zscript.getString(`zscript.${menuName}menu.zscript`)
        )
        zoteroMenu.appendChild(zscriptSubmenu);
        ZscriptChrome.registerXUL(zscriptSubmenuID, doc);

        // Zscript submenu popup
        var zscriptSubmenuPopup = doc.createElement('menupopup');
        zscriptSubmenuPopup.setAttribute('id', `zscript-${menuName}menu-submenupopup`);
        zscriptSubmenu.appendChild(zscriptSubmenuPopup);

        this.createMenuItems(menuName, zscriptSubmenuPopup, `zscript-zscript${menuName}menu-`,
            false, doc);

        this.refreshZoteroPopup(menuName, doc);
    },

    // Update hidden state of Zotero item menu elements
    refreshZoteroPopup: function (menuName, doc) {
        if (typeof doc == 'undefined') {
            doc = document;
        }
        var showMenuSeparator = false;
        var showSubmenu = false;

        for (const functionName of Zscript._menuFunctions[menuName]) {
            var prefVal = Zscript.Prefs.get(`${menuName}menu.${functionName}`);

            var zscriptMenuItem = doc.getElementById(`zscript-zscript${menuName}menu-${functionName}`);
            var zoteroMenuItem = doc.getElementById(`zscript-zotero${menuName}menu-${functionName}`);

            const visible = !this.CheckVisibility[functionName] || this.CheckVisibility[functionName]()

            if (visible && prefVal == 'Zotero') {
                showMenuSeparator = true;
                zscriptMenuItem.hidden = true;
                zoteroMenuItem.hidden = false;
            } else if (visible && prefVal == 'Zscript') {
                showMenuSeparator = true;
                showSubmenu = true;
                zscriptMenuItem.hidden = false;
                zoteroMenuItem.hidden = true;
            } else {
                zscriptMenuItem.hidden = true;
                zoteroMenuItem.hidden = true;
            }
        }

        doc.getElementById(`zscript-${menuName}menu-separator`).hidden = !showMenuSeparator;
        doc.getElementById(`zscript-${menuName}menu-submenu`).hidden = !showSubmenu;
    },

    // Create Zotero item menu items as children of menuPopup
    createMenuItems: function (menuName, menuPopup, IDPrefix, elementsAreRoot, doc) {

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

    /******************************************/
    // Keyboard shortcut functions
    /******************************************/
    initKeys: function () {
        var keyset = document.createElement('keyset');
        this.keyset = keyset;
        this.keyset.setAttribute('id', 'zscript-keyset');
        document.getElementById('mainKeyset').parentNode.
            appendChild(this.keyset);
        ZscriptChrome.XULRootElements.push(this.keyset.id);

        for (var keyLabel in Zscript.keys.shortcuts) {
            this.createKey(keyLabel)
        }
    },

    reloadKeys: function () {
        for (let key of this.keyset.children) {
            this.keyset.removeChild(key)
        }
        for (var keyLabel in Zscript.keys.shortcuts) {
            this.createKey(keyLabel)
        }
    },

    createKey: function (keyLabel) {
        var key = document.createElement('key');
        key.setAttribute('id', Zscript.keys.keyID(keyLabel));
        this.keyset.appendChild(key);
        // Set label attribute so that keys show up nicely in keyconfig
        // extension
        key.setAttribute('label', 'Zscript: ' + Zscript.keys.keyName(keyLabel));
        // key.setAttribute('command', 'zscript-keyset-command');
        key.setAttribute('oncommand', '//');
        key.addEventListener('command',
            function () {
                Zscript.keys.shortcuts[keyLabel](window);
            });

        var keyObj = Zscript.keys.getKey(keyLabel);

        if (keyObj.modifiers) {
            key.setAttribute('modifiers', keyObj.modifiers);
        }
        if (keyObj.key) {
            key.setAttribute('key', keyObj.key);
        } else if (keyObj.keycode) {
            key.setAttribute('key', keyObj.key);
        } else {
            // No key or keycode.  Set to empty string to disable.
            key.setAttribute('key', '');
        }
    },

    updateKey: function (keyLabel) {
        var key = document.getElementById(Zscript.keys.keyID(keyLabel));
        if (key === null) {
            // updateKey gets triggered before keys have been set when Zscript
            // is reinstalled if shortcuts had been set during the previous
            // install previously defined
            return
        }

        key.removeAttribute('modifiers');
        key.removeAttribute('key');
        key.removeAttribute('keycode');

        var keyObj = Zscript.keys.getKey(keyLabel);

        if (keyObj.modifiers) {
            key.setAttribute('modifiers', keyObj.modifiers);
        }
        if (keyObj.key) {
            key.setAttribute('key', keyObj.key);
        } else if (keyObj.keycode) {
            key.setAttribute('key', keyObj.key);
        } else {
            // No key or keycode.  Set to empty string to disable.
            key.setAttribute('key', '');
        }

        // Regenerate keys
        var keyset = this.keyset;
        keyset.parentNode.insertBefore(keyset, keyset.nextSibling);
    },

    /******************************************/
    // Zotero item selection and sorting
    /******************************************/

    // Get all selected attachment items and all of the child attachments of
    // all selected regular items.
    // To get just the selected attachment items, use
    // Zscript.siftItems(inputArray, 'attachment') instead.
    getSelectedAttachments: function (mode) {

        var zitems = this.getSelectedItems();
        if (!zitems) {
            return [];
        }

        // Add child attachments of all selected regular items to
        // attachmentItems
        var zitem;
        var attachmentItems = [];
        while (zitems.length > 0) {
            zitem = zitems.shift();

            if (zitem.isRegularItem()) {
                attachmentItems =
                    attachmentItems.concat(Zotero.Items.
                        get(zitem.getAttachments(false)));
            } else if (zitem.isAttachment()) {
                attachmentItems.push(zitem);
            }
        }

        if (mode !== undefined) {
            attachmentItems = attachmentItems.filter(
                (item) => item.attachmentLinkMode == mode
            )
        }

        // Return attachments after removing duplicate items (when parent and
        // child are selected)
        return this.removeDuplicateItems(attachmentItems);
    },

    // Return array with the selected item objects.  If itemType is passed,
    // return only items of that type (or types if itemType is an array)
    getSelectedItems: function (itemType) {
        var zitems = window.ZoteroPane.getSelectedItems();
        if (!zitems.length) {
            return false;
        }

        if (itemType) {
            if (!Array.isArray(itemType)) {
                itemType = [itemType];
            }
            var siftedItems = this.siftItems(zitems, itemType);
            return siftedItems.matched;
        } else {
            return zitems;
        }
    },

    checkItemType: function (itemObj, itemTypeArray) {
        var matchBool = false;

        for (var idx = 0; idx < itemTypeArray.length; idx++) {
            switch (itemTypeArray[idx]) {
                case 'attachment':
                    matchBool = itemObj.isAttachment();
                    break;
                case 'note':
                    matchBool = itemObj.isNote();
                    break;
                case 'regular':
                    matchBool = itemObj.isRegularItem();
                    break;
                default:
                    matchBool = Zotero.ItemTypes.getName(itemObj.itemTypeID) ==
                        itemTypeArray[idx];
            }

            if (matchBool) {
                break;
            }
        }

        return matchBool;
    },

    // Remove duplicate Zotero item objects from itemArray
    removeDuplicateItems: function (itemArray) {
        // Get array of itemID's
        var itemIDArray = [];
        for (var index = 0; index < itemArray.length; index++) {
            itemIDArray[index] = itemArray[index].itemID;
        }

        // Create array of unique itemID's
        var tempObject = {};
        var uniqueIDs = [];
        for (index = 0; index < itemIDArray.length; index++) {
            tempObject[itemIDArray[index]] = itemIDArray[index];
        }
        for (index in tempObject) {
            uniqueIDs.push(tempObject[index]);
        }

        return Zotero.Items.get(uniqueIDs);
    },

    // Separate itemArray into an array of items with type itemType and an
    // array with those with different item types
    siftItems: function (itemArray, itemTypeArray) {
        var matchedItems = [];
        var unmatchedItems = [];
        while (itemArray.length > 0) {
            if (this.checkItemType(itemArray[0], itemTypeArray)) {
                matchedItems.push(itemArray.shift());
            } else {
                unmatchedItems.push(itemArray.shift());
            }
        }

        return {
            matched: matchedItems,
            unmatched: unmatchedItems
        };
    },

    // Check number of items in itemArray and show error message if it does not
    // match checkType. Note that checkType sets the number to be checked and
    // the error message to display. The actual item types are not checked.
    checkItemNumber: function (itemArray, checkType) {
        var checkBool = true;

        var prompts = Components.
            classes['@mozilla.org/embedcomp/prompt-service;1'].
            getService(Components.interfaces.nsIPromptService);

        var errorTitle = Zscript.getString('zscript.checkItems.errorTitle')
        switch (checkType) {
            case 'regular1':
            case 'regularOrNote1':
            case 'regularNoteAttachment1':
                if (!itemArray.length) {
                    prompts.alert(
                        null,
                        errorTitle,
                        Zscript.getString('zscript.checkItems.' + checkType)
                    )
                    checkBool = false;
                }
                break;
            case 'regularSingle':
                if ((!itemArray.length) || (itemArray.length > 1)) {
                    prompts.alert(
                        null,
                        errorTitle,
                        Zscript.getString('zscript.checkItems.regularSingle')
                    )
                    checkBool = false;
                }
                break;
            case 'regular2':
            case 'regularOrNote2':
            case 'regularNoteAttachment2':
                if ((!itemArray.length) || (itemArray.length < 2)) {
                    prompts.alert(
                        null,
                        errorTitle,
                        Zscript.getString('zscript.checkItems.' + checkType)
                    )
                    checkBool = false;
                }
                break;
            case 'attachment1':
                if (!itemArray.length) {
                    prompts.alert(
                        null,
                        errorTitle,
                        Zscript.getString('zscript.checkItems.attachment1')
                    )
                    checkBool = false;
                }
                break;
        }

        return checkBool;
    }
};
