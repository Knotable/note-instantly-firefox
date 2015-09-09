'use strict';

(function(window, $) {

	window.KneSyncHelper = {
		syncGmailDrafts: function(subject, message, knoteID){
			gapi.client.load('gmail', 'v1', function() {
				var request = gapi.client.gmail.users.drafts.create({
					'userId': "me",
					'resource': {
						'message': {
							'raw': btoa("From: me" + "\r\nSubject:"+ subject + "\r\n\r\n" + message)
						}
					}
				});
				request.execute(function(data){
					console.log(data)
					KneSyncHelper._mapDraftsToKnotes(knoteID, data.id);
				});
			});

		},
		_mapDraftsToKnotes: function(knoteID, draftID){

      chrome.storage.local.get("draft-knote-map", function(items) {
        var draftsKnotesMap = items["draft-knote-map"] || [];

        var tmpObj = {};
        tmpObj.knoteID = knoteID;
        tmpObj.draftID = draftID;

        if (_.findWhere(draftsKnotesMap, {'knoteID':knoteID})) {
          // do nothing for now
        }
        else{
          draftsKnotesMap.push(tmpObj);
        }

        chrome.storage.local.set({'draft-knote-map': draftsKnotesMap});
      });
		},
		updateDraftFromID: function(draftID, message, subject){
			gapi.client.load('gmail', 'v1', function() {
				var request = gapi.client.gmail.users.drafts.update({
					'userId': "me",
					'id': draftID,
					'resource': {
						'message': {
							'raw': btoa("From: me" + "\r\nSubject:"+ subject + "\r\n\r\n" + message)
						}
					}
				});

				request.execute(function(data){
					console.log("draft updated");
					console.log(data);
				});
			});
		},

		isGmailSyncSetting: function(callback){
      chrome.storage.local.get('sync-gmail', function(items) {
        var result,
          syncGmail = items['sync-gmail'];
        if(syncGmail!== null && syncGmail === "true" ){
          result = true;
        } else if(syncGmail!== null && syncGmail === "false" ){
          result = false;
        } else{
          result = false;
        }
        if (callback) {
          callback(result);
        }
      });
		},
		makeGoogleApiCall: function(){
			var authParams = gapi.auth.getToken()
			authParams.alt = 'json';
			var promise = $.ajax({
				url: 'https://www.google.com/m8/feeds/contacts/default/full?max-results=10000',
				dataType: 'jsonp',
				data: authParams,
			});
			return promise;
		}
	};

})(window, jQuery);
