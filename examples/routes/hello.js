const router = require('../../lib/router')();

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

/*router.in.client.use(':name', (message, next) => {
  message.body = { msg: `Hello ${message.route.params.name} from Hermes!` };
  message.source.send();
  next.cancel();
});

router.in.broker.use(':name', (message, next) => {
  message.body = { msg: `Hello ${message.route.params.name} from Hermes!` };
  message.source.send();
  next.cancel();
});*/

module.exports = router;
