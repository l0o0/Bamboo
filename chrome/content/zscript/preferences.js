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
    var listbox = document.getElementById("script-listbox");

    listbox.addEventListener("click", function (event) {
        var target = event.target;
        // alert(target.getAttribute('label'));
        updateEditor(target.getAttribute('label'));
    }, false);

    refreshListBox(true);
}

function createListItem(label) {
    var listitem = document.createElement("listitem");
    listitem.setAttribute("label", label);
    listitem.setAttribute("id", label === "➕..." ? "new" : label);
    listitem.setAttribute("width", "100");
    return listitem;
}

function refreshListBox(whole = null, added = null) {
    var listbox = document.getElementById("script-listbox");
    var listitem, key;
    if (whole != null) {
        for (key in Zscript._scripts) {
            listitem = createListItem(key);
            listbox.appendChild(listitem);
        }
    }
    if (added != null) {
        listitem = document.getElementById("new");
        listitem.setAttribute("label", added);
        listitem.setAttribute("id", added);
        listitem.setAttribute("width", "100");
        listbox.appendChild(listitem);
    }
    // Click the last listitem to create new script.
    listitem = createListItem("➕...");
    listbox.appendChild(listitem);
}

function saveScript() {
    let name = document.getElementById("script-name");
    let content = document.getElementById("script-content");
    let disable = document.getElementById("disable");
    let msg = checkInput(name.value, content.value);
    if (msg != '') {
        alert(msg);
        return
    }
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
    refreshListBox(null, name.value);
}

// Delete selected script in listbox.
function deleteScript() {
    var listbox = document.getElementById("script-listbox");
    var selectedItem = listbox.selectedItem;
    if (selectedItem.label != "➕...") {
        delete Zscript._scripts[selectedItem.label];
        listbox.removeChild(selectedItem);
    }
}

function updateEditor(label) {
    var name = document.getElementById("script-name");
    var content = document.getElementById("script-content");
    var disable = document.getElementById("disable")
    // Display place hold when click new script
    if (label != "➕...") {
        name.value = label;
        content.value = Zscript._scripts[label].content;
        disable.checked = Zscript._scripts[label].disable;
    } else {
        name.value = "";
        content.value = "";
        disable.checked = false;
    }
}


function checkAsync(code) {
    // This check code if from Zotero RunJS in Run Javascript
    if (code.includes("await")) {
        return true;
    }
    return false;
}

// Check input field
function checkInput(name, content) {
    var msg = '';
    if (name === null) {
        msg += "脚本名称不能为空\n";
    } else if (name.length > 20) {
        msg += "脚本名称超过20字符\n";
    }

    if (content === null || content.length === 0) {
        msg += "脚本内容不能为空\n";
    }

    return msg;
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

function openRunJS() {
    openWindowByType(
        'chrome://zotero/content/runJS.html',
        'zotero:run-js',
        'chrome,width=900,height=700,resizable,centerscreen'
    )
};