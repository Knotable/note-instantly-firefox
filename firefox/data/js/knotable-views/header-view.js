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
    knoteClient.getPadLink().then(function(padLink){
      self.$el.find('#newtab-topic-id').attr('href', padLink);
    })
  },

  render: function() {
    this._setKUrl();
  }
});
