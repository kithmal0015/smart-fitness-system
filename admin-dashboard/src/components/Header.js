import { useEffect, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export default function Header({
  isMobile,
  setSidebarOpen,
  setRightOpen,
  accent,
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dateText = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  });

  const timeText = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <header
      style={{
        background: "#fff",
        padding: isMobile ? "10px 12px" : "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        borderBottom: "1px solid #f0f0f0",
        flexShrink: 0,
      }}
    >
      <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)}>
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <rect width="20" height="2" rx="1" fill="#374151" />
          <rect y="7" width="20" height="2" rx="1" fill="#374151" />
          <rect y="14" width="20" height="2" rx="1" fill="#374151" />
        </svg>
      </button>

      <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
          }}
        >
          <SearchIcon sx={{ fontSize: 18 }} />
        </span>
        <input
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
            borderRadius: 12,
            border: "1.5px solid #e5e7eb",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            color: "#374151",
            background: "#fafafa",
          }}
          placeholder="Search"
        />
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        {!isMobile && (
          <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap", fontWeight: 600 }}>
            {dateText} | {timeText}
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label="Notifications"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1.5px solid #e5e7eb",
          background: "#fff",
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <NotificationsActiveIcon sx={{ fontSize: 18 }} />
      </button>

      <button className="profile-toggle" onClick={() => setRightOpen((v) => !v)}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "#2d3a00",
          }}
        >
          KT
        </div>
        <span>Profile</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>
    </header>
  );
}
