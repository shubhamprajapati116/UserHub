import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apirequest from "../../api/apirequest";
import { useStore } from "../../stores/StoreContext";
import "./ActiveSessions.css";

// Helper for device & OS brand icons
const getDeviceBrandIcon = (os = "", device = "") => {
  const osLower = (os || "").toLowerCase();
  const devLower = (device || "").toLowerCase();

  // Apple Ecosystem
  if (
    osLower.includes("mac") ||
    osLower.includes("ios") ||
    osLower.includes("iphone") ||
    osLower.includes("ipad") ||
    osLower.includes("apple")
  ) {
    if (devLower.includes("mobile") || devLower.includes("phone") || osLower.includes("ios")) {
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    }
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.92.04-2.02.62-2.66 1.37-.56.65-.99 1.7-1.02 2.76 1.03.08 2.05-.53 2.67-1.28z" />
      </svg>
    );
  }

  // Windows
  if (osLower.includes("win")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
      </svg>
    );
  }

  // Android
  if (osLower.includes("android")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4111 13.8533 8.0805 12 8.0805s-3.5902.3306-5.1367.8692L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
      </svg>
    );
  }

  // Linux
  if (osLower.includes("linux")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <polyline points="7 10 10 13 7 16" />
        <line x1="13" y1="16" x2="17" y2="16" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }

  // Default Computer / Laptop
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
};

// Relative time helper
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "Active now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Active now";
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Active now";
  }
};

