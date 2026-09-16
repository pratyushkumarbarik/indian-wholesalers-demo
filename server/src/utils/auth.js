import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config({ path: "../.env" });

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in .env");
}

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
}

export function setAuthCookie(res, token, role) {
  const cookieName =
    role === "REGULATOR"
      ? "regulator_auth_token"
      : role === "ADMIN"
        ? "admin_auth_token"
        : role === "EMPLOYEE"
          ? "employee_auth_token"
          : "auth_token";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export function getAuthCookieName(role) {
  if (role === "REGULATOR") {
    return "regulator_auth_token";
  }

  if (role === "ADMIN") {
    return "admin_auth_token";
  }

  if (role === "EMPLOYEE") {
    return "employee_auth_token";
  }

  return "auth_token";
}