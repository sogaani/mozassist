'use strict';

const TYPE_SWITCH = 'action.devices.types.SWITCH';
const TYPE_LIGHT = 'action.devices.types.LIGHT';
const TYPE_THERMOSTAT = 'action.devices.types.THERMOSTAT';

const TRAITS_ONOFF = 'action.devices.traits.OnOff';
const TRAITS_BRIGHTNESS = 'action.devices.traits.Brightness';
const TRAITS_COLORSPEC = 'action.devices.traits.ColorSpectrum';
const TRAITS_COLORTEMP = 'action.devices.traits.ColorTemperature';
const TRAITS_TEMPSETTING = 'action.devices.traits.TemperatureSetting';

const fetch = require('node-fetch');
const https = require('https');
const util = require('util')

var GatewayClient = {};

let keepAliveAgent = new https.Agent({
  keepAlive: false,
  keepAliveMsecs: 1500,
  maxSockets: 70
});

const thingsOptions = {
  method: 'GET',
  agent: keepAliveAgent,
  headers: {
    'Connection': 'keep-alive',
    'Authorization': '',
    'Accept': 'application/json'
  }
};

const iotOptions = {
  method: 'PUT',
  agent: keepAliveAgent,
  headers: {
    'Connection': 'keep-alive',
    'Authorization': '',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: ''
};

function hex2number(colorString) {
  const color = colorString.replace('#', '');
  let colorN = parseInt(color, 16);
  return colorN;
}

function number2hex(colorNumber) {
  let color = colorNumber.toString(16);
  while (color.length < 6)
    color = '0' + color;
  color = '#' + color;
  return color;
}


GatewayClient.getThing = function (client, id) {
  return new Promise(function (resolve, reject) {

    thingsOptions.headers.Authorization =
      'Bearer ' + client.token;

    fetch(util.format('%s/things/%s', client.gateway, id), thingsOptions)
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        resolve(json);
      })
      .catch(err => {
        reject(err);
      })
  });
}

GatewayClient.getThings = function (client, deviceList) {
  return new Promise(function (resolve, reject) {

    thingsOptions.headers.Authorization =
      'Bearer ' + client.token;

    fetch(util.format('%s/things', client.gateway), thingsOptions)
      .then(async function (res) {
        return res.json();
      })
      .then(function (json) {
        let things = [];
        if (deviceList) {
          for (let i = 0; i < json.length; i++) {
            const thing = json[i];
            const thingId = GatewayClient.getThingId(thing);
            if (deviceList.includes(thingId)) {
              things.push(thing);
            }
          }
        } else {
          things = json;
        }

        resolve(things);
      })
      .catch(err => {
        reject(err);
      })
  });
}

GatewayClient.getThingState = function (client, thing, property) {

  return new Promise(function (resolve, reject) {

    if (!thing || !thing.properties || !thing.properties[property]) {
      return reject(new Error('thing dose not have property: ' + property));
    }

    thingsOptions.headers.Authorization =
      'Bearer ' + client.token;

    fetch(util.format('%s%s', client.gateway, thing.properties[property].href), thingsOptions)
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        resolve(json[property]);
      })
      .catch(err => {
        reject(err);
      })
  });
}

GatewayClient.setThingState = function (client, thing, property, state) {

  return new Promise(function (resolve, reject) {

    if (!thing || !thing.properties || !thing.properties[property]) {
      return reject(new Error('thing dose not have property: ' + property));
    }

    iotOptions.headers.Authorization =
      'Bearer ' + client.token;

    const body = {};
    body[property] = state;

    iotOptions.body = JSON.stringify(body);

    fetch(util.format('%s%s', client.gateway, thing.properties[property].href), iotOptions)
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        resolve(json[property]);
      })
      .catch(err => {
        reject(err);
      })
  });
}

