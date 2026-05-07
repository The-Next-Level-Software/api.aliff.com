// src/routes/ma/onboarding.route.js

import express from "express";

import OnboardingController from "../../controllers/ma/onboarding.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

// All onboarding routes are protected
router.use(authMiddleware());

router.get("/profile", OnboardingController.getProfile);
router.post("/complete", validate(["displayName"]), OnboardingController.completeOnboarding);
router.patch("/preferences", OnboardingController.updatePreferences);

export default router;