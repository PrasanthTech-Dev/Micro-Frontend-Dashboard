import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

const ranges = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
];

export default function DateRangePicker({ value = '30d', onChange }) {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Calendar className={cn('w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
      <div className={cn('flex rounded-xl p-1', isDark ? 'bg-surface-800/50' : 'bg-surface-100')}>
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange?.(range.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              value === range.value
                ? 'bg-primary-500 text-white shadow-sm'
                : isDark
                  ? 'text-surface-400 hover:text-surface-200'
                  : 'text-surface-500 hover:text-surface-700'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
