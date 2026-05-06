// src/startup/init.js
import { connectDB } from "../config/database.js";
import logger from "../config/logger.js";
import startCronJobs from "./cron.startup.js";

export default async function init() {
  const connection = await connectDB();

  if (!connection) {
    logger.error("❌ Failed to initialize app — DB not connected");
    process.exit(1);
  }

  logger.info("🚀 App initialization completed");

  startCronJobs();

  // Add additional initialization tasks here:
  // - Redis connection
  // - Queue initialization
  // - Cron jobs
  // - Prewarm caches
}
