const { createApp } = require("./app");
const { env } = require("./config/env");
const { connectDb } = require("./config/db");
const { seedAdminUser } = require("./bootstrap/seedAdmin");

async function start() {
  await connectDb(env.MONGODB_URI);
  await seedAdminUser();

  const app = createApp();

  const port = env.PORT;
  app.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on ${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});

