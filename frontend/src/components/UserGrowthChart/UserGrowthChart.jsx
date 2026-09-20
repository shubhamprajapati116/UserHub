import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
    if (p1.data.displayCount === 0 && p2.data.displayCount === 0) {
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

// Helper to determine clean rounded Y-axis max
const getNiceMax = (val) => {
  if (val <= 0) return 4;
  if (val <= 4) return 4;
  if (val <= 8) return 8;
  if (val <= 12) return 12;
  if (val <= 20) return 20;
  if (val <= 40) return 40;
  if (val <= 100) return 100;
  if (val <= 200) return Math.ceil(val / 20) * 20;
  if (val <= 500) return Math.ceil(val / 50) * 50;
  return Math.ceil(val / 100) * 100;
};

// eslint-disable-next-line react-refresh/only-export-components
function UserGrowthChart() {
  const { userStore } = useStore();
  const [timeframe, setTimeframe] = useState("7d");
  const [growthMode, setGrowthMode] = useState("daily"); // "daily" | "cumulative"
  const [chartType, setChartType] = useState("line"); // "line" | "bar"
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const chartBodyRef = useRef(null);
  const svgRef = useRef(null);

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

  // ── Timeframe Options (Week, Month, 6 Months, 1 Year) ──
  const timeframeOptions = [
    { label: "Week", shortLabel: "7D", value: "7d" },
    { label: "Month", shortLabel: "30D", value: "30d" },
    { label: "6 Months", shortLabel: "6M", value: "6m" },
    { label: "1 Year", shortLabel: "1Y", value: "1y" },
  ];

  const rawData = analytics?.timeline || [];
  const totalUsers = analytics?.totalUsers || 0;
  const totalInWindow =
    analytics?.totalInWindow !== undefined
      ? analytics.totalInWindow
      : rawData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  // Baseline for cumulative calculation (users registered before this timeframe window)
  const baseline =
    analytics?.previousUsersCount !== undefined
      ? analytics.previousUsersCount
      : Math.max(0, totalUsers - totalInWindow);

  // ── Data Transformation: Calculate Daily and Cumulative Series ──
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    let runningCumulative = baseline;
    return rawData.map((item, index) => {
      const dailyCount = item.count || 0;
      runningCumulative += dailyCount;
      const cumulativeCount = runningCumulative;
      const displayCount =
        growthMode === "cumulative" ? cumulativeCount : dailyCount;

      return {
        ...item,
        dailyCount,
        cumulativeCount,
        displayCount,
        index,
      };
    });
  }, [rawData, baseline, growthMode]);

  // ── KPI Summary Calculations ──
  const kpiStats = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      return { totalPeriod: 0, peakDaily: 0, peakDate: "", avgDaily: "0.0", totalCumulative: 0 };
    }
    const totalPeriod = processedData.reduce((acc, curr) => acc + curr.dailyCount, 0);
    let peakDaily = 0;
    let peakDate = "";
    processedData.forEach((d) => {
      if (d.dailyCount >= peakDaily) {
        peakDaily = d.dailyCount;
        peakDate = d.label;
      }
    });
    const avgDaily =
      processedData.length > 0
        ? (totalPeriod / processedData.length).toFixed(1)
        : "0.0";
    const totalCumulative =
      processedData.length > 0
        ? processedData[processedData.length - 1].cumulativeCount
        : totalUsers;

    return { totalPeriod, peakDaily, peakDate, avgDaily, totalCumulative };
  }, [processedData, totalUsers]);

  // ── Responsive Dimensions ──
  const width = containerWidth || 800;
  const isMobile = width < 520;
  const isTablet = width >= 520 && width < 768;

  const height = isMobile ? 185 : isTablet ? 210 : 235;
  const paddingLeft = isMobile ? 32 : 40;
  const paddingRight = isMobile ? 14 : 22;
  const paddingTop = 26;
  const paddingBottom = 30;

  const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(10, height - paddingTop - paddingBottom);
  const baseY = paddingTop + chartHeight;

  // ── Dynamic Y-axis based on active display counts ──
  const maxDisplayVal = Math.max(...processedData.map((d) => d.displayCount), 0);
  const yMax = getNiceMax(maxDisplayVal);

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

  const getYPos = useCallback(
    (count) => {
      const ratio = Math.min(Math.max(count, 0) / yMax, 1);
      return baseY - ratio * chartHeight;
    },
    [baseY, chartHeight, yMax],
  );

  // ── Coordinates Mapping (Adapted for Line Spline vs Bar Columns) ──
  const nPoints = processedData.length;
  const slotWidth = nPoints > 0 ? chartWidth / nPoints : chartWidth;
  const barWidth = Math.max(4, Math.min(Math.floor(slotWidth * 0.54), 32));

  const points = processedData.map((d, index) => {
    // For line chart: points stretch across width; for bar chart: points are centered in each column slot
    const lineX =
      nPoints > 1
        ? paddingLeft + (index / (nPoints - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
    const barXCenter = paddingLeft + (index + 0.5) * slotWidth;

    const x = chartType === "bar" ? barXCenter : lineX;
    const y = getYPos(d.displayCount);

    return {
      x,
      y,
      lineX,
      barXCenter,
      barX: barXCenter - barWidth / 2,
      barWidth,
      slotWidth,
      data: d,
      index,
      isLast: index === nPoints - 1,
    };
  });

  const latestPoint = points.length > 0 ? points[points.length - 1] : null;

  // Compute Spline Paths
  const linePoints = points.map((p) => ({ ...p, x: p.lineX }));
  const linePath = getMonotoneSplinePath(linePoints, baseY);
  const areaPath =
    linePoints.length > 0
      ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${baseY} L ${linePoints[0].x} ${baseY} Z`
      : "";

  // ── X-Axis Ticks Generation (Zero Overlap Guarantee) ──
  let numTicks;
  if (timeframe === "7d") {
    numTicks = points.length;
  } else if (timeframe === "6m") {
    numTicks = points.length;
  } else if (timeframe === "1y") {
    numTicks = width >= 560 ? points.length : Math.min(points.length, 6);
  } else if (timeframe === "30d") {
    numTicks = width >= 640 ? Math.min(points.length, 8) : width >= 440 ? 5 : 4;
  } else {
    numTicks = Math.min(points.length, 6);
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

  const useShortLabel = timeframe === "1y" || timeframe === "6m";
  const formatXLabel = (rawLabel) => {
    if (!rawLabel) return "";
    if (useShortLabel && rawLabel.includes(" ")) return rawLabel.split(" ")[0];
    return rawLabel;
  };

  // ── Mobile Touch Support ──
  const handleTouchMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const touchX = touch.clientX - rect.left;

    let closest = points[0];
    let minDiff = Math.abs(points[0].x - touchX);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - touchX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }
    setHoveredPoint(closest);
  };

  // ── Smart Tooltip Placement ──
  let tooltipStyle = {};
  if (hoveredPoint) {
    const isNearTop = hoveredPoint.y < height * 0.38;
    const isNearRight = hoveredPoint.x > width - 110;
    const isNearLeft = hoveredPoint.x < 110;

    const translateX = isNearRight ? "-92%" : isNearLeft ? "-8%" : "-50%";
    const translateY = isNearTop ? "12px" : "-100%";
    const topPx = isNearTop ? hoveredPoint.y : Math.max(4, hoveredPoint.y - 8);

    tooltipStyle = {
      left: `${hoveredPoint.x}px`,
      top: `${topPx}px`,
      transform: `translate(${translateX}, ${translateY})`,
    };
  }

  return (
    <div className="growth-velocity-card">
      {/* ── Top Header Toolbar ── */}
      <div className="velocity-card-header">
        <div className="velocity-header-title-area">
          <div className="velocity-title-row">
            <h3 className="velocity-card-title">User Registration Growth</h3>
            {/* Quick Contextual KPI Badge */}
            <span className="velocity-kpi-badge">
              {growthMode === "cumulative" ? (
                <>
                  <span className="velocity-kpi-label">Total Users:</span>
                  <strong className="velocity-kpi-val">{kpiStats.totalCumulative}</strong>
                  {kpiStats.totalPeriod > 0 && (
                    <span className="velocity-kpi-growth">
                      (+{kpiStats.totalPeriod} in {timeframeOptions.find((t) => t.value === timeframe)?.label})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="velocity-kpi-label">Signups:</span>
                  <strong className="velocity-kpi-val">+{kpiStats.totalPeriod}</strong>
                  {kpiStats.peakDaily > 0 && (
                    <span className="velocity-kpi-sub">
                      (Peak: {kpiStats.peakDaily}/day)
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
        </div>

        {/* ── Controls Toolbar (Mode Switcher, Type Switcher, Timeframes) ── */}
        <div className="velocity-controls-bar">
          {/* 1. Growth Mode: Daily vs Cumulative Toggle */}
          <div
            className="velocity-segmented-group"
            role="group"
            aria-label="Registration Growth Mode"
          >
            <button
              type="button"
              className={`velocity-segment-btn ${growthMode === "daily" ? "active" : ""}`}
              onClick={() => setGrowthMode("daily")}
              title="View daily new signups"
            >
              <span>Daily</span>
            </button>
            <button
              type="button"
              className={`velocity-segment-btn ${growthMode === "cumulative" ? "active" : ""}`}
              onClick={() => setGrowthMode("cumulative")}
              title="View cumulative total user growth"
            >
              <span>Cumulative</span>
            </button>
          </div>

          {/* 2. Chart Type Switcher: Spline Line vs Bar Chart */}
          <div
            className="velocity-segmented-group type-switcher"
            role="group"
            aria-label="Chart Type"
          >
            <button
              type="button"
              className={`velocity-segment-btn icon-btn ${chartType === "line" ? "active" : ""}`}
              onClick={() => setChartType("line")}
              title="Spline Line Chart"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-8" />
              </svg>
              <span className="btn-label-desktop">Line</span>
            </button>
            <button
              type="button"
              className={`velocity-segment-btn icon-btn ${chartType === "bar" ? "active" : ""}`}
              onClick={() => setChartType("bar")}
              title="Bar Chart"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="7" width="4" height="14" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
              <span className="btn-label-desktop">Bar</span>
            </button>
          </div>

          {/* 3. Timeframe Options (7d, 30d, 6m, 1y) */}
          <div className="velocity-segmented-group timeframe-group" role="tablist">
            {timeframeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={timeframe === opt.value}
                className={`velocity-segment-btn ${timeframe === opt.value ? "active" : ""}`}
                onClick={() => setTimeframe(opt.value)}
              >
                <span className="btn-label-desktop">{opt.label}</span>
                <span className="btn-label-mobile">{opt.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart Canvas Body ── */}
      <div className="velocity-chart-body" ref={chartBodyRef}>
        {loading && !analytics ? (
          <div className="velocity-loading-state">
            <div className="velocity-spinner"></div>
            <span>Loading registration trends...</span>
          </div>
        ) : points.length === 0 ? (
          <div className="velocity-empty-state">
            <p>No registration activity found for this period.</p>
          </div>
        ) : (
          <div
            className="velocity-svg-wrapper"
            style={{ height: `${height}px` }}
          >
            {isUpdating && (
              <div className="velocity-updating-overlay">
                <div className="velocity-spinner-sm"></div>
              </div>
            )}

            <svg
              ref={svgRef}
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="velocity-svg"
              onMouseLeave={() => setHoveredPoint(null)}
              onTouchStart={handleTouchMove}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => {}}
            >
              <defs>
                {/* Luminous Area Gradient */}
                <linearGradient
                  id="velocityAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#5b7cf6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#4f6bf7" stopOpacity="0.16" />
                  <stop offset="95%" stopColor="#1e293b" stopOpacity="0.0" />
                </linearGradient>

                {/* Spline Line Gradient */}
                <linearGradient
                  id="velocityLineGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#6380f7" />
                  <stop offset="60%" stopColor="#7a96fc" />
                  <stop offset="100%" stopColor="#9cb3fd" />
                </linearGradient>

                {/* Bar Chart Default Gradient */}
                <linearGradient
                  id="velocityBarGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#7a96fc" />
                  <stop offset="100%" stopColor="#4f6bf7" stopOpacity="0.85" />
                </linearGradient>

                {/* Bar Chart Hover Gradient */}
                <linearGradient
                  id="velocityBarGradientHover"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#a5baff" />
                  <stop offset="100%" stopColor="#6380f7" />
                </linearGradient>

                {/* Soft Curve Drop Shadow Glow */}
                <filter
                  id="velocityGlowFilter"
                  x="-10%"
                  y="-10%"
                  width="120%"
                  height="120%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="4"
                    floodColor="#5b7cf6"
                    floodOpacity="0.35"
                  />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Left Y-Axis Values */}
              {yLevels.map((lvl, idx) => {
                const yPos = paddingTop + lvl.posPct * chartHeight;
                return (
                  <g key={`y-grid-${idx}`} className="velocity-grid-row">
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={width - paddingRight}
                      y2={yPos}
                      className="velocity-grid-line"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yPos + 3.5}
                      textAnchor="end"
                      className="velocity-axis-y-label"
                    >
                      {lvl.label}
                    </text>
                  </g>
                );
              })}

              {/* ── BAR CHART MODE RENDERING ── */}
              {chartType === "bar" && (
                <g className="velocity-bars-layer">
                  {points.map((pt, i) => {
                    const isHovered = hoveredPoint && hoveredPoint.index === i;
                    const isZero = pt.data.displayCount === 0;
                    const barH = isZero ? 2 : Math.max(3, baseY - pt.y);
                    const barY = isZero ? baseY - 2 : pt.y;
                    const cornerRadius = Math.min(4, Math.floor(pt.barWidth / 2));

                    return (
                      <g key={`bar-${i}`} className="velocity-bar-group">
                        <rect
                          x={pt.barX}
                          y={barY}
                          width={pt.barWidth}
                          height={barH}
                          rx={cornerRadius}
                          ry={cornerRadius}
                          fill={
                            isZero
                              ? "rgba(148, 163, 184, 0.25)"
                              : isHovered
                                ? "url(#velocityBarGradientHover)"
                                : "url(#velocityBarGradient)"
                          }
                          className={`velocity-bar-rect ${isZero ? "zero-bar" : ""} ${isHovered ? "active" : ""}`}
                        />

                        {/* Top Indicator Cap on Hover */}
                        {isHovered && !isZero && (
                          <rect
                            x={pt.barX}
                            y={barY}
                            width={pt.barWidth}
                            height={3}
                            rx={cornerRadius}
                            ry={cornerRadius}
                            fill="#ffffff"
                            className="velocity-bar-top-cap"
                          />
                        )}

                        {/* Wide Hit Area for Smooth Mouse/Touch Hover */}
                        <rect
                          x={pt.x - pt.slotWidth / 2}
                          y={paddingTop}
                          width={pt.slotWidth}
                          height={chartHeight + 8}
                          fill="transparent"
                          className="velocity-bar-target"
                          onMouseEnter={() => setHoveredPoint(pt)}
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ── SPLINE LINE MODE RENDERING ── */}
              {chartType === "line" && (
                <>
                  {/* Monotone Spline Gradient Area Fill */}
                  <path
                    d={areaPath}
                    fill="url(#velocityAreaGradient)"
                    className="velocity-area-path"
                  />

                  {/* Monotone Spline Stroke Curve */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#velocityLineGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#velocityGlowFilter)"
                    className="velocity-line-path"
                  />

                  {/* Live Pulse Beacon on Latest Point */}
                  {latestPoint && !hoveredPoint && (
                    <g className="velocity-latest-pulse-group">
                      <circle
                        cx={latestPoint.x}
                        cy={latestPoint.y}
                        r={timeframe === "30d" || timeframe === "1y" ? 7 : 9}
                        className="velocity-pulse-ring"
                      />
                      <circle
                        cx={latestPoint.x}
                        cy={latestPoint.y}
                        r={timeframe === "30d" || timeframe === "1y" ? 3 : 4}
                        className="velocity-pulse-core"
                      />
                    </g>
                  )}

                  {/* Data Points (Dots on Line) */}
                  {points.map((pt, i) => {
                    const isHovered = hoveredPoint && hoveredPoint.index === i;
                    const baseRadius =
                      timeframe === "30d" || timeframe === "1y" ? 2.5 : 3.6;
                    const activeRadius =
                      timeframe === "30d" || timeframe === "1y" ? 5 : 6;
                    const isZero = pt.data.displayCount === 0;

                    return (
                      <g key={`point-${i}`}>
                        {/* Visible Data Point Dot on the line */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? activeRadius : baseRadius}
                          className={`velocity-point-dot ${isHovered ? "active" : ""} ${isZero ? "zero-dot" : ""}`}
                        />

                        {/* Active Hover Halo Glow Ring */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={activeRadius + 6}
                            className="velocity-indicator-halo"
                          />
                        )}

                        {/* Interactive Magnetic Hover Target */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={timeframe === "30d" || timeframe === "1y" ? 12 : 18}
                          fill="transparent"
                          className="velocity-point-target"
                          onMouseEnter={() => setHoveredPoint(pt)}
                        />
                      </g>
                    );
                  })}
                </>
              )}

              {/* Crosshair Line On Active Hover */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop}
                  x2={hoveredPoint.x}
                  y2={baseY}
                  className="velocity-crosshair"
                />
              )}

              {/* X-Axis Date/Month Labels */}
              {points
                .map((pt, i) => ({ ...pt, originalIndex: i }))
                .filter((pt) => tickIndices.has(pt.originalIndex))
                .map((pt) => {
                  const isFirst = pt.originalIndex === 0;
                  const isLast = pt.originalIndex === points.length - 1;
                  const anchor =
                    chartType === "bar"
                      ? "middle"
                      : isFirst
                        ? "start"
                        : isLast
                          ? "end"
                          : "middle";
                  const xPos =
                    chartType === "bar"
                      ? pt.x
                      : isFirst
                        ? paddingLeft
                        : isLast
                          ? width - paddingRight
                          : pt.x;

                  return (
                    <text
                      key={`x-lbl-${pt.data.date || pt.data.label}-${pt.originalIndex}`}
                      x={xPos}
                      y={height - 10}
                      textAnchor={anchor}
                      className="velocity-axis-x-label"
                    >
                      {formatXLabel(pt.data.label)}
                    </text>
                  );
                })}
            </svg>

            {/* ── Floating Smart Tooltip ── */}
            {hoveredPoint && (
              <div className="velocity-tooltip-pill" style={tooltipStyle}>
                {growthMode === "cumulative" ? (
                  <div className="velocity-tooltip-content">
                    <span className="tooltip-main-val">
                      {hoveredPoint.data.cumulativeCount} total users
                    </span>
                    <span className="tooltip-sub-val">
                      on {hoveredPoint.data.label}
                      {hoveredPoint.data.dailyCount > 0 && (
                        <span className="tooltip-gain-tag">
                          {" "}(+{hoveredPoint.data.dailyCount} new)
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="velocity-tooltip-content">
                    <span className="tooltip-main-val">
                      {hoveredPoint.data.dailyCount > 0
                        ? `+${hoveredPoint.data.dailyCount} new user${hoveredPoint.data.dailyCount === 1 ? "" : "s"}`
                        : "0 new users"}
                    </span>
                    <span className="tooltip-sub-val">on {hoveredPoint.data.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default observer(UserGrowthChart);
