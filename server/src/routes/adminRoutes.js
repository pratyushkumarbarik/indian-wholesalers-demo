import express from "express";

import {
  createAdminAccount,
  getAdminAccounts,
  blockAdminAccount,
  unblockAdminAccount,
} from "../controllers/adminController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * All Admin-management routes are controlled by
 * the REGULATOR session.
 *
 * This is important because the Admin and Regulator
 * now have separate authentication cookies.
 */

router.post(
  "/",
  authenticate("REGULATOR"),
  authorize("REGULATOR"),
  createAdminAccount
);

router.get(
  "/",
  authenticate("REGULATOR"),
  authorize("REGULATOR"),
  getAdminAccounts
);

router.patch(
  "/:id/block",
  authenticate("REGULATOR"),
  authorize("REGULATOR"),
  blockAdminAccount
);

router.patch(
  "/:id/unblock",
  authenticate("REGULATOR"),
  authorize("REGULATOR"),
  unblockAdminAccount
);

export default router;