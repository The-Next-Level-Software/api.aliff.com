import AWS from "aws-sdk";
import appConfig from "../config/index.js";

const s3 = new AWS.S3({
    accessKeyId: appConfig.AWS_ACCESS_KEY,
    secretAccessKey: appConfig.AWS_SECRET_KEY,
    region: appConfig.AWS_REGION,
});

class S3FileProvider {
    async upload(file, options = {}) {
        const folder = options.folder || "uploads";
        const key = `${folder}/${Date.now()}-${file.originalname}`;

        const result = await s3.upload({
            Bucket: appConfig.AWS_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }).promise();

        return {
            provider: "s3",
            key,
            url: result.Location,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    /**
     * Delete a file from S3
     * @param {string} key - Full S3 key (e.g., "uploads/1697541234567-photo.jpg")
     * @returns {Promise<boolean>} True if file deleted
     * @throws {Error} If key not provided
     */
    async delete(key) {
        if (!key) throw new Error("S3 key is required");

        await s3.deleteObject({
            Bucket: appConfig.AWS_BUCKET,
            Key: key,
        }).promise();

        return true;
    }

}

export const s3FileProvider = new S3FileProvider();
