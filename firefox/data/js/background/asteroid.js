'use strict';

window.asteroid = (function(){
  var exports = {};
  var asteroidDDP;
  var _topicId = null;
  var Subscriptions = [];
  var config = getConfig(runtime_mode);

  exports.userId = null;
  exports.loggedIn = null;

  exports.init = function(host){
    //localStorage.clear()
    console.info("asteroid.init", arguments);
    asteroidDDP = new Asteroid(host);
    window.asteroidDDP = asteroidDDP;


    var onLogin = function(){
      console.time("SubscriptionTime");
      console.log("User loggedIn");

      var tokenName = asteroidDDP._host + "__" + asteroidDDP._instanceId + "__login_token__";
      chrome.storage.local.get(tokenName, function(items) {
        var token = items[tokenName];
        console.log('=======> multiStorage.get token: ' + token);
        if (token){
          chrome.storage.local.set({loginToken: token});
          MessageManager.loginExtension(token);
        }
        console.info("Asteroid login Success: ", token);
      });

      chrome.storage.local.set({userId: asteroidDDP.userId});
      exports.userId = asteroidDDP.userId;
      exports.loggedIn = asteroidDDP.loggedIn;

      chrome.runtime.sendMessage({
        msg: 'login'
      }, $.noop);
      chrome.runtime.sendMessage({
        isFnCall: true,
        type: 'login'
      }, $.noop);

      updateIcon(iconStates.loggedIn);

      var sub = asteroidDDP.subscribe('collectionsForChrome');
      Subscriptions.push(sub);
      sub.ready.then(function() {
        console.timeEnd("SubscriptionTime");
        var topic = asteroid.getCollection('topics').reactiveQuery({}).result;
        if(topic.length){
          _topicId = topic[0]._id;
          chrome.storage.local.set({'topicId': _topicId});
          chrome.runtime.sendMessage({
            msg: 'topicId',
            topicId: _topicId
          });
        }
        reactiveController.loadKnotesOnClient();
      });
    };

    var onLogout = function(){
      console.info("Asteroid logout!");

      MessageManager.logoutExtension();
      updateIcon(iconStates.loggedOut);

      exports.userId = null;
      exports.loggedIn = null;
      chrome.storage.local.remove('loginToken');
      _topicId = null;
      //localStorage.clear();
      _.each(Subscriptions, function(sub){
        sub.stop();
      });
      chrome.runtime.sendMessage({
        msg: 'logout'
      }, $.noop);
      chrome.runtime.sendMessage({
        isFnCall: true,
        type: 'logout'
      }, $.noop);
    };
    /**
    * login success callback
    */
    asteroidDDP.on("login", onLogin);

    asteroidDDP.on("connected", function(){
      console.info("Asteroid connected!");
      asteroid.isConnected = true;
      MessageManager.connected();
    });

    asteroidDDP.on("reconnected", function(){
      console.info("Asteroid reconnected!");
      asteroid.isConnected = true;
      MessageManager.reconnected();
    });

    asteroidDDP.on("logout", onLogout);

    asteroidDDP.ddp.on("socket_error", function(){
      console.error("socket_error");
      asteroid.isConnected = false;
      MessageManager.disconnected();
    });

    asteroidDDP.ddp.on("socket_close", function(){
      console.error("socket_close");
      asteroid.isConnected = false;
      MessageManager.disconnected();
    });

  };


  exports.createAccount = function(options) {
    return asteroid.createUser(options);
  };

  exports.getTopicId = function() {
    return _topicId;
  };

  exports.getPadLink = function(){
    reactiveController.loadKnotesOnClient();
    if (!asteroid.isConnected) {
      chrome.runtime.sendMessage({
        msg: "disconnected"
      });
    }
    var topicsCollection = asteroid.getCollection('topics');
    var topicQuery = topicsCollection.reactiveQuery({_id: _topicId});
    var padLink = config.protocol + "://" + config.domain;

    if(_topicId && !_.isEmpty(topicQuery.result)){
      var topic = topicQuery.result[0];
      if (topic && topic.uniqueNumber){
        var encodeNumberToShortHash = function(uniqueNumber) {
          var ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('');
          var ALPHABET_LENGTH = ALPHABET.length;

          var urlHash;
          if (uniqueNumber === 0) {
            return ALPHABET[uniqueNumber];
          }
          urlHash = "";
          while (uniqueNumber > 0) {
            urlHash += ALPHABET[uniqueNumber % ALPHABET_LENGTH];
            uniqueNumber = parseInt(uniqueNumber / ALPHABET_LENGTH, 10);
          }
          return urlHash.split("").reverse().join("");
        };

        padLink += '/p/' + topic._id.slice(0,2) + encodeNumberToShortHash(topic.uniqueNumber);
      }
    }

    return padLink;
  };

  exports.getGoogleOauthToken = function(){
    return asteroidDDP.call("getGoogleAccessToken", asteroidDDP.userId).result
  };

  exports.loginWithToken = function(token){
    console.info("asteroid.loginWithToken", arguments);
    return asteroidDDP.call("login", {resume: token}).result;
  };


  exports.loginWithPassword = function(usernameOrEmail, password){
    return asteroidDDP.loginWithPassword(usernameOrEmail, password);
  };


  exports.loginSuccess = function(res){
    var tokenName = asteroidDDP._host + "__" + asteroidDDP._instanceId + "__login_token__";
    data = {};
    data[tokenName] = res.token;
    chrome.storage.local.set(data);

    asteroidDDP.userId = res.id;
    asteroidDDP.loggedIn = true;
    asteroidDDP._emit("login", res.id);
  };

  exports.hasLoggedIn = function(){
    return asteroidDDP.loggedIn;
  };


  exports.logout = function(){
    _topicId = null;
    return asteroidDDP.logout();
  };


  exports.subscribe = function(name, args) {
    console.log("subscribe", arguments);
    return asteroidDDP.subscribe.apply(asteroidDDP, arguments);
  };


  exports.getCollection = function (collectionName){
    return asteroidDDP.getCollection(collectionName);
  };


  exports.call = function(method, args){
    return asteroidDDP.call.apply(asteroidDDP, arguments);
  };


  exports.apply = function(method, args){
    return asteroidDDP.apply(method, args)
  };


  exports.updateKnote = function(knoteId, item){
    var knotesCollection = asteroidDDP.getCollection("knotes");
    var htmlBody = item.htmlBody;
    var title = item.title;
    var options = {};
    options.htmlBody = htmlBody;
    var now = Date.now();

    if (title){
      options.title = title;
      options.updated_date = now;
    } else if (item.order){
      options = {order: item.order, updated_date: now};
    }

    if (title || item.order){
      var knoteQuery = knotesCollection.reactiveQuery({_id: knoteId});
      console.log("Background Knotes:update", knoteId, knoteQuery.result, options, Boolean(knoteQuery.result));
      if (_.isEmpty(knoteQuery.result)){
      	var resultDeferred = Q.defer();
        var delayChangeFn = _.once(function(){
          console.log("Asteroid:updateKnote W", knoteId, options);
          knotesCollection.update(knoteId, options).local.then(function(){
            resultDeferred.resolve(knoteId);
          }).fail(function(error){
            resultDeferred.reject(error);
          });
        });
        knoteQuery.on("change", function(kId){
          delayChangeFn();
          knoteQuery.off('change');
        });
        return resultDeferred.promise;
      } else{
        console.log("Asteroid:updateKnote I", knoteId, options);
        return knotesCollection.update(knoteId, options).local;
      }
    } else {
      return null;
    }
  };


  exports.removeKnote = function(knoteId){
    return asteroidDDP.call("markKnoteAsDone", knoteId).result
  };


  // This method is used for debuging. Will be removed soon.
  exports.showData = function(){
    var knotes = asteroid.getCollection('knotes');
    var knotesQuery = knotes.reactiveQuery({})
    //console.log("knotes", knotesQuery.result);

    var userAccount = asteroid.getCollection('user_accounts');
    var userAccountQuery = userAccount.reactiveQuery({})
    console.log("userAccount", userAccountQuery.result);

    var users = asteroid.getCollection('users');
    var userQuery = users.reactiveQuery({})
    console.log("users", userQuery.result);

    var contacts = asteroid.getCollection('contacts');
    var contactQuery = contacts.reactiveQuery({})
    console.log("contacts", contactQuery.result);

    var topics = asteroid.getCollection('topics');
    var topicQuery = topics.reactiveQuery({})
    console.log("topics", topicQuery.result);
  };



  exports.updateList = function(options){
    var knotes = asteroid.getCollection('knotes');
    var updateOption = {};
    switch(options.case){
      case "updateTitle":
        updateOption.title = options.title;
        break;

      case "updateItems":
        updateOption.options = options.options
        break;
      default:
    }
    updateOption.updated_date = Date.now();
    console.log("updateList - ", updateOption);
    knotes.update(options.knoteId, updateOption).local;
  };

  exports.init(config.server);
  return exports;
})();
