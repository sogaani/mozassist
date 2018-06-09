'use strict';

const fetch = require('node-fetch');
const config = require('./config-provider');
const {google} = require('googleapis');

const requestSyncEndpoint =
  'https://homegraph.googleapis.com/v1/devices:requestSync?key=';
const reportStateEndpoint =
  'https://homegraph.googleapis.com/v1/devices:reportStateAndNotification';

const DEBUG = true;

async function requestSync(id) {
  // REQUEST_SYNC
  const options = {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const optBody = {
    agentUserId: id,
  };
  options.body = JSON.stringify(optBody);

  try {
    const syncUrl = requestSyncEndpoint + config.smartHomeProviderApiKey;
    await fetch(syncUrl, options);
  } catch (e) {
    console.error('POST REQUEST_SYNC: failed', e);
  }
}

async function reportState(id, requestId, states) {
  const jwtClient = new google.auth.JWT(
    config.homeGraphServiceAccount.client_email,
    null,
    config.homeGraphServiceAccount.private_key,
    ['https://www.googleapis.com/auth/homegraph'],
    null
  );

  let isDisconnected = false;

  try {
    const tokens = await jwtClient.authorize();
    const options = {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': ` Bearer ${tokens.access_token}`,
      },
    };
    const optBody = {
      requestId  : requestId,
      agentUserId: id,
      payload    : {
        devices: {
          states: states,
        },
      },
    };
    options.body = JSON.stringify(optBody);

    if (DEBUG) {
      console.log(`POST REPORT_STATE: body:${options.body}`);
    }

    const response = await fetch(reportStateEndpoint, options);

    const body = await response.json();

    if (body && body.error && body.error.message === 'Requested entity was not found.') {
      isDisconnected = true;
    }

    if (DEBUG) {
      console.log(`POST REPORT_STATE: response:${body} status:${response.status}`);
    }
  } catch (e) {
    console.error('POST REPORT_STATE: failed', e);
  }

  return {isDisconnected};
}

exports.requestSync = requestSync;
exports.reportState = reportState;
