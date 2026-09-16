import {
  createEmployee,
  getEmployees,
  blockEmployee,
  unblockEmployee,
  getEmployeeProfile,
  setEmployeeAvailable,
  setEmployeeOffline,
} from "../services/employeeService.js";

export async function createEmployeeAccount(req, res) {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, and password are required",
      });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only an admin can create an employee account",
      });
    }

    const employee = await createEmployee({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      adminId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message:
        "Employee account created successfully",
      employee,
    });
  } catch (error) {
    console.error(
      "Create employee error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create employee account",
    });
  }
}

export async function getEmployeeAccounts(
  req,
  res
) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only an admin can view employee accounts",
      });
    }

    const employees = await getEmployees(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error(
      "Get employees error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch employee accounts",
    });
  }
}

export async function blockEmployeeAccount(
  req,
  res
) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only an admin can block an employee account",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await blockEmployee(
      id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Employee account blocked successfully",
      employee,
    });
  } catch (error) {
    console.error(
      "Block employee error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to block employee account",
    });
  }
}

export async function unblockEmployeeAccount(
  req,
  res
) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only an admin can unblock an employee account",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await unblockEmployee(
      id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Employee account unblocked successfully",
      employee,
    });
  } catch (error) {
    console.error(
      "Unblock employee error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to unblock employee account",
    });
  }
}


/* =========================================
   EMPLOYEE DASHBOARD
   ========================================= */

export async function getMyEmployeeProfile(
  req,
  res
) {
  try {
    const employeeId = req.user.id;

    const employee =
      await getEmployeeProfile(employeeId);

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error(
      "Get employee profile error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch employee profile",
    });
  }
}


export async function makeEmployeeAvailable(
  req,
  res
) {
  try {
    const employeeId = req.user.id;

    const profile =
      await setEmployeeAvailable(employeeId);

    return res.status(200).json({
      success: true,
      message:
        "You are now available for queries",
      profile,
    });
  } catch (error) {
    console.error(
      "Set employee available error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to change availability",
    });
  }
}


export async function makeEmployeeOffline(
  req,
  res
) {
  try {
    const employeeId = req.user.id;

    const profile =
      await setEmployeeOffline(employeeId);

    return res.status(200).json({
      success: true,
      message:
        "You are now offline",
      profile,
    });
  } catch (error) {
    console.error(
      "Set employee offline error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to change availability",
    });
  }
}