'use strict';

const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('hermes');
const merge = require('utils-merge');
const pathToRegexp = require('path-to-regexp');
const flatten = require('array-flatten');

/**
 * Module exports.
 * @public
 */

module.exports = Hermes;

/**
 * Module variables.
 * @private
 */

const proto = {};

/**
 * Create a new connect server.
 *
 * @return {function}
 * @public
 */

function Hermes () {
  function app (message, next) { app.handle(message, next); }
  merge(app, proto);
  merge(app, EventEmitter.prototype);
  app.in = { client: {}, broker: {} };
  app.in.broker.use = proto.inBrokerUse.bind(app);
  app.in.client.use = proto.inClientUse.bind(app);
  app.route = '*';
  app.stack = [];
  app.props = {
    brokers: [],
    clients: []
  };

  app.on('broker:message', (message) => {
    message.from = { client: false, broker: true };
    app.handle(message);
  });

  app.on('broker:ready', (adapter_info) => {
    debug(`${adapter_info.name} is ready`);
  });

  app.on('client:ready', (adapter_info) => {
    debug(`${adapter_info.name} is ready`);
  });

  app.on('client:message', (message) => {
    message.from = { client: true, broker: false };
    app.handle(message);
  });

  return app;
}

function _parseUseArgs (route) {
  let path = route;
  let callbacks;

  // default route to '*'
  if (typeof path !== 'string') {
    path = '*';
    callbacks = flatten([].slice.call(arguments, 0));
  } else {
    callbacks = flatten([].slice.call(arguments, 1));
  }

  // strip trailing slash
  if (path[path.length - 1] === '/') {
    path = path.slice(0, -1);
  }

  if (callbacks.length === 0) {
    throw new TypeError('Hermes.use() requires middleware functions');
  }

  return { path, callbacks };
}

/**
 * Utilize the given middleware `handle` to the given `route`,
 * defaulting to _*_. This "route" is the mount-point for the
 * middleware, when given a value other than _*_ the middleware
 * is only effective when that segment is present in the message's
 * topic.
 *
 * For example if we were to mount a function at _admin_, it would
 * be invoked on _admin_, and _admin/settings_, however it would
 * not be invoked for _/_, or _/posts_.
 *
 * @param {String|Function|Server} route, callback or server
 * @param {Function|Server} callback or server
 * @return {Server} for chaining
 * @public
 */
proto.use = function use () {
  const parsed_args = _parseUseArgs.apply(this, arguments);
  const path = parsed_args.path;
  const callbacks = parsed_args.callbacks;

  if (_isRouter(path, callbacks)) {
    _useRouter.call(this, path, callbacks[0], 'all');
  } else {
    _use.call(this, path, callbacks);
  }

  return this;
};

function _use (path, callbacks) {
  for (let i = 0; i < callbacks.length; i++) {
    const fn = callbacks[i];

    if (typeof fn !== 'function') {
      throw new TypeError(`Hermes.use() requires middleware function but got a ${gettype(fn)}.`);
    }

    // add the middleware
    debug('use %s %s', path, fn.name || '<anonymous>');

    this.stack.push({ route: path, handle: fn });
  }
}

function _isRouter (path, callbacks) {
  return path && callbacks.length === 1 && callbacks[0].constructor && callbacks[0].constructor.name === 'HermesRouter';
}

function _useRouter (path, router, target) {
  const middlewares = router.getMiddlewares();
  const default_target = 'all';
  target = target || default_target;

  for (const m of middlewares) {
    if (target === 'all' && m.target === 'all') this.use.apply(this, _useNamespacePath(m.arguments, path));
    if (target === 'all' && m.target === 'client') this.in.client.use.apply(this, _useNamespacePath(m.arguments, path));
    if (target === 'all' && m.target === 'broker') this.in.broker.use.apply(this, _useNamespacePath(m.arguments, path));
    if (target === 'client' && m.target === 'client') this.in.client.use.apply(this, _useNamespacePath(m.arguments, path));
    if (target === 'broker' && m.target === 'broker') this.in.broker.use.apply(this, _useNamespacePath(m.arguments, path));
  }
}

function _useNamespacePath (args, path) {
  if (args && typeof args[0] === 'string') {
    args[0] = sanitizeRoute(`${path}/${args[0]}`);
  }

  return args;
}

proto.inClientUse = function inClientUse () {
  const parsed_args = _parseUseArgs.apply(this, arguments);
  const path = parsed_args.path;
  const callbacks = parsed_args.callbacks;

  if (_isRouter(path, callbacks)) {
    _useRouter.call(this, path, callbacks[0], 'client');
  } else {
    _inClientUse.call(this, path, callbacks);
  }

  return this;
};

function _inClientUse (path, callbacks) {
  for (let i = 0; i < callbacks.length; i++) {
    const fn = callbacks[i];

    if (typeof fn !== 'function') {
      throw new TypeError(`Hermes.in.client.use() requires middleware function but got a ${gettype(fn)}.`);
    }

    // add the middleware
    debug('use %s %s', path, fn.name || '<anonymous>');

    const wrapped_fn = function (message, next) {
      if (message.from.broker) return next();
      fn.call(this, message, next);
    };
    this.stack.push({ route: path, handle: wrapped_fn });
  }
}

proto.inBrokerUse = function inBrokerUse () {
  const parsed_args = _parseUseArgs.apply(this, arguments);
  const path = parsed_args.path;
  const callbacks = parsed_args.callbacks;

  if (_isRouter(path, callbacks)) {
    _useRouter.call(this, path, callbacks[0], 'broker');
  } else {
    _inBrokerUse.call(this, path, callbacks);
  }

  return this;
};

