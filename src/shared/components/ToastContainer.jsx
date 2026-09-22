import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useToast } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/helpers';

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  danger: XCircle,
  error: XCircle,
};

const colors = {
  success: 'border-success-500/30 bg-success-500/10',
  warning: 'border-warning-500/30 bg-warning-500/10',
  info: 'border-info-500/30 bg-info-500/10',
  danger: 'border-danger-500/30 bg-danger-500/10',
  error: 'border-danger-500/30 bg-danger-500/10',
};

const iconColors = {
  success: 'text-success-400',
  warning: 'text-warning-400',
  info: 'text-info-400',
  danger: 'text-danger-400',
  error: 'text-danger-400',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const { isDark } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border animate-slide-in-right',
              colors[toast.type],
              isDark ? 'glass' : 'glass-light'
            )}
          >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColors[toast.type])} />
            <p className={cn('text-sm flex-1', isDark ? 'text-surface-200' : 'text-surface-700')}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={cn('shrink-0 p-1 rounded-lg transition-colors', isDark ? 'hover:bg-surface-700 text-surface-400' : 'hover:bg-surface-200 text-surface-500')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
