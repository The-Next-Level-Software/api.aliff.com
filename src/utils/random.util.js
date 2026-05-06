import crypto from "crypto";

export class RandomUtils {
  /**
   * Generate a random alphanumeric string
   */
  static randomString(length = 6) {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }

  /**
   * Generate a cryptographically secure random string
   */
  static secureString(length = 32) {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
  }

  /**
   * Generate a random number with specific digits
   */
  static randomNumber(digits = 6) {
    return Math.floor(Math.random() * Math.pow(10, digits));
  }

  /**
   * Generate OTP (6 digits by default)
   */
  static otp(digits = 6) {
    return this.randomNumber(digits).toString().padStart(digits, "0");
  }

  /**
   * Generate numeric-only random string
   */
  static numericString(length = 6) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  /**
   * Generate random string from allowed characters
   */
  static custom(
    length = 8,
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  ) {
    let output = "";
    for (let i = 0; i < length; i++) {
      output += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return output;
  }

  /**
   * Generate UUID (v4)
   */
  static uuid() {
    return crypto.randomUUID(); // Node 18+
  }

  /**
   * Generate Base64 random token
   */
  static base64Token(bytes = 32) {
    return crypto.randomBytes(bytes).toString("base64");
  }

  /**
   * Generate random hex token
   */
  static hexToken(bytes = 16) {
    return crypto.randomBytes(bytes).toString("hex");
  }
}
