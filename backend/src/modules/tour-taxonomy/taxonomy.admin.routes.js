const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./taxonomy.controller");
const router = express.Router();

for (const [path, handlers] of [["categories", controller.categories], ["tags", controller.tags]]) {
  router.get(`/${path}`, asyncHandler(handlers.list));
  router.get(`/${path}/:id`, asyncHandler(handlers.get));
  router.post(`/${path}`, asyncHandler(handlers.create));
  router.patch(`/${path}/:id`, asyncHandler(handlers.update));
  router.delete(`/${path}/:id`, asyncHandler(handlers.remove));
}
router.put("/tours/:tourId/taxonomy", asyncHandler(controller.assign));
module.exports = router;
