import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const rateLimiter = ({
    requests = 100,
    minutes = 15,
} = {}) => {
    return rateLimit({
        windowMs: minutes * 60 * 1000,
        max: requests,
        standardHeaders: true,
        legacyHeaders: false,

        keyGenerator: (req) => {
            // If authenticated → rate limit per user
            if (req.user?.id) {
                return `user-${req.user.id}`;
            }

            // If not authenticated → rate limit per IP (IPv6 safe)
            return ipKeyGenerator(req);
        },

        handler: (req, res) => {
            return res.status(429).json({
                success: false,
                message: "Too many requests",
                limit: req.rateLimit.limit,
                remaining: req.rateLimit.remaining,
                resetTime: req.rateLimit.resetTime,
            });
        },
    });
};