import { Info, CheckCircle, AlertTriangle, XCircle, Check, Trash2 } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

const typeConfig = {
  info: { icon: Info, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/15', ring: 'ring-sky-200 dark:ring-sky-500/25' },
  success: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15', ring: 'ring-emerald-200 dark:ring-emerald-500/25' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15', ring: 'ring-amber-200 dark:ring-amber-500/25' },
  danger: { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/15', ring: 'ring-rose-200 dark:ring-rose-500/25' },
};

export default function NotificationItem({ notification, onMarkRead, onDelete }) {
  const { isDark } = useTheme();
  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl transition-all duration-150 group border',
        !notification.read
          ? isDark
            ? 'bg-blue-600/10 border-blue-500/25 shadow-2xs'
            : 'bg-blue-50/40 border-blue-200/70 shadow-2xs'
          : isDark
            ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60'
            : 'bg-white border-slate-200/70 hover:bg-slate-50',
        'animate-fade-in'
      )}
    >
      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs', config.bg, config.ring)}>
        <Icon className={cn('w-4.5 h-4.5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn('text-sm font-semibold', isDark ? 'text-surface-100' : 'text-surface-900', notification.read && 'opacity-70')}>
            {notification.title}
          </h4>
          <span className={cn('text-xs shrink-0', isDark ? 'text-surface-500' : 'text-surface-400')}>
            {notification.time}
          </span>
        </div>
        <p className={cn('text-sm mt-0.5', isDark ? 'text-surface-400' : 'text-surface-500', notification.read && 'opacity-70')}>
          {notification.message}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <span className={cn('badge text-[10px]', `badge-${notification.type === 'danger' ? 'danger' : notification.type}`)}>
            {notification.module}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.read && (
          <button
            onClick={() => onMarkRead?.(notification.id)}
            className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-surface-700 text-surface-400' : 'hover:bg-surface-100 text-surface-500')}
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete?.(notification.id)}
          className="p-1.5 rounded-lg text-danger-400 hover:bg-danger-500/10 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
