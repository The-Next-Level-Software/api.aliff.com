// src/controllers/ma/onboarding.controller.js

import { StatusCodes } from "http-status-codes";

import OnboardingService from "../../services/onboarding.service.js";
import { UserProfile } from "../../startup/models.js";
import { generateApiResponse, generateErrorApiResponse } from "../../utils/response.util.js";
import logger from "../../config/logger.js";

class OnboardingController {
  // ── POST /onboarding/complete ─────────────────────────────────────────────
  static async completeOnboarding(req, res) {
    try {
      const result = await OnboardingService.completeOnboarding(req.user.id, req.body);

      if (!result.success) {
        return generateErrorApiResponse(res, result.status, result.message);
      }

      return generateApiResponse(res, StatusCodes.CREATED, "Onboarding completed successfully", {
        profile: result.profile,
      });
    } catch (err) {
      logger.error(`[MA][Onboarding][completeOnboarding] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── GET /onboarding/profile ──────────────────────────────────────────────
  static async getProfile(req, res) {
    try {
      const profile = await UserProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile)
        return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "Profile not found");

      return generateApiResponse(res, StatusCodes.OK, "Profile fetched successfully", { profile });
    } catch (err) {
      logger.error(`[MA][Onboarding][getProfile] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── PATCH /onboarding/preferences ────────────────────────────────────────
  static async updatePreferences(req, res) {
    try {
      const result = await OnboardingService.updatePreferences(req.user.id, req.body);

      if (!result.success) {
        return generateErrorApiResponse(res, result.status, result.message);
      }

      return generateApiResponse(res, StatusCodes.OK, "Preferences updated successfully", {
        profile: result.profile,
      });
    } catch (err) {
      logger.error(`[MA][Onboarding][updatePreferences] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }
}

export default OnboardingController;