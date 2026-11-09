// Use for routes/controllers if you are not already using the project's asyncHandler.
module.exports = function asyncRoute(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
