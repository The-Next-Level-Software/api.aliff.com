// src/routes/outfit.routes.js

import { Router } from "express";
import OutfitController from "../../controllers/ma/outfit.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";


const router = Router();

// All outfit routes require authentication
router.use(authMiddleware());

/**
 * POST /api/outfit/style
 *
 * Generate an outfit suggestion for the authenticated user.
 *
 * Body:
 * {
 *   selectedItemId?: string,   // closet item id to build outfit around (optional)
 * }
 */
router.post("/style", OutfitController.generateOutfit);

/**
 * POST /api/outfit/feedback
 *
 * Submit feedback on an outfit suggestion.
 *
 * Body:
 * {
 *   suggestionId: string,      // required
 *   action: string,            // required — "ACCEPTED" | "REJECTED" | "SWAPPED"
 *   swapItemId?: string        // required only when action = "SWAPPED"
 *                              // this is the closetItemId the user wants replaced
 * }
 *
 * On ACCEPTED / REJECTED → saves to OutfitHistory, returns feedback record
 * On SWAPPED → saves to OutfitHistory, calls AI for swap, returns new OutfitSuggestion
 */
router.post("/feedback", OutfitController.submitFeedback);
router.get("/history", OutfitController.getOutfitHistory);

export default router;