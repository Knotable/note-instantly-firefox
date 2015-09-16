var introBoxView = Backbone.View.extend({
  el: '#intro-box',
  events: {
    'click .knotable-lightbox-inner': 'toggleView'
  },

  initialize: function() {
  },

  _setExtensionVersion: function(){
    var manifest = chrome.runtime.getManifest();
    console.log(manifest.name, manifest.version);
    this.$el.find("#extension-version").text(manifest.version)
  },

  toggleView: function() {
    this.$el.toggleClass('hidden');
  },

  render: function() {
    var _this = this;
    chrome.storage.local.get('isIntroSeen', function(items) {
      var isIntroSeen = items['isIntroSeen'];
      if(isIntroSeen === "false"){
        _this.toggleView();
        _this._setExtensionVersion();
      }
    });
  }
});
