'use strict';

const option = require('../config.json');

var Config = {
  devPort        : '31338',
  clientId       : 'hello',
  clientSecret   : 'dafD8jraghakjnewuac',
  homeGraphApiKey: '<API_KEY>',
  isLocal        : false,
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
