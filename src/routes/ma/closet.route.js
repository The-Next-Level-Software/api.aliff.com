// src/routes/ma/closet.route.js

import express from "express";
import multer from "multer";

import ClosetController from "../../controllers/ma/closet.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ── Multer — memory storage, images only, 10 MB per file ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimetypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp",
      "image/heic", "image/heif",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".jfif", ".heic", ".heif"];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));

    if (allowedMimetypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, JFIF, PNG, WebP, and HEIC images are allowed"));
    }
  },
});

// Multer error handler — catches fileFilter and fileSize rejections
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ success: false, message: "Each image must be under 10 MB" });
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
};

// All closet routes are protected
router.use(authMiddleware());

router.post(
  "/upload",
  upload.array("images", 10),
  handleMulterError,
  ClosetController.uploadAndAnalyze
);

router.post("/update-bulk", ClosetController.updateItems);
router.delete("/delete", ClosetController.deleteItems);
router.patch("/:id", ClosetController.updateItem);
router.get("/", ClosetController.getClosetItems);
router.get("/:id", ClosetController.getClosetItemById);

export default router;