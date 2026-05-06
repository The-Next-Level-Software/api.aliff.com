import fs from "fs";
import path from "path";
import { Worker } from "bullmq";
import { cacheService } from "../services/cache.service.js";
import { fileService } from "../services/file.service.js";

console.log("🚀 FileWorker process starting...");
console.log("🔗 Redis status:", cacheService.client?.status);

export const fileWorker = new Worker(
    "fileQueue",
    async (job) => {
        const { type, provider, payload } = job.data;
        console.log("Payload:", payload);

        switch (type) {

            // ---------------- SINGLE ----------------
            case "UPLOAD_SINGLE": {
                const { tempPath, originalname, mimetype, size, options = {} } = payload;
                if (!tempPath) throw new Error("File path is required");

                const fileBuffer = fs.readFileSync(tempPath);
                const fileForUpload = { buffer: fileBuffer, originalname, mimetype, size };

                const result = await fileService.uploadSingle({
                    file: fileForUpload,
                    options,
                    provider,
                });

                fs.unlinkSync(tempPath); // clean up
                return result;
            }

            // ---------------- MULTIPLE ----------------
            case "UPLOAD_MULTIPLE": {
                const { tempFiles, options = {} } = payload;
                if (!tempFiles || !tempFiles.length) return [];

                const uploaded = [];
                for (const f of tempFiles) {
                    const fileBuffer = fs.readFileSync(f.tempPath);
                    const fileForUpload = {
                        buffer: fileBuffer,
                        originalname: f.originalname,
                        mimetype: f.mimetype,
                        size: f.size,
                    };

                    const result = await fileService.uploadSingle({
                        file: fileForUpload,
                        options,
                        provider,
                    });

                    fs.unlinkSync(f.tempPath);
                    uploaded.push(result);
                }
                return uploaded;
            }

            // ---------------- MULTIPLE FIELDS ----------------
            case "UPLOAD_FIELDS": {
                const { fields } = payload; // { fieldName: [files] }
                const uploaded = [];

                for (const fieldName in fields) {
                    const filesArray = fields[fieldName];

                    for (const f of filesArray) {
                        const fileBuffer = fs.readFileSync(f.tempPath);
                        const fileForUpload = {
                            buffer: fileBuffer,
                            originalname: f.originalname,
                            mimetype: f.mimetype,
                            size: f.size,
                        };

                        const options = fieldName === "image" ? { compress: true } : {};
                        const result = await fileService.uploadSingle({
                            file: fileForUpload,
                            options,
                            provider,
                        });

                        fs.unlinkSync(f.tempPath);
                        uploaded.push({ field: fieldName, ...result });
                    }
                }
                return uploaded;
            }

            // ---------------- DELETE ----------------
            case "DELETE_FILE": {
                const { filename } = payload;
                if (!filename) throw new Error("Filename is required");

                await fileService.deleteFile({ fileId: filename, provider });
                return { success: true, filename };
            }

            default:
                throw new Error(`Unknown job type: ${type}`);
        }
    },
    {
        connection: cacheService.client,
        concurrency: 5,
    }
);

fileWorker.on("completed", (job) => {
    console.log(`✅ File job ${job.id} completed`);
});

fileWorker.on("failed", (job, err) => {
    console.error(`❌ File job ${job.id} failed:`, err.message);
});
