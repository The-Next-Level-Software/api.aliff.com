import http from "http";

import app from "./app.js";
import init from "./startup/init.js";
import { initSocket } from "./startup/socket.js";
import { writeErrorFile } from "./utils/crashFileLogger.js";

let server;



// Uncaught sync errors
process.on("uncaughtException", async (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);

  await writeErrorFile(
    err instanceof Error ? err : new Error(JSON.stringify(err)),
    "UNCAUGHT_EXCEPTION"
  );

  process.exit(1); // Let PM2/Docker restart
});

// Unhandled promise rejections
process.on("unhandledRejection", async (reason) => {
  console.error("💥 UNHANDLED REJECTION:", reason);

  await writeErrorFile(
    reason instanceof Error ? reason : new Error(JSON.stringify(reason)),
    "UNHANDLED_REJECTION"
  );

  process.exit(1); // Crash intentionally
});

/**
 * -------------------------------------------------------
 * 🚀 START SERVER
 * -------------------------------------------------------
 */

const start = async () => {
  try {
    await init(); // DB + other initialization

    server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup Error:", err);

    await writeErrorFile(
      err instanceof Error ? err : new Error(JSON.stringify(err)),
      "STARTUP_ERROR"
    );

    process.exit(1);
  }
};

start();

/**
 * -------------------------------------------------------
 * 🔒 GRACEFUL SHUTDOWN
 * -------------------------------------------------------
 */

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("💤 Server closed.");
      process.exit(0);
    });
  }
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("============== Server closed ================");
      process.exit(0);
    });
  }
});