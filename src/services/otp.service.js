// src/services/otp.service.js
import crypto from "crypto";

import { emailService } from "./email.service.js";
import { Otp } from "../startup/models.js";

class OTPService {
  constructor() {
    this.expiryMinutes = 5;
    this.maxAttempts = 3;
  }

  generateOTP(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
    return otp;
  }

  hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  async create(email) {
    const otp = this.generateOTP();
    const hashed = this.hashOTP(otp);

    await Otp.upsert({
      where: { email },
      update: {
        otp: hashed,
        attempts: 0,
        expiresAt: new Date(Date.now() + this.expiryMinutes * 60 * 1000),
      },
      create: {
        email,
        otp: hashed,
        attempts: 0,
        expiresAt: new Date(Date.now() + this.expiryMinutes * 60 * 1000),
      },
    });

    await emailService.sendOTPEmail(email, otp);

    return { message: "OTP sent successfully.", email, expiryMinutes: this.expiryMinutes, otp };
  }

  async verify(email, otp) {
    const record = await Otp.findUnique({ where: { email } });

    if (!record) return { success: false, message: "OTP not found." };
    if (record.expiresAt < new Date()){
      await Otp.delete({ where: { email } });
      return { success: false, message: "OTP has expired." };
    } 
    if (record.attempts >= this.maxAttempts) {
      await Otp.delete({ where: { email } });
      return { success: false, message: "Too many attempts. Please request a new OTP." };
    }

    const hashed = this.hashOTP(otp);

    if (hashed !== record.otp) {
      await Otp.update({ where: { email }, data: { attempts: { increment: 1 } } });
      return { success: false, message: "Invalid OTP." };
    }

    // Mark as verified instead of deleting — resetPassword will consume it
    await Otp.update({ where: { email }, data: { isVerified: true } });
    return { success: true, message: "OTP verified successfully." };
  }

  // Called by resetPassword — checks isVerified flag then cleans up
  async consume(email) {
    const record = await Otp.findUnique({ where: { email } });

    if (!record) return { success: false, message: "OTP verification required." };
    if (!record.isVerified) return { success: false, message: "OTP not verified." };
    if (record.expiresAt < new Date()) {
      await Otp.delete({ where: { email } });
      return { success: false, message: "OTP session expired. Please request a new OTP." };
    }

    await Otp.delete({ where: { email } });
    return { success: true };
  }

  async clear(email) {
    await Otp.delete({ where: { email } });
  }
}

export const otpService = new OTPService();
