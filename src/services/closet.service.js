// src/services/closet.service.js

import axios from "axios";
import FormData from "form-data";
import { GoogleGenAI } from "@google/genai";

import prisma from "../config/prisma.js";
import { fileService } from "./file.service.js";
import { PaginationService } from "./pagination.service.js";
import appConfig from "../config/index.js";
import logger from "../config/logger.js";

// ── Enum whitelists (mirrors schema.prisma exactly) ───────────────────────────
const VALID_CATEGORIES  = ["TOPS", "BOTTOMS", "DRESSES", "OUTERWEAR", "HIJABS", "FOOTWEAR", "ACCESSORIES"];
const VALID_SLEEVE_LENS = ["SLEEVELESS", "SHORT", "ELBOW", "THREE_QUARTER", "FULL"];
const VALID_NECKLINES   = ["CREW", "V_NECK", "SCOOP", "TURTLENECK", "MOCK_NECK", "COLLARED", "SQUARE", "OTHER"];
const VALID_FIT_TYPES   = ["OVERSIZED", "LOOSE", "REGULAR", "FITTED", "TAILORED"];
const VALID_OCCASIONS   = ["CASUAL", "SMART_CASUAL", "BUSINESS", "FORMAL", "EVENING", "SPORT", "HOME", "TRAVEL"];
const VALID_SEASONS     = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_SEASON"];

const genai = new GoogleGenAI({ apiKey: appConfig.GEMINI_API_KEY });

// ── Helpers ───────────────────────────────────────────────────────────────────

const computeExpiresAt = (photoRetention) => {
  const now = Date.now();
  switch (photoRetention) {
    case "DAYS_30":  return new Date(now + 30 * 24 * 60 * 60 * 1000);
    case "DAYS_90":  return new Date(now + 90 * 24 * 60 * 60 * 1000);
    case "INDEFINITE":
    default:         return null;
  }
};

const processWithPhotoroom = async (fileBuffer, mimetype) => {
  const form = new FormData();
  form.append("imageFile", fileBuffer, {
    filename: "image.jpg",
    contentType: mimetype,
  });
  form.append("flatLay.mode", "ai.auto");
  // background is transparent by default when flatLay is used,
  // but explicitly request removal to be safe:
  form.append("background.color", "transparent");

  const response = await axios.post("https://image-api.photoroom.com/v2/edit", form, {
    headers: {
      ...form.getHeaders(),
      "x-api-key": appConfig.PHOTOROOM_API_KEY,
      "Accept": "image/png, application/json",
    },
    responseType: "arraybuffer",
  });

  return Buffer.from(response.data);
};

/**
 * Pre-validation prompt — just checks if the image is a clear, usable clothing item.
 * Returns { valid: true } or { valid: false, message }
 */
const validateImageWithGemini = async (fileBuffer, mimetype) => {
  const base64Image = fileBuffer.toString("base64");

  const prompt = `You are a clothing image validator for a wardrobe app.
Look at this image and determine if it shows a clothing item or fashion accessory.

Accept the image if it shows ANY of the following:
- A clothing item (tops, bottoms, dresses, outerwear, accessories, footwear etc.)
- A fashion accessory (bags, shoes, belts, scarves, hijabs, jewellery, etc.)
- The item may be on a plain background, hanger, mannequin, lifestyle/studio setting etc
- The item may have a background — background does not disqualify it
- The item may be photographed from any angle

Reject ONLY if:
- The image contains no clothing or fashion accessory at all
- The image is completely unclear or unrecognizable
- The image shows a person's full body/face as the main subject (not the clothing)

Return ONLY one of these two JSON responses, nothing else:
- If acceptable: {"valid": true}
- If not acceptable: {"valid": false, "reason": "short reason"}`;

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimetype, data: base64Image } },
        ],
      },
    ],
  });

  const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) return { valid: false, reason: "No response from AI" };

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed.valid === true) return { valid: true };
    return { valid: false, reason: parsed.reason ?? "Image is not suitable" };
  } catch {
    return { valid: false, reason: "AI returned an unreadable response" };
  }
};

