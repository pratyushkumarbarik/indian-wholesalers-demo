import {
  createAdmin,
  getAdmins,
  blockAdmin,
  unblockAdmin,
} from "../services/adminService.js";

export async function createAdminAccount(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (req.user.role !== "REGULATOR") {
      return res.status(403).json({
        success: false,
        message: "Only a regulator can create an admin account",
      });
    }

    const admin = await createAdmin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      regulatorId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin,
    });
  } catch (error) {
    console.error("Create admin error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create admin account",
    });
  }
}

export async function getAdminAccounts(req, res) {
  try {
    if (req.user.role !== "REGULATOR") {
      return res.status(403).json({
        success: false,
        message: "Only a regulator can view admin accounts",
      });
    }

    const admins = await getAdmins(req.user.id);

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin accounts",
    });
  }
}

export async function blockAdminAccount(req, res) {
  try {
    if (req.user.role !== "REGULATOR") {
      return res.status(403).json({
        success: false,
        message: "Only a regulator can block an admin account",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    const admin = await blockAdmin(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Admin account blocked successfully",
      admin,
    });
  } catch (error) {
    console.error("Block admin error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to block admin account",
    });
  }
}

export async function unblockAdminAccount(req, res) {
  try {
    if (req.user.role !== "REGULATOR") {
      return res.status(403).json({
        success: false,
        message: "Only a regulator can unblock an admin account",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    const admin = await unblockAdmin(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Admin account unblocked successfully",
      admin,
    });
  } catch (error) {
    console.error("Unblock admin error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to unblock admin account",
    });
  }
}