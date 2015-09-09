"use strict";


function messageFactory(type) {
  var sendMessageResponseCBStack = {},
    sendMessageResponseCBIndex = 0,
    typeResponse = 'response:' + type,
    responseListening = false;

  return {
    // chrome.runtime.sendMessage([string extensionId, ]any message[, object options] [, function responseCallback])
    /**
     * data = {
     *  args: any
     *  sender: optional
     *  cbIndex: optional
     * }
     */
    send: function(args, responseCallback) {
      var data = {
        args: args,
        fromFrame: window.pageFrame
      };
      if (responseCallback) {
        sendMessageResponseCBStack[++sendMessageResponseCBIndex] = responseCallback;
        data.cbIndex = sendMessageResponseCBIndex;
      }

      if (!responseListening) {
        responseListening = true;
        /**
         * res = {
         *    result
         *    error
         *    cbIndex
         * }
         */
        self.port.on(typeResponse, function(res) {
          console.log('======> ' + typeResponse + ': ' + JSON.stringify(res));
          var responseCallback = sendMessageResponseCBStack[res.cbIndex];
          if (res.error) {
            chrome.runtime.lastError = res.error;
          }
          if (responseCallback) {
            responseCallback(res.result || {});
            delete sendMessageResponseCBStack[res.cbIndex];
          }
        });
      }

      self.port.emit(type, data);
    },
    onMessage: function(callback) {
      self.port.on(type, function(data) {
        // function callback(any message, MessageSender sender, function sendResponse) {...};
        callback(data.args, data.sender || null, function(response) {
          if (data.cbIndex) {
            response = {
              result: response,
              cbIndex: data.cbIndex,
              fromFrame: data.fromFrame
            };
            self.port.emit(typeResponse, response)
          }
        });
      });
    }
  };
}

//============== chrome.runtime ============= //
function rOnMessageExternal() {
  return {
    addListener: function() {
    }
  };
}

function rOnInstalled() {
  return {
    addListener: function() {
    }
  };
}

function rOnUpdateAvailable() {
  return {
    addListener: function() {
    }
  };
}

function rReload() {
}

function rGetMenifest() {
}

function rRequestUpdateCheck() {
}

function rGetURL(path) {
  return self.options.basePath + path;
}

//============== chrome.tabs ============= //
function tQuery() {
}

function tGetCurrent() {
}

function tSendMessage() {
}

function tExecuteScript() {
}

function tUpdate() {
}

function tCreate(options) {
  chrome.runtime.sendMessage({
    isFnCall: true,
    type: 'tabs:create',
    options: options
  });
}

//============== chrome.storage ============= //
function sLocal() {
  return {
    set: lsSet,
    get: lsGet,
    remove: lsRemove
  };
}

function sSync() {
  return {
    set: lsSet,
    get: lsGet,
    remove: lsRemove
  };
}

var storageMessenger = messageFactory('storage');

function lsSet(data, callback) {
  storageMessenger.send({
    type: 'set',
    args: data
  }, function(response) {
    if (callback) {
      callback(response);
    }
  });
}

function lsGet(names, callback) {
  storageMessenger.send({
    type: 'get',
    args: names
  }, function(response) {
    if (callback) {
      callback(response);
    }
  });
}

function lsRemove(keys, callback) {
  storageMessenger.send({
    type: 'remove',
    args: keys
  }, function(response) {
    if (callback) {
      callback(response);
    }
  });
}

//============== chrome.windows ============= //
function wOnCreated() {
}

function wRemove() {
}

//============== chrome.browserAction ============= //
function bSetPopup() {
}

function bGetPopup() {
}

//============== chrome.notifications ============= //
function nCreate() {
}

function nOnClicked() {
  return {
    addListener: function() {
    }
  };
}

function nGetAll() {
}

function nClear() {
}

//============== chrome.management ============= //
function mOnEnabled() {
  return {
    addListener: function() {
    }
  };
}

//==================== chrome ===================//
window.chrome = { };

var runtimeMessenger = messageFactory('msg');
chrome.runtime = {
  id: self.options.extName,
  //lastError: null,
  sendMessage: runtimeMessenger.send,
  onMessage: {
    addListener: runtimeMessenger.onMessage
  },
  onMessageExternal: rOnMessageExternal(),
  onInstalled: rOnInstalled(),
  onUpdateAvailable: rOnUpdateAvailable(),
  reload: rReload,
  getManifest: rGetMenifest,
  requestUpdateCheck: rRequestUpdateCheck,
  getURL: rGetURL
};

chrome.tabs = {
  query: tQuery,
  getCurrent: tGetCurrent,
  sendMessage: tSendMessage,
  executeScript: tExecuteScript,
  update: tUpdate,
  create: tCreate
};

chrome.storage = {
  local: sLocal(),
  sync: sSync()
};

chrome.windows = {
  onCreated: wOnCreated,
  remove: wRemove
};

chrome.browserAction = {
  setPopup: bSetPopup,
  getPopup: bGetPopup
};

chrome.notifications = {
  create: nCreate,
  onClicked: nOnClicked(),
  getAll: nGetAll,
  clear: nClear
};

chrome.management = {
  onEnabled: mOnEnabled()
};

chrome.extension = {
  getURL: rGetURL
};
