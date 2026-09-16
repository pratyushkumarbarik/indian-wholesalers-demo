import prisma from "../config/database.js";

/*
  Sequential Employee Assignment

  Employee order:
  EMP001 → EMP002 → EMP003 → EMP001 → ...

  Rules:
  1. Only ACTIVE employees participate.
  2. Start from the round-robin counter.
  3. Search forward for an AVAILABLE employee.
  4. BUSY/OFFLINE employees are skipped.
  5. If no employee is available, query remains WAITING.
  6. After assignment, round-robin counter moves
     to the employee after the selected employee.
*/


/*
  Assign a NEW query to the next available employee.

  This is used when a customer submits a query.

  If nobody is available:
      Query remains WAITING.

  The query is NOT deleted.
*/
export async function assignQuerySequentially(queryId) {
  return prisma.$transaction(async (tx) => {

    /*
      Lock the assignment counter.

      This prevents two simultaneous assignments
      from using the same round-robin position.
    */
    const counters = await tx.$queryRaw`
      SELECT "id", "nextEmployeePosition"
      FROM "AssignmentCounter"
      WHERE "id" = 1
      FOR UPDATE
    `;

    if (counters.length === 0) {
      throw new Error(
        "Assignment counter has not been initialized"
      );
    }

    const counter = counters[0];

    /*
      Get all active employees.

      Employee IDs are sorted:
      EMP001
      EMP002
      EMP003
      ...
    */
    const employees = await tx.user.findMany({
      where: {
        role: "EMPLOYEE",
        status: "ACTIVE",
        employeeId: {
          not: null,
        },
      },

      include: {
        employeeProfile: true,
      },

      orderBy: {
        employeeId: "asc",
      },
    });

    if (employees.length === 0) {
      return {
        assigned: false,
        status: "WAITING",
        message:
          "No active employees are currently available.",
      };
    }

    /*
      AssignmentCounter is 1-based.

      Array position is 0-based.

      Example:

      nextEmployeePosition = 1
      → array position 0
      → EMP001
    */
    let startPosition =
      counter.nextEmployeePosition - 1;

    /*
      Safety check in case the counter becomes
      invalid after employees are added/removed.
    */
    if (
      startPosition < 0 ||
      startPosition >= employees.length
    ) {
      startPosition = 0;
    }

    let selectedEmployee = null;
    let selectedPosition = -1;

    /*
      Search every employee once.

      Example:

      Counter → EMP001

      EMP001 BUSY
      EMP002 BUSY
      EMP003 AVAILABLE

      Result:
      EMP003 gets the query.
    */
    for (
      let offset = 0;
      offset < employees.length;
      offset++
    ) {
      const position =
        (startPosition + offset) %
        employees.length;

      const employee = employees[position];

      if (!employee.employeeProfile) {
        throw new Error(
          `Employee profile missing for ${employee.employeeId}`
        );
      }

      if (
        employee.employeeProfile.availability ===
        "AVAILABLE"
      ) {
        selectedEmployee = employee;
        selectedPosition = position;
        break;
      }
    }

    /*
      Nobody is available.

      IMPORTANT:
      The query stays in the database as WAITING.
    */
    if (!selectedEmployee) {
      return {
        assigned: false,
        status: "WAITING",
        message:
          "All active employees are currently busy or offline.",
      };
    }

    /*
      Assign query to selected employee.
    */
    const query = await tx.query.update({
      where: {
        id: queryId,
      },

      data: {
        employeeId: selectedEmployee.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },

      include: {
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

        documents: true,
      },
    });

    /*
      Employee is now busy.
    */
    await tx.employeeProfile.update({
      where: {
        userId: selectedEmployee.id,
      },

      data: {
        availability: "BUSY",

        currentQueryCount: {
          increment: 1,
        },

        lastAssignedAt: new Date(),
      },
    });

    /*
      Move round-robin counter to the employee
      AFTER the selected employee.

      Example:

      EMP001 selected → next = EMP002
      EMP002 selected → next = EMP003
      EMP003 selected → next = EMP001
    */
    const nextPosition =
      selectedPosition + 1 >= employees.length
        ? 1
        : selectedPosition + 2;

    await tx.assignmentCounter.update({
      where: {
        id: 1,
      },

      data: {
        nextEmployeePosition: nextPosition,
      },
    });

    return {
      assigned: true,
      status: "ASSIGNED",

      employeeId:
        selectedEmployee.employeeId,

      employeeName:
        selectedEmployee.name,

      query,
    };
  });
}


/*
  Assign the oldest WAITING query to a specific
  employee who has just become available.

  This is called AFTER an employee completes a task.

  Queue rule:

      oldest WAITING query
              ↓
          assigned first

  Example:

      Q1 WAITING  ← oldest
      Q2 WAITING
      Q3 WAITING

      EMP002 becomes AVAILABLE

      Q1 → EMP002
  */
export async function assignNextWaitingQuery(
  tx,
  employeeId
) {

  /*
    Find the employee.

    We use the transaction client (tx) so that
    this operation remains part of the completion
    transaction.
    */
  const employee =
    await tx.user.findUnique({
      where: {
        id: employeeId,
      },

      include: {
        employeeProfile: true,
      },
    });

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (employee.role !== "EMPLOYEE") {
    throw new Error(
      "User is not an employee"
    );
  }

  if (!employee.employeeProfile) {
    throw new Error(
      "Employee profile not found"
    );
  }

  /*
    Find the OLDEST waiting query.

    createdAt ASC means:
    first submitted → first assigned.
  */
  const waitingQuery =
    await tx.query.findFirst({
      where: {
        status: "WAITING",
        employeeId: null,
      },

      orderBy: {
        createdAt: "asc",
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
    });

  /*
    No waiting query exists.

    Employee remains available.
  */
  if (!waitingQuery) {
    return {
      assigned: false,
      status: "NO_WAITING_QUERY",
      employeeId:
        employee.employeeId,
      message:
        "No waiting queries are currently available.",
    };
  }

  /*
    Assign waiting query to this employee.
  */
  const assignedQuery =
    await tx.query.update({
      where: {
        id: waitingQuery.id,
      },

      data: {
        employeeId: employee.id,

        status: "ASSIGNED",

        assignedAt: new Date(),
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
    Employee is busy again because the waiting
    query has now been assigned.
  */
  await tx.employeeProfile.update({
    where: {
      userId: employee.id,
    },

    data: {
      availability: "BUSY",

      currentQueryCount: {
        increment: 1,
      },

      lastAssignedAt: new Date(),
    },
  });

  return {
    assigned: true,

    status: "ASSIGNED",

    employeeId:
      employee.employeeId,

    employeeName:
      employee.name,

    query: assignedQuery,
  };
}