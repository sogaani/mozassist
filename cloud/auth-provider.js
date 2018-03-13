'use strict';

const util = require('util');
const fetch = require('node-fetch');
//const oauthClients = require('../../src/models/oauthclients');
const config = require('./config-provider');

var datastore = {};
var Auth = {};
var GatewayModel = {};

const DEBUG = true;

GatewayModel.registerClient = function (key, client) {
  datastore[key] = client;
}

GatewayModel.gatewayToId = function (gateway) {
  return new Buffer(gateway).toString('base64');
}

GatewayModel.getClient = function (key) {
  return datastore[key];
}

const client = {
  gateway: config.gatewayAddress
}

GatewayModel.registerClient(config.gatewayClientId, client);


Auth.getAccessToken = function (request) {
  return request.headers.authorization ? request.headers.authorization.split(' ')[1] : null;
};

Auth.registerAuth = function (app) {
  app.get('/oauth', function (req, res) {
    let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;
    let response_type = req.query.response_type;
    let scope = req.query.scope;

    if ('code' != response_type)
      return res.status(500).send('response_type ' + response_type + ' must equal "code"');

    const client = GatewayModel.getClient(client_id);
    // if you have an authcode use that
    if (client && client.gateway) {

      let gatewayUrl = util.format('%s/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=%s&state=%s&scope=%s',
        client.gateway, client_id, encodeURIComponent(redirect_uri), response_type, state, scope
      );

      /*
      if (config.isLocal) {
        gatewayUrl = util.format('/trans_to_chinachu/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=%s&state=%s&scope=%s',
          client_id, encodeURIComponent(redirect_uri), response_type, state, scope
        );
      }
      */

      return res.redirect(gatewayUrl);
    }

    res.status(400).send('invaild client_id');
    /*
    res.render('settings', {
      client_id: client_id,
      redirect_uri: redirect_uri,
      state: state,
      response_type: response_type,
      scope: scope
    });
    */
  });

  /*
  app.post('/register', function (req, res) {
    let redirect_uri = req.body.redirect_uri;
    let client_id = req.body.client_id;
    let name = req.body.name;
    let client_secret = req.body.client_secret;
    let scope = req.body.scope;
    let gateway = req.body.gateway;

    if (!redirect_uri || !client_id || !name || !client_secret || !scope) {
      return res.status(400).send('missing required parameter');
    }

    const clientRegistry = {
      redirect_uri: redirect_uri,
      id: client_id,
      name: name,
      secret: client_secret,
      scope: 'readwrite'
    }

    const client = new AddonClient(gateway);

    GatewayModel.registerClient(client_id, client);
    oauthClients.register(clientRegistry);

    return res.json(clientRegistry);
  });
*/

  app.all('/token', function (req, res) {
    if (DEBUG) console.log('/token query', req.query);
    if (DEBUG) console.log('/token body', req.body);
    let code = req.query.code ? req.query.code : req.body.code;
    let client_id = req.query.client_id ? req.query.client_id : req.body.client_id;
    let client_secret = req.query.client_secret ? req.query.client_secret : req.body.client_secret;
    let redirect_uri = req.query.redirect_uri ? req.query.redirect_uri : req.body.redirect_uri;
    let grant_type = req.query.grant_type ? req.query.grant_type : req.body.grant_type;

    if (!client_id || !client_secret) {
      console.error('missing required parameter');
      return res.status(400).send('missing required parameter');
    }

    const client = GatewayModel.getClient(client_id);
    var userPassB64 = new Buffer(`${client_id}:${client_secret}`).toString('base64');

    if ('authorization_code' == grant_type) {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'authorization': 'Basic ' + userPassB64,
        },
        body: `code=${code}&` +
          `client_id=${client_id}&` +
          `client_secret=${client_secret}&` +
          `redirect_uri=${decodeURIComponent(redirect_uri)}&` +
          `grant_type=${grant_type}`
      };

      fetch(util.format('%s/oauth/token', client.gateway), options)
        .then(function (_res) {
          return _res.json();
        })
        .then(json => {
          console.log(json);
          if (json.error) {
            return res.status(400).json(json);
          } else {
            const token = json.access_token;
            client.token = token;
            GatewayModel.registerClient(token, client);
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
exports.getClient = GatewayModel.getClient;
exports.gatewayToId = GatewayModel.gatewayToId;
