import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '@shared/context/ThemeContext';
import { cn, formatNumber } from '@shared/utils/helpers';
import Card from '@shared/components/Card';

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        'p-3 rounded-xl border shadow-lg text-xs space-y-1',
        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      )}>
        <p className={cn('font-semibold pb-1 border-b', isDark ? 'border-slate-800 text-slate-100' : 'border-slate-100 text-slate-900')}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{entry.name}:</span>
            </span>
            <span className={cn('font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficChart({ data }) {
  const { isDark } = useTheme();

  return (
    <Card className="animate-slide-up" hover={false}>
      <div className="mb-6">
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-surface-100' : 'text-surface-900')}>
          Traffic Overview
        </h3>
        <p className={cn('text-sm', isDark ? 'text-surface-400' : 'text-surface-500')}>
          Weekly visitors, page views & sessions
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.15)'} />
            <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Line type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} name="Visitors" />
            <Line type="monotone" dataKey="pageViews" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} activeDot={{ r: 5 }} name="Page Views" />
            <Line type="monotone" dataKey="sessions" stroke="#64748b" strokeWidth={2.5} dot={{ r: 3, fill: '#64748b' }} activeDot={{ r: 5 }} name="Sessions" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
