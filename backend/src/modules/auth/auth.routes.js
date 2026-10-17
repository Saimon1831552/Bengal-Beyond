const express = require("express");
const validate = require("../../middleware/validate");
const authRateLimit = require("../../middleware/authRateLimit");

const { registerBody, loginBody } = require("./auth.schema");
const lifecycleSchemas = require("./lifecycle.schema");
const controller = require("./auth.controller");
const lifecycleController = require("./lifecycle.controller");

const router = express.Router();

// Registration and login
router.post(
  "/register",
  authRateLimit,
  validate({ body: registerBody }),
  controller.register
);

router.post(
  "/login",
  authRateLimit,
  validate({ body: loginBody }),
  controller.login
);

// Existing session endpoints
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

// Email verification and password reset
router.post(
  "/request-verification",
  authRateLimit,
  validate({ body: lifecycleSchemas.emailBody }),
  lifecycleController.requestVerification
);

router.post(
  "/verify-email",
  validate({ body: lifecycleSchemas.tokenBody }),
  lifecycleController.verifyEmail
);

router.post(
  "/request-password-reset",
  authRateLimit,
  validate({ body: lifecycleSchemas.emailBody }),
  lifecycleController.requestPasswordReset
);

router.post(
  "/reset-password",
  authRateLimit,
  validate({ body: lifecycleSchemas.resetBody }),
  lifecycleController.resetPassword
);

module.exports = router;
