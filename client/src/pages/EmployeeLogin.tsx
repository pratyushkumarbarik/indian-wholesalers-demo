import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    employeeId: string | null;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  token?: string;
}

export default function EmployeeLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data: LoginResponse =
        await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Invalid email or password."
        );
        return;
      }

      if (!data.user) {
        setError("Invalid login response.");
        return;
      }

      if (data.user.role !== "EMPLOYEE") {
        setError(
          "This login page is only for employees."
        );
        return;
      }

      if (data.user.status === "DISABLED") {
        setError(
          "Your employee account has been disabled. Please contact your administrator."
        );
        return;
      }

      /*
       * Store the employee token in sessionStorage.
       *
       * sessionStorage is isolated per browser tab, so
       * different employee tabs can have independent sessions.
       */
      if (!data.token) {
        setError(
          "Invalid login response. Employee token is missing."
        );
        return;
      }

      sessionStorage.setItem(
        "employee_auth_token",
        data.token
      );

      sessionStorage.setItem(
        "employee_user",
        JSON.stringify(data.user)
      );

      navigate("/employee/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Employee login error:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="login-page">
        <div className="login-card">

          {/* LOGO */}

          <div className="logo-wrapper">
            <div className="logo-box">
              <ShieldCheck size={30} />
            </div>
          </div>

          {/* HEADER */}

          <div className="login-header">
            <span className="portal-badge">
              EMPLOYEE PORTAL
            </span>

            <h1>
              Employee Login
            </h1>

            <p>
              Sign in to access your employee
              workspace.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleLogin}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="form-group">
              <label htmlFor="employee-email">
                Email Address
              </label>

              <div className="input-wrapper">
                <Mail
                  size={19}
                  className="field-icon"
                />

                <input
                  id="employee-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="employee@wholesalers.in"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="form-group">
              <label htmlFor="employee-password">
                Password
              </label>

              <div className="input-wrapper">
                <Lock
                  size={19}
                  className="field-icon"
                />

                <input
                  id="employee-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  <span>
                    Signing In...
                  </span>
                </>
              ) : (
                <>
                  <LogIn size={19} />

                  <span>
                    Sign In
                  </span>
                </>
              )}
            </button>
          </form>

          {/* SECURITY NOTE */}

          <div className="security-note">
            <ShieldCheck size={17} />

            <span>
              Your employee account is securely
              managed by the administrator.
            </span>
          </div>

        </div>
      </div>
    </>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .login-page {
    min-height: 100vh;
    width: 100%;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      sans-serif;
  }

  .login-card {
    width: 100%;
    max-width: 450px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 42px;
    box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.07);
  }

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  .logo-box {
    width: 60px;
    height: 60px;
    border-radius: 15px;
    background: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .portal-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 11px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.7px;
  }

  .login-header h1 {
    margin-top: 14px;
    font-size: 29px;
    line-height: 1.2;
    color: #0f172a;
    font-weight: 750;
    letter-spacing: -0.6px;
  }

  .login-header p {
    margin-top: 8px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
  }

  .error-alert {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 13px 14px;
    margin-bottom: 20px;
    border-radius: 9px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    font-size: 13px;
    line-height: 1.45;
    font-weight: 550;
  }

  .error-alert svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 21px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 14px;
    font-weight: 650;
    color: #334155;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .field-icon {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    pointer-events: none;
  }

  .input-wrapper input {
    width: 100%;
    height: 49px;
    padding: 11px 15px 11px 43px;
    font-size: 14px;
    color: #0f172a;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-wrapper input::placeholder {
    color: #94a3b8;
  }

  .input-wrapper input:focus {
    background: #ffffff;
    border-color: #2563eb;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  .login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    height: 49px;
    margin-top: 4px;
    border: none;
    border-radius: 9px;
    background: #1e40af;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .login-button:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .security-note {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-top: 25px;
    padding: 13px;
    border-radius: 9px;
    background: #f8fafc;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  .security-note svg {
    flex-shrink: 0;
    color: #2563eb;
    margin-top: 1px;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 520px) {
    .login-page {
      padding: 20px 15px;
    }

    .login-card {
      padding: 30px 22px;
    }

    .login-header h1 {
      font-size: 25px;
    }
  }
`;