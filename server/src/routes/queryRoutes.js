import express from "express";

import {
  createQuery,
  getMyQueries,
  getQueryTracking,
  getAssignedQueries,
  acceptQuery,
  completeQuery,
  getEmployeeHistory,

  // CHAT
  getMessages,
  sendMessage,

  // MEETING
  createMeeting,
  getMeetings,
} from "../controllers/queryController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();


/*
  ============================================================
  CUSTOMER
  Submit a new query
  ============================================================
*/
router.post(
  "/",
  authenticate("CUSTOMER"),
  createQuery
);


/*
  ============================================================
  CUSTOMER
  Get all queries submitted by logged-in customer
  ============================================================
*/
router.get(
  "/my",
  authenticate("CUSTOMER"),
  getMyQueries
);


/*
  ============================================================
  EMPLOYEE
  Get completed task history
  ============================================================
*/
router.get(
  "/history",
  authenticate("EMPLOYEE"),
  getEmployeeHistory
);


/*
  ============================================================
  EMPLOYEE
  Get current assigned queries
  ============================================================
*/
router.get(
  "/assigned",
  authenticate("EMPLOYEE"),
  getAssignedQueries
);


/*
  ============================================================
  CUSTOMER
  Get tracking information for one query

  GET /api/queries/QUERY_ID/tracking
  ============================================================
*/
router.get(
  "/:id/tracking",
  authenticate("CUSTOMER"),
  getQueryTracking
);


/*
  ============================================================
  CHAT
  Get messages for a query

  CUSTOMER:
    Can access only their own query.

  EMPLOYEE:
    Can access only their assigned query.

  GET /api/queries/QUERY_ID/messages
  ============================================================
*/
router.get(
  "/:id/messages",
  authenticate("CUSTOMER"),
  getMessages
);

router.get(
  "/:id/messages/employee",
  authenticate("EMPLOYEE"),
  getMessages
);


/*
  ============================================================
  CHAT
  Send message to the other participant

  CUSTOMER:
    Customer → Employee

  EMPLOYEE:
    Employee → Customer

  POST /api/queries/QUERY_ID/messages
  ============================================================
*/
router.post(
  "/:id/messages",
  authenticate("CUSTOMER"),
  sendMessage
);

router.post(
  "/:id/messages/employee",
  authenticate("EMPLOYEE"),
  sendMessage
);


/*
  ============================================================
  MEETING
  Employee creates/shares meeting link

  Only the employee assigned to the query
  can create a meeting.

  POST /api/queries/QUERY_ID/meeting
  ============================================================
*/
router.post(
  "/:id/meeting",
  authenticate("EMPLOYEE"),
  createMeeting
);


/*
  ============================================================
  MEETING
  Customer gets meetings for their query
  ============================================================
*/
router.get(
  "/:id/meetings",
  authenticate("CUSTOMER"),
  getMeetings
);


/*
  ============================================================
  MEETING
  Employee gets meetings for their assigned query
  ============================================================
*/
router.get(
  "/:id/meetings/employee",
  authenticate("EMPLOYEE"),
  getMeetings
);


/*
  ============================================================
  EMPLOYEE
  Accept an assigned task

  ASSIGNED
      ↓
  IN_PROGRESS
  ============================================================
*/
router.post(
  "/:id/accept",
  authenticate("EMPLOYEE"),
  acceptQuery
);


/*
  ============================================================
  EMPLOYEE
  Complete a task

  IN_PROGRESS
      ↓
  RESOLVED

  After completion:
  Employee becomes available and the next
  waiting query can automatically be assigned.
  ============================================================
*/
router.post(
  "/:id/complete",
  authenticate("EMPLOYEE"),
  completeQuery
);


export default router;