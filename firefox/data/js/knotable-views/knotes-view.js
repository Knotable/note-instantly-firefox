var KnotesView = Backbone.View.extend({
  el: '#knotes-container',
  events: {
    //'click #btn-save-knote': 'saveCurrentKnote',
    'click #btn-add-knote-plus': 'createKnote',
    //'click #btn-email-knote': 'emailKnote',
    'click #btn-delete-knote': 'deleteKnote',
    'focus #knote-edit-area': 'ensureLoggingIn',
    'focusout #knote-edit-area': 'saveCurrentKnote',
    'keyup #knote-edit-area': 'syncTitleToRight',

    'keyup #knote-list-title': 'syncTitleToRight',
    'click #add-list-item': 'addNewListItem',
    "click .remove-list-item": "removeListItem",
    'focus #knote-list-title': 'ensureLoggingIn',
    'focus #knote-add-list-textarea': 'ensureLoggingIn',
    'focusout #knote-list-title': 'saveCurrentTask',
    'change .list-checkbox': 'changeCheck',
    'click #btn-list-knote': 'addListUI',
    'click #btn-add-option': 'toggleAddDropdown',
    'keyup #knote-add-list-textarea': 'listenTaskItemKey'
  },



  saveCurrentKnote: function(callback){
    /*
    if (offlineMode.isOffline()) {
      this._updateKnoteOffline();
    }
    */
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



  _addEmptyKnote: function(){
    if ($(".active").hasClass("new-knote")) {
      return;
    }

    this.$el.find("#knote-edit-area").html('').focus();
    this.$el.find(".list-knote.active").removeClass("active");
    this.tmpl = _.template($('#new-knote-template').html());
    this.$el.find("#knotes-list").prepend(this.tmpl);
  },



  createKnote: function() {
    this.toggleListAreaView(false);
    this.activeKnote = false;
    this._addEmptyKnote();
  },



  deleteKnote: function() {
    var self = this;
    var knote = self.activeKnote;
    if (knote) {
      var knoteId = self.activeKnote.get('knoteId');
      var currentKnote = self.$el.find("#knotes-list li[data-knoteid='"+knoteId+"']");
      var nextKnote = currentKnote.next();
      console.log("delete Knote", knoteId);
      if (!nextKnote.length) {
        nextKnote = currentKnote.prev();
      }
      knoteClient.removeKnote(knoteId)
        .then(function(){
          DropboxClient.removeKnote(knote);
          self.collection.remove(knote);
          if(nextKnote.length){
            nextKnote.click();
          } else{
            self.cleanAddingListArea();
            $("#knote-edit-area").html("");
            self.activeKnote = null;
          }
        }).fail(function(error){
          console.log("- deleteKnote error ", error);
        });

    }
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
      },
      start: function(evt, ui){
        var order = ui.item.attr("data-order");
        this.prevOrder = parseInt(ui.item.prev().attr("data-order") || order);
        this.nextOrder = parseInt(ui.item.next().attr("data-order") || order);
      }
    });
  },



  render: function() {
    var self = this;
    this._syncGmailDraftsService();
    this._syncServerKnotes();

    $(".list-knote").each(function(){
      if($(this).attr("data-knoteid") === ""){
        $(this).remove();
      }
    });
    this.$el.find("#knote-edit-area").focus();
    $("#knotes-list li:nth-child(1)").click();

    $(document).click(function() {
      self.hideAddDropDown();
    });

    this.localKnoteID = this._randomLocalKnoteID();
    KnoteHelper.setCursorOnContentEditable(this.$el.find('#knote-edit-area')[0])
    return this;
  },



  _createKnoteOffline: function(){
    var self = this;
    self.offlineCreateKnotes = [];
    chrome.storage.local.get('offlineCreateKnotes', function (items) {
      var result = items['offlineCreateKnotes'];
      if(!_.isEmpty(result)){
        self.offlineCreateKnotes = result;
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
        self.offlineEditKnotes = result;
      }
      var matchedKnotes = _.findWhere(self.offlineEditKnotes, {'knoteID':knoteId});
      var updateOptions = KnoteHelper.getUpdateOptions();

      if (matchedKnotes) {
        matchedKnotes.updateOptions = updateOptions;
      } else {
        var offlineKnote = {
          knoteID: knoteId,
          updateOptions: updateOptions
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
    var knoteId = this.activeKnote.get("_id") || this.activeKnote.get("knoteId");
    if (!knoteId) return;
    var options = KnoteHelper.getKnoteOptions();
    var oldOptions = KnoteHelper.getKnoteOptions(this.activeKnote.get('content'));
    var content = $("#knote-edit-area").html().trim();

    if (this.activeKnote.get('type') != 'knote') return;

    if (options.title === oldOptions.title && options.htmlBody === oldOptions.htmlBody){
      if (_.isFunction(callback)) {
        callback(false);
      }
      return;
    }

    this._showSyncLoader();
    this.activeKnote.set({
      updated_date: Date.now(),
      content: content
    });
    knoteClient.updateKnote(knoteId, options)
      .then(function(id){
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
  },



  _sortKnotesList: function(){
    var self = this;
    var activeKnote = this.activeKnote;
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
    if (activeKnote) {
      this.collection.each(function(model, collection) {
        var isSame = model.get('knoteId') === activeKnote.get('knoteId');
        if (isSame) {
          self.activeKnote = model;
        }
        model.trigger('activate', isSame);
      });
    }
  },



  onKnoteAdded: function(model) {
    if ( model.get('archived') ) {
      return this;
    }

    if (!offlineMode.isOffline() && model.get('__offline__')) {
      model.destroy();
      window._knotesView.collection.remove(model);
      return this;
    }

    var id = model.get('knoteId') || model.get('_id');
    var $knote = $('.list-knote[data-knoteid=' + id + ']');
    if ($knote.length) {
      return;
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
    self.setActiveKnote.bind(self, self.collection.models[idx.index - 1]);
  },



  onKnoteChanged: function(model, collection, idx) {
    var newContent = model.get('content');
    var editArea = $('#knote-edit-area');
    var self = this;
    if (this.activeKnote == model) {
      if (editArea.is(':visible')) {
        if (newContent != editArea.html().trim()) {
          editArea.html(newContent);
        }
      } else {
        this.cleanAddingListArea();
        $('#knote-list-title').val(model.get('title'));
        var options = model.get('options');
        if(typeof options != 'undefined') {
          options.forEach(function(item, index){
            self.addListItemToUI(item.name, item.checked, item.voters[0])
          })
        }
      }
    }
    this._sortKnotesList();
  },



  _isEditableAreaEmpty: function(){
    return _.isEmpty(this._getEditAreaContent());
  },



  _getEditAreaContent: function(){
    if(!this.$el.find("#knote-list-container").hasClass("hide")){
      return this.$el.find("#knote-list-title").val().trim();
    }
    return this.$el.find("#knote-edit-area").html().trim();
  },



  _removeKnoteIfEmptyContent: function(){
    var self = this;
    if (self.activeKnote && self._isEditableAreaEmpty() && self.activeKnote.get("type") == "knote"){
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
    var self = this;
    var taskTitle = self.$el.find('#knote-list-title');
    if (id instanceof(KnoteModel)) {
      activeKnote = id;
    } else {
      activeKnote = self.collection.findWhere({
        knoteId: id
      });
    }
    if (!activeKnote) return;
    self._removeKnoteIfEmptyContent();
    self.activeKnote = activeKnote;
    self.$el.find('.new-knote.active').remove();

    if(activeKnote.get('type')=="checklist") {
      self.cleanAddingListArea();
      if (!taskTitle.is(':visible')) {
        self.toggleListAreaView(true);
      }
      taskTitle.val(activeKnote.get('title'));
      var options = activeKnote.get('options');
      if(typeof options != 'undefined') {
        options.forEach(function(item, index){
          self.addListItemToUI(item.name, item.checked, item.voters[0])
        })
      }
    } else {
      if (taskTitle.is(':visible')) {
        self.toggleListAreaView(false);
      }
      self.cleanAddingListArea();
      self.$el.find('#knote-edit-area').html(activeKnote.get('content'));
      KnoteHelper.setCursorOnContentEditable($('#knote-edit-area')[0]);
    }

    self.collection.each(function(model, collection) {
      model.trigger('activate', model.get('knoteId') === activeKnote.get('knoteId'));
    });

    self.$el.find('#btn-email-knote,#btn-delete-knote').removeAttr('disabled');
    return self.activeKnote;
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
    // TODO
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
  },



  syncTitleToRight: function(e){
    var self = this;
    var node = $(e.currentTarget);
    if (node.attr('id') == 'knote-edit-area') {
      title = KnoteHelper.getTitleFromContent(node.html().trim());
    } else {
      title = KnoteHelper.getTrimTitle(node.val());
    }
    $('.list-knote.active .body strong').text(title);
  },



  createList: function(e){
    var self = this;
    knoteClient.getTopicId().then(function(topicId) {
      var listData = KnoteHelper.getListData();
      if(listData.title.length < 1) listData.title = 'Untitled';

      var newKnote = new KnoteModel({
        order: self.getNextOrder(false),
        title: listData.title,
        type: 'checklist',
        topicId: topicId,
        options: listData.options.length ? listData.options : []
      });

      newKnote.saveList();
      self.collection.add(newKnote);
      self.setActiveKnote(newKnote);
      console.log("saved list knote and added to collection",newKnote);
    });
  },



  saveCurrentTask: function() {
    var self = this;
    /*
    if (offlineMode.isOffline()) {
      self._updateKnoteOffline();
    }
    */
    if(!self.activeKnote){
      self.createList();
    }else {
      self.updateList(true);
    }
  },



  // This function is for updating the title
  updateList: function(immediate){
    if(!this.activeKnote) return;
    var listData = KnoteHelper.getListData();
    var knoteId = this.activeKnote.get("_id") || this.activeKnote.get("knoteId");
    var knoteType = this.activeKnote.get("type");
    var isUpdated = false;
    if(typeof knoteType != 'undefined' && knoteType == 'knote') return;
    // If there is no change in title,
    // Do not update
    if(listData.title != this.activeKnote.get('title'))
      isUpdated = true;

    // If current update call is immediate & there is old pending update
    // in processing under debounce, force to update current call
    var oldTime = moment(this.activeKnote.get("updated_date")).valueOf();
    var currentTime = moment().valueOf();
    if(immediate &&  (currentTime - oldTime) < 4000 )
      isUpdated = true;

    if(!isUpdated) return;
    // If title updated to empty & there are some list item exist,
    // set item to untitled
    if(listData.title == '' && listData.options.length > 0)
      listData.title = 'Untitled'

    // If there is no title and no list item, Remove empty list
    if(listData.title == '' && listData.options.length < 1 && knoteId){
      listData.title = 'Untitled'
      // Temporary commenting the code to remove checklist & setting title = untitled.
      // Permission for removing empty checklist is getting denied by web server,
      // Update permissions on web server to Let allow clients to remove empty checklist,
    }

    this.activeKnote.set({
      'title': listData.title,
      'options': listData.options,
      'updated_date': Date.now()
    });

    if(knoteId){
      if(immediate){
        this.updateListTitle(false); //  This will abort any debounced version of title update
        knoteClient.updateList({case: "updateTitle", title: listData.title, knoteId: knoteId});
      }else{
        this.updateListTitle(knoteId, listData.title);
      }
    }
  },



  updateListTitle: _.debounce(function(knoteId, newTitle){
    if(knoteId == false) return;
    var options = {case: "updateTitle", title: newTitle, knoteId: knoteId};
    knoteClient.updateList(options);
  }, 4000),



  getNextOrder: function(isMax){
    var nextOrder;
    if(isMax){
      nextOrder = _.max(this.collection.pluck('order'));
    }else{
      nextOrder = _.min(this.collection.pluck('order'));
    }
    if (!isFinite(nextOrder)) nextOrder = 1;
    return isMax? nextOrder + 1 : nextOrder - 1;
  },



  addNewListItem: function(){
    var $item = $("#knote-add-list-textarea");
    var val = $item.val().trim();
    if(!val){
      $item.addClass('textarea_error');
      return null;
    }else{
      this.addListItemToUI(val, false);
      $item.val('').removeClass('textarea_error').focus();
      if(!this.activeKnote){
        this.createList()
      }else{
        this.updateListItem();
      }
    }
  },



  removeListItem: function(e){
    $(e.currentTarget).parents('.knote-added-list').remove();
    this.updateListItem();
  },



  changeCheck: function(e){
    var self = this;
    var ele = $(e.currentTarget);
    chrome.storage.local.get('contact', function (items) {
      console.log(items['contact']);
      var contact = items['contact'];
      if(ele.prop('checked')){
        ele.attr('data-checked-by', contact._id);
      } else{
        ele.attr('data-checked-by','');
      }
      self.updateListItem();
    });
  },



  updateListItem: function(){
    var options = KnoteHelper.getListData();
    var knoteId = this.activeKnote.get('knoteId');
    this.activeKnote.set({
      'title': options.title,
      'options': options.options,
      'updated_date': Date.now()
    });
    options.case = "updateItems";
    options.knoteId = knoteId;
    if (!knoteId) {
      options.order = this.activeKnote.get('order');
      options.title = options.title;
    }
    knoteClient.updateList(options);
  },



  addListUI: function(e){
    this.activeKnote = null;
    this.cleanAddingListArea();
    this.toggleListAreaView(true);
    this._addEmptyKnote();
  },



  toggleListAreaView: function(show){
    if(show==true){
      this.$el.find("#knote-edit-area").addClass("hide");
      this.$el.find("#knote-list-container").removeClass('hide');
      this.$el.find(".list-knote.new-knote").remove();
      this.$el.find("#knote-list-title").removeClass("textarea_error").focus();
    }else{
      this.$el.find("#knote-list-container").addClass("hide");
      this.$el.find("#knote-edit-area").removeClass('hide');
    }
  },



  // TODO - Optimize this function
  cleanAddingListArea: function(){
    this.$el.find("#knote-list-title").removeClass("textarea_error").val('');
    this.$el.find("#knote-add-list-textarea").val('');

    this.$el.find(".knote-added-list").each(function(){
      if($(this).attr('id') !='knote-main-list-item'){
        $(this).remove();
      }else{
        $(this).find("label").html('');
        $(this).find("input").prop("checked",false);
      }
    });
    this.$el.find("#knote-main-list-item").addClass("hide");
    this.$el.find("#knote-edit-area").html('').focus();
    this.$el.find(".list-knote.active").removeClass("active");
    this.$el.find(".list-knote.new-knote").addClass("active").removeClass("hide").find("strong").text("new");
  },



  addListItemToUI: function(val, checked, checkedBy){
    var $item = $(".knote-added-list:first").clone();
    $item.find(".knote-list-label").html(val);
    $item.find(".list-checkbox").prop("checked", checked).attr('data-checked-by', checkedBy);
    $item.attr('id','').removeClass('hide');
    $("#knote-added-list-container").append($item).removeClass('hide');
  },



  toggleAddDropdown: function (e) {
    e.stopPropagation();
    $('.add-drop-down').slideToggle(200);
  },



  hideAddDropDown: function(){
    setTimeout(function(){
      $('.add-drop-down').slideUp(200);
    }, 1);
  },



  listenTaskItemKey: function(e){
    if(e.keyCode == 13 && e.shiftKey != true){
      e.preventDefault();
      this.addNewListItem();
    }
  }

});
