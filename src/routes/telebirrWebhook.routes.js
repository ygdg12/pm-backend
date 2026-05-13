const express = require("express");
const { telebirrWebhook } = require("../controllers/payment.controller");

const router = express.Router();

// Body parsing is handled by app.js via express.raw so we can verify webhook signatures.
router.post("/", telebirrWebhook);

module.exports = router;

