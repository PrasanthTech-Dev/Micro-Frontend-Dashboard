import { Eye, Users, Clock, ArrowDownUp, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn, formatNumber } from '@shared/utils/helpers';

const metricIcons = {
  'Total Page Views': Eye,
  'Unique Visitors': Users,
  'Avg. Session': Clock,
  'Bounce Rate': ArrowDownUp,
};

const metricColors = {
  'Total Page Views': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/20',
  'Unique Visitors': 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/20',
  'Avg. Session': 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/15 border border-sky-100 dark:border-sky-500/20',
  'Bounce Rate': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/15 border border-amber-100 dark:border-amber-500/20',
};

export default function MetricsGrid({ metrics }) {
  const { isDark } = useTheme();

  if (!metrics) return null;

  const cards = [
    { label: 'Total Page Views', value: formatNumber(metrics.totalPageViews) },
    { label: 'Unique Visitors', value: formatNumber(metrics.uniqueVisitors) },
    { label: 'Avg. Session', value: metrics.avgSessionDuration },
    { label: 'Bounce Rate', value: `${metrics.bounceRate}%` },
  ];

  const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

  return (
    <div className="space-y-4">
      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = metricIcons[card.label];
          const color = metricColors[card.label];
          return (
            <div
              key={card.label}
              className={cn(isDark ? 'glass-card' : 'glass-card-light', 'p-5 rounded-xl border animate-slide-up')}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3 shadow-2xs', color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                {card.value}
              </p>
              <p className={cn('text-xs mt-1 font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Device & Browser Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Breakdown */}
        <div className={cn(isDark ? 'glass-card' : 'glass-card-light', 'p-6 rounded-xl border animate-slide-up')}>
          <h4 className={cn('text-sm font-semibold mb-4', isDark ? 'text-slate-200' : 'text-slate-800')}>
            Device Breakdown
          </h4>
          <div className="space-y-3">
            {Object.entries(metrics.deviceBreakdown).map(([device, pct]) => {
              const DeviceIcon = deviceIcons[device] || Monitor;
              return (
                <div key={device} className="flex items-center gap-3">
                  <DeviceIcon className={cn('w-4 h-4', isDark ? 'text-slate-400' : 'text-slate-500')} />
                  <span className={cn('text-xs capitalize w-16 font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>
                    {device}
                  </span>
                  <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-semibold font-mono w-10 text-right', isDark ? 'text-slate-200' : 'text-slate-800')}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className={cn(isDark ? 'glass-card' : 'glass-card-light', 'p-6 animate-slide-up')}>
          <h4 className={cn('text-sm font-semibold mb-4', isDark ? 'text-surface-200' : 'text-surface-800')}>
            Browser Breakdown
          </h4>
          <div className="space-y-3">
            {Object.entries(metrics.browserBreakdown).map(([browser, pct]) => {
              const colors = {
                chrome: 'from-success-500 to-success-400',
                safari: 'from-info-500 to-info-400',
                firefox: 'from-warning-500 to-warning-400',
                edge: 'from-primary-500 to-primary-400',
              };
              return (
                <div key={browser} className="flex items-center gap-3">
                  <span className={cn('text-sm capitalize w-16', isDark ? 'text-surface-300' : 'text-surface-600')}>
                    {browser}
                  </span>
                  <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-surface-800' : 'bg-surface-100')}>
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', colors[browser] || 'from-surface-500 to-surface-400')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn('text-sm font-medium w-10 text-right', isDark ? 'text-surface-200' : 'text-surface-800')}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
