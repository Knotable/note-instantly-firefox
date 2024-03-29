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
    var self = this;
    window._knotesView.saveCurrentKnote();
    window._knotesView.setActiveKnote(self.model);
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
    var id = this.model.get('knoteId') || this.model.get('_id');
    if (this.$el.data('knoteid') == '' &&
       id && id != 'true' && $('.list-knote[data-knoteid=' + id + ']').length) {
      this.remove();
    } else {
      var newElm = $(this.template(this.model.toJSON()));
      this.$el.replaceWith(newElm);
      this.setElement(newElm);
    }

    var newContent = this.model.get('content');
    var editArea = $('#knote-edit-area');
    if (window._knotesView.activeKnote == this.model &&
         newContent != editArea.html().trim()) {
      editArea.html(newContent);
    }

    return this;
  }
});
