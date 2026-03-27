import React from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventBusyIcon from "@mui/icons-material/EventBusy";

const SUMMARY = [
  { id: "present", label: "Present Today", value: 25, icon: CheckCircleIcon, color: "#166534", bg: "#ecfdf3" },
  { id: "leave-count", label: "Members Left the Gym", value: 12, icon: EventBusyIcon, color: "#92400e", bg: "#fff7ed" },
  { id: "working-count", label: "Members Still Working Out", value: 13, icon: AccessTimeIcon, color: "#0f766e", bg: "#ecfeff" },
];

const RECENT_ATTENDANCE = [
  { memberId: "MBR-1001", name: "Nethmi Perera", presentTime: "08:05 AM", leaveTime: "10:12 AM", status: "Leave" },
  { memberId: "MBR-1007", name: "Kavindu Silva", presentTime: "08:31 AM", leaveTime: "--", status: "Present" },
  { memberId: "MBR-1022", name: "Ishara Fernando", presentTime: "09:02 AM", leaveTime: "11:08 AM", status: "Leave" },
  { memberId: "MBR-1034", name: "Sahan Wijesinghe", presentTime: "09:16 AM", leaveTime: "--", status: "Present" },
  { memberId: "MBR-1060", name: "Dulani Madushika", presentTime: "07:58 AM", leaveTime: "09:41 AM", status: "Leave" },
];

function getStatusStyles(status) {
  if (status === "Leave") {
    return { color: "#92400e", bg: "#ffedd5" };
  }
  return { color: "#0f766e", bg: "#ccfbf1" };
}

export default function Attendance({ accent }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Attendance Overview</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>Track daily member check-ins and monitor attendance trends.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {SUMMARY.map((item) => {
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
              {RECENT_ATTENDANCE.map((item, index) => {
                const status = getStatusStyles(item.status);
                return (
                  <div
                    key={`${item.memberId}-${index}`}
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
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>{item.memberId}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.presentTime}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.leaveTime}</div>
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
