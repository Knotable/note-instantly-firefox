'use strict';

console.log("knotable web app launched!", chrome.runtime.id);

(function(){
  /**
  * set extensionId for web app.
  * web app will send message to extension via extensionId.
  * @type {String}
  */
  localStorage.extensionId = chrome.runtime.id;

  var host = window.location.host;
  var tokenName = "Meteor.loginToken";
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.domain && message.domain.match(host)){
      switch(message.msg){
        case 'logoutExtension':
        localStorage[tokenName] = null;
        location.reload();
        break;
        case "loginExtension":
        if (message.token === localStorage[tokenName]) return;
        localStorage[tokenName] = message.token;
        location.reload();
        break;
        default:
        console.error("Unhandled message", message, sender);
        break;
      };
    };
  });

  chrome.runtime.sendMessage(localStorage.extensionId, {msg: "getToken"}, function(response){
    console.log("respond get token", response);
    if (response.host && response.host.match(host)){
      if(response.error){
        if (!localStorage[tokenName]){
          localStorage[tokenName] = null;
        }
      } else {
        if(response.token !== localStorage[tokenName]){
          localStorage[tokenName] = response.token;
          location.reload();
        }
      }
    }
  });

})();
