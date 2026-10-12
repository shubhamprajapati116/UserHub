import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import FullScreenLoader from "../FullscreenLoader/FullscreenLoader";
import {
  FiShield,
  FiUsers,
  FiActivity,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
  FiSmartphone,
  FiSun,
  FiMoon,
  FiLayers,
  FiKey,
  FiCheck,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiMail,
  FiPieChart,
  FiTrendingUp,
  FiImage,
  FiCrop,
  FiBriefcase,
  FiBell,
  FiMonitor,
  FiClock,
  FiGlobe,
  FiAlertTriangle,
  FiUserCheck,
} from "react-icons/fi";
import bannerFluidMesh from "../../assets/banners/banner_1_fluid_mesh.jpg";
import bannerGlassPrisms from "../../assets/banners/banner_3_3d_glass_prisms.jpg";
import bannerSunsetHorizon from "../../assets/banners/banner_5_sunset_horizon.jpg";
import "./LandingPage.css";

const LandingPage = observer(() => {
  const { userStore, themeStore } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef(null);
  const toggleRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.12,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
        } else {
          if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove("is-revealed");
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );
    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handlePointerDown = (event) => {
      if (drawerRef.current && drawerRef.current.contains(event.target)) {
        return;
      }
      if (toggleRef.current && toggleRef.current.contains(event.target)) {
        return;
      }
      setMobileMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  if (token && userStore.authLoading) {
    return <FullScreenLoader />;
  }

  if (token && userStore.isAuthenticated) {
    const role = userStore.user?.role || localStorage.getItem("role");
    const targetPath = role === "admin" ? "/admin/dashboard" : "/profile";
    return <Navigate to={targetPath} replace />;
  }

  const currentUser = userStore.user;
  const isAuthenticated = userStore.isAuthenticated;
  const dashboardPath =
    currentUser?.role === "admin" ? "/admin/dashboard" : "/profile";

  return (
    <div className="landing-root">
      <div className="landing-ambient-bg" aria-hidden="true">
        <div className="ambient-sphere sphere-1"></div>
        <div className="ambient-sphere sphere-2"></div>
        <div className="ambient-sphere sphere-3"></div>
      </div>

      <header className={`landing-navbar ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="landing-container nav-inner">
          <Link to="/" className="landing-brand">
            <div className="brand-logo-icon">U</div>
            <span className="brand-text">UserHub</span>
            <span className="brand-badge">SaaS</span>
          </Link>

          <nav className="landing-nav-links">
            <a href="#features">User Directory</a>
            <a href="#sessions">Active Sessions</a>
            <a href="#profiles">Profiles & Studio</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#workflow">Workflow</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="landing-theme-toggle"
              onClick={() => themeStore.toggleTheme()}
              title={`Switch to ${themeStore.darkMode ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Theme"
            >
              {themeStore.darkMode ? <FiSun /> : <FiMoon />}
            </button>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="landing-btn landing-btn-primary nav-cta-desktop"
              >
                <span>Dashboard</span>
                <FiArrowRight />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="landing-btn landing-btn-ghost nav-signin-desktop"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="landing-btn landing-btn-primary nav-cta-desktop"
                >
                  <span>Sign Up</span>
                  <FiArrowRight />
                </Link>
              </>
            )}

            <button
              ref={toggleRef}
              type="button"
              className="landing-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            ref={drawerRef}
            className="landing-mobile-drawer"
            role="dialog"
            aria-modal="true"
          >
            <div className="drawer-header">
              <div className="drawer-header-left">
                <div className="drawer-header-logo">U</div>
                <span className="drawer-header-title">UserHub Menu</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                title="Close Menu"
                aria-label="Close menu"
              >
                <FiX />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-nav-icon purple">
                  <FiUsers />
                </div>
                <span>User Directory</span>
              </a>
              <a href="#sessions" onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-nav-icon green">
                  <FiSmartphone />
                </div>
                <span>Active Sessions</span>
              </a>
              <a href="#profiles" onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-nav-icon blue">
                  <FiImage />
                </div>
                <span>Profiles & Studio</span>
              </a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-nav-icon indigo">
                  <FiLayers />
                </div>
                <span>Capabilities</span>
              </a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-nav-icon amber">
                  <FiActivity />
                </div>
                <span>Workflow</span>
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-nav-icon cyan">
                  <FiCheckCircle />
                </div>
                <span>FAQ</span>
              </a>
            </nav>

            <div className="mobile-drawer-actions">
              {isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className="landing-btn landing-btn-primary drawer-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Dashboard</span>
                  <FiArrowRight />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="landing-btn landing-btn-ghost drawer-btn drawer-signin-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="landing-btn landing-btn-primary drawer-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Sign Up Free</span>
                    <FiArrowRight />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div
          className="landing-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main>
        <section className="landing-hero-section">
          <div className="landing-container">
            <div className="hero-split-grid">
              <div className="hero-text-col reveal-on-scroll">
                <div className="hero-status-pill">
                  <span className="hero-pulse-dot" />
                  <span className="hero-pill-badge">v2.4 Live</span>
                  <span className="hero-pill-desc">
                    User Management & Session Shield
                  </span>
                </div>

                <h1 className="hero-main-title">
                  Manage Users, Roles &{" "}
                  <span className="hero-gradient-text">Live Sessions</span> with
                  Total Confidence.
                </h1>

                <p className="hero-lead-text">
                  The all-in-one identity platform designed for fast-moving
                  teams. Search user directories, enforce granular role
                  permissions, monitor active devices in real-time, and let
                  users craft expressive profiles.
                </p>

                <div className="hero-action-buttons">
                  {isAuthenticated ? (
                    <Link
                      to={dashboardPath}
                      className="hero-action-btn primary"
                    >
                      <span>Open Your Dashboard</span>
                      <FiArrowRight />
                    </Link>
                  ) : (
                    <Link to="/register" className="hero-action-btn primary">
                      <span>Get Started Free</span>
                      <FiArrowRight />
                    </Link>
                  )}
                </div>

                <div className="hero-checklist-row">
                  <div className="checklist-item">
                    <FiCheckCircle className="check-icon green" />
                    <span>Real-Time Device Tracking</span>
                  </div>
                  <div className="checklist-item">
                    <FiCheckCircle className="check-icon green" />
                    <span>Instant Role Switching</span>
                  </div>
                  <div className="checklist-item">
                    <FiCheckCircle className="check-icon green" />
                    <span>Email OTP Security</span>
                  </div>
                  <div className="checklist-item">
                    <FiCheckCircle className="check-icon green" />
                    <span>Adaptive Dark & Light</span>
                  </div>
                </div>

                <div className="hero-stats-band">
                  <div className="stat-band-item">
                    <span className="stat-band-num">1,400+</span>
                    <span className="stat-band-label">Managed Users</span>
                  </div>
                  <div className="stat-band-divider" />
                  <div className="stat-band-item">
                    <span className="stat-band-num">&lt; 50ms</span>
                    <span className="stat-band-label">Directory Queries</span>
                  </div>
                  <div className="stat-band-divider" />
                  <div className="stat-band-item">
                    <span className="stat-band-num">100%</span>
                    <span className="stat-band-label">Remote Session Kill</span>
                  </div>
                </div>
              </div>

              <div className="hero-visual-col reveal-on-scroll stagger-2">
                <div className="showcase-card-stack">
                  <div className="floating-badge badge-session">
                    <div className="badge-icon-box green">
                      <FiMonitor />
                    </div>
                    <div className="badge-text-box">
                      <div className="badge-title-line">
                        <strong>MacBook Pro 16&quot;</strong>
                        <span className="badge-live-tag">Active Now</span>
                      </div>
                      <small>Chrome 122 • 192.168.1.42 • London, UK</small>
                    </div>
                    <button
                      type="button"
                      className="badge-revoke-btn"
                      title="Remote logout simulation"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="floating-badge badge-analytics">
                    <div className="badge-icon-box amber">
                      <FiTrendingUp />
                    </div>
                    <div className="badge-text-box">
                      <div className="badge-title-line">
                        <strong>Demographics</strong>
                        <span className="badge-growth-tag">+18.4%</span>
                      </div>
                      <small>58% Female • 42% Male • 96% Verified</small>
                    </div>
                  </div>

                  <div className="floating-badge badge-notif">
                    <div className="badge-icon-box purple">
                      <FiBell />
                    </div>
                    <div className="badge-text-box">
                      <strong>Role Promoted</strong>
                      <small>Admin rights granted by Security • 2m ago</small>
                    </div>
                  </div>

                  <div className="interactive-window-mockup">
                    <div className="window-chrome-bar">
                      <div className="window-dots">
                        <span className="w-dot red" />
                        <span className="w-dot yellow" />
                        <span className="w-dot green" />
                      </div>
                      <div className="window-address-pill">
                        <FiLock className="window-lock-icon" />
                        <span>userhub.internal/admin/panel</span>
                      </div>
                      <div className="window-status-pill">
                        <span className="status-dot-pulse" />
                        <span>Protected</span>
                      </div>
                    </div>

                    <div className="window-content-body">
                      s{" "}
                      <div className="mockup-toolbar">
                        <div className="mockup-search-input">
                          <FiSearch className="m-search-icon" />
                          <span>Search by name, email or role...</span>
                        </div>
                        <div className="mockup-filter-chips">
                          <span className="m-chip active">All Roles</span>
                          <span className="m-chip">Admins</span>
                          <span className="m-chip">Active</span>
                          <span className="m-chip filter-btn">
                            <FiFilter /> Filters
                          </span>
                        </div>
                      </div>
                      <div className="mockup-user-table">
                        <div className="m-table-header">
                          <span>User Details</span>
                          <span>Role</span>
                          <span>Status</span>
                          <span>Verified</span>
                          <span>Actions</span>
                        </div>

                        <div className="m-table-row">
                          <div className="m-user-cell">
                            <div className="m-avatar indigo">SP</div>
                            <div className="m-user-info">
                              <strong>Shubham Patel</strong>
                              <small>shubham@userhub.dev</small>
                            </div>
                          </div>
                          <div>
                            <span className="m-badge role-admin">ADMIN</span>
                          </div>
                          <div>
                            <span className="m-badge status-active">
                              <span className="dot-green" /> ACTIVE
                            </span>
                          </div>
                          <div>
                            <span className="m-verified-tag">
                              <FiCheckCircle /> Verified
                            </span>
                          </div>
                          <div className="m-actions-cell">
                            <FiMoreVertical className="m-action-dots" />
                          </div>
                        </div>

                        <div className="m-table-row">
                          <div className="m-user-cell">
                            <div className="m-avatar purple">SC</div>
                            <div className="m-user-info">
                              <strong>Sarah Connor</strong>
                              <small>sarah@cyberdyne.io</small>
                            </div>
                          </div>
                          <div>
                            <span className="m-badge role-user">USER</span>
                          </div>
                          <div>
                            <span className="m-badge status-active">
                              <span className="dot-green" /> ACTIVE
                            </span>
                          </div>
                          <div>
                            <span className="m-verified-tag">
                              <FiCheckCircle /> Verified
                            </span>
                          </div>
                          <div className="m-actions-cell">
                            <FiMoreVertical className="m-action-dots" />
                          </div>
                        </div>

                        <div className="m-table-row">
                          <div className="m-user-cell">
                            <div className="m-avatar rose">DK</div>
                            <div className="m-user-info">
                              <strong>David Kim</strong>
                              <small>david@kim-security.net</small>
                            </div>
                          </div>
                          <div>
                            <span className="m-badge role-user">USER</span>
                          </div>
                          <div>
                            <span className="m-badge status-banned">
                              <span className="dot-red" /> BANNED
                            </span>
                          </div>
                          <div>
                            <span className="m-unverified-tag">Pending</span>
                          </div>
                          <div className="m-actions-cell">
                            <FiMoreVertical className="m-action-dots" />
                          </div>
                        </div>
                      </div>
                      <div className="window-footer-metrics">
                        <div className="w-metric">
                          <span className="w-metric-val">1,420</span>
                          <span className="w-metric-lbl">Total Users</span>
                        </div>
                        <div className="w-metric">
                          <span className="w-metric-val">842</span>
                          <span className="w-metric-lbl">Active Today</span>
                        </div>
                        <div className="w-metric">
                          <span className="w-metric-val">99.2%</span>
                          <span className="w-metric-lbl">2FA Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-spotlight-section">
          <div className="landing-container">
            <div className="spotlight-row reveal-on-scroll">
              <div className="spotlight-text-side">
                <span className="spotlight-eyebrow purple">
                  <FiUsers /> ADMIN & DIRECTORY INTELLIGENCE
                </span>
                <h2 className="spotlight-title">
                  Full-Lifecycle User Directory with Instant Role Governance
                </h2>
                <p className="spotlight-desc">
                  Empower your administrators with enterprise-grade user
                  management. Search, filter, view complete user profiles,
                  switch roles, or enforce temporary suspensions with
                  transparent security reasons.
                </p>

                <div className="spotlight-feature-list">
                  <div className="feature-bullet">
                    <div className="bullet-icon-box purple">
                      <FiSearch />
                    </div>
                    <div>
                      <strong>Multi-Field Search & Filter Drawer</strong>
                      <p>
                        Instantly filter by Role (Admin/User), Status
                        (Active/Banned), Gender, and verification state with
                        zero reload latency.
                      </p>
                    </div>
                  </div>

                  <div className="feature-bullet">
                    <div className="bullet-icon-box indigo">
                      <FiShield />
                    </div>
                    <div>
                      <strong>One-Click Role Switching</strong>
                      <p>
                        Promote standard members to administrators with
                        automatic in-app notification alerts and server-side
                        access tokens.
                      </p>
                    </div>
                  </div>

                  <div className="feature-bullet">
                    <div className="bullet-icon-box rose">
                      <FiAlertTriangle />
                    </div>
                    <div>
                      <strong>Safe Ban & Restore Protocol</strong>
                      <p>
                        Suspend compromised accounts with custom audit notes,
                        instantly disconnecting malicious sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="spotlight-visual-side">
                <div className="spotlight-mockup-frame">
                  <div className="frame-header-bar">
                    <div className="frame-title">
                      <FiUsers className="frame-icon purple" />
                      <span>User Management • Admin Directory</span>
                    </div>
                    <span className="frame-badge green">Live Controller</span>
                  </div>

                  <div className="directory-action-showcase">
                    <div className="action-showcase-user">
                      <div className="showcase-user-avatar">SC</div>
                      <div className="showcase-user-meta">
                        <h4>Sarah Connor</h4>
                        <span>sarah@cyberdyne.io • Joined Aug 2024</span>
                      </div>
                      <span className="showcase-role-pill">USER</span>
                    </div>

                    <div className="action-menu-dropdown-preview">
                      <div className="action-menu-label">Available Actions</div>
                      <div className="action-menu-item">
                        <FiUserCheck className="menu-icon green" />
                        <span>View Full Profile Modal</span>
                      </div>
                      <div className="action-menu-item highlighted">
                        <FiShield className="menu-icon purple" />
                        <span>Change Role to Admin</span>
                        <span className="menu-tag">Active</span>
                      </div>
                      <div className="action-menu-item">
                        <FiMail className="menu-icon blue" />
                        <span>Resend Verification Email</span>
                      </div>
                      <div className="action-menu-item danger">
                        <FiAlertTriangle className="menu-icon red" />
                        <span>Ban User with Reason</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="sessions"
          className="landing-spotlight-section alternate-bg"
        >
          <div className="landing-container">
            <div className="spotlight-row reverse-cols reveal-on-scroll">
              <div className="spotlight-visual-side">
                <div className="spotlight-mockup-frame">
                  <div className="frame-header-bar">
                    <div className="frame-title">
                      <FiSmartphone className="frame-icon green" />
                      <span>Settings • Where You&apos;re Signed In</span>
                    </div>
                    <span className="frame-badge green">3 Devices Live</span>
                  </div>

                  <div className="device-stack-container">
                    <div className="device-card-item current">
                      <div className="device-icon-circle green">
                        <FiMonitor />
                      </div>
                      <div className="device-details">
                        <div className="device-name-row">
                          <strong>Windows 11 PC</strong>
                          <span className="current-device-tag">
                            This Device
                          </span>
                        </div>
                        <div className="device-meta-row">
                          <span>Chrome 122</span>
                          <span>•</span>
                          <span className="ip-mono">192.168.1.104</span>
                          <span>•</span>
                          <span>Active now</span>
                        </div>
                      </div>
                    </div>

                    <div className="device-card-item">
                      <div className="device-icon-circle blue">
                        <FiSmartphone />
                      </div>
                      <div className="device-details">
                        <div className="device-name-row">
                          <strong>iPhone 15 Pro</strong>
                          <span className="device-os-tag">iOS 17.4</span>
                        </div>
                        <div className="device-meta-row">
                          <span>Mobile Safari</span>
                          <span>•</span>
                          <span className="ip-mono">49.36.128.5</span>
                          <span>•</span>
                          <span>18m ago</span>
                        </div>
                      </div>
                      <button type="button" className="remote-revoke-btn">
                        Revoke
                      </button>
                    </div>

                    <div className="device-card-item">
                      <div className="device-icon-circle purple">
                        <FiMonitor />
                      </div>
                      <div className="device-details">
                        <div className="device-name-row">
                          <strong>MacBook Pro M3</strong>
                          <span className="device-os-tag">macOS Sonoma</span>
                        </div>
                        <div className="device-meta-row">
                          <span>Firefox Developer</span>
                          <span>•</span>
                          <span className="ip-mono">152.58.16.89</span>
                          <span>•</span>
                          <span>Yesterday</span>
                        </div>
                      </div>
                      <button type="button" className="remote-revoke-btn">
                        Revoke
                      </button>
                    </div>

                    <button type="button" className="logout-others-strip-btn">
                      <span>Log Out All Other Active Sessions</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="spotlight-text-side">
                <span className="spotlight-eyebrow green">
                  <FiSmartphone /> MULTI-DEVICE SESSION SHIELD
                </span>
                <h2 className="spotlight-title">
                  Real-Time Device Tracking & One-Click Remote Logout
                </h2>
                <p className="spotlight-desc">
                  Eliminate hijacked logins and forgotten sessions. UserHub
                  accurately identifies connected devices, operating systems,
                  browser types, IP addresses, and login timestamps.
                </p>

                <div className="spotlight-feature-list">
                  <div className="feature-bullet">
                    <div className="bullet-icon-box green">
                      <FiGlobe />
                    </div>
                    <div>
                      <strong>Smart Device Brand & OS Detection</strong>
                      <p>
                        Automatically maps sessions to Windows, macOS, iOS,
                        Android, or Linux with authentic brand icons and browser
                        identifiers.
                      </p>
                    </div>
                  </div>

                  <div className="feature-bullet">
                    <div className="bullet-icon-box rose">
                      <FiLock />
                    </div>
                    <div>
                      <strong>Targeted Session Revocation</strong>
                      <p>
                        Revoke suspicious or unwanted sessions individually
                        without interrupting your current authenticated work.
                      </p>
                    </div>
                  </div>

                  <div className="feature-bullet">
                    <div className="bullet-icon-box amber">
                      <FiClock />
                    </div>
                    <div>
                      <strong>Session Hijack Countermeasure</strong>
                      <p>
                        If an unrecognized sign-in occurs, UserHub alerts the
                        user&apos;s verified devices while excluding the
                        attacker.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="profiles" className="landing-spotlight-section">
          <div className="landing-container">
            <div className="spotlight-row reveal-on-scroll">
              <div className="spotlight-text-side">
                <span className="spotlight-eyebrow blue">
                  <FiImage /> CREATIVE PROFILE STUDIO
                </span>
                <h2 className="spotlight-title">
                  Expressive Profiles with Curated Banners & Avatar Cropping
                </h2>
                <p className="spotlight-desc">
                  Give your users a creative, professional home. UserHub
                  includes an interactive avatar crop modal with real-time
                  zooming and panning, 10+ curated HD profile banners, and a
                  structured work experience timeline.
                </p>

                <div className="spotlight-feature-list">
                  <div className="feature-bullet">
                    <div className="bullet-icon-box blue">
                      <FiCrop />
                    </div>
                    <div>
                      <strong>Interactive Canvas Image Cropper</strong>
                      <p>
                        Upload any image, crop with zoom slider controls, and
                        preview circular avatar clipping before saving.
                      </p>
                    </div>
                  </div>

                  <div className="feature-bullet">
                    <div className="bullet-icon-box indigo">
                      <FiImage />
                    </div>
                    <div>
                      <strong>10+ Curated HD Profile Banners</strong>
                      <p>
                        Choose from Swiss Matrix, Cyber Topography, Fluid Mesh,
                        and Cosmic Nebula themes or upload custom artwork.
                      </p>
                    </div>
                  </div>

                  <div className="feature-bullet">
                    <div className="bullet-icon-box amber">
                      <FiBriefcase />
                    </div>
                    <div>
                      <strong>Career Experience Timeline</strong>
                      <p>
                        Showcase professional milestones, company designations,
                        employment periods, and achievements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="spotlight-visual-side">
                <div className="spotlight-mockup-frame">
                  <div className="frame-header-bar">
                    <div className="frame-title">
                      <FiImage className="frame-icon blue" />
                      <span>User Profile Studio • Live Preview</span>
                    </div>
                    <span className="frame-badge blue">95% Complete</span>
                  </div>

                  <div className="profile-studio-preview">
                    <div
                      className="studio-banner-img-wrap"
                      style={{ backgroundImage: `url(${bannerFluidMesh})` }}
                    >
                      <span className="banner-theme-tag">Fluid Mesh HD</span>
                    </div>

                    <div className="studio-profile-content">
                      <div className="studio-avatar-row">
                        <div className="studio-avatar-box">
                          <span>SP</span>
                          <div
                            className="studio-crop-badge"
                            title="Image Cropper"
                          >
                            <FiCrop />
                          </div>
                        </div>

                        <div className="studio-quick-stats">
                          <span className="studio-stat-pill">
                            <FiCheckCircle className="green" /> Verified Member
                          </span>
                          <span className="studio-stat-pill">
                            <FiBriefcase className="blue" /> 4+ Yrs Experience
                          </span>
                        </div>
                      </div>

                      <div className="studio-bio-info">
                        <h3>Shubham Patel</h3>
                        <p>
                          Senior Full-Stack Engineer • UserHub Core Contributor
                        </p>
                      </div>

                      <div className="studio-banner-picker-row">
                        <span className="picker-lbl">Preset Banners:</span>
                        <div
                          className="banner-thumb active"
                          style={{ backgroundImage: `url(${bannerFluidMesh})` }}
                          title="Fluid Mesh"
                        />
                        <div
                          className="banner-thumb"
                          style={{
                            backgroundImage: `url(${bannerGlassPrisms})`,
                          }}
                          title="3D Glass Prisms"
                        />
                        <div
                          className="banner-thumb"
                          style={{
                            backgroundImage: `url(${bannerSunsetHorizon})`,
                          }}
                          title="Sunset Horizon"
                        />
                        <span className="banner-more-tag">+10 more</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="landing-capabilities-section alternate-bg"
        >
          <div className="landing-container">
            <div className="section-head text-center reveal-on-scroll">
              <span className="section-eyebrow indigo">
                <FiLayers /> FULL PLATFORM SPECTRUM
              </span>
              <h2 className="section-title">
                Everything Built Directly Into Your UserHub Instance
              </h2>
              <p className="section-desc">
                No third-party subscriptions or fragmented auth services. Every
                core feature is natively integrated into your application.
              </p>
            </div>

            <div className="capabilities-bento-grid">
              <div className="bento-card bento-rose reveal-on-scroll stagger-1">
                <div className="bento-card-icon-box rose">
                  <FiMail />
                </div>
                <h3>Automated Email OTP & Verification</h3>
                <p>
                  Safeguard sign-ups and email modifications with automated
                  one-time passwords (OTP) and verification token links.
                </p>
                <div className="bento-tag-row">
                  <span className="bento-mini-tag">Nodemailer</span>
                  <span className="bento-mini-tag">Time-Expiring OTP</span>
                  <span className="bento-mini-tag">Anti-Spam</span>
                </div>
              </div>

              <div className="bento-card bento-amber reveal-on-scroll stagger-2">
                <div className="bento-card-icon-box amber">
                  <FiPieChart />
                </div>
                <h3>Live Demographics & Analytics</h3>
                <p>
                  Visualize user population telemetry with interactive gender
                  ratio charts, role distributions, and registration growth
                  trends.
                </p>
                <div className="bento-tag-row">
                  <span className="bento-mini-tag">Gender Donut</span>
                  <span className="bento-mini-tag">Role Telemetry</span>
                  <span className="bento-mini-tag">Growth Tracking</span>
                </div>
              </div>

              <div className="bento-card bento-purple reveal-on-scroll stagger-3">
                <div className="bento-card-icon-box purple">
                  <FiBell />
                </div>
                <h3>In-App Notification Center</h3>
                <p>
                  Keep users informed in real-time with an interactive bell icon
                  dropdown, unread counts, and targeted security event alerts.
                </p>
                <div className="bento-tag-row">
                  <span className="bento-mini-tag">Unread Badge</span>
                  <span className="bento-mini-tag">Device Alerts</span>
                  <span className="bento-mini-tag">Mark All Read</span>
                </div>
              </div>

              <div className="bento-card bento-indigo reveal-on-scroll stagger-1">
                <div className="bento-card-icon-box indigo">
                  <FiShield />
                </div>
                <h3>Role-Based Access Governance (RBAC)</h3>
                <p>
                  Shield admin-only endpoints, user directories, and sensitive
                  settings with strict server-side JWT verification middleware.
                </p>
                <div className="bento-tag-row">
                  <span className="bento-mini-tag">Admin Protected</span>
                  <span className="bento-mini-tag">JWT Bearer</span>
                  <span className="bento-mini-tag">Session Scoped</span>
                </div>
              </div>

              <div className="bento-card bento-blue reveal-on-scroll stagger-2">
                <div className="bento-card-icon-box blue">
                  <FiBriefcase />
                </div>
                <h3>Career Experience Timeline</h3>
                <p>
                  Enable users to document their employment trajectory, company
                  designations, achievements, and technical skill sets.
                </p>
                <div className="bento-tag-row">
                  <span className="bento-mini-tag">Work History</span>
                  <span className="bento-mini-tag">Designations</span>
                  <span className="bento-mini-tag">CRUD Support</span>
                </div>
              </div>

              <div className="bento-card bento-emerald reveal-on-scroll stagger-3">
                <div className="bento-card-icon-box emerald">
                  <FiSun />
                </div>
                <h3>Adaptive Dark & Colorful Light Theme</h3>
                <p>
                  Crafted with precision for every lighting condition. Obsidian
                  blurs for the night, and vivid high-contrast colors for the
                  day.
                </p>
                <div className="bento-tag-row">
                  <span className="bento-mini-tag">Instant Toggle</span>
                  <span className="bento-mini-tag">CSS Custom Props</span>
                  <span className="bento-mini-tag">Persistent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="landing-workflow-section">
          <div className="landing-container">
            <div className="section-head text-center reveal-on-scroll">
              <span className="section-eyebrow green">
                <FiActivity /> EFFORTLESS WORKFLOW
              </span>
              <h2 className="section-title">
                How UserHub Powers Your Application
              </h2>
              <p className="section-desc">
                From initial user onboarding to enterprise administrative
                oversight in three simple steps.
              </p>
            </div>

            <div className="workflow-steps-grid">
              <div className="workflow-step-card reveal-on-scroll stagger-1">
                <div className="step-number-tag">01</div>
                <div className="step-icon-box rose">
                  <FiMail />
                </div>
                <h3>Sign Up & Verify Identity</h3>
                <p>
                  User enters their details and receives an instant automated
                  verification code or link. Unverified accounts cannot access
                  sensitive modules.
                </p>
                <div className="step-card-footer">
                  <FiCheckCircle className="green" /> Prevents fake sign-ups
                </div>
              </div>

              <div className="workflow-step-card reveal-on-scroll stagger-2">
                <div className="step-number-tag">02</div>
                <div className="step-icon-box purple">
                  <FiKey />
                </div>
                <h3>Assign Roles & Privileges</h3>
                <p>
                  Administrators assign granular roles (Admin vs. Standard
                  User). Permissions are validated on every single protected API
                  route.
                </p>
                <div className="step-card-footer">
                  <FiCheckCircle className="green" /> Strict route guards
                </div>
              </div>

              <div className="workflow-step-card reveal-on-scroll stagger-3">
                <div className="step-number-tag">03</div>
                <div className="step-icon-box green">
                  <FiActivity />
                </div>
                <h3>Manage & Secure Sessions</h3>
                <p>
                  Monitor real-time demographics, audit user status, inspect
                  active device sessions, and revoke suspicious activity
                  instantly.
                </p>
                <div className="step-card-footer">
                  <FiCheckCircle className="green" /> 1-Click remote logout
                </div>
              </div>
            </div>
          </div>
        </section>

        <FaqSection />

        <section className="landing-cta-section">
          <div className="landing-container">
            <div className="cta-gradient-box">
              <div className="cta-content-inner">
                <div className="cta-badge-tag">
                  <span className="cta-badge-dot" />
                  <span>Production-Ready Identity &amp; Sessions</span>
                </div>
                <h2 className="cta-headline">
                  Ready to upgrade your user management &amp;{" "}
                  <span className="cta-highlight-text">session security</span>?
                </h2>
                <p className="cta-subtext">
                  Join UserHub today. Create your account in under 30 seconds
                  and take full control of your user directories, device tokens,
                  and active sessions.
                </p>

                <div className="cta-button-row">
                  {isAuthenticated ? (
                    <Link to={dashboardPath} className="cta-primary-btn">
                      <span>Open Your Dashboard</span>
                      <FiArrowRight />
                    </Link>
                  ) : (
                    <Link to="/register" className="cta-primary-btn">
                      <span>Create Free Account</span>
                      <FiArrowRight />
                    </Link>
                  )}
                </div>

                <div className="cta-proof-chips">
                  <div className="cta-chip">
                    <FiCheck className="chip-icon green" />
                    <span>No credit card required</span>
                  </div>
                  <div className="cta-chip">
                    <FiShield className="chip-icon indigo" />
                    <span>100% Server-Side Protected</span>
                  </div>
                  <div className="cta-chip">
                    <FiCheckCircle className="chip-icon green" />
                    <span>Instant 30s Setup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-col-brand">
            <div className="landing-brand">
              <div className="brand-logo-icon">U</div>
              <span className="brand-text">UserHub</span>
            </div>
            <p className="footer-tagline">
              Modern user management, role governance, and real-time active
              session security for high-velocity software teams.
            </p>
            <div className="footer-status">
              <span className="status-dot"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Core Features</h4>
            <a href="#features">Admin Directory</a>
            <a href="#sessions">Active Sessions</a>
            <a href="#profiles">Profile Studio</a>
            <a href="#capabilities">Email OTP Verification</a>
          </div>

          <div className="footer-col">
            <h4>Governance</h4>
            <a href="#capabilities">Role-Based Access (RBAC)</a>
            <a href="#sessions">Remote Session Revoke</a>
            <a href="#capabilities">In-App Notifications</a>
            <a href="#capabilities">Demographics Analytics</a>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <a href="#workflow">How It Works</a>
            <a href="#faq">FAQ Help</a>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>

        <div className="landing-container footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} UserHub Inc. All rights reserved.
          </span>
          <div className="footer-bottom-links">
            <a href="#features">Directory</a>
            <a href="#sessions">Active Sessions</a>
            <a href="#profiles">Profiles</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
});

const FAQ_ITEMS = [
  {
    question: "What is UserHub and what problems does it solve?",
    answer:
      "UserHub is a full-featured Identity and User Management platform. It centralizes user registration, role-based access control (Admin vs. Standard User), multi-device active session tracking with remote revocation, profile customization (HD banners & avatar cropper), and demographic telemetry in one unified system.",
  },
  {
    question: "How does Active Session tracking and remote logout work?",
    answer:
      "Every time a user logs in, UserHub registers their hardware category (Windows, Mac, iOS, Android, Linux), browser name, and IP address. Users can visit Settings → Active Sessions to view all currently connected devices and terminate any specific remote session with a single click, or logout all other devices simultaneously.",
  },
  {
    question: "What is the difference between an Admin and a standard User?",
    answer:
      "A Standard User can customize their personal profile (HD banner, avatar cropper, work experience), manage their own active sessions, and update credentials. An Admin has access to the full User Management Directory with search, filters, user ban/unban capabilities, role modifications, and live demographic analytics.",
  },
  {
    question: "How does Email OTP and account verification work?",
    answer:
      "During registration or when requesting an email update, UserHub sends a secure, time-expiring verification code or token to the user's email. Accounts remain strictly protected until verification is completed, preventing spam accounts and credential harvesting.",
  },
  {
    question: "How does the Profile Studio and Image Cropper function?",
    answer:
      "Users can upload custom avatar photos and adjust zoom and position inside an interactive modal canvas before saving. Additionally, users can select from 10+ curated HD banners (e.g. Fluid Mesh, Swiss Matrix, Cyber Topography) or upload their own header artwork.",
  },
  {
    question: "Does UserHub support both Dark Mode and Light Mode?",
    answer:
      "Yes! UserHub features seamless instant theme switching. Dark Mode delivers a high-contrast obsidian aesthetic with ambient glows, while Light Mode provides a colorful, vibrant, and clean daytime reading experience.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [visible, setVisible] = useState(false);
  const faqRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (faqRef.current && !faqRef.current.contains(e.target)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (openIndex === null && !showAll) return;

    let rafId = null;

    const closeAll = () => {
      setOpenIndex(null);
      setShowAll(false);
      setRevealed(false);
    };

    const checkVisibility = () => {
      const navbarHeight = 64;
      const winHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const listEl = faqRef.current?.querySelector(".faq-list");
      if (listEl) {
        const listRect = listEl.getBoundingClientRect();
        if (listRect.bottom <= navbarHeight || listRect.top >= winHeight) {
          closeAll();
          return;
        }
      } else if (faqRef.current) {
        const secRect = faqRef.current.getBoundingClientRect();
        if (secRect.bottom <= navbarHeight || secRect.top >= winHeight) {
          closeAll();
          return;
        }
      }
    };

    const handleScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkVisibility);
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    let observer = null;
    const targetNode =
      faqRef.current?.querySelector(".faq-list") || faqRef.current;
    if (targetNode && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            closeAll();
          }
        },
        { rootMargin: "-64px 0px 0px 0px", threshold: 0 },
      );
      observer.observe(targetNode);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
      if (observer) observer.disconnect();
    };
  }, [openIndex, showAll]);

  useEffect(() => {
    const node = faqRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  const handleShowAll = () => {
    setShowAll(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRevealed(true));
    });
  };

  return (
    <section id="faq" className="landing-section faq-section" ref={faqRef}>
      <div className="landing-container">
        <div
          className={`section-head text-center faq-head${visible ? " faq-animate-in" : ""}`}
        >
          <span className="section-eyebrow cyan">
            <FiCheckCircle /> FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="section-title">Common Questions About UserHub</h2>
          <p className="section-desc">
            Everything you need to know about user administration, sessions, and
            role governance.
          </p>
        </div>

        <div className="faq-list">
          <div
            className={`faq-item${openIndex === 0 ? " faq-item--open" : ""} faq-item-visible`}
          >
            <div className="faq-glow-bar" />
            <button
              className="faq-question"
              onClick={() => toggle(0)}
              aria-expanded={openIndex === 0}
            >
              <span className="faq-q-text">{FAQ_ITEMS[0].question}</span>
              <span className="faq-chevron-wrap">
                <FiChevronDown className="faq-chevron" />
              </span>
            </button>
            <div className="faq-answer-wrap">
              <div className="faq-answer">
                <div className="faq-answer-content">
                  <p>{FAQ_ITEMS[0].answer}</p>
                </div>
              </div>
            </div>
          </div>

          {!showAll && (
            <button className="faq-show-more-btn" onClick={handleShowAll}>
              <span>Show {FAQ_ITEMS.length - 1} more questions</span>
              <span className="faq-show-more-dots">
                {FAQ_ITEMS.slice(1).map((_, i) => (
                  <span key={i} className="faq-dot" />
                ))}
              </span>
              <FiChevronDown className="faq-show-more-icon" />
            </button>
          )}

          {showAll &&
            FAQ_ITEMS.slice(1).map((item, idx) => {
              const i = idx + 1;
              return (
                <div
                  key={i}
                  className={`faq-item${openIndex === i ? " faq-item--open" : ""}${revealed ? " faq-item-visible" : ""}`}
                  style={{ "--faq-delay": `${idx * 80}ms` }}
                >
                  <div className="faq-glow-bar" />
                  <button
                    className="faq-question"
                    onClick={() => toggle(i)}
                    aria-expanded={openIndex === i}
                  >
                    <span className="faq-q-text">{item.question}</span>
                    <span className="faq-chevron-wrap">
                      <FiChevronDown className="faq-chevron" />
                    </span>
                  </button>
                  <div className="faq-answer-wrap">
                    <div className="faq-answer">
                      <div className="faq-answer-content">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {showAll && (
            <button
              className="faq-show-more-btn faq-show-less-btn"
              onClick={() => {
                setShowAll(false);
                setRevealed(false);
                setOpenIndex(null);
              }}
            >
              <span>Show fewer questions</span>
              <FiChevronUp className="faq-show-more-icon" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default LandingPage;
