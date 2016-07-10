const mqtt = require('mqtt');

function init (settings) {
  return function (hermes) {
    return new HermesMQTT(settings, hermes);
  };
}

function HermesMQTT (settings, hermes) {
  this.hermes = hermes;
  this.server_settings = settings;
  this.listen = _listen.bind(this);
  this.send = _send.bind(this);
}

function _setup () {
  this.client.on('connect', () => {
    this.hermes.emit('broker:ready', { name: 'MQTT adapter' });
    this.client.subscribe(this.server_settings.topics || '#', {
      qos: this.server_settings.qos || 0
    });
  });
  this.client.on('message', _published.bind(this));
}

function _listen () {
  this.client = mqtt.connect(this.server_settings.host_url || 'mqtt://localhost');
  _setup.call(this);
  return this.client;
}

function _published (topic, message, packet) {
  this.hermes.emit('broker:message', _createMessage.call(this, packet, this.client));
}

function _createMessage (packet, client) {
  return {
    protocol: this.server_settings.protocol || 'mqtt',
    payload: packet.payload,
    broker_client: client,
    topic: packet.topic,
    headers: {
      cmd: packet.cmd,
      retain: packet.retain,
      qos: packet.qos,
      dup: packet.dup,
      length: packet.length,
      topic: packet.topic
    },
    original_packet: packet
  };
}

function _send (message) {
  var payload = message.payload;

  if (typeof payload === 'object' && !(payload instanceof Buffer)) {
    try {
      payload = JSON.stringify(payload);
    } catch (e) {
      // Nothing to do here...
    }
  }

  if (!(payload instanceof Buffer) && typeof payload !== 'string') {
    payload = String(payload);
  }

  this.client.publish(message.topic, payload, {
    qos: this.server_settings.qos || 0,
    retain: this.server_settings.retain || false
  });
}

module.exports = init;
