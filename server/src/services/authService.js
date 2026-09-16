import bcrypt from "bcryptjs";

import prisma from "../config/database.js";

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Account is disabled");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function createCustomer({
  name,
  email,
  password,
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists"
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  const customer = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    role: customer.role,
    status: customer.status,
    createdAt: customer.createdAt,
  };
}