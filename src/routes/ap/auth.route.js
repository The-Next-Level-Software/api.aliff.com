// import express from "express";
// import AuthController from "../../controllers/ap/auth.controller.js";
// import { validate } from "../../middlewares/validate.middleware.js";

// const router = express.Router();

// router.post("/register", validate(["name", "email", "password"]), AuthController.register);
// router.post("/login", validate(["email", "password"], "body", { password: { skipLengthCheck: true } }), AuthController.login);
// router.post("/refresh-token", AuthController.refreshToken);
// router.post("/logout", AuthController.logout);
// router.post("/logout-all", AuthController.logoutAll);
// router.get("/me", AuthController.getMe);

// export default router;
