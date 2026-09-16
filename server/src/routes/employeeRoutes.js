import express from "express";

import {
  createEmployeeAccount,
  getEmployeeAccounts,
  blockEmployeeAccount,
  unblockEmployeeAccount,
  getMyEmployeeProfile,
  makeEmployeeAvailable,
  makeEmployeeOffline,
} from "../controllers/employeeController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================
   ADMIN ROUTES
   ========================================= */

router.post(
  "/",
  authenticate("ADMIN"),
  createEmployeeAccount
);

router.get(
  "/",
  authenticate("ADMIN"),
  getEmployeeAccounts
);

router.patch(
  "/:id/block",
  authenticate("ADMIN"),
  blockEmployeeAccount
);

router.patch(
  "/:id/unblock",
  authenticate("ADMIN"),
  unblockEmployeeAccount
);


/* =========================================
   EMPLOYEE DASHBOARD ROUTES
   ========================================= */

router.get(
  "/me",
  authenticate("EMPLOYEE"),
  getMyEmployeeProfile
);

router.post(
  "/availability",
  authenticate("EMPLOYEE"),
  makeEmployeeAvailable
);

router.post(
  "/offline",
  authenticate("EMPLOYEE"),
  makeEmployeeOffline
);

export default router;