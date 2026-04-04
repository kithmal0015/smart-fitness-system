import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import QRscaner from "../components/QRscaner";
import Members from "./Members";
import Trainers from "./Trainers";
import Payments from "./Payments";
import Settings from "./Settings";
import Advertisements from "./Advertisements";
import Attendance from "./Attendance";
import totalMembersImage from "../assets/images/Total.png";
import activeMembersImage from "../assets/images/Active.png";
import lowMembersImage from "../assets/images/Low.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "ff_admin_token";
const AUTH_USER_KEY = "ff_admin_user";
const SHOW_MEMBERS_SUMMARY_KEY = "ff_show_members_summary_cards";
const SHOW_PARTICIPATION_CHART_KEY = "ff_show_participation_chart";
const REMINDERS_STORAGE_KEY = "ff_dashboard_reminders";
const MEMBER_NOTIFICATIONS_SEEN_KEY = "ff_seen_member_notification_ids";
const LEGACY_REMINDER_TITLES = new Set([
  "eng-vocabulary test",
  "eng-essay",
  "eng-speaking class",
]);

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function readBooleanSetting(key, defaultValue = true) {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return defaultValue;
  }
  return raw === "true";
}

function normalizeReminderText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function isLegacyReminderTitle(title) {
  return LEGACY_REMINDER_TITLES.has(normalizeReminderText(title));
}

function loadRemindersFromStorage() {
  const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_REMINDERS;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return DEFAULT_REMINDERS;
    }

    const normalized = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        title: String(item.title || "").trim(),
        date: String(item.date || "").trim(),
      }))
      .filter((item) => item.title && item.date)
      .filter((item) => !isLegacyReminderTitle(item.title));

    return normalized.length > 0 ? normalized : DEFAULT_REMINDERS;
  } catch (_error) {
    return DEFAULT_REMINDERS;
  }
}

function formatReminderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReminderStatusDetails(value) {
  const reminderDate = new Date(value);
  if (Number.isNaN(reminderDate.getTime())) {
    return null;
  }

  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const reminderDayUtc = Date.UTC(
    reminderDate.getFullYear(),
    reminderDate.getMonth(),
    reminderDate.getDate()
  );
  const nowDayUtc = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const diffDays = Math.round((reminderDayUtc - nowDayUtc) / oneDayMs);

  if (diffDays === 0) {
    return {
      message: "Reminder: Today is Event Day",
      textColor: "#991b1b",
      background: "#fee2e2",
      border: "1px solid #fecaca",
    };
  }

  if (diffDays === 1) {
    return {
      message: "Reminder: due within 1 day",
      textColor: "#9a3412",
      background: "#ffedd5",
      border: "1px solid #fed7aa",
    };
  }

  if (diffDays === 2) {
    return {
      message: "Reminder: due within 2 days",
      textColor: "#92400e",
      background: "#fef3c7",
      border: "1px solid #fde68a",
    };
  }

  return null;
}

function loadSeenMemberNotificationIds() {
  const raw = localStorage.getItem(MEMBER_NOTIFICATIONS_SEEN_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 200);
  } catch (_error) {
    return [];
  }
}

function getCurrentAdminFromStorage() {
  const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function getDisplayNameFromAdmin(admin) {
  const userName = String((admin && admin.userName) || "").trim();
  if (!userName) {
    return "Admin User";
  }

  return userName;
}

function getInitialsFromName(name) {
  const normalized = String(name || "").trim();
  if (!normalized) {
    return "AU";
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return normalized.slice(0, 2).toUpperCase();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, maxSize = 960, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      let { width, height } = image;
      const largerSide = Math.max(width, height);

      if (largerSide > maxSize) {
        const ratio = maxSize / largerSide;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Image compression is not supported on this browser"));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    image.onerror = () => reject(new Error("Failed to process image"));
    image.src = dataUrl;
  });
}

// ── Data ───────────────────────────────────────────────────────────────────────
const CLASSES = [
  { id: 1, title: "Total Members", bg: "#9acd32" },
  { id: 2, title: "Active Members", bg: "#87ceeb" },
  { id: 3, title: "Low Engagement Members", bg: "#ffa07a" },
];

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildCalendarCells(year, monthIndex) {
  const firstDayDate = new Date(year, monthIndex, 1);
  const daysInCurrentMonth = getDaysInMonth(year, monthIndex);
  const firstWeekdayMondayStart = (firstDayDate.getDay() + 6) % 7;

  const prevMonthYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const daysInPreviousMonth = getDaysInMonth(prevMonthYear, prevMonthIndex);

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    if (index < firstWeekdayMondayStart) {
      cells.push({
        day: daysInPreviousMonth - firstWeekdayMondayStart + index + 1,
        isCurrentMonth: false,
      });
      continue;
    }

    const currentMonthDay = index - firstWeekdayMondayStart + 1;
    if (currentMonthDay <= daysInCurrentMonth) {
      cells.push({
        day: currentMonthDay,
        isCurrentMonth: true,
      });
      continue;
    }

    cells.push({
      day: currentMonthDay - daysInCurrentMonth,
      isCurrentMonth: false,
    });
  }

  return cells;
}

