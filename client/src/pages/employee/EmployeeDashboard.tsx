import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

interface EmployeeProfile {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  status: string;

  employeeProfile: {
    availability:
      | "AVAILABLE"
      | "BUSY"
      | "OFFLINE";

    currentQueryCount: number;
    completedQueryCount: number;
    lastAssignedAt: string | null;
  } | null;
}


/* =========================================
   QUERY TYPES
   ========================================= */

interface QueryDocument {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}


interface AssignedQuery {
  id: string;

  department: string;
  feature: string;
  description: string;

  status:
    | "WAITING"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "NEEDS_INFO"
    | "CANCELLED";

  assignedAt: string | null;
  acceptedAt: string | null;
  completedAt: string | null;

  createdAt: string;
  updatedAt: string;

  customer: {
    id: string;
    name: string;
    email: string;
  };

  documents: QueryDocument[];
}

/* =========================================
   CHAT / MEETING TYPES
   ========================================= */

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    employeeId?: string | null;
    name: string;
    role: "CUSTOMER" | "EMPLOYEE";
  };
}

interface Meeting {
  id: string;
  queryId: string;
  meetingLink: string;
  scheduledAt?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    employeeId?: string | null;
    name: string;
  };
}
 
/* =========================================
   EMPLOYEE DASHBOARD
   ========================================= */

