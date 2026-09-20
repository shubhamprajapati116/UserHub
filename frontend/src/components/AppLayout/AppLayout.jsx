/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./applayout.css";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import apirequest from "../../api/apirequest";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import NotificationDropdown from "./NotificationDropdown";

const NavIcon = ({ name }) => {
  const icons = {
    dashboard: (
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
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
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

function AppLayout({ children, title, subtitle, breadcrumbs }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userStore, themeStore } = useStore();
  const currentUser = userStore.currentUser;

  const role = currentUser?.role;
  const userName = currentUser?.name || "";
  const userPhoto = currentUser?.profilephoto || "";
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const userMenuRef = useRef(null);

  const isPlaceholderPhoto = (photo) => {
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
  };

  const navItems = [
    ...(role === "admin"
      ? [
          { label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" },
          { label: "User Management", path: "/admin/users", icon: "users" },
        ]
      : []),
    { label: "My Profile", path: "/profile", icon: "profile" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ];

  const isNavActive = (itemPath) => {
    if (location.pathname === itemPath) return true;
    if (itemPath === "/admin/users" && location.pathname.startsWith("/admin/users")) return true;
    if (itemPath === "/settings" && location.pathname.startsWith("/settings")) return true;
    if (itemPath === "/profile" && location.pathname.startsWith("/profile")) return true;
    return false;
  };

  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleScroll = (e) => {
      if (userMenuRef.current && userMenuRef.current.contains(e.target)) {
        return;
      }
      setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [userMenuOpen]);

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
      // Backend se session delete karo MongoDB me se
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
          <div className="sidebar-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="rgba(255, 255, 255, 0.2)" />
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="3" stroke="#ffffff" strokeWidth="2" />
              <path d="M7 18c.8-2.3 2.8-3.5 5-3.5s4.2 1.2 5 3.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">UserHub</span>
            <span className="sidebar-brand-tag">Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {role === "admin" && (
            <div className="sidebar-section">
              <span className="sidebar-nav-label">Admin Panel</span>
              <button
                type="button"
                className={`sidebar-link ${location.pathname === "/admin/dashboard" ? "active" : ""}`}
                onClick={() => handleNav("/admin/dashboard")}
              >
                <span className="sidebar-link-icon">
                  <NavIcon name="dashboard" />
                </span>
                <span className="sidebar-link-text">Dashboard</span>
              </button>
              <button
                type="button"
                className={`sidebar-link ${location.pathname.startsWith("/admin/users") ? "active" : ""}`}
                onClick={() => handleNav("/admin/users")}
              >
                <span className="sidebar-link-icon">
                  <NavIcon name="users" />
                </span>
                <span className="sidebar-link-text">User Management</span>
              </button>
            </div>
          )}

          <div className="sidebar-section">
            <span className="sidebar-nav-label">{role === "admin" ? "General" : "Menu"}</span>
            <button
              type="button"
              className={`sidebar-link ${location.pathname.startsWith("/profile") ? "active" : ""}`}
              onClick={() => handleNav("/profile")}
            >
              <span className="sidebar-link-icon">
                <NavIcon name="profile" />
              </span>
              <span className="sidebar-link-text">My Profile</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${location.pathname.startsWith("/settings") ? "active" : ""}`}
              onClick={() => handleNav("/settings")}
            >
              <span className="sidebar-link-icon">
                <NavIcon name="settings" />
              </span>
              <span className="sidebar-link-text">Settings</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="app-content">
        {/* Top Navbar Header - Clean & Focused */}
        <header className="top-header">
          <div className="top-header-left">
            <button
              type="button"
              className="menu-toggle btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
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

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {userPhoto && !isPlaceholderPhoto(userPhoto) && !photoError ? (
                  <img
                    className="user-menu-avatar"
                    src={
                      userPhoto.startsWith("http") || userPhoto.startsWith("data:")
                        ? userPhoto
                        : `${import.meta.env.VITE_API_URL}/uploads/${userPhoto}`
                    }
                    alt={userName}
                    onError={() => setPhotoError(true)}
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
                <div className="user-menu-dropdown" role="menu" aria-label="User Account Menu">
                  {/* Profile Card Header */}
                  <div className="user-menu-profile-card">
                    <div className="user-menu-card-avatar-wrap">
                      {userPhoto ? (
                        <img
                          className="user-menu-card-avatar"
                          src={`${import.meta.env.VITE_API_URL}/uploads/${userPhoto}`}
                          alt={userName}
                        />
                      ) : (
                        <span className="user-menu-card-initials">{initials}</span>
                      )}
                      {currentUser?.isVerified && (
                        <span className="user-menu-verified-badge" title="Verified Account">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <div className="user-menu-card-details">
                      <div className="user-menu-card-name-row">
                        <span className="user-menu-card-name" title={userName}>
                          {userName || "User"}
                        </span>
                        {role && (
                          <span className={`user-menu-role-pill ${role === "admin" ? "admin-role" : "user-role"}`}>
                            {role}
                          </span>
                        )}
                      </div>
                      {currentUser?.email && (
                        <span className="user-menu-card-email" title={currentUser.email}>
                          {currentUser.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="user-menu-divider" />

                  {/* Menu Navigation Items */}
                  <div className="user-menu-items">
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => handleNav("/profile")}
                    >
                      <span className="user-menu-item-icon">
                        <NavIcon name="profile" />
                      </span>
                      <span className="user-menu-item-label">My Profile</span>
                      <svg className="user-menu-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => handleNav("/settings")}
                    >
                      <span className="user-menu-item-icon">
                        <NavIcon name="settings" />
                      </span>
                      <span className="user-menu-item-label">Settings</span>
                      <svg className="user-menu-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    {/* Quick Theme Toggle Item */}
                    {themeStore && (
                      <button
                        type="button"
                        className="user-menu-item user-menu-theme-item"
                        onClick={() => themeStore.toggleTheme()}
                      >
                        <span className="user-menu-item-icon">
                          {themeStore.darkMode ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="5" />
                              <line x1="12" y1="1" x2="12" y2="3" />
                              <line x1="12" y1="21" x2="12" y2="23" />
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                              <line x1="1" y1="12" x2="3" y2="12" />
                              <line x1="21" y1="12" x2="23" y2="12" />
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                          )}
                        </span>
                        <span className="user-menu-item-label">
                          {themeStore.darkMode ? "Light Mode" : "Dark Mode"}
                        </span>
                        <span className="user-menu-theme-indicator">
                          {themeStore.darkMode ? "Dark" : "Light"}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="user-menu-divider" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    className="user-menu-item user-menu-logout"
                    onClick={handleLogout}
                  >
                    <span className="user-menu-item-icon logout-icon">
                      <NavIcon name="logout" />
                    </span>
                    <span className="user-menu-item-label">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area with Dedicated Breadcrumbs on Top */}
        <main className="app-main">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="app-main-breadcrumb-bar">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default observer(AppLayout);