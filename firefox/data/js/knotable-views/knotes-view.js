var KnotesView = Backbone.View.extend({
  el: '#knotes-container',
  events: {
    //'click #btn-save-knote': 'saveCurrentKnote',
    'click #btn-add-knote-plus': 'createKnote',
    //'click #btn-email-knote': 'emailKnote',
    'click #btn-delete-knote': 'deleteKnote',
    'focus #knote-edit-area': 'ensureLoggingIn',
    'focusout #knote-edit-area': 'saveCurrentKnote'
  },
  saveCurrentKnote: function(callback){
    if(this.activeKnote){
      this._updateKnote(callback);
    } else {
      this._addNewKnote(callback);
    }
  },
  ensureLoggingIn: function() {
    var self = this;
    knoteClient.hasLoggedIn().then(function(loggedIn){
      if(loggedIn){
        if($("#knotable-button-login").length !== 0)
          new self.LoginView().hide();
      } else {
        if($("#knotable-button-login").length === 0)
          new self.LoginView().show();
      }
    }).fail(function(){
      if($("#knotable-button-login").length === 0)
        new self.LoginView().show();
    });
  },
  emailKnote: function() {
    var self = this;
    gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: true}, function(authResult){
      if (authResult && !authResult.error) {
        // The person has authorized or is already logged in
        var knote = self.activeKnote;
        console.debug('should email:', knote);
        self.emailView = self.emailView || new EmailView({contact: self.contact});
        self.emailView.model = knote;
        self.emailView.render();

      } else {

        window.setTimeout(function(){

          var currentWinID = 0;
          chrome.windows.onCreated.addListener(function(data){
            console.log(data)
            currentWinID = data.id;
          })

          gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: false}, function(authResult){
          });

          var pollTimer   =   window.setInterval(function() {
            try {
              gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: true}, function(authResult){
                if (authResult && !authResult.error) {
                  window.clearInterval(pollTimer);
                  chrome.windows.remove(currentWinID, function(){})

                  window.setTimeout(function(){
                    $("#btn-email-knote").click();
                  }, 1000);
                }
              });
            } catch(e) {
              console.log(e)
            }
          }, 5000);

        }, 1500);

      }
    });

  },

  _randomLocalKnoteID: function (L){
      var s= '';
      var randomchar=function(){
        var n= Math.floor(Math.random()*62);
        if(n<10) return n; //1-10
        if(n<36) return String.fromCharCode(n+55); //A-Z
        return String.fromCharCode(n+61); //a-z
      }
      while(s.length< L) s+= randomchar();
      return s;
    },

  _createKnoteOffline: function(){
    var self = this;
    self.offlineCreateKnotes = [];
    chrome.storage.local.get('offlineCreateKnotes', function (items) {
      var result = items['offlineCreateKnotes'];
      if(!_.isEmpty(result)){
        self.offlineCreateKnotes = result.offlineCreateKnotes;
      }

      // if(!window.currentLocalKnote){
      //   window.currentLocalKnote = self._randomLocalKnoteID(10);
      // }

      knoteClient.getTopicId().then(function(topicId) {
        var knote = {
          "localID": self.localKnoteID,
          "subject":"",
          "body":"",
          "htmlBody":$("#knote-edit-area").html().trim(),
          "topic_id": topicId
        };

        var matchedKnotes = _.findWhere(self.offlineCreateKnotes, {'localID':knote.localID});

        if(matchedKnotes){
          console.log("***********************")
          console.log(matchedKnotes)
          console.log("***********************")
          matchedKnotes.htmlBody = $("#knote-edit-area").html().trim();
        } else{
          self.offlineCreateKnotes.push(knote);
        }
        chrome.storage.local.set({'offlineCreateKnotes': self.offlineCreateKnotes});
      });
    });
  },

  _addEmptyKnote: function(){
    if ($(".active").hasClass("new-knote")) {
      return;
    }

    this.$el.find("#knote-edit-area").html('').focus();
    this.$el.find(".list-knote.active").removeClass("active");
    this.tmpl = _.template($('#new-knote-template').html());
    this.$el.find("#knotes-list").prepend(this.tmpl);
  },
  createKnote: function(content) {
    this.activeKnote = false;
    this._addEmptyKnote();
  },

  deleteKnote: function() {
    var self = this;
    var knote = self.activeKnote;
    if (knote) {
      var knoteId = self.activeKnote.get('knoteId');
      console.log("delete Knote", knoteId);
      knoteClient.removeKnote(knoteId)
      .then(function(){
        DropboxClient.removeKnote(knote);
        self.collection.remove(knote);
        self.$el.find("#knotes-list li").first().next().trigger("click");
      }).fail(function(error){
        console.log("long removeKnote", error);
      });
    }
    else{
      self.$el.find("#knotes-list li").first().next().trigger("click");
    }

    window.setTimeout(function(){
      if(self.$("#knotes-list").has('li').length === 0){
        $("#knote-edit-area").html("");
        self.createKnote();
      }
    }, 200);

  },

  initialize: function(knotesCollection) {
    var self = this;

    self.LoginView = window.knotable.getView('LoginView');
    self.collection = knotesCollection;

    self.collection.on('add', self.onKnoteAdded, self);
    self.collection.on('remove', self.onKnoteRemoved, self);
    self.collection.on('change', self.onKnoteChanged, self);
    self.collection.on('timeStampUpdate', self.onTimeStampUpdated, self);

    self.searchView = new SearchBoxView();
    self.$el.find('#knotes-list').sortable({
      containment: 'parent',
      items: 'li.list-group-item',
      stop: function(evt, ui) {
        var prevId = ui.item.prev().attr("data-knoteid");
        var nextId = ui.item.next().attr("data-knoteid");

        var prevKnote = self.collection.findWhere({_id: prevId});
        var nextKnote = self.collection.findWhere({_id: nextId});
        nextKnote = nextKnote || prevKnote;
        prevKnote = prevKnote || nextKnote;
        var maxOrder = _.max([this.prevOrder, this.nextOrder, prevKnote.get("order"), nextKnote.get('order')]);
        var minOrder = _.min([this.prevOrder, this.nextOrder, prevKnote.get("order"), nextKnote.get('order')]);
        var $knotes = $("#knotes-list li").filter(function(knote){
          var order = parseInt($(this).attr("data-order"));
          if(order < minOrder || order > maxOrder){
            return false;
          } else {
            return true;
          }
        });
        if ($knotes.length <= (maxOrder-minOrder+1)){
          var order = minOrder;
          _.each($knotes, function(knote){
            console.log("long", knote, order);
            var knoteId = $(knote).attr("data-knoteid");
            if($(knote).attr("data-order") !== order){
              self.collection.findWhere({_id: knoteId}).set({order: order});
              knoteClient.updateKnote(knoteId, {order: order++});
            }
          })
        }
        return
        var knoteId = ui.item.attr("data-knoteid");
        var options = {order: newOrder};
        knoteClient.updateKnote(knoteId, options)
        .then(function(){
          console.log("Update knote", knoteId, " Success!");
        })
        .fail(function(){
          console.error("Update knote", knoteId, " FAILED!");
        });
      },
      start: function(evt, ui){
        var order = ui.item.attr("data-order");
        this.prevOrder = parseInt(ui.item.prev().attr("data-order") || order);
        this.nextOrder = parseInt(ui.item.next().attr("data-order") || order);
      }
    });
  },

  render: function() {
    this._syncGmailDraftsService();
    this._syncServerKnotes();

    $(".list-knote").each(function(){
      if($(this).attr("data-knoteid") === ""){
        $(this).remove();
      }
    });
    this.$el.find("#knote-edit-area").focus();
    $("#knotes-list li:nth-child(1)").click();

    this.localKnoteID = this._randomLocalKnoteID();
    return this;
  },

  _clearOfflineKnotes: function(){
    chrome.storage.local.set({'offlineEditKnotes': []});
  },

  _updateKnoteOffline: function(){
     var self = this;
     self.offlineEditKnotes = []

     if(!self.activeKnote){
       this._createKnoteOffline();
       return;
     }

     var knoteId = self.activeKnote.get("_id") || self.activeKnote.get("knoteId");

     if(!knoteId){
       this._createKnoteOffline();
       return;
     }

     chrome.storage.local.get('offlineEditKnotes', function (items) {
       var result = items['offlineEditKnotes'];
       if(!_.isEmpty(result)){
         self.offlineEditKnotes = result.offlineEditKnotes;
       }
       var matchedKnotes = _.findWhere(self.offlineEditKnotes, {'knoteID':knoteId});

       if (matchedKnotes) {
         matchedKnotes.updateOptions = KnoteHelper.getUpdateOptions($("#knote-edit-area"));
       }

      else{
         var offlineKnote = {
           knoteID: knoteId,
           updateOptions: KnoteHelper.getUpdateOptions($("#knote-edit-area"))
         };

         self.offlineEditKnotes.push(offlineKnote);
      }
      chrome.storage.local.set({'offlineEditKnotes': self.offlineEditKnotes});

     });
  },

  _updateKnoteOnBackground: _.debounce(function(e){
    if(this.activeKnote){
      this._updateKnote();
    }
  }, 2 * 60 * 1000),

  _addNewKnote: function(callback) {
    var self = this;

    if (self.activeKnote) {
      return;
    }

    var content = $('#knote-edit-area').html().trim();
    if (_.isEmpty(content)){
      return;
    }

    if (!(content && _.isString(content))) {
      content = self._getEditAreaContent();
    }

    self.$el.find(".list-knote.new-knote").remove();

    var nextOrder = _.min(self.collection.pluck('order'));
    if (!isFinite(nextOrder)) nextOrder = 1;
    var newKnote = new KnoteModel({
      order: nextOrder - 1,
      content: content,
    });
    console.log('>>>>>>>>>>>>> saving new knote <<<<<<<<<<<<');
    newKnote.save().done(function(knoteId) {
      console.log('>>>>>>>>>>>>> new knote saved ' + knoteId + ' <<<<<<<<<<<<');
    });
    console.log('>>>>>>>>>>>>> saving <<<<<<<<<<<<');

    self.collection.add(newKnote);
    self.setActiveKnote(newKnote);

    if (_.isFunction(callback)) {
      callback();
    }

    googleAnalyticsHelper.trackAnalyticsEvent('knote', 'created');
  },

  _showSyncLoader: function(){
    $("#knote-sync-message").css("visibility", "block").fadeIn("slow");
  },

  _hideSyncLoader: function(){
    $("#knote-sync-message").css("visibility", "hidden").fadeIn("slow");
  },

  _updateKnote: function(callback){
    var options = KnoteHelper.getUpdateOptions($("#knote-edit-area"));
    var knoteId = this.activeKnote.get("_id") || this.activeKnote.get("knoteId");
    var knoteHasChanged = true;

    if (options.title === this.activeKnote.get("title") && options.htmlBody === this.activeKnote.get("htmlBody")){
      knoteHasChanged = false;
    }
    if(knoteId && knoteHasChanged){
      this._showSyncLoader();
      knoteClient.updateKnote(knoteId, options)
        .then(function(){
          console.log("Update knote", knoteId, " Success!");
          window._knotesView._hideSyncLoader();
          if (_.isFunction(callback)) {
            callback(true);
          }
        })
        .fail(function(){
          console.error("Update knote", knoteId, " FAILED!");
          window._knotesView._hideSyncLoader();
          if (_.isFunction(callback)) {
            callback(false);
          }
        });
    } else {
      if (_.isFunction(callback)) {
        callback(false);
      }
    }
  },

  _sortKnotesList: function(){
    var $knotes = this.$el.find('#knotes-list');
    var $knotesLi = $knotes.find("li");
    $knotesLi.sort(function(knoteA, knoteB){
      if($(knoteA).hasClass("new-knote")){
        return -1;
      }
      if($(knoteB).hasClass("new-knote")){
        return 1;
      }
      var orderA = parseInt(knoteA.getAttribute('data-order'));
  		var orderB = parseInt(knoteB.getAttribute('data-order'));

      if(orderA > orderB){
        return 1;
      } else if (orderA < orderB){
        return -1;
      } else {
        var timeA = parseInt(knoteA.getAttribute('data-timestamp'));
        var timeB = parseInt(knoteB.getAttribute('data-timestamp'));
        if(timeA > timeB){
          return -1;
        } else {
          return 1;
        }
      }

      return 0;
    });
    $knotesLi.detach().appendTo($knotes);
  },

  onKnoteAdded: function(model) {
    if ( model.get('archived') ) {
      return this;
    }

    var knoteView = new KnoteView(model);
    knoteView = knoteView.render().$el;

    this.$el.find('#knotes-list').prepend(knoteView);

    this._sortKnotesList();
    return this;
  },

  onKnoteRemoved: function(knote, collection, idx) {
    var self = this;
    knote.trigger('destroy');
    this.setActiveKnote.bind(this, this.collection.models[idx.index - 1]);
  },

  onKnoteChanged: function(knote, collection, idx) {
    this._sortKnotesList();
  },

  _isEditableAreaEmpty: function(){
    return _.isEmpty(this._getEditAreaContent());
  },

  _getEditAreaContent: function(){
    return this.$el.find("#knote-edit-area").html().trim();
  },

  _removeKnoteIfEmptyContent: function(){
    var self = this;
    if (self.activeKnote && self._isEditableAreaEmpty()){
      var knoteId = self.activeKnote.get("_id") || self.activeKnote.get("knoteId");
      var knoteCid = self.activeKnote.cid;

      var knote = self.activeKnote.toJSON();
      console.log("remove knote Id is", knoteId);

      if (knoteId){
        knoteClient.removeKnote(knoteId)
        .then(function(){
          DropboxClient.removeKnote(knote);
          self.collection.remove(knoteCid);
        }).fail(function(error){
          console.log("long removeKnote", error);
        });
      }
    }
  },

  setActiveKnote: function(id) {
    var activeKnote;
    if (id instanceof(KnoteModel)) {
      activeKnote = id;
    } else {
      activeKnote = this.collection.findWhere({
        knoteId: id
      });
    }
    if (!activeKnote) return;
    this._removeKnoteIfEmptyContent();

    this.activeKnote = activeKnote;
    //this.$el.find(".new-knote.active").removeClass("active").addClass("hide");
    $('.new-knote.active').remove();

    this.$el.find('#knote-edit-area').html(activeKnote.get('content')).focus();

    var self = this;
    this.collection.each(function(model, collection) {
      model.trigger('activate', model === activeKnote);
    });

    this.$el.find('#btn-email-knote,#btn-delete-knote').removeAttr('disabled');
    return this.activeKnote;
  },

  saveKnoteAsGmailDraft: function(){
    var self = this;

    chrome.storage.local.get('gmailDrafts', function(items) {
      var gmailDrafts = items['gmailDrafts'] || [];

      var currentKnote = {
        knoteID: chromeActiveKnote,
        lastEdited: moment().format(),
        knoteContent: chromeActiveKnoteContent
      };

      var matchedDraft = _.findWhere(gmailDrafts, {'knoteID':currentKnote.knoteID});
      if (matchedDraft) {
        matchedDraft.knoteContent = chromeActiveKnoteContent;
      } else{
        gmailDrafts.push(currentKnote);
      }

      chrome.storage.local.set({'gmailDrafts': gmailDrafts});
    });
  },

  saveKnoteAsServerDraft: function(knoteData){

    var self = this;

    chrome.storage.local.get('knoteDrafts', function(items) {
      var knoteDrafts = items['knoteDrafts'] || [];

      var matchedDraft = _.findWhere(knoteDrafts, {'knoteId':knoteData.knoteId});

      if (matchedDraft) {
        matchedDraft.content = knoteData.content;
      } else{
        knoteDrafts.push(knoteData);
      }

      chrome.storage.local.set({'knoteDrafts': knoteDrafts});
    });

  },

  _syncGmailDraftsService: function(){

    setInterval(function(){
      KneSyncHelper.isGmailSyncSetting(function(result) {
        if(!result){
          // console.log("Sync Gmail not allowed")
          return;
        }

        chrome.storage.local.get('draft-knote-map', function(items) {
          var knotesDraftsMap = items['draft-knote-map'];

          chrome.storage.local.get('gmailDrafts', function(items) {
            var gmailDrafts = items['gmailDrafts'] || [];

            if(gmailDrafts.length > 0){
              var matchedDraft = _.findWhere(knotesDraftsMap, {'knoteID':gmailDrafts[0].knoteID});
              if (matchedDraft) {
                KneSyncHelper.updateDraftFromID(matchedDraft.draftID, gmailDrafts[0].knoteContent, "");
              }
              else{
                KneSyncHelper.syncGmailDrafts("", gmailDrafts[0].knoteContent, gmailDrafts[0].knoteID);
              }

              gmailDrafts = _.reject(gmailDrafts, function(el) { return el.knoteID === gmailDrafts[0].knoteID; });
            }

            chrome.storage.local.set({'gmailDrafts': gmailDrafts});
          });
        });
      });


    }, 60000);

  },

  _syncServerKnotes: function(){

    setInterval(function(){

      chrome.storage.local.get('knoteDrafts', function(items) {
        var knoteDrafts = items['knoteDrafts'] || [];
        // console.log("sync started");

        if(knoteDrafts.length > 0){
          knoteClient.getTopicId().then(function(topicId) {
            var updateData = {
              topic_id: topicId
            };

            updateData = $.extend({
              //order: this.get('order'),
              htmlBody: knoteDrafts[0].content
            }, updateData);
          });
        } else{
          //console.log("window event ended")
        }
      });

    }, 15000);
  }
});
