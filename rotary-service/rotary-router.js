const Router = require('express').Router;
const express = require('express');
var bodyParser = require('body-parser')
const {welcome, menu, recording, hearAMessage, playback, text} = require('./rotary');

const app = express();
const router = new Router();

// router.use('/rotary-service', twilio.webhook({validate: false}), thisPage);

// POST: /rotary-service/welcome
router.post('/welcome', (req, res) => {
  res.type('text/xml');
  res.send(welcome());
});

// POST: /rotary-service/menu
router.post('/menu', async (req, res) => {
  const numEntered = req.body.Digits;
  return res.send(await menu(numEntered));
});

// GET: /rotary-service/recording
router.get('/recording', (req, res) => {
  let digit = req.query.Digits;
  let url = req.query.RecordingUrl + ".mp3"
  res.send(recording(digit, url));
});

// POST: /rotary-service/playback
router.post('/playback', (req, res) => {
  console.log(req.body)
  let digit = req.body.Digits;
  res.send(playback(digit));
});

// POST: /rotary-service/hearAMessage
router.post('/hearAMessage', (req, res) => {
  res.send(hearAMessage());
});


router.post('/text', (req, res) => {
  res.type('text/xml');
  res.send(text());
});

module.exports = router;