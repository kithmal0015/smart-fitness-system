import { useState, useEffect } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";

// ── Data ───────────────────────────────────────────────────────────────────────
const CLASSES = [
  { id: 1, title: "Total Members",bg: "#9acd32" },
  { id: 2, title: "Active Members",bg: "#87ceeb" },
  { id: 3, title: "Low Engagement Members",bg: "#ffa07a" },
];

const LESSONS = [
  { cls: "A1", teacher: "Bernard Carr", members: ["BC", "CD", "DE"], extra: 3, date: "12.07.2022", status: "Done", statusColor: "#22C55E" },
  { cls: "A1", teacher: "Henry Poole", members: ["HP", "IQ", "JR", "KS"], extra: 7, date: "17.07.2022", status: "Pending", statusColor: "#EF4444" },
  { cls: "A1", teacher: "Helena Lowe", members: ["HL", "MN"], date: "22.07.2022", status: "Done", statusColor: "#22C55E" },
];

const CALENDAR_WEEKS = [
  [27, 28, 29, 30, 1, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 31],
];
const CAL_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const REMINDERS = [
  { title: "Eng – Vocabulary test", date: "12 Dec 2022, Friday" },
  { title: "Eng – Essay", date: "12 Dec 2022, Friday" },
  { title: "Eng – Speaking Class", date: "12 Dec 2022, Friday" },
  { title: "Eng – Vocabulary test", date: "12 Dec 2022, Friday" },
];

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
  const [activeDay, setActiveDay] = useState(7);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const accent = "#d5f165";
  const accentDark = "#a8c42a";
  const accentBg = "#f4fcd9";

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
          onLogout={onLogout}
        />

        {/* ── CENTER COLUMN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          <Header
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            setRightOpen={setRightOpen}
            accent={accent}
          />

          {/* Scroll area */}
          <div style={{
            flex: 1, overflow: "auto",
            padding: isMobile ? "14px 12px 80px" : isTablet ? "18px 20px 24px" : "20px 24px 24px",
          }}>

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
            <div className="s2" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Members</span>
              </div>
              <div className="classes-grid">
                {CLASSES.map((cls) => (
                  <div key={cls.id} className="class-card" style={{ background: cls.bg }}>
                    <div style={{ position: "absolute", right: -20, top: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                    <div style={{ position: "absolute", right: 10, bottom: -15, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, position: "relative" }}>{cls.title}</div>
                    <div style={{ position: "relative" }}><AvatarStack members={cls.avatars} extra={cls.extra} size={26} /></div>
                                        
                  </div>
                ))}
              </div>
            </div>

            {/* Lessons */}
            <div className="card s3" style={{ padding: isMobile ? "15px 13px" : "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Payments</span>
                <button style={{ fontSize: 12.5, color: accentDark, background: accentBg, border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View All →</button>
              </div>

              {/* Header row */}
              <div className="lesson-row lesson-header">
                <span>Class</span>
                <span>Teacher Name</span>
                <span>Members</span>
                <span>Starting</span>
                <span className="col-material">Material</span>
                <span>Payment</span>
              </div>

              {LESSONS.map((l, i) => (
                <div key={i} className="lesson-row" style={{ borderTop: isMobile ? "none" : "1px solid #f9fafb" }}>
                  {isMobile ? (
                    /* Mobile: stacked card layout */
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{l.cls} · {l.teacher}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.statusColor, display: "inline-block" }} />
                          <span style={{ color: l.statusColor }}>{l.status}</span>
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <AvatarStack members={l.members} extra={l.extra} size={22} />
                        <span style={{ fontSize: 11.5, color: "#9ca3af" }}>{l.date}</span>
                      </div>
                    </>
                  ) : (
                    /* Tablet / Desktop: grid layout */
                    <>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{l.cls}</span>
                      <span style={{ fontSize: 13, color: "#374151" }}>{l.teacher}</span>
                      <AvatarStack members={l.members} extra={l.extra} size={24} />
                      <span style={{ fontSize: 12.5, color: "#6b7280" }}>{l.date}</span>
                      <span className="col-material" style={{ fontSize: 12.5, color: "#6b7280" }}>Download</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.statusColor, display: "inline-block" }} />
                        <span style={{ color: l.statusColor }}>{l.status}</span>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

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
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, #a8c42a)`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#2d3a00" }}>SW</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Stella Walton</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>Student</div>
            <button style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 20, padding: "7px 24px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Profile</button>
          </div>

          {/* Calendar */}
          <div className="s2 card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>December 2022</span>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {CAL_HEADERS.map(h => (
                <div key={h} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#9ca3af", padding: "4px 0" }}>{h}</div>
              ))}
              {CALENDAR_WEEKS.flat().map((d, i) => {
                const isActive = d === activeDay && i >= 7;
                const isToday = d === 19 && i >= 7 && i < 28;
                const dimmed = i < 7;
                return (
                  <div
                    key={i}
                    className={`cal-cell${isActive ? " active" : ""}${isToday && !isActive ? " today-ring" : ""}${dimmed ? " dimmed" : ""}`}
                    onClick={() => !dimmed && setActiveDay(d)}
                  >{d}</div>
                );
              })}
            </div>
          </div>

          {/* Reminders */}
          <div className="s3" style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Reminders</div>
            {REMINDERS.map((r, i) => (
              <div key={i} className="reminder-item">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🔔</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{r.title}</div>
                  <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{r.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Expand */}
          <div style={{ textAlign: "right" }}>
            <button style={{ width: 36, height: 36, borderRadius: 10, background: "#1e293b", border: "none", cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto" }}>↗</button>
          </div>
        </aside>

        
        <nav className="bottom-nav">
          {[
            { icon: "⌂", label: "Home", id: "dashboard" },
            { icon: "👤", label: "Class", id: "classroom" },
            { icon: "▶", label: "Live", id: "live" },
            { icon: "🎥", label: "Saved", id: "recorded" },
            { icon: "📚", label: "Library", id: "library" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveNav(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 10px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: activeNav === tab.id ? "#d5f165" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, transition: "background 0.15s" }}>{tab.icon}</div>
              <span style={{ fontSize: 10, color: activeNav === tab.id ? "#a8c42a" : "#9ca3af", fontWeight: activeNav === tab.id ? 700 : 500 }}>{tab.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </>
  );
}