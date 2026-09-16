import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Phone,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function CustomerLogin() {
  const [loginMethod, setLoginMethod] = useState<
    "email" | "phone"
  >("email");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (loginMethod === "phone") {
      setError(
        "Phone login will be available after phone OTP is connected."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password"
        );
      }

      if (!data.success || !data.user) {
        throw new Error("Login failed");
      }

      if (data.user.role !== "CUSTOMER") {
        throw new Error(
          "This account is not a customer account."
        );
      }

      if (data.user.status !== "ACTIVE") {
        throw new Error("Account is disabled.");
      }

      /*
        Customer authentication is stored per browser tab.

        sessionStorage is isolated per tab, so logging into
        another customer in a different tab will NOT replace
        this customer's session.
      */
      if (!data.token) {
        throw new Error(
          "Login succeeded but no authentication token was received."
        );
      }

      sessionStorage.setItem(
        "customer_auth_token",
        data.token
      );

      sessionStorage.setItem(
        "customer_user",
        JSON.stringify(data.user)
      );

      navigate("/user/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    // Google authentication will be connected later.
    console.log("Continue with Google");
  }

  return (
    <>
      <style>{styles}</style>

      <div className="customer-auth-page">

        {/* LEFT SIDE — BRANDING */}

        <div className="auth-brand-panel">
          <div className="brand-content">

            <div className="brand-logo">
              <ShieldCheck size={30} />
            </div>

            <h1>
              Indian Wholesalers
            </h1>

            <p className="brand-description">
              Connect with trusted wholesalers,
              discover products, and manage your
              wholesale requirements in one place.
            </p>

            <div className="brand-features">

              <div className="feature">
                <div className="feature-icon">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <strong>
                    Trusted Platform
                  </strong>

                  <span>
                    Connect with verified businesses.
                  </span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <ArrowRight size={18} />
                </div>

                <div>
                  <strong>
                    Simple & Fast
                  </strong>

                  <span>
                    Find and connect with suppliers
                    easily.
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT SIDE — LOGIN */}

        <div className="auth-form-panel">

          <div className="login-container">

            {/* MOBILE LOGO */}

            <div className="mobile-logo">
              <div className="mobile-logo-box">
                <ShieldCheck size={25} />
              </div>

              <span>
                Indian Wholesalers
              </span>
            </div>

            {/* HEADER */}

            <div className="login-header">

              <span className="portal-badge">
                CUSTOMER PORTAL
              </span>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to continue to your
                account.
              </p>

            </div>

            {/* GOOGLE */}

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
            >
              <span className="google-icon">
                G
              </span>

              <span>
                Continue with Google
              </span>
            </button>

            {/* DIVIDER */}

            <div className="divider">
              <span></span>
              <p>OR</p>
              <span></span>
            </div>

            {/* LOGIN METHOD */}

            <div className="method-tabs">

              <button
                type="button"
                className={
                  loginMethod === "email"
                    ? "method-tab active"
                    : "method-tab"
                }
                onClick={() =>
                  setLoginMethod("email")
                }
              >
                <Mail size={17} />
                Email
              </button>

              <button
                type="button"
                className={
                  loginMethod === "phone"
                    ? "method-tab active"
                    : "method-tab"
                }
                onClick={() =>
                  setLoginMethod("phone")
                }
              >
                <Phone size={17} />
                Phone
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              {loginMethod === "email" ? (
                <>
                  {/* EMAIL */}

                  <div className="form-group">

                    <label htmlFor="email">
                      Email Address
                    </label>

                    <div className="input-wrapper">

                      <Mail
                        size={19}
                        className="input-icon"
                      />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(
                            event.target.value
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />

                    </div>

                  </div>

                  {/* PASSWORD */}

                  <div className="form-group">

                    <div className="label-row">

                      <label htmlFor="password">
                        Password
                      </label>

                      <button
                        type="button"
                        className="forgot-button"
                        onClick={() =>
                          console.log(
                            "Forgot password"
                          )
                        }
                      >
                        Forgot password?
                      </button>

                    </div>

                    <div className="input-wrapper">

                      <Lock
                        size={19}
                        className="input-icon"
                      />

                      <input
                        id="password"
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
                </>
              ) : (
                <>
                  {/* PHONE */}

                  <div className="form-group">

                    <label htmlFor="phone">
                      Phone Number
                    </label>

                    <div className="phone-input-wrapper">

                      <span className="country-code">
                        +91
                      </span>

                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(
                            event.target.value
                          )
                        }
                        placeholder="98765 43210"
                        autoComplete="tel"
                        maxLength={10}
                        required
                      />

                    </div>

                  </div>

                  <p className="otp-info">
                    We'll send a one-time
                    verification code to your
                    phone number.
                  </p>
                </>
              )}

              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing In..."
                  : loginMethod === "phone"
                    ? "Continue with Phone"
                    : "Sign In"}

                <ArrowRight size={18} />
              </button>

            </form>

            {/* SIGNUP */}

            <div className="signup-section">

              <span>
                Don't have an account?
              </span>

              <Link to="/user/signup">
                Create an account
              </Link>

            </div>

            {/* SECURITY */}

            <div className="security-note">

              <ShieldCheck size={16} />

              <span>
                Your information is securely
                protected.
              </span>

            </div>

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

  .customer-auth-page {
    min-height: 100vh;
    width: 100%;
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
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

  /* =========================
     BRAND PANEL
  ========================= */

  .auth-brand-panel {
    min-height: 100vh;
    background: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
  }

  .brand-content {
    width: 100%;
    max-width: 480px;
  }

  .brand-logo {
    width: 58px;
    height: 58px;
    border-radius: 15px;
    background: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
  }

  .brand-content h1 {
    font-size: 38px;
    line-height: 1.15;
    letter-spacing: -1px;
    font-weight: 750;
    margin: 0;
  }

  .brand-description {
    margin-top: 18px;
    color: #cbd5e1;
    font-size: 16px;
    line-height: 1.7;
    max-width: 430px;
  }

  .brand-features {
    display: flex;
    flex-direction: column;
    gap: 22px;
    margin-top: 48px;
  }

  .feature {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .feature-icon {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 9px;
    background: #1e293b;
    color: #60a5fa;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feature div:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .feature strong {
    font-size: 14px;
    color: #ffffff;
  }

  .feature span {
    font-size: 13px;
    color: #94a3b8;
  }

  /* =========================
     FORM PANEL
  ========================= */

  .auth-form-panel {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 50px;
    background: #ffffff;
  }

  .login-container {
    width: 100%;
    max-width: 460px;
  }

  .mobile-logo {
    display: none;
  }

  .login-header {
    margin-bottom: 25px;
  }

  .portal-badge {
    display: inline-flex;
    padding: 6px 11px;
    border-radius: 999px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.7px;
  }

  .login-header h2 {
    margin-top: 14px;
    font-size: 31px;
    line-height: 1.2;
    letter-spacing: -0.7px;
    color: #0f172a;
    font-weight: 750;
  }

  .login-header p {
    margin-top: 8px;
    color: #64748b;
    font-size: 14px;
  }

  /* =========================
     GOOGLE
  ========================= */

  .google-button {
    width: 100%;
    height: 49px;
    border-radius: 9px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    font-size: 14px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .google-button:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .google-icon {
    font-size: 18px;
    font-weight: 750;
    color: #4285f4;
  }

  /* =========================
     DIVIDER
  ========================= */

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 23px 0;
  }

  .divider span {
    height: 1px;
    flex: 1;
    background: #e2e8f0;
  }

  .divider p {
    margin: 0;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 650;
  }

  /* =========================
     METHOD TABS
  ========================= */

  .method-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 5px;
    background: #f1f5f9;
    border-radius: 10px;
    margin-bottom: 22px;
  }

  .method-tab {
    height: 40px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }

  .method-tab.active {
    background: #ffffff;
    color: #1e40af;
    box-shadow:
      0 1px 4px rgba(15, 23, 42, 0.08);
  }

  /* =========================
     FORM
  ========================= */

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

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .forgot-button {
    border: none;
    background: transparent;
    color: #2563eb;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
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
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #f8fafc;
    color: #0f172a;
    font-size: 14px;
    outline: none;
  }

  .input-wrapper input:focus {
    background: #ffffff;
    border-color: #2563eb;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  .input-wrapper input::placeholder {
    color: #94a3b8;
  }

  .phone-input-wrapper {
    display: flex;
    height: 49px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    overflow: hidden;
    background: #f8fafc;
  }

  .country-code {
    display: flex;
    align-items: center;
    padding: 0 14px;
    border-right: 1px solid #cbd5e1;
    color: #475569;
    font-size: 14px;
    font-weight: 650;
  }

  .phone-input-wrapper input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 11px 15px;
    color: #0f172a;
    font-size: 14px;
  }

  .otp-info {
    margin-top: -8px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  /* =========================
     LOGIN BUTTON
  ========================= */

  .login-button {
    width: 100%;
    height: 49px;
    margin-top: 3px;
    border: none;
    border-radius: 9px;
    background: #1e40af;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
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
    transform: none;
  }

  .form-error {
    padding: 11px 13px;
    border: 1px solid #fecaca;
    border-radius: 9px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 12px;
    line-height: 1.45;
  }

  /* =========================
     SIGNUP
  ========================= */

  .signup-section {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 25px;
    font-size: 13px;
    color: #64748b;
  }

  .signup-section a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 650;
  }

  .signup-section a:hover {
    text-decoration: underline;
  }

  /* =========================
     SECURITY
  ========================= */

  .security-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 28px;
    color: #94a3b8;
    font-size: 11px;
  }

  .security-note svg {
    color: #2563eb;
  }

  /* =========================
     RESPONSIVE
  ========================= */

  @media (max-width: 850px) {
    .customer-auth-page {
      grid-template-columns: 1fr;
    }

    .auth-brand-panel {
      display: none;
    }

    .auth-form-panel {
      min-height: 100vh;
      padding: 30px 20px;
    }

    .mobile-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 35px;
      color: #0f172a;
      font-size: 17px;
      font-weight: 750;
    }

    .mobile-logo-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .auth-form-panel {
      padding: 25px 17px;
    }

    .login-header h2 {
      font-size: 27px;
    }
  }
`;