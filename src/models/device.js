const config = require('../config-provider');
const fetch = require('node-fetch');

const pollingDeviceProperty =
  config.hasOwnProperty('mongodb') && config.mongodb.hasOwnProperty('uri');

class Device {
  constructor(description, gateway) {
    this.gateway = gateway;
    this.id = gateway.parseThingId(description);
    this.description = description;
    this.attributes = {};
    this.traits = [];
  }

  async checkOnline(property, current) {
    if (
      typeof this.description.properties === 'undefined' ||
      typeof this.description.properties[property] === 'undefined'
    ) {
      throw new Error('thing dose not have property: ' + property);
    }

    const options = {
      method: 'PUT',
      headers: {
        Connection: 'keep-alive',
        Authorization: 'Bearer ' + this.gateway.token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      body: '',
    };

    const body = {};
    body[property] = current;

    options.body = JSON.stringify(body);

    const propertyDescription = this.description.properties[property];
    let href;
    for (const link of propertyDescription.links) {
      if (!link.rel || link.rel === 'property') {
        href = link.href;
        break;
      }
    }

    if (href === 'undefined') {
      throw new Error(
        'thingDescription dose not have link to property: ' + property
      );
    }

    const propertyUrl = `${this.gateway.url}${href}`;

    try {
      const res = await fetch(propertyUrl, options);
      await res.json();

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getState(property) {
    if (
      typeof this.description.properties === 'undefined' ||
      typeof this.description.properties[property] === 'undefined'
    ) {
      throw new Error('thing dose not have property: ' + property);
    }

    const options = {
      method: 'GET',
      headers: {
        Connection: 'keep-alive',
        Authorization: 'Bearer ' + this.gateway.token,
        Accept: 'application/json',
      },
    };

    const propertyDescription = this.description.properties[property];
    let href;
    for (const link of propertyDescription.links) {
      if (!link.rel || link.rel === 'property') {
        href = link.href;
        break;
      }
    }

    if (href === 'undefined') {
      throw new Error(
        'thingDescription dose not have link to property: ' + property
      );
    }

    const propertyUrl = `${this.gateway.url}${href}`;

    try {
      const res = await fetch(propertyUrl, options);
      const json = await res.json();

      return json;
    } catch (err) {
      console.log(err);
      throw new Error(`getThingState failed url:${propertyUrl}`);
    }
  }

  async setState(property, state) {
    if (
      typeof this.description.properties === 'undefined' ||
      typeof this.description.properties[property] === 'undefined'
    ) {
      throw new Error('thing dose not have property: ' + property);
    }

    const options = {
      method: 'PUT',
      headers: {
        Connection: 'keep-alive',
        Authorization: 'Bearer ' + this.gateway.token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      body: '',
    };

    const body = {};
    body[property] = state;

    options.body = JSON.stringify(body);

    const propertyDescription = this.description.properties[property];
    let href;
    for (const link of propertyDescription.links) {
      if (!link.rel || link.rel === 'property') {
        href = link.href;
        break;
      }
    }

    if (href === 'undefined') {
      throw new Error(
        'thingDescription dose not have link to property: ' + property
      );
    }

    const propertyUrl = `${this.gateway.url}${href}`;

    try {
      const res = await fetch(propertyUrl, options);
      const json = await res.json();

      return json[property];
    } catch (err) {
      console.log(err);
      throw new Error(`setThingState failed url:${propertyUrl}`);
    }
  }

  getProperties() {
    const device = {
      id: this.id,
      type: this.type,
      traits: this.traits,
      name: {
        name: this.description.name,
      },
      willReportState: pollingDeviceProperty,
      attributes: this.attributes,
      deviceInfo: {
        manufacturer: 'mozilla',
        model: 'gateway',
        hwVersion: '1.0',
        swVersion: '1.0',
      },
    };
    return device;
  }
}

module.exports = Device;
