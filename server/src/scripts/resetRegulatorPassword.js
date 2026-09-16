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

async function resetPassword() {
  try {
    const email = await question("Regulator email: ");
    const newPassword = await question("New password: ");

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== "REGULATOR") {
      console.log("Regulator account not found.");
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    console.log("Regulator password updated successfully.");
  } catch (error) {
    console.error("Failed to update password:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

resetPassword();