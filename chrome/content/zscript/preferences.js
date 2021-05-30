'use strict';
/* global window, document, Components */
/* global keyconfigOnLoad, Zscript */
Components.utils.import('chrome://zscript/content/zscript.js');
Components.utils.import("resource://gre/modules/Services.jsm");

// eslint-disable-next-line no-unused-vars
// function initializePrefWindow() {
//     keyconfigOnLoad();
// }

// eslint-disable-next-line no-unused-vars
function buildMenuPrefs() {
    for (const menuName of ['item', 'collection']) {
        for (const functionName of Zscript._menuFunctions[menuName]) {
            addMenuPreference(menuName, functionName);
            addMenuRadiogroup(menuName, functionName);
        }
    }
}

function addMenuPreference(menuName, menuFunction) {
    var newPref = document.createElement('preference');
    newPref.setAttribute('id', `pref-${menuName}menu-${menuFunction}`);
    newPref.setAttribute('name', `extensions.zscript.${menuName}menu.${menuFunction}`);
    newPref.setAttribute('type', 'string');

    var zscriptPrefs = document.getElementById('zscript-prefpane-ui-preferences');
    zscriptPrefs.appendChild(newPref);
}

function addMenuRadiogroup(menuName, menuFunction) {
    var newRow = document.createElement('row');

    var newHbox = document.createElement('hbox');
    newHbox.setAttribute('align', 'center');
    var newLabel = document.createElement('label');
    newLabel.setAttribute(
        'value',
        Zscript.getString(`zscript.preferences.${menuName}menu.${menuFunction}`)
    )
    newHbox.appendChild(newLabel);
    newRow.appendChild(newHbox);

    var newRadiogroup = document.createElement('radiogroup');
    newRadiogroup.setAttribute('orient', 'horizontal');
    newRadiogroup.setAttribute('align', 'center');
    newRadiogroup.setAttribute('preference',
        `pref-${menuName}menu-${menuFunction}`);

    var newRadio;
    for (const label of ['Zotero', 'Zscript', 'Hide']) {
        newRadio = document.createElement('radio');
        newRadio.setAttribute(
            'label',
            Zscript.getString(`zscript.preferences.${menuName}menu.${label}`)
        )
        newRadio.setAttribute('value', label);
        newRadiogroup.appendChild(newRadio);
    }

    newRow.appendChild(newRadiogroup);

    // Ugly but this is the only way I have found to put in buffer space for
    // the vertical scrollbar. Otherwise the scrollbar appears on top of the
    // "Hide" label.
    var spacer = document.createElement("label")
    spacer.setAttribute("value", "   ")
    newRow.appendChild(spacer)

    var menuRows = document.getElementById(`zscript-prefpane-${menuName}-rows`);
    menuRows.appendChild(newRow);
}

// eslint-disable-next-line no-unused-vars
function openWindowByType(uri, type, features) {
    var win = Services.wm.getMostRecentWindow(type);

    if (win) {
        win.focus();
    }
    else if (features) {
        window.open(uri, "_blank", features);
    }
    else {
        window.open(uri, "_blank", "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
    }
}

function showReadme() {
    openWindowByType(
        'chrome://zotero/content/runJS.html',
        'zotero:run-js',
        'chrome,width=900,height=700,resizable,centerscreen'
    );
}
