const { seedAdmin } = require("../services/auth.service");
const { env } = require("../config/env");

async function seedAdminUser() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  await seedAdmin({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
}

module.exports = { seedAdminUser };

