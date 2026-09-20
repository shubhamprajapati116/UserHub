import "./DemographicsWidget.css";

function DemographicsWidget({
  systemTotalUsers = 0,
  adminCount = 0,
  userCount = 0,
  verifiedCount = 0,
  maleCount = 0,
  femaleCount = 0,
  otherCount = 0,
  activeCount = 0,
  suspendedCount = 0,
  bannedCount = 0,
  unverifiedCount = 0,
  loading = false,
}) {
  const total = Math.max(0, systemTotalUsers);

  // 1. Role Distribution Calculations (Admins vs Standard Users)
  const adminPct = total > 0 ? Math.round((adminCount / total) * 100) : 0;
  const userPct = total > 0 ? Math.max(0, 100 - adminPct) : 0;

  // 2. Email Verification Health (Verified vs Unverified)
  const verifiedPct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;
  const resolvedUnverified = unverifiedCount > 0 ? unverifiedCount : Math.max(0, total - verifiedCount);
  const unverifiedPct = total > 0 ? Math.max(0, 100 - verifiedPct) : 0;

  let healthStatus = { label: "High Health", type: "high" };
  if (verifiedPct < 50) {
    healthStatus = { label: "Attention Needed", type: "low" };
  } else if (verifiedPct < 80) {
    healthStatus = { label: "Moderate Health", type: "mid" };
  }

  // 3. Gender Distribution Calculations
  const malePct = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePct = total > 0 ? Math.round((femaleCount / total) * 100) : 0;
  const otherPct = total > 0 ? Math.max(0, 100 - malePct - femalePct) : 0;

  // Conic gradient for the Donut Chart (Verification Health)
  const donutDeg = (verifiedPct / 100) * 360;
  const donutBackground = `conic-gradient(#10b981 0deg ${donutDeg}deg, rgba(245, 158, 11, 0.3) ${donutDeg}deg 360deg)`;

  if (loading) {
    return (
      <div className="demographics-widget-container">
        <div className="demographics-grid">
          <div className="demographics-card skeleton-demo-card"></div>
          <div className="demographics-card skeleton-demo-card"></div>
          <div className="demographics-card skeleton-demo-card"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="demographics-widget-container" aria-label="Platform Demographics and Breakdown">
      {/* ── Section Header: System Composition & Breakdown ── */}
      <div className="dashboard-section-header demographics-top-bar">
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
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="section-header-content">
            <h3 className="section-header-title">System Composition & Breakdown</h3>
            <p className="section-header-sub">
              Live visual ratio of role permissions, verification compliance, and identity
            </p>
          </div>
        </div>

        <div className="section-header-right">
          <span className="section-header-badge">
            <span className="section-badge-dot"></span>
            <span className="font-mono">
              {total} {total === 1 ? "Account" : "Accounts"}
            </span>
          </span>
        </div>
      </div>

      {/* ── 3 Visual Breakdown Cards ── */}
      <div className="demographics-grid">
        {/* ══ 1. ROLE DISTRIBUTION CARD ══ */}
        <div className="demographics-card role-card">
          <div className="demo-card-head">
            <div className="demo-card-title-group">
              <span className="demo-card-label">Role Composition</span>
              <span className="demo-card-sub">Access privilege distribution</span>
            </div>
            <span className="demo-chip chip-purple font-mono">
              {adminPct}% Elevated
            </span>
          </div>

          <div className="demo-metric-row">
            <div className="demo-big-ratio">
              <span className="ratio-primary text-purple font-mono">{adminCount}</span>
              <span className="ratio-sep">Admins</span>
              <span className="ratio-divider">/</span>
              <span className="ratio-secondary text-blue font-mono">{userCount}</span>
              <span className="ratio-sep">Users</span>
            </div>
          </div>

          {/* Segmented Dual Progress Bar */}
          <div className="demo-progress-wrap" title={`Admins: ${adminPct}% • Standard Users: ${userPct}%`}>
            <div
              className="demo-progress-bar bar-purple"
              style={{ width: `${total > 0 ? Math.max(adminPct > 0 ? 8 : 0, adminPct) : 0}%` }}
            ></div>
            {userPct > 0 && (
              <div
                className="demo-progress-bar bar-blue"
                style={{ width: `${userPct}%` }}
              ></div>
            )}
          </div>

          {/* Legend Details */}
          <div className="demo-legend-row">
            <div className="demo-legend-item">
              <span className="legend-dot dot-purple"></span>
              <span className="legend-name">Platform Admins</span>
              <span className="legend-val font-mono">{adminCount} ({adminPct}%)</span>
            </div>
            <div className="demo-legend-item">
              <span className="legend-dot dot-blue"></span>
              <span className="legend-name">Standard Users</span>
              <span className="legend-val font-mono">{userCount} ({userPct}%)</span>
            </div>
          </div>
        </div>

        {/* ══ 2. VERIFICATION HEALTH CARD (DONUT CHART) ══ */}
        <div className="demographics-card health-card">
          <div className="demo-card-head">
            <div className="demo-card-title-group">
              <span className="demo-card-label">Verification Health</span>
              <span className="demo-card-sub">Email compliance rate</span>
            </div>
            <span className={`demo-chip chip-${healthStatus.type}`}>
              {healthStatus.label}
            </span>
          </div>

          <div className="demo-donut-layout">
            {/* Semantic Conic Donut Ring */}
            <div className="donut-wrapper">
              <div
                className="donut-ring"
                style={{ background: donutBackground }}
                role="progressbar"
                aria-valuenow={verifiedPct}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Verification rate ${verifiedPct}%`}
              >
                <div className="donut-cutout">
                  <span className="donut-percent font-mono">{verifiedPct}%</span>
                  <span className="donut-label">Verified</span>
                </div>
              </div>
            </div>

            {/* Donut Side Stats */}
            <div className="donut-details">
              <div className="donut-stat-box box-verified">
                <div className="donut-stat-header">
                  <span className="legend-dot dot-emerald"></span>
                  <span className="stat-box-title">Verified</span>
                </div>
                <div className="stat-box-number font-mono">{verifiedCount}</div>
                <span className="stat-box-sub font-mono">{verifiedPct}%</span>
              </div>

              <div className="donut-stat-box box-unverified">
                <div className="donut-stat-header">
                  <span className="legend-dot dot-amber"></span>
                  <span className="stat-box-title">Unverified</span>
                </div>
                <div className="stat-box-number font-mono">{resolvedUnverified}</div>
                <span className="stat-box-sub font-mono">{unverifiedPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 3. GENDER DIVERSITY CARD ══ */}
        <div className="demographics-card gender-card">
          <div className="demo-card-head">
            <div className="demo-card-title-group">
              <span className="demo-card-label">Gender Diversity</span>
              <span className="demo-card-sub">Identity distribution</span>
            </div>
            <span className="demo-chip chip-indigo">
              {maleCount > 0 || femaleCount > 0 ? "Reported" : "Neutral"}
            </span>
          </div>

          {/* Tri-segment Stacked Progress Bar */}
          <div
            className="demo-progress-wrap gender-progress-wrap"
            title={`Male: ${malePct}% • Female: ${femalePct}% • Other: ${otherPct}%`}
          >
            {maleCount > 0 && (
              <div
                className="demo-progress-bar bar-indigo"
                style={{ width: `${malePct}%` }}
              ></div>
            )}
            {femaleCount > 0 && (
              <div
                className="demo-progress-bar bar-rose"
                style={{ width: `${femalePct}%` }}
              ></div>
            )}
            {otherCount > 0 && (
              <div
                className="demo-progress-bar bar-teal"
                style={{ width: `${otherPct}%` }}
              ></div>
            )}
          </div>

          {/* 3 Metric Pills */}
          <div className="gender-pill-grid">
            <div className="gender-stat-pill pill-male">
              <div className="gender-pill-icon male">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="10" cy="14" r="5" />
                  <line x1="19" y1="5" x2="13.6" y2="10.4" />
                  <polyline points="15 5 19 5 19 9" />
                </svg>
              </div>
              <div className="gender-pill-meta">
                <span className="gender-pill-label">Male</span>
                <span className="gender-pill-val font-mono">{maleCount} ({malePct}%)</span>
              </div>
            </div>

            <div className="gender-stat-pill pill-female">
              <div className="gender-pill-icon female">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="9" r="5" />
                  <line x1="12" y1="14" x2="12" y2="21" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                </svg>
              </div>
              <div className="gender-pill-meta">
                <span className="gender-pill-label">Female</span>
                <span className="gender-pill-val font-mono">{femaleCount} ({femalePct}%)</span>
              </div>
            </div>

            <div className="gender-stat-pill pill-other">
              <div className="gender-pill-icon other">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="6" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                </svg>
              </div>
              <div className="gender-pill-meta">
                <span className="gender-pill-label">Other</span>
                <span className="gender-pill-val font-mono">{otherCount} ({otherPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemographicsWidget;
