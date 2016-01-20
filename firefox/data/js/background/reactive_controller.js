'use strict';

/*
* Watch changes in reactive queries
*/

window.reactiveController = (function(){
  var exports = {};
  var knotes = null;



  exports.init = function(){
    watchUser();
    watchContact();
    initKnoteWatchers();
  };



  var initKnoteWatchers = function() {
    console.log('initWatchers');
    knotes = asteroid.getCollection('knotes');
    var knotesQuery = knotes.reactiveQuery({});
    _watchKnotes(knotesQuery);
    _sendCachedKnotes(knotesQuery);
  };



  var _sendCachedKnotes = function(knotesQuery){
    // send knotes from cache
    var results = _.groupBy(knotesQuery.result, function(knote) {
      return knote._id;
    });
    _.each(_.values(results), function(knote){
      // if the knote was created in offline mode, there will be
      // two knotes here: the newest knote and the backup knote
      if (knote.length > 1) {
        knote = _.max(knote, function(k) {
          return k.updated_date;
        });
      } else {
        knote = knote[0];
      }
      if(!knote.archived){
        _addedKnote(knote);
      }
    });
  };



  var _watchKnotes = function(knotesQuery){
    var _removedKnoteId = null;
    var _idOfKnoteToUpdate = null;
    // send knotes from ddp message
    knotesQuery.on("change", function(knoteId){
      var knote = _.find(knotesQuery.result, function(knote){
        return knoteId.match(knote._id);
      });

      if (knote.type == 'checklist') {
        var updateOption = asteroid.backupUpdateListStack[knote.order];
        var option;
        if (!updateOption) {
          for (var order in asteroid.backupUpdateListStack) {
            option = asteroid.backupUpdateListStack[order];
            if (option.title == knote.title) {
              updateOption = option;
              delete asteroid.backupUpdateListStack[order];
            }
          }
        }
        if (updateOption) {
          console.log('[Update offline task] id: ', knote._id, ', title: ', knote.title);
          delete asteroid.backupUpdateListStack[knote.order];
          knotes.update(knote._id, updateOption);
        }
      }

      if (knoteId.match('__upd__') && knote){
        _idOfKnoteToUpdate = knote._id;
      } else if (knoteId.match('__del__')){
        knoteId = knoteId.match(/(.*)__del__/)[1];
        _removedKnoteId = knoteId;
        _removedKnote(knoteId);
      } else if (knote) {
        if (_idOfKnoteToUpdate == knote._id) {
          _idOfKnoteToUpdate = null;
          _updateKnote(knote);
        } else if (!_.contains([_removedKnoteId], knote._id)){
          _addedKnote(knote);
        } else {
          _removedKnoteId = null;
        }
      } else if (knoteId) {
        _removedKnoteId = knoteId;
        _removedKnote(knoteId);
      }
    });
  };



  var _addedKnote = function(knote){
    if(knote.archived){
      console.log("Subscription: Added knote: skip archived knote", knote._id);
      return true;
    }
    console.log("Subscription: -> Added Knote: ", knote.title);
    chrome.runtime.sendMessage({
      msg: 'addKnote',
      knote: knote
    });
  };



  var _removedKnote = function(knoteId){
    console.log("Subscription: -> Removed Knote: ", knoteId);
    chrome.runtime.sendMessage({
      msg: 'removeKnote',
      knoteId: knoteId
    });
  };



  var _updateKnote = function(knote){
    console.log("Subscription: -> Updated Knote: ", knote);
    chrome.runtime.sendMessage({
      msg: 'updateKnote',
      knote: knote
    });
  };



  var watchUser = function(){
    var user = asteroid.getCollection('users').reactiveQuery({});
    user.on("change", function(){
      if(user.result.length){
        if(user.result[0].services && user.result[0].services.google){
          //localStorage.google = JSON.stringify(user.result[0].services.google);
          chrome.storage.local.set({google: user.result[0].services.google});
        }
        //localStorage.username = user.result[0].username;
        chrome.storage.local.set({username: user.result[0].username});
      }
    });
  };



  var watchContact = function(){
    var contact = asteroid.getCollection('contacts').reactiveQuery({});
    contact.on("change", function(){
      if(contact.result.length){
        chrome.storage.local.set({contact: contact.result[0]});
        //localStorage.contact = JSON.stringify(contact.result[0]);
      }
    });
  };



  exports.loadKnotesOnClient = function(){
    _sendCachedKnotes(asteroid.getCollection('knotes').reactiveQuery({}));
  };



  exports.init();
  return exports;
})();
