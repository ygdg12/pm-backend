const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/auth.routes");
const propertyRoutes = require("./routes/property.routes");
const leaseRoutes = require("./routes/lease.routes");
const complaintRoutes = require("./routes/complaint.routes");
const paymentRoutes = require("./routes/payment.routes");
const telebirrWebhookRoutes = require("./routes/telebirrWebhook.routes");
const filesRoutes = require("./routes/files.routes");
const adminRoutes = require("./routes/admin.routes");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: env.CORS_ORIGIN !== "*",
    })
  );

  app.use(morgan("dev"));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
    })
  );

  app.get("/health", (req, res) => res.json({ ok: true }));

  // Telebirr webhook must be parsed as raw bytes for signature verification.
  app.use(
    "/api/payments/telebirr/webhook",
    express.raw({ type: "*/*", limit: "2mb" }),
    telebirrWebhookRoutes
  );

  app.use(express.json({ limit: env.UPLOAD_MAX_BYTES }));

  app.use("/api/auth", authRoutes);
  app.use("/api/properties", propertyRoutes);
  app.use("/api/leases", leaseRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/files", filesRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

