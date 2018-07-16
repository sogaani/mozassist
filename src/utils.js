'use strict';

const Utils = {
  gatewayToId: function(gateway) {
    return new Buffer(gateway).toString('base64');
  },
  getAccessToken: function(request) {
    return request.headers.authorization
      ? request.headers.authorization.split(' ')[1]
      : null;
  },
  legacyTypeToCapabilities: function(type) {
    switch (type) {
      case 'binarySensor':
        return ['BinarySensor'];
      case 'multiLevelSensor':
        // legacy multiLevelSensor includes an 'on' member
        return ['BinarySensor', 'MultiLevelSensor'];
      case 'onOffLight':
      case 'dimmableLight':
        return ['OnOffSwitch', 'Light'];
      case 'onOffColorLight':
      case 'dimmableColorLight':
        return ['OnOffSwitch', 'Light', 'ColorControl'];
      case 'multiLevelSwitch':
        return ['OnOffSwitch', 'MultiLevelSwitch'];
      case 'onOffSwitch':
        return ['OnOffSwitch'];
      case 'smartPlug':
        return ['OnOffSwitch', 'SmartPlug', 'EnergyMonitor'];
      default:
        return [];
    }
  },
  sortCapabilities: function(capabilities) {
    // copy the array, as we're going to sort in place.
    const list = capabilities.slice();

    const priority = [
      'SmartPlug',
      'Light',
      'MultiLevelSwitch',
      'OnOffSwitch',
      'ColorControl',
      'EnergyMonitor',
      'MultiLevelSensor',
      'BinarySensor',
    ];

    list.sort((a, b) => {
      if (!priority.includes(a) && !priority.includes(b)) {
        return 0;
      } else if (!priority.includes(a)) {
        return 1;
      } else if (!priority.includes(b)) {
        return -1;
      }

      return priority.indexOf(a) - priority.indexOf(b);
    });

    return list;
  },
  convertLegacyThing: function(description) {
    if (!description.selectedCapability) {
      let capabilities = [];
      if (
        Array.isArray(this.description['@type']) &&
        this.description['@type'].length > 0
      ) {
        capabilities = this.description['@type'];
      } else if (this.description.type) {
        capabilities = Utils.legacyTypeToCapabilities(this.description.type);
      }

      capabilities = Utils.sortCapabilities(capabilities);
      description.selectedCapability = capabilities[0];
    }

    return description;
  },
};

module.exports = Utils;
