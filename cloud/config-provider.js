'use strict';

let option;
try {
  option = require('../config.json');
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }

  option = process.env;
}

var Config = {
  devPort             : '31338',
  clientId            : 'hello',
  clientSecret        : 'dafD8jraghakjnewuac',
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
