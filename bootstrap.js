/* Copyright 2021 Lin Xingzhong.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
/* global Components, Services */
/* global Zscript, APP_SHUTDOWN */
const { classes: Cc, utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");

// eslint-disable-next-line no-unused-vars
function install(data, reason) {

}

// eslint-disable-next-line no-unused-vars
function startup(data, reason) {
    Cu.import("chrome://zscript/content/zscript.js");
    Zscript.init();
}

// eslint-disable-next-line no-unused-vars
function shutdown(data, reason) {
    if (reason == APP_SHUTDOWN) {
        return;
    }

    var windows = Services.wm.getEnumerator('navigator:browser');
    while (windows.hasMoreElements()) {
        var tmpWin = windows.getNext();

        tmpWin.ZscriptChrome.removeXUL();
        if (typeof tmpWin.ZscriptChrome.zoteroOverlay != 'undefined') {
            tmpWin.ZscriptChrome.zoteroOverlay.unload();
        }
        delete tmpWin.ZscriptChrome;
        delete tmpWin.zscript;
    }

    Zscript.cleanup();

    Cc["@mozilla.org/intl/stringbundle;1"].
        getService(Components.interfaces.nsIStringBundleService).flushBundles();

    Cu.unload("chrome://zscript/content/zscript.js");
}

// eslint-disable-next-line no-unused-vars
function uninstall(data, reason) {

}
