'use strict';

const fetch = require('node-fetch');
const https = require('https');
const util = require('util');

const keepAliveAgent = new https.Agent({
  keepAlive     : false,
  keepAliveMsecs: 1500,
  maxSockets    : 70,
});

const thingsOptions = {
  method : 'GET',
  agent  : keepAliveAgent,
  headers: {
    'Connection'   : 'keep-alive',
    'Authorization': '',
    'Accept'       : 'application/json',
  },
};

const iotOptions = {
  method : 'PUT',
  agent  : keepAliveAgent,
  headers: {
    'Connection'   : 'keep-alive',
    'Authorization': '',
    'Accept'       : 'application/json',
    'Content-Type' : 'application/json',
  },
  timeout: 10000,
  body   : '',
};

const timeoutOptions = {
  method : 'PUT',
  agent  : keepAliveAgent,
  headers: {
    'Connection'   : 'keep-alive',
    'Authorization': '',
    'Accept'       : 'application/json',
    'Content-Type' : 'application/json',
  },
  timeout: 10000,
  body   : '',
};

class Gateway {
  constructor(url, token) {
    this.url = url;
    this.token = token;
  }

  async getThing(id) {
    thingsOptions.headers.Authorization = 'Bearer ' + this.token;

    const thingUrl = util.format('%s/things/%s', this.url, id);
    try {
      const res = await fetch(thingUrl, thingsOptions);

      const json = await res.json();

      return json;
    } catch (err) {
      console.log(err);
      throw new Error(`getThing failed url:${thingUrl}`);
    }
  }

  async getThings(deviceList) {
    thingsOptions.headers.Authorization = 'Bearer ' + this.token;

    const thingsUrl = util.format('%s/things', this.url);
    try {
      const res = await fetch(thingsUrl, thingsOptions);

      const json = await res.json();

      let things = [];
      if (deviceList) {
        for (let i = 0; i < json.length; i++) {
          const thing = json[i];
          const thingId = this.getThingId(thing);
          if (deviceList.includes(thingId)) {
            things.push(thing);
          }
        }
      } else {
        things = json;
      }

      return things;
    } catch (err) {
      console.log(err);
      throw new Error(`getThings failed url:${thingsUrl}`);
    }
  }

  async checkThingOnline(thing, property, current) {
    if (!thing || !thing.properties || !thing.properties[property]) {
      throw new Error('thing dose not have property: ' + property);
    }

    timeoutOptions.headers.Authorization = 'Bearer ' + this.token;

    const body = {};
    body[property] = current;

    timeoutOptions.body = JSON.stringify(body);

    const propertyUrl = util.format('%s%s', this.url, thing.properties[property].href);

    try {
      const res = await fetch(propertyUrl, timeoutOptions);

      const json = await res.json();

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getThingState(thing, property) {
    if (!thing || !thing.properties || !thing.properties[property]) {
      throw new Error('thing dose not have property: ' + property);
    }

    thingsOptions.headers.Authorization = 'Bearer ' + this.token;

    const propertyUrl = util.format('%s%s', this.url, thing.properties[property].href);

    try {
      const res = await fetch(propertyUrl, thingsOptions);

      const json = await res.json();

      return json[property];
    } catch (err) {
      console.log(err);
      throw new Error(`getThingState failed url:${propertyUrl}`);
    }
  }

  async setThingState(thing, property, state) {
    if (!thing || !thing.properties || !thing.properties[property]) {
      throw new Error('thing dose not have property: ' + property);
    }

    iotOptions.headers.Authorization = 'Bearer ' + this.token;

    const body = {};
    body[property] = state;

    iotOptions.body = JSON.stringify(body);

    const propertyUrl = util.format('%s%s', this.url, thing.properties[property].href);

    try {
      const res = await fetch(propertyUrl, iotOptions);

      const json = await res.json();

      return json[property];
    } catch (err) {
      console.log(err);
      throw new Error(`setThingState failed url:${propertyUrl}`);
    }
  }

  getThingId(thing) {
    const href = thing.href;
    return href.slice(href.lastIndexOf('/') + 1);
  }
}

module.exports = Gateway;
