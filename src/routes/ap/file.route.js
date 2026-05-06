import express from "express";
import { FileController } from "../../controllers/ap/file.controller.js";
import { uploadMiddleware } from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/local/file", uploadMiddleware({ type: "single", field: "file" }), FileController.uploadLocalFile);
router.post("/local/image", uploadMiddleware({ type: "single", field: "image" }), FileController.uploadLocalImage);
router.post("/local/files", uploadMiddleware({ type: "multiple", field: "files", maxCount: 10 }), FileController.uploadLocalFiles);
router.post("/local/images", uploadMiddleware({ type: "multiple", field: "images", maxCount: 10 }), FileController.uploadLocalImages);
router.post("/local/all", uploadMiddleware({ type: "fields", fields: ["file", "image"], maxCount: 5 }), FileController.uploadLocalFields);
router.delete("/local/file/:fileId", FileController.deleteFile);

router.post("/s3/file", uploadMiddleware({ type: "single", field: "file" }), FileController.uploadS3File);
router.post("/s3/image", uploadMiddleware({ type: "single", field: "image" }), FileController.uploadS3Image);
router.post("/s3/files", uploadMiddleware({ type: "multiple", field: "files", maxCount: 10 }), FileController.uploadS3Files);
router.post("/s3/images", uploadMiddleware({ type: "multiple", field: "images", maxCount: 10 }), FileController.uploadS3Images);
router.post("/s3/all", uploadMiddleware({ type: "fields", fields: ["file", "image"], maxCount: 5 }), FileController.uploadS3Fields);
router.delete("/s3/file/:key", FileController.deleteS3File);

export default router;
