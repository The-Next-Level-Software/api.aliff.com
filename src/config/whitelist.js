// src/config/whitelist.js

export const WHITELIST = {
  overall: [
    "/auth/check-email",
    "/auth/register",
    "/auth/login",
    "/auth/logout",
    "/auth/refresh-token",
    "/auth/verify-otp",
    "/auth/social",
  ],

  mobile: ["/mobile/login", "/mobile/register", "/mobile/forgot-password"],

  admin: ["/admin/login", "/admin/register"],

  // Add more categories as needed
  other: [],
};
