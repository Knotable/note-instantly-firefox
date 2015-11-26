var { data } = require('sdk/self');
var tabs = require('sdk/tabs');
var extHelper = require('./ext_helper');
var storageHelper = require('./storage_helper');
var config = require("../package.json");


function Newtabs() {
  var newtabUrl = data.url('newtab.html');
  var newtabWorkers = {};

  return {
    init: function(backgroundWorker, handleFnCall) {
      tabs.on("ready", function(tab) {
        var worker;

        if (tab.url == newtabUrl) {
          extHelper.clearURLBarIfNewtab();

          worker = tab.attach({
            contentScriptFile: extHelper.getNewTabScripts(),
            contentScriptOptions: {
              extName: config.name,
              basePath: data.url('')
            }
          });

          newtabWorkers[tab.id] = worker;

          worker.port.on('msg', function(msg) {
            console.log('=======> msg from newtab to background: ', msg)
            if (msg && msg.args && msg.args.isFnCall) {
              handleFnCall(msg.args);
              return;
            }
            msg.tabId = tab.id;
            // transport the msg to background page
            backgroundWorker.port.emit('msg', msg)
          });

          worker.port.on('response:msg', function(msg) {
            console.log('=======> response msg from newtab to background: ', msg)
            msg.tabId = tab.id;
            // transport the msg to background page
            backgroundWorker.port.emit('response:msg', msg)
          });

          worker.port.on('storage', function(request) {
            console.log('=======> storage request from newtab: ' + JSON.stringify(request));
            if (worker) {
              storageHelper.handleStorageRequest(request, function(response) {
                worker.port.emit('response:storage', response);
              });
            }
          });

          tab.on('activate', function(t) {
            extHelper.clearURLBarIfNewtab();
          });

          tab.on('ready', function(t) {
            if (tab.url == newtabUrl) {
              extHelper.sendTopicId(worker);

              if (!newtabWorkers[tab.id] && worker) {
                newtabWorkers[tab.id] = worker;
              }
            } else {
              delete newtabWorkers[tab.id];
            }
          });

          tab.on('close', function(t) {
            delete newtabWorkers[t.id];
          });
        }
      });
    },
    sendMessage: function(type, msg) {
      var worker;
      if (msg.tabId) {
        worker = newtabWorkers[msg.tabId];
        if (worker) {
          delete msg.tabId;
          worker.port.emit(type, msg);
        }
      } else {
        for (var tabId in newtabWorkers) {
          worker = newtabWorkers[tabId];
          worker.port.emit(type, msg);
        }
      }
    },
    getAllWorkers: function(callback) {
      callback(newtabWorkers);
    }
  };
}

exports.Newtabs = Newtabs;

exports.create = function(options) {
  console.log('========> tabs.create options:', options);
  if (options.url) {
    tabs.open({url: options.url});
  }
};
