const hermes = require('../');
const mqtt_broker = require('../brokers/mqtt');
const socketio_client = require('../clients/_socketio');
//const hello = require('./routes/hello');

/*
---!!!
NEXT STEP IS TO CREATE A SOCKETIO CLIENT AND TRY TO FORWARD
THE MESSAGE TO IT IN finalhandler METHOD ON HERMES.
THIS WILL COMPLETE THE FIRST USE CASE AND WILL ALLOW YOU TO
WORK ON NEXT STEPS.
!!!----
*/

const path = require('path');
const fs = require('fs');
const http_server = require('http').createServer(handler);
function handler (req, res) {
  fs.readFile(path.resolve(__dirname, '../clients/index.html'),
  (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

const app = hermes();
const mqtt = mqtt_broker({
  host_url: 'mqtt://test.mosquitto.org',
  topics: 'hello/fran/#'
});
const socketio = socketio_client({ http_server });

app.add('broker', mqtt);
app.add('client', socketio);

app.use(function bufferToStringMiddleware (message, next) {
  if (message.payload instanceof Buffer) {
    message.payload = message.payload.toString();
  }
  next();
});

app.use(function stringToJSONMiddleware (message, next) {
  try {
    message.payload = JSON.parse(message.payload);
    next();
  } catch (e) {
    next();
  }
});

app.use('hello/:name', function router (message, next) {
  if (message.from.broker) return next.cancel();
  next();
});

/*app.use(function error_handler (err, message, next) {
  if (err) console.dir(err);
});*/

app.listen();
