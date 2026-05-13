// src/controllers/ma/closet.controller.js

import { StatusCodes } from "http-status-codes";

import ClosetService from "../../services/closet.service.js";
import { generateApiResponse, generateErrorApiResponse } from "../../utils/response.util.js";
import logger from "../../config/logger.js";

class ClosetController {

  // ── POST /closet/upload ───────────────────────────────────────────────────
  /**
   * Receives 1–N images, processes them (bg removal + AI tagging),
   * saves as inactive ClosetItems, returns them for user review.
   */
  static async uploadAndAnalyze(req, res) {
    try {
      const files = req.files;

      if (!files || files.length === 0)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, "At least one image is required");

      const MAX_FILES = 5;
      if (files.length > MAX_FILES)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, `Maximum ${MAX_FILES} images allowed per upload`);

      const { results, errors } = await ClosetService.uploadAndAnalyze(req.user.id, files,res);

      // All files failed
      if (results.length === 0) {
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          errors[0]?.message ?? "Failed to process images. Please retake photos in good lighting against a plain background.",
          { errors }
        );
      }

      // At least some succeeded — return what we have, include errors for the failed ones
      return generateApiResponse(
        res,
        StatusCodes.OK,
        results.length === files.length
          ? "Images processed successfully. Please review and confirm the details."
          : `${results.length} of ${files.length} images processed. See errors for the rest.`,
        { items: results, errors: errors.length ? errors : undefined }
      );
    } catch (err) {
      logger.error(`[MA][Closet][uploadAndAnalyze] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /closet/confirm ──────────────────────────────────────────────────
  /**
   * Receives array of reviewed items (edited or same), activates them.
   * Body: { items: [{ id, name, category, ...editableFields }] }
   */
  static async updateItems(req, res) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, "items array is required");

      if (items.length > 10)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, "Maximum 10 items allowed per request");

      const { updated_items, errors } = await ClosetService.updateItems(req.user.id, items);

      if (updated_items.length === 0)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, errors[0]?.message ?? "No items were updated", { errors });

      return generateApiResponse(
        res,
        StatusCodes.OK,
        updated_items.length === items.length
          ? "Items updated successfully"
          : `${updated_items.length} of ${items.length} items updated. See errors for the rest.`,
        { items: updated_items, errors: errors.length ? errors : undefined }
      );
    } catch (err) {
      logger.error(`[MA][Closet][updateItems] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }
  static async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { error, item } = await ClosetService.updateItem(req.user.id, id, req.body);

      if (error)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, error);

      return generateApiResponse(res, StatusCodes.OK, "Item updated successfully", { item });
    } catch (err) {
      logger.error(`[MA][Closet][updateItem] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  static async getClosetItems(req, res) {
    try {
      const { error, items, meta } = await ClosetService.getClosetItems(req.user.id, req.query);
      if (error)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, error);
      return generateApiResponse(res, StatusCodes.OK, "Closet items fetched", { items, meta });
    } catch (err) {
      logger.error(`[MA][Closet][getClosetItems] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  static async getClosetItemById(req, res) {
    try {
      const item = await ClosetService.getClosetItemById(req.user.id, req.params.id);
      if (!item)
        return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "Item not found");
      return generateApiResponse(res, StatusCodes.OK, "Closet item fetched", { item });
    } catch (err) {
      logger.error(`[MA][Closet][getClosetItemById] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  static async deleteItems(req, res) {
    try {
      const { ids } = req.body;

      const { error, deleted, errors } = await ClosetService.deleteItems(req.user.id, ids);

      if (error)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, error);

      if (deleted.length === 0)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, errors[0]?.message ?? "No items were deleted", { errors });

      return generateApiResponse(
        res,
        StatusCodes.OK,
        deleted.length === ids.length
          ? "Items deleted successfully"
          : `${deleted.length} of ${ids.length} items deleted. See errors for the rest.`,
        { deleted, errors: errors.length ? errors : undefined }
      );
    } catch (err) {
      logger.error(`[MA][Closet][deleteItems] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

}

export default ClosetController;