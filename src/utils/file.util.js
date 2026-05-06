import path from "path";
import { QueueEvents } from "bullmq";
import { fileQueue } from "../queues/file_queue.js";
import fs from 'fs';

export class FileUtils {
  /**
   * File extensions grouped by category
   */
  static FILE_TYPES = {
    image: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "tiff"],
    pdf: ["pdf"],
    video: ["mp4", "mov", "avi", "mkv", "flv", "wmv", "webm"],
    audio: ["mp3", "wav", "aac", "ogg", "m4a", "flac"],
    document: ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "pdf", "odt"],
    archive: ["zip", "rar", "7z", "tar", "gz", "bz2"],
    executable: ["exe", "bat", "sh", "bin", "msi", "app"],
    code: [
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "java",
      "py",
      "rb",
      "php",
      "c",
      "cpp",
      "cs",
      "go",
      "rs",
    ],
    text: ["txt", "md", "rtf", "log"],
    spreadsheet: ["xls", "xlsx", "csv", "ods"],
    presentation: ["ppt", "pptx", "key"],
    font: ["ttf", "otf", "woff", "woff2"],
    cad: ["dwg", "dxf", "step", "stp"],
    gis: ["shp", "kml", "gpx", "geojson"],
    model3d: ["obj", "fbx", "stl", "3ds", "blend"],
    ebook: ["epub", "mobi", "azw", "pdf"],
    web: ["html", "css", "js", "json", "xml"],
    config: ["ini", "cfg", "conf", "yaml", "yml", "env"],
    backup: ["bak", "tmp", "old"],
    database: ["sql", "sqlite", "db", "mdb"],
    design: ["psd", "xd", "fig", "ai", "sketch"],
  };

  /**
   * Get file extension
   */
  static getExtension(filename) {
    return path.extname(filename).replace(".", "").toLowerCase();
  }

  /**
   * Check if file belongs to a category
   */
  static isType(filename, type) {
    const ext = this.getExtension(filename);
    return this.FILE_TYPES[type]?.includes(ext) || false;
  }

  /**
   * Auto-generated category checkers
   */
  static isImage(filename) {
    return this.isType(filename, "image");
  }
  static isPDF(filename) {
    return this.isType(filename, "pdf");
  }
  static isVideo(filename) {
    return this.isType(filename, "video");
  }
  static isAudio(filename) {
    return this.isType(filename, "audio");
  }
  static isDocument(filename) {
    return this.isType(filename, "document");
  }
  static isArchive(filename) {
    return this.isType(filename, "archive");
  }
  static isExecutable(filename) {
    return this.isType(filename, "executable");
  }
  static isCodeFile(filename) {
    return this.isType(filename, "code");
  }
  static isTextFile(filename) {
    return this.isType(filename, "text");
  }
  static isSpreadsheet(filename) {
    return this.isType(filename, "spreadsheet");
  }
  static isPresentation(filename) {
    return this.isType(filename, "presentation");
  }
  static isFontFile(filename) {
    return this.isType(filename, "font");
  }
  static isCADFile(filename) {
    return this.isType(filename, "cad");
  }
  static isGISFile(filename) {
    return this.isType(filename, "gis");
  }
  static is3DModelFile(filename) {
    return this.isType(filename, "model3d");
  }
  static isEbookFile(filename) {
    return this.isType(filename, "ebook");
  }
  static isWebFile(filename) {
    return this.isType(filename, "web");
  }
  static isConfigFile(filename) {
    return this.isType(filename, "config");
  }
  static isBackupFile(filename) {
    return this.isType(filename, "backup");
  }
  static isDatabaseFile(filename) {
    return this.isType(filename, "database");
  }
  static isDesignFile(filename) {
    return this.isType(filename, "design");
  }

  /**
   * Get the category of a file
   */
  static getCategory(filename) {
    const ext = this.getExtension(filename);

    for (const [type, extensions] of Object.entries(this.FILE_TYPES)) {
      if (extensions.includes(ext)) return type;
    }
    return "unknown";
  }

  /**
   * Get MIME type (basic mapping)
   */
  static getMimeType(filename) {
    const ext = this.getExtension(filename);

    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      pdf: "application/pdf",
      json: "application/json",
      txt: "text/plain",
      html: "text/html",
    };

    return mimeMap[ext] || "application/octet-stream";
  }

  /**
   * Generate a unique filename
   */
  static uniqueFilename(original) {
    const ext = this.getExtension(original);
    const name = path.basename(original, "." + ext);
    return `${name}-${Date.now()}.${ext}`;
  }

  /**
   * Validate allowed file types
   */
  static isAllowed(filename, allowed = []) {
    const ext = this.getExtension(filename);
    return allowed.includes(ext);
  }

  static async enqueueFileJob(type, provider, payload) {
    const jobPayload = { ...payload };

    // ---------------- Handle single file ----------------
    if (payload.file && payload.file.buffer) {
      // save temp file
      const tempDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempPath = path.join(tempDir, `${Date.now()}-${payload.file.originalname}`);
      fs.writeFileSync(tempPath, payload.file.buffer);

      // replace file with tempPath
      jobPayload.tempPath = tempPath;
      jobPayload.originalname = payload.file.originalname;
      jobPayload.mimetype = payload.file.mimetype;
      jobPayload.size = payload.file.size;
      delete jobPayload.file;
    }

    // ---------------- Add job to queue ----------------
    const job = await fileQueue.add("FILE_JOB", {
      type,
      provider,
      payload: jobPayload,
    });

    console.log(`✅ Job added to queue: ${job.id}`);

    // ---------------- Optional wait (short timeout) ----------------
    const queueEvents = new QueueEvents("fileQueue", {
      connection: fileQueue.opts.connection,
    });

    try {
      // wait max 5 seconds, if still processing return jobId
      const result = await job.waitUntilFinished(queueEvents, 5000);
      return result;
    } catch (err) {
      console.log(`⏳ Job ${job.id} still processing`);
      return { jobId: job.id, status: "processing" };
    }
  }
}
