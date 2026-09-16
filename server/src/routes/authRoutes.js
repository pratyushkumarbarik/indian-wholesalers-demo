import express from "express";

import {
  login,
  signup,
  logout,
} from "../controllers/authController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/signup", signup);

router.post("/logout", logout);

/*
 * /me is used to verify the currently logged-in
 * account.
 *
 * The middleware uses the appropriate authentication
 * cookie for the requested role.
 */

router.get(
  "/regulator/me",
  authenticate("REGULATOR"),
  (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

router.get(
  "/admin/me",
  authenticate("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

export default router;