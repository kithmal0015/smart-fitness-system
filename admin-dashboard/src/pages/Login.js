import { useState } from "react";
import logoImage from "../assets/images/logo.png";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,800&family=Barlow:wght@400;500;600;700&display=swap');

  .ff-body {
    font-family: 'Barlow', sans-serif;
    min-height: 100vh;
    display: flex;
    padding: 0;
  }

  .ff-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    min-height: 100vh;
    background: #ffffff;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .ff-card {
      grid-template-columns: 1fr;
    }
  }

  /* LEFT PANEL */
  .ff-left {
    background: #111111;
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .ff-left {
      display: none;
    }
  }

  .ff-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(196,255,0,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(196,255,0,0.04) 1px, transparent 1px);
    background-size: 36px 36px;
    pointer-events: none;
  }

  .ff-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;
  }

  .ff-logo-box {
    width: 40px;
    height: 40px;
    background: #c4ff00;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 16px;
    color: #111111;
    letter-spacing: -0.5px;
  }

  .ff-logo-image {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .ff-logo-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 17px;
    color: #ffffff;
    letter-spacing: 1px;
  }

  .ff-logo-sub {
    font-size: 10px;
    color: #777;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-top: 1px;
  }

  .ff-hero {
    position: relative;
    z-index: 1;
  }

  .ff-hero h1 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 72px;
    line-height: 0.9;
    text-transform: uppercase;
    color: #ffffff;
    letter-spacing: -1px;
  }

  @media (max-width: 768px) {
    .ff-hero h1 {
      font-size: 48px;
    }
  }

  .ff-hero h1 em {
    font-style: italic;
    color: #c4ff00;
  }

  .ff-divider {
    width: 48px;
    height: 3px;
    background: #c4ff00;
    margin: 20px 0 16px;
  }

  .ff-hero p {
    font-size: 14px;
    color: #888;
    line-height: 1.65;
    max-width: 280px;
  }

  .ff-stats {
    display: flex;
    gap: 32px;
    position: relative;
    z-index: 1;
  }

  .ff-stat-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 32px;
    color: #c4ff00;
    line-height: 1;
  }

  .ff-stat-label {
    font-size: 10px;
    color: #666;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* RIGHT PANEL */
  .ff-right {
    background: #ffffff;
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media (max-width: 768px) {
    .ff-right {
      padding: clamp(24px, 8vw, 48px);
      min-height: 100vh;
    }
  }

  .ff-access-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #c4ff00;
    background: #111;
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 18px;
    width: fit-content;
  }

  .ff-welcome h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 52px;
    line-height: 0.95;
    text-transform: uppercase;
    color: #111111;
    letter-spacing: -0.5px;
  }

  @media (max-width: 768px) {
    .ff-welcome h2 {
      font-size: 36px;
    }
  }

  .ff-welcome h2 em {
    font-style: italic;
    color: #111111;
  }

  .ff-welcome p {
    font-size: 14px;
    color: #888;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .ff-field-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 8px;
  }

  .ff-input-wrap {
    position: relative;
    margin-bottom: 20px;
    width: 100%;
  }

  .ff-input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    font-size: 15px;
    pointer-events: none;
  }

  .ff-input-icon svg {
    width: 16px;
    height: 16px;
    display: block;
  }

  .ff-input-wrap input {
    width: 100%;
    box-sizing: border-box;
    background: #f5f5f3;
    border: 1.5px solid #e8e8e6;
    border-radius: 10px;
    padding: 14px 14px 14px 42px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px;
    color: #111;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .ff-input-wrap input::placeholder {
    color: #bbb;
  }

  .ff-input-wrap input:focus {
    border-color: #c4ff00;
    box-shadow: 0 0 0 3px rgba(196,255,0,0.15);
    background: #fff;
  }

  .ff-show-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #888;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Barlow', sans-serif;
    transition: color 0.15s;
  }

  .ff-show-btn:hover {
    color: #111;
  }

  .ff-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .ff-remember {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
  }

  .ff-remember input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #c4ff00;
    cursor: pointer;
  }

  .ff-forgot {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #111;
    text-decoration: none;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Barlow', sans-serif;
    transition: color 0.15s;
  }

  .ff-forgot:hover {
    color: #555;
  }

  .ff-sign-in-btn {
    width: 100%;
    box-sizing: border-box;
    background: #c4ff00;
    border: none;
    border-radius: 10px;
    padding: 16px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 17px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #111111;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
    box-shadow: 0 4px 18px rgba(196,255,0,0.35);
  }

  .ff-sign-in-btn:hover {
    background: #d4ff33;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(196,255,0,0.45);
  }

  .ff-sign-in-btn:active {
    transform: translateY(0);
  }

  .ff-sign-in-btn:disabled {
    opacity: 0.72;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 18px rgba(196,255,0,0.18);
  }

  .ff-or-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0 14px;
  }

  .ff-or-line {
    flex: 1;
    height: 1px;
    background: #e8e8e6;
  }

  .ff-or-text {
    font-size: 11px;
    color: #bbb;
    letter-spacing: 1px;
  }

  .ff-request {
    text-align: center;
    font-size: 13px;
    color: #888;
  }

  .ff-request-link {
    font-weight: 700;
    color: #111;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.15s;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
  }

  .ff-request-link:hover {
    color: #555;
  }

  .ff-version {
    text-align: center;
    font-size: 10px;
    color: #ccc;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 20px;
  }

  @media (max-width: 680px) {
    .ff-card {
      grid-template-columns: 1fr;
    }
    .ff-left {
      padding: 36px 28px;
      min-height: 300px;
    }
    .ff-hero h1 {
      font-size: 52px;
    }
    .ff-right {
      padding: 36px 28px;
    }
    .ff-welcome h2 {
      font-size: 40px;
    }
  }