const ActiveSessions = ({ onNavigateSecurity }) => {
  const { userStore } = useStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Revocation Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "single", // 'single' | 'all'
    targetSession: null,
  });

  const copyToClipboard = (text, keyName, label = "IP") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.info(`Copied ${label} to clipboard!`, { autoClose: 1500 });
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyName ? null : prev));
    }, 2000);
  };

  const fetchSessions = async () => {
    try {
      const res = await apirequest("/sessions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (Array.isArray(res)) {
        setSessions(res);
      } else if (res && res.sessions) {
        setSessions(res.sessions);
      } else {
        setSessions([]);
      }
    } catch {
      const user = userStore.currentUser;
      const fallbackSession = {
        sessionId: "current",
        device: "Desktop",
        browser: navigator.userAgent.includes("Chrome")
          ? "Chrome"
          : navigator.userAgent.includes("Firefox")
            ? "Firefox"
            : navigator.userAgent.includes("Safari")
              ? "Safari"
              : navigator.userAgent.includes("Edge")
                ? "Edge"
                : "Web Browser",
        os: navigator.userAgent.includes("Windows")
          ? "Windows"
          : navigator.userAgent.includes("Mac")
            ? "macOS"
            : navigator.userAgent.includes("Android")
              ? "Android"
              : navigator.userAgent.includes("iPhone")
                ? "iOS"
                : "Desktop",
        ipAddress: user?.lastDeviceInfo?.ip || "127.0.0.1",
        createdAt: user?.lastLogin || user?.updatedAt || new Date().toISOString(),
        isCurrent: true,
      };
      setSessions([fallbackSession]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const handleFocus = () => fetchSessions();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: "single",
      targetSession: null,
    });
  };

  const executeRevoke = async () => {
    if (confirmModal.type === "single" && confirmModal.targetSession) {
      const sId =
        confirmModal.targetSession.sessionId || confirmModal.targetSession._id;
      closeConfirmModal();
      try {
        setRevokingId(sId);
        await apirequest(`/sessions/${sId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("Session revoked successfully");
        await fetchSessions();
      } catch (error) {
        toast.error(error?.message || "Unable to revoke session");
      } finally {
        setRevokingId(null);
      }
    } else if (confirmModal.type === "all") {
      closeConfirmModal();
      try {
        setRevokingAll(true);
        await apirequest("/sessions/logout-others", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("All other sessions logged out successfully");
        await fetchSessions();
      } catch (error) {
        toast.error(error?.message || "Cleared other active sessions");
      } finally {
        setRevokingAll(false);
      }
    }
  };

  const currentSession =
    sessions.find((s) => s.isCurrent) ||
    (sessions.length > 0 ? sessions[0] : null);
  const otherSessions = sessions.filter(
    (s) => s !== currentSession && !s.isCurrent,
  );

  return (
    <div className="compact-sessions-panel">
      {/* ── Header ── */}
      <div className="compact-sessions-header">
        <div className="compact-header-info">
          <div className="compact-header-title-row">
            <h4>Where You're Signed In</h4>
            <span className="compact-count-badge">
              {sessions.length} {sessions.length === 1 ? "Device" : "Devices"}
            </span>
          </div>
          <p>Devices and browsers currently logged into your account.</p>
        </div>

        {otherSessions.length > 0 && (
          <button
            type="button"
            className="compact-logout-others-btn"
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                type: "all",
                targetSession: null,
              })
            }
            disabled={revokingAll}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <span>{revokingAll ? "Logging out..." : "Log Out Other Devices"}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="compact-loading-row">
          <div className="compact-spinner"></div>
          <span>Checking signed-in devices...</span>
        </div>
      ) : (
        <div className="compact-devices-container">
          {/* ── Current Device Row (GitHub/Google Style) ── */}
          {currentSession && (
            <div className="compact-device-row current">
              <div className="compact-device-left">
                <div className="compact-avatar-box current">
                  {getDeviceBrandIcon(currentSession.os, currentSession.device)}
                </div>
                <div className="compact-device-titles">
                  <div className="compact-name-line">
                    <span className="compact-browser-name">
                      {currentSession.browser || "Browser"} on {currentSession.os || "Desktop"}
                    </span>
                    <span className="compact-current-pill">
                      <span className="compact-green-dot"></span>
                      This Device
                    </span>
                  </div>
                  <div className="compact-sub-meta">
                    <span className="compact-ip-code">
                      {currentSession.ipAddress || "127.0.0.1"}
                    </span>
                    <button
                      type="button"
                      className={`compact-copy-btn ${copiedKey === "current_ip" ? "copied" : ""}`}
                      title="Copy IP"
                      onClick={() =>
                        copyToClipboard(
                          currentSession.ipAddress || "127.0.0.1",
                          "current_ip",
                          "IP Address",
                        )
                      }
                    >
                      {copiedKey === "current_ip" ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    <span className="compact-meta-separator">•</span>
                    <span className="compact-time-text">
                      {formatRelativeTime(currentSession.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="compact-device-right">
                <span className="compact-verified-badge" title="Authenticated session">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Active
                </span>
              </div>
            </div>
          )}

          {/* ── Other Connected Sessions ── */}
          {otherSessions.map((session, index) => {
            const sId = session.sessionId || session._id || `sess_${index}`;
            const isRevoking = revokingId === sId;

            return (
              <div key={sId} className="compact-device-row">
                <div className="compact-device-left">
                  <div className="compact-avatar-box">
                    {getDeviceBrandIcon(session.os, session.device)}
                  </div>
                  <div className="compact-device-titles">
                    <div className="compact-name-line">
                      <span className="compact-browser-name">
                        {session.browser || "Browser"} on {session.os || "Device"}
                      </span>
                    </div>
                    <div className="compact-sub-meta">
                      <span className="compact-ip-code">
                        {session.ipAddress || "Unknown"}
                      </span>
                      <button
                        type="button"
                        className={`compact-copy-btn ${copiedKey === sId ? "copied" : ""}`}
                        title="Copy IP"
                        onClick={() =>
                          copyToClipboard(
                            session.ipAddress || "Unknown",
                            sId,
                            "IP Address",
                          )
                        }
                      >
                        {copiedKey === sId ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                      <span className="compact-meta-separator">•</span>
                      <span className="compact-time-text">
                        {formatRelativeTime(session.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="compact-device-right">
                  <button
                    type="button"
                    className="compact-revoke-btn"
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        type: "single",
                        targetSession: session,
                      })
                    }
                    disabled={isRevoking}
                    title="Log out this device"
                  >
                    {isRevoking ? "Logging out..." : "Log Out"}
                  </button>
                </div>
              </div>
            );
          })}

          {/* ── Empty State for Other Sessions ── */}
          {otherSessions.length === 0 && (
            <div className="compact-empty-state">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>You're not signed in on any other devices.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal.isOpen && (
        <div className="compact-modal-overlay" onClick={closeConfirmModal}>
          <div
            className="compact-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="compact-modal-content">
              <h5>
                {confirmModal.type === "all"
                  ? "Log out of all other devices?"
                  : "Log out this device?"}
              </h5>
              <p>
                {confirmModal.type === "all"
                  ? "This will log your account out of all other phones, tablets, and computers. You will stay signed in on this device."
                  : `This will log out your account from ${
                      confirmModal.targetSession?.browser || "this browser"
                    } on ${
                      confirmModal.targetSession?.os || "this device"
                    }. You will need to sign in again to use it.`}
              </p>
            </div>
            <div className="compact-modal-actions">
              <button
                type="button"
                className="compact-modal-btn cancel"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="compact-modal-btn confirm"
                onClick={executeRevoke}
              >
                {confirmModal.type === "all" ? "Log Out Others" : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;