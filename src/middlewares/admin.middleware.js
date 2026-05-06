import { generateApiResponse } from "../utils/response.util.js";
import { StatusCodes } from 'http-status-codes';

export default function adminMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json(
            generateApiResponse(res, StatusCodes.UNAUTHORIZED, "Unauthorized: User not logged in", {}, false)
        );
    }

    // Check if role is an object or string
    const roleName = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;

    if (roleName !== "admin") {
        return res.status(403).json(
            generateApiResponse(res, StatusCodes.UNAUTHORIZED, "Forbidden: Admin access required", {}, false)
        );
    }

    next();
}
