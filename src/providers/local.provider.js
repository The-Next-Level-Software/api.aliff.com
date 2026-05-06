import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
class LocalFileProvider {
    /**
     * Upload a file to the local public folder
     * @param {Object} file - File object from multer
     * @param {Object} options - Options for upload
     * @param {string} options.folder - Subfolder inside public (default: "")
     * @param {boolean} options.compress - Whether to compress image (default: false)
     * @param {number} options.width - Width to resize image if compressing (default: 300)
     * @returns {Object} File info including url
     */
    async upload(file, options = {}) {
        const {
            folder = "",       // default: save directly inside public
            compress = false,
            width = 300,
        } = options;

        // Build full path inside public folder
        const basePath = path.join(process.cwd(), "public", folder);

        // Create folder if it doesn't exist
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true });
        }

        const ext = path.extname(file.originalname);

        // random 6 chars
        const random = crypto.randomBytes(3).toString("hex");

        // final filename
        const filename = `file-${Date.now()}-${random}${ext}`;
        const filePath = path.join(basePath, filename);

        // If image and compress option is true, resize
        if (compress && file.mimetype.startsWith("image/")) {
            const buffer = await sharp(file.buffer)
                .resize(width)
                .toBuffer();

            fs.writeFileSync(filePath, buffer);
        } else {
            fs.writeFileSync(filePath, file.buffer);
        }

        return {
            provider: "local",
            filename,
            url: folder ? `/${folder}/${filename}` : `/${filename}`, // direct public URL
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    /**
    * Delete a file from local public folder
    * @param {string} filename - Name of the file to delete
    * @param {string} folder - Subfolder inside public (optional, default: "")
    * @returns {boolean} True if file deleted
    * @throws {Error} If file not found
    */
    delete(filename, folder = "") {
        const filePath = path.join(process.cwd(), "public", folder, filename);

        if (!fs.existsSync(filePath)) {
            throw new Error("File not found");
        }

        fs.unlinkSync(filePath);
        return true;
    }
}

export const localFileProvider = new LocalFileProvider();
