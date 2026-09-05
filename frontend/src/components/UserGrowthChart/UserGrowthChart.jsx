import { useState, useEffect, useRef, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import "./UserGrowthChart.css";

// ── Monotone Cubic Spline (Fritsch-Carlson) ──
// Prevents overshooting, negative dips below baseline, and sharp needle loops
function getMonotoneSplinePath(points, baseY) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const n = points.length;
  const dx = [];
  const dy = [];
  const m = [];

  for (let i = 0; i < n - 1; i++) {
    const dX = points[i + 1].x - points[i].x;
    const dY = points[i + 1].y - points[i].y;
    dx.push(dX);
    dy.push(dY);
    m.push(dX === 0 ? 0 : dY / dX);
  }

  const tangents = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tangents.push(0); // Flat tangent at local extrema
    } else {
      const p = (dx[i - 1] * m[i] + dx[i] * m[i - 1]) / (dx[i - 1] + dx[i]);
      tangents.push(p);
    }
  }
  tangents.push(m[m.length - 1]);

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dX = dx[i];

    const cp1x = p1.x + dX / 3;
    let cp1y = p1.y + (tangents[i] * dX) / 3;

    const cp2x = p2.x - dX / 3;
    let cp2y = p2.y - (tangents[i + 1] * dX) / 3;

    // Strict clamp: never dip below baseline (higher Y coordinate in SVG)
    if (p1.data.count === 0 && p2.data.count === 0) {
      cp1y = baseY;
      cp2y = baseY;
    } else {
      cp1y = Math.min(baseY, cp1y);
      cp2y = Math.min(baseY, cp2y);
    }

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

