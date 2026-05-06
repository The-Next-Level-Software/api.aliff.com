import jwt from "jsonwebtoken";

import appConfig from "../config/index.js";

export class JwtUtils {
  /**
   * Generate a JWT token
   */
  static generateToken(
    payload,
    expiresIn = appConfig.jwt.accessExpires,
    secret = appConfig.jwt.secret
  ) {
    const token = jwt.sign(payload, secret, { expiresIn });
    const verify = jwt.verify(token, secret);
    return token;
  }

  /**
   * Verify a JWT token
   */
  static verifyToken(token, secret = appConfig.jwt.secret) {
    return jwt.verify(token, secret);
  }

  /**
   * Decode token without verification
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Generate Access + Refresh token pair
   */
  static generateTokenPair(payload) {
    const accessToken = this.generateToken(payload, appConfig.jwt.accessExpires);
    const refreshToken = this.generateToken(payload, appConfig.jwt.refreshExpires);
    return { accessToken, refreshToken };
  }

  /**
   * Refresh an expired access token using refresh token
   */
  static refreshAccessToken(refreshToken, customExpiry = appConfig.jwt.accessExpires) {
    const decoded = this.verifyToken(refreshToken);
    delete decoded.iat;
    delete decoded.exp;
    return this.generateToken(decoded, customExpiry);
  }

  /**
   * Validate Bearer Token format
   */
  static extractBearerToken(header) {
    if (!header) return null;
    // if (!header.startsWith("Bearer ")) return null;
    return header.split(" ")[1];
  }

  /**
   * Check if token is expired
   */
  static isExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded?.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Get remaining time in seconds
   */
  static getRemainingTime(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded?.exp) return 0;
      return decoded.exp - Math.floor(Date.now() / 1000);
    } catch {
      return 0;
    }
  }

  /**
   * Try verifying safely (returns null instead of throwing)
   */
  static safeVerify(token) {
    try {
      return this.verifyToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if token is valid (boolean)
   */
  static isValid(token) {
    return this.safeVerify(token) !== null;
  }
}
