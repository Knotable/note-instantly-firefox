'use strict';

/*
* Handle subscription/publications
*/

window.Subscriptions = (function(){
  var exports = {};
  var _topicId = null;

  exports.subscribeTopic = function(topicId) {
    var knotes = asteroid.getCollection('knotes');
    var knotesQuery = knotes.reactiveQuery({topic_id: topicId});
    //console.log("knotesQuery", knotesQuery.result);

    if (topicId && topicId !== _topicId){
      _topicId = topicId;
      console.log("subscribe", topicId);
      asteroid.subscribe('topic', topicId, true)
        .ready
        .then(function() {
          chrome.runtime.sendMessage({
            msg: 'topicId',
            topicId: topicId
          });
        });
      var containers = [
        {name: 'main'},
        {name: 'attachment'}
      ];
      asteroid.subscribe('topicKnotes', topicId, containers);

      var topicCollection = asteroid.getCollection("topics");
      var topicQuery = topicCollection.reactiveQuery({_id: topicId});
      var currentTopic = topicQuery.result[0];

      var renameTopic = _.throttle(function(topicCollection, currentTopic){
        var subject = 'Knotes';
        if (subject !== currentTopic.subject){
          console.log("rename topic", currentTopic.subject, subject);
          topicCollection.update(topicId, {subject: subject});
        }
      }, 5000);
      if(currentTopic){
        renameTopic(topicCollection, currentTopic);
      } else {
        console.log("currentTopic", currentTopic);
        topicQuery.on('change', function(t){
          renameTopic(topicCollection, topicQuery.result[0]);
        });
      }

      asteroid.subscribe('allRestKnotesByTopicId', topicId);
      asteroid.subscribe('pinnedKnotesForTopic', topicId);

      _watchKnotes(knotesQuery);
    }

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
      console.log("Added knote: skip archived knote", knote._id);
      return true;
    }
    console.log("Added Knote: ", knote);
    chrome.runtime.sendMessage({
      msg: 'addKnote',
      knote: knote
    });
  };


  var _removedKnote = function(knoteId){
    console.log("Removed Knote: ", knoteId);
    chrome.runtime.sendMessage({
      msg: 'removeKnote',
      knoteId: knoteId
    });
  };


  var _updateKnote = function(knote){
    console.log("Updated Knote: ", knote);
    chrome.runtime.sendMessage({
      msg: 'updateKnote',
      knote: knote
    });
  };


  return exports;
})();
