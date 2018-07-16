const Gateway = require('./gateway');
const Switch = require('./switch');
const Outlet = require('./outlet');
const Light = require('./light');
const Thermostat = require('./thermostat');

function createDevice(description, gateway) {
  switch (description.selectedCapability) {
    case 'Light':
      return new Light(description, gateway);
    case 'MultiLevelSwitch': // limitation: only support on property
    case 'OnOffSwitch': // limitation: only support on property
      if (gateway.parseThingId(description).match(/^tplink-/)) {
        return new Outlet(description, gateway);
      } else {
        return new Switch(description, gateway);
      }
    case 'SmartPlug': // limitation: only support on property
      return new Outlet(description, gateway);
    default:
      // thermostat
      if (
        description.properties.hasOwnProperty('mode') &&
        description.properties.hasOwnProperty('temperature')
      ) {
        return new Thermostat(description, gateway);
      }
      return null;
  }
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
  const gateway = new Gateway(client.gateway, client.token);
  const things = await gateway.getThings(deviceList);

  const devices = {};
  for (let thing of things) {
    const device = createDevice(thing, gateway);
    if (device !== null) {
      const properties = device.getProperties();
      devices[device.id] = properties;
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
  const gateway = new Gateway(client.gateway, client.token);
  const things = await gateway.getThings(deviceList);
  const devices = [];
  for (let thing of things) {
    const device = createDevice(thing, gateway);
    if (device !== null) {
      devices.push(device);
    }
  }
  const results = await Promise.all(
    devices.map(function(device) {
      return device.getStates();
    })
  );

  const devicesStates = {};
  for (let i = 0; i < results.length; i++) {
    const device = devices[i];
    const id = device.id;
    const states = results[i];
    devicesStates[id] = states;
  }

  return devicesStates;
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
  const gateway = new Gateway(client.gateway, client.token);
  const things = await gateway.getThings(deviceList);
  const devices = [];
  for (let thing of things) {
    const device = createDevice(thing, gateway);
    if (device !== null) {
      devices.push(device);
    }
  }
  let query = {};

  for (let i = 0; i < exec.length; i++) {
    query = Object.assign(query, exec[i].params);
  }

  const results = await Promise.all(
    devices.map(function(device) {
      return device.changeStates(query);
    })
  );

  const devicesStates = {};
  for (let i = 0; i < results.length; i++) {
    const device = devices[i];
    const id = device.id;
    const states = results[i];
    devicesStates[id] = states;
  }

  // TODO return current states
  return { devicesStates, query };
}

exports.smartHomeGetDevices = smartHomeGetDevices;
exports.smartHomeGetStates = smartHomeGetStates;
exports.smartHomeExec = smartHomeExec;
