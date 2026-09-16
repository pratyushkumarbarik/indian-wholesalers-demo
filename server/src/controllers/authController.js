import {
  loginUser,
  createCustomer,
} from "../services/authService.js";

import {
  generateToken,
  setAuthCookie,
} from "../utils/auth.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await loginUser(
      email.trim().toLowerCase(),
      password
    );

    const token = generateToken(user);

    /*
     * EMPLOYEE / CUSTOMER LOGIN
     *
     * Do NOT store authentication in a browser cookie.
     *
     * The frontend will store the JWT in sessionStorage.
     *
     * sessionStorage is isolated per browser tab.
     *
     * This allows:
     *
     * Tab 1 -> EMP001 / CUSTOMER A
     * Tab 2 -> EMP002 / CUSTOMER B
     * Tab 3 -> EMP003 / CUSTOMER C
     *
     * without one user's session replacing another
     * user's session in a different tab.
     */

    if (
      user.role === "EMPLOYEE" ||
      user.role === "CUSTOMER"
    ) {
      return res.json({
        success: true,
        message: "Login successful",
        user,
        token,
      });
    }

    /*
     * REGULATOR / ADMIN
     *
     * Continue using the existing role-specific cookies.
     */

    setAuthCookie(res, token, user.role);

    return res.json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.message || "Invalid email or password",
    });
  }
}

export async function signup(req, res) {
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

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    const customer = await createCustomer({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    /*
     * Automatically log the customer in after signup.
     */

    const token = generateToken(customer);

    setAuthCookie(
      res,
      token,
      customer.role
    );

    return res.status(201).json({
      success: true,
      message:
        "Customer account created successfully",
      user: customer,
    });
  } catch (error) {
    console.error(
      "Customer signup error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create customer account",
    });
  }
}

export async function logout(req, res) {
  const role = req.body?.role;

  /*
   * EMPLOYEE / CUSTOMER
   *
   * Their JWT is stored in sessionStorage on the frontend,
   * so there is no authentication cookie to clear.
   *
   * The frontend will remove the token from sessionStorage.
   */

  if (
    role === "EMPLOYEE" ||
    role === "CUSTOMER"
  ) {
    return res.json({
      success: true,
      message: "Logout successful",
    });
  }

  if (role === "REGULATOR") {
    res.clearCookie("regulator_auth_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
  } else if (role === "ADMIN") {
    res.clearCookie("admin_auth_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Valid user role is required for logout",
    });
  }

  return res.json({
    success: true,
    message: "Logout successful",
  });
}