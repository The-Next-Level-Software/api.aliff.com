import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "error-logs");

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

export const writeErrorFile = async (error, type = "SERVER_ERROR") => {
    try {
        const timestamp = new Date().toISOString();
        const fileName = `${type}-${Date.now()}.log`;
        const filePath = path.join(logDir, fileName);

        const content = `
=====================================
Type: ${type}
Time: ${timestamp}
Message: ${error?.message}
Stack:
${error?.stack}
=====================================
`;

        await fs.promises.writeFile(filePath, content, "utf8");
    } catch (fileErr) {
        console.error("Failed to write crash log:", fileErr);
    }
};