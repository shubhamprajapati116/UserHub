/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./applayout.css";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import apirequest from "../../api/apirequest";
const NavIcon = ({ name }) => {
  const icons = {
    users: (
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    profile: (
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
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    settings: (
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    logout: (
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
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };
  return icons[name] || null;
};

function AppLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userStore } = useStore();
  const currentUser = userStore.currentUser;

  const role = currentUser?.role;
  const userName = currentUser?.name || "";
  const userPhoto = currentUser?.profilephoto || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const navItems = [
    ...(role === "admin"
      ? [{ label: "Admin Panel", path: "/admin/users", icon: "users" }]
      : []),
    { label: "My Profile", path: "/profile", icon: "profile" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);

    try {
      // Backend se session delete karo MongoDB me se (is device ka session remove hoga)
      await apirequest("/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch {
      // API fail hone par bhi local logout continue karega
    }

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    userStore.clearCurrentUser();

    toast.success("Logged out successfully");
    navigate("/login");
  };
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleNav = (path) => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">U</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">UserHub</span>
            <span className="sidebar-brand-tag">Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Menu</span>
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="sidebar-link-icon">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-content">
        <header className="top-header">
          <div className="top-header-left">
            <button
              type="button"
              className="menu-toggle btn-icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="top-header-page-info">
              {title && <h1 className="top-header-title">{title}</h1>}
              {subtitle && <p className="top-header-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="top-header-right">
            {role && <span className="top-header-role-badge">{role}</span>}

            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {userPhoto ? (
                  <img
                    className="user-menu-avatar"
                    src={`${import.meta.env.VITE_API_URL}/uploads/${userPhoto}`}
                    alt={userName}
                  />
                ) : (
                  <span className="user-menu-initials">{initials}</span>
                )}
                <span className="user-menu-name">{userName || "Account"}</span>
                <svg
                  className={`user-menu-chevron ${userMenuOpen ? "open" : ""}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-dropdown-header">
                    <span className="user-menu-dropdown-name">
                      {userName || "User"}
                    </span>
                    <span className="user-menu-dropdown-role">{role}</span>
                  </div>
                  <div className="user-menu-divider" />
                  <button type="button" onClick={() => handleNav("/profile")}>
                    <NavIcon name="profile" />
                    My Profile
                  </button>
                  <button type="button" onClick={() => handleNav("/settings")}>
                    <NavIcon name="settings" />
                    Settings
                  </button>
                  <div className="user-menu-divider" />
                  <button
                    type="button"
                    className="user-menu-logout"
                    onClick={handleLogout}
                  >
                    <NavIcon name="logout" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default observer(AppLayout);