GatewayClient.getSmartHomeDeviceProperties = function (thing) {

  const device = {
    id: null,
    type: null,
    traits: [],
    name: {
      //defaultNames: [thing.name],
      name: thing.name,
      //nicknames: [thing.name]
    },
    willReportState: false,
    attributes: {},
    deviceInfo: {
      manufacturer: "mozilla",
      model: "gateway",
      hwVersion: "1.0",
      swVersion: "1.0"
    }
  };

  switch (thing.type) {
    case 'onOffSwitch':
    case 'multilevelSwitch': // limitation: only support on property
    case 'smartPlug':        // limitation: only support on property
      device.type = TYPE_SWITCH;
      device.traits.push(TRAITS_ONOFF);
      break;
    case 'onOffLight':
      device.type = TYPE_LIGHT;
      device.traits.push(TRAITS_ONOFF);
      break;
    case 'dimmableLight':
      device.type = TYPE_LIGHT;
      device.traits.push(TRAITS_ONOFF);
      device.traits.push(TRAITS_BRIGHTNESS);
      break;
    case 'onOffColorLight':
      device.type = TYPE_LIGHT;
      device.traits.push(TRAITS_ONOFF);
      device.traits.push(TRAITS_COLORSPEC);
      device.attributes['colorModel'] = 'rgb';
      break;
    case 'dimmableColorLight':
      device.type = TYPE_LIGHT;
      device.traits.push(TRAITS_ONOFF);
      device.traits.push(TRAITS_COLORSPEC);
      device.traits.push(TRAITS_BRIGHTNESS);
      device.attributes['colorModel'] = 'rgb';
      break;

    case 'thing':
      // thermostat
      if (thing.properties.hasOwnProperty('mode') && thing.properties.hasOwnProperty('temperature')) {
        device.type = TYPE_THERMOSTAT;
        device.traits.push(TRAITS_TEMPSETTING);
        device.attributes['availableThermostatModes'] = 'off,heat,cool,on';
        device.attributes['thermostatTemperatureUnit'] = 'C';
      }
      break;
    default:
      // do nothing
      break;
  }

  return device;
}

GatewayClient.changeSmartHomeDeviceStates = function (client, thing, states) {

  return new Promise(async function (resolve, reject) {

    try {
      switch (thing.type) {
        case 'onOffSwitch':
        case 'multilevelSwitch': // limitation: only support on property
        case 'smartPlug':        // limitation: only support on property
        case 'onOffLight':
          if (states.hasOwnProperty('on')) await GatewayClient.setThingState(client, thing, 'on', states['on']);
          break;

        case 'dimmableLight':
          if (states.hasOwnProperty('on')) await GatewayClient.setThingState(client, thing, 'on', states['on']);
          if (states.hasOwnProperty('brightness')) await GatewayClient.setThingState(client, thing, 'level', states['brightness']);
          if (states.hasOwnProperty('brightnessRelativeWeight')) {
            const current = await GatewayClient.getThingState(client, thing, 'level');
            const target = current + states['brightnessRelativeWeight'];
            await GatewayClient.setThingState(client, thing, 'level', target);
          }
          break;

        case 'onOffColorLight':
          if (states.hasOwnProperty('on')) await GatewayClient.setThingState(client, thing, 'on', states['on']);
          if (states.hasOwnProperty('color') && states['color'].spectrumRGB) {
            const color = number2hex(states['color'].spectrumRGB);
            await GatewayClient.setThingState(client, thing, 'color', color);
          }
          break;

        case 'dimmableColorLight':
          if (states.hasOwnProperty('on')) await GatewayClient.setThingState(client, thing, 'on', states['on']);
          if (states.hasOwnProperty('brightness')) await GatewayClient.setThingState(client, thing, 'level', states['brightness']);
          if (states.hasOwnProperty('brightnessRelativeWeight')) {
            const current = await GatewayClient.getThingState(client, thing, 'level');
            const target = current + states['brightnessRelativeWeight'];
            await GatewayClient.setThingState(client, thing, 'level', target);
          }
          if (states.hasOwnProperty('color') && states['color'].spectrumRGB) {
            const color = number2hex(states['color'].spectrumRGB);
            await GatewayClient.setThingState(client, thing, 'color', color);
          }
          break;

        case 'thing':
          // thermostat
          if (thing.properties.hasOwnProperty('mode') && thing.properties.hasOwnProperty('temperature')) {
            if (states.hasOwnProperty('thermostatMode')) await GatewayClient.setThingState(client, thing, 'mode', states['thermostatMode']);
            if (states.hasOwnProperty('thermostatTemperatureSetpoint')) await GatewayClient.setThingState(client, thing, 'temperature', states['thermostatTemperatureSetpoint']);
          }
          break;
        default:
          // do nothing
          break;
      }
    } catch (err) {
      console.error('changeSmartHomeDeviceStates fail:', err);
      states.online = false;
    }

    resolve(states);
  });
}

