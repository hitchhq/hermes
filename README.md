![](https://raw.githubusercontent.com/hitchhq/hermes/master/hermes.jpg)

**Hermes is a real-time messaging framework**. It lets you connect a client with a
broker and manage all the communication in between.

## Installation

```
npm install --save hermesjs
```

## Features

* Express-like Routing and middlewares.
* Forwarding messages from **Client** to **Broker** and viceversa.
* Cancel the delivery (message will continue passing through middlewares, if any).
* Stop the message (message will not continue passing through middlewares).
* Answer back to client or broker, using same or different topic and payload.

## Getting Started

Check [examples folder](./examples/).

## API

### App

#### Constructor

Initializing a Hermes app is actually really easy:

```js
const hermes = require('hermesjs');
const app = hermes();
```

#### app.add(key, value)

This method is used to add configuration parameters to your Hermes app. Special
keys are `client` and `broker`.

For instance, you can specify your Socket.IO client adapter:

```js
const socketio_adapter = require('hermesjs-socketio');
const socketio = socketio_adapter();

app.add('client', socketio);
```

or you can specify your MQTT broker adapter:

```js
const mqtt_broker = require('hermesjs-mqtt');

const mqtt = mqtt_broker({
  host_url: 'mqtt://test.mosquitto.org',
  topics: 'hello/#'
});

app.add('broker', mqtt);
```

#### app.use(...fn)
#### app.use(route, ...fn)
#### app.use(route, HermesRouter)

Use middlewares and routes. If you know how Connect/Express works, it's exactly the same:

**Middlewares:**

```js
app.use((message, next) => {
  if (message.payload === 'Hello!') {
    console.log('-.- Hi!');
  }
  next();
});
```

**Routes:**

```js
app.use('hello/:name', (message, next) => {
  console.log(`Hello ${message.route.params.name}!`);
  next();
});
```

**HermesRouter**

`index.js`
```js
const hello = require('./routes/hello');

app.use('hello', hello);
```

`routes/hello.js`
```js
const router = require('hermes').router();

router.use(':name', (message, next) => {
  console.log(`Hello ${message.route.params.name}!`);
  next();
});

router.use('world', (message, next) => {
  console.log(`Hello world!`);
  next();
});

router.in.client.use(':name', (message, next) => {
  message.reply('hello/response', { msg: `Hello ${message.route.params.name} from Hermes!` });
});

module.exports = router;
```

**Catch Errors**

```js
app.use((err, message, next) => {
  console.log('Handle error here...');
  next(err); // Optionally forward error to next middleware
});
```

#### app.in.client.use(...fn)
#### app.in.client.use(route, ...fn)
#### app.in.client.use(route, HermesRouter)

It's for the same purpose as `app.use` but this route/middleware will be only
executed if the message comes from the client.

```js
app.in.client.use('hello/:name', (message, next) => {
  console.log(`Hello from client, ${message.route.params.name}!`);
  next();
});
```

#### app.in.broker.use(...fn)
#### app.in.broker.use(route, ...fn)
#### app.in.broker.use(route, HermesRouter)

It's for the same purpose as `app.use` but this route/middleware will be only
executed if the message comes from the broker.

```js
app.in.broker.use('hello/:name', (message, next) => {
  console.log(`Hello from broker, ${message.route.params.name}!`);
  next();
});
```

#### app.listen()

Actually starts the application and listens for messages:

```js
app.listen();
```

### Message

#### message.stop()

It stops the message from being delivered and processed by another middleware. It other words,
this is a **full stop**. Message piping ends here.

```js
app.use('hello/:name', (message, next) => {
  // This will stop the hello/world message. Even if we call
  // next, further middlewares will not be called.
  if (message.route.params.name === 'world') message.stop();
  next();
});
```

#### message.cancelDelivery()

It cancels the delivery of the message but, unlike `message.stop()` the message will continue
passing through the next middlewares.

```js
function checkIsHelloWorld (message, next) {
  // Message will not reach the other side if its topic is hello/world.
  // If the message comes from the client it will never reach the broker and viceversa.
  // However the message will still be routed onto next middlewares, if any.
  if (message.route.params.name === 'world') return message.cancelDelivery();
}

app.use('hello/:name', checkIsHelloWorld, (message, next) => {
  console.log('You will see this even if it is hello/world. Read comments above.');
  next();
});
```

#### message.reply([[topic,] payload])

Replies back to the message sender. If the message was sent by client, it will reply to
client. If message was sent by broker, it will reply to broker. It's easy, huh?

```js
app.in.client.use('hello/:name', (message, next) => {
  if (message.route.params.name === 'world') {
    return message.reply('hello/world/response', 'Stop using hello world, please.');
  }

  next();
});
```

`topic` and `payload` arguments are both optional. Here you have a short explanation of every combination:

* `message.reply()`: It replies back to the same topic using same payload (echo).
* `message.reply(payload)`: It replies back to the same topic using the given payload.
* `message.reply(topic)`: It replies back to the the given topic using the same payload.
* `message.reply(topic, payload)`: It replies back to the the given topic using the given payload.

#### message.route.params

Object containing all the params in the message topic, i.e.:

```js
app.in.broker.use('hello/:name/:surname', (message, next) => {
  // Given the `hello/tim/burton` topic, the params will look like:
  // message.route.params = {
  //   name: 'tim',
  //   surname: 'burton'
  // }
}
});
```

## Adapters

* MQTT adapter: https://github.com/hitchhq/hermes-mqtt
* Socket.IO adapter: https://github.com/hitchhq/hermes-socketio
