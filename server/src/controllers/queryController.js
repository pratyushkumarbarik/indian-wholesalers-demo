import {
  createCustomerQuery,
  getCustomerQueries,
  getEmployeeQueries,
  acceptEmployeeQuery,
  completeEmployeeQuery,
  getEmployeeQueryHistory,
  getCustomerQueryTracking,

  // CHAT
  getQueryMessages,
  sendQueryMessage,

  // MEETING
  createQueryMeeting,
  getQueryMeetings,
} from "../services/queryService.js";


/*
  ============================================================
  CUSTOMER
  Submit a new query
  ============================================================
*/
export async function createQuery(req, res) {
  try {
    const customerId = req.user.id;

    const {
      department,
      feature,
      description,
    } = req.body;

    if (!department || !feature || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Department, feature, and description are required",
      });
    }

    const result =
      await createCustomerQuery({
        customerId,
        department,
        feature,
        description,
        documents: [],
      });

    return res.status(201).json({
      success: true,

      message:
        result.assignment.assigned
          ? "Query submitted and assigned to an employee"
          : "Query submitted and added to the waiting queue",

      query: result.query,

      assignment: {
        status:
          result.assignment.status,

        assigned:
          result.assignment.assigned,

        employeeId:
          result.assignment.employeeId ||
          null,

        employeeName:
          result.assignment.employeeName ||
          null,

        message:
          result.assignment.message ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "Create customer query error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to submit customer query",
    });
  }
}


/*
  ============================================================
  CUSTOMER
  Get all queries submitted by logged-in customer
  ============================================================
*/
export async function getMyQueries(req, res) {
  try {
    const customerId = req.user.id;

    const queries =
      await getCustomerQueries(
        customerId
      );

    return res.json({
      success: true,
      queries,
    });
  } catch (error) {
    console.error(
      "Get customer queries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch customer queries",
    });
  }
}


/*
  ============================================================
  CUSTOMER
  Get tracking information for ONE query
  ============================================================
*/
export async function getQueryTracking(
  req,
  res
) {
  try {
    const customerId =
      req.user.id;

    const queryId =
      req.params.id;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    const tracking =
      await getCustomerQueryTracking(
        queryId,
        customerId
      );

    return res.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error(
      "Get query tracking error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch query tracking",
    });
  }
}


/*
  ============================================================
  EMPLOYEE
  Get current queries assigned to
  logged-in employee
  ============================================================
*/
export async function getAssignedQueries(
  req,
  res
) {
  try {
    const employeeId =
      req.user.id;

    const queries =
      await getEmployeeQueries(
        employeeId
      );

    return res.json({
      success: true,
      queries,
    });
  } catch (error) {
    console.error(
      "Get employee queries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch employee queries",
    });
  }
}


/*
  ============================================================
  EMPLOYEE
  Accept assigned task

  ASSIGNED
      ↓
  IN_PROGRESS
  ============================================================
*/
export async function acceptQuery(
  req,
  res
) {
  try {
    const employeeId =
      req.user.id;

    const queryId =
      req.params.id;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    const query =
      await acceptEmployeeQuery(
        queryId,
        employeeId
      );

    return res.json({
      success: true,

      message:
        "Task accepted successfully",

      query,
    });
  } catch (error) {
    console.error(
      "Accept employee query error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to accept task",
    });
  }
}


/*
  ============================================================
  EMPLOYEE
  Complete task

  IN_PROGRESS
      ↓
  RESOLVED

  After completion:

  Employee → AVAILABLE
          ↓
  Check WAITING queue
          ↓
  Oldest waiting query
          ↓
  Assign to this employee
  ============================================================
*/
export async function completeQuery(
  req,
  res
) {
  try {
    const employeeId =
      req.user.id;

    const queryId =
      req.params.id;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    const result =
      await completeEmployeeQuery(
        queryId,
        employeeId
      );

    return res.json({
      success: true,

      message:
        "Task completed successfully",

      query:
        result.completedQuery,

      nextAssignment:
        result.nextAssignment,
    });
  } catch (error) {
    console.error(
      "Complete employee query error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to complete task",
    });
  }
}


/*
  ============================================================
  EMPLOYEE
  Get completed task history
  ============================================================
*/
export async function getEmployeeHistory(
  req,
  res
) {
  try {
    const employeeId =
      req.user.id;

    const queries =
      await getEmployeeQueryHistory(
        employeeId
      );

    return res.json({
      success: true,
      queries,
    });
  } catch (error) {
    console.error(
      "Get employee query history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch task history",
    });
  }
}


/*
  ============================================================
  CHAT
  Get messages for a query
  ============================================================

  CUSTOMER:
    Can access only their own query.

  EMPLOYEE:
    Can access only their assigned query.

  Chat is closed when the query is
  RESOLVED or CANCELLED.
  ============================================================
*/
export async function getMessages(
  req,
  res
) {
  try {
    const userId =
      req.user.id;

    const role =
      req.user.role;

    const queryId =
      req.params.id;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    const messages =
      await getQueryMessages(
        queryId,
        userId,
        role
      );

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get query messages error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch chat messages",
    });
  }
}


/*
  ============================================================
  CHAT
  Send message
  ============================================================

  CUSTOMER:
    Sends message regarding their own query.

  EMPLOYEE:
    Sends message regarding their assigned query.

  RESOLVED/CANCELLED:
    Message is rejected.
  ============================================================
*/
export async function sendMessage(
  req,
  res
) {
  try {
    const senderId =
      req.user.id;

    const role =
      req.user.role;

    const queryId =
      req.params.id;

    const {
      message,
    } = req.body;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    if (
      !message ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Message cannot be empty",
      });
    }

    const createdMessage =
      await sendQueryMessage({
        queryId,
        senderId,
        role,
        message,
      });

    return res.status(201).json({
      success: true,

      message:
        "Message sent successfully",

      chatMessage:
        createdMessage,
    });
  } catch (error) {
    console.error(
      "Send query message error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to send message",
    });
  }
}


/*
  ============================================================
  EMPLOYEE
  Create / share meeting
  ============================================================

  Only the employee assigned to the
  query can create a meeting.

  The meeting belongs to the query.
  ============================================================
*/
export async function createMeeting(
  req,
  res
) {
  try {
    const employeeId =
      req.user.id;

    const queryId =
      req.params.id;

    const {
      meetingLink,
      scheduledAt,
    } = req.body;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    if (
      !meetingLink ||
      !meetingLink.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Meeting link is required",
      });
    }

    const meeting =
      await createQueryMeeting({
        queryId,
        employeeId,
        meetingLink,
        scheduledAt:
          scheduledAt || null,
      });

    return res.status(201).json({
      success: true,

      message:
        "Meeting link shared successfully",

      meeting,
    });
  } catch (error) {
    console.error(
      "Create query meeting error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create meeting",
    });
  }
}


/*
  ============================================================
  CUSTOMER / EMPLOYEE
  Get meetings for a query
  ============================================================

  CUSTOMER:
    Only their own query.

  EMPLOYEE:
    Only their assigned query.
  ============================================================
*/
export async function getMeetings(
  req,
  res
) {
  try {
    const userId =
      req.user.id;

    const role =
      req.user.role;

    const queryId =
      req.params.id;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message:
          "Query ID is required",
      });
    }

    const meetings =
      await getQueryMeetings(
        queryId,
        userId,
        role
      );

    return res.json({
      success: true,
      meetings,
    });
  } catch (error) {
    console.error(
      "Get query meetings error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch meetings",
    });
  }
}