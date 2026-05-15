// src/controllers/outfit.controller.js

import OutfitService from "../../services/outfit.service.js";

class OutfitController {

  /**
   * POST /api/outfit/style
   * Body: { selectedItemId, occasion, eventContext, womenOnly, desiredVibe, userNote }
   */
  static async generateOutfit(req, res) {
    const userId = req.user.id;
    const { selectedItemId } = req.body;

    const result = await OutfitService.generateOutfit(userId, { selectedItemId });

    if (result.error)
      return res.status(400).json({ statusCode: 400, isSuccess: false, message: result.error });

    return res.status(200).json({
      statusCode: 200,
      isSuccess:  true,
      message:    "Outfit generated successfully",
      data:       result.suggestion,
    });
  }

  /**
   * POST /api/outfit/feedback
   * Body: { suggestionId, action, swapItemId? }
   *
   * action: "ACCEPTED" | "REJECTED" | "SWAPPED"
   * swapItemId: required only when action = "SWAPPED" — the closetItemId to replace
   */
  static async submitFeedback(req, res) {
    const userId = req.user.id;
    const { suggestionId, action, swapItemId } = req.body;

    if (!suggestionId)
      return res.status(400).json({ statusCode: 400, isSuccess: false, message: "suggestionId is required" });

    if (!action)
      return res.status(400).json({ statusCode: 400, isSuccess: false, message: "action is required" });

    const result = await OutfitService.submitFeedback(userId, { suggestionId, action, swapItemId });

    if (result.error)
      return res.status(400).json({ statusCode: 400, isSuccess: false, message: result.error });

    // Different response shape for swap (returns new outfit) vs accept/reject
    if (result.swapped) {
      return res.status(200).json({
        statusCode: 200,
        isSuccess:  true,
        message:    "Item swapped successfully. Here is your updated outfit.",
        data:       result,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      isSuccess:  true,
      message:    action === "ACCEPTED" ? "Outfit saved to your history." : "Outfit dismissed.",
      data:       result.feedback,
    });
  }
}

export default OutfitController;