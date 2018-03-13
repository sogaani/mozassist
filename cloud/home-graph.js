'use strict';

const fetch = require('node-fetch');

const requestSyncEndpoint = 'https://homegraph.googleapis.com/v1/devices:requestSync?key=';

var requestSync = function (config) {
  // REQUEST_SYNC
  return new Promise((resolve, reject) => {
    const apiKey = config.api_key;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    let optBody = {
      'agentUserId': config.gateway
    };
    options.body = JSON.stringify(optBody);
    console.log("POST REQUEST_SYNC", apiKey, options.body);

    fetch(requestSyncEndpoint + apiKey, options).
      then(function (res) {
        console.log("request-sync response", res.status, res.statusText);
        resolve();
      }).catch((error) => {
        reject(error)
      });
  });
};

exports.requestSync = requestSync;