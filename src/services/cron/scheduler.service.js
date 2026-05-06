import cron from "node-cron";
import logger from "../../config/logger.js";
import { CRON_CONFIG } from "../../config/cron.config.js";

export const initCronJobs = () => {
  logger.info("⏰ Initializing cron jobs...");


  logger.info("✅ Cron jobs initialized");
};