GatewayClient.getSmartHomeDeviceStates = function (client, thing) {

  return new Promise(async function (resolve, reject) {
    const states = {
      online: true
    };

    try {

      switch (thing.type) {
        case 'onOffSwitch':
        case 'multilevelSwitch': // limitation: only support on property
        case 'smartPlug':        // limitation: only support on property
        case 'onOffLight':
          states['on'] = await GatewayClient.getThingState(client, thing, 'on');
          break;
        case 'dimmableLight':
          {
            const [on, brightness] = await Promise.all([
              GatewayClient.getThingState(client, thing, 'on'),
              GatewayClient.getThingState(client, thing, 'level')]);

            states['on'] = on;
            states['brightness'] = brightness;
          }
          break;
        case 'onOffColorLight':
          {
            const [on, hex] = await Promise.all([
              GatewayClient.getThingState(client, thing, 'on'),
              GatewayClient.getThingState(client, thing, 'color')]);

            states['on'] = on;

            const color = {
              spectrumRGB: hex2number(hex)
            };
            states['color'] = color;
          }
          break;
        case 'dimmableColorLight':
          {
            const [on, brightness, hex] = await Promise.all([
              GatewayClient.getThingState(client, thing, 'on'),
              GatewayClient.getThingState(client, thing, 'level'),
              GatewayClient.getThingState(client, thing, 'color')]);

            states['on'] = on;
            states['brightness'] = brightness;

            const color = {
              spectrumRGB: hex2number(hex)
            };
            states['color'] = color;
          }
          break;

        case 'thing':
          // thermostat
          if (thing.properties.hasOwnProperty('mode') && thing.properties.hasOwnProperty('temperature')) {
            const [mode, temperature] = await Promise.all([
              GatewayClient.getThingState(client, thing, 'mode'),
              GatewayClient.getThingState(client, thing, 'temperature')
            ]);
            states['thermostatMode'] = mode;
            states['thermostatTemperatureSetpoint'] = temperature;
          }
          break;
        default:
          // do nothing
          break;
      }
    } catch (err) {
      console.error('getSmartHomeDeviceStates fail:', err);
      states.online = false;
    }

    resolve(states);
  });
}

GatewayClient.getThingId = function (thing) {
  let href = thing.href;
  return href.slice(href.lastIndexOf('/') + 1);
}

