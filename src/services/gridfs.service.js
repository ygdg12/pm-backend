const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

function getBucket(bucketName = "uploads") {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongo connection is not ready");
  return new GridFSBucket(db, { bucketName });
}

function uploadBufferToGridFS({ buffer, filename, contentType, bucketName = "uploads" }) {
  const bucket = getBucket(bucketName);
  const uploadStream = bucket.openUploadStream(filename, { contentType });

  return new Promise((resolve, reject) => {
    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

function openDownloadStream(fileId, bucketName = "uploads") {
  const bucket = getBucket(bucketName);
  return bucket.openDownloadStream(fileId instanceof ObjectId ? fileId : new ObjectId(fileId));
}

async function getFileMeta(fileId, bucketName = "uploads") {
  const db = mongoose.connection.db;
  const filesCol = db.collection(`${bucketName}.files`);
  return filesCol.findOne({ _id: fileId instanceof ObjectId ? fileId : new ObjectId(fileId) });
}

module.exports = { uploadBufferToGridFS, openDownloadStream, getFileMeta };

