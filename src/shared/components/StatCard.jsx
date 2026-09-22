import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  period = 'vs last month',
  icon: Icon,
  colorScheme = 'indigo', // 'indigo', 'emerald', 'cyan', 'amber', 'rose', 'purple'
  sparkline = [],
  className = '',
  onClick,
}) {
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border-indigo-500/25',
      glow: 'group-hover:border-indigo-500/40 group-hover:shadow-indigo-500/10',
      sparklineColor: '#6366f1',
    },
    emerald: {
      iconBg: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/25',
      glow: 'group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/10',
      sparklineColor: '#10b981',
    },
    cyan: {
      iconBg: 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border-cyan-500/25',
      glow: 'group-hover:border-cyan-500/40 group-hover:shadow-cyan-500/10',
      sparklineColor: '#06b6d4',
    },
    amber: {
      iconBg: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/25',
      glow: 'group-hover:border-amber-500/40 group-hover:shadow-amber-500/10',
      sparklineColor: '#f59e0b',
    },
    rose: {
      iconBg: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/25',
      glow: 'group-hover:border-rose-500/40 group-hover:shadow-rose-500/10',
      sparklineColor: '#f43f5e',
    },
    purple: {
      iconBg: 'bg-purple-500/15 text-purple-500 dark:text-purple-400 border-purple-500/25',
      glow: 'group-hover:border-purple-500/40 group-hover:shadow-purple-500/10',
      sparklineColor: '#a855f7',
    },
  }[colorScheme] || {
    iconBg: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border-indigo-500/25',
    glow: 'group-hover:border-indigo-500/40 group-hover:shadow-indigo-500/10',
    sparklineColor: '#6366f1',
  };

  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 80;
    const height = 30;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    const lastVal = sparkline[sparkline.length - 1];
    const lastX = width;
    const lastY = height - ((lastVal - min) / range) * (height - 6) - 3;

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <polyline
          fill="none"
          stroke={colorMap.sparklineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          style={{
            strokeDasharray: 200,
            strokeDashoffset: 0,
            animation: 'chartLineDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        />
        <circle
          cx={lastX}
          cy={lastY}
          r="3"
          fill={colorMap.sparklineColor}
          className="group-hover:scale-125 transition-transform"
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`group relative p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-md dark:shadow-xl transition-all duration-300 hover:shadow-xl ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} ${colorMap.glow} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorMap.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-lg`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`inline-flex items-center font-semibold px-1.5 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {change}
            </span>
          )}
          {period && <span className="text-slate-500 dark:text-slate-400">{period}</span>}
        </div>
        {renderSparkline()}
      </div>
    </div>
  );
}

export default StatCard;
