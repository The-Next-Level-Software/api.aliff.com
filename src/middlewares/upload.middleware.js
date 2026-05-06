import multer from "multer";
import { generateApiResponse } from "../utils/response.util.js";

const storage = multer.memoryStorage();

/**
 * Upload middleware factory for handling multipart/form-data
 *
 * @param {Object} options - Configuration options for upload behavior
 * @param {"single"|"multiple"|"fields"} [options.type="single"]
 * @param {string} [options.field="file"]
 * @param {string[]} [options.fields=[]]
 * @param {number} [options.maxCount=5]
 * @param {number} [options.maxSize=5242880]
 *
 * @returns {Function} Express middleware function configured for file uploads
 */
export function uploadMiddleware({
    type = "single",
    field = "file",
    fields = [],
    maxCount = 5,
    maxSize = 5 * 1024 * 1024,
} = {}) {
    const upload = multer({
        storage,
        limits: { fileSize: maxSize },
    });

    // Middleware to check required fields after upload
    const checkRequiredFields = (req, res, next) => {
        if (type === "single" || type === "multiple") {
            if (!req.file && !(req.files && req.files.length > 0)) {
                return generateApiResponse(res, 400, "Missing required file(s)");
            }
        }

        if (type === "fields") {
            for (const name of fields) {
                if (!req.files || !req.files[name] || req.files[name].length === 0) {
                    return generateApiResponse(res, 400, `Missing required field: ${name}`);
                }
            }
        }

        next();
    };

    if (type === "single") {
        return (req, res, next) => upload.single(field)(req, res, (err) => {
            if (err) return next(err);
            checkRequiredFields(req, res, next);
        });
    }

    if (type === "fields") {
        return (req, res, next) => upload.fields(fields.map(name => ({ name, maxCount })))(req, res, (err) => {
            if (err) return next(err);
            checkRequiredFields(req, res, next);
        });
    }

    // type === "multiple"
    return (req, res, next) => upload.array(field, maxCount)(req, res, (err) => {
        if (err) return next(err);
        checkRequiredFields(req, res, next);
    });
}
