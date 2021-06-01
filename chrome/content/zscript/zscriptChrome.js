'use strict';

var Cc = Components.classes
var Ci = Components.interfaces
var Cu = Components.utils
Cu.import('resource://gre/modules/AddonManager.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('chrome://zscript/content/zscript.js');

ZscriptChrome.XULRootElements = [];


/******************************************/
// UI functions
/******************************************/

// Open Zscript preferences window
ZscriptChrome.openPreferences = function () {
    if (!('_preferencesWindow' in this) || this._preferencesWindow === null ||
        this._preferencesWindow.closed) {
        var featureStr = 'chrome, titlebar, toolbar, resizable, ' +
            'centerscreen, dialog=no';
        // var modalStr = Zotero.Prefs.get('browser.preferences.instantApply', true) ?
        //     'dialog=no' : 'modal';
        // featureStr = featureStr + modalStr;
        this._preferencesWindow =
            window.openDialog('chrome://zscript/content/preferences.xul',
                'zscript-prefs-window', featureStr);
    }

    this._preferencesWindow.focus();
};


/******************************************/
// XUL related functions
/******************************************/

// Track XUL elements with ids elementIDs that were added to document doc, so
// that they may be removed on shutdown
ZscriptChrome.registerXUL = function (elementIDs, doc) {
    if (typeof doc.ZscriptXULRootElements == 'undefined') {
        doc.ZscriptXULRootElements = [];
    }

    var xulRootElements;
    if (doc == document) {
        xulRootElements = ZscriptChrome.XULRootElements;
    } else {
        xulRootElements = doc.ZscriptXULRootElements;
    }

    xulRootElements.push(elementIDs);
};

// Remove all root XUL elements from main document and any Zotero tab documents
ZscriptChrome.removeXUL = function () {
    this.removeDocumentXUL(document, this.XULRootElements);
};

ZscriptChrome.removeDocumentXUL = function (doc, XULRootElementIDs) {
    while (XULRootElementIDs.length > 0) {
        var elem = doc.getElementById(XULRootElementIDs.pop());

        if (elem) {
            elem.parentNode.removeChild(elem);
        }
    }
};

/* Remove all descendants of parentElem whose ids begin with childLabel
   This function is useful for removing XUL that is added to elements (like
   menu popups) that periodically stripped of their children and recreated.
   This repopulating (outside of Zscript) makes it difficult to keep the
   XULRootElements updated with the current set of children that Zscript has
   added to the element.  Rather than trying to search XULRootElements each
   time a Zscript function repopulates such an element to weed out removed
   elements and add new ones, we just search the parent for children
   partial id's that should be unique to Zscript and remove those. */
ZscriptChrome.removeLabeledChildren = function (parentElem, childLabel) {
    var elemChildren = parentElem.childNodes;

    for (var index = 0; index < elemChildren.length;) {
        if ('string' == typeof elemChildren[index].id &&
            elemChildren[index].id.indexOf(childLabel) === 0) {
            parentElem.removeChild(elemChildren[index]);
        } else {
            this.removeLabeledChildren(elemChildren[index], childLabel);
            index++;
        }
    }
};

/******************************************/
// Utility functions
/******************************************/

// Get string from clipboard
ZscriptChrome.getFromClipboard = function (silent) {

    var trans = Components.classes['@mozilla.org/widget/transferable;1'].
        createInstance(Components.interfaces.nsITransferable);
    if ('init' in trans) {
        trans.init(window.QueryInterface(Ci.nsIInterfaceRequestor).
            getInterface(Ci.nsIWebNavigation));
    }
    trans.addDataFlavor('text/unicode');

    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);

    var str = {}
    var strLength = {}

    try {
        trans.getTransferData('text/unicode', str, strLength);
    } catch (err) {
        if (!silent) {
            var prompts = Cc['@mozilla.org/embedcomp/prompt-service;1'].
                getService(Components.interfaces.nsIPromptService);
            prompts.alert(
                null,
                Zscript.getString('zscript.error.pastetitle'),
                Zscript.getString('zscript.error.pastemessage')
            )
        }
        return '';
    }

    var pasteText
    if (str) {
        pasteText = str.value.
            QueryInterface(Components.interfaces.nsISupportsString).data;
    } else {
        pasteText = '';
    }

    return pasteText;
};