function _inBrokerUse (path, callbacks) {
  for (let i = 0; i < callbacks.length; i++) {
    const fn = callbacks[i];

    if (typeof fn !== 'function') {
      throw new TypeError(`Hermes.in.broker.use() requires middleware function but got a ${gettype(fn)}.`);
    }

    // add the middleware
    debug('use %s %s', path, fn.name || '<anonymous>');

    const wrapped_fn = function (message, next) {
      if (message.from.client) return next();
      fn.call(this, message, next);
    };
    this.stack.push({ route: path, handle: wrapped_fn });
  }
}

/**
 * Handle server requests, punting them down
 * the middleware stack.
 *
 * @private
 */

proto.handle = function handle (message, out) {
  let index = 0;
  //let removed = '';
  const stack = this.stack;

  // final function handler
  const done = out || finalhandler.call(this, message, {
    env: process.env.NODE_ENV || 'development',
    onerror: logerror
  });

  // store the original URL
  message.original_topic = message.original_topic || message.topic;

  function next (err) {
    message.topic = sanitizeRoute(message.topic);

    /*if (removed.length !== 0) {
      message.topic = removed + message.topic;
      removed = '';
    }*/

    // next callback
    const layer = stack[index++];

    // all done
    if (!layer) {
      setImmediate(done, err);
      return;
    }

    if (next.cancelled) done.cancelled = true;

    // route data
    const path = sanitizeRoute(message.topic || '*');
    const route = sanitizeRoute(layer.route);
    const match_result = matchRoute(path, route);
    const match = match_result.matches;

    debug('Trying match %s on route %s', path, route);

    // skip this layer if the route doesn't match
    if (!match) return next(err);

    debug('%s matches %s route', path, route);

    // trim off the part of the topic that matches the route
    /*if (route.length !== 0) {
      removed = match_result.part;
    }*/

    if (match_result.params) {
      message.route = message.route || { path };
      message.route.params = match_result.params;
    }

    // call the layer handle
    call(layer.handle, route, err, message, next);
  }

  next.cancel = function () {
    next.cancelled = true;
    next();
  };

  next();
};

proto.listen = function listen () {
  for (const adapter of this.get('brokers')) {
    adapter.listen.apply(null, arguments);
  }
  for (const adapter of this.get('clients')) {
    adapter.listen.apply(null, arguments);
  }

  return this;
};

/**
 * Invoke a route handle.
 * @private
 */

function call (handle, route, err, message, next) {
  const arity = handle.length;
  let error = err;
  const hasError = Boolean(err);

  try {
    if (hasError && arity === 3) {
      // error-handling middleware
      handle(err, message, next);
      return;
    } else if (!hasError && arity < 3) {
      // request-handling middleware
      handle(message, next);
      return;
    }
  } catch (e) {
    // replace the error
    error = e;
  }

  // continue
  next(error);
}

function finalhandler (message, options) {
  const hermes = this;

  function handler (err) {
    if (err) {
      if (options.onerror) options.onerror(err, { env: options.env });
      return;
    }

    if (handler.cancelled) {
      debug('Final handler (cancelled)');
      return;
    }

    if (message.from.broker) {
      for (const adapter of hermes.get('clients')) {
        adapter.send(message);
      }
    }

    if (message.from.client) {
      for (const adapter of hermes.get('brokers')) {
        adapter.send(message);
      }
    }
  }
  return handler;
}

/**
 * Log error using console.error.
 *
 * @param {Error} err
 * @param {Object} options
 * @private
 */

function logerror (err, options) {
  if (options.env !== 'test') console.error(err.stack || err.toString());
}

/**
 * Get type for error message.
 */
function gettype (obj) {
  const type = typeof obj;

  if (type !== 'object') {
    return type;
  }

  // inspect [[Class]] for objects
  return toString.call(obj)
    .replace(/^\[object (\S+)\]$/, '$1');
}

/**
 * Adds configuration. Like `set` but for
 * properties that support multiple values.
 *
 * @param {String} property
 * @param {Any} value
 */
proto.add = function (property, value) {
  switch (property) {
  case 'broker':
    _addBroker.call(this, value);
    break;
  case 'client':
    _addClient.call(this, value);
    break;
  default:
    this.props[property] = this.props[property] || [];
    this.props[property].push(value);
  }
};

/**
 * Adds a connection to a Broker.
 *
 * @param {Function} broker adapter
 */
function _addBroker (adapter) {
  if (typeof adapter !== 'function') throw new Error('Invalid broker adapter. Adapters must be functions.');
  this.props['brokers'].push(adapter(this));
  debug('Using broker');
};

/**
 * Adds a connection to a Client.
 *
 * @param {Function} client adapter
 */
function _addClient (adapter) {
  if (typeof adapter !== 'function') throw new Error('Invalid client adapter. Adapters must be functions.');
  this.props['clients'].push(adapter(this));
  debug('Using client');
};

/**
 * Gets a configuration property.
 *
 * @param {String} property
 * @returns {Any}
 */
proto.get = function (property) {
  return this.props[property];
};

function sanitizeRoute (route) {
  route = route.replace(/[\/]{2,}/g, '/');
  if (route[0] === '/') route = route.substr(1);
  if (route[route.length-1] === '/') route = route.slice(0, -1);
  return route;
}

function matchRoute (path, route) {
  const keys = [];
  const re = pathToRegexp(route, keys);
  const result = re.exec(path);

  if (result === null) return { matches: false };

  const params = {};
  keys.map((key, i) => params[key.name] = result[i+1]);

  return { matches: true, params, part: result[0] };
}
