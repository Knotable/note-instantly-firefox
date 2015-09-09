'use strict';

(function(window){
  console.log('%c%s', 'color: #289AE8; font-family: Helvetica;font-size:4em', 'Knotable Logger');

  window.logGroup = function(name, obj) {
    obj = obj || {};
    console.group(name);
    for (var k in obj) {
      console.log('%c%s:\t%c%o', 'color: orange;', k, 'color: #333;', obj[k]);
    }
    console.groupEnd();
  };
})(window);
