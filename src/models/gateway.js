'use strict';

const fetch = require('node-fetch');
const https = require('https');
const utils = require('../utils');

const keepAliveAgent = new https.Agent({
  keepAlive: false,
  keepAliveMsecs: 1500,
  maxSockets: 70,
});

const thingsOptions = {
  method: 'GET',
  agent: keepAliveAgent,
  headers: {
    Connection: 'keep-alive',
    Authorization: '',
    Accept: 'application/json',
  },
};

class Gateway {
  constructor(url, token) {
    this.url = url;
    this.token = token;
  }

  async getThing(id) {
    thingsOptions.headers.Authorization = 'Bearer ' + this.token;

    const thingUrl = `${this.url}/things/${id}`;
    try {
      const res = await fetch(thingUrl, thingsOptions);

      let description = await res.json();
      description = utils.convertLegacyThing(description);

      return description;
    } catch (err) {
      console.log(err);
      throw new Error(`getThing failed url:${thingUrl}`);
    }
  }

  async getThings(deviceList) {
    thingsOptions.headers.Authorization = 'Bearer ' + this.token;

    const thingsUrl = `${this.url}/things`;
    try {
      const res = await fetch(thingsUrl, thingsOptions);
      const json = await res.json();

      let things = [];
      for (let description of json) {
        description = utils.convertLegacyThing(description);
        const thingId = this.parseThingId(description);
        if (deviceList === null || deviceList.includes(thingId)) {
          things.push(description);
        }
      }

      return things;
    } catch (err) {
      console.log(err);
      throw new Error(`getThings failed url:${thingsUrl}`);
    }
  }

  parseThingId(description) {
    const href = description.href;
    return href.slice(href.lastIndexOf('/') + 1);
  }
}

module.exports = Gateway;
