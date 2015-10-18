'use strict';
(function() {
  var KnoteClient = function() {
    var callableMethods = [
      'apply',
      'call',
      'logout',
      'loginWithPassword',
      'addKnote',
      "hasLoggedIn",
      "getPadLink",
      'removeKnote',
      'updateKnote',
      'getCollection',
      'getUserInfo'
    ];

    var sendMessage = function(fn, args) {
      var deferred = new $.Deferred();
      var request = {
        method: 'MeteorDdp',
        fn: fn,
        args: args
      };
      chrome.runtime.sendMessage(request, function(resp) {
        console.log('=======> response :', resp);
        resp = resp || {};
        // console.debug('%c%s', 'color: green' ,fn, resp);
        if (resp.error) {
          deferred.reject(resp.error);
        } else {
          deferred.resolve(resp.response);
        }
      });
      return deferred;
    };
    var functions = {};
    callableMethods.forEach(function(methodName) {
      var f = function() {
        var args = [].slice.call(arguments, 0);
        return sendMessage(methodName, args);
      };
      f.prototype.name = methodName;
      functions[methodName] = f;
    });
    return functions;
  };

  window.knoteClient = new KnoteClient();
})();
