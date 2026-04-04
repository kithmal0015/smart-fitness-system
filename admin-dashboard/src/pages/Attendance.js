import React, { useEffect, useMemo, useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventBusyIcon from "@mui/icons-material/EventBusy";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "ff_admin_token";

function getAdminToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || "";
}

function formatDateKey(inputDate) {
  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyles(status) {
  if (status === "Leave") {
    return { color: "#92400e", bg: "#ffedd5" };
  }
  return { color: "#0f766e", bg: "#ccfbf1" };
}

export default function Attendance({ accent }) {
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, presentCount: 0, leaveCount: 0, workingCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAttendance = async () => {
      const token = getAdminToken();
      if (!token) {
        if (isMounted) {
          setError("Admin session expired. Please sign in again.");
          setItems([]);
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/attendance?date=${encodeURIComponent(selectedDate)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(String(result?.message || "Failed to load attendance"));
        }

        if (!isMounted) {
          return;
        }

        setItems(Array.isArray(result?.items) ? result.items : []);
        setSummary(
          result?.summary || { total: 0, presentCount: 0, leaveCount: 0, workingCount: 0 }
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(String(loadError?.message || "Failed to load attendance"));
        setItems([]);
        setSummary({ total: 0, presentCount: 0, leaveCount: 0, workingCount: 0 });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAttendance();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const summaryCards = useMemo(
    () => [
      {
        id: "present",
        label: "Present Today",
        value: Number(summary.presentCount || 0),
        icon: CheckCircleIcon,
        color: "#166534",
        bg: "#ecfdf3",
      },
      {
        id: "leave-count",
        label: "Members Left the Gym",
        value: Number(summary.leaveCount || 0),
        icon: EventBusyIcon,
        color: "#92400e",
        bg: "#fff7ed",
      },
      {
        id: "working-count",
        label: "Members Still Working Out",
        value: Number(summary.workingCount || 0),
        icon: AccessTimeIcon,
        color: "#0f766e",
        bg: "#ecfeff",
      },
    ],
    [summary]
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Attendance Overview</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>Track daily member check-ins and monitor attendance trends.</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(String(event.target.value || ""))}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            background: "#fff",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {summaryCards.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                padding: "16px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: item.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconComponent sx={{ fontSize: 22, color: item.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{item.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 12px" }}>
          {error}
        </div>
      ) : null}

      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0", padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Today Attendance Status</div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1.2fr",
                gap: 10,
                alignItems: "center",
                padding: "0 12px 8px",
                borderBottom: "1px solid #e2e8f0",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Member ID</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Name</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Present Time</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Leave Time</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Status</div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {loading ? (
                <div style={{ fontSize: 13, color: "#64748b", padding: "4px 12px" }}>Loading attendance...</div>
              ) : null}
              {!loading && items.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b", padding: "4px 12px" }}>No attendance records for this date.</div>
              ) : null}
              {items.map((item, index) => {
                const status = getStatusStyles(item.status);
                return (
                  <div
                    key={`${item.memberId || "member"}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1.2fr",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "#f8fafc",
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>{String(item.memberId || "").slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.memberName || "Member"}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{formatTime(item.presentTime)}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{formatTime(item.leaveTime)}</div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: status.color,
                        background: status.bg,
                        padding: "3px 8px",
                        borderRadius: 999,
                        justifySelf: "start",
                        display: "inline-flex",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
