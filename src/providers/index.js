import { localFileProvider } from "./local.provider.js";
import { s3FileProvider } from "./s3.provider.js";
import { cloudflareR2Provider } from "./cloudflare.provider.js"; // add this
import appConfig from './../config/index.js';

export function getFileProvider(provider) {
    const type = provider || appConfig.FILE_STORAGE || "local";

    switch (type.toLowerCase()) {
        case "s3":
            return s3FileProvider;
        case "cloudflare":
            return cloudflareR2Provider;
        case "local":
        default:
            return localFileProvider;
    }
}