import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
];

const readOptions = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function NotificationFilters({ filters, onChange }) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-wrap gap-3">
      {/* Read status */}
      <div className={cn(
        'inline-flex items-center gap-1 p-1 rounded-lg border shadow-2xs',
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
      )}>
        {readOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, read: opt.value })}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border',
              filters.read === opt.value
                ? isDark
                  ? 'bg-slate-800 text-white border-slate-700 shadow-2xs'
                  : 'bg-white text-slate-900 border-slate-200 shadow-2xs'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 border-transparent'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <select
        value={filters.type || ''}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className={cn('input-field w-auto text-sm py-1.5 px-3', isDark ? 'input-dark' : 'input-light')}
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
