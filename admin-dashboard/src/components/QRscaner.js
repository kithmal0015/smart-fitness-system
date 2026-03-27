import { useEffect, useRef, useState } from "react";

export default function QRscaner({ accent, isMobile }) {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [qrScanValue, setQrScanValue] = useState("");
  const [qrScanError, setQrScanError] = useState("");
  const videoRef = useRef(null);
  const scanFrameRef = useRef(null);
  const streamRef = useRef(null);

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

    const supportsBarcodeDetector =
      typeof window !== "undefined" &&
      "BarcodeDetector" in window &&
      navigator?.mediaDevices?.getUserMedia;

    if (!supportsBarcodeDetector) {
      setQrScanError("QR scanning is not supported on this browser.");
      setIsScannerActive(false);
      return () => {
      };
    }

    let detector;
    try {
      detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      setQrScanError("");
    } catch (_error) {
      setQrScanError("Failed to initialize QR scanner.");
      setIsScannerActive(false);
      return () => {
      };
    }

    const scanLoop = async () => {
      if (stopped) {
        return;
      }

      const videoElement = videoRef.current;
      if (videoElement && videoElement.readyState >= 2) {
        try {
          const barcodes = await detector.detect(videoElement);
          if (barcodes.length > 0) {
            const rawValue = String(barcodes[0]?.rawValue || "").trim();
            if (rawValue) {
              setQrScanValue(rawValue);
              setIsScannerActive(false);
              return;
            }
          }
        } catch (_error) {
        }
      }

      scanFrameRef.current = requestAnimationFrame(scanLoop);
    };

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

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
      } catch (_error) {
        setQrScanError("Camera permission denied or camera unavailable.");
        setIsScannerActive(false);
      }
    };

    startScanner();

    return () => {
      stopped = true;
      if (scanFrameRef.current) {
        cancelAnimationFrame(scanFrameRef.current);
        scanFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isScannerActive]);

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
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
            {qrScanValue ? (
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "3px 7px", borderRadius: 8 }}>
                Scanned: {qrScanValue}
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
            setQrScanValue("");
            setIsScannerActive(true);
          }}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "5px 10px",
            background: accent,
            color: "#2d3a00",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {isScannerActive ? "Stop Scanner" : "Start Scanner"}
        </button>
        <div style={{ fontSize: 10.5, color: "#64748b" }}>Status: {isScannerActive ? "scanning" : "idle"}</div>
      </div>
    </div>
  );
}
