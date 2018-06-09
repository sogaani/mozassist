'use strict';

let option;
try {
  option = require('../config.staging.json');
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }

  option = Object.assign({}, process.env);
  if (option.googleServiceAccount) {
    option.googleServiceAccount = JSON.parse(option.googleServiceAccount);
  }
}

var Config = {
  devPort             : process.env.PORT || '31338',
  clientId            : 'hello',
  clientSecret        : 'dafD8jraghakjnewuac',
  redirectUrl         : 'https://oauth-redirect.googleusercontent.com/r/YOUR_PROJECT_ID',
  homeGraphApiKey     : '<API_KEY>',
  isLocal             : false,
  googleServiceAccount: {},
};

Config = Object.assign(Config, option);

function init() {
  process.argv.forEach(function(value) {
    if (value.includes('isLocal'))
      Config.isLocal = true;
  });
  console.log('config: ', Config);
}

init();

module.exports = Config;
