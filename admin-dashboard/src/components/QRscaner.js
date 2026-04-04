import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "ff_admin_token";

function getAdminToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export default function QRscaner({ accent, isMobile }) {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [qrScanError, setQrScanError] = useState("");
  const [scanSummary, setScanSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const scanFrameRef = useRef(null);
  const streamRef = useRef(null);
  const scanCanvasRef = useRef(null);
  const lastScanMetaRef = useRef({ value: "", at: 0 });
  const summaryTimerRef = useRef(null);

  const showTemporarySummary = (message) => {
    if (summaryTimerRef.current) {
      clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = null;
    }

    setScanSummary(message);
    summaryTimerRef.current = setTimeout(() => {
      setScanSummary("");
      summaryTimerRef.current = null;
    }, 1000);
  };

  const canProcessScan = (rawValue) => {
    const now = Date.now();
    const lastValue = String(lastScanMetaRef.current.value || "");
    const lastAt = Number(lastScanMetaRef.current.at || 0);
    const sameValue = lastValue === rawValue;

    if (sameValue && now - lastAt < 2500) {
      return false;
    }

    lastScanMetaRef.current = { value: rawValue, at: now };
    return true;
  };

  const handleDetectedQr = async (rawValue) => {
    const token = getAdminToken();
    if (!token) {
      setQrScanError("Admin session expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setScanSummary("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/attendance/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrValue: rawValue }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fallbackMessage =
          response.status === 401 || response.status === 403
            ? "Admin session expired. Please sign in again."
            : response.status === 404
              ? "Attendance scan API not found. Please restart backend server."
              : "Failed to process QR scan";

        throw new Error(String(result?.message || fallbackMessage));
      }

      const item = result?.item || {};
      const memberName = String(item.memberName || "Member");
      const status = String(item.status || "");
      const event = String(result?.event || "");
      const eventLabel = event === "present" ? "IN" : event === "leave" ? "OUT" : "CLOSED";
      showTemporarySummary(`Scan Succeeded ✅ | ${memberName} | ${eventLabel} | ${status || "Updated"}`);
      setQrScanError("");
    } catch (error) {
      setQrScanError(String(error?.message || "Failed to process QR scan"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let stopped = false;

    if (!isScannerActive) {
      if (scanFrameRef.current) {
        cancelAnimationFrame(scanFrameRef.current);
        scanFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return () => {
      };
    }

    const supportsCamera = Boolean(navigator?.mediaDevices?.getUserMedia);
    const supportsBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

    if (!supportsCamera) {
      setQrScanError("Camera is not supported on this browser.");
      setIsScannerActive(false);
      return () => {
      };
    }

    let detector = null;
    if (supportsBarcodeDetector) {
      try {
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch (_error) {
        detector = null;
      }
    }
    setQrScanError("");

    const scanLoop = async () => {
      if (stopped) {
        return;
      }

      const videoElement = videoRef.current;
      if (videoElement && videoElement.readyState >= 2) {
        try {
          if (detector) {
            const barcodes = await detector.detect(videoElement);
            if (barcodes.length > 0) {
              const rawValue = String(barcodes[0]?.rawValue || "").trim();
              if (rawValue) {
                if (!isSubmitting && canProcessScan(rawValue)) {
                  handleDetectedQr(rawValue);
                }
                return;
              }
            }
          } else {
            if (!scanCanvasRef.current) {
              scanCanvasRef.current = document.createElement("canvas");
            }

            const canvas = scanCanvasRef.current;
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;

            if (canvas && width > 0 && height > 0) {
              canvas.width = width;
              canvas.height = height;

              const context = canvas.getContext("2d", { willReadFrequently: true });
              if (context) {
                context.drawImage(videoElement, 0, 0, width, height);
                const imageData = context.getImageData(0, 0, width, height);
                const code = jsQR(imageData.data, width, height);

                if (code?.data) {
                  const rawValue = String(code.data).trim();
                  if (rawValue) {
                    if (!isSubmitting && canProcessScan(rawValue)) {
                      handleDetectedQr(rawValue);
                    }
                    return;
                  }
                }
              }
            }
          }
        } catch (_error) {
        }
      }

      scanFrameRef.current = requestAnimationFrame(scanLoop);
    };

    const startScanner = async () => {
      const cameraConstraints = isMobile
        ? [
            { video: { facingMode: { exact: "environment" } }, audio: false },
            { video: { facingMode: "environment" }, audio: false },
            { video: { facingMode: "user" }, audio: false },
            { video: true, audio: false },
          ]
        : [
            { video: { facingMode: { exact: "user" } }, audio: false },
            { video: { facingMode: "user" }, audio: false },
            { video: true, audio: false },
            { video: { facingMode: "environment" }, audio: false },
          ];

      let stream = null;
      let lastError = null;

      for (const constraints of cameraConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) {
            break;
          }
        } catch (error) {
          lastError = error;
        }
      }

      try {
        if (!stream) {
          throw lastError || new Error("Unable to access camera");
        }

        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const videoElement = videoRef.current;
        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play().catch(() => {
          });
        }

        scanFrameRef.current = requestAnimationFrame(scanLoop);
      } catch (error) {
        const errorName = String(error?.name || "");
        if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
          setQrScanError("Camera permission denied. Please allow camera access and try again.");
        } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
          setQrScanError("No camera device found on this system.");
        } else {
          setQrScanError("Camera unavailable. Close other apps using the camera and try again.");
        }
        setIsScannerActive(false);
      }
    };

    startScanner();

    return () => {
      stopped = true;
      if (summaryTimerRef.current) {
        clearTimeout(summaryTimerRef.current);
        summaryTimerRef.current = null;
      }
      if (scanFrameRef.current) {
        cancelAnimationFrame(scanFrameRef.current);
        scanFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      scanCanvasRef.current = null;
    };
  }, [isScannerActive, isMobile]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", lineHeight: 1, marginBottom: 10 }}>
        QR Scaner
        </div>

        <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 10 }}>
        Daily participation count for the current month 
        </div>
      
      <div
        style={{
          border: "1.5px dashed #b6bec9",
          borderRadius: 10,
          background: "#f8fafc",
          flex: 1,
          minHeight: isMobile ? 180 : 232,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isScannerActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {scanSummary ? (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#0c4a6e",
                  background: "#e0f2fe",
                  padding: "4px 8px",
                  borderRadius: 8,
                  maxWidth: "95%",
                }}
              >
                {scanSummary}
              </div>
            ) : null}
            {qrScanError ? (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  bottom: 10,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#991b1b",
                  background: "#fee2e2",
                  padding: "4px 8px",
                  borderRadius: 8,
                  maxWidth: "95%",
                }}
              >
                {qrScanError}
              </div>
            ) : null}
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              color: "#64748b",
              fontSize: 11,
              textAlign: "center",
              padding: "10px",
            }}
          >
            <div>Camera preview will appear here</div>
            {scanSummary ? (
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0c4a6e", background: "#e0f2fe", padding: "3px 7px", borderRadius: 8 }}>
                {scanSummary}
              </div>
            ) : null}
            {qrScanError ? (
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#991b1b", background: "#fee2e2", padding: "3px 7px", borderRadius: 8 }}>
                {qrScanError}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            if (isScannerActive) {
              setIsScannerActive(false);
              return;
            }
            setQrScanError("");
            setScanSummary("");
            setIsScannerActive(true);
          }}
          disabled={isSubmitting}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "5px 10px",
            background: accent,
            color: "#2d3a00",
            fontSize: 11,
            fontWeight: 800,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.65 : 1,
            fontFamily: "inherit",
          }}
        >
          {isSubmitting ? "Saving..." : isScannerActive ? "Stop Scanner" : "Start Scanner"}
        </button>
        <div style={{ fontSize: 10.5, color: "#64748b" }}>Status: {isScannerActive ? "scanning" : "idle"}</div>
      </div>
    </div>
  );
}
