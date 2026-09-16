import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Department = {
  id: number;
  name: string;
  features: string[];
};

type CustomerQuery = {
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
  createdAt: string;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  employee?: {
    id: string;
    employeeId: string;
    name: string;
    email?: string;
  } | null;
  documents?: unknown[];
};

type ChatMessage = {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    employeeId?: string | null;
    name: string;
    role: "CUSTOMER" | "EMPLOYEE";
  };
};

type Meeting = {
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
};

type QueryTracking = {
  query: CustomerQuery;
  queuePosition: number | null;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
  } | null;
  tracking: {
    submitted: { completed: boolean; at: string | null };
    queued: { completed: boolean; at: string | null };
    assigned: { completed: boolean; at: string | null };
    inProgress: { completed: boolean; at: string | null };
    finished: { completed: boolean; at: string | null };
  };
};

const departments: Department[] = Array.from(
  { length: 23 },
  (_, index) => ({
    id: index + 1,
    name: `Department ${String(index + 1).padStart(2, "0")}`,
    features: [
      `Feature ${index + 1}.01`,
      `Feature ${index + 1}.02`,
      `Feature ${index + 1}.03`,
      `Feature ${index + 1}.04`,
    ],
  })
);

function CustomerDashboard() {
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);

  const [openDepartment, setOpenDepartment] = useState<number | null>(
    null
  );

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [selectedFeature, setSelectedFeature] = useState<string | null>(
    null
  );

  const [description, setDescription] = useState("");

  const [files, setFiles] = useState<File[]>([]);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [tracking, setTracking] = useState<QueryTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [selectedTrackingQueryId, setSelectedTrackingQueryId] =
    useState<string | null>(null);

  // ============================================================
  // QUERY CHAT
  // ============================================================
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatClosed, setChatClosed] = useState(false);

  // ============================================================
  // QUERY MEETINGS
  // ============================================================
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedChatQueryId, setSelectedChatQueryId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<
    "home" | "history" | "tracking" | "chats"
  >("home");

  /*
   * CUSTOMER TAB-ISOLATED AUTHENTICATION
   *
   * Customer authentication uses a JWT stored in
   * sessionStorage. sessionStorage is isolated per
   * browser tab, so different customer tabs remain
   * independent.
   */

  function getCustomerToken() {
    return sessionStorage.getItem("customer_auth_token");
  }

  function redirectToCustomerLogin() {
    sessionStorage.removeItem("customer_auth_token");
    sessionStorage.removeItem("customer_user");

    navigate("/user/login", { replace: true });
  }

  function customerAuthHeaders() {
    const token = getCustomerToken();

    if (!token) {
      redirectToCustomerLogin();
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  const trackingRequestRef = useRef(0);

  async function loadCustomerQueries() {
    const headers = customerAuthHeaders();

    if (!headers) {
      return [];
    }
    const response = await fetch(
      "http://https://indian-wholesalers-api.onrender.com/api/queries/my",
      {
        method: "GET",
        headers,
      }
    );

    if (response.status === 401 || response.status === 403) {
      navigate("/user/login", { replace: true });
      return [];
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch your queries."
      );
    }

    const customerQueries = data.queries || [];
    setQueries(customerQueries);

    return customerQueries;
  }

  async function loadQueryTracking(queryId: string) {
    const requestId = ++trackingRequestRef.current;

    try {
      setSelectedTrackingQueryId(queryId);
      setTrackingLoading(true);
      setTrackingError("");

      const headers = customerAuthHeaders();

      if (!headers) {
        return;
      }

      const response = await fetch(
        `http://https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/tracking`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.status === 401 || response.status === 403) {
        redirectToCustomerLogin();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load query tracking."
        );
      }

      if (requestId !== trackingRequestRef.current) {
        return;
      }

      setTracking(data.tracking || null);
    } catch (error) {
      if (requestId !== trackingRequestRef.current) {
        return;
      }

      console.error("Load query tracking error:", error);

      setTracking(null);
      setTrackingError(
        error instanceof Error
          ? error.message
          : "Failed to load query tracking."
      );
    } finally {
      if (requestId === trackingRequestRef.current) {
        setTrackingLoading(false);
      }
    }
  }


  /*
    ============================================================
    CHAT
    Load messages for the selected active query.
    ============================================================
  */
  async function loadChatMessages(queryId: string) {
    try {
      const headers = customerAuthHeaders();

      if (!headers) {
        return;
      }

      const response = await fetch(
        `http://https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/messages`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.status === 401 || response.status === 403) {
        redirectToCustomerLogin();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        // A resolved/cancelled query is intentionally closed.
        if (
          data.message?.toLowerCase().includes("chat is closed")
        ) {
          setChatClosed(true);
          setChatMessages([]);
          return;
        }

        throw new Error(
          data.message || "Failed to load chat messages."
        );
      }

      setChatClosed(false);
      setChatError("");
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error("Load chat messages error:", error);
      setChatError(
        error instanceof Error
          ? error.message
          : "Failed to load chat messages."
      );
    }
  }

  /*
    ============================================================
    CHAT
    Send a message for the selected query.
    ============================================================
  */
  async function handleSendChatMessage() {
    const message = chatMessage.trim();

    if (!message || !selectedChatQueryId || chatClosed) {
      return;
    }

    try {
      setChatSending(true);
      setChatError("");

      const headers = customerAuthHeaders();

      if (!headers) {
        return;
      }

      const response = await fetch(
        `http://https://indian-wholesalers-api.onrender.com/api/queries/${selectedChatQueryId}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message,
          }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        redirectToCustomerLogin();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (
          data.message?.toLowerCase().includes("chat is closed")
        ) {
          setChatClosed(true);
        }

        throw new Error(
          data.message || "Failed to send message."
        );
      }

      setChatMessages((current) => [
        ...current,
        data.chatMessage,
      ]);

      setChatMessage("");
    } catch (error) {
      console.error("Send chat message error:", error);
      setChatError(
        error instanceof Error
          ? error.message
          : "Failed to send message."
      );
    } finally {
      setChatSending(false);
    }
  }

  /*
    ============================================================
    CHAT
    Enter key sends the message.
    Shift + Enter creates a new line.
    ============================================================
  */
  function handleChatKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendChatMessage();
    }
  }

  /*
    ============================================================
    MEETINGS
    Load meeting links belonging to the selected query.
    ============================================================
  */
  async function loadQueryMeetings(queryId: string) {
    try {
      const headers = customerAuthHeaders();

      if (!headers) {
        return;
      }

      const response = await fetch(
        `http://https://indian-wholesalers-api.onrender.com/api/queries/${queryId}/meetings`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.status === 401 || response.status === 403) {
        redirectToCustomerLogin();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (
          data.message?.toLowerCase().includes("closed")
        ) {
          setMeetings([]);
          return;
        }

        throw new Error(
          data.message || "Failed to load meetings."
        );
      }

      setMeetings(data.meetings || []);
    } catch (error) {
      console.error("Load query meetings error:", error);
    }
  }

  /*
    ============================================================
    CHAT AUTO REFRESH
    Refreshes the selected query's chat every 2 seconds.
    ============================================================
  */
  useEffect(() => {
    if (!selectedChatQueryId) {
      setChatMessages([]);
      setMeetings([]);
      setChatClosed(false);
      return;
    }

    const selectedQuery = queries.find(
      (query) =>
        query.id === selectedChatQueryId
    );

    if (!selectedQuery) {
      return;
    }

    if (
      selectedQuery.status === "RESOLVED" ||
      selectedQuery.status === "CANCELLED"
    ) {
      setChatClosed(true);
      setChatMessages([]);
      setMeetings([]);
      return;
    }

    setChatLoading(true);

    Promise.all([
      loadChatMessages(selectedChatQueryId),
      loadQueryMeetings(selectedChatQueryId),
    ]).finally(() => {
      setChatLoading(false);
    });

    const interval = window.setInterval(() => {
      loadChatMessages(selectedChatQueryId);
      loadQueryMeetings(selectedChatQueryId);
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    selectedChatQueryId,
    queries,
  ]);

  /*
    ============================================================
    CHAT
    Choose the selected active query that already has an employee.
    ============================================================
  */
  function getChatQuery() {
    const activeAssignedQueries = queries.filter(
      (query) =>
        query.employee &&
        (query.status === "ASSIGNED" ||
          query.status === "IN_PROGRESS" ||
          query.status === "NEEDS_INFO")
    );

    if (selectedChatQueryId) {
      return (
        activeAssignedQueries.find(
          (query) => query.id === selectedChatQueryId
        ) || null
      );
    }

    return activeAssignedQueries[0] || null;
  }

  const chatQuery = getChatQuery();

  function getStatusLabel(status: CustomerQuery["status"]) {
    switch (status) {
      case "WAITING":
        return "In Queue";
      case "ASSIGNED":
        return "Assigned";
      case "IN_PROGRESS":
        return "In Progress";
      case "RESOLVED":
        return "Finished";
      case "NEEDS_INFO":
        return "Needs Information";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  }

  function formatDateTime(value?: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function timelineClass(completed: boolean, current: boolean) {
    if (completed) return "timeline-step completed";
    if (current) return "timeline-step current";
    return "timeline-step";
  }

  // ============================================================
  // INITIAL DASHBOARD LOAD
  // Runs only when the dashboard is mounted.
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        if (!getCustomerToken()) {
          redirectToCustomerLogin();
          return;
        }

        const customerQueries = await loadCustomerQueries();

        if (cancelled) return;

        const activeQueries = customerQueries.filter(
          (query: CustomerQuery) =>
            query.status !== "RESOLVED"
        );

        if (activeQueries.length > 0) {
          const newestActiveQuery = activeQueries[0];

          setSelectedTrackingQueryId(
            newestActiveQuery.id
          );

          await loadQueryTracking(
            newestActiveQuery.id
          );
        } else {
          setSelectedTrackingQueryId(null);
          setTracking(null);
        }
      } catch (error) {
        console.error(
          "Customer dashboard initialization error:",
          error
        );

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to connect to the server."
          );
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // ACTIVE QUERY AUTO REFRESH
  // Only refreshes the Track Query page.
  // History is intentionally not touched here so resolved
  // queries can keep their selected tracking details.
  // ============================================================
  useEffect(() => {
    if (activePage !== "tracking") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const latestQueries = await loadCustomerQueries();

        const activeQueries = latestQueries.filter(
          (query: CustomerQuery) =>
            query.status !== "RESOLVED"
        );

        if (activeQueries.length === 0) {
          setTracking(null);
          setSelectedTrackingQueryId(null);
          return;
        }

        if (selectedTrackingQueryId) {
          const selectedQuery = activeQueries.find(
            (query: CustomerQuery) =>
              query.id === selectedTrackingQueryId
          );

          if (selectedQuery) {
            await loadQueryTracking(
              selectedTrackingQueryId
            );
            return;
          }
        }

        await loadQueryTracking(activeQueries[0].id);
      } catch (error) {
        console.error(
          "Customer query refresh error:",
          error
        );
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    activePage,
    selectedTrackingQueryId,
  ]);


  function getActiveQueries() {
    return queries.filter(
      (query) => query.status !== "RESOLVED"
    );
  }

  function renderTrackingDetails() {
    if (trackingLoading) {
      return (
        <div className="tracking-loading">
          Loading tracking details...
        </div>
      );
    }

    if (trackingError) {
      return (
        <div className="tracking-error">
          {trackingError}
        </div>
      );
    }

    if (!tracking) {
      return (
        <div className="tracking-empty">
          Select a query to view its tracking details.
        </div>
      );
    }

    return (
      <>
        <div className="tracking-card-header">
          <div>
            <h3>Query Tracking</h3>
            <p>
              {tracking.query.feature} ·{" "}
              {tracking.query.department}
            </p>
          </div>

          <span className="current-status">
            {getStatusLabel(tracking.query.status)}
          </span>
        </div>

        {tracking.query.status === "WAITING" &&
          tracking.queuePosition !== null && (
            <div className="queue-position-box">
              <div className="queue-position-label">
                Current Queue Position
              </div>

              <div className="queue-position-number">
                #{tracking.queuePosition}
              </div>
            </div>
          )}

        {tracking.employee && (
          <div className="employee-assignment-box">
            <div className="employee-assignment-label">
              Assigned Employee
            </div>

            <div className="employee-assignment-name">
              {tracking.employee.name}
            </div>

            <div className="employee-assignment-id">
              {tracking.employee.employeeId}
            </div>
          </div>
        )}

        <div className="timeline">
          <div
            className={timelineClass(
              tracking.tracking.submitted.completed,
              tracking.query.status === "WAITING"
            )}
          >
            <div className="timeline-dot">
              {tracking.tracking.submitted.completed
                ? "✓"
                : "1"}
            </div>

            <div className="timeline-content">
              <div className="timeline-title">
                Query Submitted
              </div>

              <div className="timeline-description">
                Your query was submitted successfully.
              </div>

              <div className="timeline-time">
                {formatDateTime(
                  tracking.tracking.submitted.at
                )}
              </div>
            </div>
          </div>

          <div
            className={timelineClass(
              tracking.tracking.queued.completed,
              tracking.query.status === "WAITING"
            )}
          >
            <div className="timeline-dot">
              {tracking.tracking.queued.completed
                ? "✓"
                : "2"}
            </div>

            <div className="timeline-content">
              <div className="timeline-title">
                In Queue
              </div>

              <div className="timeline-description">
                Your query entered the employee assignment queue.
              </div>

              <div className="timeline-time">
                {tracking.query.status === "WAITING"
                  ? tracking.queuePosition !== null
                    ? `Currently #${tracking.queuePosition} in queue`
                    : "Waiting for assignment"
                  : "Queue stage completed"}
              </div>
            </div>
          </div>

          <div
            className={timelineClass(
              tracking.tracking.assigned.completed,
              tracking.query.status === "ASSIGNED"
            )}
          >
            <div className="timeline-dot">
              {tracking.tracking.assigned.completed
                ? "✓"
                : "3"}
            </div>

            <div className="timeline-content">
              <div className="timeline-title">
                Assigned to Employee
              </div>

              <div className="timeline-description">
                {tracking.employee
                  ? `Your query was given to ${tracking.employee.name} (${tracking.employee.employeeId}).`
                  : "Your query has not been assigned yet."}
              </div>

              <div className="timeline-time">
                {formatDateTime(
                  tracking.tracking.assigned.at
                )}
              </div>
            </div>
          </div>

          <div
            className={timelineClass(
              tracking.tracking.inProgress.completed,
              tracking.query.status === "IN_PROGRESS"
            )}
          >
            <div className="timeline-dot">
              {tracking.tracking.inProgress.completed
                ? "✓"
                : "4"}
            </div>

            <div className="timeline-content">
              <div className="timeline-title">
                In Progress
              </div>

              <div className="timeline-description">
                The employee accepted your query and started working on it.
              </div>

              <div className="timeline-time">
                {formatDateTime(
                  tracking.tracking.inProgress.at
                )}
              </div>
            </div>
          </div>

          <div
            className={timelineClass(
              tracking.tracking.finished.completed,
              tracking.query.status === "RESOLVED"
            )}
          >
            <div className="timeline-dot">
              {tracking.tracking.finished.completed
                ? "✓"
                : "5"}
            </div>

            <div className="timeline-content">
              <div className="timeline-title">
                Finished
              </div>

              <div className="timeline-description">
                {tracking.query.status === "RESOLVED"
                  ? "Your query was resolved successfully."
                  : "This stage will be completed when the employee resolves your query."}
              </div>

              <div className="timeline-time">
                {formatDateTime(
                  tracking.tracking.finished.at
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="query-details">
          <div className="query-details-title">
            Problem Description
          </div>

          <div className="query-details-description">
            {tracking.query.description}
          </div>
        </div>
      </>
    );
  }

  function handleNavigation(
    page: "home" | "history" | "tracking" | "chats"
  ) {
    setActivePage(page);
    setError("");
    setTrackingError("");

    if (page === "history") {
      if (queries.length > 0) {
        const queryToShow =
          selectedTrackingQueryId &&
          queries.some(
            (query) =>
              query.id === selectedTrackingQueryId
          )
            ? queries.find(
                (query) =>
                  query.id === selectedTrackingQueryId
              )
            : queries[0];

        if (queryToShow) {
          loadQueryTracking(queryToShow.id);
        }
      } else {
        setTracking(null);
        setSelectedTrackingQueryId(null);
      }
    }

    if (page === "chats") {
      const activeAssignedQueries = queries.filter(
        (query) =>
          query.employee &&
          (query.status === "ASSIGNED" ||
            query.status === "IN_PROGRESS" ||
            query.status === "NEEDS_INFO")
      );

      if (activeAssignedQueries.length > 0) {
        const current = activeAssignedQueries.find(
          (query) => query.id === selectedChatQueryId
        );

        setSelectedChatQueryId(
          current?.id || activeAssignedQueries[0].id
        );
      } else {
        setSelectedChatQueryId(null);
        setChatMessages([]);
        setMeetings([]);
      }
    }

    if (page === "tracking") {
      const activeQueries = getActiveQueries();

      if (activeQueries.length > 0) {
        const selectedStillActive =
          selectedTrackingQueryId &&
          activeQueries.some(
            (query) =>
              query.id === selectedTrackingQueryId
          );

        const queryToTrack = selectedStillActive
          ? activeQueries.find(
              (query) =>
                query.id === selectedTrackingQueryId
            )
          : activeQueries[0];

        if (queryToTrack) {
          loadQueryTracking(queryToTrack.id);
        }
      } else {
        setTracking(null);
        setSelectedTrackingQueryId(null);
      }
    }

    /*
      History intentionally keeps resolved-query tracking data.
      Clicking a finished query loads its complete timeline.
    */
  }

  async function handleLogout() {
    try {
      setError("");

      const headers = customerAuthHeaders();

      if (!headers) {
        return;
      }

      const response = await fetch(
        "http://https://indian-wholesalers-api.onrender.com/api/auth/logout",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            role: "CUSTOMER",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        sessionStorage.removeItem("customer_auth_token");
        sessionStorage.removeItem("customer_user");

        navigate("/user/login", { replace: true });
        return;
      }

      setError(data.message || "Logout failed.");
    } catch (error) {
      console.error("Customer logout error:", error);
      setError("Unable to connect to the server.");
    }
  }

  function handleDepartmentClick(department: Department) {
    setError("");
    setSuccess("");

    if (openDepartment === department.id) {
      setOpenDepartment(null);
      return;
    }

    setOpenDepartment(department.id);
  }

  function handleFeatureSelect(
    department: Department,
    feature: string
  ) {
    setSelectedDepartment(department);
    setSelectedFeature(feature);
    setDescription("");
    setFiles([]);
    setError("");
    setSuccess("");

    setTimeout(() => {
      document
        .getElementById("problem-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const selectedFiles = Array.from(event.target.files || []);

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFile) {
      setError(
        `${invalidFile.name} is not a supported file type.`
      );

      event.target.value = "";
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    const oversizedFile = selectedFiles.find(
      (file) => file.size > maxFileSize
    );

    if (oversizedFile) {
      setError(
        `${oversizedFile.name} exceeds the 10 MB file size limit.`
      );

      event.target.value = "";
      return;
    }

    setFiles(selectedFiles);
  }

  function removeFile(index: number) {
    setFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index)
    );
  }

async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setError("");
  setSuccess("");

  if (!selectedDepartment || !selectedFeature) {
    setError(
      "Please select a department and feature."
    );
    return;
  }

  if (!description.trim()) {
    setError(
      "Please describe your problem."
    );
    return;
  }

  if (description.trim().length < 20) {
    setError(
      "Please provide a little more detail about your problem."
    );
    return;
  }

  try {
    setIsSubmitting(true);

    const headers = customerAuthHeaders();

    if (!headers) {
      return;
    }

    const response = await fetch(
      "http://https://indian-wholesalers-api.onrender.com/api/queries",
      {
        method: "POST",
        headers,

        body: JSON.stringify({
          department:
            selectedDepartment.name,

          feature:
            selectedFeature,

          description:
            description.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to submit query"
      );
    }

    /*
      Backend returns either:

      ASSIGNED
        → employee was available

      WAITING
        → employee was offline/busy
    */

    if (
      data.assignment?.assigned
    ) {
      setSuccess(
        `Query submitted successfully and assigned to ${data.assignment.employeeId} (${data.assignment.employeeName}).`
      );
    } else {
      setSuccess(
        "Query submitted successfully and added to the waiting queue."
      );
    }

    setDescription("");
    setFiles([]);

  } catch (error) {
    console.error(
      "Submit query error:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to submit query"
    );
  } finally {
    setIsSubmitting(false);
  }
}

  function resetForm() {
    setSelectedDepartment(null);
    setSelectedFeature(null);
    setDescription("");
    setFiles([]);
    setError("");
    setSuccess("");
  }

  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
        Checking login...
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .customer-dashboard {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top left,
              rgba(37, 99, 235, 0.08),
              transparent 35%
            ),
            #f8fafc;
          color: #0f172a;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* HEADER */

        .dashboard-header {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 7%;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #e2e8f0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: white;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .account-button,
        .logout-button {
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .account-button {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .logout-button {
          background: #0f172a;
          color: white;
        }

        .account-button:hover,
        .logout-button:hover {
          transform: translateY(-2px);
        }


        .dashboard-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-button,
        .nav-logout-button {
          border: none;
          border-radius: 10px;
          padding: 10px 15px;
          background: transparent;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .nav-button:hover {
          background: #f1f5f9;
          color: #1d4ed8;
        }

        .nav-button.active {
          background: #eff6ff;
          color: #2563eb;
        }

        .nav-logout-button {
          margin-left: 6px;
          background: #0f172a;
          color: white;
        }

        .nav-logout-button:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        /* PAGE VISIBILITY */

        .dashboard-page {
          animation: fadeUp 0.35s ease both;
        }

        /* MAIN */

        .dashboard-main {
          width: min(1200px, 90%);
          margin: 0 auto;
          padding: 55px 0 80px;
        }

        .welcome-section {
          margin-bottom: 40px;
          animation: fadeUp 0.6s ease both;
        }

        .welcome-label {
          color: #2563eb;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .welcome-section h1 {
          margin: 0;
          font-size: clamp(32px, 5vw, 48px);
          letter-spacing: -1.5px;
          line-height: 1.1;
        }

        .welcome-section p {
          margin-top: 14px;
          max-width: 700px;
          color: #64748b;
          font-size: 17px;
          line-height: 1.7;
        }

        /* DEPARTMENTS */

        .section-title {
          margin-bottom: 20px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 26px;
          letter-spacing: -0.5px;
        }

        .section-title p {
          margin: 7px 0 0;
          color: #64748b;
        }

        .department-list {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(250px, 1fr)
          );
          gap: 16px;
        }

        .department-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(15, 23, 42, 0.04);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
          animation: fadeUp 0.5s ease both;
        }

        .department-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 30px rgba(15, 23, 42, 0.08);
          border-color: #bfdbfe;
        }

        .department-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
        }

        .department-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .department-number {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
        }

        .department-name {
          font-size: 16px;
          font-weight: 700;
        }

        .department-count {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
        }

        .chevron {
          font-size: 20px;
          color: #64748b;
          transition: transform 0.3s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .features-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.35s ease;
        }

        .features-wrapper.open {
          grid-template-rows: 1fr;
        }

        .features-inner {
          min-height: 0;
          overflow: hidden;
        }

        .features {
          padding: 0 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feature-button {
          width: 100%;
          padding: 13px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .feature-button:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
          transform: translateX(4px);
        }

        /* FORM */

        .problem-section {
          margin-top: 70px;
          scroll-margin-top: 100px;
          animation: fadeUp 0.5s ease both;
        }

        .form-card {
          margin-top: 24px;
          padding: 30px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow:
            0 15px 45px rgba(15, 23, 42, 0.07);
        }

        .selection-path {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          color: #64748b;
          font-size: 13px;
        }

        .selection-item {
          padding: 7px 11px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          margin-bottom: 9px;
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }

        .required {
          color: #dc2626;
        }

        .description-input {
          width: 100%;
          min-height: 180px;
          padding: 15px;
          resize: vertical;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          outline: none;
          font: inherit;
          color: #0f172a;
          line-height: 1.6;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .description-input:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .character-count {
          margin-top: 7px;
          color: #94a3b8;
          font-size: 12px;
          text-align: right;
        }

        .upload-box {
          position: relative;
          padding: 28px;
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          text-align: center;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .upload-box:hover {
          border-color: #60a5fa;
          background: #eff6ff;
        }

        .upload-icon {
          font-size: 30px;
          margin-bottom: 8px;
        }

        .upload-title {
          font-size: 14px;
          font-weight: 700;
        }

        .upload-description {
          margin-top: 5px;
          color: #64748b;
          font-size: 12px;
        }

        .file-input {
          margin-top: 15px;
          max-width: 100%;
        }

        .file-list {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 13px;
          background: #f1f5f9;
          border-radius: 9px;
          font-size: 13px;
        }

        .file-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-file {
          flex-shrink: 0;
          border: none;
          background: transparent;
          color: #dc2626;
          cursor: pointer;
          font-weight: 700;
        }

        /* MESSAGES */

        .error-message,
        .success-message {
          margin-bottom: 20px;
          padding: 13px 15px;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.5;
        }

        .error-message {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .success-message {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        /* BUTTONS */

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 28px;
        }

        .cancel-button,
        .submit-button {
          border: none;
          border-radius: 11px;
          padding: 13px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .cancel-button {
          background: #f1f5f9;
          color: #475569;
        }

        .submit-button {
          background: #2563eb;
          color: white;
          box-shadow:
            0 8px 20px rgba(37, 99, 235, 0.2);
        }

        .cancel-button:hover,
        .submit-button:hover {
          transform: translateY(-2px);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* EMPTY STATE */

        .empty-form {
          margin-top: 24px;
          padding: 55px 30px;
          border: 1px dashed #cbd5e1;
          border-radius: 20px;
          background: white;
          text-align: center;
        }

        .empty-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .empty-form h3 {
          margin: 0;
          font-size: 20px;
        }

        .empty-form p {
          margin: 8px auto 0;
          max-width: 480px;
          color: #64748b;
          line-height: 1.6;
          font-size: 14px;
        }

        /* QUERY TRACKING */

        .tracking-section {
          margin-top: 70px;
          animation: fadeUp 0.5s ease both;
        }

        .tracking-layout {
          display: grid;
          grid-template-columns: 1fr 1.45fr;
          gap: 24px;
          margin-top: 24px;
        }

        .query-history-card,
        .tracking-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
        }

        .query-history-card {
          padding: 18px;
          max-height: 620px;
          overflow-y: auto;
        }

        .history-full-card {
          margin-top: 24px;
          padding: 24px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
        }

        .history-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .history-tracking-layout {
          display: grid;
          grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.4fr);
          gap: 24px;
          align-items: start;
        }

        .history-list-card {
          margin-top: 24px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 650px;
          overflow-y: auto;
        }

        .history-details-card {
          margin-top: 24px;
          min-height: 500px;
        }

        .tracking-only {
          grid-template-columns: 0.8fr 1.5fr;
        }


        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .history-header h3 {
          margin: 0;
          font-size: 17px;
        }

        .history-count {
          padding: 5px 9px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 800;
        }

        .query-history-item {
          width: 100%;
          margin-bottom: 10px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #f8fafc;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .query-history-item:hover,
        .query-history-item.selected {
          border-color: #2563eb;
          background: #eff6ff;
          transform: translateY(-2px);
        }

        .query-history-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .query-history-feature {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        .query-history-department {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .status-pill,
        .current-status {
          flex-shrink: 0;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .status-pill {
          background: #e2e8f0;
          color: #475569;
        }

        .status-pill.waiting {
          background: #fef3c7;
          color: #92400e;
        }

        .status-pill.assigned {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-pill.progress {
          background: #ede9fe;
          color: #6d28d9;
        }

        .status-pill.resolved {
          background: #dcfce7;
          color: #166534;
        }

        .query-history-date {
          margin-top: 10px;
          color: #94a3b8;
          font-size: 11px;
        }

        .tracking-card {
          padding: 28px;
        }

        .tracking-card-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .tracking-card-header h3 {
          margin: 0;
          font-size: 21px;
        }

        .tracking-card-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .current-status {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .queue-position-box {
          margin-bottom: 22px;
          padding: 15px 17px;
          border: 1px solid #fde68a;
          border-radius: 14px;
          background: #fffbeb;
        }

        .queue-position-label {
          color: #92400e;
          font-size: 12px;
          font-weight: 700;
        }

        .queue-position-number {
          margin-top: 4px;
          color: #78350f;
          font-size: 24px;
          font-weight: 900;
        }

        .employee-assignment-box {
          margin-bottom: 22px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #f8fafc;
        }

        .employee-assignment-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .employee-assignment-name {
          margin-top: 5px;
          font-size: 16px;
          font-weight: 800;
        }

        .employee-assignment-id {
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
        }

        .timeline {
          position: relative;
          padding-left: 6px;
        }

        .timeline-step {
          position: relative;
          display: flex;
          gap: 15px;
          min-height: 76px;
          padding-bottom: 18px;
        }

        .timeline-step:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 11px;
          top: 25px;
          width: 2px;
          height: calc(100% - 7px);
          background: #e2e8f0;
        }

        .timeline-step.completed:not(:last-child)::before {
          background: #2563eb;
        }

        .timeline-dot {
          position: relative;
          z-index: 2;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
        }

        .timeline-step.completed .timeline-dot {
          background: #2563eb;
          color: white;
        }

        .timeline-step.current .timeline-dot {
          background: #dbeafe;
          color: #2563eb;
          box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.08);
        }

        .timeline-content {
          padding-top: 1px;
        }

        .timeline-title {
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
        }

        .timeline-description {
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .timeline-time {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
        }

        .tracking-empty,
        .tracking-loading {
          padding: 50px 20px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .no-active-query-card {
          max-width: 900px;
          margin: 24px auto 0;
        }

        .no-active-query {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 25px;
          text-align: center;
        }

        .no-active-query-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          font-size: 24px;
          font-weight: 900;
        }

        .no-active-query h3 {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
        }

        .no-active-query p {
          max-width: 390px;
          margin: 8px 0 20px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .apply-query-button {
          border: none;
          border-radius: 10px;
          padding: 11px 20px;
          background: #2563eb;
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .apply-query-button:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }

        .tracking-error {
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
        }

        .query-details {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
        }

        .query-details-title {
          margin-bottom: 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .query-details-description {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* ============================================================
           CHAT PANEL
           ============================================================ */

        .chats-header-section {
          margin-bottom: 28px;
        }

        .chats-layout {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 20px;
          align-items: stretch;
          min-height: 650px;
        }

        .chat-query-list {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 20px;
          background: white;
          box-shadow: 0 18px 45px rgba(37, 99, 235, 0.08);
        }

        .chat-query-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .chat-query-list-header h3 { margin: 0; color: #0f172a; font-size: 16px; }
        .chat-query-list-header span {
          min-width: 28px; height: 28px; padding: 0 8px; display: flex; align-items: center; justify-content: center;
          border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 800;
        }

        .chat-query-item {
          width: 100%;
          display: flex;
          gap: 12px;
          padding: 16px 18px;
          border: 0;
          border-bottom: 1px solid #f1f5f9;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .chat-query-item:hover { background: #f8fafc; }
        .chat-query-item.selected { background: #eff6ff; }
        .chat-query-avatar {
          width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; background: #dbeafe; color: #2563eb; font-weight: 900;
        }
        .chat-query-item-content { min-width: 0; flex: 1; }
        .chat-query-item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .chat-query-item-top strong { color: #0f172a; font-size: 14px; }
        .chat-query-item-top span { color: #2563eb; font-size: 10px; font-weight: 800; }
        .chat-query-item-feature { margin-top: 5px; color: #334155; font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-query-item-department { margin-top: 3px; color: #94a3b8; font-size: 11px; }
        .chat-query-list-empty { padding: 70px 25px; text-align: center; color: #64748b; }
        .chat-query-list-empty h4 { margin: 12px 0 6px; color: #0f172a; }
        .chat-query-list-empty p { margin: 0; font-size: 13px; line-height: 1.6; }

        .chat-panel {
          min-width: 0;
          height: 650px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 20px;
          background: white;
          border: 1px solid #dbeafe;
          box-shadow: 0 18px 45px rgba(37, 99, 235, 0.12);
        }

        .chat-header {
          flex-shrink: 0;
          padding: 17px 18px;
          background: #2563eb;
          color: white;
        }

        .chat-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          font-size: 16px;
          font-weight: 900;
        }

        .chat-header-info {
          min-width: 0;
        }

        .chat-header-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .chat-header-subtitle {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.82);
          font-size: 11px;
        }

        .chat-query-label {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          color: rgba(255, 255, 255, 0.88);
          font-size: 11px;
          line-height: 1.4;
        }

        .chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 18px 14px;
          background:
            radial-gradient(
              circle at top left,
              rgba(37, 99, 235, 0.05),
              transparent 35%
            ),
            #f8fafc;
        }

        .chat-loading {
          padding: 25px 10px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        .chat-empty {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 18px;
          text-align: center;
          color: #64748b;
        }

        .chat-empty-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 13px;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          font-size: 24px;
        }

        .chat-empty h4 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
        }

        .chat-empty p {
          max-width: 250px;
          margin: 7px 0 0;
          font-size: 12px;
          line-height: 1.6;
        }

        .chat-message-row {
          display: flex;
          margin-bottom: 9px;
        }

        .chat-message-row.customer {
          justify-content: flex-end;
        }

        .chat-message-row.employee {
          justify-content: flex-start;
        }

        .chat-message-bubble {
          max-width: 82%;
          padding: 9px 11px 7px;
          border-radius: 13px;
          box-shadow: 0 2px 7px rgba(15, 23, 42, 0.05);
        }

        .chat-message-row.employee
          .chat-message-bubble {
          background: white;
          border: 1px solid #e2e8f0;
          border-top-left-radius: 4px;
        }

        .chat-message-row.customer
          .chat-message-bubble {
          background: #dbeafe;
          color: #172554;
          border-top-right-radius: 4px;
        }

        .chat-message-sender {
          margin-bottom: 3px;
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
        }

        .chat-message-text {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 13px;
          line-height: 1.5;
        }

        .chat-message-time {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 9px;
          text-align: right;
        }

        .chat-meeting-card {
          margin: 7px 0 12px;
          padding: 12px;
          border: 1px solid #bfdbfe;
          border-radius: 13px;
          background: #eff6ff;
        }

        .chat-meeting-title {
          color: #1e3a8a;
          font-size: 12px;
          font-weight: 800;
        }

        .chat-meeting-time {
          margin-top: 4px;
          color: #64748b;
          font-size: 10px;
        }

        .chat-meeting-button {
          width: 100%;
          margin-top: 10px;
          padding: 9px 12px;
          border: none;
          border-radius: 9px;
          background: #2563eb;
          color: white;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .chat-meeting-button:hover {
          background: #1d4ed8;
        }

        .chat-input-area {
          flex-shrink: 0;
          padding: 10px;
          border-top: 1px solid #e2e8f0;
          background: white;
        }

        .chat-input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .chat-input {
          flex: 1;
          min-height: 42px;
          max-height: 100px;
          padding: 11px 12px;
          resize: none;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          outline: none;
          font: inherit;
          font-size: 12px;
        }

        .chat-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .chat-send-button {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border: none;
          border-radius: 12px;
          background: #2563eb;
          color: white;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
        }

        .chat-send-button:hover {
          background: #1d4ed8;
        }

        .chat-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-closed {
          padding: 14px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          text-align: center;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .chat-error {
          margin-bottom: 8px;
          padding: 7px 9px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 10px;
        }

        /* ANIMATIONS */

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1100px) {
          .chats-layout {
            grid-template-columns: 1fr;
          }

          .chat-panel {
            position: relative;
            top: auto;
            height: 600px;
            min-height: 0;
          }
        }

        @media (max-width: 700px) {
          .dashboard-header {
            padding: 0 5%;
          }

          .brand span {
            display: none;
          }

          .dashboard-main {
            width: 92%;
            padding-top: 35px;
          }

          .header-actions {
            gap: 6px;
          }

          .account-button,
          .logout-button {
            padding: 9px 11px;
            font-size: 12px;
          }
          .dashboard-header {
            height: auto;
            min-height: 72px;
            padding: 12px 5%;
            flex-wrap: wrap;
            gap: 10px;
          }

          .dashboard-nav {
            width: 100%;
            justify-content: flex-end;
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .nav-button,
          .nav-logout-button {
            padding: 8px 10px;
            font-size: 12px;
            white-space: nowrap;
          }


          .form-card {
            padding: 20px;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .cancel-button,
          .submit-button {
            width: 100%;
          }
        }


        @media (max-width: 900px) {
          .tracking-layout,
          .tracking-only {
            grid-template-columns: 1fr;
          }

          .history-grid {
            grid-template-columns: 1fr;
          }

          .history-tracking-layout {
            grid-template-columns: 1fr;
          }

          .query-history-card,
          .history-list {
            max-height: 420px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* HEADER */}

      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-logo">IW</div>
          <span>Indian Wholesalers</span>
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className={`nav-button ${
              activePage === "home" ? "active" : ""
            }`}
            onClick={() => handleNavigation("home")}
          >
            Home
          </button>

          <button
            type="button"
            className={`nav-button ${
              activePage === "history" ? "active" : ""
            }`}
            onClick={() => handleNavigation("history")}
          >
            History
          </button>

          <button
            type="button"
            className={`nav-button ${
              activePage === "tracking" ? "active" : ""
            }`}
            onClick={() => handleNavigation("tracking")}
          >
            Track Query
          </button>

          <button
            type="button"
            className={`nav-button ${
              activePage === "chats" ? "active" : ""
            }`}
            onClick={() => handleNavigation("chats")}
          >
            Chats
          </button>

          <button
            type="button"
            className="nav-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </header>

      {/* MAIN */}

      <main className="dashboard-main">
        {activePage === "home" && (
          <div className="dashboard-page">

            {/* WELCOME */}

            <section className="welcome-section">
              <div className="welcome-label">
                Customer Dashboard
              </div>

              <h1>How can we help you?</h1>

              <p>
                Select a department and choose the service that
                matches your problem. You can then submit the
                details and supporting documents to our team.
              </p>
            </section>

            {/* DEPARTMENTS */}

            <section>
              <div className="section-title">
                <h2>Departments</h2>

                <p>
                  Choose one of our 23 departments to find the
                  service related to your problem.
                </p>
              </div>

              <div className="department-list">
                {departments.map((department) => {
                  const isOpen =
                    openDepartment === department.id;

                  return (
                    <div
                      className="department-card"
                      key={department.id}
                    >
                      <button
                        type="button"
                        className="department-header"
                        onClick={() =>
                          handleDepartmentClick(department)
                        }
                      >
                        <div className="department-info">
                          <div className="department-number">
                            {String(department.id).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <div>
                            <div className="department-name">
                              {department.name}
                            </div>

                            <div className="department-count">
                              4 features available
                            </div>
                          </div>
                        </div>

                        <div
                          className={`chevron ${
                            isOpen ? "open" : ""
                          }`}
                        >
                          ↓
                        </div>
                      </button>

                      <div
                        className={`features-wrapper ${
                          isOpen ? "open" : ""
                        }`}
                      >
                        <div className="features-inner">
                          <div className="features">
                            {department.features.map(
                              (feature) => (
                                <button
                                  type="button"
                                  className="feature-button"
                                  key={feature}
                                  onClick={() =>
                                    handleFeatureSelect(
                                      department,
                                      feature
                                    )
                                  }
                                >
                                  <span>{feature}</span>
                                  <span>→</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PROBLEM FORM */}

            <section
              id="problem-form"
              className="problem-section"
            >
              <div className="section-title">
                <h2>Submit Your Problem</h2>

                <p>
                  Select a feature above to submit your query
                  to the Indian Wholesalers team.
                </p>
              </div>

              {!selectedDepartment ||
              !selectedFeature ? (
                <div className="empty-form">
                  <div className="empty-icon">📋</div>

                  <h3>Select a feature first</h3>

                  <p>
                    Choose a department and one of its features
                    above. The problem submission form will
                    appear here.
                  </p>
                </div>
              ) : (
                <form
                  className="form-card"
                  onSubmit={handleSubmit}
                >
                  <div className="selection-path">
                    <span>Selected:</span>

                    <span className="selection-item">
                      {selectedDepartment.name}
                    </span>

                    <span>→</span>

                    <span className="selection-item">
                      {selectedFeature}
                    </span>
                  </div>

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="success-message">
                      {success}
                    </div>
                  )}

                  <div className="form-group">
                    <label
                      htmlFor="description"
                      className="form-label"
                    >
                      Problem Description{" "}
                      <span className="required">*</span>
                    </label>

                    <textarea
                      id="description"
                      className="description-input"
                      placeholder="Describe your problem in detail. Include relevant dates, amounts, people involved, reference numbers, and any other information that can help us understand your problem."
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      maxLength={5000}
                    />

                    <div className="character-count">
                      {description.length} / 5000
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Documents / Proofs
                    </label>

                    <div className="upload-box">
                      <div className="upload-icon">
                        📎
                      </div>

                      <div className="upload-title">
                        Upload supporting documents
                      </div>

                      <div className="upload-description">
                        PDF, JPG, JPEG, PNG, DOC or DOCX
                        · Maximum 10 MB per file
                      </div>

                      <input
                        className="file-input"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </div>

                    {files.length > 0 && (
                      <div className="file-list">
                        {files.map((file, index) => (
                          <div
                            className="file-item"
                            key={`${file.name}-${index}`}
                          >
                            <span className="file-name">
                              📄 {file.name}
                            </span>

                            <button
                              type="button"
                              className="remove-file"
                              onClick={() =>
                                removeFile(index)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : "Submit Query"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}

        {activePage === "history" && (
          <div className="dashboard-page">
            <section className="tracking-section">
              <div className="section-title">
                <h2>Query History</h2>

                <p>
                  View your completed and previous queries with
                  the full tracking timeline.
                </p>
              </div>

              {queries.length === 0 ? (
                <div className="history-full-card">
                  <div className="no-active-query">
                    <div className="no-active-query-icon">
                      ✓
                    </div>

                    <h3>No Query History</h3>

                    <p>
                      You have not submitted any queries yet.
                    </p>

                    <button
                      type="button"
                      className="apply-query-button"
                      onClick={() =>
                        handleNavigation("home")
                      }
                    >
                      Apply Query
                    </button>
                  </div>
                </div>
              ) : (
                <div className="history-tracking-layout">
                  <div className="history-full-card history-list-card">
                    <div className="history-header">
                      <h3>All Your Queries</h3>

                      <span className="history-count">
                        {queries.length}{" "}
                        {queries.length === 1
                          ? "Query"
                          : "Queries"}
                      </span>
                    </div>

                    <div className="history-list">
                      {queries.map((query) => {
                        let statusClass = "";

                        if (
                          query.status === "WAITING"
                        ) {
                          statusClass = "waiting";
                        } else if (
                          query.status === "ASSIGNED"
                        ) {
                          statusClass = "assigned";
                        } else if (
                          query.status === "IN_PROGRESS"
                        ) {
                          statusClass = "progress";
                        } else if (
                          query.status === "RESOLVED"
                        ) {
                          statusClass = "resolved";
                        }

                        return (
                          <button
                            type="button"
                            key={query.id}
                            className={`query-history-item ${
                              selectedTrackingQueryId ===
                              query.id
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedTrackingQueryId(
                                query.id
                              );
                              loadQueryTracking(
                                query.id
                              );
                            }}
                          >
                            <div className="query-history-top">
                              <div>
                                <div className="query-history-feature">
                                  {query.feature}
                                </div>

                                <div className="query-history-department">
                                  {query.department}
                                </div>
                              </div>

                              <span
                                className={`status-pill ${statusClass}`}
                              >
                                {getStatusLabel(
                                  query.status
                                )}
                              </span>
                            </div>

                            <div className="query-history-date">
                              Submitted{" "}
                              {formatDateTime(
                                query.createdAt
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="tracking-card history-details-card">
                    {renderTrackingDetails()}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activePage === "tracking" && (
          <div className="dashboard-page">
            <section className="tracking-section">
              <div className="section-title">
                <h2>Track Query</h2>

                <p>
                  Follow your query from submission through
                  employee assignment and completion.
                </p>
              </div>

              {getActiveQueries().length === 0 ? (
                <div className="tracking-card no-active-query-card">
                  <div className="no-active-query">
                    <div className="no-active-query-icon">
                      ✓
                    </div>

                    <h3>No Active Query</h3>

                    <p>
                      You have no active queries to track.
                      Finished queries are available in History.
                    </p>

                    <button
                      type="button"
                      className="apply-query-button"
                      onClick={() =>
                        handleNavigation("home")
                      }
                    >
                      Apply Query
                    </button>
                  </div>
                </div>
              ) : (
                <div className="tracking-layout tracking-only">
                  <div className="query-history-card">
                    <div className="history-header">
                      <h3>Select Query</h3>

                      <span className="history-count">
                        {getActiveQueries().length}
                      </span>
                    </div>

                    {getActiveQueries().map((query) => {
                      let statusClass = "";

                      if (query.status === "WAITING") {
                        statusClass = "waiting";
                      } else if (
                        query.status === "ASSIGNED"
                      ) {
                        statusClass = "assigned";
                      } else if (
                        query.status === "IN_PROGRESS"
                      ) {
                        statusClass = "progress";
                      } else if (
                        query.status === "RESOLVED"
                      ) {
                        statusClass = "resolved";
                      }

                      return (
                        <button
                          type="button"
                          key={query.id}
                          className={`query-history-item ${
                            selectedTrackingQueryId ===
                            query.id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            loadQueryTracking(query.id)
                          }
                        >
                          <div className="query-history-top">
                            <div>
                              <div className="query-history-feature">
                                {query.feature}
                              </div>

                              <div className="query-history-department">
                                {query.department}
                              </div>
                            </div>

                            <span
                              className={`status-pill ${statusClass}`}
                            >
                              {getStatusLabel(
                                query.status
                              )}
                            </span>
                          </div>

                          <div className="query-history-date">
                            Submitted{" "}
                            {formatDateTime(
                              query.createdAt
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="tracking-card">
                  {trackingLoading ? (
                    <div className="tracking-loading">
                      Loading query tracking...
                    </div>
                  ) : trackingError ? (
                    <div className="tracking-error">
                      {trackingError}
                    </div>
                  ) : !tracking ? (
                    <div className="no-active-query">
                      <div className="no-active-query-icon">
                        ✓
                      </div>

                      <h3>No Active Query</h3>

                      <p>
                        There is no active query to track.
                        Finished queries are available in History.
                      </p>

                      <button
                        type="button"
                        className="apply-query-button"
                        onClick={() =>
                          handleNavigation("home")
                        }
                      >
                        Apply Query
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="tracking-card-header">
                        <div>
                          <h3>Query Tracking</h3>

                          <p>
                            {tracking.query.feature} ·{" "}
                            {tracking.query.department}
                          </p>
                        </div>

                        <span className="current-status">
                          {getStatusLabel(
                            tracking.query.status
                          )}
                        </span>
                      </div>

                      {tracking.query.status ===
                        "WAITING" &&
                        tracking.queuePosition !==
                          null && (
                          <div className="queue-position-box">
                            <div className="queue-position-label">
                              Current Queue Position
                            </div>

                            <div className="queue-position-number">
                              #{tracking.queuePosition}
                            </div>
                          </div>
                        )}

                      {tracking.employee && (
                        <div className="employee-assignment-box">
                          <div className="employee-assignment-label">
                            Assigned Employee
                          </div>

                          <div className="employee-assignment-name">
                            {tracking.employee.name}
                          </div>

                          <div className="employee-assignment-id">
                            {tracking.employee.employeeId}
                          </div>
                        </div>
                      )}

                      <div className="timeline">
                        <div
                          className={timelineClass(
                            tracking.tracking.submitted.completed,
                            tracking.query.status ===
                              "WAITING"
                          )}
                        >
                          <div className="timeline-dot">
                            {tracking.tracking.submitted
                              .completed
                              ? "✓"
                              : "1"}
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-title">
                              Query Submitted
                            </div>

                            <div className="timeline-description">
                              Your query has been successfully
                              submitted.
                            </div>

                            <div className="timeline-time">
                              {formatDateTime(
                                tracking.tracking
                                  .submitted.at
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={timelineClass(
                            tracking.tracking.queued.completed,
                            tracking.query.status ===
                              "WAITING"
                          )}
                        >
                          <div className="timeline-dot">
                            {tracking.tracking.queued
                              .completed
                              ? "✓"
                              : "2"}
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-title">
                              In Queue
                            </div>

                            <div className="timeline-description">
                              Your query is waiting for an
                              available employee.
                            </div>

                            <div className="timeline-time">
                              {tracking.query.status ===
                              "WAITING"
                                ? tracking.queuePosition !==
                                  null
                                  ? `Currently #${tracking.queuePosition} in queue`
                                  : "Waiting for assignment"
                                : "Queue stage completed"}
                            </div>
                          </div>
                        </div>

                        <div
                          className={timelineClass(
                            tracking.tracking.assigned.completed,
                            tracking.query.status ===
                              "ASSIGNED"
                          )}
                        >
                          <div className="timeline-dot">
                            {tracking.tracking.assigned
                              .completed
                              ? "✓"
                              : "3"}
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-title">
                              Assigned to Employee
                            </div>

                            <div className="timeline-description">
                              {tracking.employee
                                ? `Assigned to ${tracking.employee.name} (${tracking.employee.employeeId}).`
                                : "Waiting for an employee to become available."}
                            </div>

                            <div className="timeline-time">
                              {formatDateTime(
                                tracking.tracking.assigned
                                  .at
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={timelineClass(
                            tracking.tracking.inProgress.completed,
                            tracking.query.status ===
                              "IN_PROGRESS"
                          )}
                        >
                          <div className="timeline-dot">
                            {tracking.tracking.inProgress
                              .completed
                              ? "✓"
                              : "4"}
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-title">
                              In Progress
                            </div>

                            <div className="timeline-description">
                              The assigned employee has accepted
                              your query and is working on it.
                            </div>

                            <div className="timeline-time">
                              {formatDateTime(
                                tracking.tracking.inProgress
                                  .at
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={timelineClass(
                            tracking.tracking.finished.completed,
                            tracking.query.status ===
                              "RESOLVED"
                          )}
                        >
                          <div className="timeline-dot">
                            {tracking.tracking.finished
                              .completed
                              ? "✓"
                              : "5"}
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-title">
                              Finished
                            </div>

                            <div className="timeline-description">
                              {tracking.query.status ===
                              "RESOLVED"
                                ? "Your query has been completed successfully."
                                : "This stage will be completed when the employee resolves your query."}
                            </div>

                            <div className="timeline-time">
                              {formatDateTime(
                                tracking.tracking.finished
                                  .at
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="query-details">
                        <div className="query-details-title">
                          Problem Description
                        </div>

                        <div className="query-details-description">
                          {tracking.query.description}
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activePage === "chats" && (
          <div className="dashboard-page chats-page">
            <section className="chats-header-section">
              <div className="welcome-label">Customer Support</div>
              <h1>Your Chats</h1>
              <p>Select an active query to communicate directly with its assigned employee.</p>
            </section>

            <div className="chats-layout">
              <aside className="chat-query-list">
                <div className="chat-query-list-header">
                  <h3>Active Queries</h3>
                  <span>{queries.filter((query) => query.employee && (query.status === "ASSIGNED" || query.status === "IN_PROGRESS" || query.status === "NEEDS_INFO")).length}</span>
                </div>

                {queries.filter((query) => query.employee && (query.status === "ASSIGNED" || query.status === "IN_PROGRESS" || query.status === "NEEDS_INFO")).length === 0 ? (
                  <div className="chat-query-list-empty">
                    <div className="chat-empty-icon">💬</div>
                    <h4>No active chats</h4>
                    <p>A chat will appear here once your query is assigned to an employee.</p>
                  </div>
                ) : (
                  queries
                    .filter((query) => query.employee && (query.status === "ASSIGNED" || query.status === "IN_PROGRESS" || query.status === "NEEDS_INFO"))
                    .map((query) => (
                      <button
                        type="button"
                        key={query.id}
                        className={`chat-query-item ${selectedChatQueryId === query.id ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedChatQueryId(query.id);
                          setChatError("");
                        }}
                      >
                        <div className="chat-query-avatar">
                          {query.employee?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-query-item-content">
                          <div className="chat-query-item-top">
                            <strong>{query.employee?.name}</strong>
                            <span>{getStatusLabel(query.status)}</span>
                          </div>
                          <div className="chat-query-item-feature">{query.feature}</div>
                          <div className="chat-query-item-department">{query.department}</div>
                        </div>
                      </button>
                    ))
                )}
              </aside>

              <section className="chat-panel chat-panel-page">
            <div className="chat-header">
              {chatQuery?.employee ? (
                <>
                  <div className="chat-header-top">
                    <div className="chat-avatar">
                      {chatQuery.employee.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="chat-header-info">
                      <h3 className="chat-header-title">
                        {chatQuery.employee.name}
                      </h3>

                      <div className="chat-header-subtitle">
                        {chatQuery.employee.employeeId}
                        {" · "}
                        {chatClosed
                          ? "Conversation closed"
                          : "Support conversation"}
                      </div>
                    </div>
                  </div>

                  <div className="chat-query-label">
                    Query: {chatQuery.feature} ·{" "}
                    {chatQuery.department}
                  </div>
                </>
              ) : (
                <>
                  <div className="chat-header-top">
                    <div className="chat-avatar">
                      💬
                    </div>

                    <div className="chat-header-info">
                      <h3 className="chat-header-title">
                        Chat with Employee
                      </h3>

                      <div className="chat-header-subtitle">
                        Query support
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="chat-messages">
              {!chatQuery ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    💬
                  </div>

                  <h4>
                    No active employee conversation
                  </h4>

                  <p>
                    Once your query is assigned to an
                    employee, your conversation will
                    appear here.
                  </p>
                </div>
              ) : chatLoading && chatMessages.length === 0 ? (
                <div className="chat-loading">
                  Loading conversation...
                </div>
              ) : chatClosed ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    ✓
                  </div>

                  <h4>
                    Conversation closed
                  </h4>

                  <p>
                    This query has been resolved.
                    The conversation is no longer
                    available for new messages.
                  </p>
                </div>
              ) : chatMessages.length === 0 &&
                meetings.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    💬
                  </div>

                  <h4>
                    Start the conversation
                  </h4>

                  <p>
                    You can communicate with your
                    assigned employee here regarding
                    this query.
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((chatItem) => {
                    const isCustomer =
                      chatItem.sender.role ===
                      "CUSTOMER";

                    return (
                      <div
                        key={chatItem.id}
                        className={`chat-message-row ${
                          isCustomer
                            ? "customer"
                            : "employee"
                        }`}
                      >
                        <div className="chat-message-bubble">
                          {!isCustomer && (
                            <div className="chat-message-sender">
                              {chatItem.sender.name}
                            </div>
                          )}

                          <div className="chat-message-text">
                            {chatItem.message}
                          </div>

                          <div className="chat-message-time">
                            {formatDateTime(
                              chatItem.createdAt
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {meetings.map((meeting) => (
                    <div
                      key={`meeting-${meeting.id}`}
                      className="chat-meeting-card"
                    >
                      <div className="chat-meeting-title">
                        📅 Meeting shared by{" "}
                        {meeting.createdBy.name}
                      </div>

                      {meeting.scheduledAt && (
                        <div className="chat-meeting-time">
                          {formatDateTime(
                            meeting.scheduledAt
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        className="chat-meeting-button"
                        onClick={() =>
                          window.open(
                            meeting.meetingLink,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      >
                        Join Meeting
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {chatError && (
              <div className="chat-input-area">
                <div className="chat-error">
                  {chatError}
                </div>
              </div>
            )}

            {chatQuery && !chatClosed && (
              <div className="chat-input-area">
                <div className="chat-input-row">
                  <textarea
                    className="chat-input"
                    value={chatMessage}
                    onChange={(event) =>
                      setChatMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={handleChatKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    disabled={chatSending}
                  />

                  <button
                    type="button"
                    className="chat-send-button"
                    onClick={handleSendChatMessage}
                    disabled={
                      chatSending ||
                      !chatMessage.trim()
                    }
                    aria-label="Send message"
                    title="Send message"
                  >
                    ➤
                  </button>
                </div>
              </div>
            )}

            {chatQuery && chatClosed && (
              <div className="chat-closed">
                This conversation ended because the
                query was resolved.
              </div>
            )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;