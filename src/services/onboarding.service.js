// src/services/onboarding.service.js

import prisma from "../config/prisma.js";

// ── Enum whitelists (mirrors schema.prisma exactly) ───────────────────────────
const VALID_STYLE_GOALS      = ["OUTFIT_IDEAS", "CURATE_ELEGANT", "FEEL_CONFIDENT", "REFINE_STYLE"];
const VALID_BODY_SHAPES      = ["HOURGLASS", "PEAR", "APPLE", "RECTANGLE", "INVERTED_TRIANGLE", "PREFER_NOT_TO_SAY"];
const VALID_HEIGHT_RANGES    = ["PETITE", "AVERAGE", "TALL"];
const VALID_COVERAGE_LEVELS  = ["HIJABI", "NON_HIJABI"];
const VALID_MODESTY_LEVELS   = ["FULL", "MODERATE", "RELAXED"];
const VALID_FIT_PREFS        = ["LOOSE", "STRUCTURED", "DEPENDS"];
const VALID_COLOR_PREFS      = ["BOLD_BRIGHT", "PASTELS_NEUTRALS", "DEPENDS"];
const VALID_PRIORITIES       = ["MODEST_SILHOUETTES", "REDUCE_BULK_LAYERING", "FULL_OPACITY", "ELONGATE_FRAME", "NON_CLINGING_FIT"];
const VALID_PHOTO_RETENTIONS = ["DAYS_30", "DAYS_90", "INDEFINITE"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const isValidEnumArray = (values, validSet) =>
  Array.isArray(values) && values.every((v) => validSet.includes(v));

/**
 * Validate and build a clean profile data object from raw input.
 * Used by both complete (create) and update flows.
 * Returns { error } on failure, { data } on success.
 */
const buildProfileData = (body, requireDisplayName = false) => {
  const {
    displayName,
    city,
    country,
    goals,
    skinTone,
    bodyShape,
    heightRange,
    coverageLevel,
    modestyLevel,
    fitPreference,
    colorPreference,
    priorities,
    photoRetention,
    avatarUrl,
  } = body;

  // ── Required field (create only) ──────────────────────────────────────────
  if (requireDisplayName && (!displayName || !displayName.trim())) {
    return { error: "displayName is required" };
  }

  // ── Enum validations (only validate if field is present in payload) ────────
  if (goals !== undefined) {
    if (!isValidEnumArray(goals, VALID_STYLE_GOALS)) {
      return { error: `goals must be an array of: ${VALID_STYLE_GOALS.join(", ")}` };
    }
  }

  if (bodyShape !== undefined && !VALID_BODY_SHAPES.includes(bodyShape)) {
    return { error: `bodyShape must be one of: ${VALID_BODY_SHAPES.join(", ")}` };
  }

  if (heightRange !== undefined && !VALID_HEIGHT_RANGES.includes(heightRange)) {
    return { error: `heightRange must be one of: ${VALID_HEIGHT_RANGES.join(", ")}` };
  }

  if (coverageLevel !== undefined && !VALID_COVERAGE_LEVELS.includes(coverageLevel)) {
    return { error: `coverageLevel must be one of: ${VALID_COVERAGE_LEVELS.join(", ")}` };
  }

  if (modestyLevel !== undefined && !VALID_MODESTY_LEVELS.includes(modestyLevel)) {
    return { error: `modestyLevel must be one of: ${VALID_MODESTY_LEVELS.join(", ")}` };
  }

  if (fitPreference !== undefined && !VALID_FIT_PREFS.includes(fitPreference)) {
    return { error: `fitPreference must be one of: ${VALID_FIT_PREFS.join(", ")}` };
  }

  if (colorPreference !== undefined && !VALID_COLOR_PREFS.includes(colorPreference)) {
    return { error: `colorPreference must be one of: ${VALID_COLOR_PREFS.join(", ")}` };
  }

  if (priorities !== undefined) {
    if (!isValidEnumArray(priorities, VALID_PRIORITIES)) {
      return { error: `priorities must be an array of: ${VALID_PRIORITIES.join(", ")}` };
    }
  }

  if (photoRetention !== undefined && !VALID_PHOTO_RETENTIONS.includes(photoRetention)) {
    return { error: `photoRetention must be one of: ${VALID_PHOTO_RETENTIONS.join(", ")}` };
  }

  // ── Build clean data object (only include fields present in payload) ───────
  const data = {};

  if (displayName !== undefined) data.displayName = displayName.trim();
  if (city        !== undefined) data.city         = city;
  if (country     !== undefined) data.country      = country;
  if (goals       !== undefined) data.goals        = goals;
  if (skinTone    !== undefined) data.skinTone     = skinTone;
  if (bodyShape   !== undefined) data.bodyShape    = bodyShape;
  if (heightRange !== undefined) data.heightRange  = heightRange;
  if (coverageLevel  !== undefined) data.coverageLevel  = coverageLevel;
  if (modestyLevel   !== undefined) data.modestyLevel   = modestyLevel;
  if (fitPreference  !== undefined) data.fitPreference  = fitPreference;
  if (colorPreference !== undefined) data.colorPreference = colorPreference;
  if (priorities     !== undefined) data.priorities     = priorities;
  if (photoRetention !== undefined) data.photoRetention = photoRetention;
  if (avatarUrl      !== undefined) data.avatarUrl      = avatarUrl;

  return { data };
};

// ── Service ───────────────────────────────────────────────────────────────────
class OnboardingService {
  /**
   * Create user profile (onboarding complete).
   * Fails if profile already exists.
   */
  static async completeOnboarding(userId, body) {
    const existing = await prisma.userProfile.findUnique({ where: { userId } });
    if (existing) {
      return { success: false, status: 409, message: "Onboarding already completed" };
    }

    const { error, data } = buildProfileData(body, true);
    if (error) {
      return { success: false, status: 400, message: error };
    }

    const profile = await prisma.userProfile.create({
      data: { userId, ...data },
    });

    return { success: true, profile };
  }

  /**
   * Update user profile (preferences from settings/profile screen).
   * Fails if profile does not exist yet (user skipped onboarding somehow).
   */
  static async updatePreferences(userId, body) {
    const existing = await prisma.userProfile.findUnique({ where: { userId } });
    if (!existing) {
      return { success: false, status: 404, message: "Profile not found. Please complete onboarding first" };
    }

    const { error, data } = buildProfileData(body, false);
    if (error) {
      return { success: false, status: 400, message: error };
    }

    if (Object.keys(data).length === 0) {
      return { success: false, status: 400, message: "No valid fields provided to update" };
    }

    const profile = await prisma.userProfile.update({
      where: { userId },
      data,
    });

    return { success: true, profile };
  }
}

export default OnboardingService;