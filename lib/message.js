function HermesMessage (options) {
  const keys = Object.keys(options);

  for (var i = keys.length-1; i; i--) {
    this[keys[i]] = options[keys[i]];
  }
}

HermesMessage.prototype.cancel = function cancel () {
  this.cancelled = true;
};

HermesMessage.prototype.reply = function reply () {
  if (arguments.length === 1) {
    this.payload = arguments[0];
  } else if (arguments.length === 2) {
    if (typeof arguments[0] !== 'string') return console.error('HermesMessage.reply(topic, payload): topic must be a string.');
    this.topic = arguments[0];
    this.payload = arguments[1];
  }

  this.cancel();
  this.send();
};

module.exports = HermesMessage;
