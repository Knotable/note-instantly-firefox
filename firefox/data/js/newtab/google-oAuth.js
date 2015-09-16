'use strict';

window.GoogleOauthHelper = (function(){
  var exports = {};
  var _clientId = '825290203046-omj0vpqneirc8tcap02rnkgkfd1tkul5.apps.googleusercontent.com';
  var _apiKey = 'AIzaSyC1v-nhSh8PJZp9X4443nQqjX03b23QYFw';
  var _scopes = 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify https://www.google.com/m8/feeds/';


  var _handleAuthResult = function(){
  };

  var _checkAuth = function() {
    gapi.auth.authorize({client_id: GoogleOauthHelper.getClientId(), scope: GoogleOauthHelper.getScopes(), immediate: true}, _handleAuthResult);
  };


  exports.getClientId = function(){
    return _clientId;
  };


  exports.getScopes = function(){
    return _scopes;
  };


  exports.handleClientLoad = function() {
    gapi.client.setApiKey(_apiKey);
    window.setTimeout(_checkAuth,1);
  };

  return exports;
})();
