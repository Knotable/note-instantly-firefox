var KnotesSyncView = Backbone.View.extend({
  el: '#sync-knote-container',
  events: {
    'click .sync-close': 'hide',
    'click [type="checkbox"]': 'settingChanged'
  },

  hoverDraftsLink: function(ele){
    this.$el.find('#setting-gmail-link').css('color', 'red');
  },

  hoverOutDraftsLink: function(ele){
    this.$el.find('#setting-gmail-link').css('color', '#5D95ED');
  },

  _authDropbox: function(ele){
    var enableSyncKnote = ele.currentTarget.checked
    if(enableSyncKnote){
      DropboxClient.authenticate(true)
      .then(function(){
        DropboxClient.enableSyncKnoteToDropbox(enableSyncKnote);
        console.log("Dropbox authenticate Success!");
        chrome.storage.local.set({'sync-dropbox': "true"});
      }).fail(function(error){
        console.error("Dropbox authenticate failed: ", error);
        chrome.storage.local.set({'sync-dropbox': "false"});
      });
    } else {
      DropboxClient.enableSyncKnoteToDropbox(enableSyncKnote);
    }
  },

  settingChanged: function(ele){
    if(ele.currentTarget.id === 'sync-gmail'){
      var self = this;
      setTimeout(function() {
        self.startoAuthSession();
      }, 1000);
    }
    else if(ele.currentTarget.id === 'sync-dropbox'){
      this._authDropbox(ele);
    }
    else{
      chrome.storage.local.get('sync-evernote', function(items) {
        var value,
          syncEvernote = items['sync-evernote'];
        if(syncEvernote!== null && syncEvernote === "true" ){
          value = "false";
        } else if(syncEvernote!== null && syncEvernote === "false" ){
          value = "true";
        } else {
          value = "true";
        }
        chrome.storage.local.set({'sync-evernote': value});
      });

    }
  },

  initialize: function() {

  },
  toggleView: function() {
    this.$el.toggleClass('hidden');
  },
  render: function() {
    this.toggleView();

    this.$el.find('#setting-user').text(knoteClient.userName);

    chrome.storage.local.get('sync-gmail', function(items) {
      var syncGmail = items['sync-gmail'];
      if(syncGmail!== null && syncGmail === "true" ){
        this.$el.find('#sync-gmail').attr("checked", "checked");
      }
    });

    var self = this;
    DropboxClient.isSyncKnoteToDropbox()
      .then(function(enableSyncToDropbox){
        if(enableSyncToDropbox){
          self.$el.find('#sync-dropbox').attr("checked", "checked");
        };
      });

    chrome.storage.local.get('sync-evernote', function(items) {
      var syncEvernote = items['sync-evernote'];
      if(syncEvernote!== null && syncEvernote === "true" ){
        this.$el.find('#sync-evernote').attr("checked", "checked");
      }
    });
  },
  hide: function() {
    this.$el.addClass('hidden');
  },

  startoAuthSession: function(){

    gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: true}, function(authResult){
      if (authResult && !authResult.error) {
        // The person has authorized or is already logged in
        // pass a callback in future

        chrome.storage.local.get('sync-gmail', function(items) {
          var value,
            syncGmail = items['sync-gmail'];
          if(syncGmail!== null && syncGmail === "true" ){
            value = "false";
          } else if(syncGmail!== null && syncGmail === "false" ){
            value = "true";
          } else {
            value = "true";
          }
          chrome.storage.local.set({'sync-gmail': value});
        });
      } else {
        ;
        var currentWinID = 0;
        chrome.windows.onCreated.addListener(function(data){
          console.log(data)
          currentWinID = data.id;
        });

        gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: false}, function(authResult){
        });

        var pollTimer   =   window.setInterval(function() {
          try {
            gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: true}, function(authResult){
              if (authResult && !authResult.error) {
                window.clearInterval(pollTimer);
                chrome.windows.remove(currentWinID, function(){})

                setTimeout(function(){
                  // $("#btn-email-knote").click();
                  chrome.storage.local.set({'sync-gmail': "true"});
                }, 1000);
              }
            });
          } catch(e) {
            console.log(e)
          }
        }, 10000);

      }
    });
  }
});
