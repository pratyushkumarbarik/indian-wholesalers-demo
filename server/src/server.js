import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import prisma from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://indian-wholesalers-demo.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/*
 * AUTHENTICATION
 */
app.use("/api/auth", authRoutes);

/*
 * REGULATOR → ADMIN MANAGEMENT
 */
app.use("/api/admins", adminRoutes);

/*
 * ADMIN → EMPLOYEE MANAGEMENT
 */
app.use("/api/employees", employeeRoutes);

/*
 * CUSTOMER → QUERY MANAGEMENT
 */
app.use("/api/queries", queryRoutes);

/*
 * HEALTH CHECK
 */
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Indian Wholesalers API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});