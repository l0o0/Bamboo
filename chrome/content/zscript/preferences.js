'use strict';
/* global window, document, Components */
/* global keyconfigOnLoad, Zscript */
Components.utils.import('chrome://zscript/content/zscript.js');
Components.utils.import("resource://gre/modules/Services.jsm");


// eslint-disable-next-line no-unused-vars
// function initializePrefWindow() {
//     keyconfigOnLoad();
// }

// Load default config and prepare preference windows
function init() {
    return;
}

function saveScript() {
    let name = document.getElementById("script-name");
    let content = document.getElementById("script-content");
    let disable = document.getElementById("disable");
    if (name.value in Zscript._scripts) {
        Zscript._scripts[name.value].content = content.value;
        Zscript._scripts[name.value].disable = disable.checked;
        Zscript._scripts[name.value].isAsync = checkAsync(content.value);
    } else {
        Zscript._scripts[name.value] = { name: name.value };
        Zscript._scripts[name.value].content = content.value;
        Zscript._scripts[name.value].disable = disable.checked;
        Zscript._scripts[name.value].isAsync = checkAsync(content.value);
    }
    alert("Saved!");
}

function updateEditor(label) {
    var name = document.getElementById("script-name");
    var content = document.getElementById("script-content");
    var disable = document.getElementById("disable")
    name.value = label;
    content.value = Zscript._scripts[label].content;
    disable.checked = Zscript._scripts[label].disable;
}


function checkAsync(code) {
    // This check code if from Zotero RunJS in Run Javascript
    if (code.includes("await")) {
        return true;
    }
    return false;
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