const buildAnalyzePrompt = () => `
You are a fashion AI assistant. Analyze this clothing item image and return a JSON object with ONLY these fields.
Return ONLY the raw JSON object. No markdown, no code fences, no explanation.

{
  "name": "short descriptive item name (string, max 50 chars)",
  "category": "one of: TOPS | BOTTOMS | DRESSES | OUTERWEAR | HIJABS | FOOTWEAR | ACCESSORIES",
  "primaryColor": "dominant hex color code e.g. #FFFFFF",
  "secondaryColor": "secondary hex color code or null",
  "colors": ["array of colors in hex format and only if more then 2 colors. Only add the colors of the item, no background colors",],
  "pattern": "e.g. solid, striped, floral, checkered, polka dots, geometric, or null",
  "sleeveLength": "one of: SLEEVELESS | SHORT | ELBOW | THREE_QUARTER | FULL — or null if not applicable",
  "neckline": "one of: CREW | V_NECK | SCOOP | TURTLENECK | MOCK_NECK | COLLARED | SQUARE | OTHER — or null if not applicable",
  "hemLength": "one of: NO_HEM | SHORT | LONG — or null if not applicable",
  "fabric": "e.g. cotton, denim, leather, silk, wool, synthetic, or null if not sure",
  "isOpaque": true or false,
  "hasLining": true or false,
  "fit": "one of: OVERSIZED | LOOSE | REGULAR | FITTED | TAILORED — or null if not applicable",
  "occasion": ["array of applicable: CASUAL | SMART_CASUAL | BUSINESS | FORMAL | EVENING | SPORT | HOME | TRAVEL"],
  "season": ["array of applicable: SPRING | SUMMER | AUTUMN | WINTER | ALL_SEASON"]
}

Rules:
- Every field must be present. Use null for optional fields you cannot determine.
- occasion and season must always be arrays, even if empty.
- primaryColor must always be a hex code.
`;

const analyzeWithGemini = async (imageBuffer) => {
  const base64Image = imageBuffer.toString("base64");

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: buildAnalyzePrompt() },
          { inlineData: { mimeType: "image/png", data: base64Image } },
        ],
      },
    ],
  });

  const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) return { success: false, message: "No response from AI" };

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return { success: true, data: parsed };
  } catch {
    return { success: false, message: "AI returned an unreadable response" };
  }
};

const sanitizeAiData = (ai) => ({
  name:           typeof ai.name === "string" ? ai.name.slice(0, 50) : null,
  category:       VALID_CATEGORIES.includes(ai.category) ? ai.category : "TOPS",
  primaryColor:   typeof ai.primaryColor === "string" ? ai.primaryColor : "#000000",
  secondaryColor: typeof ai.secondaryColor === "string" ? ai.secondaryColor : null,
  colors:         Array.isArray(ai.colors) ? ai.colors.filter(c => typeof c === "string") : [],
  pattern:        typeof ai.pattern === "string" ? ai.pattern : null,
  sleeveLength:   VALID_SLEEVE_LENS.includes(ai.sleeveLength) ? ai.sleeveLength : null,
  neckline:       VALID_NECKLINES.includes(ai.neckline) ? ai.neckline : null,
  hemLength:      typeof ai.hemLength === "string" ? ai.hemLength : null,
  fabric:         typeof ai.fabric === "string" ? ai.fabric : null,
  isOpaque:       typeof ai.isOpaque === "boolean" ? ai.isOpaque : true,
  hasLining:      typeof ai.hasLining === "boolean" ? ai.hasLining : false,
  fit:            VALID_FIT_TYPES.includes(ai.fit) ? ai.fit : null,
  occasion:       Array.isArray(ai.occasion) ? ai.occasion.filter((o) => VALID_OCCASIONS.includes(o)) : [],
  season:         Array.isArray(ai.season) ? ai.season.filter((s) => VALID_SEASONS.includes(s)) : [],
});

