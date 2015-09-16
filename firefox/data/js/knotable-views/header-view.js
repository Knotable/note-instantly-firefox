var HeaderView = Backbone.View.extend({
  el: '#newtab-header',
  events: {
    'click #user-logout': 'logout',
    'click #newtab-topic-id': 'kClicked',
    'click #google-apps': 'gAppClicked',
    'click #btn-sync-knotes': 'settingsKnoteSync'
  },

  settingsKnoteSync: function(){
    var self = this;
    self.KnotesSyncView = self.KnotesSyncView || new KnotesSyncView();
    self.KnotesSyncView.render();
  },

  kClicked: function(){
    googleAnalyticsHelper.trackAnalyticsEvent('K button', 'clicked');
  },

  gAppClicked: function(){
    googleAnalyticsHelper.trackAnalyticsEvent('Google Apps button', 'clicked');
    chrome.tabs.getCurrent(function(tab) {
      chrome.tabs.update(tab.id, {
        url: 'chrome://apps'
      });
    });
  },

  logout: function() {
    knoteClient.logout().then(function() {
      //localStorage.clear();
      location.reload();
    });
  },

  initialize: function() {
    console.log("HeaderView initialize");
  },

  _setKUrl: function(){
    var self = this;
    var topicUrl = config.protocol + "://" + config.domain;
    knoteClient.getTopicId().then(function(topicId) {
      console.log('=====================> topicId :' + topicId);
      if (!_.isEmpty(topicId)) {
        topicUrl += "/t/0/" + topicId;
        //chrome.storage.local.set({topicId: topicId});
        //localStorage.topicId = topicId;
        knoteClient.topicId = topicId;
      } else {
        //chrome.storage.local.remove('topicId');
        //localStorage.topicId = null;
        knoteClient.topicId = null;
      }
      self.$el.find('#newtab-topic-id').attr('href', topicUrl);
    }).fail(function(){
      self.$el.find('#newtab-topic-id').attr('href', topicUrl);
    });
  },

  render: function() {
    this._setKUrl();
  }
});
