const express = require("express");
const validate = require("../../middleware/validate");
const authRateLimits = require("../../middleware/authRateLimit");

const { registerBody, loginBody } = require("./auth.schema");
const lifecycleSchemas = require("./lifecycle.schema");
const controller = require("./auth.controller");
const lifecycleController = require("./lifecycle.controller");

const router = express.Router();

// Registration and login
router.post(
  "/register",
  authRateLimits.register,
  validate({ body: registerBody }),
  controller.register
);

router.post(
  "/login",
  authRateLimits.login,
  validate({ body: loginBody }),
  controller.login
);

// Existing session endpoints
router.post("/refresh", authRateLimits.refresh, controller.refresh);
router.post("/logout", controller.logout);

// Email verification and password reset
router.post(
  "/request-verification",
  authRateLimits.requestVerification,
  validate({ body: lifecycleSchemas.emailBody }),
  lifecycleController.requestVerification
);

router.post(
  "/verify-email",
  authRateLimits.verifyEmail,
  validate({ body: lifecycleSchemas.tokenBody }),
  lifecycleController.verifyEmail
);

router.post(
  "/request-password-reset",
  authRateLimits.requestPasswordReset,
  validate({ body: lifecycleSchemas.emailBody }),
  lifecycleController.requestPasswordReset
);

router.post(
  "/reset-password",
  authRateLimits.resetPassword,
  validate({ body: lifecycleSchemas.resetBody }),
  lifecycleController.resetPassword
);

module.exports = router;
