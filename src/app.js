import cors from "cors";
import express from "express";
import helmet from "helmet";

import { getHealth, getHealthPage } from "./config/health.js";
import { WHITELIST } from "./config/whitelist.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import maRoutes from "./routes/ma/index.js";
// import apRoutes from "./routes/ap/index.js";
import path from "path";
import { rateLimiter } from "./middlewares/rate-limiter.middleware.js";
import { abuseFilterMiddleware } from "./middlewares/abusive-words.middleware.js";

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

// Health check (public)

app.get("/health", getHealthPage);
app.get("/health.json", getHealth);
app.use("/file", express.static(path.join(process.cwd(), "public")));

// -----------------------------
// Helmet only for /api routes
// -----------------------------
app.use("/api", helmet());

// -----------------------------
// Protect APIs with authMiddleware
// -----------------------------
// Use overall whitelist from config
app.use("/api/ma", authMiddleware(WHITELIST.overall), maRoutes);
// app.use("/api/ap", authMiddleware(WHITELIST.overall), apRoutes);

// -----------------------------
// Rate Limiter (optional, can be applied to specific routes)
// -----------------------------

app.use(rateLimiter({
    requests: 200, // Max 200 requests
    minutes: 1    // Per 1 minute
}));

// -----------------------------
// pREVENT ABUSIVE LANGUAGE (optional, can be applied to specific routes)
// -----------------------------

app.use(abuseFilterMiddleware);

// -----------------------------
// Global error handler
// -----------------------------
app.use(errorMiddleware);

export default app;
