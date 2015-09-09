'use strict';

window.offlineMode = (function(){

	var exports = {};

	 exports.isOfflineMode = false;

	 exports.isNotificationShown = false;

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

	var _startOfflineMode = function(){

	};

	exports.notifyOffline = function(){

		if(!exports.isNotificationShown){
	       _createNotification({
	           message: 'You have gone offline'
	       }, 3000);

	       exports.isNotificationShown = true;
	       exports.isOfflineMode = true;
   		}
	};

	exports.isOffline = function(){
		if(navigator.onLine === false || exports.isOfflineMode){
			exports.isOfflineMode = true;
			return exports.isOfflineMode;
		}

		else{
			exports.isOfflineMode = false;
			return exports.isOfflineMode;
		}
	};

	exports.syncOfflineKnotes = function(){

		chrome.storage.local.get('offlineEditKnotes', function (result) {
			if(!result.offlineEditKnotes){
				return;
			}
			for(var i = 0; i < result.offlineEditKnotes.length; i++){

			    knoteClient.updateKnote(result.offlineEditKnotes[i].knoteId, result.offlineEditKnotes[i].knoteId)
		        .then(function(){
		          console.log("Update knote", result.offlineEditKnotes[i].knoteId, " Success!");
		        })
		        .fail(function(){
		          console.error("Update knote", result.offlineEditKnotes[i].knoteId, " FAILED!");
		        })

		        result.offlineEditKnotes = _.reject(result.offlineEditKnotes, function(el) { return el.knoteId === result.offlineEditKnotes[i].knoteId; });

		        console.log("knotes ofline edit")
			}

			chrome.storage.local.set({'offlineEditKnotes': result.offlineEditKnotes});
		});
	};

	exports.syncCreateKnotes = function(){
		chrome.storage.local.get('offlineCreateKnotes', function (result) {
			if(!result.offlineCreateKnotes){
				return;
			}
			for(var i = 0; i < result.offlineCreateKnotes.length; i++){

		        knoteClient.addKnote(result.offlineCreateKnotes[i]).then(function(knoteID){
		        	console.log("offline knote created");
		        }).fail(function(){
		        });
			}

			chrome.storage.local.set({'offlineCreateKnotes': []});
		});
	};

	return exports;

})();	
