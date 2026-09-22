import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@shared/context/ThemeContext';
import { cn, formatNumber } from '@shared/utils/helpers';
import Card from '@shared/components/Card';

const barColors = ['#2563eb', '#3b82f6', '#60a5fa', '#1d4ed8', '#1e40af', '#0284c7'];

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
        <p className={isDark ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold'}>
          Conversions: {formatNumber(payload[0]?.value)}
        </p>
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
          Rate: {payload[0]?.payload?.rate}%
        </p>
      </div>
    );
  }
  return null;
};

export default function ConversionChart({ data }) {
  const { isDark } = useTheme();

  return (
    <Card className="animate-slide-up" hover={false}>
      <div className="mb-6">
        <h3 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
          Conversion Funnel
        </h3>
        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
          Conversions by target landing page
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.15)'} />
            <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
            <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' }} />
            <Bar dataKey="conversions" radius={[6, 6, 0, 0]} barSize={40}>
              {data?.map((_, index) => (
                <Cell key={index} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
