const express = require("express");
const { downloadFile } = require("../controllers/files.controller");

const router = express.Router();

router.get("/:id", downloadFile);

module.exports = router;

