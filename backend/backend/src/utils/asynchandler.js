// Lets route handlers be `async` without try/catch: rejected promises go to errorHandler.
module.exports = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);