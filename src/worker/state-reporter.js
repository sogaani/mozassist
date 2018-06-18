const { smartHomeGetStates } = require('../models/smarthome');
const { gatewayToId } = require('../utils');
const { reportState } = require('../home-graph');

const WORKER_NAME = 'stateReporter';

/* The following code is intended for test. Delete when Report state bug fixed.
function shouldSync(prevStates, currentStates) {
  let changed = false;
  Object.keys(prevStates).forEach(key => {
    if (
      prevStates.hasOwnProperty(key) &&
      currentStates.hasOwnProperty(key) &&
      prevStates[key].online !== currentStates[key].online
    ) {
      changed = true;
    }
  });
  return changed;
}
*/

function registerWorker(scheduler) {
  scheduler.registerWorker(WORKER_NAME, 3, async (job, done) => {
    const client = job.attrs.data.client;
    const deviceIdList = job.attrs.data.deviceIdList;
    const requestId = 'mozassistRequest12398';
    const id = gatewayToId(client.gateway);
    const currentStates = await smartHomeGetStates(client, deviceIdList);
    const { isDisconnected } = await reportState(id, requestId, currentStates);

    if (isDisconnected) {
      cancel(scheduler, client);
      done();
      return;
    }

    done();
    /* The following code is intended for test. Delete when Report state bug fixed.
    const prevStates = job.attrs.data.states;
    if (prevStates && shouldSync(prevStates, currentStates)) {
      await requestSync(id);
    }

    job.attrs.data.states = currentStates;
    job.save(() => {
      done();
    });
    */
  });
}

function schedule(scheduler, client, deviceIdList) {
  const jobId = gatewayToId(client.gateway);
  scheduler.repeatJob(
    WORKER_NAME,
    jobId,
    {
      client: client,
      deviceIdList: deviceIdList,
    },
    { schedule: '5 minutes' }
  );
}

function cancel(scheduler, client) {
  const jobId = gatewayToId(client.gateway);
  scheduler.cancelJob(WORKER_NAME, jobId);
}

exports.registerWorker = registerWorker;
exports.schedule = schedule;
exports.cancel = cancel;
