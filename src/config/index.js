import dotenv from "dotenv";

// -----------------------------------------------------------------------------
// 🌍 Environment file loading
// 🔗 Note: In Docker, env variables are injected via --env-file
//    This will load from .env if present, but won't override Docker vars
// -----------------------------------------------------------------------------
dotenv.config();

const ENV = process.env.NODE_ENV || "dev";

dotenv.config({
  path: path.resolve(__dirname, `../../.env.${ENV}`),
  override: false,
});
// Fallback to .env if .env.{ENV} doesn't exist or is missing vars
dotenv.config({
  path: path.resolve(__dirname, `../../.env`),
  override: false,
});

// -----------------------------------------------------------------------------
// ⚙️ Config object
// -----------------------------------------------------------------------------
const appConfig = {
  project: {
    name: process.env.PROJECT_NAME || "MyNodeApp",
    description: process.env.PROJECT_DESCRIPTION || "Node.js Boilerplate",
    version: process.env.PROJECT_VERSION || "1.0.0",
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
  },

  server: {
    port: Number(process.env.PORT) || 5000,
    nodeEnv: ENV,
  },

  db: {
    databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/nextlevel?schema=public",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "supersecretkey",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "1h",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },

  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    fromName: process.env.EMAIL_FROM_NAME || "MyNodeApp",
    fromEmail: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER,
  },

  otp: {
    length: Number(process.env.OTP_LENGTH) || 6,
    expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
  },

  colors: {
    primary: process.env.COLOR_PRIMARY || "#1D4ED8",
    secondary: process.env.COLOR_SECONDARY || "#F59E0B",
    success: process.env.COLOR_SUCCESS || "#10B981",
    danger: process.env.COLOR_DANGER || "#EF4444",
    warning: process.env.COLOR_WARNING || "#FBBF24",
    info: process.env.COLOR_INFO || "#3B82F6",
    light: process.env.COLOR_LIGHT || "#F3F4F6",
    dark: process.env.COLOR_DARK || "#111827",
  },

  oneSignal: {
    appId: process.env.ONESIGNAL_APP_ID || "",
    apiKey: process.env.ONESIGNAL_API_KEY || "",
  },

  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "", // leave empty if no password
  REDIS_DB: process.env.REDIS_DB || 0, // optional: default DB 0

  // FILE
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET: process.env.AWS_BUCKET,
  FILE_STORAGE: process.env.FILE_STORAGE || "local",

  // CLOUDFLARE R2
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_ACCESS_KEY: process.env.CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_KEY: process.env.CLOUDFLARE_SECRET_KEY,
  CLOUDFLARE_BUCKET: process.env.CLOUDFLARE_BUCKET,
  CLOUDFLARE_PUBLIC_URL: process.env.CLOUDFLARE_PUBLIC_URL,

  // AI & IMAGE PROCESSING
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  PHOTOROOM_API_KEY: process.env.PHOTOROOM_API_KEY,

  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
  },
  backup: {
    useMongoDump: false,
  },
};

export default appConfig;
