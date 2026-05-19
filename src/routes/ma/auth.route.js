// src/routes/auth.route.js
import express from "express";

import AuthController from "../../controllers/ma/auth.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

// Public
router.post("/register", validate(["email"]), AuthController.register);
router.post("/login", validate(["email"]), AuthController.login);
router.post("/social", AuthController.socialLogin);
router.post("/check-email", validate(["email"]), AuthController.checkEmail);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/forgot-password", validate(["email"]), AuthController.forgotPassword);
router.post("/verify-otp", validate(["email", "otp"]), AuthController.verifyOtp);
router.post("/reset-password", validate(["email", "newPassword"]), AuthController.resetPassword);

// Protected
router.use(authMiddleware());
router.post("/add-account", validate(["provider", "token"]), AuthController.addAccount);
router.get("/me", AuthController.getMe);
router.patch("/update-profile", AuthController.updateProfile);
router.patch("/change-password", validate(["currentPassword", "newPassword"]), AuthController.changePassword);

export default router;
