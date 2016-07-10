const socketio = require('socket.io');

function init (settings) {
  return function (hermes) {
    return new HermesSocketIO(settings, hermes);
  };
}

function HermesSocketIO (settings, hermes) {
  this.hermes = hermes;
  this.server_settings = settings;
  this.listen = _listen.bind(this);
  this.send = _send.bind(this);
}

function _setup () {
  this.http_server = this.server_settings.http_server;
  if (!this.http_server) {
    this.io = socketio();
  } else {
    this.io = socketio(this.http_server);
  }

  this.io.on('connection', (socket) => {
    this.hermes.emit('client:ready', { name: 'Socket.IO adapter' });
    socket.onevent = (packet) => {
      const topic = packet.data[0];
      _published.call(this, _createMessageFromClient.call(this, topic, packet, socket));
    };
  });
}

function _listen () {
  _setup.call(this);
  if (this.http_server.listen) {
    this.http_server.listen(this.server_settings.port || 80);
  } else {
    this.http_server(this.server_settings.port || 80);
  }
  return this.client;
}

function _published (message) {
  this.hermes.emit('client:message', message);
}

function _createMessage (topic, message) {
  return {
    protocol: message.protocol || this.server_settings.protocol || 'ws',
    payload: message.payload,
    topic,
    headers: message.headers
  };
}

function _createMessageFromClient (topic, packet, client) {
  return {
    protocol: 'ws',
    payload: packet.data[1],
    topic,
    headers: {},
    ws_client: client,
    original_packet: packet
  };
}

function _send (message) {
  this.io.emit(message.topic, _createMessage.call(this, message.topic, message));
}

module.exports = init;
