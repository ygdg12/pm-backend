const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const runtimeEnv = {
  ...process.env,
  // Render users often provide DATABASE_URL; allow it as fallback.
  MONGODB_URI: process.env.MONGODB_URI || process.env.DATABASE_URL,
};

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().optional().default("development"),

  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().optional().default("7d"),

  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  CORS_ORIGIN: z.string().optional().default("*"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().optional().default(20 * 1024 * 1024),

  TELEBIRR_WEBHOOK_SECRET: z.string().optional().default(""),

  /** Prefer `CLOUDINARY_URL` from the dashboard; or set the three vars below. */
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(runtimeEnv);
if (!parsed.success) {
  // Fail fast on missing configuration
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables:", parsed.error.flatten());
  process.exit(1);
}

module.exports = { env: parsed.data };

