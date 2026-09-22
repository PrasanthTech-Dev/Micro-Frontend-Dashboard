import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/helpers';

export default function LoadingSpinner({ size = 'md', text = 'Loading...', fullScreen = false }) {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', fullScreen && 'min-h-screen')}>
      <div className="relative">
        <div
          className={cn(
            sizeClasses[size],
            'rounded-full border-transparent animate-spin',
            isDark ? 'border-t-primary-500 border-r-primary-500/30' : 'border-t-primary-600 border-r-primary-600/30'
          )}
          style={{ borderStyle: 'solid' }}
        />
        <div
          className={cn(
            sizeClasses[size],
            'rounded-full border-transparent animate-spin absolute inset-0',
            isDark ? 'border-b-accent-500/50' : 'border-b-accent-600/50'
          )}
          style={{ borderStyle: 'solid', animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>
      {text && (
        <p className={cn('text-sm font-medium', isDark ? 'text-surface-400' : 'text-surface-500')}>
          {text}
        </p>
      )}
    </div>
  );

  return spinner;
}
