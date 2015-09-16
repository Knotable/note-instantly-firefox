'use strict';

(function(window) {
  window.AccountHelper = {
    getAccount: function() {
      return asteroid.getCollection('user_accounts').reactiveQuery({}).result[0];
    },
    // local
    getUser: function() {
      return asteroid.getCollection('users').reactiveQuery({}).result[0];
    },
    getContact: function() {
      return asteroid.getCollection("contacts").reactiveQuery({type: 'me', username: this.getUsername()}).result[0];
    },
    getUsername: function() {
      var user = this.getUser();
      if (user){
        return user.username;
      }
    },
    getEmail: function() {
      var user = this.getUser();
      if (user && user.emails && user.emails[0].address){
        return user.emails[0].address;
      }
    },
    getUserId: function() {
      return this.getUser()._id;
    },
    getAccountId: function() {
      return this.getAccount()._id;
    },
    log: function(){
      console.log("getAccount", this.getAccount());
      console.log("getUser", this.getUser());
      console.log("getContact", this.getContact());
      console.log("getUsername", this.getUsername());
      console.log("getEmail", this.getEmail());
      console.log("getUserId", this.getUserId());
      console.log("getAccountId", this.getAccountId());
    }
  };

})(window);
