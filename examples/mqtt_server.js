const hermes = require('../');
const mqtt_broker = require('../brokers/mqtt');
const socketio_client = require('../clients/socketio');
const hello = require('./routes/hello');

// **********************
// LOAD SOCKETIO EXAMPLE
// **********************
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
// **********************

const app = hermes();
const mqtt = mqtt_broker({
  host_url: 'mqtt://test.mosquitto.org',
  topics: 'hello/#'
});
const socketio = socketio_client({ http_server });

app.add('broker', mqtt);
app.add('client', socketio);

// ************************
// EXAMPLES OF MIDDLEWARES
// ************************
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
// **********************

// USE ROUTER
app.use('hello', hello);

app.listen();
