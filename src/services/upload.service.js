// src/services/upload.service.js

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import constants from "../config/constants.js";
import { FileUtils } from "../utils/file.util.js";

/**
 * UploadService handles file uploads
 * - Validates file type using FileUtils
 * - Generates unique filenames
 * - Saves files to local storage
 * - Returns file metadata
 */
class UploadService {
  constructor(basePath = "uploads") {
    this.basePath = path.resolve(basePath);

    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Generate unique filename using UUID
   */
  generateFilename(originalName) {
    const ext = FileUtils.getExtension(originalName);
    return `${uuidv4()}.${ext}`;
  }

  /**
   * Validate file type using FileUtils
   */
  validateFile(file, allowedTypes = []) {
    if (!file) throw new Error("No file provided");

    if (allowedTypes.length === 0) return true; // allow all types

    const isValid = allowedTypes.some((type) => {
      switch (type) {
        case "image":
          return FileUtils.isImage(file.originalname);
        case "video":
          return FileUtils.isVideo(file.originalname);
        case "audio":
          return FileUtils.isAudio(file.originalname);
        case "document":
          return FileUtils.isDocument(file.originalname);
        case "pdf":
          return FileUtils.isPDF(file.originalname);
        default:
          return FileUtils.isAllowed(file.originalname, FileUtils.FILE_TYPES[type] || []);
      }
    });

    if (!isValid) throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
    return true;
  }

  /**
   * Save file locally
   * @param {object} file - Multer file object or { originalname, buffer }
   * @param {string} subFolder - Optional subfolder inside uploads
   * @param {string[]} allowedTypes - Array of allowed file categories
   */
  async saveFile(file, subFolder = "", allowedTypes = ["image", "document"]) {
    this.validateFile(file, allowedTypes);

    const folderPath = path.join(this.basePath, subFolder);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const filename = this.generateFilename(file.originalname);
    const filePath = path.join(folderPath, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      originalName: file.originalname,
      filename,
      path: filePath,
      size: file.size,
      mimeType: FileUtils.getMimeType(file.originalname),
      url: path.join(constants.UPLOAD_URL || "/uploads", subFolder, filename),
      category: FileUtils.getCategory(file.originalname),
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    await fs.promises.unlink(filePath);
    return true;
  }
}

export const uploadService = new UploadService();
