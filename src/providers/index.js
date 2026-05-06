import { localFileProvider } from "./local.provider.js";
import { s3FileProvider } from "./s3.provider.js";
import appConfig from './../config/index.js';

/**
 * Get the active file provider
 * @param {string} [provider] - Optional provider type ('s3' | 'local'). Defaults to config.
 * @returns {object} File provider object
 */
export function getFileProvider(provider) {
    const type = provider || appConfig.FILE_STORAGE || "local";

    switch (type.toLowerCase()) {
        case "s3":
            return s3FileProvider;
        case "local":
        default:
            return localFileProvider;
    }
}
