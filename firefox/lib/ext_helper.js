var data = require('sdk/self').data,
  ss = require('sdk/simple-storage'),
  Service = require("sdk/preferences/service"),
  winUtils = require('sdk/window/utils'),
  NewTabURL = require('resource:///modules/NewTabURL.jsm').NewTabURL;

function getPanelScripts() {
  var scripts = [
    'js/vendor/jquery-2.1.4.min.js',
    'js/vendor/moment-with-locales.min.js',
    'js/vendor/jquery-ui.min.js',
    'js/vendor/underscore-min.js',
    'js/chrome-adapter/attach-chrome.js',
    'js/newtab/knote-client.js',
    'js/browser-action/browserPopup.js'
  ];

  for(var i = 0, l = scripts.length; i < l; i++) {
    scripts[i] = data.url(scripts[i]);
  }

  return scripts;
}

function getNewTabScripts() {
  var scripts = [
    'js/vendor/jquery-2.1.4.min.js',
    'js/vendor/moment-with-locales.min.js',
    'js/vendor/jquery-ui.min.js',
    'js/vendor/underscore-min.js',
    'js/vendor/backbone.js',

    'js/chrome-adapter/attach-chrome.js',
    'js/background/config.js',
    'js/newtab/application.js',
    'js/background/logger.js',
    'js/newtab/backbone-indexeddb.js',

    'js/newtab/google-oAuth.js',

    'js/newtab/sync-helper.js',
    'js/newtab/update-helper.js',

    'js/newtab/background-image.js',
    'js/newtab/blank-page-router.js',
    'js/newtab/knote-client.js',
    'js/newtab/knotable-models.js',
    'js/newtab/knotable-views.js',
    'js/newtab/knotable.js',
    'js/newtab/offline-helper.js',

    'js/knotable-views/avatar-view.js',
    'js/knotable-views/email-view.js',
    'js/knotable-views/header-view.js',
    'js/knotable-views/intro-view.js',
    'js/knotable-views/knote-view.js',
    'js/knotable-views/knotes-view.js',
    'js/knotable-views/knoteSync-view.js',
    'js/knotable-views/search-view.js',
    'js/knotable-views/knotableView-init.js',

    'js/vendor/dropbox.min.js',
    'js/newtab/dropbox.js',
    'js/newtab/google-analytics.js',
    'js/newtab/messageManager.js',
    'js/newtab/application_ready.js'
  ]

  for(var i = 0, l = scripts.length; i < l; i++) {
    scripts[i] = data.url(scripts[i]);
  }

  //scripts.push('https://apis.google.com/js/client.js?onload=GoogleOauthHelper.handleClientLoad');

  return scripts;
}

function main(options, callback) {
  // This setting doesn't work on ff that version>=41
  //Service.set('browser.newtab.url', data.url('newtab.html'));
  NewTabURL.override(data.url('newtab.html'));
}

function onUnload(reason) {
  console.log('!!!! onUnload : reason: ' + reason);
  if (reason == 'uninstall' || reason == 'disable') {
    NewTabURL.reset();
    //Service.set('browser.newtab.url', 'about:newtab');
    for (var key in ss.storage) {
      delete ss.storage[key];
    }
  }
}

function getURLBar() {
  //window.gURLBar.value = '';
  return winUtils.getMostRecentBrowserWindow().document.getElementById('urlbar');
}


exports.main = main;
exports.onUnload = onUnload;
exports.getNewTabScripts = getNewTabScripts;
exports.getPanelScripts = getPanelScripts;
exports.hasLoggedIn = function() {
  return !!ss.storage['topicId']
};
exports.getURLBar = getURLBar;
exports.clearURLBarIfNewtab = function() {
  var urlbar = getURLBar()
  if (urlbar.value == data.url('newtab.html')) {
    urlbar.value = '';
  }
};
