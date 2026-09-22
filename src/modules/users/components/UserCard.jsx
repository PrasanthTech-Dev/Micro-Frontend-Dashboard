import { Mail, MapPin, Calendar, Clock } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn, getInitials } from '@shared/utils/helpers';

const statusColors = {
  active: 'badge-success',
  inactive: 'badge-danger',
  pending: 'badge-warning',
};

export default function UserCard({ user }) {
  const { isDark } = useTheme();
  if (!user) return null;

  return (
    <div className={cn(isDark ? 'glass-card' : 'glass-card-light', 'p-6')}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className={cn('text-xl font-bold truncate', isDark ? 'text-surface-100' : 'text-surface-900')}>
              {user.name}
            </h2>
            <span className={cn('badge', statusColors[user.status])}>
              {user.status}
            </span>
          </div>
          <p className={cn('text-sm mb-3', isDark ? 'text-surface-400' : 'text-surface-500')}>
            {user.role}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2">
              <Mail className={cn('w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
              <span className={cn('text-sm truncate', isDark ? 'text-surface-300' : 'text-surface-600')}>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className={cn('w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
              <span className={cn('text-sm', isDark ? 'text-surface-300' : 'text-surface-600')}>{user.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className={cn('w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
              <span className={cn('text-sm', isDark ? 'text-surface-300' : 'text-surface-600')}>Joined {user.joinDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={cn('w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
              <span className={cn('text-sm', isDark ? 'text-surface-300' : 'text-surface-600')}>Active {user.lastActive}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
