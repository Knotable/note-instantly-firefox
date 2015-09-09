var SearchBoxView = Backbone.View.extend({
  el: '.searchbox',
  initialize: function() {
    this.elms = {};
    this.elms.clearBoxElm = this.$el.find('i.glyphicon-remove-sign');
    this.elms.searchboxElm = this.$el.find('input#searchbox');
    this.render();
  },
  events: {
    'focus input': 'onFocus',
    'click i.glyphicon-remove-sign': 'clearBox',
    'blur input': 'onBlur',
    'keyup input': 'queryKnotes',
  },
  render: function() {
    this.onBlur();
    return this;
  },
  clearBox: function() {
    console.log('shoud clear??');
    this.elms.searchboxElm.val('').blur();
    this.queryKnotes();
  },
  onFocus: function() {
    this.elms.clearBoxElm.fadeIn();
  },
  onBlur: function() {
    this.elms.clearBoxElm.fadeOut();
  },
  queryKnotes: _.throttle(function() {
    var query = this.elms.searchboxElm.val().toLowerCase().trim();
    if (!query) {
      _knotesView.collection.each(function(model) {
        model.trigger('toggleView', true);
      });
      return;
    }
    _knotesView.collection.each(function(model) {
      var content = model.get('content');
      model.trigger('toggleView', content.toLowerCase().indexOf(query) > -1);
    });
  }, 500)
});
