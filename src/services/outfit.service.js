// src/services/outfit.service.js

import { GoogleGenAI } from "@google/genai";
import prisma from "../config/prisma.js";
import appConfig from "../config/index.js";
import logger from "../config/logger.js";
import { getWeatherSnapshot } from "./weather.service.js";
import { buildOutfitSystemPrompt } from "../prompts/outfit.prompt.js";
import { PaginationService } from "./pagination.service.js";

const genai = new GoogleGenAI({ apiKey: appConfig.GEMINI_API_KEY });

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Call ALIFF (Gemini) with the system prompt and a user message.
 * Returns the parsed JSON response from the AI.
 */
const callAliff = async (userMessage) => {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: buildOutfitSystemPrompt() },
    contents: [
      {
        parts: [{ text: userMessage }],
      },
    ],
  });

  const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) throw new Error("No response from AI");

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("AI returned an unreadable response");
  }
};

/**
 * Validate AI-returned item IDs against the user's closet.
 * Returns only the items that actually exist and are available.
 *
 * AI only sends back { itemId, category, reasonSelected } — we hydrate
 * everything else from the DB.
 */
const validateAndHydrateItems = async (aiItems, userId) => {
  const validated = [];

  for (const aiItem of aiItems) {
    if (!aiItem.itemId) {
      logger.warn(`[OutfitService] AI returned an item with no itemId — skipping`);
      continue;
    }

    const closetItem = await prisma.closetItem.findFirst({
      where: { id: aiItem.itemId, userId, available: true },
    });

    if (!closetItem) {
      logger.warn(
        `[OutfitService] AI suggested item ${aiItem.itemId} not found in user ${userId} closet — skipping`
      );
      continue;
    }

    validated.push({
      closetItem,
      role: aiItem.category ?? closetItem.category,
      reasonSelected: aiItem.reasonSelected ?? "",
    });
  }

  return validated;
};

/**
 * Formats closet items for the AI prompt.
 * Strips DB internals, keeps all styling-relevant fields.
 */
const formatClosetForPrompt = (items) =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    primaryColor: item.primaryColor,
    secondaryColor: item.secondaryColor,
    colors: item.colors,
    sleeveLength: item.sleeveLength,
    neckline: item.neckline,
    hemLength: item.hemLength,
    fit: item.fit,
    isOpaque: item.isOpaque,
    hasLining: item.hasLining,
    fabric: item.fabric,
    pattern: item.pattern,
    occasion: item.occasion,
    season: item.season,
    available: item.available,
  }));

/**
 * Formats a validated + hydrated item list into the API response shape.
 */
const formatItemsForResponse = (hydratedItems) =>
  hydratedItems.map(({ closetItem, role, reasonSelected }) => ({
    itemId: closetItem.id,
    role,
    name: closetItem.name,
    category: closetItem.category,
    imageUrl: closetItem.processedImageUrl ?? closetItem.originalImageUrl ?? null,
    primaryColor: closetItem.primaryColor,
    secondaryColor: closetItem.secondaryColor,
    colors: closetItem.colors,
    pattern: closetItem.pattern,
    fabric: closetItem.fabric,
    fit: closetItem.fit,
    sleeveLength: closetItem.sleeveLength,
    hemLength: closetItem.hemLength,
    neckline: closetItem.neckline,
    isOpaque: closetItem.isOpaque,
    hasLining: closetItem.hasLining,
    occasion: closetItem.occasion,
    season: closetItem.season,
    reasonSelected,
  }));

// ── Service ───────────────────────────────────────────────────────────────────

class OutfitService {
  /**
   * POST /api/outfit/style
   *
   * Flow:
   * 1. Validate selected item belongs to user (if provided)
   * 2. Fetch user profile
   * 3. Fetch all available closet items
   * 4. Get current + next-6hr weather snapshot from OpenWeatherMap
   * 5. Build user message with profile, closet, weather, and style request
   * 6. Call ALIFF — AI returns { outfitName, occasion, items[], stylingExplanation, weatherNote, modestyPassed }
   * 7. Validate AI item IDs against the user's closet (AI can hallucinate IDs)
   * 8. Save OutfitSuggestion + OutfitItems to DB
   * 9. Return suggestion with fully hydrated closet item fields
   */
  static async generateOutfit(userId, body) {
    const { selectedItemId } = body;

    // ── 1. Validate selected item ─────────────────────────────────────────────
    let selectedItem = null;
    if (selectedItemId) {
      selectedItem = await prisma.closetItem.findFirst({
        where: { id: selectedItemId, userId, available: true },
      });
      if (!selectedItem)
        return { error: "Selected item not found in your closet or is unavailable" };
    }

    // ── 2. Fetch user profile ─────────────────────────────────────────────────
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) return { error: "User profile not found. Please complete your profile first." };

