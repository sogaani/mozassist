const {smartHomeGetStates} = require('../models/smarthome');
const {gatewayToId} = require('../utils');
const {reportState} = require('../home-graph');

const WORKER_NAME = 'stateReporter';

function registerWorker(scheduler) {
  scheduler.registerWorker(WORKER_NAME, 3, async (job, done) => {
    const client = job.attrs.data.client;
    const deviceIdList = job.attrs.data.deviceIdList;
    const requestId = 'mozassistRequest12398';

    const states = await smartHomeGetStates(client, deviceIdList);
    const {isDisconnected} = await reportState(gatewayToId(client.gateway), requestId, states);

    if (isDisconnected) {
      cancel(scheduler, client);
    }

    done();
  });
}

function schedule(scheduler, client, deviceIdList) {
  const jobId = gatewayToId(client.gateway);
  scheduler.repeatJob(WORKER_NAME, jobId, {
    client      : client,
    deviceIdList: deviceIdList,
  },
  {schedule: '5 minutes'});
}

function cancel(scheduler, client) {
  const jobId = gatewayToId(client.gateway);
  scheduler.cancelJob(WORKER_NAME, jobId);
}

exports.registerWorker = registerWorker;
exports.schedule = schedule;
exports.cancel = cancel;
