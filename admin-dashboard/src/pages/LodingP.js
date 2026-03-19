import { useState, useEffect } from "react";
import logoImage from "../assets/images/logo.png";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,800&family=Barlow:wght@400;500;600;700&display=swap');

  @keyframes ff-fade-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes ff-bar-fill {
    from { width: 0%; }
    to   { width: var(--target-width); }
  }

  @keyframes ff-pulse-logo {
    0%, 100% { box-shadow: 0 0 0 0 rgba(196,255,0,0.5); }
    50%       { box-shadow: 0 0 0 12px rgba(196,255,0,0); }
  }

  @keyframes ff-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes ff-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  @keyframes ff-step-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .ff-load-body {
    font-family: 'Barlow', sans-serif;
    min-height: 100vh;
    display: flex;
    padding: 0;
  }

  .ff-load-card {
    width: 100%;
    min-height: 100vh;
    background: #ffffff;
    overflow: hidden;
    animation: ff-fade-in 0.5s ease both;
    display: flex;
    flex-direction: column;
  }

  /* TOP DARK BAND */
  .ff-load-top {
    background: #111111;
    padding: 36px 40px 32px;
    position: relative;
    overflow: hidden;
  }

  .ff-load-top::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(196,255,0,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(196,255,0,0.04) 1px, transparent 1px);
    background-size: 36px 36px;
    pointer-events: none;
  }

  .ff-load-logo-row {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;
    margin-bottom: 32px;
    animation: ff-fade-in 0.5s ease 0.1s both;
  }

  .ff-load-logo-box {
    width: 44px;
    height: 44px;
    background: #c4ff00;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 17px;
    color: #111111;
    letter-spacing: -0.5px;
    animation: ff-pulse-logo 2s ease-in-out infinite;
  }

  .ff-load-logo-image {
    width: 44px;
    height: 44px;
    object-fit: contain;
    animation: ff-pulse-logo 2s ease-in-out infinite;
  }

  .ff-load-logo-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 18px;
    color: #ffffff;
    letter-spacing: 1px;
  }

  .ff-load-logo-sub {
    font-size: 10px;
    color: #666;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .ff-load-headline {
    position: relative;
    z-index: 1;
    animation: ff-fade-in 0.5s ease 0.2s both;
  }

  .ff-load-headline h1 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 56px;
    line-height: 0.9;
    text-transform: uppercase;
    color: #ffffff;
    letter-spacing: -1px;
  }

  .ff-load-headline h1 em {
    font-style: italic;
    color: #c4ff00;
  }

  .ff-load-headline p {
    font-size: 13px;
    color: #666;
    margin-top: 12px;
  }

  /* BOTTOM WHITE SECTION */
  .ff-load-bottom {
    padding: 36px 40px 40px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* PROGRESS */
  .ff-progress-wrap {
    margin-bottom: 28px;
    animation: ff-fade-in 0.5s ease 0.3s both;
  }

  .ff-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .ff-progress-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #555;
  }

  .ff-progress-pct {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    color: #111;
    line-height: 1;
    transition: all 0.3s ease;
  }

  .ff-progress-track {
    width: 100%;
    height: 6px;
    background: #f0f0ee;
    border-radius: 99px;
    overflow: hidden;
  }

  .ff-progress-fill {
    height: 100%;
    background: #c4ff00;
    border-radius: 99px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 8px rgba(196,255,0,0.6);
  }

  /* STATUS STEPS */
  .ff-steps {
    list-style: none;
    padding: 0;
    margin: 0 0 28px;
    animation: ff-fade-in 0.5s ease 0.4s both;
  }

  .ff-step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f3;
    font-size: 13px;
    color: #aaa;
    transition: color 0.3s ease;
    animation: ff-step-in 0.4s ease both;
  }

  .ff-step:last-child { border-bottom: none; }

  .ff-step.done  { color: #555; }
  .ff-step.active { color: #111; font-weight: 600; }

  .ff-step-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 10px;
    transition: all 0.3s ease;
  }

  .ff-step-icon.pending {
    background: #f0f0ee;
    border: 1.5px solid #ddd;
  }

  .ff-step-icon.spinning {
    background: #111;
    border: 1.5px solid #111;
  }

  .ff-step-icon.done-icon {
    background: #c4ff00;
    border: 1.5px solid #c4ff00;
    color: #111;
    font-weight: 900;
  }

  .ff-spinner {
    width: 10px;
    height: 10px;
    border: 2px solid rgba(196,255,0,0.3);
    border-top-color: #c4ff00;
    border-radius: 50%;
    animation: ff-spin 0.7s linear infinite;
  }

  /* STATS FOOTER */
  .ff-load-stats {
    display: flex;
    gap: 0;
    background: #f8f8f6;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #efefed;
    animation: ff-fade-in 0.5s ease 0.5s both;
  }

  .ff-load-stat {
    flex: 1;
    padding: 14px 16px;
    border-right: 1px solid #efefed;
    text-align: center;
  }

  .ff-load-stat:last-child { border-right: none; }

  .ff-load-stat-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 24px;
    color: #111;
    line-height: 1;
  }

  .ff-load-stat-label {
    font-size: 9px;
    color: #aaa;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 3px;
  }

  .ff-load-version {
    text-align: center;
    font-size: 10px;
    color: #ccc;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 20px;
    animation: ff-fade-in 0.5s ease 0.6s both;
  }

  .ff-cursor {
    display: inline-block;
    width: 2px;
    height: 14px;
    background: #c4ff00;
    margin-left: 2px;
    vertical-align: middle;
    animation: ff-blink 1s step-end infinite;
  }

  @media (max-width: 480px) {
    .ff-load-top { padding: 28px 24px 24px; }
    .ff-load-bottom { padding: 24px 24px 28px; }
    .ff-load-headline h1 { font-size: 44px; }
  }
