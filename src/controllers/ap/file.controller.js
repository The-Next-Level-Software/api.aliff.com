// import { generateApiResponse, generateErrorApiResponse } from "../../utils/response.util.js";
// import { FileUtils } from "../../utils/file.util.js";

// export class FileController {
//   static async uploadLocalFile(req, res) {
//     try {
//       if (!req.file) return generateApiResponse(res, 400, "File is required");
//       const file = await FileUtils.enqueueFileJob("UPLOAD_SINGLE", "local", { file: req.file, options: {} });
//       return generateApiResponse(res, 200, "Local file uploaded", { file });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadLocalImage(req, res) {
//     try {
//       if (!req.file) return generateApiResponse(res, 400, "File is required");
//       const file = await FileUtils.enqueueFileJob("UPLOAD_SINGLE", "local", { file: req.file, options: { compress: true } });
//       return generateApiResponse(res, 200, "Local image uploaded and compressed", { file });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadLocalFiles(req, res) {
//     try {
//       if (!req.files || req.files.length === 0) return generateApiResponse(res, 400, "Files are required");
//       const files = await FileUtils.enqueueFileJob("UPLOAD_MULTIPLE", "local", { files: req.files, options: {} });
//       return generateApiResponse(res, 200, "Local files uploaded", { files });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadLocalImages(req, res) {
//     try {
//       if (!req.files || req.files.length === 0) return generateApiResponse(res, 400, "Files are required");
//       const files = await FileUtils.enqueueFileJob("UPLOAD_MULTIPLE", "local", { files: req.files, options: { compress: true } });
//       return generateApiResponse(res, 200, "Local images uploaded and compressed", { files });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadLocalFields(req, res) {
//     try {
//       if (!req.files || Object.keys(req.files).length === 0) return generateApiResponse(res, 400, "Files are required");
//       const uploaded = await FileUtils.enqueueFileJob("UPLOAD_FIELDS", "local", { fields: req.files });
//       return generateApiResponse(res, 200, "Files uploaded from multiple fields", { uploaded });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async deleteFile(req, res) {
//     try {
//       const { fileId } = req.params;
//       if (!fileId) return generateApiResponse(res, 400, "FileId is required");
//       const result = await FileUtils.enqueueFileJob("DELETE_FILE", "local", { filename: fileId });
//       return generateApiResponse(res, 200, "File deleted successfully", result);
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadS3File(req, res) {
//     try {
//       if (!req.file) return generateApiResponse(res, 400, "File is required");
//       const file = await FileUtils.enqueueFileJob("UPLOAD_SINGLE", "s3", { file: req.file, options: {} });
//       return generateApiResponse(res, 200, "S3 file uploaded", { file });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadS3Image(req, res) {
//     try {
//       if (!req.file) return generateApiResponse(res, 400, "File is required");
//       const file = await FileUtils.enqueueFileJob("UPLOAD_SINGLE", "s3", { file: req.file, options: {} });
//       return generateApiResponse(res, 200, "S3 image uploaded", { file });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadS3Files(req, res) {
//     try {
//       if (!req.files || req.files.length === 0) return generateApiResponse(res, 400, "Files are required");
//       const files = await FileUtils.enqueueFileJob("UPLOAD_MULTIPLE", "s3", { files: req.files, options: {} });
//       return generateApiResponse(res, 200, "S3 files uploaded", { files });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadS3Images(req, res) {
//     try {
//       if (!req.files || req.files.length === 0) return generateApiResponse(res, 400, "Files are required");
//       const files = await FileUtils.enqueueFileJob("UPLOAD_MULTIPLE", "s3", { files: req.files, options: {} });
//       return generateApiResponse(res, 200, "S3 images uploaded", { files });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async uploadS3Fields(req, res) {
//     try {
//       if (!req.files || Object.keys(req.files).length === 0) return generateApiResponse(res, 400, "Files are required");
//       const uploaded = await FileUtils.enqueueFileJob("UPLOAD_FIELDS", "s3", { fields: req.files });
//       return generateApiResponse(res, 200, "Files uploaded to S3 from multiple fields", { uploaded });
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }

//   static async deleteS3File(req, res) {
//     try {
//       const { key } = req.params;
//       if (!key) return generateApiResponse(res, 400, "Key is required");
//       const result = await FileUtils.enqueueFileJob("DELETE_FILE", "s3", { filename: key });
//       return generateApiResponse(res, 200, "S3 file deleted successfully", result);
//     } catch (err) {
//       return generateErrorApiResponse(res, 500, err);
//     }
//   }
// }
