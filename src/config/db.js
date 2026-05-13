const mongoose = require("mongoose");

async function connectDb(mongoUri) {
  if (!mongoUri) throw new Error("MONGODB_URI is required");

  // Mongoose will handle reconnection; keep connection options explicit for clarity.
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || undefined,
    autoIndex: process.env.NODE_ENV !== "production",
    maxPoolSize: 10,
  });

  return mongoose.connection;
}

module.exports = { connectDb };

