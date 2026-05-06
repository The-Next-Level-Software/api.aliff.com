import bcrypt from "bcryptjs";

export class PasswordUtils {
  /**
   * Hash a plain password
   */
  static async hash(password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare plain password with hashed password
   */
  static async compare(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a bcrypt salt
   */
  static async generateSalt(rounds = 10) {
    return bcrypt.genSalt(rounds);
  }

  /**
   * Validate password strength (basic)
   */
  static isStrongPassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return regex.test(password);
  }

  /**
   * Generate a temporary random password
   */
  static generateTempPassword(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&";
    let pass = "";
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  /**
   * Check if password is same as old hash
   * (Useful when user updates password)
   */
  static async isSameAsOldPassword(newPassword, oldHash) {
    return this.compare(newPassword, oldHash);
  }
}
