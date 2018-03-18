'use strict';

const util = require('util');
const fetch = require('node-fetch');
//const oauthClients = require('../../src/models/oauthclients');
const config = require('./config-provider');
const datastore = require('./datastore');

datastore.open();

var Auth = {};
var GatewayModel = {};

const DEBUG = true;

GatewayModel.gatewayToId = function (gateway) {
  return new Buffer(gateway).toString('base64');
}

Auth.getAccessToken = function (request) {
  return request.headers.authorization ? request.headers.authorization.split(' ')[1] : null;
};

Auth.registerAuth = function (app) {

  // 1. Assistant App try to be authorized.
  app.get('/oauth', function (req, res) {
    let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;
    let response_type = req.query.response_type;
    let scope = req.query.scope;

    if ('code' != response_type)
      return res.status(500).send('response_type ' + response_type + ' must equal "code"');

    if (client_id !== config.clientId) {
      console.error('incorrect client data');
      return res.status(400).send('incorrect client data');
    }

    let url = util.format('/gateway?redirect_uri=%s&response_type=%s&state=%s&scope=%s',
      encodeURIComponent(redirect_uri), response_type, state, scope);

    // 2. User inputs Mozilla Gateway infomation.
    return res.redirect(url);
  });

  // 3. Redirect to Mozilla Gateway to delegate authentication.
  app.get('/gateway/oauth', async function (req, res) {
    let domain = req.query.domain;
    let client_id = req.query.client_id;
    let client_secret = req.query.client_secret;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;
    let response_type = req.query.response_type;
    let scope = req.query.scope;

    if ('code' != response_type)
      return res.status(500).send('response_type ' + response_type + ' must equal "code"');

    const client = {
      gateway: `https://${domain}.mozilla-iot.org`,
      client_id: client_id,
      client_secret: client_secret,
      redirect_uri: redirect_uri
    };

    await datastore.registerGatewayWithState(state, client);

    let gatewayUrl = util.format('%s/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=%s&state=%s&scope=%s',
      client.gateway, client.client_id, encodeURIComponent(`https://${req.hostname}/allow`), response_type, state, scope
    );

    return res.redirect(gatewayUrl);
  });

  // 4. If allow, Mozilla Gateway redirect here with code and state.
  app.get('/allow', async function (req, res) {
    let code = req.query.code;
    let state = req.query.state;

    if (!code || !state)
      return res.status(400).send('authorization failed');

    const client = await datastore.getGatewayByState(state);

    if (!client || !client.client_id || !client.client_secret || !client.redirect_uri) {
      console.error('have not connect gateway');
      return res.status(400).send('have not connect gateway');
    }

    await datastore.registerGatewayWithState(code, client);

    let gatewayUrl = util.format('%s?state=%s&code=%s',
      client.redirect_uri, state, code
    );

    return res.redirect(gatewayUrl);
  });

  app.all('/token', async function (req, res) {
    DEBUG && console.log('/token query', req.query);
    DEBUG && console.log('/token body', req.body);
    let code = req.query.code ? req.query.code : req.body.code;
    let client_id = req.query.client_id ? req.query.client_id : req.body.client_id;
    let client_secret = req.query.client_secret ? req.query.client_secret : req.body.client_secret;
    let redirect_uri = req.query.redirect_uri ? req.query.redirect_uri : req.body.redirect_uri;
    let grant_type = req.query.grant_type ? req.query.grant_type : req.body.grant_type;
    let state = req.query.state ? req.query.state : req.body.state;

    if (!client_id || !client_secret) {
      console.error('missing required parameter');
      return res.status(400).send('missing required parameter');
    }

    if (client_id !== config.clientId || client_secret !== config.clientSecret) {
      console.error('incorrect client data');
      return res.status(400).send('incorrect client data');
    }

    const client = await datastore.getGatewayByState(code);
    var userPassB64 = new Buffer(`${client.client_id}:${client.client_secret}`).toString('base64');

    if (!client || !client.client_id || !client.client_secret) {
      console.error('have not connect gateway');
      return res.status(400).send('have not connect gateway');
    }

    if ('authorization_code' == grant_type) {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'authorization': 'Basic ' + userPassB64,
        },
        body: `code=${code}&` +
          `client_id=${client.client_id}&` +
          `client_secret=${client.client_secret}&` +
          `redirect_uri=${encodeURIComponent(`https://${req.hostname}/allow`)}&` +
          `grant_type=${grant_type}`
      };

      fetch(util.format('%s/oauth/token', client.gateway), options)
        .then(function (_res) {
          return _res.json();
        })
        .then(async (json) => {
          console.log(json);
          if (json.error) {
            return res.status(400).json(json);
          } else {
            const token = json.access_token;
            client.token = token;
            await datastore.registerGatewayWithToken(token, client);
            return res.json(json);
          }
        }).
        catch(err => {
          console.log(err);
          return res.status(400).json(err);
        });

    } else {
      console.error('grant_type ' + grant_type + ' is not supported');
      return res.status(400).send('grant_type ' + grant_type + ' is not supported');
    }
  });
};

exports.registerAuth = Auth.registerAuth;
exports.getAccessToken = Auth.getAccessToken;
exports.gatewayToId = GatewayModel.gatewayToId;
