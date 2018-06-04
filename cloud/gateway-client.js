'use strict';

const TYPE_SWITCH = 'action.devices.types.SWITCH';
const TYPE_LIGHT = 'action.devices.types.LIGHT';
const TYPE_THERMOSTAT = 'action.devices.types.THERMOSTAT';
const TYPE_OUTLET = 'action.devices.types.OUTLET';

const TRAITS_ONOFF = 'action.devices.traits.OnOff';
const TRAITS_BRIGHTNESS = 'action.devices.traits.Brightness';
const TRAITS_COLORSPEC = 'action.devices.traits.ColorSpectrum';
const TRAITS_COLORTEMP = 'action.devices.traits.ColorTemperature';
const TRAITS_TEMPSETTING = 'action.devices.traits.TemperatureSetting';


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
  body: '',
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
  body: '',
};

function hex2number(colorString) {
  const color = colorString.replace('#', '');
  const colorN = parseInt(color, 16);
  return colorN;
}

function number2hex(colorNumber) {
  let color = colorNumber.toString(16);
  while (color.length < 6)
    color = '0' + color;
  color = '#' + color;
  return color;
}

async function getThing(client, id) {
  thingsOptions.headers.Authorization = 'Bearer ' + client.token;

  const thingUrl = util.format('%s/things/%s', client.gateway, id);
  try {
    const res = await fetch(thingUrl, thingsOptions);

    const json = await res.json();

    return json;
  } catch (err) {
    console.log(err);
    throw new Error(`getThing failed url:${thingUrl}`);
  }
}