`;

const STEPS = [
  { id: 1, label: "Authenticating session" },
  { id: 2, label: "Loading member database" },
  { id: 3, label: "Syncing class schedule" },
  { id: 4, label: "Fetching trainer profiles" },
  { id: 5, label: "Preparing dashboard" },
];

const TYPING_TEXT = "Dashboard";

export default function ForceFitLoading({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let char = 0;
    const typeInterval = setInterval(() => {
      if (char < TYPING_TEXT.length) {
        setTypedText(TYPING_TEXT.slice(0, char + 1));
        char++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);
    return () => clearInterval(typeInterval);
  }, []);

  useEffect(() => {
    const totalDuration = 3800;
    const stepDuration = totalDuration / STEPS.length;
    let start = null;

    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);
      const step = Math.min(STEPS.length, Math.floor(elapsed / stepDuration));
      setCurrentStep(step);

      if (elapsed < totalDuration) {
        requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setCurrentStep(STEPS.length);
        setDone(true);
        setTimeout(() => onComplete && onComplete(), 600);
      }
    };

    requestAnimationFrame(tick);
  }, [onComplete]);

  const getStepStatus = (idx) => {
    if (idx < currentStep) return "done";
    if (idx === currentStep) return "active";
    return "pending";
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ff-load-body">
        <div className="ff-load-card">
          {/* TOP DARK BAND */}
          <div className="ff-load-top">
            <div className="ff-load-logo-row">
              <img src={logoImage} alt="Logo" className="ff-load-logo-image" />
              <div>
                <div className="ff-load-logo-name">Fetness</div>
                <div className="ff-load-logo-sub">Management System</div>
              </div>
            </div>
            <div className="ff-load-headline">
              <h1>
                LOADING
                <br />
                <em>
                  {typedText}
                  {!done && <span className="ff-cursor" />}
                </em>
              </h1>
              <p>Preparing your admin control center…</p>
            </div>
          </div>

          {/* BOTTOM WHITE SECTION */}
          <div className="ff-load-bottom">
            {/* PROGRESS BAR */}
            <div className="ff-progress-wrap">
              <div className="ff-progress-header">
                <span className="ff-progress-label">Initializing</span>
                <span className="ff-progress-pct">{progress}%</span>
              </div>
              <div className="ff-progress-track">
                <div
                  className="ff-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* STEPS */}
            <ul className="ff-steps">
              {STEPS.map((step, idx) => {
                const status = getStepStatus(idx);
                return (
                  <li
                    key={step.id}
                    className={`ff-step ${status === "done" ? "done" : ""} ${
                      status === "active" ? "active" : ""
                    }`}
                    style={{ animationDelay: `${0.4 + idx * 0.07}s` }}
                  >
                    <div
                      className={`ff-step-icon ${
                        status === "done"
                          ? "done-icon"
                          : status === "active"
                          ? "spinning"
                          : "pending"
                      }`}
                    >
                      {status === "done" && "✓"}
                      {status === "active" && <div className="ff-spinner" />}
                    </div>
                    {step.label}
                  </li>
                );
              })}
            </ul>

            {/* STATS */}
            <div className="ff-load-stats">
              <div className="ff-load-stat">
                <div className="ff-load-stat-num">JUST</div>
                <div className="ff-load-stat-label">Members</div>
              </div>
              <div className="ff-load-stat">
                <div className="ff-load-stat-num">DO</div>
                <div className="ff-load-stat-label">Classes/Mo</div>
              </div>
              <div className="ff-load-stat">
                <div className="ff-load-stat-num">IT</div>
                <div className="ff-load-stat-label">Trainers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}