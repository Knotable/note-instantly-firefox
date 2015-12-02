'use strict';

/*
* Watch changes in reactive queries
*/

window.reactiveController = (function(){
  var exports = {};



  exports.init = function(){
    watchUser();
    watchContact();
    initKnoteWatchers();
  };



  var initKnoteWatchers = function() {
    console.log('initWatchers');
    var knotes = asteroid.getCollection('knotes');
    var knotesQuery = knotes.reactiveQuery({});
    _watchKnotes(knotesQuery);
    _sendCachedKnotes(knotesQuery);
  };



  var _sendCachedKnotes = function(knotesQuery){
    // send knotes from cache
    _.each(knotesQuery.result, function(knote){
      if(!knote.archived){
        _addedKnote(knote);
      }
    });
  };



  var _watchKnotes = function(knotesQuery){
    var _removedKnoteId = null;
    var _knoteId = null;
    // send knotes from ddp message
    knotesQuery.on("change", function(knoteId){
      var knote = _.find(knotesQuery.result, function(knote){
        return knoteId.match(knote._id);
      });

      if (knoteId.match('__upd__') && knote){
        _knoteId = knote._id;
        _updateKnote(knote);
      } else if (knote) {
        if(!_.contains([_removedKnoteId, _knoteId], knote._id)){
          _addedKnote(knote);
        } else {
          _removedKnoteId = null;
          _knoteId = null;
        }
      } else {
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
    console.log("Subscription: -> Added Knote: ", knote);
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