`;

export default function ForceFitLogin({ onLoginSuccess }) {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!userName.trim() || !password) {
      setErrorMessage("Username and password are required");
      return;
    }

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: userName.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data.message || "Invalid username or password");
        return;
      }

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(data.token, data.admin, remember);
      }
    } catch (_error) {
      setErrorMessage("Cannot connect to server. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (isProcessingReset) {
      return;
    }

    const requestedUserName = window.prompt(
      "Enter your admin username",
      userName.trim() || ""
    );

    if (!requestedUserName || !requestedUserName.trim()) {
      return;
    }

    setIsProcessingReset(true);
    try {
      const forgotResponse = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName: requestedUserName.trim() }),
      });

      const forgotData = await forgotResponse.json().catch(() => ({}));
      if (!forgotResponse.ok) {
        setErrorMessage(forgotData.message || "Failed to start password reset flow");
        return;
      }

      const resetTokenFromServer = forgotData.resetToken || "";
      const tokenInput = window.prompt(
        "Paste reset token (dev mode auto-filled)",
        resetTokenFromServer
      );

      if (!tokenInput || !tokenInput.trim()) {
        return;
      }

      const newPassword = window.prompt(
        "Enter new password (8+ chars with letters, numbers, symbols)"
      );
      if (!newPassword) {
        return;
      }

      const confirmPassword = window.prompt("Confirm new password");
      if (!confirmPassword) {
        return;
      }

      const resetResponse = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenInput.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const resetData = await resetResponse.json().catch(() => ({}));
      if (!resetResponse.ok) {
        setErrorMessage(resetData.message || "Password reset failed");
        return;
      }

      setErrorMessage("");
      window.alert("Password reset successful. Please sign in with your new password.");
    } catch (_error) {
      setErrorMessage("Cannot connect to server. Please try again.");
    } finally {
      setIsProcessingReset(false);
    }
  };

  const handleRequestAccess = async () => {
    if (isRequestingAccess) {
      return;
    }

    const requestedUserName = window.prompt("Enter a username for the new admin account", "");
    if (!requestedUserName || !requestedUserName.trim()) {
      return;
    }

    const requestedEmail = window.prompt("Enter email address", "");
    if (!requestedEmail || !requestedEmail.trim()) {
      return;
    }

    const requestedPassword = window.prompt(
      "Enter password (8+ chars with letters, numbers, symbols)",
      ""
    );
    if (!requestedPassword) {
      return;
    }

    const confirmPassword = window.prompt("Confirm password", "");
    if (!confirmPassword) {
      return;
    }

    if (requestedPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsRequestingAccess(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/access-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: requestedUserName.trim(),
          email: requestedEmail.trim(),
          password: requestedPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data.message || "Failed to submit access request");
        return;
      }

      window.alert(
        data.message || "Request submitted. Wait until the main admin approves your access."
      );
    } catch (_error) {
      setErrorMessage("Cannot connect to server. Please try again.");
    } finally {
      setIsRequestingAccess(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ff-body">
        <div className="ff-card">
          {/* LEFT PANEL */}
          <div className="ff-left">
            <div className="ff-logo">
              <img src={logoImage} alt="Logo" className="ff-logo-image" />
              <div>
                <div className="ff-logo-name">FORCEFIT</div>
                <div className="ff-logo-sub">Management System</div>
              </div>
            </div>

            <div className="ff-hero">
              <h1>
                ADMIN
                <br />
                <em>CONTROL</em>
                <br />
                CENTER
              </h1>
              <div className="ff-divider" />
              <p>
                Manage members, Manage Tainers, Manage Payments, and Manage
                operations — all from one dashboard.
              </p>
            </div>

            <div className="ff-stats">
              <div>
                <div className="ff-stat-num">1,240</div>
                <div className="ff-stat-label">Members</div>
              </div>
              <div>
                <div className="ff-stat-num">48</div>
                <div className="ff-stat-label">Classes/Mo</div>
              </div>
              <div>
                <div className="ff-stat-num">12</div>
                <div className="ff-stat-label">Trainers</div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="ff-right">
            <div className="ff-access-label">Admin Access</div>

            <div className="ff-welcome">
              <h2>
                WELCOME
                <br />
                <em>Back.</em>
              </h2>
              <p>Sign in to access the dashboard</p>
            </div>

            <div className="ff-field-label">User Name</div>
            <div className="ff-input-wrap">
              <span className="ff-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 19C5.83251 16.6696 8.13616 15 12 15C15.8638 15 18.1675 16.6696 19 19"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Enter your user name"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
              />
            </div>

            <div className="ff-field-label">Password</div>
            <div className="ff-input-wrap">
              <span className="ff-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M7 10V7.5C7 4.73858 9.23858 2.5 12 2.5C14.7614 2.5 17 4.73858 17 7.5V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="11"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M12 14V17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
              />
              <button
                className="ff-show-btn"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <div className="ff-row">
              <label className="ff-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button
                className="ff-forgot"
                type="button"
                onClick={handleForgotPassword}
                disabled={isProcessingReset}
              >
                {isProcessingReset ? "PROCESSING..." : "FORGOT PASSWORD"}
              </button>
            </div>

            <button className="ff-sign-in-btn" onClick={handleSignIn} disabled={isSigningIn}>
              {isSigningIn ? "SIGNING IN..." : "→ SIGN IN"}
            </button>

            {errorMessage && (
              <div
                style={{
                  marginTop: 10,
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                {errorMessage}
              </div>
            )}

            <div className="ff-or-row">
              <div className="ff-or-line" />
              <div className="ff-or-text">OR</div>
              <div className="ff-or-line" />
            </div>

            <div className="ff-request">
              New admin?{" "}
              <button
                className="ff-request-link"
                type="button"
                onClick={handleRequestAccess}
                disabled={isRequestingAccess}
              >
                {isRequestingAccess ? "Submitting..." : "Request Access →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}