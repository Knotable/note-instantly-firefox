var data = require('sdk/self').data,
  ss = require('sdk/simple-storage');

function getPanelScripts() {
  var scripts = [
    'js/vendor/jquery.2.1.0.js',
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
    'js/vendor/jquery.2.1.0.js',
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

  scripts.push('https://apis.google.com/js/client.js?onload=GoogleOauthHelper.handleClientLoad');

  return scripts;
}

// TODO
// ss can store array, boolean, number, object, null, and string values.
// Quotas: five megabytes (5,242,880 bytes)
// ss.on('OverQuota', overQuotaHandler);

function handleStorageSet(request, response) {
  var args = request.args;
  for (var key in args) {
    ss.storage[key] = args[key];
  }
  response.result = true;
}

function handleStorageGet(request, response) {
  var keys = request.args,
    result = {};
  if (typeof keys == 'string') {
    keys = [keys];
  }
  for (var i = 0, l = keys.length; i < l; i++) {
    result[keys[i]] = ss.storage[keys[i]];
  }
  response.result = result;
}

function handleStorageRemove(request, response) {
  var keys = request.args;
  if (typeof keys == 'string') {
    keys = [keys];
  }

  try {
    for (var i = 0, l = keys.length; i < l; i++) {
      delete ss.storage[keys[i]];
    }
    response.result = true;
  } catch (e) {
    response.error = e;
  }
}

function handleStorageRequest(request, callback) {
  var response = {
    error: null,
    result: null
  };

  if (request.cbIndex) {
    response.cbIndex = request.cbIndex;
  }

  var data = request.args;
  switch(data.type) {
    case 'set':
      handleStorageSet(data, response);
      break;
    case 'get':
      handleStorageGet(data, response);
      break;
    case 'remove':
      handleStorageRemove(data, response);
      break;
    default:
      response.error = 'Invalid request type';
  }

  if (callback) {
    callback(response);
  }
}

exports.getNewTabScripts = getNewTabScripts;
exports.handleStorageRequest = handleStorageRequest;
exports.getPanelScripts = getPanelScripts;
exports.hasLoggedIn = function() {
  return !!ss.storage['topicId']
};
