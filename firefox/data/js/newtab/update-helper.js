'use strict';

window.updateHelper = (function(){

	var exports = {};

	var _createNotification = function(options, hideAfter) {

	    options = options || {};
	    options = _.extend({
	      type: 'basic',
	      iconUrl: 'images/icon-48.png',
	      title: 'Knotable',
	      message: 'A Message'
	    }, options);
	    chrome.runtime.sendMessage({
	      method: 'createNotification',
	      options: options,
	      hideAfter: hideAfter
	    });
	};

	exports.checkNewUpdate = function(){

		chrome.runtime.requestUpdateCheck(function(status) {
		  if (status == "update_available") {
		    console.log("update pending...");
		    _createNotification({
	           message: 'An update for you Knotable Extension is Available'
	       }, 3000);
		  } else if (status == "no_update") {
		    console.log("no update found");
		  } else if (status == "throttled") {
		    console.log("Oops, I'm asking too frequently - I need to back off.");
		  }
		});
	};

	exports.getUpdateNotificationBackground = function(){

	};
	return exports;
})();	