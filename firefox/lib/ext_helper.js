var data = require('sdk/self').data,
  config = require("../package.json"),
  ss = require('sdk/simple-storage'),
  Service = require("sdk/preferences/service"),
  winUtils = require('sdk/window/utils'),
  NewTabURL = require('resource:///modules/NewTabURL.jsm').NewTabURL;

function getPanelScripts() {
  var scripts = [
    'js/vendor/jquery-2.1.4.js',
    'js/vendor/moment-with-locales.js',
    'js/vendor/jquery-ui.js',
    'js/vendor/underscore.js',
    'js/vendor/backbone.js',
    'js/chrome-adapter/attach-chrome.js',
    'js/newtab/knote-client.js',
    'js/newtab/knote_helper.js',
    'js/newtab/knotable-views.js',
    'js/browser-action/browserPopup.js'
  ];

  for(var i = 0, l = scripts.length; i < l; i++) {
    scripts[i] = data.url(scripts[i]);
  }

  return scripts;
}

function getNewTabScripts() {
  var scripts = [
    'js/vendor/jquery-2.1.4.js',
    'js/vendor/moment-with-locales.js',
    'js/vendor/jquery-ui.js',
    'js/vendor/underscore.js',
    'js/vendor/backbone.js',

    'js/chrome-adapter/attach-chrome.js',
    'js/background/config.js',
    'js/newtab/application.js',
    'js/background/logger.js',
    'js/newtab/backbone-indexeddb.js',

    'js/newtab/google-oAuth.js',

    'js/newtab/sync-helper.js',
    'js/newtab/knote_helper.js',
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

    'js/vendor/dropbox.js',
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
    clearCache();
  }
}

function clearCache() {
  console.log('==========> clear cache!');
  for (var key in ss.storage) {
    delete ss.storage[key];
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
exports.clearCache = clearCache;
exports.clearURLBarIfNewtab = function() {
  var urlbar = getURLBar()
  if (urlbar.value == data.url('newtab.html')) {
    urlbar.value = '';
  }
};
exports.sendTopicId = function(worker) {
  var topicId = ss.storage['topicId'];
  if (topicId) {
    worker.port.emit('msg', {
      args: {
        msg: 'topicId',
        topicId: topicId,
      },
      sender: {id: config.name}
    });
  }
};
exports.reloadPanel = function(worker) {
  worker.port.emit('reload');
};
