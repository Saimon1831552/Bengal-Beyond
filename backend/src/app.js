const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const env = require("./config/env");
const requestId = require("./middleware/requestId");
const notFound = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

if (env.TRUST_PROXY_HOPS > 0) {
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
}

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;