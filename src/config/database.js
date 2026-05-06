// src/config/database.js
import { PrismaClient } from "@prisma/client";
import appConfig from "./index.js";
import logger from "./logger.js";

const {
  server: { nodeEnv: ENV },
} = appConfig;

// Create Prisma Client instance
const prisma = new PrismaClient({
  log: ENV === "dev" ? ["query", "info", "warn", "error"] : ["error"],
});

/**
 * Connects to PostgreSQL using Prisma.
 * Tests the connection and handles errors.
 */
export const connectDB = async () => {
  try {
    logger.warn(`🚀 Connecting to PostgreSQL (${ENV})...`);

    // Test the connection
    await prisma.$connect();
    
    // Verify connection with a simple query
    await prisma.$queryRaw`SELECT 1`;

    logger.info("✅ PostgreSQL Connected Successfully", true);
    return prisma;
  } catch (err) {
    logger.error(`❌ PostgreSQL Connection Error: ${err.message}`);

    if (ENV === "dev") {
      logger.warn("⏳ Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }

    return null;
  }
};

// -----------------------------------------------------------------------------
// 🧩 Graceful Shutdown
// -----------------------------------------------------------------------------
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  logger.info("🔒 PostgreSQL connection closed due to app termination");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  logger.info("🔒 PostgreSQL connection closed due to app termination");
  process.exit(0);
});

export default prisma;
