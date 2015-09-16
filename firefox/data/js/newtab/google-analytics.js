'use strict';

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-46641860-9']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


(function(window, $) {

  window.googleAnalyticsHelper = {
    trackAnalyticsEvent: function(evtTitle, evtDetail){
      _gaq.push(['_trackEvent', evtTitle, evtDetail]);
    }
  };

})(window, jQuery);