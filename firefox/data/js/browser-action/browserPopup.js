window.pageFrame = 'panel';

var browserActionPopup = (function ($) {
  // ... all vars and functions are in this scope only
  // still maintains access to all globals
  window.currentKnote = null;
  window.inProcess = false;

  var initPopup = function(){
    chrome.storage.local.get(['currentKnoteID', 'currentKnoteText'], function(items) {
      console.log('=====> initPopup: ', items);
      var currentKnoteID = items['currentKnoteID'];
      var currentKnoteText = items['currentKnoteText'];

      if(currentKnoteID){
        window.currentKnote = currentKnoteID;
      }

      if(currentKnoteText){
        $("#knote-textarea").val(currentKnoteText);
      }

      if(currentKnoteID && currentKnoteText){
        //update knote
        console.log("knote hard updated")
        var options = getUpdateOptions();

        knoteClient.updateKnote(window.currentKnote, options)
        .then(function(){
          console.log("Update knote", window.currentKnote, " Success!");
        })
        .fail(function(){
          console.error("Update knote", window.currentKnote, " FAILED!");
        })
      }
    });
  };

  var setCurrentKnoteDetails = function(id, text){
    chrome.storage.local.set({
      'currentKnoteID': id,
      'currentKnoteText': text
    });
  };

  var getBody = function(){
    var knoteText = $("#knote-textarea").val().trim();
    var contentArray = _.compact(knoteText.split('\n'));

    var title = contentArray[0];
    var body = knoteText.slice(title.length).trim();
    console.debug(body)
    return body;
  };

  var showLoading = function(){
    $("#knotable-popup").attr("disabled", true)
    $("#knotable-popup").text("saving...")
  };

  var hideLoading = function(){
    $("#knotable-popup").attr("disabled", false)
    $("#knotable-popup").text("Add knote")
  };

  var addNewKnote = function(){
    $("#btn-add-knote").click(function(){
      window.currentKnote = null;
      $("#knote-textarea").val("");
      $("#knote-textarea").focus();
      window.inProcess = false;
      chrome.storage.local.remove(['currentKnoteID', 'currentKnoteText']);
    });
  };

  var getUpdateOptions = function(){

    var data = {};
    var content = $("#knote-textarea").val().trim();

    var contentArray = _.compact(content.split('\n'));
    var body, title;
    if (contentArray.length  > 1){
      title = contentArray[0];
      body = content.slice(title.length).trim();
    } else {
      title = content;
      body = '';
    }
    data.title = title;
    data.htmlBody = body;
    return data;
  };

  var updateKnote = function(){
    $('#knote-textarea').keyup(_.throttle(function() {
      if(window.currentKnote === null){
        //create a new knote and make it current
        if(window.inProcess){
          return;
        }
        chrome.storage.local.get('topicId', function(items) {
          var topicId = items['topicId'];
          console.log('========> [Panel] topicId: ', topicId);
          var data = {
            "subject":"",
            "body":"",
            "htmlBody": $("#knote-textarea").val().trim(),
            "topic_id": topicId
          };
          showLoading();
          window.inProcess = true;
          knoteClient.addKnote(data).then(function(knoteID){
            window.currentKnote = knoteID;
            setCurrentKnoteDetails(knoteID, data.htmlBody)
            window.inProcess = false;
            hideLoading();
          }).fail(function(){
            hideLoading();
          });
        });
      } else {
        //update the current knote
        var options = getUpdateOptions();
        var knoteText = $("#knote-textarea").val().trim();

        setCurrentKnoteDetails(window.currentKnote, knoteText)

        knoteClient.updateKnote(window.currentKnote, options)
        .then(function(){
          console.log("Update knote", window.currentKnote, " Success!");
        })
        .fail(function(){
          console.error("Update knote", window.currentKnote, " FAILED!");
        })
      }
    }, 1500));
  };

  var openNewTab = function(){
    $("#btn-open-tab").click(function(){
      chrome.tabs.create({ url: chrome.extension.getURL('newtab.html') });
    });
  };

  var init = function(){
    //addKnote();
    initPopup();
    addNewKnote();
    updateKnote();
    openNewTab();
  };

  return{
    init: init
  };
}(jQuery));

$(document).ready(function () {
  console.log('===========> browserActionPopup.init');
  browserActionPopup.init();
});
