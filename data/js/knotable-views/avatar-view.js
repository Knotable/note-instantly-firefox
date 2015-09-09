var UserAvatarModel = Backbone.Model.extend({
  defaults: {
    username: '',
    fullname: '',
    avatar: {}
  }
});

var UserAvatarView = Backbone.View.extend({
  el: '.user-avatar-container',
  initialize: function(model) {
    this.model = model;
    this.render();
  },
  render: function() {
    this.$el.removeClass('knotable-hide');
    return this;
  }
});
