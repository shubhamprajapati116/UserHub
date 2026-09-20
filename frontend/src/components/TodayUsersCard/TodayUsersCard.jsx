import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import "./TodayUsersCard.css";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #0ea5e9, #06b6d4)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ec4899, #d946ef)",
  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
];

function isPlaceholderPhoto(photo) {
  if (!photo) return true;
  const p = String(photo).trim().toLowerCase();
  return (
    p === "" ||
    p === "null" ||
    p === "undefined" ||
    p === "false" ||
    p === "default.png" ||
    p === "placeholder.png"
  );
}

function getPhotoUrl(photo) {
  if (!photo) return "";
  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("data:") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const cleanPath = photo.startsWith("/")
    ? photo
    : `/${photo.startsWith("uploads/") ? photo : `uploads/${photo}`}`;
  return `${apiUrl}${cleanPath}`;
}

function getAvatarBg(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TodayUserAvatar({ user, displayName }) {
  const [hasError, setHasError] = useState(false);
  const photo = user?.profilephoto || user?.profileImage;

  const showRealPhoto = photo && !isPlaceholderPhoto(photo) && !hasError;

  if (showRealPhoto) {
    return (
      <img
        src={getPhotoUrl(photo)}
        alt={displayName}
        className="today-user-avatar-img"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className="today-user-avatar-initials"
      style={{ background: getAvatarBg(displayName) }}
    >
      {getInitials(displayName)}
    </div>
  );
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return "Just now";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Just now";
  const now = new Date();
  const diffSecs = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TodayUsersCard() {
  const { userStore } = useStore();
  const currentUser = userStore.currentUser;
  const rawTodayUsers = userStore.todayUsers || [];
  const loading = userStore.loading.fetchTodayUsers && rawTodayUsers.length === 0;

  useEffect(() => {
    userStore.fetchTodayUsers();
  }, [userStore]);

  // Ensure ONLY users registered today are displayed
  const todayStr = new Date().toDateString();

  const filteredUsers = rawTodayUsers.filter((u) => {
    if (!u.createdAt) return false;
    return new Date(u.createdAt).toDateString() === todayStr;
  });

  // Include currentUser if registered today and not yet in list
  if (
    currentUser?.createdAt &&
    new Date(currentUser.createdAt).toDateString() === todayStr
  ) {
    const exists = filteredUsers.some(
      (u) =>
        (u._id && currentUser._id && u._id === currentUser._id) ||
        (u.email && currentUser.email && u.email === currentUser.email)
    );
    if (!exists) {
      filteredUsers.unshift(currentUser);
    }
  }

  // Sort descending by registration time (newest on top)
  filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="today-users-card">
      {/* ── Card Header ── */}
      <div className="today-users-header">
        <div className="today-header-left">
          <h3 className="today-users-title">Today's Registered Users</h3>
        </div>
        <span className="today-users-count-pill">
          <span className="today-live-dot"></span>
          {filteredUsers.length} today
        </span>
      </div>

      {/* ── Card Body / Users List ── */}
      <div className="today-users-body">
        {loading ? (
          <div className="today-users-skeleton-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="today-user-skeleton-row" key={i}>
                <div className="skeleton-circle"></div>
                <div className="skeleton-info">
                  <div className="skeleton-line name-line"></div>
                  <div className="skeleton-line tag-line"></div>
                </div>
                <div className="skeleton-time"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="today-users-empty">
            <div className="today-empty-icon-wrap">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h4 className="today-empty-title">No registrations yet today</h4>
            <p className="today-empty-desc">
              New accounts registered today will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="today-users-list">
            {filteredUsers.map((user, idx) => {
              const displayName = user.name || user.email?.split("@")[0] || "User";
              const roleName = user.role === "admin" ? "Admin" : "User";
              const timeStr = formatRelativeTime(user.createdAt);

              return (
                <div
                  className="today-user-row"
                  key={user._id || `${user.email}-${idx}`}
                >
                  {/* User Avatar */}
                  <div className="today-user-avatar-wrap">
                    <TodayUserAvatar user={user} displayName={displayName} />
                  </div>

                  {/* User Name & Role Pill */}
                  <div className="today-user-meta">
                    <span className="today-user-name" title={displayName}>
                      {displayName}
                    </span>
                    <span
                      className={`today-role-badge role-${user.role || "user"}`}
                    >
                      {roleName}
                    </span>
                  </div>

                  {/* Relative Timestamp */}
                  <span className="today-user-timestamp">{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default observer(TodayUsersCard);
