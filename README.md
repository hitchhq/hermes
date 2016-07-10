# Hermes

## Use Cases

**Case 1:**
Forward messages in both directions, and use routes and middlewares.

**Case 2:**
Forward messages from client to broker, and use routes and middlewares.

**Case 3:**
Forward messages from broker to client, and use routes and middlewares.

**Case 4:**
Don't forward messages. Just listen broker, and use routes and middlewares.

**Case 5:**
Don't forward messages. Just listen client, and use routes and middlewares.

## Features

1. Routing and middlewares (Express-like)
2. Forwarding messages from **Client** to **Broker** and viceversa (ability to cancel it from middlewares/routes)


## Architecture

Client <---------> Hermes <---------> Broker

## Installation

```
npm install --save hermes
```

## Getting Started

To be done...

## API

### Case 1
```js
app.use('hello/:name', (message, next) => {
  // Do whatever here...
  next();
});
```

### Case 2
```js
function avoidFromBroker (message, next) {
  if (message.from.broker) return next.cancel();
}

app.use('hello/:name', avoidFromBroker, (message, next) => {
  // Do whatever here...
  next();
});
```

### Case 3
```js
function avoidFromClient (message, next) {
  if (message.from.client) return next.cancel();
}

app.use('hello/:name', avoidFromClient, (message, next) => {
  // Do whatever here...
  next();
});
```

### Case 4

A message from broker, with `hello/:name` topic, is received:

```js
app.in.broker.use('hello/:name', (message, next) => {
  console.log(`Broker sent 'hello/${message.route.params.name}'`);
  next(); // Forward message to client
});
```

### Case 5

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
  message.body = { msg: `Hello ${message.route.params.name} from Hermes!` };
  message.source.send(); // Reply back to client
  next.cancel(); // Do not forward message
});

router.in.broker.use(':name', (message, next) => {
  message.body = { msg: `Hello ${message.route.params.name} from Hermes!` };
  message.source.send(); // Reply back to broker
  next.cancel(); // Do not forward message
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
