var _addKnoteOnView = function(knotesView, newKnote) {
  var knote = knotesView.collection.find(function(model) {
    return (model.get('knoteId') === newKnote._id);
  });

  var knoteBody = '';
  if(!_.isEmpty(newKnote.title)) {
    knoteBody += newKnote.title;
  }

  if (!_.isEmpty(newKnote.htmlBody) || !_.isEmpty(newKnote.body)) {
    knoteBody += "<br class='split-body-br'>" + newKnote.htmlBody || newKnote.body || '';
  }

  var content = knoteBody || 'new';

  if (!knote) {
    knote = new KnoteModel(newKnote);
    knote.set({
      content: content,
      knoteId: newKnote._id,
      collection: knotesView.collection,
      date: newKnote.date,
      lastSync: newKnote.updated_date
    });
    newKnote.content = content;
    DropboxClient.syncKnote(newKnote);
    knotesView.collection.add(knote);
  } else {
    DropboxClient.syncKnote(newKnote);
    //if ((!knotesView.activeKnote || knotesView.activeKnote.get('knoteId') !== newKnote._id) && knote.get('type') != 'checklist'){
    if (knote.get('type') != 'checklist'){
      knote.set({content: content, order: newKnote.order, timestamp: newKnote.timestamp});
    }

    if(knote.get('type') == "checklist" && moment(knote.get('updated_date')).isBefore(newKnote.updated_date, 'second')){
      console.log("#GC - _addKnoteOnView - updating checklist", knote.get('updated_date'),  newKnote.updated_date);
      knote.set({title: newKnote.title, options: newKnote.options, order: newKnote.order, timestamp: newKnote.timestamp, updated_date: newKnote.updated_date});
      // if list is currently on active view,
      // update the view
      if (knotesView.activeKnote && knotesView.activeKnote.get('knoteId') == newKnote._id ){
        $('.list-knote[data-knoteid=' + newKnote._id + ']').click();
      }
    }

    // update the last sync time
    knote.set({lastSync: newKnote.updated_date});
    // if it is active knote update the UI timestamp for last sync
    /*
    if (knotesView.activeKnote && knotesView.activeKnote.get('knoteId') == newKnote._id ){
      $(".last-save").text(moment(newKnote.updated_date).format("Mo MMM, h:m A"));
    }
    */

  }

};

var onNotification = function(knotesView, request, sender, response) {
  var _removeKnoteOnView = function(knoteId){
    var knote = knotesView.collection.find(function(knote) {
      return (knote.get('knoteId') === knoteId);
    });
    knotesView.collection.remove(knote);
  };

  var newKnote = request.knote;
  switch(request.msg){
    case 'addKnote':
      _addKnoteOnView(knotesView, newKnote);
      break;
    case 'updateKnote':
      _addKnoteOnView(knotesView, newKnote);
      break;
    case 'removeKnote':
      _removeKnoteOnView(request.knoteId);
      break;
    default:
      return;
  };
  console.log("knote message: ", request.msg, ', ', request.knoteId || request.knote._id, ', ', request.knote && request.knote.title);
};

var bootstrap = function() {

  KnoteModel = new KnotableModels().models.Knote;
  var knotes = new KnotesCollection();
  var knotesView = new KnotesView(knotes);
  window._knotes = knotes;
  window._knotesView = knotesView;

  knoteClient.getUserInfo().then(function(contact) {
    if (contact){
      new UserAvatarView(new UserAvatarModel(contact));
      _knotesView.contact = contact;
      //localStorage.userName = contact.username;
      knoteClient.userName = contact.username;
    }
  });
  var headerView = new HeaderView().render();

  knotesView.render();
  chrome.runtime.onMessage.addListener(onNotification.bind(this, knotesView));
};


window.config = getConfig(runtime_mode);

window.onbeforeunload = function() {
  if ($('#knote-edit-area').hasClass('hide')) {
    window._knotesView.updateList(true);
    window._knotesView.addNewListItem();
  } else {
    window._knotesView.saveCurrentKnote();
  }
};

$(document).ready(function() {
  new introBoxView().render();
  chrome.storage.local.set({'isIntroSeen': 'true'});

  $("#knote-sync-message").css("visibility", "hidden");

  if(navigator.onLine === true || !offlineMode.isOfflineMode){
    //return;
    offlineMode.syncOfflineKnotes();
    offlineMode.syncCreateKnotes();
  }

  updateHelper.checkNewUpdate();
});
