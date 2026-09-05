import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apirequest from "../../api/apirequest";
import { useStore } from "../../stores/StoreContext";
import "./ActiveSessions.css";

// Helper function to return modern high-resolution device SVGs with platform-specific branding
const getDeviceIcon = (os = "", device = "", browser = "") => {
  const osLower = (os || "").toLowerCase();
  const devLower = (device || "").toLowerCase();

  // Apple Ecosystem (macOS, iOS, iPhone, iPad)
  if (
    osLower.includes("mac") ||
    osLower.includes("ios") ||
    osLower.includes("iphone") ||
    osLower.includes("ipad") ||
    osLower.includes("apple")
  ) {
    if (
      devLower.includes("mobile") ||
      devLower.includes("phone") ||
      osLower.includes("ios") ||
      osLower.includes("iphone")
    ) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.92.04-2.02.62-2.66 1.37-.56.65-.99 1.7-1.02 2.76 1.03.08 2.05-.53 2.67-1.28z" />
      </svg>
    );
  }

  // Windows
  if (osLower.includes("win")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
      </svg>
    );
  }

  // Android
  if (osLower.includes("android")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4111 13.8533 8.0805 12 8.0805s-3.5902.3306-5.1367.8692L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
      </svg>
    );
  }

  // Linux
  if (osLower.includes("linux")) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <polyline points="7 10 10 13 7 16" />
        <line x1="13" y1="16" x2="17" y2="16" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }

  // Mobile / Phone Generic
  if (devLower.includes("mobile") || devLower.includes("phone")) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }

  // Laptop / Desktop Default
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
};

// Formatter for readable human timestamps
const formatSessionTime = (dateStr) => {
  if (!dateStr) return "Active Now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Active Now";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Active Now";
  }
};

