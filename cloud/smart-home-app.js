'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
// const ngrok = require('ngrok');
const session = require('express-session');

// internal app deps
const google_ha = require('./smart-home-provider');
const auth = require('./auth-provider');
const config = require('./config-provider');

process.on('unhandledRejection', console.dir);

function createApp(config) {
  const app = express();
  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.set('trust proxy', 1);
  app.use(session({
    name             : '__session',
    secret           : 'xyzsecret',
    resave           : false,
    saveUninitialized: true,
    cookie           : {secure: false},
  }));

  // !firebase functions
  if (!process.env.GCLOUD_PROJECT) {
    app.listen(config.devPort, function() {
      /*
      ngrok.connect(config.devPort, function (err, url) {
        if (err) {
          console.log('ngrok err', err);
          process.exit();
        }

        console.log("|###################################################|");
        console.log("|                                                   |");
        console.log("|        COPY & PASTE NGROK URL BELOW:              |");
        console.log("|                                                   |");
        console.log("|          " + url + "                |");
        console.log("|                                                   |");
        console.log("|###################################################|");

        console.log("=====");
        console.log("Visit the Actions on Google console at http://console.actions.google.com")
        console.log("Replace the webhook URL in the Actions section with:");
        console.log("    " + url + "/smarthome");
        console.log("");

        console.log("Finally press the 'TEST DRAFT' button");
      });
      */
    });
  }

  return app;
}

const app = createApp(config);

app.use('/gateway/', express.static(__dirname + '/../static/build/default'));

google_ha.registerAgent(app);
auth.registerAuth(app);

module.exports = app;
