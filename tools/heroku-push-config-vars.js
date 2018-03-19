'use strict';

const config = require('../config.json');
const child_process = require('child_process');

Object.keys(config).forEach(function(key) {
  const args = ['config:set'];

  let value = config[key];

  if (key === 'googleServiceAccount') {
    value = JSON.stringify(value);
  }

  args.push(`${key}=${value}`);
  child_process.spawnSync('heroku', args, {stdio: 'inherit'});
});
