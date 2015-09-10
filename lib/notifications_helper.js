var notifications = require('sdk/notifications'),
  data = require('sdk/self').data;

function create(options) {
  notifications.notify({
    title: options.title,
    text: options.message,
    iconURL: data.url(options.iconUrl)
  });
}

exports.create = create;
