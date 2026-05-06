import { Prisma } from "@prisma/client";

import logger from "../config/logger.js";
import { generateErrorApiResponse } from "../utils/response.util.js";
import { StringUtils } from "../utils/string.util.js";
import { writeErrorFile } from "../utils/crashFileLogger.js";

const errorMiddleware = (err, req, res, next) => {
  logger.error(`❌ Error code: ${err.code}`);
  logger.error(`❌ [GlobalError] ${err.stack || err}`);

  let statusCode = 500;
  let message = "An unexpected error occurred.";
  let data = {};

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    message = `${StringUtils.capitalize(field)} already exists.`;
    statusCode = 409;
  }
  // Prisma validation error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Invalid data provided.";
    statusCode = 400;
  }
  // Prisma record not found
  else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    message = "Record not found.";
    statusCode = 404;
  }
  // Use custom message if present
  else if (err.message) {
    message = err.message;
  }

  // Include error object in development mode
  if (process.env.NODE_ENV === "development") {
    data.error = err;
  }

  if (statusCode >= 500) {
    writeErrorFile(err, "API_500_ERROR");
  }

  logger.warn(`ERROR: ${data}`);

  return generateErrorApiResponse(res, statusCode, message, data, false);
};

export default errorMiddleware;
