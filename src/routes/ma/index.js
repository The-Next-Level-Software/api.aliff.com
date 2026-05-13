import express from "express";
import authRoutes from "./auth.route.js";
import onboardingRoutes from "./onboarding.route.js";
import closetRoutes from "./closet.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/closet", closetRoutes);

export default router;
