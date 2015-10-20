'use strict';
window.KnotableModels = function() {
  var _models = {};
  _models.baseModel = Backbone.Model.extend({
    initialize: function() {
      if (typeof(this.init) === 'function') this.init.apply(this, arguments);
    },
  });

  _models.Knote = _models.baseModel.extend({
    init: function(attrs) {
      if (_.isObject(attrs)) this.set(attrs);
    },
    defaults: {
      knoteId: '',
      content: '',
      body: '<p></p>',
      date: new Date(),
      updated_date: new Date(),
      timestamp: Date.now()
    },
    _getKnoteData: function() {
      var to_emails = this.get("to");
      var options = KnoteHelper.getUpdateOptions($('#knote-edit-area'));
      
      if (to_emails && to_emails.length) {
        to_emails = to_emails.map(function(emailAddress) {
          return emailAddress.replace(/^(.*?)</, '').replace(/>$/, '');
        });
      }
      return {
        topic_id: this.get("topicId"),
        fileIds: this.get("fileIds"),
        date: this.get("date"),
        order: isFinite(this.get("order")) ? this.get("order") : void 0,
        from: this.get("from_email"),
        editors: this.get('editors'),
        title: options.title,
        message_subject: this.get("subject"),
        body: this.get("content_html") || this.get('body'),
        htmlBody: options.htmlBody,
        to: to_emails
      };
    },
    UUID: function(len) {
      len = len || 5;
      return (new Array(len).join(' ').split(' ')).map(function() {
        return (~~(1e6 * Math.random())).toString(18);
      }).join("-");
    },
    _thumbnailTemplate: '<p><div' +
      'class="thumbnail-wrapper thumbnail3 uploading-thumb" id="thumb-box-<%- index %>">' +
      '<p id="thumb-box-status-<%- index %>"></p><div class="thumb img-wrapper">' +
      '<span class="delete_file_ico">&nbsp;</span>' +
      '<a href="<%- fileUrl %>" target="_blank">' +
      '<span class="img-wrapper">' +
      '<span class="btn-close">' +
      '</span><img class="thumb" src="<%- thumbURL || fileUrl %>" file_id="<%- fileId %>"' +
      ' width="176" style="max-width: 400px;"></span>' +
      '</a>' +
      '</div>' +
      '</div>&nbsp;</p>',
    save: function() {
      var defer = new $.Deferred();
      var self = this,
      data = _.extend(this.toJSON(), this._getKnoteData());

      console.log("body", data);

      knoteClient.addKnote(data).then(function(knoteId) {
        self.set("knoteId", knoteId);
        defer.resolve(knoteId);
        self.changed = false;
      }).fail(function(err) {
        self.trigger('fail', {
          reason: 'Saving Knote failed',
          error: err
        });
        defer.reject(err);
      });
      return defer.promise();
    },
    destroy: function() {
      var self = this;

      knoteClient.getUserInfo().then(function(userInfo) {

        if (!userInfo.account_id) return;

        knoteClient.apply('updateNewTabTopicPosition', [knoteClient.topicId, 300, 'ext:Knotes.destroy']).then(function(data){
          console.log('NewTab Pad position updated')
        });
      });
    },
    validate: function(attrs) {
      if (!attrs.content) return 'empty content';
    },
    _set: function(obj) {
      for (var k in obj) {
        if (obj.hasOwnProperty(k) && !_.isUndefined(obj[k]) && obj[k] !== this.get(k)) {
          this.set(k, obj[k]);
        } else {
          delete obj[k];
        }
      }
      return obj;
    },
    update: function(data) {
      var self = this;
      knoteClient.getUserInfo().then(function(userInfo) {

        if (!userInfo.account_id) return;

        if(self.get('body') === '<div></div>'){
          return null;
        }

        if(_.isEmpty(data)){
          return null;
        }
        data = $.extend({
          htmlBody: ""
        }, data);

        self._set(data);
        if (!self.isValid()) {
          console.warn('KnoteModel: Validation error', self.validationError);
          $.Deferred().reject(self.validationError);
        }
        if (_.isEmpty(data) || !self.changed) return $.Deferred().reject('no Changes');
        if (!self.get('topicId') || !self.get('knoteId')) {
          return self.save();
        }
        console.debug('update knote metadata', data);
        console.log('=======> topicId: ', knoteClient.topicId);
        knoteClient.apply('updateNewTabTopicPosition', [knoteClient.topicId, 300, 'ext:Knotes.update']).then(function(data){
          console.log('NewTab Pad position updated')
        });
        return knoteClient.apply('update_knote_metadata', [self.get('knoteId'), data, 'ext:Knotes.update']);
      });
    }
  });

  return {
    models: _models
  };
};
