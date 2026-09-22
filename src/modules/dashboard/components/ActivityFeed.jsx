import { GitBranch, Upload, CheckCircle, FileText, Code2, Bug, Palette, BarChart } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn, getInitials } from '@shared/utils/helpers';
import Card from '@shared/components/Card';

const typeIcons = {
  deploy: Code2,
  update: FileText,
  success: CheckCircle,
  upload: Upload,
  merge: GitBranch,
  report: BarChart,
  fix: Bug,
  create: Palette,
};

const typeColors = {
  deploy: { light: 'text-blue-600 bg-blue-50 border-blue-100', dark: 'text-blue-400 bg-blue-500/15 border-blue-500/20' },
  update: { light: 'text-slate-600 bg-slate-100 border-slate-200', dark: 'text-slate-300 bg-slate-800 border-slate-700' },
  success: { light: 'text-emerald-600 bg-emerald-50 border-emerald-100', dark: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
  upload: { light: 'text-sky-600 bg-sky-50 border-sky-100', dark: 'text-sky-400 bg-sky-500/15 border-sky-500/20' },
  merge: { light: 'text-blue-600 bg-blue-50 border-blue-100', dark: 'text-blue-400 bg-blue-500/15 border-blue-500/20' },
  report: { light: 'text-amber-600 bg-amber-50 border-amber-100', dark: 'text-amber-400 bg-amber-500/15 border-amber-500/20' },
  fix: { light: 'text-rose-600 bg-rose-50 border-rose-100', dark: 'text-rose-400 bg-rose-500/15 border-rose-500/20' },
  create: { light: 'text-indigo-600 bg-indigo-50 border-indigo-100', dark: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/20' },
};

export default function ActivityFeed({ data }) {
  const { isDark } = useTheme();

  return (
    <Card className="animate-slide-up" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={cn('text-base font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            Recent Team Activity
          </h3>
          <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Live stream of team changes and deployments
          </p>
        </div>
        <span className={cn(
          'text-xs font-semibold px-2.5 py-0.5 rounded-full border',
          isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
        )}>
          {data?.length || 0} events
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {data?.map((item) => {
          const Icon = typeIcons[item.type] || FileText;
          const style = typeColors[item.type] || typeColors.update;
          const colorClass = isDark ? style.dark : style.light;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3.5 py-3 transition-colors rounded-lg px-2 -mx-2',
                isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs',
                isDark
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              )}>
                {getInitials(item.user)}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-200' : 'text-slate-800')}>
                  <span className="font-semibold">{item.user}</span>{' '}
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{item.action}</span>{' '}
                  <span className={cn('font-semibold', isDark ? 'text-blue-400' : 'text-blue-600')}>{item.target}</span>
                </p>
                <p className={cn('text-[11px] mt-0.5', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  {item.time}
                </p>
              </div>

              <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 border shadow-2xs', colorClass)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
