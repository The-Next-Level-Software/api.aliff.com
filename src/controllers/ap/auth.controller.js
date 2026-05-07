// import { StatusCodes } from "http-status-codes";

// import AuthService from "../../services/auth.service.js";
// import { Role, User } from "../../models/models.js";
// import { generateApiResponse, generateErrorApiResponse } from "../../utils/response.util.js";
// import { emailQueue } from "../../queues/email_queue.js";

// class AuthController {
//   static async register(req, res) {
//     const { name, email, password } = req.body;

//     const findRole = await Role.findUnique({ where: { name: "admin" } });
//     const existing = await User.findUnique({ where: { email: email.toLowerCase() } });

//     if (existing) {
//       return generateErrorApiResponse(res, StatusCodes.CONFLICT, "User already exists");
//     }

//     const user = await User.create({
//       data: { name, email, password, roleId: findRole?.id },
//       include: { role: true },
//     });

//     await emailQueue.add("welcomeEmail", {
//       type: "welcome",
//       to: user.email,
//       variables: { name: user.name },
//     });

//     return generateApiResponse(res, StatusCodes.CREATED, "Registration successful", {
//       user: { id: user.id, name: user.name, email: user.email, role: user.role, username: user.username },
//     });
//   }

//   static async login(req, res) {
//     const { email, password } = req.body;

//     const user = await User.findUnique({ where: { email: email.toLowerCase() }, include: { role: true } });
//     if (!user) {
//       return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "User does not exist with this email");
//     }

//     const isMatch = await AuthService.comparePassword(password, user.password);
//     if (!isMatch) {
//       return generateErrorApiResponse(res, StatusCodes.UNAUTHORIZED, "Incorrect password!");
//     }

//     const tokens = await AuthService.generateAuthTokens(user, req);

//     return generateApiResponse(res, StatusCodes.OK, "Login successful", {
//       data: { tokens, user: AuthService.getUserPayload(user) },
//     });
//   }

//   static async refreshToken(req, res) {
//     const { refreshToken } = req.body;
//     const newTokens = await AuthService.refreshToken(refreshToken);
//     return generateApiResponse(res, StatusCodes.OK, "Token refreshed", newTokens);
//   }

//   static async logout(req, res) {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       return generateErrorApiResponse(res, StatusCodes.BAD_REQUEST, "Refresh token is required");
//     }
//     await AuthService.logout(refreshToken);
//     return generateApiResponse(res, StatusCodes.OK, "Logged out successfully");
//   }

//   static async logoutAll(req, res) {
//     await AuthService.logoutAll(req.user.id);
//     return generateApiResponse(res, StatusCodes.OK, "Logged out from all devices");
//   }

//   static async getMe(req, res) {
//     const user = await User.findUnique({ where: { id: req.user.id }, include: { role: true } });
//     if (!user) {
//       return generateErrorApiResponse(res, StatusCodes.NOT_FOUND, "User not found");
//     }
//     return generateApiResponse(res, StatusCodes.OK, "User details fetched", {
//       user: AuthService.getUserPayload(user),
//     });
//   }
// }

// export default AuthController;
