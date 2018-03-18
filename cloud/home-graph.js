'use strict';

const fetch = require('node-fetch');
const config = require('./config-provider');

const requestSyncEndpoint = 'https://homegraph.googleapis.com/v1/devices:requestSync?key=';

async function requestSync(id) {
  // REQUEST_SYNC
  const options = {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const optBody = {
    'agentUserId': id,
  };
  options.body = JSON.stringify(optBody);

  try {
    const syncUrl = requestSyncEndpoint + config.homeGraphApiKey;
    await fetch(syncUrl, options);
  } catch (e) {
    console.error('POST REQUEST_SYNC: failed', e);
  }
}

exports.requestSync = requestSync;
