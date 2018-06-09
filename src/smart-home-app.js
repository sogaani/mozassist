'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const ngrok = require('ngrok');
const session = require('express-session');

// internal app deps
const smarthomeController = require('./controllers/smart-home-controller');
const oauthController = require('./controllers/oauth-controller');
const stateReporter = require('./worker/state-reporter');
const config = require('./config-provider');
const scheduler = require('./scheduler');

process.on('unhandledRejection', console.dir);

function createApp(config) {
  const app = express();
  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('trust proxy', 1);
  app.use(
    session({
      name: '__session',
      secret: 'xyzsecret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  app.listen(config.devPort, function() {
    if (!config.isLocal) {
      return;
    }
    scheduler.createDashboard(app);
    ngrok.connect(
      config.devPort,
      function(err, url) {
        if (err) {
          console.log('ngrok err', err);
          process.exit();
        }

        console.log('|###################################################|');
        console.log('|                                                   |');
        console.log('|        COPY & PASTE NGROK URL BELOW:              |');
        console.log('|                                                   |');
        console.log('|          ' + url + '                |');
        console.log('|                                                   |');
        console.log('|###################################################|');

        console.log('=====');
        console.log(
          'Visit the Actions on Google console at http://console.actions.google.com'
        );
        console.log('Replace the webhook URL in the Actions section with:');
        console.log('    ' + url + '/smarthome');
        console.log('');

        console.log("Finally press the 'TEST DRAFT' button");
      }
    );
  });

  return app;
}

const app = createApp(config);

app.use('/static/', express.static(__dirname + '/../static/'));

smarthomeController.registerAgent(app);
oauthController.registerAuth(app);
stateReporter.registerWorker(scheduler);
scheduler.startWorker();

module.exports = app;
