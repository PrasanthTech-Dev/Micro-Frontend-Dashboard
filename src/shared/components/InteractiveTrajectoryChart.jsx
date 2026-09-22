import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Calendar, Zap, TrendingUp } from 'lucide-react';

/**
 * Generates a smooth Catmull-Rom / Monotone cubic bezier path through coordinate points.
 */
function getMonotoneSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function InteractiveTrajectoryChart({
  data = [],
  height = 270,
  timeframe = '30d',
  metricLabel = 'Actual Revenue',
  targetLabel = 'Target Baseline',
  valuePrefix = '$',
  colorScheme = 'indigo', // 'indigo', 'cyan', 'emerald'
  showTarget = true,
  showArea = true,
  livePulse = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const [hoverState, setHoverState] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // Trigger line drawing animation when data or timeframe changes
  useEffect(() => {
    setAnimKey((prev) => prev + 1);
  }, [timeframe, data?.length]);

  // Dimensions & Coordinate space
  const viewBoxWidth = 800;
  const viewBoxHeight = 260;
  const padding = { top: 35, right: 35, bottom: 40, left: 65 };

  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  // Compute scale boundaries
  const { maxVal, minVal, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxVal: 100000, minVal: 0, yTicks: [0, 25000, 50000, 75000, 100000] };
    }
    const allVals = [];
    data.forEach((d) => {
      if (typeof d.actual === 'number') allVals.push(d.actual);
      if (typeof d.target === 'number' && showTarget) allVals.push(d.target);
    });
    const rawMax = Math.max(...allVals, 1000);
    const rawMin = Math.min(...allVals, 0);

    // Give headroom for on-line value badges
    const upperLimit = Math.ceil((rawMax * 1.18) / 1000) * 1000;
    const lowerLimit = Math.max(0, Math.floor((rawMin * 0.85) / 1000) * 1000);

    const step = (upperLimit - lowerLimit) / 4;
    const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(lowerLimit + i * step));

    return { maxVal: upperLimit, minVal: lowerLimit, yTicks: ticks };
  }, [data, showTarget]);

  // Map data to coordinate points
  const { actualPoints, targetPoints, mappedData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { actualPoints: [], targetPoints: [], mappedData: [] };
    }

    const valRange = maxVal - minVal || 1;
    const count = data.length;

    const mapped = data.map((item, i) => {
      const x = padding.left + (i / Math.max(1, count - 1)) * plotWidth;
      const yActual = padding.top + plotHeight - ((item.actual - minVal) / valRange) * plotHeight;
      const yTarget = item.target !== undefined
        ? padding.top + plotHeight - ((item.target - minVal) / valRange) * plotHeight
        : yActual;

      return {
        ...item,
        index: i,
        x,
        yActual,
        yTarget,
      };
    });

    const actPts = mapped.map((m) => ({ x: m.x, y: m.yActual }));
    const tgtPts = mapped.map((m) => ({ x: m.x, y: m.yTarget }));

    return { actualPoints: actPts, targetPoints: tgtPts, mappedData: mapped };
  }, [data, maxVal, minVal, padding.left, padding.top, plotHeight, plotWidth]);

  // Spline paths
  const actualPathD = useMemo(() => getMonotoneSplinePath(actualPoints), [actualPoints]);
  const targetPathD = useMemo(() => getMonotoneSplinePath(targetPoints), [targetPoints]);

  const areaPathD = useMemo(() => {
    if (actualPoints.length < 2) return '';
    const first = actualPoints[0];
    const last = actualPoints[actualPoints.length - 1];
    const baselineY = padding.top + plotHeight;
    return `${actualPathD} L ${last.x.toFixed(2)},${baselineY} L ${first.x.toFixed(2)},${baselineY} Z`;
  }, [actualPathD, actualPoints, padding.top, plotHeight]);

  // Continuous pointer tracking across the chart
  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current || mappedData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const mousePx = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mousePx / rect.width));
    const targetSvgX = ratio * viewBoxWidth;

    // Find closest data slice
    let closest = mappedData[0];
    let minDiff = Infinity;
    for (const pt of mappedData) {
      const diff = Math.abs(pt.x - targetSvgX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    setHoverState({
      point: closest,
      pixelX: (closest.x / viewBoxWidth) * rect.width,
      pixelY: (closest.yActual / viewBoxHeight) * rect.height,
      svgX: closest.x,
      svgYActual: closest.yActual,
      svgYTarget: closest.yTarget,
      rawClientX: clientX,
      rawClientY: clientY,
    });
  }, [mappedData, viewBoxHeight, viewBoxWidth]);

  const handlePointerLeave = useCallback(() => {
    setHoverState(null);
  }, []);

  const formatValue = (num) => {
    if (num >= 1000000) return `${valuePrefix}${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${valuePrefix}${(num / 1000).toFixed(1)}k`;
    return `${valuePrefix}${num?.toLocaleString() || 0}`;
  };

  const formatFullValue = (num) => {
    return `${valuePrefix}${num?.toLocaleString() || 0}`;
  };

  const lastPoint = mappedData.length > 0 ? mappedData[mappedData.length - 1] : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${className}`}
      style={{ height: `${height}px` }}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerLeave}
    >
      <svg
        key={`chart-svg-${animKey}`}
        className="w-full h-full overflow-visible"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Indigo area fill gradient */}
          <linearGradient id={`areaGrad-${colorScheme}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="65%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>

          {/* Cyan target accent gradient */}
          <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>

          {/* Vertical scrubber line glow gradient */}
          <linearGradient id="scrubberGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>

          {/* Subtle drop shadow for floating indicator */}
          <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.35" floodColor="#000" />
          </filter>
        </defs>

        {/* Horizontal Grid lines & Y-Axis Labels */}
        {yTicks.map((val, idx) => {
          const valRange = maxVal - minVal || 1;
          const y = padding.top + plotHeight - ((val - minVal) / valRange) * plotHeight;
          return (
            <g key={`grid-${idx}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={viewBoxWidth - padding.right}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800/80"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 12}
                y={y + 3.5}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px] select-none"
              >
                {formatValue(val)}
              </text>
            </g>
          );
        })}

        {/* X-Axis bottom baseline */}
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={viewBoxWidth - padding.right}
          y2={padding.top + plotHeight}
          className="stroke-slate-300 dark:stroke-slate-700/80"
          strokeWidth="1"
        />

        {/* X-Axis Labels */}
        {mappedData.map((pt, i) => {
          // Show sparse labels to prevent crowding
          const total = mappedData.length;
          const showLabel =
            total <= 8 ||
            i === 0 ||
            i === total - 1 ||
            (total > 8 && i % Math.ceil(total / 6) === 0);

          if (!showLabel) return null;

          return (
            <text
              key={`xlabel-${i}`}
              x={pt.x}
              y={padding.top + plotHeight + 20}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px] select-none font-medium"
            >
              {pt.label}
            </text>
          );
        })}

        {/* Area Gradient Fill (Animated) */}
        {showArea && areaPathD && (
          <path
            d={areaPathD}
            fill={`url(#areaGrad-${colorScheme})`}
            className="chart-animate-area pointer-events-none"
          />
        )}

        {/* Target Benchmark Curve (Dashed Cyan) */}
        {showTarget && targetPathD && (
          <path
            d={targetPathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.2"
            strokeDasharray="5 5"
            strokeLinecap="round"
            className="chart-animate-line opacity-80 pointer-events-none"
          />
        )}

        {/* Primary Actual Line Curve (Animated Spline Drawing) */}
        {actualPathD && (
          <path
            d={actualPathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-animate-line pointer-events-none filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.35)]"
          />
        )}

        {/* Static Milestone Data Points along the curve */}
        {mappedData.map((pt, idx) => {
          const isSelected = hoverState?.point?.index === idx;
          return (
            <circle
              key={`milestone-${idx}`}
              cx={pt.x}
              cy={pt.yActual}
              r={isSelected ? 6 : 4}
              className={`fill-white dark:fill-slate-900 stroke-indigo-500 transition-all duration-200 pointer-events-none ${
                isSelected ? 'stroke-[3.5px] scale-125' : 'stroke-2'
              }`}
            />
          );
        })}

        {/* Pulsing Live Telemetry Beacon on the latest point */}
        {lastPoint && (
          <g transform={`translate(${lastPoint.x}, ${lastPoint.yActual})`} className="pointer-events-none">
            <circle r="4.5" fill="#6366f1" />
            <circle
              r="10"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              className="chart-radar-ping"
            />
          </g>
        )}

        {/* ACTIVE HOVER STATE: Continuous Scrubber, Intersection Dots, and On-Line Value Display */}
        {hoverState && hoverState.point && (
          <g className="pointer-events-none transition-all duration-75">
            {/* Vertical Scrubber Guide Line across the entire chart */}
            <line
              x1={hoverState.svgX}
              y1={padding.top - 5}
              x2={hoverState.svgX}
              y2={padding.top + plotHeight}
              stroke="url(#scrubberGlow)"
              strokeWidth="1.75"
              strokeDasharray="4 3"
            />

            {/* Target intersection point */}
            {showTarget && (
              <g>
                <circle
                  cx={hoverState.svgX}
                  cy={hoverState.svgYTarget}
                  r="5"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="filter drop-shadow-sm"
                />
              </g>
            )}

            {/* Actual value intersection point with glowing ripple aura */}
            <circle
              cx={hoverState.svgX}
              cy={hoverState.svgYActual}
              r="13"
              fill="#6366f1"
              opacity="0.22"
              className="animate-ping"
            />
            <circle
              cx={hoverState.svgX}
              cy={hoverState.svgYActual}
              r="7.5"
              fill="#6366f1"
              stroke="#ffffff"
              strokeWidth="3"
              className="filter drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]"
            />

            {/* ON-LINE FLOATING VALUE BADGE directly on/across the line */}
            <g
              transform={`translate(${hoverState.svgX}, ${Math.max(
                padding.top + 8,
                hoverState.svgYActual - 24
              )})`}
              filter="url(#pillShadow)"
            >
              <rect
                x="-42"
                y="-13"
                width="84"
                height="22"
                rx="11"
                className="fill-indigo-600 dark:fill-indigo-500"
              />
              <text
                x="0"
                y="2.5"
                textAnchor="middle"
                className="fill-white font-mono text-[10.5px] font-bold tracking-tight select-none"
              >
                {formatFullValue(hoverState.point.actual)}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* FLOATING HUD TOOLTIP FOLLOWING CURSOR ACROSS THE CHART */}
      {hoverState && hoverState.point && (
        <div
          className="absolute z-50 pointer-events-none transition-transform duration-100 ease-out"
          style={{
            left: `${hoverState.pixelX}px`,
            top: `${Math.max(10, hoverState.pixelY - 110)}px`,
            transform:
              hoverState.pixelX > (containerRef.current?.clientWidth || 600) * 0.7
                ? 'translate(-105%, -15%)'
                : 'translate(15px, -15%)',
          }}
        >
          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl min-w-[210px] space-y-2 animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Date / Period */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{hoverState.point.label}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                {timeframe.toUpperCase()}
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-1.5 text-xs">
              {/* Actual Metric */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                    {metricLabel}:
                  </span>
                </div>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                  {formatFullValue(hoverState.point.actual)}
                </span>
              </div>

              {/* Target Benchmark */}
              {showTarget && hoverState.point.target !== undefined && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 border-t-2 border-dashed border-cyan-500 inline-block" />
                    <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                      {targetLabel}:
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                    {formatFullValue(hoverState.point.target)}
                  </span>
                </div>
              )}

              {/* Variance & Delta */}
              {showTarget && hoverState.point.target !== undefined && (
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Variance vs Target</span>
                  {(() => {
                    const diff = hoverState.point.actual - hoverState.point.target;
                    const pct = ((diff / hoverState.point.target) * 100).toFixed(1);
                    const isPositive = diff >= 0;
                    return (
                      <span
                        className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md font-mono ${
                          isPositive
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                            : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-0.5" />
                        )}
                        {isPositive ? `+${pct}%` : `${pct}%`}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Volume / Orders if available */}
              {hoverState.point.volume && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 font-mono">
                  <span>Processed Volume:</span>
                  <span>{hoverState.point.volume.toLocaleString()} txns</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Indicator instructions prompt if not hovered */}
      {!hoverState && (
        <div className="absolute top-2 right-2 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60 backdrop-blur-sm">
          <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
          <span>Move cursor across chart to inspect values</span>
        </div>
      )}
    </div>
  );
}

export default InteractiveTrajectoryChart;
