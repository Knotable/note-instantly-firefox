"use strict";

window.MessageManager = (function(){
  var exports = {};

  var _isFromBackground = function(senderId){
    return senderId === chrome.runtime.id;
  };

  var _onLogout = function(){
    //localStorage.clear();
    location.reload();
  };

  var _onLogin = function(){
    location.reload();
  };

  var _onConnected = function(){
    console.log("server connected");
    offlineMode.syncOfflineKnotes();
    offlineMode.syncCreateKnotes();
    offlineMode.isOfflineMode = false;
  };

  var _onDisconnected = function(){
    console.log("Server disconnected");
    offlineMode.notifyOffline();
    offlineMode.isOfflineMode = true;
  };

  var _handleMessageFromBackground = function(message, sender, sendResponse){
    // console.info("Message from background", message);
    switch(message.msg){
      case 'logout':
        _onLogout();
        break;
      case "login":
        _onLogin();
        break;
      case "connected":
        _onConnected();
        break;
      case "disconnected":
        _onDisconnected();
        break;
      case "topicId":
        knoteClient.topicId = message.topicId;
      default:
        break;
    };
  };


  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('=======> sender id: ', sender.id);
    if (_isFromBackground(sender.id)){
      console.log('========> is from background');
      _handleMessageFromBackground(message, sender, sendResponse);
    } else {
      console.log("Message from where?", sender);
    }
  });


  return exports;
})();
