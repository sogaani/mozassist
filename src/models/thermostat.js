const Device = require('./device');
const constants = require('../constants');

class Thermostat extends Device {
  constructor(description, gateway) {
    super(description, gateway);
    this.type = constants.TYPE_THERMOSTAT;
    this.findProperties();

    this.attributes.availableThermostatModes = 'off,heat,cool,on';
    this.attributes.thermostatTemperatureUnit = 'C';
    this.traits.push(constants.TRAITS_TEMPSETTING);
  }

  findProperties() {
    this.modeProperty = null;
    this.temperatureProperty = null;

    // If necessary, match on name.
    if (
      this.modeProperty === null &&
      this.description.properties.hasOwnProperty('mode')
    ) {
      this.modeProperty = 'mode';
    }
    if (
      this.temperatureProperty === null &&
      this.description.properties.hasOwnProperty('temperature')
    ) {
      this.temperatureProperty = 'temperature';
    }
  }

  async changeStates(states) {
    const currentStates = {};
    try {
      if (states.hasOwnProperty('thermostatMode')) {
        currentStates.thermostatMode = await this.setState(
          this.modeProperty,
          states.thermostatMode
        );
      }

      if (states.hasOwnProperty('thermostatTemperatureSetpoint')) {
        const temperature = states.thermostatTemperatureSetpoint;
        currentStates.thermostatTemperatureSetpoint = await this.setState(
          this.temperatureProperty,
          temperature
        );
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
      promises.push(this.getState(this.modeProperty));
      promises.push(this.getState(this.temperatureProperty));
      const result = await Promise.all(promises);

      for (const property of result) {
        if (typeof property[this.modeProperty] !== 'undefined') {
          states.thermostatMode = property[this.modeProperty];
        }
        if (typeof property[this.temperatureProperty] !== 'undefined') {
          states.thermostatTemperatureSetpoint =
            property[this.temperatureProperty];
        }
      }
      states.online = await this.checkOnline(
        this.temperatureProperty,
        states.thermostatTemperatureSetpoint
      );
    } catch (err) {
      console.error('getStates fail:', err);
      states.online = false;
    }
    return states;
  }
}

module.exports = Thermostat;