function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate()
  );
}

const CAL_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_REMINDERS = [];

const AVATAR_COLORS = ["#d5f165", "#a5d6f0", "#f9c784", "#f4a2c0", "#b3e5b0", "#d0b3e8"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function Av({ initials, size = 30, idx = 0, border = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.31, fontWeight: 700, color: "#2d3748", flexShrink: 0,
      border: border ? "2px solid #fff" : "none",
      marginLeft: border ? -8 : 0,
    }}>{initials}</div>
  );
}

function AvatarStack({ members = [], extra, size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {members.map((m, i) => (
        <Av key={i} initials={m} size={size} idx={i} border={i > 0} />
      ))}
      {extra && (
        <div style={{
          width: size, height: size, borderRadius: "50%", background: "#e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#64748b",
          border: "2px solid #fff", marginLeft: -8,
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ── Breakpoint hook ────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, w };
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function LearnthruDashboard({ onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedParticipationMonth, setSelectedParticipationMonth] = useState(new Date().getMonth());
  const [calendarCursorDate, setCalendarCursorDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [showMembersSummaryCards, setShowMembersSummaryCards] = useState(() => readBooleanSetting(SHOW_MEMBERS_SUMMARY_KEY, true));
  const [showParticipationChart, setShowParticipationChart] = useState(() => readBooleanSetting(SHOW_PARTICIPATION_CHART_KEY, true));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [memberNotificationItems, setMemberNotificationItems] = useState([]);
  const [seenMemberNotificationIds, setSeenMemberNotificationIds] = useState(() => loadSeenMemberNotificationIds());
  const [focusedMemberId, setFocusedMemberId] = useState("");
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [currentAdminName, setCurrentAdminName] = useState("Admin User");
  const [currentAdminImage, setCurrentAdminImage] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [reminders, setReminders] = useState(() => loadRemindersFromStorage());
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [editingReminderIndex, setEditingReminderIndex] = useState(null);
  const [editReminderTitle, setEditReminderTitle] = useState("");
  const [editReminderDate, setEditReminderDate] = useState("");
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    const admin = getCurrentAdminFromStorage();
    setCurrentAdminName(getDisplayNameFromAdmin(admin));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const token = getToken();
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        const item = data && data.item ? data.item : {};

        if (isMounted) {
          const displayName = String(item.displayName || "").trim();
          const profileImage = String(item.profileImage || "").trim();

          if (displayName) {
            setCurrentAdminName(displayName);
          }

          setCurrentAdminImage(profileImage);
        }
      } catch (_error) {
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTotalMembersCount = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) {
          setTotalMembersCount(0);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/members`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        const items = Array.isArray(data.items) ? data.items : [];

        if (isMounted) {
          setTotalMembersCount(items.length);
        }
      } catch (_error) {
        if (isMounted) {
          setTotalMembersCount(0);
        }
      }
    };

    loadTotalMembersCount();
    const pollTimer = setInterval(loadTotalMembersCount, 30000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    setShowMembersSummaryCards(readBooleanSetting(SHOW_MEMBERS_SUMMARY_KEY, true));
    setShowParticipationChart(readBooleanSetting(SHOW_PARTICIPATION_CHART_KEY, true));
  }, [activeNav]);

  useEffect(() => {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(
      MEMBER_NOTIFICATIONS_SEEN_KEY,
      JSON.stringify(seenMemberNotificationIds.slice(0, 200))
    );
  }, [seenMemberNotificationIds]);

  const handleOpenProfileModal = () => {
    setProfileError("");
    setProfileNotice("");
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileError("");
    setProfileNotice("");
  };

  const handleAddReminder = () => {
    const title = newReminderTitle.trim();
    const date = newReminderDate.trim();

    if (!title || !date) {
      return;
    }

    setReminders((prev) => [{ title, date }, ...prev]);
    setNewReminderTitle("");
    setNewReminderDate("");
    setIsReminderFormOpen(false);
  };

  const handleStartEditReminder = (index) => {
    const selectedReminder = reminders[index];
    if (!selectedReminder) {
      return;
    }

    setEditingReminderIndex(index);
    setEditReminderTitle(selectedReminder.title);
    setEditReminderDate(selectedReminder.date);
  };

  const handleCancelEditReminder = () => {
    setEditingReminderIndex(null);
    setEditReminderTitle("");
    setEditReminderDate("");
  };

  const handleSaveEditedReminder = () => {
    if (editingReminderIndex === null) {
      return;
    }

    const title = editReminderTitle.trim();
    const date = editReminderDate.trim();
    if (!title || !date) {
      return;
    }

    setReminders((prev) => prev.map((item, index) => (
      index === editingReminderIndex ? { title, date } : item
    )));
    handleCancelEditReminder();
  };

  const handleDeleteReminder = (indexToDelete) => {
    setReminders((prev) => prev.filter((_item, index) => index !== indexToDelete));
    if (editingReminderIndex === indexToDelete) {
      handleCancelEditReminder();
    }
  };

  const handleProfileImageSelected = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    setProfileError("");
    setProfileNotice("");
    setIsProfileSaving(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const compressedImage = await compressImageDataUrl(dataUrl);

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/profile/image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileImage: compressedImage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Selected image is too large. Please choose a smaller image.");
        }
        throw new Error(data.message || "Failed to upload profile image");
      }

      const savedImage = String((data.item && data.item.profileImage) || compressedImage).trim();
      const savedDisplayName = String((data.item && data.item.displayName) || "").trim();

      setCurrentAdminImage(savedImage);
      if (savedDisplayName) {
        setCurrentAdminName(savedDisplayName);
      }
      setProfileNotice(data.message || "Profile image updated successfully");
    } catch (error) {
      setProfileError(error.message || "Failed to upload profile image");
    } finally {
      setIsProfileSaving(false);
      event.target.value = "";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPendingRequestsCount = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) {
          setPendingRequestCount(0);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/access-requests/pending`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        const items = Array.isArray(data.items) ? data.items : [];

        if (isMounted) {
          setPendingRequestCount(items.length);
        }
      } catch (_error) {
        if (isMounted) {
          setPendingRequestCount(0);
        }
      }
    };

    loadPendingRequestsCount();
    const pollTimer = setInterval(loadPendingRequestsCount, 30000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMemberNotifications = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) {
          setMemberNotificationItems([]);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/member-notifications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        const items = Array.isArray(data.items) ? data.items : [];

        if (isMounted) {
          setMemberNotificationItems(items);
        }
      } catch (_error) {
        if (isMounted) {
          setMemberNotificationItems([]);
        }
      }
    };

    loadMemberNotifications();
    const pollTimer = setInterval(loadMemberNotifications, 30000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  const latestMemberRegistration = memberNotificationItems[0] || null;
  const newMemberRegistrationCount = useMemo(
    () =>
      memberNotificationItems.filter((item) => {
        const itemId = String((item && item._id) || "").trim();
        return itemId && !seenMemberNotificationIds.includes(itemId);
      }).length,
    [memberNotificationItems, seenMemberNotificationIds]
  );

  const handleNotificationsOpened = () => {
    const currentIds = memberNotificationItems
      .map((item) => String((item && item._id) || "").trim())
      .filter(Boolean);

    if (currentIds.length === 0) {
      return;
    }

    setSeenMemberNotificationIds((prev) => {
      const merged = Array.from(new Set([...prev, ...currentIds]));
      return merged.slice(0, 200);
    });
  };

  const handleOpenMembersFromNotifications = (memberId) => {
    const normalizedMemberId = String(memberId || "").trim();
    setFocusedMemberId(normalizedMemberId);
    setActiveNav("members");
  };

  const accent = "#d5f165";
  const accentDark = "#a8c42a";
  const accentBg = "#f4fcd9";

  const participationData = useMemo(() => {
    const year = new Date().getFullYear();
    const daysInMonth = getDaysInMonth(year, selectedParticipationMonth);

    return Array.from({ length: daysInMonth }, (_item, index) => {
      const day = index + 1;
      const participationValue = 35 + ((day * 7 + selectedParticipationMonth * 11) % 66);
      return { day, participationValue };
    });
  }, [selectedParticipationMonth]);

  const memberSummaryCards = useMemo(
    () => CLASSES.map((cls) => ({
      ...cls,
      count: cls.id === 1 ? totalMembersCount : 0,
    })),
    [totalMembersCount]
  );

  const peakParticipation = Math.max(...participationData.map((item) => item.participationValue), 1);
  const calendarYear = calendarCursorDate.getFullYear();
  const calendarMonthIndex = calendarCursorDate.getMonth();
  const calendarCells = useMemo(
    () => buildCalendarCells(calendarYear, calendarMonthIndex),
    [calendarYear, calendarMonthIndex]
  );
  const today = new Date();

  const handlePreviousMonth = () => {
    setCalendarCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f0f2f8; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #d5f165; border-radius: 8px; }

        .nav-link {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          border-radius: 12px; font-size: 13.5px; font-weight: 500; color: #6b7280;
          cursor: pointer; transition: all 0.15s; margin-bottom: 2px;
          border: none; background: transparent; width: 100%; text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-link:hover { background: #f4fcd9; color: #4a6000; }
        .nav-link.on { background: #d5f165; color: #2d3a00; font-weight: 700; }

        .card { background: #fff; border-radius: 20px; box-shadow: 0 3px 12px rgba(15,23,42,0.07); }

        .class-card {
          border-radius: 18px; padding: 20px 16px; cursor: pointer;
          position: relative; overflow: hidden; transition: transform 0.18s; color: #fff;
          min-height: 160px;
        }
        .class-card:hover { transform: translateY(-3px); }

        /* ── Lesson table ── */
        .lesson-row {
          display: grid;
          grid-template-columns: 50px 1fr 130px 110px 100px 90px;
          align-items: center; padding: 10px 16px;
          border-radius: 10px; font-size: 13px; transition: background 0.12s;
        }
        .lesson-row:hover { background: #fafafa; }
        .lesson-header { font-size: 11.5px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px; }

        /* Tablet: hide Material column */
        @media (max-width: 1023px) {
          .lesson-row { grid-template-columns: 44px 1fr 100px 90px 80px; }
          .col-material { display: none !important; }
        }

        /* Mobile: card-style rows */
        @media (max-width: 639px) {
          .lesson-row {
            display: flex; flex-direction: column; align-items: flex-start;
            gap: 6px; padding: 12px 14px; border-radius: 12px;
            background: #fafafa !important; margin-bottom: 8px;
            border: 1px solid #f0f0f0;
          }
          .lesson-header { display: none; }
          .col-material { display: none !important; }
        }

        /* ── Calendar ── */
        .cal-cell {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; cursor: pointer; transition: all 0.12s;
          color: #374151; font-weight: 500; margin: 0 auto;
        }
        .cal-cell:hover { background: #f4fcd9; }
        .cal-cell.active { background: #d5f165; color: #2d3a00; font-weight: 800; }
        .cal-cell.today-ring { border: 2px solid #d5f165; }
        .cal-cell.dimmed { color: #d1d5db; }

        /* ── Reminders ── */
        .reminder-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid #f3f4f6;
        }
        .reminder-item:last-child { border-bottom: none; }
        .reminder-item.reminder-soon {
          animation: reminder-blink 1s ease-in-out infinite;
          border-radius: 10px;
          padding: 10px;
          margin: 0 -10px;
          border-bottom-color: transparent;
        }
        @keyframes reminder-blink {
          0%, 100% { background: #eefdc8; }
          50% { background: #d5f165; }
        }

        /* ── Drawers (mobile/tablet) ── */
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.32);
          z-index: 40; backdrop-filter: blur(1px);
        }
        .sidebar-drawer {
          position: fixed; top: 0; left: 0; height: 100vh; width: 220px;
          z-index: 50; transform: translateX(-100%);
          transition: transform 0.25s ease;
          box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          overflow-y: auto;
        }
        .sidebar-drawer.open { transform: translateX(0); }

        .right-drawer {
          position: fixed; top: 0; right: 0; height: 100vh; width: 280px;
          z-index: 50; transform: translateX(100%);
          transition: transform 0.25s ease;
          box-shadow: -4px 0 20px rgba(0,0,0,0.1);
          overflow-y: auto;
        }
        .right-drawer.open { transform: translateX(0); }

        /* ── Responsive classes grid ── */
        .classes-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
        }
        @media (max-width: 767px) { .classes-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 420px) { .classes-grid { grid-template-columns: 1fr; } }

        /* ── Mobile welcome illustration ── */
        @media (max-width: 440px) { .welcome-illo { display: none !important; } }

        /* ── Hamburger / profile toggle ── */
        .menu-btn {
          display: none; background: none; border: none; cursor: pointer;
          padding: 7px; border-radius: 9px; transition: background 0.12s; flex-shrink: 0;
        }
        .menu-btn:hover { background: #f4fcd9; }
        @media (max-width: 1023px) { .menu-btn { display: flex; align-items: center; justify-content: center; } }

        .profile-toggle {
          display: none; align-items: center; gap: 6px; background: #f4fcd9;
          border: 1.5px solid #d5f165; border-radius: 10px; padding: 6px 10px;
          cursor: pointer; font-size: 12.5px; font-weight: 700; color: #2d3a00;
          font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0;
        }
        @media (max-width: 1023px) { .profile-toggle { display: flex; } }

        /* ── Mobile bottom nav ── */
        .bottom-nav {
          display: none; position: fixed; bottom: 0; left: 0; right: 0;
          background: #fff; border-top: 1px solid #f0f0f0;
          padding: 6px 0 14px; z-index: 30;
          justify-content: space-around; align-items: center;
        }
        @media (max-width: 639px) { .bottom-nav { display: flex; } }

        /* ── Animations ── */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .s1 { animation: slideUp 0.4s ease 0.05s both; }
        .s2 { animation: slideUp 0.4s ease 0.12s both; }
        .s3 { animation: slideUp 0.4s ease 0.19s both; }
        .s4 { animation: slideUp 0.4s ease 0.26s both; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f2f8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* Overlay */}
        {(sidebarOpen || rightOpen) && !isDesktop && (
          <div className="overlay" onClick={() => { setSidebarOpen(false); setRightOpen(false); }} />
        )}

        <Navbar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          isDesktop={isDesktop}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          accent={accent}
          pendingRequestCount={pendingRequestCount}
          onLogout={onLogout}
        />

        {/* ── CENTER COLUMN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          <Header
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            setRightOpen={setRightOpen}
            accent={accent}
            pendingRequestCount={pendingRequestCount}
            newMemberRegistrationCount={newMemberRegistrationCount}
            latestMemberRegistration={latestMemberRegistration}
            onOpenAccessRequests={() => setActiveNav("settings-new-access")}
            onOpenMembers={handleOpenMembersFromNotifications}
            onNotificationsOpened={handleNotificationsOpened}
          />

          {/* Scroll area */}
          <div style={{
            flex: 1, overflow: "auto",
            padding: isMobile ? "14px 12px 80px" : isTablet ? "18px 20px 24px" : "20px 24px 24px",
          }}>

            {/* Render Members page if Members, Male, or Female is selected */}
            {(activeNav === "members" || activeNav === "male" || activeNav === "female") ? (
              <Members accent={accent} activeNav={activeNav} focusedMemberId={focusedMemberId} />
            ) : (activeNav === "trainers" || activeNav === "trainers-male" || activeNav === "trainers-female") ? (
              <Trainers accent={accent} activeNav={activeNav} />
            ) : activeNav === "payment" ? (
              <Payments accent={accent} accentBg={accentBg} />
            ) : activeNav === "attendance" ? (
              <Attendance accent={accent} />
            ) : activeNav === "advertisements" ? (
              <Advertisements accent={accent} />
            ) : activeNav === "settings" || activeNav === "settings-dashboard" || activeNav === "settings-new-access" ? (
              <Settings
              accent={accent}
              onPendingCountChange={setPendingRequestCount}
              initialSection={activeNav === "settings-new-access" ? "new-access" : "dashboard-settings"}
              />
            ) : (
              <>
                {/* Welcome banner */}
            <div className="card s1" style={{
              padding: isMobile ? "18px 16px" : "24px 28px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(130deg, #f8faff 0%, #eef2ff 100%)",
              overflow: "hidden", position: "relative",
            }}>
              <div style={{ zIndex: 1, flex: 1 }}>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
                  Good morning, Kithmal Tharinda!
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, maxWidth: 300, lineHeight: 1.6 }}>
                  "Manage your gym with precision, inspire every workout with purpose, and build a stronger community through smart and effective administration.”{" "}
                </div>
              </div>
              {/* Illustration — hidden on very small screens via CSS */}
              <div className="welcome-illo" style={{ flexShrink: 0, marginLeft: isMobile ? 18 : 42 }}>
                <img
                  src="/image01.jpg"
                  alt="Welcome"
                  style={{
                    width: isMobile ? 200 : 300,
                    height: isMobile ? 200 : 190,
                    borderRadius: 5,
                    objectFit: "contain",
                    display: "block",
                    background: "transparent",
                    mixBlendMode: "multiply",
                    filter: "contrast(1.05) saturate(1.05)",
                    animation: "heroFade 2.2s ease-in-out infinite",
                    transformOrigin: "center bottom",
                  }}
                />
              </div>
            </div>

            {/* Classes */}
            {showMembersSummaryCards ? (
              <div className="s2" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Members</span>
                </div>
                <div className="classes-grid">
                  {memberSummaryCards.map((cls) => (
                    <div key={cls.id} className="class-card" style={{ background: cls.bg }}>
                      <div style={{ position: "absolute", right: -20, top: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                      <div style={{ position: "absolute", right: 10, bottom: -15, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, position: "relative" }}>{cls.title}</div>
                      <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, lineHeight: 1, letterSpacing: 0.2, marginTop: 35, marginBottom: 12, position: "relative", textShadow: "0 1px 0 rgba(0,0,0,0.08)", textAlign: "right", marginRight: 25}}>
                        {cls.count.toLocaleString()}
                      </div>
                      {cls.id === 1 && (
                        <img
                          src={totalMembersImage}
                          alt="Total members"
                          style={{
                            position: "absolute",
                            left: -38,
                            bottom: -38,
                            width: isMobile ? 150 : 200,
                            height: "auto",
                            objectFit: "contain",
                            opacity: 0.9,
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      {cls.id === 2 && (
                        <img
                          src={activeMembersImage}
                          alt="Active members"
                          style={{
                            position: "absolute",
                            left: -38,
                            bottom: -46,
                            width: isMobile ? 150 : 200,
                            height: "auto",
                            objectFit: "contain",
                            opacity: 0.9,
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      {cls.id === 3 && (
                        <img
                          src={lowMembersImage}
                          alt="Low engagement members"
                          style={{
                            position: "absolute",
                            left: -30,
                            bottom: -35,
                            width: isMobile ? 135 : 185,
                            height: "auto",
                            objectFit: "contain",
                            opacity: 0.9,
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      <div style={{ position: "relative" }}><AvatarStack members={cls.avatars} extra={cls.extra} size={26} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Monthly Participation */}
            {showParticipationChart ? (
              <div className="card s3" style={{ padding: isMobile ? "14px 12px" : "16px 16px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "0.95fr 1.65fr",
                    gap: 18,
                    alignItems: "stretch",
                  }}
                >
                  <QRscaner accent={accent} isMobile={isMobile} />

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: "#111827", lineHeight: 1 }}>Monthly Participation</span>
                      <select
                        value={selectedParticipationMonth}
                        onChange={(event) => setSelectedParticipationMonth(Number(event.target.value))}
                        style={{
                          fontSize: 11,
                          color: "#1f2937",
                          background: accentBg,
                          border: `1px solid ${accent}`,
                          borderRadius: 7,
                          padding: "4px 7px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {MONTH_OPTIONS.map((monthName, index) => (
                          <option key={monthName} value={index}>{monthName}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 10 }}>
                      Daily participation count for {MONTH_OPTIONS[selectedParticipationMonth]} (Day 1 to Day {participationData.length})
                    </div>

                    <div style={{ overflowX: "hidden", paddingBottom: 4, flex: 1 }}>
                      <div style={{ minWidth: "100%", display: "grid", gridTemplateColumns: `repeat(${participationData.length}, minmax(0, 1fr))`, alignItems: "end", gap: 4, height: isMobile ? 190 : 235, padding: "8px 0 0" }}>
                        {participationData.map((item) => {
                          const barHeight = Math.max(12, Math.round((item.participationValue / peakParticipation) * (isMobile ? 124 : 162)));
                          return (
                            <div key={item.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", lineHeight: 1 }}>
                                {item.participationValue}
                              </span>
                              <div
                                title={`Day ${item.day}: ${item.participationValue}`}
                                style={{
                                  width: "100%",
                                  maxWidth: 15,
                                  height: barHeight,
                                  borderRadius: "7px 7px 3px 3px",
                                  background: `linear-gradient(180deg, ${accent} 0%, ${accentDark} 100%)`,
                                  boxShadow: "0 2px 7px rgba(168,196,42,0.28)",
                                }}
                              />
                              <span style={{ fontSize: 9, color: "#6b7280", lineHeight: 1 }}>{item.day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!showMembersSummaryCards && !showParticipationChart ? (
              <div className="card s3" style={{ padding: isMobile ? "15px 13px" : "20px 22px", marginTop: 2 }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Members Summary Cards and Participation Chart are currently hidden from Dashboard Setting.
                </div>
              </div>
            ) : null}
              </>
            )}

          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <aside
          className={!isDesktop ? `right-drawer${rightOpen ? " open" : ""}` : ""}
          style={{
            width: 270, background: "#fff", padding: "20px 18px",
            display: "flex", flexDirection: "column", gap: 20,
            borderLeft: "1px solid #f0f0f0", overflow: "auto", flexShrink: 0,
            ...(isDesktop ? { height: "100%", position: "relative" } : {}),
          }}
        >
          {/* Close button on mobile/tablet */}
          {!isDesktop && (
            <button onClick={() => setRightOpen(false)} style={{ alignSelf: "flex-end", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af", lineHeight: 1 }}>✕</button>
          )}

          {/* Profile */}
          <div className="s1" style={{ textAlign: "center", paddingTop: 4 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, #a8c42a)`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#2d3a00", overflow: "hidden" }}>
              {currentAdminImage ? (
                <img
                  src={currentAdminImage}
                  alt={currentAdminName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitialsFromName(currentAdminName)
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{currentAdminName}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>Admin</div>
            <button
              onClick={handleOpenProfileModal}
              style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 20, padding: "7px 24px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Profile
            </button>
          </div>

          {/* Calendar */}
          <div className="s2 card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button
                onClick={handlePreviousMonth}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}
              >
                ‹
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {MONTH_OPTIONS[calendarMonthIndex]} {calendarYear}
              </span>
              <button
                onClick={handleNextMonth}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}
              >
                ›
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {CAL_HEADERS.map(h => (
                <div key={h} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#9ca3af", padding: "4px 0" }}>{h}</div>
              ))}
              {calendarCells.map((cell, index) => {
                const cellDate = new Date(calendarYear, calendarMonthIndex, cell.day);
                const isActive = cell.isCurrentMonth && isSameDate(cellDate, selectedCalendarDate);
                const isToday = cell.isCurrentMonth && isSameDate(cellDate, today);
                const dimmed = !cell.isCurrentMonth;
                return (
                  <div
                    key={`${index}-${cell.day}-${cell.isCurrentMonth ? "current" : "other"}`}
                    className={`cal-cell${isActive ? " active" : ""}${isToday && !isActive ? " today-ring" : ""}${dimmed ? " dimmed" : ""}`}
                    onClick={() => {
                      if (!cell.isCurrentMonth) {
                        return;
                      }
                      setSelectedCalendarDate(cellDate);
                    }}
                  >{cell.day}</div>
                );
              })}
            </div>
          </div>

          {/* Reminders */}
          <div className="s3" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Reminders</div>
              <button
                type="button"
                onClick={() => setIsReminderFormOpen((prev) => !prev)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 10px",
                  background: accent,
                  color: "#2d3a00",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                +Add
              </button>
            </div>

            {isReminderFormOpen ? (
              <div style={{ marginBottom: 10, padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", display: "grid", gap: 7 }}>
                <input
                  type="text"
                  value={newReminderTitle}
                  onChange={(event) => setNewReminderTitle(event.target.value)}
                  placeholder="Reminder title"
                  style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 9px", fontSize: 12.5 }}
                />
                <input
                  type="datetime-local"
                  value={newReminderDate}
                  onChange={(event) => setNewReminderDate(event.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 9px", fontSize: 12.5 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReminderFormOpen(false);
                      setNewReminderTitle("");
                      setNewReminderDate("");
                    }}
                    style={{ border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 10px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddReminder}
                    style={{ border: "none", borderRadius: 8, background: "#1e293b", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 10px", cursor: "pointer" }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}

            {reminders.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0" }}>
                No reminders yet. Use +Add to create one.
              </div>
            ) : reminders.map((r, i) => {
              const reminderStatusDetails = getReminderStatusDetails(r.date);
              const isReminderSoon = Boolean(reminderStatusDetails);

              return (
              <div key={i} className={`reminder-item${isReminderSoon ? " reminder-soon" : ""}`}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🔔</div>
                {editingReminderIndex === i ? (
                  <div style={{ width: "100%", display: "grid", gap: 7 }}>
                    <input
                      type="text"
                      value={editReminderTitle}
                      onChange={(event) => setEditReminderTitle(event.target.value)}
                      style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 9px", fontSize: 12.5 }}
                    />
                    <input
                      type="datetime-local"
                      value={editReminderDate}
                      onChange={(event) => setEditReminderDate(event.target.value)}
                      style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 9px", fontSize: 12.5 }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleCancelEditReminder}
                        style={{ border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 9px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditedReminder}
                        style={{ border: "none", borderRadius: 8, background: "#1e293b", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 9px", cursor: "pointer" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ width: "100%" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{formatReminderDate(r.date)}</div>
                    {reminderStatusDetails ? (
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 11,
                          fontWeight: 800,
                          color: reminderStatusDetails.textColor,
                          background: reminderStatusDetails.background,
                          border: reminderStatusDetails.border,
                          borderRadius: 999,
                          padding: "3px 8px",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {reminderStatusDetails.message}
                      </div>
                    ) : null}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, width: "100%" }}>
                      <button
                        type="button"
                        onClick={() => handleStartEditReminder(i)}
                        style={{ border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", color: "#334155", fontSize: 11.5, fontWeight: 700, padding: "4px 8px", cursor: "pointer",marginLeft: 85 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(i)}
                        style={{ border: "none", borderRadius: 7, background: "#ef4444", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 8px", cursor: "pointer", }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );})}
          </div>
        </aside>

        {isProfileModalOpen ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 160,
              padding: 12,
            }}
            onClick={handleCloseProfileModal}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                background: "#fff",
                borderRadius: 14,
                padding: 18,
                boxShadow: "0 15px 35px rgba(2, 6, 23, 0.2)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 12px", color: "#111827", fontSize: 19 }}>Admin Profile</h3>

              {profileError ? (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    padding: "10px 12px",
                    borderRadius: 10,
                    marginBottom: 10,
                    fontSize: 12,
                  }}
                >
                  {profileError}
                </div>
              ) : null}

              {profileNotice ? (
                <div
                  style={{
                    background: "#ecfdf3",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    padding: "10px 12px",
                    borderRadius: 10,
                    marginBottom: 10,
                    fontSize: 12,
                  }}
                >
                  {profileNotice}
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 78,
                      height: 78,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: `linear-gradient(135deg, ${accent}, #a8c42a)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                      fontWeight: 700,
                      color: "#2d3a00",
                    }}
                  >
                    {currentAdminImage ? (
                      <img
                        src={currentAdminImage}
                        alt={currentAdminName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      getInitialsFromName(currentAdminName)
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>User Name</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{currentAdminName}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 7 }}>
                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                    Upload Profile Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageSelected}
                    disabled={isProfileSaving}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      fontSize: 12,
                    }}
                  />
                  <span style={{ fontSize: 11.5, color: "#6b7280" }}>
                    JPG/PNG image support. Large images are automatically compressed.
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handleCloseProfileModal}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {isProfileSaving ? "Uploading..." : "Close"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}