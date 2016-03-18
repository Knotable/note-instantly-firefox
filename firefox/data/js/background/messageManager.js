'use strict';

window.MessageManager = (function(){
  var config = getConfig(runtime_mode);
  var exports = {};
  var hasDisconnectedMsgShown = false;

  var showNotification = function(msg) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon-48.png',
      title: 'Knotable',
      message: msg
    });
  };

  var sendMessageToNewTabPage = function(message){
    chrome.runtime.sendMessage(message);
  };

  var sendMessageToWebpage = function(msg){
    chrome.tabs.query({
      url: '*://' + config.domain + "/*"
    }, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        chrome.tabs.sendMessage(tab.id, msg, function() {
          console.log("Send message to web page", tab.id, msg, tab);
        });
      };
    });
  };


  var logout = function(){
    console.log("web client logged out, logout extension");
    asteroid.logout();
  };

  var login = function(loginToken){
    chrome.storage.local.get('loginToken', function(items) {
      var storageToken = items['loginToken'];
      if (storageToken === loginToken.token) return;
      console.log("web client logged in, login extension", loginToken);

      asteroid.loginWithToken(loginToken.token).then(function(res){
        asteroid.loginSuccess(res);
        chrome.runtime.sendMessage({
          msg: 'login'
        }, $.noop);
      });
    });
  };

  // Listen message from our knotable site
  chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse){
    console.log("got external message", message, sender);
    if (config.domain.match(message.host)){
      switch(message.msg){
        case 'login':
        var loginToken = {
          userId: message.userId,
          token: message.token
        }
        login(loginToken);
        break;
        case 'logout':
        logout();
        break;
        default:
        // console.log("chrome.runtime.onMessageExternal EXCEPTION: unhandled message", message);
        break;
      }
    }
  });


  exports.logoutExtension = function(){
    var message = {
      msg: "logoutExtension",
      domain: config.domain
    }
    sendMessageToWebpage(message);
  };

  exports.loginExtension = function(token){
    var message = {
      msg: "loginExtension",
      domain: config.domain,
      token: token
    }
    sendMessageToWebpage(message);
  };


  exports.connected = function(){
    var message = {
      msg: "connected"
    };
    hasDisconnectedMsgShown = false;
    window.sendAndClearOfflineKnotes();
    sendMessageToNewTabPage(message);
  };

  exports.reconnected = function() {
    exports.connected();
    showNotification('Connected to Knotable.');
  };

  exports.disconnected = function(){
    var message = {
      msg: "disconnected"
    };
    if (!hasDisconnectedMsgShown) {
      hasDisconnectedMsgShown = true;
      showNotification('Could not connect to Knotable. Please check your internet connection.');
    }
    sendMessageToNewTabPage(message);
  };

  // Listen message from content script of our knotable site.
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    // console.log("got from contentscript", message, sender);
    if (config.domain.match(message.host)){
      chrome.storage.local.get('loginToken', function(items) {
        var loginToken = items['loginToken'];
        switch(message.msg){
          case 'getToken':
            var response;
            if (loginToken){
              response = {
                token: loginToken,
                host: config.domain
              };
            } else {
              response = {
                error: true,
                host: config.domain
              };
            }
            sendResponse(response);
            break;
          default:
            // console.log("chrome.runtime.onMessage EXCEPTION: unhandled message", message);
            break;
        }
      });
    }
  });


  // listen message from new tab page.
  chrome.runtime.onMessage.addListener(function(request, sender, sendReponse) {
    if (request.method === 'MeteorDdp') {
      var args = request.args || [];
      var ddpFn = knoteServer[request.fn];
      if (!ddpFn) {
        sendReponse({
          error: 'Method not found'
        });
        return;
      }

      var callPromise = ddpFn.apply(knoteServer, request.args);
      if (!callPromise || !callPromise.then || !callPromise.fail) {
        sendReponse({
          response: callPromise || false
        });
        return;
      }
      console.info("MeteorDdp methods", arguments);
      callPromise.then(function(respArgs) {
        console.log('Method call response: success');
        sendReponse({
          response: respArgs
        });
      }).fail(function(err) {
        console.log('Method call response: failed');
        sendReponse({
          error: err || -1
        });
      });
      return true;
    }
  });


  return exports;
})();
