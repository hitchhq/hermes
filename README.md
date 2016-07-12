![](./hermes.jpg)

**Hermes is a real-time messaging framework**. It lets you connect a client with a
broker and manage all the communication in between.

## Installation

```
npm install --save hermes
```

## Features

1. Routing and middlewares (Express-like)
2. Forwarding messages from **Client** to **Broker** and viceversa.
3. Cancel the forwarding (message will continue passing through middlewares, if any).
4. Cancel the message (message will not continue passing through middlewares).
5. Answer back to client or broker, using same or different topic and payload.

## Getting Started

To be done...

## API

### Example 1
```js
app.use('hello/:name', (message, next) => {
  // Do whatever here...
  next();
});
```

### Example 2
```js
function avoidFromBroker (message, next) {
  if (message.from.broker) return next();
}

app.use('hello/:name', avoidFromBroker, (message, next) => {
  // Do whatever here...
  next();
});
```

### Example 3
```js
function avoidFromClient (message, next) {
  if (message.from.client) return next();
}

app.use('hello/:name', avoidFromClient, (message, next) => {
  // Do whatever here...
  next();
});
```

### Example 4

A message from broker, with `hello/:name` topic, is received:

```js
app.in.broker.use('hello/:name', (message, next) => {
  console.log(`Broker sent 'hello/${message.route.params.name}'`);
  next(); // Forward message to client
});
```

### Example 5

A message from client, with `hello/:name` topic, is received:

```js
app.in.client.use('hello/:name', (message, next) => {
  console.log(`Client sent 'hello/${message.route.params.name}'`);
  next(); // Forward message to broker
});
```

### Use Express-like router

`index.js`
```js
const hello = require('./routes/hello');

app.in.client.use('hello', hello);
```

`routes/hello.js`
```js
const hermes = require('hermes');
const router = hermes.Router();

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

router.in.broker.use(':name', (message, next) => {
  message.reply({ msg: `Hello ${message.route.params.name} from Hermes!` });
});

module.exports = router;
```

### Use a global middleware

```js
app.use((message, next) => {
  console.log('Handle message here...');
  next(); // Forward message to broker
});
```

### Catch errors

```js
app.use((err, message, next) => {
  console.log('Handle error here...');
  next(err); // Optionally forward error to next middleware
});
```
