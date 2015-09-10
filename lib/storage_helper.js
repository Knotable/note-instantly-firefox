var ss = require('sdk/simple-storage');

// TODO
// ss can store array, boolean, number, object, null, and string values.
// Quotas: five megabytes (5,242,880 bytes)
// ss.on('OverQuota', overQuotaHandler);

function handleStorageSet(request, response) {
  var args = request.args;
  for (var key in args) {
    ss.storage[key] = args[key];
  }
  response.result = true;
}

function handleStorageGet(request, response) {
  var keys = request.args,
    result = {};
  if (typeof keys == 'string') {
    keys = [keys];
  }
  for (var i = 0, l = keys.length; i < l; i++) {
    result[keys[i]] = ss.storage[keys[i]];
  }
  response.result = result;
}

function handleStorageRemove(request, response) {
  var keys = request.args;
  if (typeof keys == 'string') {
    keys = [keys];
  }

  try {
    for (var i = 0, l = keys.length; i < l; i++) {
      delete ss.storage[keys[i]];
    }
    response.result = true;
  } catch (e) {
    response.error = e;
  }
}

function handleStorageRequest(request, callback) {
  var response = {
    error: null,
    result: null
  };

  if (request.cbIndex) {
    response.cbIndex = request.cbIndex;
  }

  var data = request.args;
  switch(data.type) {
    case 'set':
      handleStorageSet(data, response);
      break;
    case 'get':
      handleStorageGet(data, response);
      break;
    case 'remove':
      handleStorageRemove(data, response);
      break;
    default:
      response.error = 'Invalid request type';
  }

  if (callback) {
    callback(response);
  }
}

ss.on('OverQuota', function() {
  console.error('!!! over quota !!!');
});

exports.handleStorageRequest = handleStorageRequest;
