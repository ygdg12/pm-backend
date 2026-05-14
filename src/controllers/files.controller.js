const mongoose = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");
const { openDownloadStream, getFileMeta } = require("../services/gridfs.service");
const { notFound, badRequest } = require("../utils/httpError");

/** Legacy downloads for files stored in MongoDB GridFS before Cloudinary. New uploads return HTTPS URLs directly. */
const downloadFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sid = String(id);
  if (!/^[a-fA-F0-9]{24}$/.test(sid) || !mongoose.Types.ObjectId.isValid(sid)) {
    throw badRequest(
      "Invalid legacy file id. New uploads use Cloudinary: open the `photoUrl`, `proofUrl`, `images[]`, etc. URLs returned by the API."
    );
  }

  const meta = await getFileMeta(sid);
  if (!meta) throw notFound("File not found");

  res.setHeader("Content-Type", meta.contentType || "application/octet-stream");
  res.setHeader("Content-Length", meta.length);

  const stream = openDownloadStream(sid);
  stream.on("error", () => {
    res.status(404).end();
  });
  stream.pipe(res);
});

module.exports = { downloadFile };
