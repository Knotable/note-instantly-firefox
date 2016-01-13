'use strict';

/*
* Show this message if the browser icon is clicked in a page where the content script isn't injected yet.
* {string}
*/

chrome.management.onEnabled.addListener(function(ext) {
  /*
  When the User re-enables the ext
  */
  if (ext.id === chrome.runtime.id) {
    var cb = function() {};
    chrome.tabs.query({}, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        chrome.tabs.executeScript(tab.id, {
          code: 'var kElms = document.querySelectorAll("[class*=\'knotable\']");' +
          'for(var i=0; i<kElms.length; i++){' +
          'kElms.item(i).remove();' +
          '};'
        }, cb);
      }
    });
  }
});
/*
* Check for valid session every 5 minues
*/
var iconStates = {
  loggedIn: 'loggedIn',
  loggedOut: 'loggedOut'
};


var iconImage = {
  loggedIn: 'images/Knotable-logo.png',
  loggedOut: 'images/Knotable-logo-disable.png'
};


var updateIcon = function(stat) {
  var iconPath = iconImage[stat];

  if (window.knoteServer) {
    chrome.runtime.sendMessage({
      method: 'reload'
    }, function() {});
    chrome.runtime.sendMessage({
      method: 'collapseView'
    }, function() {});

    chrome.runtime.sendMessage({
      method: 'addToKnotable'
    }, function() {});
  }
};



var notificationsCallbacks = {};
chrome.notifications.onClicked.addListener(function(id) {
  var url = notificationsCallbacks[id];
  console.debug(url);
  if (url) {
    chrome.tabs.create({
      url: url
    });
  }
  notificationsCallbacks[id] = undefined;
});

var notificationsTimers = {};

window.createNotification = function(request) {
  // The notifications object in Firefox only has one method: notify
  chrome.notifications.create(request.options);
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method === 'createNotification') {
    window.createNotification(request);
  }
});


/*
Logger listener for content script
*/

var browserActionBlackList = [
  /chrome.*?/,
  /(http|https):\/\/chrome.google.com\/webstore.*?/,
  /https:\/\/(www\.)?mail.google\.com/i
];


/*
* For pages that does not support the ext, we show the popup instead of taking a screenshot
*/



/* Events For when the app is installed or updated */
chrome.runtime.onInstalled.addListener(function (details){
  //Reason can be any => "install", "update", "chrome_update", or "shared_module_update"
  //For now we are more interested in install and update

  if(details.reason === 'install' || details.reason === 'update'){
    chrome.storage.local.set({isIntroSeen: "false"});
  }
});
/* On install events end here */

/* Events for when the app is updated */
  chrome.runtime.onUpdateAvailable.addListener(function(details) {
    var r = confirm("The Knotable App has been updated automatically. Please press OK to restart your extension.");
    if (r == true) {
      //reload the app
      chrome.runtime.reload();
    } else {
        //do nothing
    }
  });
/* Updated app events end here */

