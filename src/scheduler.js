'use strict';

const Agenda = require('agenda');
const config = require('./config-provider');
const EventEmitter = require('events');
const agendash = require('agendash');
const DB_COLLECTION = 'jobs';

const dboptions = {};

class Scheduler extends EventEmitter {
  constructor() {
    super();
    if (
      config.hasOwnProperty('mongodb') &&
      config.mongodb.hasOwnProperty('uri')
    ) {
      return;
    }
    this.agenda = new Agenda({
      db: {
        address: config.mongodb.uri,
        collection: DB_COLLECTION,
        options: dboptions,
      },
    });
    this.isReady = false;
    this.agenda.once('ready', () => {
      this.isReady = true;
      this.emit('ready');
    });
  }

  createDashboard(app) {
    if (this.agenda === undefined) {
      return;
    }
    app.use('/dash', agendash(this.agenda));
  }

  registerWorker(name, limit, worker) {
    if (this.agenda === undefined) {
      return;
    }
    limit = limit || 1;
    this.agenda.define(
      name,
      {
        concurrency: limit,
        lockLimit: limit,
        lockLifetime: 5 * 60 * 1000,
      },
      worker
    );
  }

  _ifReady(cb) {
    if (this.isReady) {
      cb();
    } else {
      this.once('ready', () => {
        cb();
      });
    }
  }

  startWorker() {
    if (this.agenda === undefined) {
      return;
    }
    this._ifReady(() => {
      this.agenda.start();
    });
  }

  queueJob(name, data, option) {
    if (this.agenda === undefined) {
      return;
    }
    this._ifReady(() => {
      const job = this.agenda.create(name, data);
      const schedule = option.schedule || '5 minutes';
      job.schedule(schedule);
      job.save();
    });
  }

  repeatJob(name, jobId, data, option) {
    if (this.agenda === undefined) {
      return;
    }
    this._ifReady(() => {
      data.jobId = jobId;
      const job = this.agenda.create(name, data);
      const schedule =
        option && option.schedule ? option.schedule : '5 minutes';
      job.unique({ 'data.jobId': jobId });
      job.repeatEvery(schedule);
      job.save();
    });
  }

  cancelJob(name, jobId) {
    if (this.agenda === undefined) {
      return;
    }
    this._ifReady(() => {
      this.agenda.cancel({ 'data.jobId': jobId });
    });
  }
}

module.exports = new Scheduler(config.databasePath);