function EmployeeDashboard() {
  const navigate = useNavigate();

  // Employee JWT is stored per browser tab so different employee tabs stay independent.
  function getEmployeeToken() {
    return sessionStorage.getItem("employee_auth_token");
  }

  function redirectToEmployeeLogin() {
    sessionStorage.removeItem("employee_auth_token");
    sessionStorage.removeItem("employee_user");
    navigate("/employee/login", { replace: true });
  }

  function employeeAuthHeaders() {
    const token = getEmployeeToken();
    if (!token) {
      redirectToEmployeeLogin();
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }
  const [employee, setEmployee] =
    useState<EmployeeProfile | null>(null);

  const [queries, setQueries] =
    useState<AssignedQuery[]>([]);

  const [history, setHistory] =
    useState<AssignedQuery[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [queriesLoading, setQueriesLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /* =========================================
     EMPLOYEE CHAT
     ========================================= */

  const [selectedChatQueryId, setSelectedChatQueryId] =
    useState<string | null>(null);

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  const [chatMessage, setChatMessage] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);

  const [chatSending, setChatSending] =
    useState(false);

  const [chatError, setChatError] =
    useState("");

  const [meetings, setMeetings] =
    useState<Meeting[]>([]);

  const [meetingLink, setMeetingLink] =
    useState("");

  const [meetingScheduledAt, setMeetingScheduledAt] =
    useState("");

  const [meetingSending, setMeetingSending] =
    useState(false);

  const [meetingError, setMeetingError] =
    useState("");

  /* =========================================
     LOAD EMPLOYEE PROFILE
     ========================================= */

  async function loadEmployeeProfile(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        "https://indian-wholesalers-api.onrender.com/api/employees/me",
        { method: "GET", headers }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load employee profile"
        );
      }

      setEmployee(data.employee);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load employee profile"
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }


  /* =========================================
     LOAD ASSIGNED QUERIES
     ========================================= */

  async function loadAssignedQueries() {
    try {
      setQueriesLoading(true);

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        "https://indian-wholesalers-api.onrender.com/api/queries/assigned",
        { method: "GET", headers }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load assigned queries"
        );
      }

      setQueries(data.queries || []);
    } catch (error) {
      console.error(
        "Load assigned queries error:",
        error
      );

      /*
        Do not replace the entire dashboard
        with an error if query loading fails.
      */
    } finally {
      setQueriesLoading(false);
    }
  }


  /* =========================================
     ACCEPT TASK
     ASSIGNED → IN_PROGRESS
     ========================================= */

  async function acceptTask(queryId: string) {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/accept`,
        { method: "POST", headers }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept task");
      }

      setMessage("Task accepted successfully");

      await Promise.all([
        loadAssignedQueries(),
        loadEmployeeProfile(false),
        loadEmployeeHistory(),
      ]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to accept task"
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =========================================
     COMPLETE TASK
     IN_PROGRESS → RESOLVED
     ========================================= */

  async function completeTask(queryId: string) {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/complete`,
        { method: "POST", headers }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete task");
      }

      setMessage("Task completed successfully");

      await Promise.all([
        loadAssignedQueries(),
        loadEmployeeProfile(false),
        loadEmployeeHistory(),
      ]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to complete task"
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =========================================
     LOAD TASK HISTORY
     ========================================= */

  async function loadEmployeeHistory() {
    try {
      setHistoryLoading(true);

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        "https://indian-wholesalers-api.onrender.com/api/queries/history",
        { method: "GET", headers }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load task history");
      }

      setHistory(data.queries || []);
    } catch (error) {
      console.error("Load task history error:", error);
    } finally {
      setHistoryLoading(false);
    }
  }



  /* =========================================
     LOAD CHAT MESSAGES
     ========================================= */

  async function loadChatMessages(queryId: string) {
    try {
      setChatLoading(true);
      setChatError("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/messages/employee`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load conversation"
        );
      }

      setChatMessages(data.messages || []);
    } catch (error) {
      console.error("Load chat error:", error);

      setChatError(
        error instanceof Error
          ? error.message
          : "Failed to load conversation"
      );
    } finally {
      setChatLoading(false);
    }
  }


  /* =========================================
     LOAD MEETINGS
     ========================================= */

  async function loadQueryMeetings(queryId: string) {
    try {
      setMeetingError("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/meetings/employee`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load meetings"
        );
      }

      setMeetings(data.meetings || []);
    } catch (error) {
      console.error("Load meetings error:", error);

      setMeetingError(
        error instanceof Error
          ? error.message
          : "Failed to load meetings"
      );
    }
  }


  /* =========================================
     SEND CHAT MESSAGE
     ========================================= */

  async function handleSendChatMessage() {
    if (!selectedChatQueryId) return;

    const trimmedMessage = chatMessage.trim();

    if (!trimmedMessage) return;

    try {
      setChatSending(true);
      setChatError("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/queries/${selectedChatQueryId}/messages/employee`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send message"
        );
      }

      setChatMessage("");

      // Reload the conversation from the server instead of appending
      // the raw POST response. The POST response may contain only the
      // database message fields and not the nested sender object used
      // by the chat UI (sender.role / sender.name).
      await loadChatMessages(selectedChatQueryId);
    } catch (error) {
      console.error("Send chat message error:", error);

      setChatError(
        error instanceof Error
          ? error.message
          : "Failed to send message"
      );
    } finally {
      setChatSending(false);
    }
  }


  /* =========================================
     CHAT ENTER KEY
     ========================================= */

  function handleChatKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!chatSending) {
        handleSendChatMessage();
      }
    }
  }


  /* =========================================
     CREATE / SHARE MEETING
     ========================================= */

  async function handleCreateMeeting() {
    if (!selectedChatQueryId) return;

    const trimmedLink = meetingLink.trim();

    if (!trimmedLink) {
      setMeetingError("Meeting link is required.");
      return;
    }

    try {
      setMeetingSending(true);
      setMeetingError("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/queries/${selectedChatQueryId}/meeting`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            meetingLink: trimmedLink,
            scheduledAt: meetingScheduledAt
              ? new Date(meetingScheduledAt).toISOString()
              : null,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to share meeting"
        );
      }

      setMeetingLink("");
      setMeetingScheduledAt("");

      await loadQueryMeetings(selectedChatQueryId);

      setMessage("Meeting shared with the customer.");
    } catch (error) {
      console.error("Create meeting error:", error);

      setMeetingError(
        error instanceof Error
          ? error.message
          : "Failed to share meeting"
      );
    } finally {
      setMeetingSending(false);
    }
  }


  /* =========================================
     SELECT CHAT QUERY
     ========================================= */

  function selectChatQuery(queryId: string) {
    setSelectedChatQueryId(queryId);
    setChatMessages([]);
    setMeetings([]);
    setChatError("");
    setMeetingError("");
    setChatMessage("");

    loadChatMessages(queryId);
    loadQueryMeetings(queryId);
  }


  /* =========================================
     SELECT FIRST ACTIVE CHAT
     ========================================= */

  useEffect(() => {
    if (queries.length === 0) {
      setSelectedChatQueryId(null);
      setChatMessages([]);
      setMeetings([]);
      return;
    }

    const selectedStillExists =
      selectedChatQueryId &&
      queries.some(
        (query) => query.id === selectedChatQueryId
      );

    if (!selectedStillExists) {
      const firstQuery = queries[0];

      setSelectedChatQueryId(firstQuery.id);
      setChatMessages([]);
      setMeetings([]);

      loadChatMessages(firstQuery.id);
      loadQueryMeetings(firstQuery.id);
    }
  }, [queries, selectedChatQueryId]);


  /* =========================================
     AUTOMATIC CHAT REFRESH
     ========================================= */

  useEffect(() => {
    if (!selectedChatQueryId) return;

    const interval = setInterval(() => {
      loadChatMessages(selectedChatQueryId);
      loadQueryMeetings(selectedChatQueryId);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedChatQueryId]);

  /* =========================================
     CHANGE EMPLOYEE AVAILABILITY
     ========================================= */

  async function changeAvailability(
    action: "available" | "offline"
  ) {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const headers = employeeAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `https://indian-wholesalers-api.onrender.com/api/employees/${
          action === "available"
            ? "availability"
            : "offline"
        }`,
        { method: "POST", headers }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        redirectToEmployeeLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to change availability"
        );
      }

      setMessage(data.message);

      await loadEmployeeProfile();
      await loadAssignedQueries();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to change availability"
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =========================================
     INITIAL LOAD
     ========================================= */

  useEffect(() => {
    loadEmployeeProfile(true);
    loadAssignedQueries();
    loadEmployeeHistory();
  }, []);


  /* =========================================
     AUTOMATIC QUERY REFRESH
     ========================================= */

  useEffect(() => {
    const interval = setInterval(async () => {
      const scrollY = window.scrollY;

      await Promise.all([
        loadAssignedQueries(),
        loadEmployeeProfile(false),
      ]);

      // React may have updated the dashboard DOM during the refresh.
      // Restore the exact position the employee was viewing.
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollY,
          left: 0,
          behavior: "auto",
        });
      });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);


  /* =========================================
     LOADING SCREEN
     ========================================= */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        Loading employee dashboard...
      </div>
    );
  }


  /* =========================================
     PROFILE ERROR
     ========================================= */

  if (error && !employee) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "15px",
        }}
      >
        <h2>
          Unable to load dashboard
        </h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={() => loadEmployeeProfile(true)}
        >
          Try Again
        </button>
      </div>
    );
  }


  if (!employee) {
    return null;
  }


  const profile =
    employee.employeeProfile;


  const availability =
    profile?.availability || "OFFLINE";


  /* =========================================
     FORMAT DATE
     ========================================= */

  function formatDate(
    date: string
  ) {
    return new Date(date).toLocaleString();
  }


  /* =========================================
     DASHBOARD
     ========================================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        fontFamily:
          "Arial, sans-serif",
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
      }}
    >

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >

      {/* =====================================
          HEADER
          ===================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
            }}
          >
            Employee Dashboard
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#666",
            }}
          >
            Welcome, {employee.name}
          </p>
        </div>


        <div
          style={{
            padding: "10px 16px",
            borderRadius: "20px",

            background:
              availability === "AVAILABLE"
                ? "#d1fae5"
                : availability === "BUSY"
                ? "#fef3c7"
                : "#e5e7eb",

            fontWeight: "bold",
          }}
        >
          {availability}
        </div>
      </div>


      {/* =====================================
          ERROR / SUCCESS MESSAGE
          ===================================== */}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}


      {message && (
        <div
          style={{
            background: "#dcfce7",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {message}
        </div>
      )}


      {/* =====================================
          EMPLOYEE INFORMATION
          ===================================== */}

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          Employee Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >

          <div>
            <strong>Name</strong>
            <p>{employee.name}</p>
          </div>


          <div>
            <strong>Employee ID</strong>
            <p>{employee.employeeId}</p>
          </div>


          <div>
            <strong>Email</strong>
            <p>{employee.email}</p>
          </div>


          <div>
            <strong>Account Status</strong>
            <p>{employee.status}</p>
          </div>

        </div>
      </div>


      {/* =====================================
          STATISTICS
          ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "25px",
        }}
      >

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h3>
            Current Queries
          </h3>

          <div
            style={{
              fontSize: "35px",
              fontWeight: "bold",
            }}
          >
            {profile?.currentQueryCount || 0}
          </div>
        </div>


        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h3>
            Completed Queries
          </h3>

          <div
            style={{
              fontSize: "35px",
              fontWeight: "bold",
            }}
          >
            {profile?.completedQueryCount || 0}
          </div>
        </div>

      </div>


      {/* =====================================
          AVAILABILITY
          ===================================== */}

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >

        <h2>
          Availability
        </h2>

        <p
          style={{
            color: "#666",
          }}
        >
          Set yourself as available when you
          are ready to receive customer queries.
        </p>


        <div
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "20px",
          }}
        >

          <button
            onClick={() =>
              changeAvailability(
                "available"
              )
            }
            disabled={
              actionLoading ||
              availability === "AVAILABLE" ||
              availability === "BUSY"
            }
            style={{
              padding: "12px 22px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: "#16a34a",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {actionLoading
              ? "Updating..."
              : "Go Available"}
          </button>


          <button
            onClick={() =>
              changeAvailability(
                "offline"
              )
            }
            disabled={
              actionLoading ||
              availability === "OFFLINE" ||
              availability === "BUSY"
            }
            style={{
              padding: "12px 22px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: "#6b7280",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {actionLoading
              ? "Updating..."
              : "Go Offline"}
          </button>

        </div>

      </div>


      {/* =====================================
          ASSIGNED QUERIES
          ===================================== */}

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "25px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
            }}
          >
            Assigned Queries
          </h2>

          {queriesLoading && (
            <span
              style={{
                color: "#666",
                fontSize: "14px",
              }}
            >
              Refreshing...
            </span>
          )}
        </div>


        {/* NO QUERIES */}

        {queries.length === 0 && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "10px",
              color: "#666",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "16px",
              }}
            >
              No queries assigned to you.
            </p>

            <p
              style={{
                marginBottom: 0,
                fontSize: "14px",
              }}
            >
              New assigned customer queries
              will appear here automatically.
            </p>
          </div>
        )}


        {/* QUERY LIST */}

        {queries.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >

            {queries.map((query) => (
              <div
                key={query.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "22px",
                  background: "#fafafa",
                }}
              >

                {/* QUERY HEADER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >

                  <div>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                      }}
                    >
                      {query.department}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#555",
                      }}
                    >
                      {query.feature}
                    </p>
                  </div>


                  <span
                    style={{
                      padding: "7px 12px",
                      borderRadius: "20px",
                      background:
                        query.status ===
                        "ASSIGNED"
                          ? "#dbeafe"
                          : query.status ===
                            "IN_PROGRESS"
                          ? "#fef3c7"
                          : "#e5e7eb",
                      fontWeight: "bold",
                      fontSize: "13px",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {query.status}
                  </span>

                </div>


                {/* CUSTOMER */}

                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    background: "white",
                    borderRadius: "8px",
                  }}
                >

                  <h4
                    style={{
                      marginTop: 0,
                    }}
                  >
                    Customer
                  </h4>

                  <p
                    style={{
                      margin: "6px 0",
                    }}
                  >
                    <strong>
                      Name:
                    </strong>{" "}
                    {query.customer.name}
                  </p>

                  <p
                    style={{
                      margin: "6px 0",
                    }}
                  >
                    <strong>
                      Email:
                    </strong>{" "}
                    {query.customer.email}
                  </p>

                </div>


                {/* DESCRIPTION */}

                <div
                  style={{
                    marginBottom: "20px",
                  }}
                >

                  <h4>
                    Problem Description
                  </h4>

                  <div
                    style={{
                      padding: "15px",
                      background: "white",
                      borderRadius: "8px",
                      lineHeight: "1.6",
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {query.description}
                  </div>

                </div>


                {/* TASK ACTIONS */}

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  {query.status === "ASSIGNED" && (
                    <button
                      type="button"
                      onClick={() => acceptTask(query.id)}
                      disabled={actionLoading}
                      style={{
                        padding: "11px 20px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        background: "#2563eb",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {actionLoading ? "Processing..." : "Accept Task"}
                    </button>
                  )}

                  {query.status === "IN_PROGRESS" && (
                    <button
                      type="button"
                      onClick={() => completeTask(query.id)}
                      disabled={actionLoading}
                      style={{
                        padding: "11px 20px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        background: "#16a34a",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {actionLoading ? "Processing..." : "Complete Task"}
                    </button>
                  )}
                </div>


                {/* DOCUMENTS */}

                <div
                  style={{
                    marginBottom: "20px",
                  }}
                >

                  <h4>
                    Documents
                  </h4>

                  {query.documents.length ===
                  0 ? (
                    <p
                      style={{
                        color: "#777",
                      }}
                    >
                      No documents attached.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: "8px",
                      }}
                    >

                      {query.documents.map(
                        (document) => (
                          <div
                            key={
                              document.id
                            }
                            style={{
                              padding:
                                "10px 14px",
                              background:
                                "white",
                              borderRadius:
                                "8px",
                              border:
                                "1px solid #eee",
                            }}
                          >
                            {document.originalName}
                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>


                {/* TIME */}

                <div
                  style={{
                    paddingTop: "15px",
                    borderTop:
                      "1px solid #e5e7eb",
                    color: "#777",
                    fontSize: "13px",
                  }}
                >

                  <p
                    style={{
                      margin: "5px 0",
                    }}
                  >
                    <strong>
                      Submitted:
                    </strong>{" "}
                    {formatDate(
                      query.createdAt
                    )}
                  </p>

                  {query.assignedAt && (
                    <p
                      style={{
                        margin: "5px 0",
                      }}
                    >
                      <strong>
                        Assigned:
                      </strong>{" "}
                      {formatDate(
                        query.assignedAt
                      )}
                    </p>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>


      {/* =====================================
          TASK HISTORY
          ===================================== */}

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "25px",
          marginTop: "25px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>Task History</h2>

          {historyLoading && (
            <span style={{ color: "#666", fontSize: "14px" }}>
              Loading history...
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "10px",
              color: "#666",
            }}
          >
            <p style={{ margin: 0, fontSize: "16px" }}>
              No completed tasks yet.
            </p>
            <p style={{ marginBottom: 0, fontSize: "14px" }}>
              Completed customer tasks will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {history.map((query) => (
              <div
                key={query.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "18px",
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 7px 0" }}>
                      {query.department}
                    </h3>
                    <p style={{ margin: "0 0 7px 0", color: "#555" }}>
                      {query.feature}
                    </p>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                      Customer: {query.customer.name}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "7px 12px",
                      borderRadius: "20px",
                      background: "#dcfce7",
                      color: "#166534",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    RESOLVED
                  </span>
                </div>

                <p
                  style={{
                    margin: "15px 0 0 0",
                    color: "#777",
                    fontSize: "13px",
                  }}
                >
                  <strong>Completed:</strong>{" "}
                  {query.completedAt
                    ? formatDate(query.completedAt)
                    : "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      </div>

      {/* =====================================
          EMPLOYEE CHAT / MEETINGS
          ===================================== */}

      <aside
        style={{
          width: "380px",
          flexShrink: 0,
          position: "sticky",
          top: "30px",
          background: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ background: "#075e54", color: "white", padding: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Customer Chats</h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px", opacity: 0.9 }}>
            Chat only with customers assigned to you.
          </p>
        </div>

        <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc" }}>
          {queries.length === 0 ? (
            <div style={{ padding: "14px", color: "#666", fontSize: "14px", textAlign: "center" }}>
              No active customer conversations.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
              {queries.map((query) => {
                const selected = selectedChatQueryId === query.id;
                return (
                  <button
                    key={query.id}
                    type="button"
                    onClick={() => selectChatQuery(query.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: selected ? "2px solid #128c7e" : "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "11px",
                      background: selected ? "#e8f5f2" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#111827" }}>
                      {query.customer.name}
                    </div>
                    <div style={{ marginTop: "3px", fontSize: "12px", color: "#666" }}>
                      {query.department} · {query.feature}
                    </div>
                    <div style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      color: query.status === "IN_PROGRESS" ? "#b45309" : "#2563eb",
                      fontWeight: "bold",
                    }}>
                      {query.status}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {(() => {
          const chatQuery = selectedChatQueryId
            ? queries.find((query) => query.id === selectedChatQueryId) || null
            : null;

          if (!chatQuery) {
            return (
              <div style={{
                minHeight: "420px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px",
                textAlign: "center",
                color: "#666",
              }}>
                Select an assigned customer query to open the conversation.
              </div>
            );
          }

          return (
            <>
              <div style={{ padding: "15px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px" }}>{chatQuery.customer.name}</h3>
                    <div style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
                      {chatQuery.department} · {chatQuery.feature}
                    </div>
                  </div>
                  <span style={{
                    alignSelf: "flex-start",
                    padding: "5px 8px",
                    borderRadius: "12px",
                    background: chatQuery.status === "IN_PROGRESS" ? "#fef3c7" : "#dbeafe",
                    fontSize: "10px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}>
                    {chatQuery.status}
                  </span>
                </div>
              </div>

              <div style={{
                height: "330px",
                overflowY: "auto",
                padding: "15px",
                background: "#efeae2",
              }}>
                {chatLoading && chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#777", padding: "30px 10px" }}>
                    Loading conversation...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#777", padding: "30px 10px", fontSize: "14px" }}>
                    No messages yet.<br />Start the conversation with the customer.
                  </div>
                ) : (
                  chatMessages.map((item) => {
                    const isEmployee = item.sender.role === "EMPLOYEE";
                    return (
                      <div key={item.id} style={{
                        display: "flex",
                        justifyContent: isEmployee ? "flex-end" : "flex-start",
                        marginBottom: "9px",
                      }}>
                        <div style={{
                          maxWidth: "78%",
                          padding: "9px 11px",
                          borderRadius: isEmployee ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                          background: isEmployee ? "#dcf8c6" : "white",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        }}>
                          {!isEmployee && (
                            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#075e54", marginBottom: "3px" }}>
                              {item.sender.name}
                            </div>
                          )}
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "14px", lineHeight: "1.4" }}>
                            {item.message}
                          </div>
                          <div style={{ marginTop: "4px", textAlign: "right", fontSize: "10px", color: "#777" }}>
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {chatError && (
                  <div style={{ marginTop: "10px", padding: "8px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "12px" }}>
                    {chatError}
                  </div>
                )}
              </div>

              <div style={{ padding: "10px", borderTop: "1px solid #ddd", background: "#f8fafc" }}>
                <div style={{ display: "flex", gap: "7px" }}>
                  <textarea
                    value={chatMessage}
                    onChange={(event) => setChatMessage(event.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Type a message..."
                    rows={2}
                    disabled={chatSending}
                    style={{
                      flex: 1,
                      resize: "none",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "9px",
                      fontFamily: "inherit",
                      fontSize: "13px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendChatMessage}
                    disabled={chatSending || !chatMessage.trim()}
                    style={{
                      width: "48px",
                      border: "none",
                      borderRadius: "8px",
                      background: chatSending || !chatMessage.trim() ? "#9ca3af" : "#128c7e",
                      color: "white",
                      fontSize: "18px",
                      cursor: chatSending || !chatMessage.trim() ? "not-allowed" : "pointer",
                    }}
                    title="Send message"
                  >
                    ➤
                  </button>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e5e7eb", padding: "14px", background: "white" }}>
                <h4 style={{ margin: "0 0 10px" }}>Meetings</h4>

                {meetings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    {meetings.map((meeting) => (
                      <div key={meeting.id} style={{
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                      }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold" }}>Meeting shared</div>
                        {meeting.scheduledAt && (
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                            {formatDate(meeting.scheduledAt)}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => window.open(meeting.meetingLink, "_blank", "noopener,noreferrer")}
                          style={{
                            marginTop: "8px",
                            border: "none",
                            borderRadius: "6px",
                            padding: "7px 10px",
                            background: "#2563eb",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Open Meeting
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="url"
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  placeholder="Paste meeting link"
                  disabled={meetingSending}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "9px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    marginBottom: "8px",
                  }}
                />

                <input
                  type="datetime-local"
                  value={meetingScheduledAt}
                  onChange={(event) => setMeetingScheduledAt(event.target.value)}
                  disabled={meetingSending}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "9px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    marginBottom: "8px",
                  }}
                />

                {meetingError && (
                  <div style={{ marginBottom: "8px", color: "#b91c1c", fontSize: "12px" }}>
                    {meetingError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreateMeeting}
                  disabled={meetingSending || !meetingLink.trim()}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "none",
                    borderRadius: "7px",
                    background: meetingSending || !meetingLink.trim() ? "#9ca3af" : "#16a34a",
                    color: "white",
                    cursor: meetingSending || !meetingLink.trim() ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {meetingSending ? "Sharing..." : "Share Meeting"}
                </button>
              </div>
            </>
          );
        })()}
      </aside>
    </div>
  );
}

export default EmployeeDashboard;