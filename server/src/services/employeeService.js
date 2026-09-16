import bcrypt from "bcryptjs";

import prisma from "../config/database.js";

export async function createEmployee({
  name,
  email,
  password,
  adminId,
}) {
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error(
      "An account with this email already exists"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const employee = await prisma.$transaction(
    async (tx) => {
      // Get the next employee number
      const counter =
        await tx.employeeCounter.upsert({
          where: {
            id: 1,
          },
          create: {
            id: 1,
            nextValue: 2,
          },
          update: {
            nextValue: {
              increment: 1,
            },
          },
        });

      // Convert number into EMP001, EMP002, EMP003...
      const employeeNumber =
        counter.nextValue - 1;

      const generatedEmployeeId = `EMP${String(
        employeeNumber
      ).padStart(3, "0")}`;

      // Create employee
      const createdEmployee =
        await tx.user.create({
          data: {
            employeeId: generatedEmployeeId,
            name,
            email,
            passwordHash,
            role: "EMPLOYEE",
            status: "ACTIVE",
            createdById: adminId,
          },
        });

      // Create employee availability profile
      await tx.employeeProfile.create({
        data: {
          userId: createdEmployee.id,
          availability: "OFFLINE",
          currentQueryCount: 0,
          completedQueryCount: 0,
        },
      });

      return createdEmployee;
    }
  );

  return {
    id: employee.id,
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    status: employee.status,
    createdById: employee.createdById,
    createdAt: employee.createdAt,
  };
}


/*
  Get employees created by the logged-in admin
*/
export async function getEmployees(adminId) {
  return prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      createdById: adminId,
    },

    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      employeeProfile: {
        select: {
          availability: true,
          currentQueryCount: true,
          completedQueryCount: true,
          lastAssignedAt: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}


/*
  Get the logged-in employee's profile
*/
export async function getEmployeeProfile(
  employeeId
) {
  const employee = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: "EMPLOYEE",
    },

    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      status: true,

      employeeProfile: {
        select: {
          availability: true,
          currentQueryCount: true,
          completedQueryCount: true,
          lastAssignedAt: true,
        },
      },
    },
  });

  if (!employee) {
    throw new Error("Employee account not found");
  }

  if (employee.status !== "ACTIVE") {
    throw new Error("Employee account is disabled");
  }

  return employee;
}


/*
  Employee becomes AVAILABLE.

  This means the employee is ready to receive
  a new query.
*/
export async function setEmployeeAvailable(
  employeeId
) {
  const employee = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: "EMPLOYEE",
      status: "ACTIVE",
    },

    include: {
      employeeProfile: true,
    },
  });

  if (!employee) {
    throw new Error("Employee account not found");
  }

  if (!employee.employeeProfile) {
    throw new Error(
      "Employee profile not found"
    );
  }

  /*
    Do not allow an employee who already has
    active work to mark themselves available.
  */
  if (
    employee.employeeProfile.currentQueryCount > 0
  ) {
    throw new Error(
      "Employee still has an active query"
    );
  }

  return prisma.employeeProfile.update({
    where: {
      userId: employeeId,
    },

    data: {
      availability: "AVAILABLE",
    },

    select: {
      availability: true,
      currentQueryCount: true,
      completedQueryCount: true,
      lastAssignedAt: true,
    },
  });
}


/*
  Employee becomes OFFLINE.

  We only allow this when the employee has
  no active query.
*/
export async function setEmployeeOffline(
  employeeId
) {
  const employee = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: "EMPLOYEE",
      status: "ACTIVE",
    },

    include: {
      employeeProfile: true,
    },
  });

  if (!employee) {
    throw new Error("Employee account not found");
  }

  if (!employee.employeeProfile) {
    throw new Error(
      "Employee profile not found"
    );
  }

  if (
    employee.employeeProfile.currentQueryCount > 0
  ) {
    throw new Error(
      "Employee cannot go offline while working"
    );
  }

  return prisma.employeeProfile.update({
    where: {
      userId: employeeId,
    },

    data: {
      availability: "OFFLINE",
    },

    select: {
      availability: true,
      currentQueryCount: true,
      completedQueryCount: true,
      lastAssignedAt: true,
    },
  });
}


/*
  Block employee
*/
export async function blockEmployee(
  employeeId,
  adminId
) {
  const employee = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: "EMPLOYEE",
      createdById: adminId,
    },
  });

  if (!employee) {
    throw new Error("Employee account not found");
  }

  if (employee.status === "DISABLED") {
    throw new Error(
      "Employee account is already blocked"
    );
  }

  return prisma.user.update({
    where: {
      id: employeeId,
    },

    data: {
      status: "DISABLED",
    },

    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}


/*
  Unblock employee
*/
export async function unblockEmployee(
  employeeId,
  adminId
) {
  const employee = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: "EMPLOYEE",
      createdById: adminId,
    },
  });

  if (!employee) {
    throw new Error("Employee account not found");
  }

  if (employee.status === "ACTIVE") {
    throw new Error(
      "Employee account is already active"
    );
  }

  return prisma.user.update({
    where: {
      id: employeeId,
    },

    data: {
      status: "ACTIVE",
    },

    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}