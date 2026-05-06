import logger from "../config/logger.js";
import { JwtUtils } from "../utils/jwt.util.js";
import { generateErrorApiResponse } from "../utils/response.util.js";

const isWhitelisted = (req, whitelist) => {
  return whitelist.some((item) => {
    if (item === req.path) return true;

    if (item.endsWith("/*")) {
      const base = item.replace("/*", "");
      return req.path.startsWith(base);
    }

    return false;
  });
};

const authMiddleware =
  (whitelist = []) =>
  (req, res, next) => {
    try {
      if (isWhitelisted(req, whitelist)) {
        return next();
      }

      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return generateErrorApiResponse(res, 401, "Unauthorized: Authorization header missing");
      }

      let token = authHeader;

      // If header starts with Bearer, extract token
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }

      if (!token) {
        return generateErrorApiResponse(res, 401, "Unauthorized: Token missing");
      }

      const decoded = JwtUtils.safeVerify(token);

      if (!decoded) {
        return generateErrorApiResponse(res, 401, "Unauthorized: Invalid or expired token");
      }

      req.user = decoded;
      req.token = token;

      next();
    } catch (error) {
      logger.error(`[AuthMiddleware] Token validation error: ${error.message}`);
      return generateErrorApiResponse(res, 401, "Unauthorized: Token validation failed");
    }
  };

export default authMiddleware;
