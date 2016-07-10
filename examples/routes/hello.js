const hello = module.exports = {};

// hello.client: fn, client handler
// hello.server: fn, server handler
// hello.forward: bool, should the message be forwarded in both directions
// hello.forward_to_server: bool, should the message be forwarded from client to server
// hello.forward_to_client: bool, should the message be forwarded from server to client



hello.client = function (connection, message, next) {
  // connection = HermesConnection (a wrapper of connection)
  // connection.from = 'server' | 'client'
  // connection.send = A wrapper around WS.send (server), MQTT.publish (adapter), etc.
  // message = HermesMessage

  next();
};

hello.server = function (connection, message, next) {
  // connection = HermesConnection (a wrapper of connection)
  // connection.from = 'server' | 'client'
  // connection.send = A wrapper around WS.send (server), MQTT.publish (adapter), etc.
  // message = HermesMessage

  next();
};
