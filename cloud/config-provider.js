'use strict';

var Config = {};

Config.devPortSmartHome = '31338';
Config.clientId = 'hello'; // client id that Google will use
Config.clientSecret = 'dafD8jraghakjnewuac'; // client secret that Google will use
Config.smartHomeProviderApiKey = '<API_KEY>'; // client API Key generated on the console
Config.isLocal = false;

const option = require('../config.json');

Config = Object.assign(Config, option);

function init() {
  process.argv.forEach(function (value, i, arr) {
    if (value.includes('smart-home='))
      Config.smartHomeProviderCloudEndpoint = value.split('=')[1];
    else if (value.includes('isLocal'))
      Config.isLocal = true;
  });
  if (!Config.smartHomeProviderCloudEndpoint)
    Config.smartHomeProviderCloudEndpoint = 'http://localhost:31338';
  console.log('config: ', Config);
}
init();

exports.devPortSmartHome = Config.devPortSmartHome;
exports.smartHomeProviderCloudEndpoint = Config.smartHomeProviderCloudEndpoint;
exports.smartHomeProviderApiKey = Config.smartHomeProviderApiKey;
exports.clientId = Config.clientId;
exports.clientSecret = Config.clientSecret;
exports.isLocal = Config.isLocal;
exports.googleServiceAccount = Config.googleServiceAccount;