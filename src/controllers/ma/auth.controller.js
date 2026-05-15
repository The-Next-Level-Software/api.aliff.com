import { StatusCodes } from "http-status-codes";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import axios from "axios";

import { otpService } from "../../services/otp.service.js";
import { User, SocialAccount } from "../../startup/models.js";
import prisma from "../../config/prisma.js";
import { PasswordUtils } from "../../utils/password.util.js";
import { generateApiResponse, generateErrorApiResponse } from "../../utils/response.util.js";
import AuthService from "../../services/auth.service.js";
import logger from "../../config/logger.js";
import supabase from "../../config/supabase.js";

const googleClient = new OAuth2Client();

// ── Token decoders per provider ───────────────────────────────────────────────
const decodeSocialToken = async (provider, token) => {
  switch (provider) {
    case "GOOGLE": {
      // const ticket = await googleClient.verifyIdToken({
      //   idToken: token,
      //   audience: process.env.GOOGLE_CLIENT_ID,
      // });
      // const p = ticket.getPayload();
      // return { socialId: p.sub, email: p.email };
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token,
      });
      if (error) throw new Error(error.message);
      return {
        socialId: data.user.user_metadata.sub,
        email: data.user.email,
      };
    }

    case "APPLE": {
      const p = await appleSignin.verifyIdToken(token, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });
      return { socialId: p.sub, email: p.email ?? null };
    }

    case "FACEBOOK": {
      const { data } = await axios.get("https://graph.facebook.com/me", {
        params: { fields: "id,email", access_token: token },
      });
      return { socialId: data.id, email: data.email };
    }

    default:
      throw new Error("Unsupported provider");
  }
};

// Only fields that exist on the User model in schema.prisma
const userSelect = {
  id: true,
  email: true,
  createdAt: true,
};

