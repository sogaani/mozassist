const Device = require('./device');
const constants = require('../constants');

function hex2number(colorString) {
  const color = colorString.replace('#', '');
  const colorN = parseInt(color, 16);
  return colorN;
}

function number2hex(colorNumber) {
  let color = colorNumber.toString(16);
  while (color.length < 6) color = '0' + color;
  color = '#' + color;
  return color;
}

class Light extends Device {
  constructor(description, gateway) {
    super(description, gateway);
    this.type = constants.TYPE_LIGHT;
    this.findProperties();

    if (this.onProperty !== null) {
      this.traits.push(constants.TRAITS_ONOFF);
    }
    if (this.brightnessProperty !== null) {
      this.traits.push(constants.TRAITS_BRIGHTNESS);
    }
    if (this.colorProperty !== null) {
      this.traits.push(constants.TRAITS_COLORSPEC);
      this.attributes.colorModel = 'rgb';
    }
  }

  findProperties() {
    this.onProperty = null;
    this.brightnessProperty = null;
    this.colorProperty = null;

    // Look for properties by type first.
    for (const name in this.description.properties) {
      const type = this.description.properties[name]['@type'];

      if (type === 'OnOffProperty') {
        this.onProperty = name;
        break;
      } else if (
        this.brightnessProperty === null &&
        type === 'BrightnessProperty'
      ) {
        this.brightnessProperty = name;
      } else if (this.colorProperty === null && type === 'ColorProperty') {
        this.colorProperty = name;
      }
    }

    // If necessary, match on name.
    if (
      this.onProperty === null &&
      this.description.properties.hasOwnProperty('on')
    ) {
      this.onProperty = 'on';
    }

    if (
      this.brightnessProperty === null &&
      this.description.properties.hasOwnProperty('level')
    ) {
      this.brightnessProperty = 'level';
    }

    if (
      this.colorProperty === null &&
      this.description.properties.hasOwnProperty('color')
    ) {
      this.colorProperty = 'color';
    }
  }

  async changeStates(states) {
    const currentStates = { online: true };
    try {
      if (states.hasOwnProperty('on')) {
        currentStates.on = await this.setState(this.onProperty, states.on);
      }

      if (states.hasOwnProperty('brightness')) {
        currentStates.brightness = await this.setState(
          this.brightnessProperty,
          states.brightness
        );
      }

      if (states.hasOwnProperty('brightnessRelativeWeight')) {
        const current = await this.getState(this.brightnessProperty);
        const target = current + states.brightnessRelativeWeight;
        currentStates.brightness = await this.setState(
          this.brightnessProperty,
          target
        );
      }

      if (
        states.hasOwnProperty('color') &&
        states.color.hasOwnProperty('spectrumRGB')
      ) {
        const color = number2hex(states.color.spectrumRGB);
        const hex = await this.setState(this.colorProperty, color);
        currentStates.color = {
          spectrumRGB: hex2number(hex),
        };
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
      if (this.brightnessProperty !== null) {
        promises.push(this.getState(this.brightnessProperty));
      }
      if (this.colorProperty !== null) {
        promises.push(this.getState(this.colorProperty));
      }
      const result = await Promise.all(promises);

      for (const property of result) {
        if (typeof property[this.onProperty] !== 'undefined') {
          states.on = property[this.onProperty];
        }
        if (typeof property[this.brightnessProperty] !== 'undefined') {
          states.brightness = property[this.brightnessProperty];
        }

        if (typeof property[this.colorProperty] !== 'undefined') {
          const color = {
            spectrumRGB: hex2number(property[this.colorProperty]),
          };
          states.color = color;
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

module.exports = Light;