// eslint-disable-next-line react-refresh/only-export-components
function UserGrowthChart() {
  const { userStore } = useStore();
  const [timeframe, setTimeframe] = useState("30d");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const dropdownRef = useRef(null);
  const chartBodyRef = useRef(null);

  const analytics = userStore.userGrowthAnalytics;
  const loading = userStore.loading.fetchAnalytics;

  // Synchronous detection: true if API is fetching OR user selected a new timeframe whose data hasn't arrived yet.
  const isStale = analytics && analytics.timeframe !== timeframe;
  const isUpdating = loading || isStale;

  // Measure actual container width so 1 SVG unit = 1 physical screen pixel
  useEffect(() => {
    const el = chartBodyRef.current;
    if (!el) return;

    const measure = () => {
      if (el) {
        const w = Math.round(el.getBoundingClientRect().width);
        if (w > 0) setContainerWidth(w);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    userStore.fetchUserGrowthAnalytics(timeframe);
  }, [timeframe, userStore]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeframeOptions = [
    { label: "Last 7 Days", value: "7d" },
    { label: "This Month", value: "30d" },
    { label: "Last 6 Months", value: "6m" },
    { label: "This Year", value: "1y" },
  ];

  const currentOption =
    timeframeOptions.find((opt) => opt.value === timeframe) ||
    timeframeOptions[1];

  const rawData = analytics?.timeline || [];

  // ── KPI Summary Calculations (Peak, Average, Total) ──
  const kpiStats = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return { total: 0, peak: 0, peakDate: "", avgDaily: "0.0" };
    }
    const total = rawData.reduce((acc, curr) => acc + (curr.count || 0), 0);
    let peak = 0;
    let peakDate = "";
    rawData.forEach((d) => {
      if (d.count >= peak) {
        peak = d.count;
        peakDate = d.label;
      }
    });
    const avg = rawData.length > 0 ? (total / rawData.length).toFixed(1) : "0.0";
    return { total, peak, peakDate, avgDaily: avg };
  }, [rawData]);

  // ── Responsive Dimensions ──
  const width = containerWidth || 800;
  const height = width < 480 ? 175 : width < 768 ? 210 : 230;

  const paddingLeft = width < 480 ? 28 : 36;
  const paddingRight = width < 480 ? 14 : 22;
  const paddingTop = 26;
  const paddingBottom = 30;

  const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(10, height - paddingTop - paddingBottom);
  const baseY = paddingTop + chartHeight;

  // ── Dynamic Y-axis based on actual data max ──
  const maxCount = Math.max(...rawData.map((d) => d.count), 0);

  const getNiceMax = (val) => {
    if (val <= 0) return 4;
    if (val <= 4) return 4;
    if (val <= 8) return 8;
    if (val <= 12) return 12;
    if (val <= 20) return 20;
    if (val <= 40) return 40;
    if (val <= 100) return 100;
    return Math.ceil(val / 20) * 20;
  };
  const yMax = getNiceMax(maxCount);

  // 5 clean, evenly-spaced integer gridlines from 0 → yMax
  const yLevels = [];
  const stepsCount = 4;
  const stepVal = yMax / stepsCount;
  for (let i = 0; i <= stepsCount; i++) {
    yLevels.push({
      label: Math.round(i * stepVal),
      posPct: 1 - i / stepsCount,
    });
  }

  const getYPos = (count) => {
    const ratio = Math.min(Math.max(count, 0) / yMax, 1);
    return baseY - ratio * chartHeight;
  };

  const points = rawData.map((d, index) => ({
    x:
      rawData.length > 1
        ? paddingLeft + (index / (rawData.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2,
    y: getYPos(d.count),
    data: d,
    isLast: index === rawData.length - 1,
  }));

  const linePath = getMonotoneSplinePath(points, baseY);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
      : "";

  // ── X-Axis Ticks Generation (Zero Overlap Guarantee) ──
  const activeTf = timeframe === "this_month" ? "30d" : timeframe;
  let numTicks;
  if (activeTf === "7d" || activeTf === "6m") {
    numTicks = points.length;
  } else if (activeTf === "1y") {
    numTicks = width >= 480 ? points.length : Math.min(points.length, 6);
  } else if (activeTf === "30d") {
    numTicks = width >= 560 ? Math.min(points.length, 7) : Math.min(points.length, 4);
  } else {
    numTicks = Math.min(points.length, 7);
  }

  const tickIndices = new Set();
  if (points.length <= numTicks) {
    points.forEach((_, i) => tickIndices.add(i));
  } else {
    for (let k = 0; k < numTicks; k++) {
      const idx = Math.round((k * (points.length - 1)) / (numTicks - 1));
      tickIndices.add(idx);
    }
  }

  const useShortLabel = activeTf === "1y" || activeTf === "6m";
  const formatXLabel = (rawLabel) => {
    if (!rawLabel) return "";
    if (useShortLabel && rawLabel.includes(" ")) return rawLabel.split(" ")[0];
    return rawLabel;
  };

  // ── Smart Tooltip Placement ──
  let tooltipStyle = {};
  let isNearTop = false;
  if (hoveredPoint) {
    isNearTop = hoveredPoint.y < height * 0.38;
    const isNearRight = hoveredPoint.x > width - 85;
    const isNearLeft = hoveredPoint.x < 85;

    const translateX = isNearRight ? "-92%" : isNearLeft ? "-8%" : "-50%";
    const translateY = isNearTop ? "12px" : "-100%";
    const topPx = isNearTop ? hoveredPoint.y : Math.max(4, hoveredPoint.y - 8);

    tooltipStyle = {
      left: `${hoveredPoint.x}px`,
      top: `${topPx}px`,
      transform: `translate(${translateX}, ${translateY})`,
    };
  }

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 800
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobileScreen = windowWidth < 520;
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="growth-chart-card">
      {/* ── World-Class Pro Header with KPI Chips ── */}
      <div className="growth-chart-header">
        <div className="growth-chart-header-left">
          <div className="growth-title-row">
            <div className="growth-title-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <h3 className="growth-chart-title">User Growth Analytics</h3>
            <span className="growth-live-badge">
              <span className="growth-beacon-dot"></span>
              LIVE
            </span>
          </div>

          {/* ── Quick KPI Stat Chips (Linear Style) ── */}
          <div className="growth-kpi-chips">
            <div className="growth-kpi-chip primary-chip">
              <span className="kpi-chip-label">Total in window:</span>
              <span className="kpi-chip-val">
                {isUpdating ? "..." : `+${kpiStats.total}`}
              </span>
            </div>
            <div className="growth-kpi-chip">
              <span className="kpi-chip-icon">⚡</span>
              <span className="kpi-chip-label">Peak:</span>
              <span className="kpi-chip-val">
                {isUpdating ? "..." : `${kpiStats.peak} users`}
              </span>
            </div>
            <div className="growth-kpi-chip">
              <span className="kpi-chip-icon">📊</span>
              <span className="kpi-chip-label">Avg:</span>
              <span className="kpi-chip-val">
                {isUpdating ? "..." : `${kpiStats.avgDaily}/day`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Timeframe Dropdown ── */}
        {!isMobileScreen && (
          <div className="growth-timeframe-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="growth-timeframe-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{currentOption.label}</span>
              <svg
                className={`growth-chevron ${dropdownOpen ? "open" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="growth-timeframe-menu">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`growth-timeframe-item ${opt.value === timeframe ? "active" : ""}`}
                    onClick={() => {
                      setTimeframe(opt.value);
                      setDropdownOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.value === timeframe && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Chart Canvas Body ── */}
      <div className="growth-chart-body" ref={chartBodyRef}>
        {isMobileScreen ? (
          <div className="growth-chart-mobile-notice">
            <div className="mobile-notice-icon-box">
              <svg
                width="24"
                height="24"
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
            </div>
            <div className="mobile-notice-content">
              <h4 className="mobile-notice-title">Desktop & Tablet View</h4>
              <p className="mobile-notice-desc">
                Interactive growth curves and detailed daily scrubbers are optimized for larger screens.
              </p>
            </div>
          </div>
        ) : loading && !analytics ? (
          <div className="growth-chart-skeleton">
            <div className="growth-spinner"></div>
            <span>Loading analytics...</span>
          </div>
        ) : userStore.error && !analytics ? (
          <div className="growth-chart-empty">
            <p>Could not load chart data. Please refresh.</p>
          </div>
        ) : points.length === 0 ? (
          <div className="growth-chart-empty">
            <p>No user activity recorded for this period.</p>
          </div>
        ) : (
          <div
            className="growth-svg-container"
            style={{ height: `${height}px` }}
          >
            {/* Instant 0ms Synchronous Loading Overlay */}
            {isUpdating && (
              <div className="growth-chart-loading-overlay">
                <div className="growth-spinner"></div>
                <span>Updating analytics...</span>
              </div>
            )}

            <svg
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="growth-svg"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                {/* Modern Dual Gradient Area Fill */}
                <linearGradient
                  id="proGrowthAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                  <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.12" />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>

                {/* Electric Vibrant Spline Line Gradient */}
                <linearGradient
                  id="proGrowthLineGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="45%" stopColor="#818cf8" />
                  <stop offset="85%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>

                {/* Glow Filter for Dark Mode Line */}
                <filter
                  id="proLineGlow"
                  x="-10%"
                  y="-10%"
                  width="120%"
                  height="120%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="4"
                    floodColor="#6366f1"
                    floodOpacity="0.25"
                  />
                </filter>
              </defs>

              {/* Horizontal Clean Gridlines & Y-Axis Numbers */}
              {yLevels.map((lvl, idx) => {
                const yPos = paddingTop + lvl.posPct * chartHeight;
                return (
                  <g key={`y-grid-${idx}`} className="growth-grid-line-group">
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={width - paddingRight}
                      y2={yPos}
                      className="growth-grid-line"
                    />
                    <text
                      x={paddingLeft - 9}
                      y={yPos + 3.5}
                      textAnchor="end"
                      className="growth-axis-label y-axis"
                    >
                      {lvl.label}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path
                d={areaPath}
                fill="url(#proGrowthAreaGradient)"
                className="growth-area-path"
              />

              {/* Spline Line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#proGrowthLineGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#proLineGlow)"
                className="growth-line-path"
              />

              {/* Active Hover Crosshair Line */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop}
                  x2={hoveredPoint.x}
                  y2={baseY}
                  className="growth-crosshair-line"
                />
              )}

              {/* Live Pulse Beacon on Latest Point */}
              {latestPoint && !hoveredPoint && (
                <g className="growth-latest-pulse-group">
                  <circle
                    cx={latestPoint.x}
                    cy={latestPoint.y}
                    r="9"
                    className="growth-pulse-ring"
                  />
                  <circle
                    cx={latestPoint.x}
                    cy={latestPoint.y}
                    r="4"
                    className="growth-pulse-core"
                  />
                </g>
              )}

              {/* Data Points (Dots on Line) */}
              {points.map((pt, i) => {
                const isHovered =
                  hoveredPoint && hoveredPoint.data.date === pt.data.date;
                return (
                  <g key={i}>
                    {/* Visual Point */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : pt.data.count > 0 ? 3.5 : 2}
                      className={`growth-point-dot ${isHovered ? "active" : ""} ${pt.data.count === 0 ? "zero-dot" : ""}`}
                    />

                    {/* Interactive Magnetic Hover Target */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={16}
                      fill="transparent"
                      className="growth-point-target"
                      onMouseEnter={() => setHoveredPoint(pt)}
                    />
                  </g>
                );
              })}

              {/* X-Axis Dates Labels */}
              {points
                .map((pt, i) => ({ ...pt, originalIndex: i }))
                .filter((pt) => tickIndices.has(pt.originalIndex))
                .map((pt) => {
                  const isFirst = pt.originalIndex === 0;
                  const isLast = pt.originalIndex === points.length - 1;
                  const anchor = isFirst ? "start" : isLast ? "end" : "middle";
                  const xPos = isFirst
                    ? paddingLeft
                    : isLast
                      ? width - paddingRight
                      : pt.x;

                  return (
                    <text
                      key={`x-lbl-${pt.data.date || pt.data.label}-${pt.originalIndex}`}
                      x={xPos}
                      y={height - 8}
                      textAnchor={anchor}
                      className="growth-axis-label x-axis"
                    >
                      {formatXLabel(pt.data.label)}
                    </text>
                  );
                })}
            </svg>

            {/* ── Rich Floating Glass Tooltip ── */}
            {hoveredPoint && (
              <div
                className={`growth-tooltip ${isNearTop ? "top-flip" : ""}`}
                style={tooltipStyle}
              >
                <div className="growth-tooltip-header">
                  <span className="tooltip-cal-icon">📅</span>
                  <span>{hoveredPoint.data.label}</span>
                </div>
                <div className="growth-tooltip-body">
                  <span className="tooltip-dot"></span>
                  <span className="tooltip-value">
                    <b>{hoveredPoint.data.count}</b>{" "}
                    {hoveredPoint.data.count === 1 ? "User Registered" : "Users Registered"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default observer(UserGrowthChart);
