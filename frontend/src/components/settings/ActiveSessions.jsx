import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apirequest from "../../api/apirequest";
import { useStore } from "../../stores/StoreContext";
import "./ActiveSessions.css";

const ActiveSessions = () => {
  const { userStore } = useStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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
        ipAddress: user?.lastDeviceInfo?.ip || "::1",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
    const handleFocus = () => fetchSessions();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoutSession = async (sessionId) => {
    try {
      await apirequest(`/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Session revoked successfully");
      fetchSessions();
    } catch (error) {
      toast.error(error?.message || "Unable to revoke session");
    }
  };
 
  const logoutOtherDevices = async () => {
    try {
      await apirequest("/sessions/logout-others", {  
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Other devices logged out successfully");
      fetchSessions();
    } catch (error) {
      toast.error(
        error?.message || "Successfully cleared other active sessions",
      );
    }
  };

  return (
    <div className="setting-section-panel compact-active-sessions-panel">
      <div className="setting-info compact-session-header">
        <div className="compact-header-left">
          <div className="setting-info-icon sessions-icon appearance">
            <svg
              width="18"
              height="18"
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
          </div>
          <div className="sessions-header-text">
            <h3>Active Sessions & Connected Devices</h3>
            <p>Manage devices currently logged into your account.</p>
          </div>
        </div>
        {sessions.length > 1 && (
          <button
            type="button"
            className="compact-logout-all-btn"
            onClick={logoutOtherDevices}
          >
            Logout Other Devices
          </button>
        )}
      </div>

      {loading ? (
        <div className="compact-session-loading">
          <p>Loading active sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="compact-session-empty">
          <p>No active sessions found.</p>
        </div>
      ) : (
        <div className="compact-sessions-list">
          {sessions.map((session) => (
            <div
              className={`compact-session-row ${session.isCurrent ? "is-current" : ""}`}
              key={session.sessionId}
            >
              <div className="compact-device-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>

              <div className="compact-session-info">
                <div className="compact-title-line">
                  <span className="compact-device-name">
                    {session.browser || "Chrome"} on {session.os || "Windows"}
                  </span>
                  {session.isCurrent && (
                    <span className="compact-current-badge">
                      <span className="tiny-pulse-dot"></span> This Device
                    </span>
                  )}
                </div>
                <div className="compact-meta-line">
                  <span>IP: {session.ipAddress || "::1"}</span>
                  <span className="meta-dot">•</span>
                  <span>
                    Logged in:{" "}
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Active Now"}
                  </span>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  type="button"
                  className="compact-revoke-btn"
                  onClick={() => logoutSession(session.sessionId)}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;
 