import appConfig from "../config/index.js";
import prisma from "../config/prisma.js";
import { JwtUtils } from "../utils/jwt.util.js";
import { PasswordUtils } from "../utils/password.util.js";

class AuthService {
  static getUserPayload(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }

  static async comparePassword(plain, hashed) {
    return PasswordUtils.compare(plain, hashed);
  }

  static async generateAuthTokens(user, req) {
    const payload = this.getUserPayload(user);
    const { accessToken, refreshToken } = JwtUtils.generateTokenPair(payload);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ip: req?.ip || null,
        userAgent: req?.headers?.["user-agent"] || null,
      },
    });

    return { accessToken, refreshToken };
  }

  static async refreshToken(refreshToken) {
    const session = await prisma.session.findFirst({
      where: { refreshToken, isActive: true },
      include: { user: { include: { role: true } } },
    });

    if (!session) throw new Error("Invalid or expired refresh token");

    const newAccessToken = JwtUtils.refreshAccessToken(refreshToken, appConfig.jwt.accessExpires);

    return { accessToken: newAccessToken, refreshToken };
  }

  static async logout(refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  static async logoutAll(userId) {
    await prisma.session.deleteMany({ where: { userId } });
  }
}

export default AuthService;
