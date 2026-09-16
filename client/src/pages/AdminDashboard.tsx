import React, {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  Users,
  LogOut,
  UserPlus,
  Mail,
  Lock,
  User,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Search,
  Calendar,
  Ban,
  Unlock,
} from "lucide-react";

type Employee = {
  id: string;
  employeeId: string | null;
  name: string;
  email: string;
  role: "EMPLOYEE";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [creating, setCreating] = useState(false);
  const [processingEmployeeId, setProcessingEmployeeId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================================================
  // FETCH EMPLOYEES
  // =========================================================

  async function fetchEmployees() {
    try {
      setError("");

      const response = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/employees",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Failed to load employee accounts."
        );
        return;
      }

      setEmployees(data.employees);
    } catch (err) {
      console.error(
        "Failed to fetch employees:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    try {
      setError("");

      const response = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/auth/logout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            role: "ADMIN",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        navigate("/admin/login", {
          replace: true,
        });
      } else {
        setError(
          data.message || "Logout failed."
        );
      }
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        "Unable to connect to the server."
      );
    }
  }

  // =========================================================
  // CREATE EMPLOYEE
  // =========================================================

  async function handleCreateEmployee(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setCreating(true);

    try {
      const response = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/employees",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Failed to create employee account."
        );
        return;
      }

      setMessage(
        "Employee account created successfully."
      );

      setName("");
      setEmail("");
      setPassword("");

      await fetchEmployees();
    } catch (err) {
      console.error(
        "Create employee error:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setCreating(false);
    }
  }

  // =========================================================
  // BLOCK / UNBLOCK EMPLOYEE
  // =========================================================

  async function handleToggleEmployee(
    employee: Employee
  ) {
    setMessage("");
    setError("");
    setProcessingEmployeeId(employee.id);

    const action =
      employee.status === "ACTIVE"
        ? "block"
        : "unblock";

    try {
      const response = await fetch(
        `http://https://indian-wholesalers-api.onrender.com/api/employees/${employee.id}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            `Failed to ${action} employee account.`
        );
        return;
      }

      if (action === "block") {
        setMessage(
          "Employee account blocked successfully."
        );
      } else {
        setMessage(
          "Employee account unblocked successfully."
        );
      }

      await fetchEmployees();
    } catch (err) {
      console.error(
        `Failed to ${action} employee:`,
        err
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setProcessingEmployeeId(null);
    }
  }

  // =========================================================
  // SEARCH / STATISTICS
  // =========================================================

  const filteredEmployees = employees.filter(
    (employee) =>
      (employee.employeeId || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      employee.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      employee.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE"
  ).length;

  const disabledEmployees = employees.filter(
    (employee) => employee.status === "DISABLED"
  ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      <style>{styles}</style>

      <div className="dashboard-container">
        {/* HEADER */}

        <header className="dashboard-header">
          <div className="header-brand">
            <div className="brand-logo">
              <ShieldCheck
                size={26}
                className="logo-icon"
              />
            </div>

            <div>
              <h1 className="header-title">
                Admin Portal
              </h1>

              <span className="header-subtitle">
                Operational Management Panel
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </header>

        {/* MAIN */}

        <main className="dashboard-body">
          {/* INTRO */}

          <section className="page-intro">
            <div>
              <span className="portal-badge">
                <BadgeCheck size={15} />
                ADMIN
              </span>

              <h1>
                Employee Management
              </h1>

              <p>
                Create, monitor and manage
                employee accounts.
              </p>
            </div>
          </section>

          {/* STATISTICS */}

          <div className="stats-banner">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <Users size={24} />
              </div>

              <div className="stat-info">
                <span className="stat-label">
                  Total Employees
                </span>

                <span className="stat-value">
                  {employees.length}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <ShieldCheck size={24} />
              </div>

              <div className="stat-info">
                <span className="stat-label">
                  Active Employees
                </span>

                <span className="stat-value">
                  {activeEmployees}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper amber">
                <ShieldAlert size={24} />
              </div>

              <div className="stat-info">
                <span className="stat-label">
                  Disabled Employees
                </span>

                <span className="stat-value">
                  {disabledEmployees}
                </span>
              </div>
            </div>
          </div>

          {/* ALERTS */}

          {message && (
            <div className="status-alert success global-alert">
              <CheckCircle2 size={19} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="status-alert error global-alert">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

          {/* TWO COLUMN CONTENT */}

          <div className="content-grid">
            {/* CREATE EMPLOYEE */}

            <section className="card-panel create-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <div className="icon-badge">
                    <UserPlus size={20} />
                  </div>

                  <div>
                    <h2>
                      Create Employee
                    </h2>

                    <p className="panel-desc">
                      Create login credentials
                      for a new employee. Employee ID is generated automatically.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleCreateEmployee}
                className="admin-form"
              >
                {/* NAME */}

                <div className="form-group">
                  <label htmlFor="employee-name">
                    Full Name
                  </label>

                  <div className="input-field-wrapper">
                    <User
                      className="field-icon"
                      size={19}
                    />

                    <input
                      id="employee-name"
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="e.g. Rajesh Kumar"
                      required
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div className="form-group">
                  <label htmlFor="employee-email">
                    Email Address
                  </label>

                  <div className="input-field-wrapper">
                    <Mail
                      className="field-icon"
                      size={19}
                    />

                    <input
                      id="employee-email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="employee@wholesalers.in"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div className="form-group">
                  <label htmlFor="employee-password">
                    Password
                  </label>

                  <div className="input-field-wrapper">
                    <Lock
                      className="field-icon"
                      size={19}
                    />

                    <input
                      id="employee-password"
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Create a secure password"
                      required
                    />
                  </div>
                </div>

                {/* CREATE BUTTON */}

                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />

                      <span>
                        Creating Account...
                      </span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={19} />

                      <span>
                        Create Employee
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="security-note">
                <ShieldCheck size={17} />

                <span>
                  Employee credentials are
                  securely stored and managed by
                  the administrator.
                </span>
              </div>
            </section>

            {/* EMPLOYEE ACCOUNTS */}

            <section className="card-panel admin-list-panel">
              <div className="panel-header list-header">
                <div className="panel-title-group">
                  <div className="icon-badge alt">
                    <Users size={20} />
                  </div>

                  <div>
                    <h2>
                      Employee Accounts
                    </h2>

                    <p className="panel-desc">
                      Manage employees created
                      under your account.
                    </p>
                  </div>
                </div>

                {/* SEARCH */}

                <div className="search-wrapper">
                  <Search
                    size={17}
                    className="search-icon"
                  />

                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* EMPLOYEE LIST */}

              <div className="admin-list-container">
                {loading ? (
                  <div className="empty-state">
                    <Loader2
                      size={36}
                      className="animate-spin blue-text"
                    />

                    <p>
                      Loading employee
                      accounts...
                    </p>
                  </div>
                ) : filteredEmployees.length ===
                  0 ? (
                  <div className="empty-state">
                    <Users
                      size={42}
                      className="muted-text"
                    />

                    <p>
                      {searchQuery
                        ? "No matching employees found."
                        : "No employee accounts registered yet."}
                    </p>
                  </div>
                ) : (
                  <div className="admin-cards-list">
                    {filteredEmployees.map(
                      (employee) => {
                        const processing =
                          processingEmployeeId ===
                          employee.id;

                        return (
                          <div
                            key={employee.id}
                            className="admin-card"
                          >
                            {/* EMPLOYEE HEADER */}

                            <div className="admin-card-header">
                              <div className="admin-avatar">
                                {employee.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="admin-main-details">
                                <h3 className="admin-name">
                                  {employee.name}
                                </h3>

                                <span className="admin-email">
                                  {employee.email}
                                </span>
                              </div>

                              <span
                                className={`status-pill ${
                                  employee.status ===
                                  "ACTIVE"
                                    ? "active"
                                    : "disabled"
                                }`}
                              >
                                <span className="dot"></span>
                                {employee.status}
                              </span>
                            </div>

                            {/* EMPLOYEE FOOTER */}

                            <div className="admin-card-footer">
                              <div className="meta-item">
                                <Calendar
                                  size={15}
                                />

                                <span>
                                  {employee.employeeId ||
                                    "No Employee ID"}
                                  {" • "}
                                  Created:{" "}
                                  {new Date(
                                    employee.createdAt
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>

                              <div className="admin-actions">
                                <span className="role-tag">
                                  {employee.role}
                                </span>

                                <button
                                  type="button"
                                  disabled={processing}
                                  className={
                                    employee.status ===
                                    "ACTIVE"
                                      ? "admin-action-btn block-btn"
                                      : "admin-action-btn unblock-btn"
                                  }
                                  onClick={() =>
                                    handleToggleEmployee(
                                      employee
                                    )
                                  }
                                >
                                  {processing ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : employee.status ===
                                    "ACTIVE" ? (
                                    <>
                                      <Ban size={15} />
                                      <span>
                                        Block
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock
                                        size={15}
                                      />
                                      <span>
                                        Unblock
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .dashboard-container {
    min-height: 100vh;
    width: 100%;
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
    color: #0f172a;
  }

  .dashboard-header {
    width: 100%;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 18px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .brand-logo {
    width: 44px;
    height: 44px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-title {
    font-size: 20px;
    line-height: 1.2;
    font-weight: 750;
    letter-spacing: -0.4px;
    color: #0f172a;
  }

  .header-subtitle {
    display: block;
    margin-top: 3px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 11px 18px;
    background: #f8fafc;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
  }

  .dashboard-body {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 42px 48px 60px;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .page-intro {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .portal-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 11px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.6px;
  }

  .page-intro h1 {
    margin-top: 12px;
    font-size: 32px;
    line-height: 1.15;
    letter-spacing: -0.8px;
    color: #0f172a;
    font-weight: 750;
  }

  .page-intro p {
    margin-top: 8px;
    color: #64748b;
    font-size: 15px;
  }

  .stats-banner {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .stat-card {
    background: #ffffff;
    padding: 25px;
    min-height: 105px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 18px;
    box-shadow:
      0 2px 5px rgba(15, 23, 42, 0.04);
  }

  .stat-icon-wrapper {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon-wrapper.blue {
    background: #eff6ff;
    color: #2563eb;
  }

  .stat-icon-wrapper.green {
    background: #f0fdf4;
    color: #16a34a;
  }

  .stat-icon-wrapper.amber {
    background: #fffbeb;
    color: #d97706;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .stat-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 550;
  }

  .stat-value {
    font-size: 30px;
    line-height: 1;
    font-weight: 750;
    color: #0f172a;
  }

  .global-alert {
    width: 100%;
  }

  .status-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 15px;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 550;
  }

  .status-alert.success {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .status-alert.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .content-grid {
    display: grid;
    grid-template-columns:
      minmax(430px, 0.82fr)
      minmax(600px, 1.45fr);
    gap: 32px;
    align-items: start;
  }

  .card-panel {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow:
      0 4px 12px rgba(15, 23, 42, 0.04);
    padding: 30px;
  }

  .create-panel {
    min-height: 600px;
  }

  .panel-header {
    margin-bottom: 28px;
  }

  .panel-header.list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 20px;
  }

  .panel-title-group {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .icon-badge {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 11px;
    background: #2563eb;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-badge.alt {
    background: #0f172a;
  }

  .panel-header h2 {
    font-size: 19px;
    line-height: 1.25;
    font-weight: 750;
    color: #0f172a;
  }

  .panel-desc {
    margin-top: 5px;
    font-size: 13px;
    color: #64748b;
  }

  .admin-form {
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

  .input-field-wrapper {
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

  .input-field-wrapper input {
    width: 100%;
    height: 48px;
    padding: 11px 15px 11px 43px;
    font-size: 14px;
    color: #0f172a;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-field-wrapper input::placeholder {
    color: #94a3b8;
  }

  .input-field-wrapper input:focus {
    background: #ffffff;
    border-color: #2563eb;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  .btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    height: 49px;
    padding: 12px 18px;
    background-color: #1e40af;
    color: #ffffff;
    border: none;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 5px;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #1d4ed8;
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
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

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 13px;
    color: #94a3b8;
    pointer-events: none;
  }

  .search-wrapper input {
    height: 43px;
    padding: 9px 13px 9px 39px;
    font-size: 13px;
    color: #0f172a;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    outline: none;
    width: 250px;
    transition: all 0.2s ease;
  }

  .search-wrapper input::placeholder {
    color: #94a3b8;
  }

  .search-wrapper input:focus {
    width: 290px;
    background: #ffffff;
    border-color: #2563eb;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.08);
  }

  .admin-list-container {
    min-height: 300px;
  }

  .admin-cards-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .admin-card {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 12px;
    padding: 21px;
    transition: all 0.2s ease;
  }

  .admin-card:hover {
    border-color: #cbd5e1;
    background: #ffffff;
    box-shadow:
      0 4px 10px rgba(15, 23, 42, 0.05);
  }

  .admin-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 17px;
  }

  .admin-avatar {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 750;
    font-size: 17px;
  }

  .admin-main-details {
    flex: 1;
    min-width: 0;
  }

  .admin-name {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .admin-email {
    margin-top: 3px;
    font-size: 13px;
    color: #64748b;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 11px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.3px;
    flex-shrink: 0;
  }

  .status-pill .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .status-pill.active {
    background: #dcfce7;
    color: #15803d;
  }

  .status-pill.active .dot {
    background: #16a34a;
  }

  .status-pill.disabled {
    background: #f1f5f9;
    color: #64748b;
  }

  .status-pill.disabled .dot {
    background: #94a3b8;
  }

  .admin-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: #94a3b8;
  }

  .role-tag {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    background: #e2e8f0;
    padding: 5px 9px;
    border-radius: 5px;
  }

  .admin-actions {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .admin-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 92px;
    height: 34px;
    padding: 7px 13px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .admin-action-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .block-btn {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .block-btn:hover:not(:disabled) {
    background: #fee2e2;
    border-color: #fca5a5;
  }

  .unblock-btn {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .unblock-btn:hover:not(:disabled) {
    background: #dcfce7;
    border-color: #86efac;
  }

  .empty-state {
    min-height: 300px;
    padding: 50px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: #64748b;
    font-size: 14px;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .blue-text {
    color: #2563eb;
  }

  .muted-text {
    color: #cbd5e1;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1100px) {
    .dashboard-header {
      padding: 18px 30px;
    }

    .dashboard-body {
      padding: 35px 30px 50px;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }

    .create-panel {
      min-height: auto;
    }
  }

  @media (max-width: 700px) {
    .dashboard-header {
      padding: 14px 18px;
    }

    .header-title {
      font-size: 17px;
    }

    .header-subtitle {
      display: none;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
    }

    .logout-btn {
      padding: 9px 12px;
    }

    .logout-btn span {
      display: none;
    }

    .dashboard-body {
      padding: 25px 16px 40px;
      gap: 22px;
    }

    .page-intro h1 {
      font-size: 26px;
    }

    .stats-banner {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .stat-card {
      padding: 20px;
    }

    .card-panel {
      padding: 21px;
    }

    .panel-header.list-header {
      flex-direction: column;
    }

    .search-wrapper {
      width: 100%;
    }

    .search-wrapper input,
    .search-wrapper input:focus {
      width: 100%;
    }

    .admin-card-header {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .status-pill {
      margin-left: auto;
    }

    .admin-card-footer {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  @media (max-width: 480px) {
    .page-intro h1 {
      font-size: 23px;
    }

    .panel-title-group {
      align-items: flex-start;
    }

    .admin-card {
      padding: 16px;
    }

    .admin-card-header {
      display: grid;
      grid-template-columns: auto 1fr;
    }

    .status-pill {
      grid-column: 2;
      margin-left: 0;
      width: fit-content;
    }
  }
`;

``