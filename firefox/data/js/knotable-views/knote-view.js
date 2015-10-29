'use strict';

var KnoteModel;

var KnotesCollection = Backbone.Collection.extend({
  model: KnoteModel
});

var KnoteView = Backbone.View.extend({
  className: 'list-group-item',
  tagName: 'li',
  events: {
    'click': 'focusKnote'
  },
  focusKnote: function(e) {
    window._knotesView.saveCurrentKnote();

    window._knotesView.setActiveKnote(this.model);
  },
  initialize: function(model) {
    this.template = _.template($('#knote-template').html());
    this.model = model;
    var self = this;
    this.model.bind('save', function(resp) {
      self.$el.attr('data-knoteid', resp.knoteId);

      if(window._knotesView.localKnoteID)
      self.$el.attr('data-knoteIdLocal', window._knotesView.localKnoteID);
    });
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);
    this.model.bind('toggleView', this.toggleView, this);
    this.model.bind('activate', this.activate, this);

    setInterval( function() {
      var offset = new moment(self.model.get("updated_date")).fromNow();
      self.$el.find(".date").html(offset);
    }, 1000 );

  },
  activate: function(active) {
    var fn = active ? 'addClass' : 'removeClass';
    this.$el[fn]('active');
  },
  remove: function() {
    this.$el.fadeOut('fase', this.$el.remove.bind(this.$el));
  },
  toggleView: function(toggle) {
    var fn = toggle ? 'fadeIn' : 'fadeOut';
    this.$el[fn]();
  },
  render: function() {
    var newElm = $(this.template(this.model.toJSON()));
    this.$el.replaceWith(newElm);
    this.setElement(newElm);

    return this;
  }
});
