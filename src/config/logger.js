// src/config/logger.js
import chalk from "chalk";
import pino from "pino";

const ENV = process.env.NODE_ENV || "development";

const SHOW_CONSOLES = ENV === "development" || ENV === "test";

// -----------------------------------------------------------------------------
// 🧱 Base Pino Logger (for performance and timestamping)
// -----------------------------------------------------------------------------
const baseLogger = pino({
  level: SHOW_CONSOLES ? "debug" : "info",
  transport: SHOW_CONSOLES
    ? {
        target: "pino-pretty",
        options: {
          colorize: false, // we'll handle our own colors via chalk
          // translateTime: "SYS:standard",
          ignore: "pid,hostname,time,level",
        },
      }
    : undefined,
});

// -----------------------------------------------------------------------------
// 🎨 Custom Color & Format Styling
// -----------------------------------------------------------------------------
const colors = {
  INFO: chalk.blueBright,
  DEBUG: chalk.magentaBright,
  WARN: chalk.yellowBright,
  ERROR: chalk.redBright,
};

/**
 * Formats message with or without segment borders.
 */
const formatMessage = (label, message, showSegment = false) => {
  const color = colors[label.toUpperCase()] || ((t) => t);
  if (!showSegment) return color(message);

  const upper = color(`============= ${label.toUpperCase()} =============`);
  const lower = color(`=============/ ${label.toUpperCase()} =============`);
  return `\n${upper}\n${color(message)}\n${lower}\n`;
};

// -----------------------------------------------------------------------------
// 🧩 Custom Wrapped Logger API
// -----------------------------------------------------------------------------
const logger = {
  info: (msg, segment = false) => baseLogger.info(formatMessage("INFO", msg, segment)),
  debug: (msg, segment = false) => baseLogger.debug(formatMessage("DEBUG", msg, segment)),
  warn: (msg, segment = false) => baseLogger.warn(formatMessage("WARN", msg, segment)),
  error: (msg, segment = false) => baseLogger.error(formatMessage("ERROR", msg, segment)),
};

export default logger;
