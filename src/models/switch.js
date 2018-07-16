const Device = require('./device');
const constants = require('../constants');

class Switch extends Device {
  constructor(description, gateway) {
    super(description, gateway);
    this.type = constants.TYPE_SWITCH;
    this.findProperties();

    if (this.onProperty !== null) {
      this.traits.push(constants.TRAITS_ONOFF);
    }
  }

  findProperties() {
    this.onProperty = null;

    // Look for properties by type first.
    for (const name in this.description.properties) {
      const type = this.description.properties[name]['@type'];

      if (type === 'BooleanProperty') {
        this.onProperty = name;
        break;
      }
    }

    // If necessary, match on name.
    if (
      this.onProperty === null &&
      this.description.properties.hasOwnProperty('on')
    ) {
      this.onProperty = 'on';
    }
  }

  async changeStates(states) {
    const currentStates = {};
    try {
      if (states.hasOwnProperty('on')) {
        currentStates.on = await this.setState(this.onProperty, states.on);
      }
    } catch (err) {
      console.error('changeStates fail:', err);
      currentStates.online = false;
    }

    return currentStates;
  }

  async getStates() {
    const states = {};
    try {
      const promises = [];
      promises.push(this.getState(this.onProperty));
      const result = await Promise.all(promises);

      for (const property of result) {
        if (typeof property[this.onProperty] !== 'undefined') {
          states.on = property[this.onProperty];
        }
      }
      states.online = await this.checkOnline(this.onProperty, states.on);
    } catch (err) {
      console.error('getStates fail:', err);
      states.online = false;
    }
    return states;
  }
}

module.exports = Switch;
