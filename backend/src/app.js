
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const env = require("./config/env");
const requestId = require("./middleware/requestId");
const notFound = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { maintenanceMode } = require("./modules/settings/maintenance-mode");
const routes = require("./routes");
const apiVersion = require("./middleware/apiVersion");


const { standard } = require("./middleware/apiRateLimit");

const app = express();

if (env.TRUST_PROXY_HOPS > 0) {
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
}

// Request tracking
app.use(requestId);

// Security headers
app.use(helmet());

// Keep your existing CORS configuration
app.use(
  cors({
    origin: env.FRONTEND_URL.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);

//  General API rate limiting
app.use("/api", standard);

// Request body size limit
app.use(express.json({ limit: "1mb" }));

// Maintenance mode
app.use("/api", maintenanceMode);

// API routes
app.use("/api", routes);
app.use("/api", apiVersion);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