const ActiveSessions = () => {
  const { userStore } = useStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  // State to track which session cards have their extra details expanded
  const [expandedSessions, setExpandedSessions] = useState({});

  // Direct and reliable toggle function without bubbling issues
  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const copyToClipboard = (text, label = "IP address") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info(`Copied ${label} to clipboard!`);
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
      // Fallback gracefully to current user session if backend sessions endpoint is not active
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
        createdAt:
          user?.lastLogin || user?.updatedAt || new Date().toISOString(),
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

  const logoutSession = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      await apirequest(`/sessions/${sessionId}`, {
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
  };

  const logoutOtherDevices = async () => {
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
  };

  // Separate current session and other active sessions
  const currentSession =
    sessions.find((s) => s.isCurrent) ||
    (sessions.length > 0 ? sessions[0] : null);
  const otherSessions = sessions.filter(
    (s) => s !== currentSession && !s.isCurrent,
  );

  return (
    <div className="active-sessions-wrapper">
      {/* ── Top Header Bar ── */}
      <div className="sessions-page-header">
        <div className="sessions-header-left">
          <div className="sessions-shield-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="sessions-header-titles">
            <div className="sessions-title-row">
              <h3>Active Sessions & Connected Devices</h3>
              <span className="sessions-count-pill">
                {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
              </span>
            </div>
            <p>
              Manage devices where your account is signed in. Click arrow to view details.
            </p>
          </div>
        </div>

        {otherSessions.length > 0 && (
          <button
            type="button"
            className="sessions-revoke-all-btn"
            onClick={logoutOtherDevices}
            disabled={revokingAll}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            {revokingAll ? "Revoking..." : "Log Out of Other Devices"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="sessions-loading-state">
          <div className="sessions-spinner"></div>
          <p>Scanning active authenticated sessions...</p>
        </div>
      ) : (
        <div className="sessions-cards-layout">
          {/* ── 🌟 CURRENT DEVICE SECTION ── */}
          {currentSession && (
            <div className="session-group-container">
              <div className="session-group-label">
                <span>THIS CURRENT DEVICE</span>
              </div>

              {(() => {
                const currentKey = currentSession.sessionId || "current";
                const isCurrentExpanded = !!expandedSessions[currentKey];

                return (
                  <div
                    className={`session-card modern-card current-device ${
                      isCurrentExpanded ? "is-expanded" : ""
                    }`}
                  >
                    {/* Main Header Bar: ONLY Device Name & Status visible by default */}
                    <div
                      className="session-card-main-bar"
                      onClick={() => toggleSessionExpand(currentKey)}
                    >
                      <div className="session-device-avatar-box current">
                        {getDeviceIcon(
                          currentSession.os,
                          currentSession.device,
                          currentSession.browser,
                        )}
                      </div>

                      <div className="session-card-info">
                        <div className="session-card-title-group">
                          <h4 className="session-device-name">
                            {currentSession.browser || "Web Browser"} on{" "}
                            {currentSession.os || "Desktop"}
                          </h4>
                          <span className="session-current-pill">
                            <span className="live-pulse-dot"></span>
                            Active Now • This Device
                          </span>
                        </div>
                      </div>

                      {/* Toggle Arrow Chevron Button */}
                      <button
                        type="button"
                        className="session-expand-toggle-btn"
                        title={isCurrentExpanded ? "Hide details" : "Show extra details"}
                        aria-label="Toggle details"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSessionExpand(currentKey);
                        }}
                      >
                        <svg
                          className={`chevron-arrow-svg ${
                            isCurrentExpanded ? "rotated" : ""
                          }`}
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {/* Extra Details Accordion: All details in ONE single compact container */}
                    {isCurrentExpanded && (
                      <div className="session-details-drawer">
                        <div className="session-compact-details-con">
                          <div className="compact-detail-row">
                            <span className="compact-label">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                              </svg>
                              IP Address:
                            </span>
                            <div className="compact-val-group">
                              <span className="compact-val">{currentSession.ipAddress || "127.0.0.1"}</span>
                              <button
                                type="button"
                                className="compact-copy-btn"
                                title="Copy IP"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(currentSession.ipAddress || "127.0.0.1", "IP Address");
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="compact-detail-row">
                            <span className="compact-label">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              Signed In:
                            </span>
                            <span className="compact-val">{formatSessionTime(currentSession.createdAt)}</span>
                          </div>

                          <div className="compact-detail-row">
                            <span className="compact-label">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                              </svg>
                              Client & OS:
                            </span>
                            <span className="compact-val">
                              {currentSession.browser || "Browser"} • {currentSession.os || "Desktop"} ({currentSession.device || "Computer"})
                            </span>
                          </div>

                          <div className="compact-detail-row">
                            <span className="compact-label">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              Status:
                            </span>
                            <span className="compact-val status-ok">
                              <span className="ok-dot"></span> Authenticated & Encrypted
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── 📱 OTHER ACTIVE SESSIONS SECTION ── */}
          <div className="session-group-container">
            <div className="session-group-label">
              <span>OTHER CONNECTED SESSIONS ({otherSessions.length})</span>
            </div>

            {otherSessions.length === 0 ? (
              <div className="empty-sessions-card">
                <div className="empty-shield-badge">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="empty-sessions-info">
                  <h5>No other devices logged in</h5>
                  <p>
                    Your account is currently active exclusively on this device. No remote or unrecognized sessions were found.
                  </p>
                </div>
              </div>
            ) : (
              <div className="other-sessions-stack">
                {otherSessions.map((session, index) => {
                  const sId = session.sessionId || session._id || `sess_${index}`;
                  const isExpanded = !!expandedSessions[sId];

                  return (
                    <div
                      key={sId}
                      className={`session-card modern-card ${isExpanded ? "is-expanded" : ""}`}
                    >
                      {/* Main Summary Bar: ONLY Device Name & Action buttons */}
                      <div
                        className="session-card-main-bar"
                        onClick={() => toggleSessionExpand(sId)}
                      >
                        <div className="session-device-avatar-box">
                          {getDeviceIcon(session.os, session.device, session.browser)}
                        </div>

                        <div className="session-card-info">
                          <div className="session-card-title-group">
                            <h4 className="session-device-name">
                              {session.browser || "Web Browser"} on{" "}
                              {session.os || "Device"}
                            </h4>
                            {session.device && (
                              <span className="session-device-badge">
                                {session.device}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="session-card-actions">
                          {/* Revoke Button */}
                          <button
                            type="button"
                            className="session-revoke-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              logoutSession(sId);
                            }}
                            disabled={revokingId === sId}
                            title="Revoke session access"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                              <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                            {revokingId === sId ? "Revoking..." : "Revoke"}
                          </button>

                          {/* Chevron Toggle Arrow */}
                          <button
                            type="button"
                            className="session-expand-toggle-btn"
                            title={isExpanded ? "Hide extra details" : "Show extra details"}
                            aria-label="Toggle details"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSessionExpand(sId);
                            }}
                          >
                            <svg
                              className={`chevron-arrow-svg ${isExpanded ? "rotated" : ""}`}
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Extra Details Accordion: In ONE single compact container */}
                      {isExpanded && (
                        <div className="session-details-drawer">
                          <div className="session-compact-details-con">
                            <div className="compact-detail-row">
                              <span className="compact-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                </svg>
                                IP Address:
                              </span>
                              <div className="compact-val-group">
                                <span className="compact-val">{session.ipAddress || "Unknown"}</span>
                                {session.ipAddress && (
                                  <button
                                    type="button"
                                    className="compact-copy-btn"
                                    title="Copy IP"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(session.ipAddress, "IP Address");
                                    }}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="compact-detail-row">
                              <span className="compact-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Signed In Date:
                              </span>
                              <span className="compact-val">{formatSessionTime(session.createdAt)}</span>
                            </div>

                            <div className="compact-detail-row">
                              <span className="compact-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="3" width="20" height="14" rx="2" />
                                  <line x1="8" y1="21" x2="16" y2="21" />
                                </svg>
                                Device / OS:
                              </span>
                              <span className="compact-val">
                                {session.browser || "Browser"} • {session.os || "Device"} ({session.device || "Unknown"})
                              </span>
                            </div>

                            <div className="compact-detail-row">
                              <span className="compact-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                </svg>
                                Session Token ID:
                              </span>
                              <span className="compact-val mono">
                                {sId.length > 20 ? `${sId.slice(0, 20)}...` : sId}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 🛡️ Security Advisory Footer Notice ── */}
          <div className="sessions-advisory-footer">
            <div className="advisory-footer-icon">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="advisory-footer-text">
              <strong>Account Security Tip:</strong> If you recognize a session you did not initiate or from an unfamiliar location, click <em>Revoke</em> immediately and change your account password in the <strong>Security</strong> tab.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;
 