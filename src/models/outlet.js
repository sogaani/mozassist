const Switch = require('./switch');
const constants = require('../constants');

class Outlet extends Switch {
  constructor(description, gateway) {
    super(description, gateway);
    this.type = constants.TYPE_OUTLET;
  }
}

module.exports = Outlet;
