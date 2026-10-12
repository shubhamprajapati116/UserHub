import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import AppLayout from "../AppLayout/AppLayout";
import UserGrowthChart from "../UserGrowthChart/UserGrowthChart";
import TodayUsersCard from "../TodayUsersCard/TodayUsersCard";
import DemographicsWidget from "../DemographicsWidget/DemographicsWidget";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { userStore } = useStore();

  const currentUser = userStore.currentUser;
  const users = userStore.users;
  const totalUsers = userStore.totalUsers;
  const backendStats = userStore.stats;
  const loading =
    (userStore.loading.fetchStats || userStore.loading.fetchAnalytics) &&
    !backendStats;

  useEffect(() => {
    userStore.fetchStats();
    userStore.fetchTodayUsers();
  }, []);

  const isCurrentUserMatchingFilter = (user) => {
    if (!user) return false;
    return true;
  };

  const matchesCurrentUser = isCurrentUserMatchingFilter(currentUser);
  const systemTotalUsers = backendStats
    ? (backendStats.totalUsers ?? userStore.systemTotalUsers ?? totalUsers)
    : totalUsers + (matchesCurrentUser ? 1 : 0);

  const verifiedCount = backendStats
    ? backendStats.verifiedUsersCount
    : users.filter((u) => u.isVerified).length +
      (matchesCurrentUser && currentUser?.isVerified ? 1 : 0);

  const adminCount = backendStats
    ? backendStats.adminUsersCount
    : users.filter((u) => u.role === "admin").length +
      (matchesCurrentUser && currentUser?.role === "admin" ? 1 : 0);

  const userCount = Math.max(0, systemTotalUsers - adminCount);

  const maleCount =
    backendStats?.maleUsersCount !== undefined
      ? backendStats.maleUsersCount
      : users.filter((u) => u.gender?.toLowerCase() === "male").length +
        (matchesCurrentUser && currentUser?.gender?.toLowerCase() === "male"
          ? 1
          : 0);

  const femaleCount =
    backendStats?.femaleUsersCount !== undefined
      ? backendStats.femaleUsersCount
      : users.filter((u) => u.gender?.toLowerCase() === "female").length +
        (matchesCurrentUser && currentUser?.gender?.toLowerCase() === "female"
          ? 1
          : 0);

  const otherCount = Math.max(0, systemTotalUsers - (maleCount + femaleCount));

  const newTodayCount = backendStats
    ? backendStats.todayUsersCount
    : users.filter(
        (u) =>
          u.createdAt &&
          new Date(u.createdAt).toDateString() === new Date().toDateString(),
      ).length +
      (matchesCurrentUser &&
      currentUser?.createdAt &&
      new Date(currentUser.createdAt).toDateString() ===
        new Date().toDateString()
        ? 1
        : 0);

  const activeUsersCount =
    backendStats?.activeUsersCount !== undefined
      ? backendStats.activeUsersCount
      : users.filter((u) => !u.status || u.status === "active").length +
        (matchesCurrentUser &&
        (!currentUser?.status || currentUser?.status === "active")
          ? 1
          : 0);

  const suspendedCount =
    backendStats?.suspendedUsersCount !== undefined
      ? backendStats.suspendedUsersCount
      : users.filter((u) => u.status === "suspended").length +
        (matchesCurrentUser && currentUser?.status === "suspended" ? 1 : 0);

  const bannedCount =
    backendStats?.bannedUsersCount !== undefined
      ? backendStats.bannedUsersCount
      : users.filter((u) => u.status === "banned").length +
        (matchesCurrentUser && currentUser?.status === "banned" ? 1 : 0);

  const unverifiedCount = Math.max(0, systemTotalUsers - verifiedCount);

  const restrictedCount = suspendedCount + bannedCount;

  const kpiStats = [
    {
      id: "total-users",
      label: "Total Users",
      subtext: "Platform directory scale",
      value: systemTotalUsers,
      colorType: "blue",
      badge: "All Time",
      icon: (
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
    },
    {
      id: "active-accounts",
      label: "Active Accounts",
      subtext: "Live operational users",
      value: activeUsersCount,
      colorType: "emerald",
      badge: `${systemTotalUsers > 0 ? Math.round((activeUsersCount / systemTotalUsers) * 100) : 100}% Active`,
      icon: (
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: "restricted-accounts",
      label: "Restricted Accounts",
      subtext: "Suspended or banned users",
      value: restrictedCount,
      colorType: "amber",
      badge:
        restrictedCount > 0 ? `${restrictedCount} Action Req.` : "All Clean",
      icon: (
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
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      id: "new-today",
      label: "New Today",
      subtext: "Fresh platform registrations",
      value: newTodayCount,
      colorType: "purple",
      badge: newTodayCount > 0 ? `+${newTodayCount}` : "Today",
      icon: (
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
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <AppLayout
      title="Dashboard"
      subtitle="System overview, user growth analytics, and key platform metrics"
    >
      <div className="admin-dashboard-wrapper">
        <div className="dashboard-section-header dash-top-toolbar">
          <div className="section-header-left">
            <div className="section-header-icon-box">
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
            </div>
            <div className="section-header-content">
              <h2 className="section-header-title">Overview & Analytics</h2>
              <p className="section-header-sub">
                Platform performance, registration trends, and key platform
                metrics summary
              </p>
            </div>
          </div>
          <div className="section-header-right">
            <span className="section-header-badge">
              <span className="section-badge-dot"></span>
              Live System Metrics
            </span>
          </div>
        </div>

        <div className="admin-stat-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div className="admin-stat-card skeleton-stat-card" key={i}>
                  <div className="stat-card-header">
                    <div className="skeleton skeleton-stat-label"></div>
                    <div className="skeleton skeleton-stat-icon"></div>
                  </div>
                  <div className="stat-card-metric">
                    <div className="skeleton skeleton-stat-number"></div>
                    <div className="skeleton skeleton-stat-chip"></div>
                  </div>
                  <div className="stat-card-footer">
                    <div className="skeleton skeleton-stat-footer-line"></div>
                  </div>
                </div>
              ))
            : kpiStats.map((s) => (
                <div
                  className={`admin-stat-card stat-${s.colorType}`}
                  key={s.id}
                >
                  <div className="stat-card-header">
                    <span className="stat-card-label">{s.label}</span>
                    <div className={`stat-card-icon-box icon-${s.colorType}`}>
                      <div className="stat-card-icon-inner">{s.icon}</div>
                    </div>
                  </div>

                  <div className="stat-card-metric">
                    <span className="stat-card-value">{s.value}</span>
                    {s.confirmedLabel && (
                      <div className="stat-card-metric-aside">
                        <span className="stat-metric-percent">
                          {s.confirmedLabel}
                        </span>
                        <span className="stat-metric-tag">confirmed</span>
                      </div>
                    )}
                  </div>

                  <div className="stat-card-footer">
                    <span className={`stat-card-badge badge-${s.colorType}`}>
                      {s.badge}
                    </span>
                    <span className="stat-card-subtext">{s.subtext}</span>
                  </div>
                </div>
              ))}
        </div>

        <DemographicsWidget
          systemTotalUsers={systemTotalUsers}
          adminCount={adminCount}
          userCount={userCount}
          verifiedCount={verifiedCount}
          maleCount={maleCount}
          femaleCount={femaleCount}
          otherCount={otherCount}
          activeCount={activeUsersCount}
          suspendedCount={suspendedCount}
          bannedCount={bannedCount}
          unverifiedCount={unverifiedCount}
          loading={loading}
        />

        <div className="dash-split-grid">
          <div className="dash-chart-col desktop-tablet-chart">
            <UserGrowthChart />
          </div>

          <div className="dash-chart-mobile-info">
            <div className="dash-chart-mobile-header">
              <div className="dash-chart-mobile-title-wrap">
                <h3 className="dash-chart-mobile-title">Registration Trends</h3>
                <span className="dash-chart-mobile-sub">
                  Growth and registration analytics
                </span>
              </div>
              <span className="dash-chart-desktop-pill">
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Desktop & Tablet
              </span>
            </div>

            <div className="dash-chart-mobile-body">
              <div className="dash-chart-empty-icon-wrap">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <polyline points="7 12 10 9 13 12 17 8" />
                </svg>
              </div>
              <h4 className="dash-chart-empty-title">
                Chart Available on Desktop & Tablet
              </h4>
              <p className="dash-chart-empty-desc">
                Interactive growth charts are optimized for larger screens. Open
                on tablet or desktop to view detailed trends.
              </p>
            </div>
          </div>

          <div className="dash-today-col">
            <TodayUsersCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(AdminDashboard);
