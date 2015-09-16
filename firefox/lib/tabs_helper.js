var tabs = require('sdk/tabs');

exports.create = function(options) {
  console.log('========> tabs.create options:', options);
  if (options.url) {
    tabs.open({url: options.url});
  }
};