async function getThings(client, deviceList) {
  thingsOptions.headers.Authorization = 'Bearer ' + client.token;

  const thingsUrl = util.format('%s/things', client.gateway);
  try {
    const res = await fetch(thingsUrl, thingsOptions);

    const json = await res.json();

    let things = [];
    if (deviceList) {
      for (let i = 0; i < json.length; i++) {
        const thing = json[i];
        const thingId = getThingId(thing);
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

async function checkThingOnline(client, thing, property, current) {
  if (!thing || !thing.properties || !thing.properties[property]) {
    throw new Error('thing dose not have property: ' + property);
  }

  timeoutOptions.headers.Authorization = 'Bearer ' + client.token;

  const body = {};
  body[property] = current;

  timeoutOptions.body = JSON.stringify(body);

  const propertyUrl = util.format('%s%s', client.gateway, thing.properties[property].href);

  try {
    const res = await fetch(propertyUrl, timeoutOptions);

    const json = await res.json();

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function getThingState(client, thing, property) {
  if (!thing || !thing.properties || !thing.properties[property]) {
    throw new Error('thing dose not have property: ' + property);
  }

  thingsOptions.headers.Authorization = 'Bearer ' + client.token;

  const propertyUrl = util.format('%s%s', client.gateway, thing.properties[property].href);

  try {
    const res = await fetch(propertyUrl, thingsOptions);

    const json = await res.json();

    return json[property];
  } catch (err) {
    console.log(err);
    throw new Error(`getThingState failed url:${propertyUrl}`);
  }
}

async function setThingState(client, thing, property, state) {
  if (!thing || !thing.properties || !thing.properties[property]) {
    throw new Error('thing dose not have property: ' + property);
  }

  iotOptions.headers.Authorization = 'Bearer ' + client.token;

  const body = {};
  body[property] = state;

  iotOptions.body = JSON.stringify(body);

  const propertyUrl = util.format('%s%s', client.gateway, thing.properties[property].href);

  try {
    const res = await fetch(propertyUrl, iotOptions);

    const json = await res.json();

    return json[property];
  } catch (err) {
    console.log(err);
    throw new Error(`setThingState failed url:${propertyUrl}`);
  }
}

function getSmartHomeDeviceProperties(thing) {
  const device = {
    id    : null,
    type  : null,
    traits: [],
    name  : {
      // defaultNames: [thing.name],
      name: thing.name,
      // nicknames: [thing.name]
    },
    willReportState: false,
    attributes     : {},
    deviceInfo     : {
      manufacturer: 'mozilla',
      model       : 'gateway',
      hwVersion   : '1.0',
      swVersion   : '1.0',
    },
  };

  switch (thing.type) {
  case 'onOffSwitch':
    if(getThingId(thing).match(/^tplink-/)) {
      device.type = TYPE_OUTLET;
    } else {
      device.type = TYPE_SWITCH;
    }
    device.traits.push(TRAITS_ONOFF);
    break;
  case 'multilevelSwitch': // limitation: only support on property
    device.type = TYPE_SWITCH;
    device.traits.push(TRAITS_ONOFF);
    break;
  case 'smartPlug': // limitation: only support on property
    device.type = TYPE_OUTLET;
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
    if (thing.properties.hasOwnProperty('mode') &&
        thing.properties.hasOwnProperty('temperature')) {
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

async function changeSmartHomeDeviceStates(client, thing, states) {
  try {
    switch (thing.type) {
    case 'onOffSwitch':
    case 'multilevelSwitch': // limitation: only support on property
    case 'smartPlug': // limitation: only support on property
    case 'onOffLight':
      if (states.hasOwnProperty('on'))
        await setThingState(client, thing, 'on', states['on']);

      break;

    case 'dimmableLight':
      if (states.hasOwnProperty('on'))
        await setThingState(client, thing, 'on', states['on']);

      if (states.hasOwnProperty('brightness'))
        await setThingState(client, thing, 'level', states['brightness']);

      if (states.hasOwnProperty('brightnessRelativeWeight')) {
        const current = await getThingState(client, thing, 'level');
        const target = current + states['brightnessRelativeWeight'];
        await setThingState(client, thing, 'level', target);
      }
      break;

    case 'onOffColorLight':
      if (states.hasOwnProperty('on'))
        await setThingState(client, thing, 'on', states['on']);

      if (states.hasOwnProperty('color') && states['color'].spectrumRGB) {
        const color = number2hex(states['color'].spectrumRGB);
        await setThingState(client, thing, 'color', color);
      }
      break;

    case 'dimmableColorLight':
      if (states.hasOwnProperty('on'))
        await setThingState(client, thing, 'on', states['on']);

      if (states.hasOwnProperty('brightness'))
        await setThingState(client, thing, 'level', states['brightness']);

      if (states.hasOwnProperty('brightnessRelativeWeight')) {
        const current = await getThingState(client, thing, 'level');
        const target = current + states['brightnessRelativeWeight'];
        await setThingState(client, thing, 'level', target);
      }
      if (states.hasOwnProperty('color') && states['color'].spectrumRGB) {
        const color = number2hex(states['color'].spectrumRGB);
        await setThingState(client, thing, 'color', color);
      }
      break;

    case 'thing':
      // thermostat
      if (thing.properties.hasOwnProperty('mode') &&
            thing.properties.hasOwnProperty('temperature')) {
        if (states.hasOwnProperty('thermostatMode'))
          await setThingState(client, thing, 'mode', states['thermostatMode']);

        if (states.hasOwnProperty('thermostatTemperatureSetpoint')) {
          const temperature = states['thermostatTemperatureSetpoint'];
          await setThingState(client, thing, 'temperature', temperature);
        }
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

  return states;
}

async function getSmartHomeDeviceStates(client, thing) {
  const states = {
    online: true,
  };

  try {
    switch (thing.type) {
    case 'onOffSwitch':
    case 'multilevelSwitch': // limitation: only support on property
    case 'smartPlug': // limitation: only support on property
    case 'onOffLight':
      {
        const on = await getThingState(client, thing, 'on');
        states['on'] = on;
        states.online = await checkThingOnline(client, thing, 'on', on);
      }
      break;
    case 'dimmableLight':
      {
        const [on, brightness] = await Promise.all([
          getThingState(client, thing, 'on'),
          getThingState(client, thing, 'level')]);

        states['on'] = on;
        states['brightness'] = brightness;
        states.online = await checkThingOnline(client, thing, 'on', on);
      }
      break;
    case 'onOffColorLight':
      {
        const [on, hex] = await Promise.all([
          getThingState(client, thing, 'on'),
          getThingState(client, thing, 'color')]);

        states['on'] = on;

        const color = {
          spectrumRGB: hex2number(hex),
        };
        states['color'] = color;
        states.online = await checkThingOnline(client, thing, 'on', on);
      }
      break;
    case 'dimmableColorLight':
      {
        const [on, brightness, hex] = await Promise.all([
          getThingState(client, thing, 'on'),
          getThingState(client, thing, 'level'),
          getThingState(client, thing, 'color'),
        ]);

        states['on'] = on;
        states['brightness'] = brightness;

        const color = {
          spectrumRGB: hex2number(hex),
        };
        states['color'] = color;
        states.online = await checkThingOnline(client, thing, 'on', on);
      }
      break;

    case 'thing':
      // thermostat
      if (thing.properties.hasOwnProperty('mode') &&
          thing.properties.hasOwnProperty('temperature')) {
        const [mode, temperature] = await Promise.all([
          getThingState(client, thing, 'mode'),
          getThingState(client, thing, 'temperature'),
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

  return states;
}

function getThingId(thing) {
  const href = thing.href;
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
async function smartHomeGetDevices(client, deviceList = null) {
  const things = await getThings(client, deviceList);
  const devices = {};
  for (let i = 0; i < things.length; i++) {
    const thing = things[i];
    const device = getSmartHomeDeviceProperties(thing);

    if (device && device.type) {
      const thingId = getThingId(thing);
      devices[thingId] = device;
    }
  }

  return devices;
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
async function smartHomeGetStates(client, deviceList = null) {
  const things = await getThings(client, deviceList);

  const results = await Promise.all(things.map(function(thing) {
    return getSmartHomeDeviceStates(client, thing);
  }));

  const devices = {};

  for (let i = 0; i < results.length; i++) {
    const thing = things[i];
    const thingId = getThingId(thing);
    const states = results[i];
    devices[thingId] = states;
  }

  return devices;
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
async function smartHomeExec(client, deviceList, exec) {
  const things = await getThings(client, deviceList);

  let states = {};

  for (let i = 0; i < exec.length; i++) {
    states = Object.assign(states, exec[i].params);
  }

  await Promise.all(things.map(function(thing) {
    return changeSmartHomeDeviceStates(client, thing, states);
  }));

  // TODO return current states
  return states;
}

exports.smartHomeGetDevices = smartHomeGetDevices;
exports.smartHomeGetStates = smartHomeGetStates;
exports.smartHomeExec = smartHomeExec;
