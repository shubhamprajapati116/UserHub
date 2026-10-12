import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import "./UserGrowthChart.css";

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
      tangents.push(0);
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

function UserGrowthChart() {
  const { userStore } = useStore();
  const [timeframe, setTimeframe] = useState("7d");
  const [growthMode, setGrowthMode] = useState("daily");
  const [chartType, setChartType] = useState("line");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const chartBodyRef = useRef(null);
  const svgRef = useRef(null);

  const analytics = userStore.userGrowthAnalytics;
  const isFetching = Boolean(userStore.loading.fetchGrowthAnalytics);

  const hasMatchingData = Boolean(
    analytics && analytics.timeframe === timeframe,
  );

  const isError = Boolean(userStore.error && !hasMatchingData && !isFetching);

  const isInitialLoading = !hasMatchingData && !isError;

  const isUpdating = isFetching && hasMatchingData;

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

  const timeframeOptions = [
    { label: "Week", shortLabel: "7D", value: "7d" },
    { label: "Month", shortLabel: "30D", value: "30d" },
    { label: "6 Months", shortLabel: "6M", value: "6m" },
    { label: "1 Year", shortLabel: "1Y", value: "1y" },
  ];

  const rawData = useMemo(
    () => (hasMatchingData ? analytics?.timeline || [] : []),
    [hasMatchingData, analytics?.timeline],
  );
  const totalUsers = hasMatchingData ? analytics?.totalUsers || 0 : 0;
  const totalInWindow =
    hasMatchingData && analytics?.totalInWindow !== undefined
      ? analytics.totalInWindow
      : rawData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const baseline =
    analytics?.previousUsersCount !== undefined
      ? analytics.previousUsersCount
      : Math.max(0, totalUsers - totalInWindow);

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

  const kpiStats = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      return {
        totalPeriod: 0,
        peakDaily: 0,
        peakDate: "",
        avgDaily: "0.0",
        totalCumulative: 0,
      };
    }
    const totalPeriod = processedData.reduce(
      (acc, curr) => acc + curr.dailyCount,
      0,
    );
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

  const maxDisplayVal = Math.max(
    ...processedData.map((d) => d.displayCount),
    0,
  );
  const yMax = getNiceMax(maxDisplayVal);

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

  const nPoints = processedData.length;
  const slotWidth = nPoints > 0 ? chartWidth / nPoints : chartWidth;
  const barWidth = Math.max(4, Math.min(Math.floor(slotWidth * 0.54), 32));

  const points = processedData.map((d, index) => {
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

  const linePoints = points.map((p) => ({ ...p, x: p.lineX }));
  const linePath = getMonotoneSplinePath(linePoints, baseY);
  const areaPath =
    linePoints.length > 0
      ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${baseY} L ${linePoints[0].x} ${baseY} Z`
      : "";

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
      <div className="velocity-card-header">
        <div className="velocity-header-title-area">
          <div className="velocity-title-row">
            <h3 className="velocity-card-title">User Registration Growth</h3>
            <span
              className={`velocity-kpi-badge ${isInitialLoading ? "loading" : ""}`}
            >
              {isInitialLoading ? (
                <span className="velocity-kpi-skeleton-wrap">
                  <span className="velocity-spinner-xs" />
                  <span className="velocity-kpi-skeleton-text">
                    Loading trends...
                  </span>
                </span>
              ) : growthMode === "cumulative" ? (
                <>
                  <span className="velocity-kpi-label">Total Users:</span>
                  <strong className="velocity-kpi-val">
                    {kpiStats.totalCumulative}
                  </strong>
                  {kpiStats.totalPeriod > 0 && (
                    <span className="velocity-kpi-growth">
                      (+{kpiStats.totalPeriod} in{" "}
                      {
                        timeframeOptions.find((t) => t.value === timeframe)
                          ?.label
                      }
                      )
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="velocity-kpi-label">Signups:</span>
                  <strong className="velocity-kpi-val">
                    +{kpiStats.totalPeriod}
                  </strong>
                  {kpiStats.peakDaily > 0 && (
                    <span className="velocity-kpi-sub">
                      (Peak: {kpiStats.peakDaily}/
                      {timeframe === "6m" || timeframe === "1y" ? "mo" : "day"})
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
        </div>

        <div className="velocity-controls-bar">
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

          <div
            className="velocity-segmented-group timeframe-group"
            role="tablist"
          >
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

      <div className="velocity-chart-body" ref={chartBodyRef}>
        {isInitialLoading ? (
          <div
            className="velocity-chart-skeleton"
            style={{ height: `${height}px` }}
            aria-busy="true"
            aria-label="Loading registration trends"
          >
            <div className="velocity-skeleton-grid">
              {[0, 1, 2, 3].map((lvl) => (
                <div
                  key={lvl}
                  className="velocity-skeleton-gridline"
                  style={{ top: `${lvl * 25}%` }}
                >
                  <span className="velocity-skeleton-y-pill" />
                </div>
              ))}
            </div>

            <div className="velocity-skeleton-wave-wrap">
              <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="velocity-skeleton-svg"
                preserveAspectRatio="none"
              >
                <path
                  d={`M ${paddingLeft} ${height * 0.78} C ${width * 0.26} ${height * 0.65}, ${width * 0.45} ${height * 0.35}, ${width * 0.65} ${height * 0.55} C ${width * 0.8} ${height * 0.7}, ${width * 0.9} ${height * 0.25}, ${width - paddingRight} ${height * 0.3}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="velocity-skeleton-wave-path"
                />
              </svg>
            </div>

            <div className="velocity-skeleton-loader-badge">
              <div className="velocity-spinner-ring" />
              <div className="velocity-skeleton-text-group">
                <span className="velocity-loader-title">
                  Loading Registration Analytics
                </span>
                <span className="velocity-loader-sub">
                  Fetching{" "}
                  {timeframeOptions.find((t) => t.value === timeframe)?.label}{" "}
                  trends...
                </span>
              </div>
            </div>

            <div
              className="velocity-skeleton-x-ticks"
              style={{ paddingLeft, paddingRight }}
            >
              {Array.from({ length: isMobile ? 4 : isTablet ? 6 : 8 }).map(
                (_, i) => (
                  <span key={i} className="velocity-skeleton-x-pill" />
                ),
              )}
            </div>
          </div>
        ) : isError ? (
          <div
            className="velocity-error-state"
            style={{ minHeight: `${height}px` }}
          >
            <div className="velocity-error-icon">!</div>
            <p className="velocity-error-msg">
              Failed to load registration trends.
            </p>
            <button
              type="button"
              className="velocity-retry-btn"
              onClick={() => userStore.fetchUserGrowthAnalytics(timeframe)}
            >
              Retry
            </button>
          </div>
        ) : points.length === 0 ? (
          <div
            className="velocity-empty-state"
            style={{ minHeight: `${height}px` }}
          >
            <div className="velocity-empty-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
            </div>
            <p className="velocity-empty-title">
              No registration activity in this timeframe
            </p>
            <span className="velocity-empty-sub">
              Try selecting a broader timeframe like 30D or 1 Year
            </span>
          </div>
        ) : (
          <div
            className="velocity-svg-wrapper"
            style={{ height: `${height}px` }}
          >
            {isUpdating && (
              <div className="velocity-updating-backdrop">
                <div className="velocity-updating-pill">
                  <div className="velocity-spinner-sm" />
                  <span>
                    Updating{" "}
                    {timeframeOptions.find((t) => t.value === timeframe)?.label}
                    ...
                  </span>
                </div>
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

              {chartType === "bar" && (
                <g className="velocity-bars-layer">
                  {points.map((pt, i) => {
                    const isHovered = hoveredPoint && hoveredPoint.index === i;
                    const isZero = pt.data.displayCount === 0;
                    const barH = isZero ? 2 : Math.max(3, baseY - pt.y);
                    const barY = isZero ? baseY - 2 : pt.y;
                    const cornerRadius = Math.min(
                      4,
                      Math.floor(pt.barWidth / 2),
                    );

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

              {chartType === "line" && (
                <>
                  <path
                    d={areaPath}
                    fill="url(#velocityAreaGradient)"
                    className="velocity-area-path"
                  />

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

                  {latestPoint && !hoveredPoint && (
                    <g className="velocity-latest-pulse-group">
                      <circle
                        cx={latestPoint.x}
                        cy={latestPoint.y}
                        r={timeframe === "30d" ? 7 : 9}
                        className="velocity-pulse-ring"
                      />
                      <circle
                        cx={latestPoint.x}
                        cy={latestPoint.y}
                        r={timeframe === "30d" ? 3 : 4}
                        className="velocity-pulse-core"
                      />
                    </g>
                  )}

                  {points.map((pt, i) => {
                    const isHovered = hoveredPoint && hoveredPoint.index === i;
                    const baseRadius =
                      timeframe === "30d"
                        ? 2.5
                        : timeframe === "1y"
                          ? 3.0
                          : 3.6;
                    const activeRadius = timeframe === "30d" ? 5 : 6;
                    const isZero = pt.data.displayCount === 0;

                    return (
                      <g key={`point-${i}`}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? activeRadius : baseRadius}
                          className={`velocity-point-dot ${isHovered ? "active" : ""} ${isZero ? "zero-dot" : ""}`}
                        />

                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={activeRadius + 6}
                            className="velocity-indicator-halo"
                          />
                        )}

                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={timeframe === "30d" ? 12 : 16}
                          fill="transparent"
                          className="velocity-point-target"
                          onMouseEnter={() => setHoveredPoint(pt)}
                        />
                      </g>
                    );
                  })}
                </>
              )}

              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop}
                  x2={hoveredPoint.x}
                  y2={baseY}
                  className="velocity-crosshair"
                />
              )}

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

            {hoveredPoint && (
              <div className="velocity-tooltip-pill" style={tooltipStyle}>
                {growthMode === "cumulative" ? (
                  <div className="velocity-tooltip-content">
                    <span className="tooltip-main-val">
                      {hoveredPoint.data.cumulativeCount} total users
                    </span>
                    <span className="tooltip-sub-val">
                      {timeframe === "6m" || timeframe === "1y" ? "in " : "on "}
                      {hoveredPoint.data.label}
                      {hoveredPoint.data.dailyCount > 0 && (
                        <span className="tooltip-gain-tag">
                          {" "}
                          (+{hoveredPoint.data.dailyCount} new)
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
                    <span className="tooltip-sub-val">
                      {timeframe === "6m" || timeframe === "1y" ? "in " : "on "}
                      {hoveredPoint.data.label}
                    </span>
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
