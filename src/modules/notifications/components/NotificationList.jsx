import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';
import NotificationItem from './NotificationItem';
import EmptyState from '@shared/components/EmptyState';
import { Bell } from 'lucide-react';

export default function NotificationList({ notifications, onMarkRead, onDelete }) {
  const { isDark } = useTheme();

  if (!notifications || notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="You're all caught up! Check back later."
      />
    );
  }

  return (
    <div className="space-y-1">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
