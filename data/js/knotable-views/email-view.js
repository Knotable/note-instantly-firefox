var EmailView = Backbone.View.extend({
  el: '#email-knote-container',
  initialize: function(options) {
    _.extend(this, options);
    this.bind('toggleForm', this._toggleForm, this);
  },
  events: {
    'click .knotable-lightbox-inner': 'hide',
    'submit form': 'sendKnoteGmail',
    'change form': 'validateInput',
    'keyup form': 'validateInput',
    'click .email-close': 'hide'
  },

  hide: function() {
    this.$el.addClass('hidden');
  },

  validateInput: function() {
    var validForm = this.$el.find('form')[0].checkValidity();
    return validForm;
  },

  _toggleForm: function(toggle) {
    toggle ?
    this.$el.find('fieldset').attr('disabled', 'disabled') :
    this.$el.find('fieldset').removeAttr('disabled');
  },

  _oAuthSendEmail: function(userId, email, message, subject){
    var self = this;
    gapi.client.load('gmail', 'v1', function() {
      var request = gapi.client.gmail.users.messages.send({
        'userId': userId,
        'resource': {
          'raw': btoa("From: me\r\nTo:" + email + "\r\nSubject:"+ subject + "\r\n\r\n" + message)
        }
      });
      request.execute(function(data){
        console.log(data)
      });
    });
  },

  sendKnoteGmail: function(evt){
    evt.preventDefault();
    this._toggleForm(true);
    var self = this,
    email = this.$el.find('#email-knote-to').val(),
    subject = this.$el.find('#email-knote-subject').val(),
    msgTextOriginal = this.model.get('body'),
    msgText = this.$("#email-knote-content").html();
    msgText = msgText.replace(/<br>/g, '\r\n');
    self._oAuthSendEmail("me", email, msgText, subject);

    self.hide();
    knotable.createNotification({
      message: 'An email was sent successfully to ' + email
    });
    googleAnalyticsHelper.trackAnalyticsEvent('knote', 'emailed');
  },

  _toggleView: function() {
    this.$el.toggleClass('hidden');
  },

  render: function() {
    this._toggleView();
    this.$el.find('form')[0].reset();
    this._toggleForm();
    var content = this.model.get('content');
    htmlContent = content.replace(/\n|\r|\n\r/g, '<br />');
    this.$el.find('#email-knote-content').html(htmlContent);
    this.$el.find('[autofocus]').focus();
    this.validateInput();

    var $emailTo = this.$el.find('#email-knote-to');

    $emailTo.attr("disabled", true);
    $emailTo.attr("placeholder", "initializing your contacts...")

    KneSyncHelper.makeGoogleApiCall().done(function(data){
      var contacts = data.feed.entry;
      var emails = [];
      var data = [];

      for(var i = 0 ; i < contacts.length; i++){
        if(_.has(contacts[i], 'gd$email')){
          var address = contacts[i].gd$email[0].address
          var tmpObj = {
            id: address,
            value: address,
            label: address
          };
          emails.push(tmpObj);
        }
      }

      $emailTo.autocomplete({
        source: emails,
        minLength: 1,
        select: function(event, ui) {
          $emailTo.val(ui.item.id);
        }
      });

      $(".ui-front").css("z-index", "100000000000000000000");

      $emailTo.attr("disabled", false);
      $emailTo.attr("placeholder", "To")
      console.log(emails);
    });
  }
});
