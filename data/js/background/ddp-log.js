'use strict';

(function _DDPLogger(window) {
  var asteroidCall = Asteroid.prototype.call;
  window.enabledLog = true;

  function log(o, outgoing) {
    if (!window.enabledLog) return;
    console.log('%c%s %s %s',
    outgoing ? 'color: #CD5555; font-size: 1.1em;' : 'color: #548B54; font-size: 1.1em;',
    outgoing ? '\u25B2' : '\u25BC',
    moment().toISOString(),
    JSON.stringify(o)
  );
}

Asteroid.prototype.call = function () {
  log(arguments, true);
  return asteroidCall.apply(this, arguments);
};

var asteroidApply = Asteroid.prototype.apply;
Asteroid.prototype.apply = function () {
  log(arguments, true);
  return asteroidApply.apply(this, arguments);
};

})(window);
