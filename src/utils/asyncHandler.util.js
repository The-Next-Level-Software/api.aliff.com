// import mongoose from "mongoose";
// import { generateErrorApiResponse } from "./utilities.service.js"; // or response.util.js
// import logger from '../config/logger.js';

// /**
//  * Universal async handler for Express routes
//  * Provides automatic and descriptive error handling for Mongo/Mongoose
//  */
// export const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         return await fn(req, res, next);
//     } catch (error) {
//         logger.error(`❌ [AsyncHandler] Caught error:`, error);

//         let statusCode = 500;
//         let message = "An unexpected error occurred.";
//         let data = {};

//         // ==========================
//         // 🔹 Mongo Duplicate Key Error
//         // ==========================
//         if (error?.code === 11000) {
//             const field = Object.keys(error.keyPattern || {})[0];
//             const value = error.keyValue?.[field];
//             message = `A record with ${field} "${value}" already exists. Please use a different ${field}.`;
//             statusCode = 409;
//         }
//         // ==========================
//         // 🔹 Validation Errors
//         // ==========================
//         else if (error instanceof mongoose.Error.ValidationError) {
//             message = Object.values(error.errors).map(e => e.message).join(", ");
//             statusCode = 400;
//         }
//         // ==========================
//         // 🔹 Cast / ObjectId Error
//         // ==========================
//         else if (error instanceof mongoose.Error.CastError) {
//             message = `Invalid ${error.path}: "${error.value}".`;
//             statusCode = 400;
//         }
//         // ==========================
//         // 🔹 Not Found Error
//         // ==========================
//         else if (error.name === "DocumentNotFoundError") {
//             message = "The requested record was not found.";
//             statusCode = 404;
//         }
//         // ==========================
//         // 🔹 Structural / Integrity Errors
//         // ==========================
//         else if (["StrictModeError", "VersionError", "OverwriteModelError"].includes(error.name)) {
//             message = "A database consistency error occurred.";
//             statusCode = 409;
//         }
//         // ==========================
//         // 🔹 Network / Connectivity Errors
//         // ==========================
//         else if (["MongoNetworkError", "MongooseServerSelectionError"].includes(error.name)) {
//             message = "Unable to connect to the database. Please try again later.";
//             statusCode = 503;
//         }
//         else if (error.name === "MongoTimeoutError") {
//             message = "Database request timed out. Please try again.";
//             statusCode = 504;
//         }
//         // ==========================
//         // 🔹 General Mongoose or App Errors
//         // ==========================
//         else if (error instanceof mongoose.Error) {
//             message = error.message || "A database error occurred.";
//         } else if (error.message) {
//             message = error.message;
//         }

//         // Include full error object in development mode
//         if (process.env.NODE_ENV === "development") {
//             data.error = error;
//         }

//         // ==========================
//         // 🔹 Return unified response
//         // ==========================
//         return generateErrorApiResponse(res, statusCode, message, data, false);
//     }
// };
