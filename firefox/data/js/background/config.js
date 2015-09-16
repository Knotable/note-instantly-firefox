'use strict';
// Mode
var runtime_mode = "production";

// Per-mode
var env_domain_dev = "dev.knotable.com";
var protocol_dev = "http";

var env_server_prod = "chrome.lb.beta.knotable.com";
var env_domain_prod = "beta.knotable.com";

var env_server_staging = "c1.staging.knotable.com";
var env_domain_staging = "staging.knotable.com";
var protocol_prod = "http";

var getConfig = function(mode) {
  switch (mode) {
    case "dev":
    return {
      'domain': env_domain_dev,
      'protocol': protocol_dev,
      'server': env_domain_dev
    };

    case "staging":
    return {
      'domain': env_domain_staging,
      'protocol': protocol_prod,
      "server": env_server_staging
    };
    case "production":
    return {
      'domain': env_domain_prod,
      'protocol': protocol_prod,
      'server': env_server_prod
    };
    case "webstore":
    return {
      'domain': env_domain_prod,
      'protocol': protocol_prod,
      'server': env_server_prod

    };
    default:
    console.error("Set config mode!");
  }
};
