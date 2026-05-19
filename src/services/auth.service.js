import { JwtUtils } from "../utils/jwt.util.js";
import { generateErrorApiResponse } from "../utils/response.util.js";
import { StatusCodes } from "http-status-codes";

class AuthService {
  static getUserPayload(user) {
    return {
      id: user.id,
      email: user.email,
    };
  }

  static generateAuthTokens(user) {
    const payload = this.getUserPayload(user);
    const { accessToken, refreshToken } = JwtUtils.generateTokenPair(payload);
    return { accessToken, refreshToken };
  }

  static refreshAccessToken(refreshToken, res) {
    if (!refreshToken)
      return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, "Refresh token is required");

    const decoded = JwtUtils.safeVerify(refreshToken);
    if (!decoded)
      return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");

    const accessToken = JwtUtils.refreshAccessToken(refreshToken);
    return { accessToken };
  }
}

export default AuthService;
