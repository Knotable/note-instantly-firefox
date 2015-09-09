'use strict';

// Treat this as the single entry point into the application.

$(document).ready(function(){

  var _BackgroundImage = app.module("backgroundImage");
  new _BackgroundImage.View({
    collection: new _BackgroundImage.Collection()
  });

});
