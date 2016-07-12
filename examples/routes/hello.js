const router = require('hermes-router')();

router.in.client.use(':name', (message, next) => {
  console.log(`Hello from Client ${message.route.params.name}!`);
  next();
});

router.in.broker.use(':name', (message, next) => {
  console.log(`Hello from Broker ${message.route.params.name}!`);
  next();
});

router.use('world', (message, next) => {
  console.log('Hello world!');
  next();
});

router.in.client.use(':name', (message) => {
  // Optionally use topic and payload to reply
  message.reply('hello/response', { msg: `Hello ${message.route.params.name} from Hermes!` });
});

module.exports = router;
