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
function saveScript() {
    let name = document.getElementById("script-name");
    let content = document.getElementById("script-content");
    if (name.value in Zscript._scripts) {
        Zscript._scripts[name.value].
    }
    Zscript._scripts
}

function updateEditor(idx) {
    var name = document.getElementById("script-name");
    var content = document.getElementById("script-content");
    name.value = Zscript._scripts[parseInt(idx)].name;
    content.value = Zscript._scripts[parseInt(idx)].content;
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
