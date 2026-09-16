import prisma from "../config/database.js";

import {
  assignQuerySequentially,
  assignNextWaitingQuery,
} from "./assignmentService.js";


/*
  ============================================================
  CREATE CUSTOMER QUERY
  ============================================================

  Flow:

  Customer submits query
          ↓
  Query created as WAITING
          ↓
  Assignment engine checks employees
          ↓
  AVAILABLE employee
          ↓
  ASSIGNED

  If everybody is busy:

  Query remains WAITING in database.
*/
export async function createCustomerQuery({
  customerId,
  department,
  feature,
  description,
  documents = [],
}) {
  /*
    Verify customer.
  */
  const customer =
    await prisma.user.findUnique({
      where: {
        id: customerId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

  if (!customer) {
    throw new Error(
      "Customer account not found"
    );
  }

  if (customer.role !== "CUSTOMER") {
    throw new Error(
      "Only customers can submit queries"
    );
  }

  if (customer.status !== "ACTIVE") {
    throw new Error(
      "Customer account is disabled"
    );
  }


  /*
    Validate query information.
  */
  if (
    !department ||
    !department.trim()
  ) {
    throw new Error(
      "Department is required"
    );
  }

  if (
    !feature ||
    !feature.trim()
  ) {
    throw new Error(
      "Feature is required"
    );
  }

  if (
    !description ||
    !description.trim()
  ) {
    throw new Error(
      "Problem description is required"
    );
  }


  /*
    Create query.

    IMPORTANT:

    Every query is first stored in PostgreSQL
    as WAITING.

    Therefore, even if all employees are busy,
    the query does NOT disappear.
  */
  const query =
    await prisma.query.create({
      data: {
        customerId:
          customer.id,

        department:
          department.trim(),

        feature:
          feature.trim(),

        description:
          description.trim(),

        status:
          "WAITING",

        documents:
          documents.length > 0
            ? {
                create:
                  documents.map(
                    (document) => ({
                      originalName:
                        document.originalName,

                      storedName:
                        document.storedName,

                      mimeType:
                        document.mimeType,

                      size:
                        document.size,

                      path:
                        document.path,
                    })
                  ),
              }
            : undefined,
      },

      include: {
        documents: true,
      },
    });


  /*
    Try immediate assignment.

    If employee is available:
        WAITING → ASSIGNED

    If nobody is available:
        remains WAITING
  */
  const assignment =
    await assignQuerySequentially(
      query.id
    );


  /*
    Fetch final query state.
  */
  const finalQuery =
    await prisma.query.findUnique({
      where: {
        id: query.id,
      },

      include: {
        documents: true,

        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });


  return {
    query: finalQuery,
    assignment,
  };
}


/*
  ============================================================
  GET CUSTOMER QUERIES
  ============================================================

  Returns all queries submitted by
  the logged-in customer.

  This includes:

  WAITING
  ASSIGNED
  IN_PROGRESS
  RESOLVED
*/
export async function getCustomerQueries(
  customerId
) {
  return prisma.query.findMany({
    where: {
      customerId,
    },

    include: {
      documents: true,

      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}


/*
  ============================================================
  GET EMPLOYEE CURRENT QUERIES
  ============================================================

  RESOLVED tasks are excluded.

  They appear in Task History instead.
*/
export async function getEmployeeQueries(
  employeeId
) {
  return prisma.query.findMany({
    where: {
      employeeId,

      status: {
        in: [
          "ASSIGNED",
          "IN_PROGRESS",
          "NEEDS_INFO",
        ],
      },
    },

    include: {
      documents: true,

      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}


/*
  ============================================================
  ACCEPT EMPLOYEE QUERY
  ============================================================

  ASSIGNED
      ↓
  IN_PROGRESS
*/
export async function acceptEmployeeQuery(
  queryId,
  employeeId
) {
  /*
    Find query.
  */
  const query =
    await prisma.query.findUnique({
      where: {
        id: queryId,
      },

      select: {
        id: true,
        employeeId: true,
        status: true,
      },
    });


  if (!query) {
    throw new Error(
      "Query not found"
    );
  }


  /*
    Verify ownership.
  */
  if (
    query.employeeId !== employeeId
  ) {
    throw new Error(
      "This task is not assigned to you"
    );
  }


  /*
    Only ASSIGNED can be accepted.
  */
  if (
    query.status !== "ASSIGNED"
  ) {
    throw new Error(
      `Task cannot be accepted because its current status is ${query.status}`
    );
  }


  /*
    Move task to IN_PROGRESS.
  */
  const updatedQuery =
    await prisma.query.update({
      where: {
        id: queryId,
      },

      data: {
        status:
          "IN_PROGRESS",

        acceptedAt:
          new Date(),
      },

      include: {
        documents: true,

        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });


  return updatedQuery;
}


/*
  ============================================================
  COMPLETE EMPLOYEE QUERY
  ============================================================

  IN_PROGRESS
       ↓
    RESOLVED
       ↓
  Employee becomes AVAILABLE
       ↓
  Check waiting queue
       ↓
  Oldest WAITING query
       ↓
    ASSIGNED
       ↓
  Employee becomes BUSY again

  This maintains the waiting queue automatically.
*/
export async function completeEmployeeQuery(
  queryId,
  employeeId
) {
  /*
    Everything happens inside one transaction.

    This keeps:

    - task completion
    - employee statistics
    - employee availability
    - waiting queue assignment

    consistent.
  */
  const result =
    await prisma.$transaction(
      async (tx) => {

        /*
          ======================================================
          1. FIND CURRENT QUERY
          ======================================================
        */
        const query =
          await tx.query.findUnique({
            where: {
              id: queryId,
            },

            select: {
              id: true,
              employeeId: true,
              status: true,
            },
          });


        if (!query) {
          throw new Error(
            "Query not found"
          );
        }


        /*
          Verify task ownership.
        */
        if (
          query.employeeId !== employeeId
        ) {
          throw new Error(
            "This task is not assigned to you"
          );
        }


        /*
          Only IN_PROGRESS task can
          be completed.
        */
        if (
          query.status !==
          "IN_PROGRESS"
        ) {
          throw new Error(
            `Task cannot be completed because its current status is ${query.status}`
          );
        }


        /*
          ======================================================
          2. MARK CURRENT QUERY AS RESOLVED
          ======================================================
        */
        const updatedQuery =
          await tx.query.update({
            where: {
              id: queryId,
            },

            data: {
              status:
                "RESOLVED",

              completedAt:
                new Date(),
            },

            include: {
              documents: true,

              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },

              employee: {
                select: {
                  id: true,
                  employeeId: true,
                  name: true,
                  email: true,
                },
              },
            },
          });


        /*
          ======================================================
          3. GET EMPLOYEE PROFILE
          ======================================================
        */
        const employee =
          await tx.employeeProfile.findUnique({
            where: {
              userId:
                employeeId,
            },

            select: {
              currentQueryCount:
                true,

              completedQueryCount:
                true,
            },
          });


        if (!employee) {
          throw new Error(
            "Employee profile not found"
          );
        }


        /*
          ======================================================
          4. MARK EMPLOYEE AVAILABLE
          ======================================================

          The employee finished the current task.

          currentQueryCount decreases.

          completedQueryCount increases.
        */
        await tx.employeeProfile.update({
          where: {
            userId:
              employeeId,
          },

          data: {
            currentQueryCount:
              Math.max(
                0,
                employee.currentQueryCount - 1
              ),

            completedQueryCount: {
              increment: 1,
            },

            availability:
              "AVAILABLE",
          },
        });


        /*
          ======================================================
          5. CHECK WAITING QUEUE
          ======================================================

          Example:

          Q1 WAITING
          Q2 WAITING
          Q3 WAITING

          Employee finishes current task.

          Q1 is automatically assigned
          to that employee.

          Q2 and Q3 remain WAITING.
        */
        const nextAssignment =
          await assignNextWaitingQuery(
            tx,
            employeeId
          );


        /*
          ======================================================
          6. RETURN RESULT
          ======================================================
        */
        return {
          completedQuery:
            updatedQuery,

          nextAssignment,
        };
      }
    );


  return result;
}


/*
  ============================================================
  EMPLOYEE TASK HISTORY
  ============================================================

  Returns only RESOLVED tasks belonging
  to the logged-in employee.
*/
export async function getEmployeeQueryHistory(
  employeeId
) {
  return prisma.query.findMany({
    where: {
      employeeId,

      status:
        "RESOLVED",
    },

    include: {
      documents: true,

      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      completedAt:
        "desc",
    },
  });
}


/*
  ============================================================
  CUSTOMER QUERY TRACKING
  ============================================================

  Used for the Amazon-style query tracking
  interface in the customer dashboard.

  Tracking:

  Query Submitted
        ↓
  In Queue
        ↓
  Assigned to Employee
        ↓
  In Progress
        ↓
  Finished
*/
export async function getCustomerQueryTracking(
  queryId,
  customerId
) {
  /*
    Find the query.

    customerId is included in the condition
    so that customers cannot access another
    customer's query.
  */
  const query =
    await prisma.query.findFirst({
      where: {
        id:
          queryId,

        customerId:
          customerId,
      },

      include: {
        documents:
          true,

        employee: {
          select: {
            id:
              true,

            employeeId:
              true,

            name:
              true,

            email:
              true,
          },
        },
      },
    });


  if (!query) {
    throw new Error(
      "Query not found"
    );
  }


  /*
    ============================================================
    CALCULATE QUEUE POSITION
    ============================================================

    Queue position exists only while the
    query has WAITING status.

    Example:

    Q1 → WAITING
    Q2 → WAITING
    Q3 → WAITING

    Q1 = #1
    Q2 = #2
    Q3 = #3

    If Q1 gets assigned:

    Q2 = #1
    Q3 = #2
  */
  let queuePosition =
    null;


  if (
    query.status ===
    "WAITING"
  ) {
    /*
      Count all WAITING queries that
      were submitted before this query.
    */
    const waitingBefore =
      await prisma.query.count({
        where: {
          status:
            "WAITING",

          createdAt: {
            lt:
              query.createdAt,
          },
        },
      });


    queuePosition =
      waitingBefore + 1;
  }


  /*
    ============================================================
    BUILD TRACKING TIMELINE
    ============================================================
  */
  const tracking = {

    /*
      ----------------------------------------------------------
      STEP 1
      QUERY SUBMITTED
      ----------------------------------------------------------
    */
    submitted: {
      completed:
        true,

      at:
        query.createdAt,
    },


    /*
      ----------------------------------------------------------
      STEP 2
      IN QUEUE
      ----------------------------------------------------------

      Every query starts as WAITING before
      assignment is attempted.

      Therefore this stage is part of
      every query lifecycle.
    */
    queued: {
      completed:
        true,

      at:
        query.createdAt,
    },


    /*
      ----------------------------------------------------------
      STEP 3
      ASSIGNED TO EMPLOYEE
      ----------------------------------------------------------
    */
    assigned: {
      completed:
        query.assignedAt !== null,

      at:
        query.assignedAt,
    },


    /*
      ----------------------------------------------------------
      STEP 4
      IN PROGRESS
      ----------------------------------------------------------

      acceptedAt is created when the employee
      clicks Accept Task.
    */
    inProgress: {
      completed:
        query.acceptedAt !== null,

      at:
        query.acceptedAt,
    },


    /*
      ----------------------------------------------------------
      STEP 5
      FINISHED
      ----------------------------------------------------------
    */
    finished: {
      completed:
        query.status ===
        "RESOLVED",

      at:
        query.completedAt,
    },
  };


  /*
    ============================================================
    RETURN CUSTOMER TRACKING INFORMATION
    ============================================================
  */
  return {

    /*
      Query information
    */
    query: {
      id:
        query.id,

      department:
        query.department,

      feature:
        query.feature,

      description:
        query.description,

      status:
        query.status,

      createdAt:
        query.createdAt,

      assignedAt:
        query.assignedAt,

      acceptedAt:
        query.acceptedAt,

      completedAt:
        query.completedAt,

      documents:
        query.documents,
    },


    /*
      Queue position.

      Example:
      1
      2
      3

      null after assignment.
    */
    queuePosition,


    /*
      Assigned employee information.

      While query is WAITING:

      employee = null

      After assignment:

      employee = {
        employeeId: "EMP003",
        name: "..."
      }
    */
    employee:
      query.employee
        ? {
            id:
              query.employee.id,

            employeeId:
              query.employee.employeeId,

            name:
              query.employee.name,

            email:
              query.employee.email,
          }
        : null,


    /*
      Timeline information.
    */
    tracking,
  };
}
/*
  ============================================================
  CUSTOMER / EMPLOYEE
  GET QUERY CHAT MESSAGES
  ============================================================
*/
export async function getQueryMessages(
  queryId,
  userId,
  role
) {
  const query =
    await prisma.query.findUnique({
      where: {
        id: queryId,
      },

      select: {
        id: true,
        customerId: true,
        employeeId: true,
        status: true,
      },
    });

  if (!query) {
    throw new Error("Query not found");
  }

  // CUSTOMER can access only their own query
  if (role === "CUSTOMER") {
    if (query.customerId !== userId) {
      throw new Error(
        "You do not have access to this query"
      );
    }
  }

  // EMPLOYEE can access only their assigned query
  else if (role === "EMPLOYEE") {
    if (query.employeeId !== userId) {
      throw new Error(
        "This query is not assigned to you"
      );
    }
  }

  else {
    throw new Error(
      "Only customers and employees can access chat"
    );
  }

  // Chat closes when query is resolved/cancelled
  if (
    query.status === "RESOLVED" ||
    query.status === "CANCELLED"
  ) {
    throw new Error(
      "Chat is closed because this query is no longer active"
    );
  }

  return prisma.queryMessage.findMany({
    where: {
      queryId,
    },

    select: {
      id: true,
      message: true,
      createdAt: true,

      sender: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          role: true,
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  });
}


/*
  ============================================================
  CUSTOMER / EMPLOYEE
  SEND QUERY CHAT MESSAGE
  ============================================================
*/
export async function sendQueryMessage({
  queryId,
  senderId,
  role,
  message,
}) {
  if (
    !message ||
    !message.trim()
  ) {
    throw new Error(
      "Message cannot be empty"
    );
  }

  const query =
    await prisma.query.findUnique({
      where: {
        id: queryId,
      },

      select: {
        id: true,
        customerId: true,
        employeeId: true,
        status: true,
      },
    });

  if (!query) {
    throw new Error("Query not found");
  }

  // CUSTOMER access
  if (role === "CUSTOMER") {
    if (query.customerId !== senderId) {
      throw new Error(
        "You do not have access to this query"
      );
    }
  }

  // EMPLOYEE access
  else if (role === "EMPLOYEE") {
    if (query.employeeId !== senderId) {
      throw new Error(
        "This query is not assigned to you"
      );
    }
  }

  else {
    throw new Error(
      "Only customers and employees can send messages"
    );
  }

  // Don't allow messages after query is closed
  if (
    query.status === "RESOLVED" ||
    query.status === "CANCELLED"
  ) {
    throw new Error(
      "Chat is closed because this query is no longer active"
    );
  }

  // Verify sender
  const sender =
    await prisma.user.findUnique({
      where: {
        id: senderId,
      },

      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        status: true,
      },
    });

  if (!sender) {
    throw new Error(
      "Sender account not found"
    );
  }

  if (sender.role !== role) {
    throw new Error(
      "Invalid sender role"
    );
  }

  if (sender.status !== "ACTIVE") {
    throw new Error(
      "Your account is disabled"
    );
  }

  return prisma.queryMessage.create({
    data: {
      queryId,
      senderId,
      message: message.trim(),
    },

    select: {
      id: true,
      message: true,
      createdAt: true,

      sender: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          role: true,
        },
      },
    },
  });
}


/*
  ============================================================
  EMPLOYEE
  CREATE / SHARE MEETING LINK
  ============================================================
*/
export async function createQueryMeeting({
  queryId,
  employeeId,
  meetingLink,
  scheduledAt = null,
}) {
  if (
    !meetingLink ||
    !meetingLink.trim()
  ) {
    throw new Error(
      "Meeting link is required"
    );
  }

  const query =
    await prisma.query.findUnique({
      where: {
        id: queryId,
      },

      select: {
        id: true,
        employeeId: true,
        status: true,
      },
    });

  if (!query) {
    throw new Error("Query not found");
  }

  // Only assigned employee can create meeting
  if (query.employeeId !== employeeId) {
    throw new Error(
      "This query is not assigned to you"
    );
  }

  // No meetings after query is closed
  if (
    query.status === "RESOLVED" ||
    query.status === "CANCELLED"
  ) {
    throw new Error(
      "Cannot create a meeting for a closed query"
    );
  }

  const employee =
    await prisma.user.findUnique({
      where: {
        id: employeeId,
      },

      select: {
        id: true,
        role: true,
        status: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Employee account not found"
    );
  }

  if (employee.role !== "EMPLOYEE") {
    throw new Error(
      "Only employees can create meetings"
    );
  }

  if (employee.status !== "ACTIVE") {
    throw new Error(
      "Employee account is disabled"
    );
  }

  let meetingDate = null;

  if (scheduledAt) {
    meetingDate = new Date(
      scheduledAt
    );

    if (
      Number.isNaN(
        meetingDate.getTime()
      )
    ) {
      throw new Error(
        "Invalid meeting date and time"
      );
    }
  }

  return prisma.meeting.create({
    data: {
      queryId,

      createdById:
        employeeId,

      meetingLink:
        meetingLink.trim(),

      scheduledAt:
        meetingDate,
    },

    select: {
      id: true,
      queryId: true,
      meetingLink: true,
      scheduledAt: true,
      createdAt: true,

      createdBy: {
        select: {
          id: true,
          employeeId: true,
          name: true,
        },
      },
    },
  });
}


/*
  ============================================================
  CUSTOMER / EMPLOYEE
  GET QUERY MEETINGS
  ============================================================
*/
export async function getQueryMeetings(
  queryId,
  userId,
  role
) {
  const query =
    await prisma.query.findUnique({
      where: {
        id: queryId,
      },

      select: {
        id: true,
        customerId: true,
        employeeId: true,
        status: true,
      },
    });

  if (!query) {
    throw new Error("Query not found");
  }

  // CUSTOMER access
  if (role === "CUSTOMER") {
    if (query.customerId !== userId) {
      throw new Error(
        "You do not have access to this query"
      );
    }
  }

  // EMPLOYEE access
  else if (role === "EMPLOYEE") {
    if (query.employeeId !== userId) {
      throw new Error(
        "This query is not assigned to you"
      );
    }
  }

  else {
    throw new Error(
      "Only customers and employees can access meetings"
    );
  }

  // Closed query cannot use active chat/meeting
  if (
    query.status === "RESOLVED" ||
    query.status === "CANCELLED"
  ) {
    throw new Error(
      "Meetings are closed because this query is no longer active"
    );
  }

  return prisma.meeting.findMany({
    where: {
      queryId,
    },

    select: {
      id: true,
      queryId: true,
      meetingLink: true,
      scheduledAt: true,
      createdAt: true,

      createdBy: {
        select: {
          id: true,
          employeeId: true,
          name: true,
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  });
}