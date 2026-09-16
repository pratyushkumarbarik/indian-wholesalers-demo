import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://indian-wholesalers-api.onrender.com/api/auth/login",
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Invalid email or password."
        );
        return;
      }

      if (data.user.role !== "ADMIN") {
        setError(
          "This login page is only for administrator accounts."
        );
        return;
      }

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Admin login error:", err);

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

      <div className="admin-login-page">

        <div className="admin-login-card">

          {/* BRAND */}

          <div className="brand-section">

            <div className="brand-logo">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h1>Admin Portal</h1>

              <p>
                Indian Wholesalers
              </p>
            </div>

          </div>


          {/* HEADER */}

          <div className="login-heading">

            <span className="portal-badge">
              ADMINISTRATOR
            </span>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in using the credentials
              provided by your regulator.
            </p>

          </div>


          {/* ERROR */}

          {error && (
            <div className="error-alert">

              <AlertCircle size={18} />

              <span>
                {error}
              </span>

            </div>
          )}


          {/* FORM */}

          <form
            onSubmit={handleLogin}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="admin-email">
                Email Address
              </label>

              <div className="input-wrapper">

                <Mail
                  size={19}
                  className="input-icon"
                />

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="admin-password">
                Password
              </label>

              <div className="input-wrapper">

                <Lock
                  size={19}
                  className="input-icon"
                />

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
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
                    className="spin"
                  />

                  <span>
                    Signing in...
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


          {/* SECURITY MESSAGE */}

          <div className="security-note">

            <ShieldCheck size={17} />

            <span>
              Administrator access is controlled
              by the regulator. Disabled accounts
              cannot access the portal.
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

  .admin-login-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    background: #f8fafc;
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

  .admin-login-card {
    width: 100%;
    max-width: 450px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 38px;
    box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.07);
  }

  .brand-section {
    display: flex;
    align-items: center;
    gap: 13px;
    margin-bottom: 34px;
  }

  .brand-logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-section h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 750;
    color: #0f172a;
  }

  .brand-section p {
    margin: 3px 0 0;
    font-size: 12px;
    color: #64748b;
  }

  .login-heading {
    margin-bottom: 26px;
  }

  .portal-badge {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.7px;
  }

  .login-heading h2 {
    margin: 13px 0 7px;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 750;
    letter-spacing: -0.6px;
    color: #0f172a;
  }

  .login-heading p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
  }

  .error-alert {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 13px;
    margin-bottom: 20px;
    border-radius: 9px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    font-size: 13px;
    font-weight: 550;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
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

  .input-icon {
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
    width: 100%;
    height: 49px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
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

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 500px) {
    .admin-login-page {
      padding: 20px 15px;
    }

    .admin-login-card {
      padding: 28px 22px;
    }

    .login-heading h2 {
      font-size: 26px;
    }
  }
`;