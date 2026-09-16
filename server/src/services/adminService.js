import bcrypt from "bcryptjs";

import prisma from "../config/database.js";

export async function createAdmin({
  name,
  email,
  password,
  regulatorId,
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      createdById: regulatorId,
    },
  });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    createdById: admin.createdById,
    createdAt: admin.createdAt,
  };
}

export async function getAdmins(regulatorId) {
  return prisma.user.findMany({
    where: {
      role: "ADMIN",
      createdById: regulatorId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function blockAdmin(adminId, regulatorId) {
  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      createdById: regulatorId,
    },
  });

  if (!admin) {
    throw new Error("Admin account not found");
  }

  if (admin.status === "DISABLED") {
    throw new Error("Admin account is already blocked");
  }

  return prisma.user.update({
    where: {
      id: adminId,
    },
    data: {
      status: "DISABLED",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function unblockAdmin(adminId, regulatorId) {
  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      createdById: regulatorId,
    },
  });

  if (!admin) {
    throw new Error("Admin account not found");
  }

  if (admin.status === "ACTIVE") {
    throw new Error("Admin account is already active");
  }

  return prisma.user.update({
    where: {
      id: adminId,
    },
    data: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}