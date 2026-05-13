const { asyncHandler } = require("../utils/asyncHandler");
const { openDownloadStream, getFileMeta } = require("../services/gridfs.service");
const { notFound } = require("../utils/httpError");

const downloadFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const meta = await getFileMeta(id);
  if (!meta) throw notFound("File not found");

  res.setHeader("Content-Type", meta.contentType || "application/octet-stream");
  res.setHeader("Content-Length", meta.length);

  const stream = openDownloadStream(id);
  stream.on("error", () => {
    res.status(404).end();
  });
  stream.pipe(res);
});

module.exports = { downloadFile };

