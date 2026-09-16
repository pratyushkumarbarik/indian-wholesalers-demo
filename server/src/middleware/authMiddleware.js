import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import prisma from "../config/database.js";

import { getAuthCookieName } from "../utils/auth.js";

dotenv.config({ path: "../.env" });

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in .env");
}

export function authenticate(...preferredRoles) {
  return async (req, res, next) => {
    try {
      let token = null;
      let cookieRole = null;
      let tokenRole = null;

      /*
       * =====================================================
       * 1. EMPLOYEE / CUSTOMER JWT FROM AUTHORIZATION HEADER
       * =====================================================
       *
       * EMPLOYEE and CUSTOMER authentication use:
       *
       * Authorization: Bearer <JWT>
       *
       * The frontend stores the JWT in sessionStorage.
       *
       * sessionStorage is isolated per browser tab.
       *
       * This allows:
       *
       * Tab 1 -> EMP001 / CUSTOMER A
       * Tab 2 -> EMP002 / CUSTOMER B
       * Tab 3 -> EMP003 / CUSTOMER C
       *
       * without one user's login replacing another user's
       * login in a different browser tab.
       */

      const authHeader = req.headers.authorization;

      if (
        authHeader &&
        authHeader.startsWith("Bearer ") &&
        (
          preferredRoles.includes("EMPLOYEE") ||
          preferredRoles.includes("CUSTOMER")
        )
      ) {
        token = authHeader.substring(7);

        /*
         * Remember that this token came from the Bearer
         * authentication system.
         *
         * The actual role will be verified after decoding
         * the JWT and checking the user's database record.
         */
        tokenRole = "BEARER";
      }

      /*
       * =====================================================
       * 2. ROLE-SPECIFIC COOKIE AUTHENTICATION
       * =====================================================
       *
       * REGULATOR / ADMIN continue using cookies.
       *
       * EMPLOYEE / CUSTOMER do NOT fall back to their
       * cookies when a Bearer-token route is requested.
       */

      if (!token && preferredRoles.length > 0) {
        for (const role of preferredRoles) {
          /*
           * Employee and Customer authentication should use
           * Authorization: Bearer <JWT>.
           */
          if (
            role === "EMPLOYEE" ||
            role === "CUSTOMER"
          ) {
            continue;
          }

          const cookieName = getAuthCookieName(role);

          if (req.cookies[cookieName]) {
            token = req.cookies[cookieName];
            cookieRole = role;
            break;
          }
        }
      }

      /*
       * =====================================================
       * 3. FALLBACK FOR ROUTES WITHOUT A PREFERRED ROLE
       * =====================================================
       *
       * Keep existing Regulator/Admin fallback behavior.
       *
       * Customer and Employee should authenticate through
       * Bearer tokens in their role-specific routes.
       */

      if (!token && preferredRoles.length === 0) {
        if (req.cookies.regulator_auth_token) {
          token = req.cookies.regulator_auth_token;
          cookieRole = "REGULATOR";
        } else if (req.cookies.admin_auth_token) {
          token = req.cookies.admin_auth_token;
          cookieRole = "ADMIN";
        }
      }

      /*
       * =====================================================
       * 4. NO TOKEN
       * =====================================================
       */

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      /*
       * =====================================================
       * 5. VERIFY JWT
       * =====================================================
       */

      const decoded = jwt.verify(
        token,
        JWT_SECRET
      );

      /*
       * =====================================================
       * 6. CHECK TOKEN ROLE
       * =====================================================
       *
       * Cookie authentication:
       *
       * decoded.role must match the cookie role.
       *
       * Bearer authentication:
       *
       * decoded.role must be one of the roles requested
       * by this route.
       */

      if (
        cookieRole &&
        decoded.role !== cookieRole
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication session",
        });
      }

      if (
        tokenRole === "BEARER" &&
        preferredRoles.length > 0 &&
        !preferredRoles.includes(decoded.role)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication session",
        });
      }

      /*
       * =====================================================
       * 7. CHECK CURRENT USER IN DATABASE
       * =====================================================
       */

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      /*
       * User no longer exists.
       */

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Account no longer exists",
        });
      }

      /*
       * =====================================================
       * 8. ACCOUNT MUST BE ACTIVE
       * =====================================================
       */

      if (user.status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Account is disabled",
        });
      }

      /*
       * =====================================================
       * 9. CHECK REQUESTED ROLE
       * =====================================================
       */

      if (
        preferredRoles.length > 0 &&
        !preferredRoles.includes(user.role)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to perform this action",
        });
      }

      /*
       * =====================================================
       * 10. STORE AUTHENTICATED USER
       * =====================================================
       */

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      };

      next();
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired authentication token",
      });
    }
  };
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to perform this action",
      });
    }

    next();
  };
}