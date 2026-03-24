import { useEffect, useRef, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export default function Header({
  isMobile,
  setSidebarOpen,
  setRightOpen,
  accent,
  pendingRequestCount = 0,
  onOpenAccessRequests,
}) {
  const [now, setNow] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationsRef.current) {
        return;
      }

      if (!notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotifications]);

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

  const hasPendingRequests = pendingRequestCount > 0;

  const handleOpenNewAccess = () => {
    setShowNotifications(false);

    if (typeof onOpenAccessRequests === "function") {
      onOpenAccessRequests();
    }
  };

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

      <div ref={notificationsRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setShowNotifications((prev) => !prev)}
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
            position: "relative",
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 18 }} />
          {hasPendingRequests ? (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                padding: "0 4px",
                fontSize: 10,
                fontWeight: 700,
                lineHeight: "16px",
                background: "#ef4444",
                color: "#fff",
                border: "1px solid #fff",
              }}
            >
              {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
            </span>
          ) : null}
        </button>

        {showNotifications ? (
          <div
            style={{
              position: "absolute",
              top: 42,
              right: 0,
              width: isMobile ? 240 : 280,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.16)",
              padding: 10,
              zIndex: 60,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
              Notifications
            </div>

            {hasPendingRequests ? (
              <button
                type="button"
                onClick={handleOpenNewAccess}
                style={{
                  width: "100%",
                  border: "1px solid #fee2e2",
                  borderRadius: 10,
                  background: "#fff7f7",
                  color: "#991b1b",
                  padding: "10px 11px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                {pendingRequestCount} new access request{pendingRequestCount > 1 ? "s" : ""} awaiting review.
              </button>
            ) : (
              <div
                style={{
                  border: "1px dashed #d1d5db",
                  borderRadius: 10,
                  background: "#f8fafc",
                  color: "#64748b",
                  padding: "10px 11px",
                  fontSize: 12,
                }}
              >
                No new notifications right now.
              </div>
            )}
          </div>
        ) : null}
      </div>

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
