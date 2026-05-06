import { getFileProvider } from '../providers/index.js';
class FileService {
    async uploadSingle({ file, options, provider }) {
        if (!file) throw new Error("File is required");
        return getFileProvider(provider).upload(file, options);
    }

    async deleteFile({ fileId, provider }) {
        return getFileProvider(provider).delete(fileId);
    }

    async uploadMultiple({ files, options, provider }) {
        if (!files || !files.length) return [];
        return Promise.all(
            files.map(file => getFileProvider(provider).upload(file, options))
        );
    }
}

export const fileService = new FileService();