    // ── 3. Fetch available closet items ───────────────────────────────────────
    const closetItems = await prisma.closetItem.findMany({
      where: { userId, available: true },
    });
    if (closetItems.length < 2)
      return { error: "You need at least 2 items in your closet to generate an outfit." };

    const outfitHistory = await prisma.outfitHistory.findMany({
      where: { userId },
      orderBy: { savedAt: "desc" },
      take: 30, // cap at last 30 to control token cost
      include: {
        suggestion: {
          include: {
            outfitItems: {
              select: { closetItemId: true, role: true },
            },
          },
        },
      },
    });

    const formattedHistory = outfitHistory.map((h) => ({
      action: h.action, // ACCEPTED | REJECTED | SWAPPED
      swappedItemId: h.swappedItemId ?? null, // item user disliked
      replacementItemId: h.replacementItemId ?? null, // item user preferred instead
      itemIds: h.suggestion.outfitItems.map((oi) => ({
        itemId: oi.closetItemId,
        role: oi.role,
      })),
    }));

    // ── 4. Weather snapshot ───────────────────────────────────────────────────
    const weatherSnapshot = await getWeatherSnapshot(profile.city, profile.countryCode);

    // ── 5. Build user message ─────────────────────────────────────────────────
    const userMessage = JSON.stringify(
      {
        USER_PROFILE: {
          name: profile.displayName,
          coverageLevel: profile.coverageLevel,
          modestyLevel: profile.modestyLevel,
          bodyShape: profile.bodyShape,
          heightRange: profile.heightRange,
          skinTone: profile.skinTone ?? null,
          goals: profile.goals ?? [],
          fitPreference: profile.fitPreference,
          colorPreference: profile.colorPreference,
          priorities: profile.priorities ?? [],
          city: profile.city,
          country: profile.country,
        },
        USER_CLOSET: formatClosetForPrompt(closetItems),
        OUTFIT_HISTORY:   formattedHistory,
        WEATHER_SNAPSHOT: weatherSnapshot,
        STYLE_REQUEST: {
          purpose: "Generate a complete modest outfit from the user's closet",
          selectedItemId: selectedItemId ?? null,
        },
      },
      null,
      2
    );

    // ── 6. Call ALIFF ─────────────────────────────────────────────────────────
    let aiResponse;
    try {
      aiResponse = await callAliff(userMessage);
    } catch (err) {
      logger.error(`[OutfitService] AI generation failed for user ${userId}: ${err.message}`);
      return { error: "Could not generate outfit. Please try again." };
    }

    if (aiResponse.error === "STYLE_REQUEST_REQUIRED")
      return { error: "Please provide a valid style request." };

    if (!aiResponse.items || aiResponse.items.length === 0)
      return {
        error: "AI could not build an outfit from your current closet. Please add more items.",
      };

    // ── 7. Validate + hydrate AI items from DB ────────────────────────────────
    const hydratedItems = await validateAndHydrateItems(aiResponse.items, userId);
    if (hydratedItems.length === 0)
      return {
        error: "AI suggested items that could not be verified in your closet. Please try again.",
      };

    // ── 8. Save OutfitSuggestion + OutfitItems ────────────────────────────────
    const suggestion = await prisma.outfitSuggestion.create({
      data: {
        sessionId: null, // no chat session for this flow
        aiExplanation: aiResponse.stylingExplanation ?? null,
        occasionContext: aiResponse.occasion ?? null,
        weatherSnapshot: weatherSnapshot ?? undefined,
        passedModerationCheck: aiResponse.modestyPassed ?? false,
        outfitItems: {
          create: hydratedItems.map(({ closetItem, role }) => ({
            closetItemId: closetItem.id,
            role,
          })),
        },
      },
    });

