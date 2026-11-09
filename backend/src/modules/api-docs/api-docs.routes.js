const express = require('express');
const router = express.Router();
const spec = require('./openapi');

// JSON spec is public by design; hide/secure it in production if your policy requires.
router.get('/openapi.json', (req, res) => res.json(spec));

// Lightweight built-in docs page avoids introducing a runtime dependency.
// Swagger UI can be added later if the project already has an approved static asset policy.
router.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bengal Beyond API Docs</title>
<style>body{font:16px system-ui;max-width:900px;margin:48px auto;padding:0 20px;color:#18212f}a{color:#126b5c}code{background:#f1f5f9;padding:3px 6px;border-radius:4px}.muted{color:#64748b}</style></head>
<body><h1>Bengal Beyond API</h1><p class="muted">Backend API reference</p>
<p>OpenAPI specification: <a href="/api/docs/openapi.json"><code>/api/docs/openapi.json</code></a></p>
<p>Base URL: <code>/api</code></p><h2>Health</h2><ul><li><code>GET /api/health</code> — liveness</li><li><code>GET /api/health/ready</code> — database readiness</li></ul>
<h2>Customer payments</h2><ul><li><code>GET /api/customer/payments</code></li><li><code>GET /api/customer/payments/:paymentId</code></li><li><code>POST /api/customer/bookings/:bookingId/payments</code></li></ul>
<h2>Payment webhooks</h2><ul><li><code>POST /api/webhooks/sslcommerz/ipn</code> — gateway callback</li></ul>
<h2>Admin webhook operations</h2><ul><li><code>GET /api/admin/payment-webhooks/events</code></li><li><code>POST /api/admin/payment-webhooks/events/:eventId/retry</code></li></ul>
<p class="muted">Only endpoints confirmed in the installed backend modules are documented here. Extend openapi.js as additional routes are installed.</p></body></html>`);
});
module.exports = router;
