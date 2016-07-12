function HermesRouter () {
  this.middlewares = [];

  this.use = addMiddleware.bind(this, 'all');
  this.in = { client: {}, broker: {} };
  this.in.client.use = addMiddleware.bind(this, 'client');
  this.in.broker.use = addMiddleware.bind(this, 'broker');

  this.getMiddlewares = () => {
    return this.middlewares;
  };
};

function addMiddleware (target) {
  const args = [].slice.call(arguments, 1);

  this.middlewares.push({
    target: target || 'all',
    arguments: [].slice.call(args)
  });
}

module.exports = function () {
  return new HermesRouter();
};
