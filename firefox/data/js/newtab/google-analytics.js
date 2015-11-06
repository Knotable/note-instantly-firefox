'use strict';

function postAnalyticsData(extraData) {
  knoteClient.getUserInfo().then(function(contact) {
    if(_.isEmpty(contact)) {
      return;
    }

    if (contact._id) {
      var data = {
        v: 1,
        tid: 'UA-46641860-9',
        cid: contact._id
      };
      data = _.extend(data, extraData);

      $.post('http://www.google-analytics.com/collect', data, function(res, status) {
        console.log('>>>>>>>>>>>>> post analytics data <<<<<<<<<<<<<<');
        console.log(data);
        console.log('status: ' + status);
        console.log('response: ' + res);
        console.log('>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<');
      });
    }
  });
}

function postEventData(name, action) {
  postAnalyticsData({
    t: 'event',
    ec: name,
    ea: action
  });
}

(function(window, $) {
  postAnalyticsData({
    t: 'pageview',
    dp: '/newtab'
  });

  window.googleAnalyticsHelper = {
    trackAnalyticsEvent: function(evtTitle, evtDetail){
      postEventData(evtTitle, evtDetail);
    }
  };

})(window, jQuery);
