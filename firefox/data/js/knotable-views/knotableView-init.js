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
      date: newKnote.date
    });
    newKnote.content = content;
    DropboxClient.syncKnote(newKnote);
    knotesView.collection.add(knote);
  } else {
    newKnote.content = content;
    DropboxClient.syncKnote(newKnote);
    knote.set({content: content, order: newKnote.order, timestamp: newKnote.timestamp});
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
