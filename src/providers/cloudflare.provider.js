import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";
import appConfig from "../config/index.js";

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${appConfig.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: appConfig.CLOUDFLARE_ACCESS_KEY,
        secretAccessKey: appConfig.CLOUDFLARE_SECRET_KEY,
    },
});

class CloudflareR2Provider {
    /**
     * Upload a file to Cloudflare R2
     * @param {Object} file - File object from multer
     * @param {Object} options - Upload options
     * @param {string} options.folder - Subfolder/prefix inside bucket (default: "uploads")
     * @returns {Object} File info including url and key
     */
    async upload(file, options = {}) {
        const folder = options.folder || "uploads";
        const ext = path.extname(file.originalname);
        const random = crypto.randomBytes(3).toString("hex");
        const filename = `file-${Date.now()}-${random}${ext}`;
        const key = `${folder}/${filename}`;

        await r2.send(new PutObjectCommand({
            Bucket: appConfig.CLOUDFLARE_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        // If you have a custom public domain on R2, use that — otherwise use the R2 public URL
        const baseUrl = appConfig.CLOUDFLARE_PUBLIC_URL?.replace(/\/$/, "");
        const url = `${baseUrl}/${key}`;

        return {
            provider: "cloudflare",
            key,
            url,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    /**
     * Delete a file from Cloudflare R2
     * @param {string} key - Full R2 key (e.g., "uploads/file-123456-abc.jpg")
     * @returns {Promise<boolean>} True if deleted
     * @throws {Error} If key not provided
     */
    async delete(key) {
        if (!key) throw new Error("R2 key is required");

        await r2.send(new DeleteObjectCommand({
            Bucket: appConfig.CLOUDFLARE_BUCKET,
            Key: key,
        }));

        return true;
    }
}

export const cloudflareR2Provider = new CloudflareR2Provider();