/**
 *
 * @param deviceList:
 * [
 *   "123",
 *   "234"
 * ]
 * @return {{}}
 * {
 *   "123": {
 *     "id": "123",
 *     "type": "action.devices.types.Outlet",
 *     "traits": [
 *       "action.devices.traits.OnOff"
 *     ],
 *     "name": {
 *       "defaultNames": ["TP-Link Outlet C110"],
 *       "name": "Homer Simpson Light",
 *       "nicknames": ["wall plug"]
 *     },
 *     "willReportState: false,
 *     "attributes": {
 *     // None defined for these traits yet.
 *     },
 *     "roomHint": "living room",
 *     "deviceInfo": {
 *       "manufacturer": "tplink",
 *       "model": "c110",
 *       "hwVersion": "3.2",
 *       "swVersion": "11.4"
 *     },
 *     "customData": {
 *       "fooValue": 74,
 *       "barValue": true,
 *       "bazValue": "sheepdip"
 *     }
 *   }, 
 *   "456": {
 *     "id": "456",
 *     "type": "action.devices.types.Light",
 *     "traits": [
 *       "action.devices.traits.OnOff",
 *       "action.devices.traits.Brightness",
 *       "action.devices.traits.ColorTemperature",
 *       "action.devices.traits.ColorSpectrum"
 *     ],
 *     "name": {
 *       "defaultNames": ["OSRAM bulb A19 color hyperglow"],
 *       "name": "lamp1",
 *       "nicknames": ["reading lamp"]
 *     },
 *     "willReportState: false,
 *     "attributes": {
 *       "TemperatureMinK": 2000,
 *       "TemperatureMaxK": 6500
 *     },
 *     "roomHint": "living room",
 *     "config": {
 *       "manufacturer": "osram",
 *       "model": "hg11",
 *       "hwVersion": "1.2",
 *       "swVersion": "5.4"
 *     },
 *     "customData": {
 *       "fooValue": 12,
 *       "barValue": false,
 *       "bazValue": "dancing alpaca"
 *     }
 *   }, 
 *   "234": {
 *     "id": "234"
 *     // ...
 *   }
 * }
 */
GatewayClient.smartHomeGetDevices = function (client, deviceList = null) {

  return new Promise(function (resolve, reject) {
    GatewayClient.getThings(client, deviceList).
      then(function (things) {

        const devices = {};
        for (let i = 0; i < things.length; i++) {
          const thing = things[i];
          const device = GatewayClient.getSmartHomeDeviceProperties(thing);

          if (device && device.type) {
            const thingId = GatewayClient.getThingId(thing);
            devices[thingId] = device;
          }
        }

        resolve(devices);
      }).catch(function (err) {
        console.error('smartHomeGetDevices', err);
        reject(err);
      })
  });
};

/**
 *
 * @param deviceList:
 * [
 *   "123",
 *   "234"
 * ]
 * @return {{}}
 * {
 *   "123": {
 *     "on": true ,
 *     "online": true
 *   },
 *   "456": {
 *     "on": true,
 *     "online": true,
 *     "brightness": 80,
 *     "color": {
 *       "name": "cerulian",
 *       "spectrumRGB": 31655
 *     }
 *   },
 *   ...
 * }
 */
GatewayClient.smartHomeGetStates = function (client, deviceList = null) {
  return new Promise(function (resolve, reject) {
    GatewayClient.getThings(client, deviceList).then(function (things) {

      Promise.all(things.map(function (thing) {
        return GatewayClient.getSmartHomeDeviceStates(client, thing);
      }))
        .then(results => {

          const devices = {};

          for (let i = 0; i < results.length; i++) {
            const thing = things[i];
            const thingId = GatewayClient.getThingId(thing);
            const states = results[i];
            devices[thingId] = states;
          }

          resolve(devices);
        });

    }).catch(function (err) {
      console.error('smartHomeGetStates', err);
      reject(err);
    })
  });
}

/**
 * 
 * @param deviceList:
 * [
 *   "123",
 *   "234"
 * ]
 * 
 * @param exec:
 * [{
 *   "command": "action.devices.commands.OnOff",
 *   "params": {
 *       "on": true
 *   }
 * }]
 *
 * @return {}
 * {
 *   "on": true
 * }
 */
GatewayClient.smartHomeExec = function (client, deviceList, exec) {

  return new Promise(function (resolve, reject) {
    GatewayClient.getThings(client, deviceList)
      .then(function (things) {

        let states = {};

        for (let i = 0; i < exec.length; i++) {
          states = Object.assign(states, exec[i].params);
        }

        Promise.all(things.map(function (thing) {
          return GatewayClient.changeSmartHomeDeviceStates(client, thing, states);
        }))
          .then(() => {
            resolve(states);
          });
      }).catch(function (err) {
        console.error('smartHomeExec', err);
        reject(err);
      })
  });
}

exports.smartHomeGetDevices = GatewayClient.smartHomeGetDevices;
exports.smartHomeGetStates = GatewayClient.smartHomeGetStates;
exports.smartHomeExec = GatewayClient.smartHomeExec;
