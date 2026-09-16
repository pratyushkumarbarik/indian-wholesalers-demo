import readline from "readline";
import bcrypt from "bcryptjs";
import prisma from "../config/database.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

async function createRegulator() {
  try {
    const name = await question("Regulator name: ");
    const email = await question("Regulator email: ");
    const password = await question("Regulator password: ");

    if (!name || !email || !password) {
      console.log("All fields are required.");
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("A user with this email already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const regulator = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "REGULATOR",
        status: "ACTIVE",
      },
    });

    console.log("\nRegulator created successfully.");
    console.log("ID:", regulator.id);
    console.log("Name:", regulator.name);
    console.log("Email:", regulator.email);
    console.log("Role:", regulator.role);
  } catch (error) {
    console.error("Failed to create regulator:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createRegulator();