var { data } = require('sdk/self'),
  { ToggleButton } = require('sdk/ui/button/toggle'),
  { Panel } = require('sdk/panel'),
  { PageMod } = require("sdk/page-mod"),
  { Page } = require("sdk/page-worker"),
  config = require("./package.json"),
  storageHelper = require('./lib/storage_helper'),
  extHelper = require('./lib/ext_helper'),
  tabs = require("sdk/tabs"),
  tabsHelper = require('./lib/tabs_helper'),
  notificationsHelper = require('./lib/notifications_helper');

var backgroundWorker, panelWorker;
var newtabs = tabsHelper.Newtabs();

initToggleButton();

initBackground();

newtabs.init(backgroundWorker, handleFnCall);

exports.onUnload = extHelper.onUnload;

// It is loaded when it is installed, when it is enabled, or when Firefox starts
exports.main = extHelper.main;

//attachContentScript();

function initToggleButton() {
  var button, panel;

  button = ToggleButton({
    id: 'Knotable',
    label: 'Note Instantly',
    icon: {
      "128": "./images/icon-128.png",
      "16": "./images/icon-16.png",
      "48": "./images/icon-48.png"
    },
    onChange: handleToggleButtonChange
  });

  panelWorker = Panel({
    contentURL: data.url('./views/browseraction-popup.html'),
    width: 280,
    height: 444,
    contentScriptFile: extHelper.getPanelScripts(),
    contentScriptOptions: {
      extName: config.name,
      basePath: data.url('')
    },
    onHide: handlePanelHide
  });

  panelWorker.port.on('msg', function(msg) {
    console.log('=======> msg from panel to background: ', msg)
    if (msg && msg.args && msg.args.isFnCall) {
      handleFnCall(msg.args);
      return;
    }
    // transport the msg to background page
    msg.fromFrame = 'panel';
    backgroundWorker.port.emit('msg', msg)
  });
  panelWorker.port.on('response:msg', function(msg) {
    console.log('=======> response msg from panel to background: ', msg)
    // transport the msg to background page
    msg.fromFrame = 'panel';
    backgroundWorker.port.emit('response:msg', msg)
  });
  panelWorker.port.on('storage', function(request) {
    console.log('=======> storage request from panel: ' + JSON.stringify(request));
    if (panelWorker) {
      storageHelper.handleStorageRequest(request, function(response) {
        panelWorker.port.emit('response:storage', response);
      });
    }
  });

  function handlePanelHide() {
    button.state('window', {checked: false});
  }

  function handleToggleButtonChange(state) {
    panelWorker.show({
      position: button
    });
  }
}

function sendBackgroundMsg(type, msg) {
  msg.sender = {id: config.name};
  if (msg.fromFrame == 'panel') {
    if (panelWorker) {
      panelWorker.port.emit(type, msg);
    }
  } else {
    newtabs.sendMessage(type, msg);
  }
}

function handleFnCall(msg) {
  switch(msg.type) {
    case 'tabs:create':
      tabsHelper.create(msg.options);
      break;
    case 'notifications:create':
      notificationsHelper.create(msg.options);
      break;
    case 'logout':
      extHelper.clearCache();
      extHelper.reloadPanel(panelWorker);
      break;
    case 'login':
      extHelper.reloadPanel(panelWorker);
      newtabs.getAllWorkers(function(workersObject) {
        for (var index in workersObject) {
          extHelper.sendTopicId(workersObject[index]);
        }
      });
      break;
  };
}

function initBackground() {
  scripts = config.background.scripts;
  for(var i = 0,l = scripts.length; i < l; i++) {
    scripts[i] = data.url(scripts[i]);
  }

  backgroundWorker = Page({
    contentScriptFile: scripts,
    contentScriptOptions: {
      extName: config.name,
      basePath: data.url('')
    }
  });

  backgroundWorker.port.on('loaded', function() {
    console.log('=======> PageWorker loaded.');
  });

  backgroundWorker.port.on('msg', function(msg) {
    //console.log('=======> msg from background to ' + (msg.fromFrame == 'panel' ? 'panel' : 'newtab') + ': ', msg);
    if (msg && msg.args && msg.args.isFnCall) {
      handleFnCall(msg.args);
      return;
    }
    sendBackgroundMsg('msg', msg);
  });

  backgroundWorker.port.on('response:msg', function(msg) {
    //console.log('=======> response msg from background to ' + (msg.fromFrame == 'panel' ? 'panel' : 'newtab') + ': ', msg);
    sendBackgroundMsg('response:msg', msg);
  });

  backgroundWorker.port.on('storage', function(request) {
    //console.log('=======> storage request from background: ' + JSON.stringify(request));
    if (backgroundWorker) {
      storageHelper.handleStorageRequest(request, function(response) {
        backgroundWorker.port.emit('response:storage', response);
      });
    }
  });
}

function attachContentScript() {
  //pageMod(data.url('./js/chrome-adapter/attach-chrome.js'), 'start');
  pageMod(data.url('./js/content-scripts/knotable-web-app.js'), 'end');
}

function pageMod(scriptUrls, when) {
  console.log('[PageMod] contentScriptFile: ', scriptUrls);
  var mod = PageMod({
    include: config.content_scripts.matches,
    contentScriptFile: scriptUrls,
    contentScriptWhen: when,
    onAttach: function(worker) {
      console.log('=======> [PageMod]Attach success');
      worker.on('msg', function(msg) {
        console.log('=======> [PageMod]Receive message:', msg);
      });
    }
  });
  /*
  var newtabUrl = data.url('newtab.html');
  console.log('=======> newtab url: ', newtabUrl);
  mod.include.add(newtabUrl);
  */
}
