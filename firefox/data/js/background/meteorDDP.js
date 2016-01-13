'use strict';

var offlineKnoteIds = [];

window.sendAndClearOfflineKnotes = function() {
  if (offlineKnoteIds.length) {
    var knoteCollection = asteroid.getCollection('knotes');
    _.each(offlineKnoteIds, function(id) {
      var knote = knoteCollection.reactiveQuery({_id: id}).result[0];
      if (!knote || !knote.__offline__) return;
      delete knote._id;
      delete knote.__offline__;
      if (knote.type == 'knote') {
        delete knote.type;
        knoteServer.addKnote(knote);
      } else if (knote.type == 'checklist') {
        delete knote.type;
        knoteServer.addListKnote(knote);
      }
      knoteCollection._localToLocalRemove(id);
    });
    offlineKnoteIds = [];
  }
};

window.knoteServer = (function() {
  /*
  * Set K icon to inactive by default
  */
  var exports = {};
  var config = getConfig(runtime_mode);
  var knoteCollection = asteroid.getCollection('knotes');

  function addOfflineKnote(knote) {
    if (knote._id) {
      return;
    }
    knote._id = Asteroid.utils.guid();
    knote.__offline__ = true;
    offlineKnoteIds.push(knote._id);
    return knoteCollection._localToLocalInsert(knote);
  }

  exports.getPadLink = function(){
    return asteroid.getPadLink();
  };

  exports.getTopicId = function(){
    return asteroid.getTopicId();
  };

  exports.getUserId = function() {
    return asteroid.userId;
  };

  exports.hasLoggedIn = function(){
    return asteroid.hasLoggedIn();
  };

  exports.logout = function() {
    return asteroid.logout();
  };

  exports.addKnote = function(data) {
    var requiredKnoteParams = {
      subject: data.subject || 'Knotes',
      from: data.from || AccountHelper.getEmail(),
      to: data.to,
      body: data.htmlBody,
      htmlBody: data.htmlBody,
      name: AccountHelper.getUsername(),
      topic_id: asteroid.getTopicId(),
      userId: asteroid.userId,
      date: data.date || new Date().toGMTString(),
      isMailgun: false,
      timestamp: Date.now()
    };
    var optionalKnoteParams = {
      order: data.order,
      title: data.title
    };

    if (!requiredKnoteParams.userId || !requiredKnoteParams.topic_id) {
      console.error('addKnote invalid params: ', requiredKnoteParams);
      return false;
    }

    console.log('======> add_knote: ', requiredKnoteParams, optionalKnoteParams);
    if (!asteroid.isConnected) {
      data.type = 'knote';
      return addOfflineKnote(data);
    } else {
      exports.apply('updateNewTabTopicPosition', [requiredKnoteParams.topic_id, 300, 'ext:KnotableMeteor.addKnote']);

      return exports.call("add_knote", requiredKnoteParams, optionalKnoteParams);
    }
  };

  exports.addListKnote = function(data) {
    var params = {
      id: asteroid.userId,
      message_subject: data.subject || 'task',
      name: AccountHelper.getUsername(),
      from: data.from || AccountHelper.getEmail(),
      to: data.to,
      date: new Date(),
      title: data.title,
      isMailgun: false,
      topic_type: 2,
      topic_id: asteroid.getTopicId(),
      pollId: data.checklistId || null,
      order: data.order,
      section_id: null,
      task_type: 'public',
      options: data.options

    };
    if (!asteroid.isConnected) {
      data.type = 'checklist';
      return addOfflineKnote(data);
    } else {
      return exports.call("create_checklist", params);
    }
  };

  exports.updateList = function (options) {
    return asteroid.updateList(options);
  };

  exports.updateKnote = function(knoteId, options){
    console.log("MeteorDDP updateKnote", knoteId, options);
    return asteroid.updateKnote(knoteId, options);
  };


  exports.removeKnote = function(knoteId){
    console.log("MeteorDDP removeKnote", knoteId);
    return asteroid.removeKnote(knoteId);
  };


  exports.call = function(method, args) {
    return asteroid.call.apply(asteroid, arguments).result;
  };


  exports.apply = function(method, args) {
    return asteroid.apply(method, args).result;
  };


  exports.createAccount = function(options){
    return asteroid.createUser(options);
  };


  exports.loginWithPassword = function (usernameOrEmail, password){
    return asteroid.loginWithPassword(usernameOrEmail, password);
  };


  exports.getCollection = function(pubName, params) {
    return asteroid.getCollection(pubName).reactiveQuery({}).result;
  };

  exports.getGoogleOauthToken = function(){
    return asteroid.getGoogleOauthToken();
  };

  exports.getUserInfo = function() {
    if(asteroid.loggedIn){
      return AccountHelper.getContact();
    } else {
      return null;
    }
  };

  return exports;
})();
