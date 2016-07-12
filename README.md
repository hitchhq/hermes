![](./hermes.jpg)

**Hermes is a real-time messaging framework**. It lets you connect a client with a
broker and manage all the communication in between.

## Installation

```
npm install --save hermesjs
```

## Features

* Express-like Routing and middlewares.
* Forwarding messages from **Client** to **Broker** and viceversa.
* Cancel the forwarding (message will continue passing through middlewares, if any).
* Cancel the message (message will not continue passing through middlewares).
* Answer back to client or broker, using same or different topic and payload.

## Getting Started

### Example: Simple router
```js
app.use('hello/:name', (message, next) => {
  // Do whatever here...
  next();
});
```

### Example: Using multiple route handlers
```js
function checkIsHelloWorld (message, next) {
  // Message will not reach the other side if it's hello/world.
  // By calling next.cancel(), if the message comes from the client
  // it will not reach the broker and viceversa. However the message will
  // still be routed onto next middlewares, if any.
  if (message.route.params.name === 'world') return next.cancel();
}

app.use('hello/:name', checkIsHelloWorld, (message, next) => {
  console.log('You will see this even if it is hello/world. Read comments above.');
  next();
});
```

### Example: Using routes only for messages from the broker

A message from broker, with `hello/:name` topic, is received:

```js
app.in.broker.use('hello/:name', (message, next) => {
  console.log(`Broker sent 'hello/${message.route.params.name}'`);
  next(); // Forward message to client
});
```

### Example: Using routes only for messages from the client

A message from client, with `hello/:name` topic, is received:

```js
app.in.client.use('hello/:name', (message, next) => {
  console.log(`Client sent 'hello/${message.route.params.name}'`);
  next(); // Forward message to broker
});
```

### Example: Cancelling messages

```js
app.use('hello/:name', (message, next) => {
  // This will cancel the hello/world message. Even if we call
  // next, further middlewares will not be called.
  if (message.route.params.name === 'world') message.cancel();
  next();
});
```

### Example: Replying back

A message from client, with `hello/:name` topic, is received:

```js
app.in.client.use('hello/:name', (message, next) => {
  if (message.route.params.name === 'world') {
    return message.reply('hello/world/response', 'Stop using hello world, please.');
  }

  next();
});
```

A message saying `Stop using hello world, please.` is sent back to client,
on `hello/world/response` topic. **Note**: When replying the message is automatically
cancelled, so it will not reach further middlewares/routes.

### Use Express-like router to organize your code

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

### Use a global middleware

```js
app.use((message, next) => {
  console.log('Handle message here...');
  next(); // Forward message
});
```

### Catch errors

```js
app.use((err, message, next) => {
  console.log('Handle error here...');
  next(err); // Optionally forward error to next middleware
});
```
