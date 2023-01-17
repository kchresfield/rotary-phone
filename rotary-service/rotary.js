require('dotenv').config();

const express = require('express');
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const axios = require('axios');
var bodyParser = require('body-parser')

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

exports.welcome = function welcome() {
  const voiceResponse = new VoiceResponse();

  const gather = voiceResponse.gather({
    action: '/rotary-service/menu',
    numDigits: 1,
    // method: 'POST',
  });

  gather.say(
    'Thanks for using Twilio\'s rotary phone. ' +
    'Please dial 1 for fun facts. ' +
    'Dial 2 to leave a message. ' +
    'Dial 3 to hear a message. '
  );
  return voiceResponse.toString();
};

exports.menu = async function menu(digit) {
  const optionActions = {
    '1': sayAFunFact,
    '2': leaveAMessage,
    '3': findAMessage
  };

  return (optionActions[digit])
    ? await optionActions[digit]()
    : redirectWelcome();
};

async function sayAFunFact() {
  const twiml = new VoiceResponse();

  return await giveAFunFact()
    .then(str => {
      twiml.say(
        str
      );
    })
    .then(und => {
      twiml.say(
        'This call was powered by Twilio. Goodbye!'
      );
      twiml.hangup();

      return twiml.toString();
    })



}


/**
 * Returns Twiml
 * @return {String}
 */
async function giveAFunFact() {
  const url = 'https://uselessfacts.jsph.pl/random.json?language=en';

  return axios.get(url)
    .then(resp => {
      if (checkForKidUnfriendlyWords(resp.data.text)) {
        return resp.data.text;
      } else {
        return giveAFunFact();
      }
    })
    .catch(err => {
      console.log(err);
    })
}

function checkForKidUnfriendlyWords(fact) {
  if (fact.includes("murder") || fact.includes("kill") || fact.includes("suicide") || fact.includes("death") || fact.includes("poison") || fact.includes("overdose") || fact.includes("cocaine") || fact.includes("cancer") || fact.includes("bullet")) {
    return false;
  }
  return true;
}

function leaveAMessage() {
  const twiml = new VoiceResponse();
  twiml.say(
    'After the tone, leave a 10 second voice mail for a fellow Code Mash attendee!' +
    'When you are finished, press 1. ',
    { voice: 'alice', language: 'en-GB', loop: 1 }
  );
  twiml.record({
    timeout: 10,
    transcribe: true,
    action: '/rotary-service/recording',
    method: 'GET',
    finishOnKey: '1'
  });

  return twiml.toString();
}

exports.recording = function recording(digit, url) {
  const twiml = new VoiceResponse();

  twiml.play({ loop: 1 }, url)
  twiml.say(
    'Thank you for leaving a recording. ' +
    'To continue, press 1. ' +
    'To erase, press 2. '
  )
  twiml.gather({
    action: '/rotary-service/playback',
    numDigits: 1
  });

  return twiml.toString();
}

exports.playback = function playback(digit) {

  const optionActions = {
    '1': keep,
    '2': erase,
  };
  console.log(optionActions[digit])
  return (optionActions[digit])
    ? optionActions[digit]()
    : errorMessage();
};

function keep() {
  const twiml = new VoiceResponse();
  twiml.say(
    "Thank you for leaving a message. " +
    "This process was powered by Twilio. " +
    "You can hang up, or stay on the line and be returned to the main menu. "
  )

  twiml.redirect('/rotary-service/welcome');
  return twiml.toString();
}

function erase() {
  client.recordings.list({ limit: 1 })
    .then(lastRecording => {
      client.recordings(lastRecording[0].sid).remove();
    })
  const twiml = new VoiceResponse();
  twiml.say(
    "Message erased. " +
    "You can hang up, or stay on the line and be returned to the main menu. "
  )
  twiml.redirect('/rotary-service/welcome');
  return twiml.toString();

}

async function findAMessage() {
  return client.recordings.list({ limit: 20 })
    .then(listOfCalls => {
      let randomIndex = Math.floor(Math.random() * listOfCalls.length)
      return listOfCalls[randomIndex].mediaUrl + ".mp3"
    })
    .then(url => {
      const twiml = new VoiceResponse();
      twiml.play(
        url,
        { voice: 'alice', language: 'en-GB' }
      );
      return twiml.toString();
    })
    .catch(err => {
      console.log("error from findMessage function", err);
    })
}

function redirectWelcome() {
  const twiml = new VoiceResponse();

  twiml.say('Returning to the main menu');
  twiml.redirect('/rotary-service/welcome');

  return twiml.toString();
}

function errorMessage() {
  const twiml = new VoiceResponse();

  twiml.say('Sorry, an error occured. Returning to the main menu', {
    voice: 'alice',
    language: 'en-GB',
  });

  twiml.redirect('/rotary-service/welcome');

  return twiml.toString();
}

exports.text = function text() {
  let twiml = new MessagingResponse();
  twiml.message(`Thanks for attending Twilio's booth! Here's a $10 promocode: ${process.env.PROMO_CODE} and my email if you have any question: kchresfield@twilio.com`);
  return twiml.toString()
};