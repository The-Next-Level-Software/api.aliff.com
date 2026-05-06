import { StatusCodes } from "http-status-codes";

import logger from "../config/logger.js";

/**
 * Unified API response generator
 * Handles both success and error responses in a clean, consistent format.
 *
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {object} [data={}] - Optional response data
 * @param {boolean} [isSuccess] - Explicit success flag (auto-detected if not provided)
 */
export function generateApiResponse(res, statusCode, message, data = {}, isSuccess) {
  const success =
    typeof isSuccess === "boolean" ? isSuccess : statusCode >= 200 && statusCode < 300;

  return res.status(statusCode).json({
    statusCode,
    isSuccess: success,
    message,
    ...data,
  });
}

/**
 * Unified API error response generator
 * Uses the same signature as generateApiResponse
 *
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string|Error} message - Error message
 * @param {object} [data={}] - Optional additional data
 * @param {boolean} [isSuccess=false] - Explicit success flag (default false)
 */
export function generateErrorApiResponse(res, statusCode, message, data = {}, isSuccess = false) {
  const msg = message instanceof Error ? message.message : message;

  return res.status(statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    statusCode: statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    isSuccess,
    message: msg,
    ...data,
  });
}
