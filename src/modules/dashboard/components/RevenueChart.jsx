import { ResponsiveContainer, AreaChart, Area, Line, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

const telemetryData = [
  { step: 'T1', value: 38000, target: 45000 },
  { step: 'T2', value: 46000, target: 49000 },
  { step: 'T3', value: 55000, target: 54000 },
  { step: 'T4', value: 51000, target: 60000 },
  { step: 'T5', value: 65000, target: 66000 },
  { step: 'T6', value: 72000, target: 73000 },
  { step: 'T7', value: 84000, target: 80000 },
  { step: 'T8', value: 96000, target: 88000 },
];

const CustomTooltip = ({ active, payload, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        'p-3 rounded-2xl border shadow-xl text-xs space-y-1',
        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
      )}>
        <p className="font-bold text-slate-400 text-[10px] uppercase">Telemetry Sample</p>
        <div className="flex items-center justify-between gap-4 pt-0.5">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-[#384dfd]" />
            Actual:
          </span>
          <span className="font-extrabold font-mono text-[#384dfd] dark:text-blue-400 text-sm">
            ${(payload[0]?.value || 0).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Customized Dot on data points to match Image 2
const CustomSplineDot = (props) => {
  const { cx, cy, index } = props;
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={5}
      fill="#ffffff"
      stroke="#384dfd"
      strokeWidth={3}
      className="filter drop-shadow-xs"
    />
  );
};

export default function RevenueChart() {
  const { isDark } = useTheme();

  return (
    <div className={cn(
      'rounded-3xl p-7 border transition-all h-[360px] flex flex-col justify-between',
      isDark
        ? 'bg-[#0f172a] border-slate-800 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.4)]'
        : 'bg-white border-slate-100 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.05)]'
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div>
          <h3 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            Revenue &amp; Performance Trajectory
          </h3>
          <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-400')}>
            Cross-regional transaction telemetry over 30D
          </p>
        </div>

        {/* Real-time aggregation status badge matching Image 2 */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time aggregation</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={telemetryData} margin={{ top: 15, right: 20, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="microdashSplineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#384dfd" stopOpacity={isDark ? 0.35 : 0.22} />
                <stop offset="95%" stopColor="#384dfd" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f8fafc'} vertical={false} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />

            {/* Cyan Dashed Baseline Target Curve (matches Image 2) */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="#38bdf8"
              strokeDasharray="4 4"
              strokeWidth={2.2}
              dot={false}
              name="Projected Target"
            />

            {/* Primary Blue Spline Line with White Centered Circle Dots and Area Fill */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#384dfd"
              strokeWidth={3}
              fill="url(#microdashSplineGradient)"
              dot={<CustomSplineDot />}
              activeDot={{ r: 7, fill: '#384dfd', stroke: '#ffffff', strokeWidth: 3 }}
              name="Actual Telemetry"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
