'use strict';

function Knotable() {
  var _events = _.extend({}, Backbone.Events);
  var views = new KnotableViews(_events);
  views.loadTemplates();

    //endregion
  // TODO this method should be in head/avatar view
  var setUserInfoLocal = function(){
    console.log("setUserInfoLocal called")

    chrome.storage.local.get(['username', 'fullname', 'avatar'], function(items) {
      //_setUserAvatar();  // update the details if necessary
      var username = items["username"];
      var fullname = items["fullname"];
      var avatar =   items["avatar"];

      if(username !== null){
        $('#user-avatar-username').text("@" + username);
      }

      if(fullname !== null){
        $('#user-avatar-displayname').text(fullname)
      }

      if(avatar !== null && avatar === "false"){
        $('#userAvatar').addClass('knotable-user-avatar');
        var text = username[0].toUpperCase();
        $('#userAvatar').html(text);
      }


      if(avatar !== null && avatar !== "false"){

        var imgHtml = "<img style='width: 50px; height: 50px; border-radius: 50%;' src='" + avatar + "' />";
        $('#userAvatar').html(imgHtml);

        $('#userAvatar img').error( function() {
          $('#userAvatar').addClass('knotable-user-avatar');
          var text = username[0].toUpperCase();
          $('#userAvatar').html(text);
        });
      }
      if(_.isEmpty(username) ||  _.isEmpty(fullname)){
        _setUserAvatar();

        knoteClient.getUserInfo().then(function(contact) {

          if(_.isEmpty(contact))
          return;

          //contact = _.pairs(contact)[0][1];

          var gravatar = contact.avatar;
          var username = contact.username;
          if (gravatar && !!gravatar.path) {

            chrome.storage.local.set({"avatar": gravatar.path});
            var imgHtml = "<img style='width: 50px; height: 50px; border-radius: 50%;' src='" + gravatar.path + "' />";
            $('#userAvatar').html(imgHtml);

            $('#userAvatar img').error( function() {
              $('#userAvatar').addClass('knotable-user-avatar');
              var text = username[0].toUpperCase();
              $('#userAvatar').html(text);
            });

          } else {
            chrome.storage.local.set({"avatar": "false"});
          }
          /* update local storage variables */
          chrome.storage.local.set({"username": username});
          chrome.storage.local.set({"fullname": contact.fullname});

          $('#user-avatar-username').text("@" + username);
          $('#user-avatar-displayname').text(contact.fullname)

          /* done updating */
          //$('#avatar-wrapper').attr('href', link);
        });
      }
    });
  };
  var _setUserAvatar = function(link) {
    knoteClient.getUserInfo().then(function(contact) {
      console.log('========> getUserInfo: ', contact);

      if(_.isEmpty(contact))
      return;

      document.title = "Knotes";
      var gravatar = contact.avatar;
      var username = contact.username;
      var gravatarPath;
      if (gravatar && !!gravatar.path) {
        gravatarPath = gravatar.path;
      } else {
        gravatarPath = 'false';
      }
      /* update local storage variables */
      chrome.storage.local.set({
        "username": username,
        "fullname": contact.fullname,
        "avatar": gravatarPath
      }, function() {
        setUserInfoLocal();
      });
      /* done updating */
    });
  };

  $(document).ready(function() {
    console.log('$document is ready');
    window.setTimeout(setUserInfoLocal, 3000);
  });

  return {
    createNotification: views.createNotification,
    getView: views.getView,
  };
};

window.knotable = new Knotable();