    // ── 9. Return response ────────────────────────────────────────────────────
    return {
      suggestion: {
        id: suggestion.id,
        outfitName: aiResponse.outfitName,
        occasion: aiResponse.occasion,
        selectedItemLocked: aiResponse.selectedItemLocked ?? !!selectedItemId,
        stylingExplanation: aiResponse.stylingExplanation,
        weatherNote: aiResponse.weatherNote ?? null,
        modestyPassed: aiResponse.modestyPassed ?? false,
        weatherSnapshot: weatherSnapshot ?? null,
        items: formatItemsForResponse(hydratedItems),
        createdAt: suggestion.createdAt,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/outfit/feedback
   *
   * ACCEPT  → save OutfitHistory (action: ACCEPTED)
   * REJECT  → save OutfitHistory (action: REJECTED)
   * SWAP    → save OutfitHistory (action: SWAPPED, swappedItemId),
   *           call AI with existing outfit + swap request,
   *           create new OutfitSuggestion,
   *           return updated outfit
   *
   * On SWAP the AI receives the full EXISTING_OUTFIT so it knows which items
   * to keep, and SWAP_REQUEST.swapItemId so it knows which one to replace.
   * The remaining (non-swapped) items are re-fetched from the DB to guarantee
   * the response is always hydrated from our data, never from AI echo.
   */
  static async submitFeedback(userId, body) {
    const { suggestionId, action, swapItemId } = body;

    // ── Validate action ───────────────────────────────────────────────────────
    const validActions = ["ACCEPTED", "REJECTED", "SWAPPED"];
    if (!validActions.includes(action))
      return { error: `action must be one of: ${validActions.join(", ")}` };

    if (action === "SWAPPED" && !swapItemId)
      return { error: "swapItemId is required when action is SWAPPED" };

    // ── Fetch suggestion ──────────────────────────────────────────────────────
    const suggestion = await prisma.outfitSuggestion.findFirst({
      where: { id: suggestionId },
      include: {
        outfitItems: {
          include: { closetItem: true },
        },
      },
    });

    if (!suggestion) return { error: "Outfit suggestion not found" };

    // Confirm at least one item belongs to this user
    const belongsToUser = suggestion.outfitItems.some((oi) => oi.closetItem.userId === userId);
    if (!belongsToUser) return { error: "Outfit suggestion not found" };

    // ── Prevent duplicate feedback ────────────────────────────────────────────
    const existing = await prisma.outfitHistory.findUnique({ where: { suggestionId } });
    if (existing) return { error: "Feedback already submitted for this outfit" };

    // ── ACCEPT or REJECT ──────────────────────────────────────────────────────
    if (action === "ACCEPTED" || action === "REJECTED") {
      const history = await prisma.outfitHistory.create({
        data: { userId, suggestionId, action },
      });

      return {
        feedback: {
          id: history.id,
          action: history.action,
          suggestionId: history.suggestionId,
          savedAt: history.savedAt,
        },
      };
    }

    // ── SWAP ──────────────────────────────────────────────────────────────────

    // swapItemId is the closetItemId the user wants to replace
    const itemToSwap = suggestion.outfitItems.find((oi) => oi.closetItemId === swapItemId);
    if (!itemToSwap) return { error: "swapItemId is not part of this outfit suggestion" };

    // Save history record immediately
    await prisma.outfitHistory.create({
      data: {
        userId,
        suggestionId,
        action: "SWAPPED",
        swappedItemId: swapItemId,
      },
    });

    // Fetch profile + full closet for swap AI call
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const closetItems = await prisma.closetItem.findMany({ where: { userId, available: true } });

    const weatherSnapshot = suggestion.weatherSnapshot
      ? suggestion.weatherSnapshot
      : await getWeatherSnapshot(profile?.city, profile?.countryCode);

    // Build existing outfit context for AI
    // We send ALL current outfit items (including the one to be swapped)
    // so AI knows the full context and can pick a cohesive replacement.
    const existingOutfit = {
      outfitName: suggestion.aiExplanation ?? "Current outfit",
      occasion: suggestion.occasionContext,
      items: suggestion.outfitItems.map((oi) => ({
        itemId: oi.closetItemId,
        name: oi.closetItem.name,
        category: oi.closetItem.category,
        role: oi.role,
      })),
    };

    const swapMessage = JSON.stringify(
      {
        USER_PROFILE: {
          name: profile?.displayName,
          coverageLevel: profile?.coverageLevel,
          modestyLevel: profile?.modestyLevel,
          bodyShape: profile?.bodyShape,
          heightRange: profile?.heightRange,
          skinTone: profile?.skinTone ?? null,
          goals: profile?.goals ?? [],
          fitPreference: profile?.fitPreference,
          colorPreference: profile?.colorPreference,
          priorities: profile?.priorities ?? [],
          city: profile?.city,
          country: profile?.country,
        },
        EXISTING_OUTFIT: existingOutfit,
        SWAP_REQUEST: {
          purpose:
            "Replace one item in the existing outfit with a better alternative from the closet",
          swapItemId,
          instruction:
            "Find a replacement that is NOT the swapped item, NOT already in the outfit, " +
            "matches the same occasion/modesty/style, and works with the remaining items.",
        },
        USER_CLOSET: formatClosetForPrompt(closetItems),
        WEATHER_SNAPSHOT: weatherSnapshot ?? null,
        STYLE_REQUEST: {
          purpose: "Generate a complete modest outfit from the user's closet",
          selectedItemId: null,
        },
      },
      null,
      2
    );

    let aiResponse;
    try {
      aiResponse = await callAliff(swapMessage);
    } catch (err) {
      logger.error(`[OutfitService] Swap AI call failed for user ${userId}: ${err.message}`);
      return { error: "Could not generate swap. Please try again." };
    }

    if (!aiResponse.items || aiResponse.items.length === 0)
      return { error: "AI could not find a suitable swap from your closet." };

    // Validate + hydrate swap response
    const hydratedItems = await validateAndHydrateItems(aiResponse.items, userId);
    if (hydratedItems.length === 0)
      return {
        error: "AI suggested items that could not be verified in your closet. Please try again.",
      };

    // Save new OutfitSuggestion for the swapped outfit
    const newSuggestion = await prisma.outfitSuggestion.create({
      data: {
        sessionId: null,
        aiExplanation: aiResponse.stylingExplanation ?? null,
        occasionContext: suggestion.occasionContext,
        weatherSnapshot: weatherSnapshot ?? undefined,
        passedModerationCheck: aiResponse.modestyPassed ?? false,
        outfitItems: {
          create: hydratedItems.map(({ closetItem, role }) => ({
            closetItemId: closetItem.id,
            role,
          })),
        },
      },
    });

    // Update history with the replacement item id (the new item that was NOT in original outfit)
    const originalItemIds = new Set(suggestion.outfitItems.map((oi) => oi.closetItemId));
    const replacementEntry = hydratedItems.find(
      ({ closetItem }) => !originalItemIds.has(closetItem.id)
    );

    if (replacementEntry) {
      await prisma.outfitHistory.updateMany({
        where: { suggestionId, action: "SWAPPED" },
        data: { replacementItemId: replacementEntry.closetItem.id },
      });
    }

    return {
      swapped: true,
      previousSuggestionId: suggestionId,
      suggestion: {
        id: newSuggestion.id,
        outfitName: aiResponse.outfitName,
        occasion: aiResponse.occasion,
        selectedItemLocked: aiResponse.selectedItemLocked ?? false,
        stylingExplanation: aiResponse.stylingExplanation,
        weatherNote: aiResponse.weatherNote ?? null,
        modestyPassed: aiResponse.modestyPassed ?? false,
        weatherSnapshot: weatherSnapshot ?? null,
        items: formatItemsForResponse(hydratedItems),
        createdAt: newSuggestion.createdAt,
      },
    };
  }
  // getOutfitHistory service with pagination and search api
  static async getOutfitHistory(userId, query) {
    const { page, limit, search } = query;
    const { skip, limit: take, page: currentPage } = PaginationService.getPagination(page, limit);

    // OutfitSuggestion has aiExplanation (not outfitName) and occasionContext for search
    const where = {
      userId,
      action: "ACCEPTED",
      ...(search ? {
        OR: [
          { suggestion: { aiExplanation: { contains: search, mode: "insensitive" } } },
          { suggestion: { occasionContext: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    };

    const [outfitHistory, total] = await Promise.all([
      prisma.outfitHistory.findMany({
        where,
        include: {
          suggestion: {
            include: {
              outfitItems: { include: { closetItem: true } },
            },
          },
        },
        orderBy: { savedAt: "desc" },
        skip,
        take,
      }),
      prisma.outfitHistory.count({ where }),
    ]);

    return {
      data: outfitHistory,
      meta: PaginationService.getMeta(total, currentPage, take),
    };
  }
}

export default OutfitService;
