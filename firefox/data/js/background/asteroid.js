'use strict';

window.asteroid = (function(){
  var exports = {};
  var asteroidDDP;
  var _topicId = null;

  exports.userId = null;
  exports.loggedIn = null;

  exports.init = function(host){
    //localStorage.clear()
    console.log("asteroid.init", arguments);

    asteroidDDP = new Asteroid(host);
    window.asteroidDDP = asteroidDDP;

    var onLogin = function(){
      console.log("user login");
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

      updateIcon(iconStates.loggedIn);

      asteroidDDP.subscribe('userPrivateData')
        .ready
        .then(function() {
          return exports.call('getNewTabTopicId', {
            subject: AccountHelper.getUsername() + '\'s' + ' Knotes from Firefox',
            participator_account_ids: [AccountHelper.getAccountId()],
            permissions: ["read", "write", "upload"]
          }).result
          .then(function(topicId) {
            _topicId = topicId;
            console.log("subscribe topic", topicId);
            chrome.storage.local.set({'topicId': topicId});
            Subscriptions.subscribeTopic(topicId);
          });
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
      chrome.runtime.sendMessage({
        msg: 'logout'
      }, $.noop);
    };
    /**
    * login success callback
    */
    asteroidDDP.on("login", onLogin);

    asteroidDDP.on("connected", function(){
      console.info("Asteroid connected!");
      MessageManager.connected();
    });

    asteroidDDP.on("reconnected", function(){
      console.info("Asteroid reconnected!");
      MessageManager.connected();
    });

    asteroidDDP.on("logout", onLogout);

    asteroidDDP.ddp.on("socket_error", function(){
      console.error("socket_error");
      MessageManager.disconnected();
    });

    asteroidDDP.ddp.on("socket_close", function(){
      console.error("socket_close");
      MessageManager.disconnected();
    });

  };


  exports.createAccount = function(options) {
    return asteroid.createUser(options);
  };


  exports.getTopicId = function(){
    if (_topicId){
      Subscriptions.subscribeTopic(_topicId);
    }
    return _topicId;
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
    console.log("subscribe", name, args);
    return asteroidDDP.subscribe(name, args);
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
    var knotes = asteroidDDP.getCollection("knotes")
    var htmlBody = item.htmlBody;
    var title = item.title;
    var options = {};
    options.htmlBody = htmlBody;
    var now = Date.now()

    if (title){
      options.title = title;
      options.updated_date = now;
      return knotes.update(knoteId, options)
      .remote
    } else if (item.order){
      return knotes.update(knoteId, {order: item.order, updated_date: now}).remote;
    } else
    {
      return null;
    }
  };


  exports.removeKnote = function(knoteId){
    // Server don't allow delete knote with content.
    // So remove content of knote and then remove knote.
    var deferred = new $.Deferred();
    var knotes = asteroidDDP.getCollection("knotes");
    knotes.update(knoteId, {htmlBody: '', file_ids: []})
    .remote
    .then(function(){
      knotes.remove(knoteId)
      .remote
      .then(function(){
        deferred.resolve(knoteId);
      })
      .fail(function(){
        deferred.reject(error);
      });
    })
    .fail(function(error){
      deferred.reject(error);
    })
    return deferred.promise()
  };


  // This method is used for debuging. Will be removed soon.
  exports.showData = function(){
    var knotes = asteroid.getCollection('knotes');
    var knotesQuery = knotes.reactiveQuery({})
    console.log("knotes", knotesQuery.result);

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


  return exports;
})();
