const express = require('express');
const twilio = require('twilio');
const path = require('path');
const bodyParser = require('body-parser');
const router = require('./rotary-service/rotary-router');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(router)

router.use('/rotary-service', twilio.webhook({validate: false}), router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  console.log(err)
  err.status = 404;
  next(err);
});

module.exports = app;