const validateConfirmFields = (fields) => {
  const {
    name, category, primaryColor, secondaryColor, colors, pattern,
    sleeveLength, neckline, hemLength, fabric, isOpaque, hasLining,
    fit, occasion, season, available
  } = fields;
  if (colors !== undefined && !Array.isArray(colors))
    return { error: "colors must be an array" };

  if (category !== undefined && !VALID_CATEGORIES.includes(category))
    return { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` };

  if (sleeveLength !== undefined && sleeveLength !== null && !VALID_SLEEVE_LENS.includes(sleeveLength))
    return { error: `sleeveLength must be one of: ${VALID_SLEEVE_LENS.join(", ")}` };

  if (neckline !== undefined && neckline !== null && !VALID_NECKLINES.includes(neckline))
    return { error: `neckline must be one of: ${VALID_NECKLINES.join(", ")}` };

  if (fit !== undefined && fit !== null && !VALID_FIT_TYPES.includes(fit))
    return { error: `fit must be one of: ${VALID_FIT_TYPES.join(", ")}` };

  if (occasion !== undefined) {
    if (!Array.isArray(occasion)) return { error: "occasion must be an array" };
    const bad = occasion.find((o) => !VALID_OCCASIONS.includes(o));
    if (bad) return { error: `Invalid occasion value: ${bad}. Must be one of: ${VALID_OCCASIONS.join(", ")}` };
  }

  if (season !== undefined) {
    if (!Array.isArray(season)) return { error: "season must be an array" };
    const bad = season.find((s) => !VALID_SEASONS.includes(s));
    if (bad) return { error: `Invalid season value: ${bad}. Must be one of: ${VALID_SEASONS.join(", ")}` };
  }

  if (isOpaque !== undefined && typeof isOpaque !== "boolean")
    return { error: "isOpaque must be a boolean" };

  if (hasLining !== undefined && typeof hasLining !== "boolean")
    return { error: "hasLining must be a boolean" };

  if (available !== undefined && typeof available !== "boolean")
    return { error: "available must be a boolean" };

  const data = {};
  if (name           !== undefined) data.name           = name;
  if (category       !== undefined) data.category       = category;
  if (primaryColor   !== undefined) data.primaryColor   = primaryColor;
  if (secondaryColor !== undefined) data.secondaryColor = secondaryColor;
  if (pattern        !== undefined) data.pattern        = pattern;
  if (sleeveLength   !== undefined) data.sleeveLength   = sleeveLength;
  if (neckline       !== undefined) data.neckline       = neckline;
  if (isOpaque       !== undefined) data.isOpaque       = isOpaque;
  if (hasLining      !== undefined) data.hasLining      = hasLining;
  if (fit            !== undefined) data.fit            = fit;
  if (occasion       !== undefined) data.occasion       = occasion;
  if (season         !== undefined) data.season         = season;
  if (available      !== undefined) data.available      = available;
  if (colors         !== undefined) data.colors         = colors;
  if (hemLength      !== undefined) data.hemLength      = hemLength;
  if (fabric         !== undefined) data.fabric         = fabric;


  return { data };
};

// ── Service ───────────────────────────────────────────────────────────────────
class ClosetService {

  static async uploadAndAnalyze(userId, files) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { photoRetention: true },
    });

    const imageExpiresAt = computeExpiresAt(profile?.photoRetention ?? "INDEFINITE");

    const results = [];
    const errors  = [];

    // ── PASS 1: Pre-validate all images with Gemini before any uploads ────────
    const validFiles = [];

    await Promise.all(
      files.map(async (file) => {
        try {
          const check = await validateImageWithGemini(file.buffer, file.mimetype);
          if (!check.valid) {
            errors.push({
              file: file.originalname,
              message: check.reason ?? "Image is not a clear clothing item. Please retake the photo.",
            });
          } else {
            validFiles.push(file);
          }
        } catch (err) {
          logger.error(`[ClosetService] Pre-validation failed for ${file.originalname}: ${err.message}`);
          errors.push({ file: file.originalname, message: "Could not validate image. Please try again." });
        }
      })
    );

    // ── PASS 2: Process only validated images ─────────────────────────────────
    for (const file of validFiles) {
      try {
        // 1. Remove background
        let processedBuffer;
        try {
          processedBuffer = await processWithPhotoroom(file.buffer, file.mimetype);
        } catch (bgErr) {
          logger.error(`[ClosetService] Photoroom bg removal failed for ${file.originalname}: ${bgErr.message}`);
          errors.push({ file: file.originalname, message: "Background removal failed. Please try again." });
          continue;
        }

        // 2. Upload processed (no-bg) image to Cloudflare
        const processedFile = {
          buffer:       processedBuffer,
          originalname: `processed-${file.originalname.replace(/\.[^.]+$/, ".png")}`,
          mimetype:     "image/png",
          size:         processedBuffer.length,
        };
        const processed = await fileService.uploadSingle({
          file: processedFile,
          options: { folder: "closet/processed" },
        });

        // 3. Analyze processed image with Gemini
        const aiResult = await analyzeWithGemini(processedBuffer);
        if (!aiResult.success) {
          await fileService.deleteFile({ fileId: processed.key }).catch(() => {});
          errors.push({ file: file.originalname, message: aiResult.message });
          continue;
        }

        const aiData = sanitizeAiData(aiResult.data);

        const item = await prisma.closetItem.create({
          data: {
            userId,
            processedImageUrl: processed.url,
            imageKey:          processed.key,
            imageExpiresAt,
            ...aiData,
          },
        });

        results.push(item);
      } catch (err) {
        logger.error(`[ClosetService] Processing failed for ${file.originalname}: ${err.message}`);
        errors.push({ file: file.originalname, message: "An unexpected error occurred. Please try again." });
      }
    }

    return { results, errors };
  }

  static async updateItem(userId, id, fields) {
    const existing = await prisma.closetItem.findFirst({
      where: { id, userId },
    });

    if (!existing) return { error: "Item not found" };

    const { error, data } = validateConfirmFields(fields);
    if (error) return { error };

    if (Object.keys(data).length === 0) return { error: "No valid fields provided to update" };

    const updated = await prisma.closetItem.update({ where: { id }, data });
    return { item: updated };
  }

  static async getClosetItems(userId, query) {
    const { page, limit, search, category, primaryColor, season, occasion, available } = query;

    // Validate enum filters before hitting the DB
    if (category && !VALID_CATEGORIES.includes(category.toUpperCase()))
      return { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` };

    if (season && !VALID_SEASONS.includes(season.toUpperCase()))
      return { error: `season must be one of: ${VALID_SEASONS.join(", ")}` };

    if (occasion && !VALID_OCCASIONS.includes(occasion.toUpperCase()))
      return { error: `occasion must be one of: ${VALID_OCCASIONS.join(", ")}` };

    const { skip, limit: take, page: currentPage } = PaginationService.getPagination(page, limit);

    const where = { userId};

    if (search)       where.name         = { contains: search, mode: "insensitive" };
    if (category)     where.category     = category.toUpperCase();
    if (primaryColor) where.primaryColor = { contains: primaryColor, mode: "insensitive" };
    if (season)       where.season       = { has: season.toUpperCase() };
    if (occasion)     where.occasion     = { has: occasion.toUpperCase() };
    if (available !== undefined) where.available = { equals: available === "true" };


    const [items, total] = await Promise.all([
      prisma.closetItem.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.closetItem.count({ where }),
    ]);

    return { items, meta: PaginationService.getMeta(total, currentPage, take) };
  }

  static async getClosetItemById(userId, id) {
    const item = await prisma.closetItem.findFirst({
      where: { id, userId },
    });
    return item ?? null;
  }
  static async deleteItems(userId, ids) {
    if (!Array.isArray(ids) || ids.length === 0)
      return { error: "ids must be a non-empty array" };

    if (ids.length > 20)
      return { error: "Maximum 20 items can be deleted at once" };

    const deleted = [];
    const errors  = [];

    for (const id of ids) {
      const item = await prisma.closetItem.findFirst({
        where: { id, userId },
      });

      if (!item) {
        errors.push({ id, message: "Item not found" });
        continue;
      }

      // Delete image from Cloudflare
      await fileService.deleteFile({ fileId: item.imageKey, provider: "cloudflare" }).catch((err) => {
        logger.error(`[ClosetService] Failed to delete image ${item.imageKey} from Cloudflare: ${err.message}`);
      });

      await prisma.closetItem.delete({ where: { id } });
      deleted.push(id);
    }

    return { deleted, errors };
  }

  static async updateItems(userId, items) {
    const updated_items = [];
    const errors        = [];

    for (const item of items) {
      const { id, ...fields } = item;

      if (!id) {
        errors.push({ id: null, message: "Each item must include an id" });
        continue;
      }

      const existing = await prisma.closetItem.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        errors.push({ id, message: "Item not found" });
        continue;
      }

      const { error, data } = validateConfirmFields(fields);
      if (error) {
        errors.push({ id, message: error });
        continue;
      }

      const updated = await prisma.closetItem.update({
        where: { id },
        data,
      });

      updated_items.push(updated);
    }

    return { updated_items, errors };
  }
}

export default ClosetService;
