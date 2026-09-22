import { Users, TrendingUp, Bell, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@shared/context/ThemeContext';
import { useToast } from '@shared/context/NotificationContext';
import { useEventPublisher } from '@shared/hooks/useEventBus';
import { EVENTS } from '@shared/services/eventBus';
import { cn } from '@shared/utils/helpers';

export default function ModuleOperations() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const publish = useEventPublisher();

  function handleBroadcastAlert() {
    addToast('Cluster Alert: Broadcast event emitted across all federated MFEs', 'warning');
    publish(EVENTS.NOTIFICATION_CREATED, {
      title: 'Cluster Alert',
      message: 'Global cluster synchronization triggered.',
      type: 'warning',
    });
  }

  return (
    <div className={cn(
      'rounded-3xl p-7 border transition-all h-[360px] flex flex-col justify-between',
      isDark
        ? 'bg-[#0f172a] border-slate-800 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.4)]'
        : 'bg-white border-slate-100 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.05)]'
    )}>
      {/* Header */}
      <div>
        <h3 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
          Module Operations
        </h3>
        <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-400')}>
          Trigger cross-module operations
        </p>
      </div>

      {/* Operations List */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-center">
        {/* Op 1: Users */}
        <div
          onClick={() => navigate('/users')}
          className={cn(
            'p-3.5 px-4 rounded-2xl border flex items-center justify-between cursor-pointer group transition-all duration-150',
            isDark
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              : 'bg-[#f8fafc] border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xs'
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 text-[#384dfd] dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className={cn('text-xs font-bold leading-tight truncate', isDark ? 'text-slate-200' : 'text-slate-800')}>
                Create &amp; Audit Users
              </span>
              <span className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                Jump to User Management MFE
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#384dfd] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Op 2: Analytics */}
        <div
          onClick={() => navigate('/analytics')}
          className={cn(
            'p-3.5 px-4 rounded-2xl border flex items-center justify-between cursor-pointer group transition-all duration-150',
            isDark
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              : 'bg-[#f8fafc] border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xs'
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-50/90 dark:bg-cyan-950/50 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className={cn('text-xs font-bold leading-tight truncate', isDark ? 'text-slate-200' : 'text-slate-800')}>
                Predictive Funnel Analysis
              </span>
              <span className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                Jump to Analytics MFE
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Op 3: Notification Alert */}
        <div
          onClick={handleBroadcastAlert}
          className={cn(
            'p-3.5 px-4 rounded-2xl border flex items-center justify-between cursor-pointer group transition-all duration-150',
            isDark
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              : 'bg-[#f8fafc] border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xs'
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className={cn('text-xs font-bold leading-tight truncate', isDark ? 'text-slate-200' : 'text-slate-800')}>
                Broadcast Cluster Alert
              </span>
              <span className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                Emits cross-MFE toast notification
              </span>
            </div>
          </div>
          <Zap className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
}
