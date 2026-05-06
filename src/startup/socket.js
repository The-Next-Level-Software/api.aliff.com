import { Server } from "socket.io";

import logger from "../config/logger.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // set specific origins in production
    },
  });

  io.on("connection", (socket) => {
    logger.info(`⚡ Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.warn(`⚠️ Client disconnected: ${socket.id}`);
    });

    // Example event
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  logger.info("📡 Socket.IO initialized");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
