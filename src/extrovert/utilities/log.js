define(function() {
  /**
  Message logger from http://stackoverflow.com/a/25867340.
  @class log
  */
  return {
    msg: function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = 'EXTRO: ' + args[0];
      console.log.apply(console, args);
    },
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = 'EXTRO: ' + args[0];
      console.warn.apply(console, args);
    },
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = 'EXTRO: ' + args[0];
      console.error.apply(console, args);
    }
  };

});