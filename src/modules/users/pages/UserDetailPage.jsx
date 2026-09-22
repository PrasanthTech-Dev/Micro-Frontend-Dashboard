import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Edit2 } from 'lucide-react';
import { useApi } from '@shared/hooks/useApi';
import { useTheme } from '@shared/context/ThemeContext';
import { api } from '@shared/services/api';
import { cn } from '@shared/utils/helpers';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import UserCard from '../components/UserCard';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { data: user, loading, error, execute: loadUser } = useApi(api.getUserById);

  useEffect(() => {
    loadUser(id);
  }, [id, loadUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading user details..." />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-danger-400">User not found</p>
        <button onClick={() => navigate('/users')} className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/users')}
          className={cn('p-2 rounded-xl transition-colors', isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={cn('text-2xl font-bold', isDark ? 'text-surface-100' : 'text-surface-900')}>
            User Details
          </h1>
          <p className={cn('text-sm', isDark ? 'text-surface-400' : 'text-surface-500')}>
            Viewing profile for {user.name}
          </p>
        </div>
      </div>

      <UserCard user={user} />

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Sessions This Month', value: '47', change: '+12%' },
          { label: 'Tasks Completed', value: '128', change: '+8%' },
          { label: 'Avg. Session Duration', value: '24m', change: '-3%' },
        ].map((stat) => (
          <div key={stat.label} className={cn(isDark ? 'glass-card' : 'glass-card-light', 'p-5')}>
            <p className={cn('text-sm mb-1', isDark ? 'text-surface-400' : 'text-surface-500')}>{stat.label}</p>
            <div className="flex items-end gap-2">
              <p className={cn('text-2xl font-bold', isDark ? 'text-surface-100' : 'text-surface-900')}>{stat.value}</p>
              <span className={cn('text-xs font-medium mb-1', stat.change.startsWith('+') ? 'text-success-400' : 'text-danger-400')}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
