'use strict';

const Admin = require('firebase-admin');
const config = require('./config-provider');

const GATEWAY_COLLECTION = 'gateway';
const OAUTH_COLLECTION = 'oauth';

/**
 * Static Database Class.
 */
class Database {
  /**
   * Firestore object.
   */
  //static db = null;;

  /**
   * Open the database.
   */
  static open() {
    // If the database is already open, just return.
    if (this.db) {
      return;
    }

    Admin.initializeApp({
      credential: Admin.credential.cert(config.googleServiceAccount)
    });

    this.db = Admin.firestore();

    this.migrate();
  }

  /**
   * Do anything necessary to migrate from old database schemas.
   */
  static migrate() {
  }

  /**
   * Populate the database with default data.
   */
  static populate() {
    console.log('Populating database with test data');
  }

  /**
   * .
   */
  static async registerGateway(collection, key, gateway) {
    const doc = collection.doc(key);

    try {
      const result = await doc.create(gateway);
      return result;
    } catch (e) {
      throw new Error(`Document already exists id:${key}`);
    }
  }

  /**
   * .
   */
  static async getGateway(collection, key) {
    const docsnap = await collection.doc(key).get();

    if (!docsnap.exists) {
      throw new Error(`Document not exists id:${key}`);
    }

    return docsnap.data();
  }


  /**
   * Set a gateway with key oauth token.
   *
   * @param {String} token
   * @param {Object} gateway
   * @return {Promise<Object>} write result
   */
  static registerGatewayWithToken(token, gateway) {
    const collection = this.db.collection(GATEWAY_COLLECTION);
    return this.registerGateway(collection, token, gateway);
  }

  /**
   * Get a gateway by key oauth token.
   *
   * @param {String} token
   * @return {Promise<Object>} gateway data
   */
  static getGatewayByToken(token) {
    const collection = this.db.collection(GATEWAY_COLLECTION);
    return this.getGateway(collection, token);
  }

  /**
   * Set a gateway with key oauth state.
   *
   * @param {String} state
   * @param {Object} gateway
   * @return {Promise<Object>} write result
   */
  static registerGatewayWithState(state, gateway) {
    const collection = this.db.collection(OAUTH_COLLECTION);
    return this.registerGateway(collection, state, gateway);
  }

  /**
   * Get a gateway by key oauth state.
   *
   * @param {String} state
   * @return {Promise<Object>} gateway data
   */
  static getGatewayByState(state) {
    const collection = this.db.collection(OAUTH_COLLECTION);
    return this.getGateway(collection, state);
  }

}

module.exports = Database;