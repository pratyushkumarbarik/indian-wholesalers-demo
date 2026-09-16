import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function RegulatorLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://https://indian-wholesalers-api.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
        return;
      }

      if (!data.user || data.user.role !== "REGULATOR") {
        setError("Unauthorized access. Regulator privilege required.");
        return;
      }

      // Verify that the regulator session was created correctly.
      const sessionResponse = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/auth/regulator/me",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const sessionData = await sessionResponse.json();

      if (
        !sessionResponse.ok ||
        !sessionData.success ||
        sessionData.user?.role !== "REGULATOR"
      ) {
        setError(
          sessionData.message ||
            "Unable to verify regulator session."
        );
        return;
      }

      navigate("/regulator/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-wrapper">
        <div className="login-card">
          {/* Header & Branding */}
          <div className="login-header">
            <div className="badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Official Portal</span>
            </div>
            <h1 className="brand-title">Indian Wholesalers</h1>
            <p className="portal-subtitle">Regulator Authentication</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="regulator@domain.gov.in"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-banner" role="alert">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span>
                  Authenticating...
                </span>
              ) : (
                "Sign In to Portal"
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="login-footer">
            <p>Authorized personnel only. All access is logged and monitored.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// Inline CSS style tag for encapsulated, modern styling
const styles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .login-wrapper {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    padding: 20px;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 36px 32px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .login-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .brand-title {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .portal-subtitle {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-group label {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    width: 18px;
    height: 18px;
    color: #94a3b8;
    pointer-events: none;
    transition: color 0.2s ease;
  }

  .input-wrapper input {
    width: 100%;
    padding: 11px 14px 11px 40px;
    font-size: 14px;
    color: #0f172a;
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-wrapper input:focus {
    background-color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }

  .input-wrapper input:focus + .input-icon,
  .input-wrapper:focus-within .input-icon {
    color: #2563eb;
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    transition: color 0.2s ease;
  }

  .toggle-password:hover {
    color: #475569;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 13px;
    font-weight: 500;
  }

  .submit-btn {
    width: 100%;
    padding: 12px;
    background-color: #1e40af;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.1s ease;
    margin-top: 4px;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.99);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .login-footer {
    margin-top: 24px;
    text-align: center;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
  }

  .login-footer p {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.4;
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 28px 20px;
    }
  }
`;