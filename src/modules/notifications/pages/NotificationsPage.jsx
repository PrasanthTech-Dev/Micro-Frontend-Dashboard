import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  RefreshCw,
  Send,
  Zap,
  Sliders,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
  Undo2,
  Clock,
  Shield,
  CreditCard,
  Server,
  Users,
} from 'lucide-react';
import { Card } from '@shared/components/Card.jsx';
import { Button } from '@shared/components/Button.jsx';
import { Badge } from '@shared/components/Badge.jsx';
import { Modal } from '@shared/components/Modal.jsx';
import { SkeletonLoader } from '@shared/components/SkeletonLoader.jsx';
import { EmptyState } from '@shared/components/EmptyState.jsx';
import { apiService } from '@shared/services/api.js';
import { eventBus, MFE_EVENTS } from '@shared/services/eventBus.js';

const CATEGORIES = ['All', 'Unread', 'System', 'Users', 'Security', 'Billing'];
const SEVERITIES = ['All', 'Info', 'Success', 'Warning', 'Error'];

const ALERT_PRESETS = [
  {
    title: 'Cluster Node Auto-Scaled',
    message: 'Workload autoscaler provisioned 4 additional pods for analytics worker.',
    type: 'success',
    category: 'System',
    icon: Server,
  },
  {
    title: 'Suspicious IP Blocked by WAF',
    message: 'Firewall throttled 240 requests from suspicious ASN 45281 in Singapore.',
    type: 'warning',
    category: 'Security',
    icon: Shield,
  },
  {
    title: 'Database Cold Storage Backup Done',
    message: 'Primary Postgres instance backup synced to cold storage bucket.',
    type: 'info',
    category: 'System',
    icon: Server,
  },
  {
    title: 'Payment Gateway Webhook Timeout',
    message: 'Stripe webhook experienced 2.4s latency spike on checkout endpoint.',
    type: 'error',
    category: 'Billing',
    icon: CreditCard,
  },
  {
    title: 'New VIP Enterprise Account Added',
    message: 'Amara Okafor provisioned an enterprise seat with Admin privileges.',
    type: 'success',
    category: 'Users',
    icon: Users,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSeverity, setActiveSeverity] = useState('All');

  // Preferences Modal State
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({});

  // Undo deletion buffer
  const [lastDeleted, setLastDeleted] = useState(null);

  // Custom alert form
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customType, setCustomType] = useState('info');
  const [customCategory, setCustomCategory] = useState('System');

  // Fetch notifications and preferences
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getNotifications();
      setNotifications(data);
      const prefs = await apiService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Cross-MFE listener: whenever ANY module emits a notification, append it!
    const unsub = eventBus.subscribe(MFE_EVENTS.NOTIFICATION_EMIT, (payload) => {
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: payload.title || 'Cluster Alert',
        message: payload.message || 'Event was triggered across micro-frontend boundary.',
        type: payload.type || 'info',
        category: payload.category || 'System',
        read: false,
        timestamp: 'Just now',
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return unsub;
  }, [loadNotifications]);

  // Actions
  const handleMarkAsRead = async (id) => {
    try {
      const updated = await apiService.markNotificationRead(id);
      setNotifications(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const updated = await apiService.markAllNotificationsRead();
      setNotifications(updated);
      eventBus.publish(
        MFE_EVENTS.NOTIFICATION_EMIT,
        {
          title: 'All Caught Up',
          message: 'Marked all pending notifications as read.',
          type: 'info',
        },
        'notifications'
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const toDelete = notifications.find((n) => n.id === id);
    try {
      const updated = await apiService.deleteNotification(id);
      setNotifications(updated);
      if (toDelete) {
        setLastDeleted(toDelete);
        setTimeout(() => setLastDeleted(null), 6000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeleted) return;
    try {
      const restored = await apiService.addNotification(lastDeleted);
      setNotifications((prev) => [restored, ...prev]);
      setLastDeleted(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const updated = await apiService.deleteAllReadNotifications();
      setNotifications(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerPreset = async (preset) => {
    const newNotif = await apiService.addNotification(preset);
    setNotifications((prev) => [newNotif, ...prev]);

    // Broadcast cross-MFE
    eventBus.publish(MFE_EVENTS.NOTIFICATION_EMIT, preset, 'notifications');
  };

  const handleSendCustomAlert = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const notifObj = {
      title: customTitle,
      message: customMessage || 'Custom simulated operational event.',
      type: customType,
      category: customCategory,
    };

    const newNotif = await apiService.addNotification(notifObj);
    setNotifications((prev) => [newNotif, ...prev]);
    eventBus.publish(MFE_EVENTS.NOTIFICATION_EMIT, notifObj, 'notifications');

    setCustomTitle('');
    setCustomMessage('');
  };

  const handleTogglePref = async (category, channel) => {
    const updated = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [channel]: !preferences[category]?.[channel],
      },
    };
    setPreferences(updated);
    await apiService.updateNotificationPreferences(updated);
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeCategory === 'Unread' && notif.read) return false;
      if (activeCategory !== 'All' && activeCategory !== 'Unread' && notif.category !== activeCategory) {
        return false;
      }
      if (activeSeverity !== 'All' && notif.type.toLowerCase() !== activeSeverity.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [notifications, activeCategory, activeSeverity]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-400" />
            Notification Center & Alerting Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time event aggregator, notification delivery matrix, and high-priority cluster incident simulator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={Sliders}
            onClick={() => setIsPrefsModalOpen(true)}
          >
            Delivery Preferences
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={CheckCheck}
              onClick={handleMarkAllAsRead}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={Trash2}
            onClick={handleDeleteAllRead}
            title="Clear all read notifications"
          >
            Clear Read
          </Button>
        </div>
      </div>

      {/* Undo Banner if item was recently deleted */}
      {lastDeleted && (
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white shadow-xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>
              Notification <strong>"{lastDeleted.title}"</strong> was removed.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Delivery Preferences Modal */}
      <Modal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        title="Notification Delivery Channel Matrix"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Configure how notifications in each operational category are dispatched to team channels.
          </p>

          <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
            <div className="grid grid-cols-5 p-3 bg-slate-950/60 font-bold uppercase text-[10px] text-slate-400 tracking-wider">
              <div>Category</div>
              <div className="text-center">In-App</div>
              <div className="text-center">Email</div>
              <div className="text-center">Slack</div>
              <div className="text-center">Push</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {['System', 'Users', 'Security', 'Billing'].map((cat) => (
                <div key={cat} className="grid grid-cols-5 p-3 items-center hover:bg-slate-800/40">
                  <span className="font-semibold text-slate-200">{cat}</span>
                  {['inApp', 'email', 'slack', 'push'].map((ch) => (
                    <div key={ch} className="text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(preferences[cat]?.[ch])}
                        onChange={() => handleTogglePref(cat, ch)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-slate-900 border-slate-700"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setIsPrefsModalOpen(false)}>
              Save & Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main Grid: Feed on Left (7 cols), Simulator on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Notifications Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Category Tabs & Severity Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                    {cat === 'Unread' && unreadCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Type:</span>
              <select
                value={activeSeverity}
                onChange={(e) => setActiveSeverity(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer text-slate-300"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feed List Card */}
          <Card
            title={`Incident & Event Feed (${filteredNotifications.length})`}
            subtitle="Aggregated across distributed micro-frontend nodes"
          >
            {loading && notifications.length === 0 ? (
              <div className="space-y-3 py-2">
                <SkeletonLoader count={4} height="h-20" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                title="All clear! No notifications"
                description="No notifications match your active category or severity filter. Trigger an alert simulation on the right to test event flows."
                actionLabel="Reset Filters"
                onAction={() => {
                  setActiveCategory('All');
                  setActiveSeverity('All');
                }}
              />
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      notif.read
                        ? 'bg-slate-950/30 border-slate-800/60 opacity-80'
                        : 'bg-slate-900/80 border-indigo-500/30 shadow-md shadow-indigo-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-800/60">
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          )}
                          <Badge variant="default" size="sm">
                            {notif.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono mt-1.5 inline-block">
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(notif.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Alert Simulator & Broadcast Console */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Trigger Presets */}
          <Card
            title="Enterprise Alert Presets"
            subtitle="Trigger simulated operational incidents across all remotes"
          >
            <div className="space-y-2.5">
              {ALERT_PRESETS.map((preset, idx) => {
                const Icon = preset.icon || AlertCircle;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{preset.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{preset.category}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Zap}
                      onClick={() => handleTriggerPreset(preset)}
                    >
                      Fire
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Custom Alert Dispatch Form */}
          <Card
            title="Broadcast Custom Event"
            subtitle="Publish a bespoke payload directly to the Event Bus"
          >
            <form onSubmit={handleSendCustomAlert} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. CPU Spike in Worker Node #3"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Incident Detail
                </label>
                <textarea
                  placeholder="Describe the operational anomaly..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/50 border border-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/50 border border-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="System">System</option>
                    <option value="Users">Users</option>
                    <option value="Security">Security</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full justify-center mt-2"
                leftIcon={Send}
              >
                Broadcast to MFE Host & Remotes
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