class AuthController {
  // ── POST /auth/register ───────────────────────────────────────────────────
  static async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Email and password are required"
        );

      const existing = await User.findUnique({ where: { email } });
      if (existing)
        return generateErrorApiResponse(res, StatusCodes.CONFLICT, "Email already registered");

      // Check OTP was verified for this email
      const otpRecord = await prisma.otp.findUnique({ where: { email } });
      if (!otpRecord || !otpRecord.isVerified)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Email OTP verification required before registration"
        );
      const { error: supabaseError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip Supabase's own email confirmation since you already verified via OTP
      });

      if (supabaseError) {
        logger.warn(`[MA][Auth][register] Supabase sync failed: ${supabaseError.message}`);
        // non-fatal — user is already created in your DB, just log it
      }

      const user = await User.create({
        data: { email, passwordHash: await PasswordUtils.hash(password) },
        select: userSelect,
      });

      await prisma.otp.delete({ where: { email } });

      const tokens = AuthService.generateAuthTokens(user);
      return generateApiResponse(res, StatusCodes.CREATED, "Registered successfully", {
        user,
        ...tokens,
      });
    } catch (err) {
      logger.error(`[MA][Auth][register] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/login ──────────────────────────────────────────────────────
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, "Email is required");

      const user = await User.findUnique({
        where: { email },
        include: { socialAccounts: { select: { provider: true } } },
      });

      if (!user)
        return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, "Invalid credentials");

      // No passwordHash — social-only account
      if (!password || !user.passwordHash) {
        const providers = user.socialAccounts.map((s) => s.provider);
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `This account uses ${providers.join(", ")} login. Please use social login.`
        );
      }

      const valid = await PasswordUtils.compare(password, user.passwordHash);
      if (!valid)
        return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, "Invalid credentials");
      const isBoarded = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      })

      const { socialAccounts: _, passwordHash: __, ...safeUser } = user;
      safeUser.isBoarded = isBoarded ? true : false
      const tokens = AuthService.generateAuthTokens(safeUser);
      return generateApiResponse(res, StatusCodes.OK, "Login successful", {
        user: safeUser,
        ...tokens,
      });
    } catch (err) {
      logger.error(`[MA][Auth][login] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/social ─────────────────────────────────────────────────────
  static async socialLogin(req, res) {
    try {
      const { provider, token } = req.body;
      let isNewUser = false;

      if (!provider || !token)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "provider and token are required"
        );

      const validProviders = ["GOOGLE", "APPLE", "FACEBOOK"];
      if (!validProviders.includes(provider))
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `provider must be one of: ${validProviders.join(", ")}`
        );

      const { socialId, email } = await decodeSocialToken(provider, token);

      if (!email)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Could not retrieve email from social provider"
        );

      // SocialAccount @@unique([provider, providerId]) → compound key is provider_providerId
      const existingSocial = await SocialAccount.findUnique({
        where: { provider_providerId: { provider, providerId: socialId } },
        include: { user: { select: userSelect } },
      });

      if (existingSocial) {
        const tokens = AuthService.generateAuthTokens(existingSocial.user);
        return generateApiResponse(res, StatusCodes.OK, "Login successful", {
          user: existingSocial.user,
          ...tokens,
          isNewUser,
        });
      }

      // No social account — find by email or create new user
      let user = await User.findUnique({ where: { email }, select: userSelect });

      if (!user) {
        isNewUser = true;
        user = await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({ data: { email }, select: userSelect });
          await tx.socialAccount.create({
            data: { provider, providerId: socialId, userId: created.id },
          });
          return created;
        });
      } else {
        await SocialAccount.create({ data: { provider, providerId: socialId, userId: user.id } });
      }

      const tokens = AuthService.generateAuthTokens(user);
      return generateApiResponse(res, StatusCodes.OK, "Social login successful", {
        user,
        ...tokens,
        isNewUser,
      });
    } catch (err) {
      logger.error(`[MA][Auth][socialLogin] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/add-account ────────────────────────────────────────────────
  static async addAccount(req, res) {
    try {
      const { provider, token } = req.body;
      const userId = req.user.id;

      if (!provider || !token)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Provider and token are required"
        );

      const validProviders = ["GOOGLE", "APPLE"];
      if (!validProviders.includes(provider))
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `Provider must be one of: ${validProviders.join(", ")}`
        );

      // Decode the token using your existing function
      const { socialId, email } = await decodeSocialToken(provider, token);

      // Check if this social account is already linked to someone else
      const existingSocial = await SocialAccount.findUnique({
        where: { provider_providerId: { provider, providerId: socialId } },
      });

      if (existingSocial && existingSocial.userId !== userId)
        return generateErrorApiResponse(
          res,
          StatusCodes.CONFLICT,
          "This social account is already linked to another user"
        );

      if (existingSocial && existingSocial.userId === userId)
        return generateErrorApiResponse(
          res,
          StatusCodes.CONFLICT,
          "This social account is already linked to your account"
        );

      // Link it
      await SocialAccount.create({
        data: { userId, provider, providerId: socialId },
      });

      return generateApiResponse(res, StatusCodes.OK, "Account linked successfully");
    } catch (err) {
      logger.error(`[MA][Auth][addAccount] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/refresh-token ──────────────────────────────────────────────
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = AuthService.refreshAccessToken(refreshToken, res);
      return generateApiResponse(res, StatusCodes.OK, "Token refreshed", result);
    } catch (err) {
      logger.error(`[MA][Auth][refreshToken] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, err.message);
    }
  }

  // ── POST /auth/check-email ────────────────────────────────────────────────
  static async checkEmail(req, res) {
    try {
      const { email } = req.body;

      const existing = await User.findUnique({ where: { email } });
      if (existing)
        return generateErrorApiResponse(res, StatusCodes.CONFLICT, "Email already registered");

      const data = await otpService.create(email);
      return generateApiResponse(
        res,
        StatusCodes.OK,
        "OTP sent to your email for verification",
        data
      );
    } catch (err) {
      logger.error(`[MA][Auth][checkEmail] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/forgot-password ────────────────────────────────────────────
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findUnique({ where: { email } });

      // Always return same message to avoid email enumeration
      if (!user)
        return generateApiResponse(
          res,
          StatusCodes.OK,
          "If this email exists, an OTP has been sent"
        );

      const data = await otpService.create(email);
      return generateApiResponse(res, StatusCodes.OK, "OTP sent to your email", {data});
    } catch (err) {
      logger.error(`[MA][Auth][forgotPassword] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/verify-otp ─────────────────────────────────────────────────
  static async verifyOtp(req, res) {
    try {
      const { email, otp, isForgotPassword } = req.body;
      const result = await otpService.verify(email, otp);

      if (!result.success)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, result.message);

      if (isForgotPassword) {
        const user = await User.findUnique({ where: { email }, select: userSelect });
        if (!user) return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "User not found");
        const tokens = AuthService.generateAuthTokens(user);
        return generateApiResponse(res, StatusCodes.OK, result.message, { ...tokens });
      }

      return generateApiResponse(res, StatusCodes.OK, result.message);
    } catch (err) {
      logger.error(`[MA][Auth][verifyOtp] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── POST /auth/reset-password ─────────────────────────────────────────────
  static async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Email and password are required"
        );

      const result = await otpService.consume(email);
      if (!result.success)
        return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, result.message);

      await User.update({
        where: { email },
        data: { passwordHash: await PasswordUtils.hash(newPassword) },
      });
      return generateApiResponse(res, StatusCodes.OK, "Password reset successfully");
    } catch (err) {
      logger.error(`[MA][Auth][resetPassword] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── GET /auth/me ──────────────────────────────────────────────────────────
  static async getMe(req, res) {
    try {
      const user = await User.findUnique({
        where: { id: req.user.id },
        select: { ...userSelect, socialAccounts: { select: { provider: true, createdAt: true } } },
      });
      if (!user) return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "User not found");
      return generateApiResponse(res, StatusCodes.OK, "User fetched", { user });
    } catch (err) {
      logger.error(`[MA][Auth][getMe] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── PATCH /auth/update-profile ────────────────────────────────────────────
  static async updateProfile(req, res) {
    try {
      const { email } = req.body;
      const updateData = {};

      if (email) {
        const taken = await User.findFirst({ where: { email, NOT: { id: req.user.id } } });
        if (taken)
          return generateErrorApiResponse(res, StatusCodes.CONFLICT, "Email already in use");
        updateData.email = email;
      }

      const user = await User.update({
        where: { id: req.user.id },
        data: updateData,
        select: userSelect,
      });
      return generateApiResponse(res, StatusCodes.OK, "Profile updated", { user });
    } catch (err) {
      logger.error(`[MA][Auth][updateProfile] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  // ── PATCH /auth/change-password ───────────────────────────────────────────
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findUnique({ where: { id: req.user.id } });

      if (!user.passwordHash)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Password change not available for social accounts"
        );

      const valid = await PasswordUtils.compare(currentPassword, user.passwordHash);
      if (!valid)
        return generateErrorApiResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          "Current password is incorrect"
        );

      const isSame = await PasswordUtils.isSameAsOldPassword(newPassword, user.passwordHash);
      if (isSame)
        return generateErrorApiResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "New password must differ from current password"
        );

      await User.update({
        where: { id: req.user.id },
        data: { passwordHash: await PasswordUtils.hash(newPassword) },
      });
      return generateApiResponse(res, StatusCodes.OK, "Password changed successfully");
    } catch (err) {
      logger.error(`[MA][Auth][changePassword] ${err.message}`);
      return generateErrorApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
    }
  }
}

export default AuthController;
