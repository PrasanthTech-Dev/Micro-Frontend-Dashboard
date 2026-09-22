import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

export default function StatsCard({
  title,
  value,
  change,
  periodText = 'vs prior 30D',
  icon: Icon,
  symbol,
  colorScheme = 'indigo',
  sparklinePath,
  sparklineColor = '#4f46e5',
}) {
  const { isDark } = useTheme();
  const isPositive = (change ?? 0) >= 0;

  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400',
      spark: '#4f46e5',
    },
    cyan: {
      iconBg: 'bg-cyan-50/90 dark:bg-cyan-950/50 text-cyan-500 dark:text-cyan-400',
      spark: '#06b6d4',
    },
    emerald: {
      iconBg: 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400',
      spark: '#10b981',
    },
    purple: {
      iconBg: 'bg-purple-50/90 dark:bg-purple-950/50 text-purple-500 dark:text-purple-400',
      spark: '#a855f7',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.indigo;
  const activeSpark = sparklineColor || scheme.spark;

  return (
    <div
      className={cn(
        'rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between h-[180px]',
        isDark
          ? 'bg-[#0f172a] border-slate-800 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.4)]'
          : 'bg-white border-slate-100 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)]'
      )}
    >
      {/* Top Row: Metric Label + Rounded Squircle Icon Box */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
          {title}
        </span>
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs', scheme.iconBg)}>
          {Icon ? <Icon className="w-5 h-5" /> : symbol}
        </div>
      </div>

      {/* Middle: Prominent Metric Number */}
      <div className="my-1">
        <span className={cn('text-[32px] font-extrabold tracking-tight leading-none', isDark ? 'text-white' : 'text-slate-900')}>
          {value}
        </span>
      </div>

      {/* Bottom: Trend Badge + Context Label + Mini SVG Sparkline */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full',
            isPositive
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
          )}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{isPositive ? `+${change}%` : `${change}%`}</span>
          </span>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {periodText}
          </span>
        </div>

        {/* Mini SVG Sparkline matching Image 2 */}
        <div className="shrink-0 w-20 h-6 flex items-center justify-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 60 22" fill="none">
            <path
              d={sparklinePath || 'M2 18 C 15 18, 25 12, 35 15 C 45 18, 50 8, 58 4'}
              stroke={activeSpark}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
