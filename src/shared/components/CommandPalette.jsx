import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  BarChart3,
  Bell,
  Shield,
  Sun,
  Moon,
  Terminal,
  Zap,
  Command,
} from 'lucide-react';
import { eventBus, MFE_EVENTS } from '../services/eventBus.js';

export function CommandPalette({ isOpen, onClose, onNavigate, currentUser }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const routerNavigate = useNavigate();

  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      routerNavigate(path);
    }
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const actions = [
    // Navigation
    {
      id: 'nav-dash',
      title: 'Navigate to Dashboard Overview',
      category: 'Navigation',
      icon: LayoutDashboard,
      shortcut: 'G D',
      perform: () => handleNav('/'),
    },
    {
      id: 'nav-users',
      title: 'Navigate to User Directory & RBAC',
      category: 'Navigation',
      icon: Users,
      shortcut: 'G U',
      perform: () => handleNav('/users'),
    },
    {
      id: 'nav-analytics',
      title: 'Navigate to Predictive Analytics',
      category: 'Navigation',
      icon: BarChart3,
      shortcut: 'G A',
      perform: () => handleNav('/analytics'),
    },
    {
      id: 'nav-notifs',
      title: 'Navigate to Notification Center',
      category: 'Navigation',
      icon: Bell,
      shortcut: 'G N',
      perform: () => handleNav('/notifications'),
    },
    {
      id: 'nav-auth',
      title: 'Navigate to Authentication & Session',
      category: 'Navigation',
      icon: Shield,
      shortcut: 'G S',
      perform: () => handleNav('/login'),
    },

    // Actions & Tools
    {
      id: 'act-theme',
      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      category: 'Appearance',
      icon: isDark ? Sun : Moon,
      shortcut: 'T',
      perform: () => {
        const newDark = !isDark;
        if (newDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('mfe_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('mfe_theme', 'light');
        }
        eventBus.publish(MFE_EVENTS.THEME_TOGGLE, { isDark: newDark }, 'palette');
      },
    },
    {
      id: 'act-devtools',
      title: 'Toggle MFE Architecture DevTools',
      category: 'Developer Tools',
      icon: Terminal,
      shortcut: 'D',
      perform: () => {
        eventBus.publish('mfe:toggle-devtools', {}, 'palette');
      },
    },
    {
      id: 'act-alert',
      title: 'Trigger Cluster Alert Simulation',
      category: 'System Operations',
      icon: Zap,
      shortcut: '!',
      perform: () => {
        eventBus.publish(
          MFE_EVENTS.NOTIFICATION_EMIT,
          {
            title: 'Operator Command Executed',
            message: 'Command Palette triggered immediate high-priority cluster alert.',
            type: 'warning',
            category: 'System',
          },
          'palette'
        );
      },
    },

    // Role Switching
    {
      id: 'role-admin',
      title: 'Switch Role to Admin (Full Access)',
      category: 'Role Switcher',
      icon: Shield,
      perform: () => {
        const stored = localStorage.getItem('mfe_auth_user');
        const user = stored ? JSON.parse(stored) : (currentUser || { name: 'Sarah Chen' });
        const updated = { ...user, role: 'Admin', name: `${user.name.split(' (')[0]} (Admin)` };
        localStorage.setItem('mfe_auth_user', JSON.stringify(updated));
        eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, updated, 'palette');
      },
    },
    {
      id: 'role-manager',
      title: 'Switch Role to Manager (Write Permissions)',
      category: 'Role Switcher',
      icon: Shield,
      perform: () => {
        const stored = localStorage.getItem('mfe_auth_user');
        const user = stored ? JSON.parse(stored) : (currentUser || { name: 'Marcus Vance' });
        const updated = { ...user, role: 'Manager', name: `${user.name.split(' (')[0]} (Manager)` };
        localStorage.setItem('mfe_auth_user', JSON.stringify(updated));
        eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, updated, 'palette');
      },
    },
    {
      id: 'role-viewer',
      title: 'Switch Role to Viewer (Read-Only)',
      category: 'Role Switcher',
      icon: Shield,
      perform: () => {
        const stored = localStorage.getItem('mfe_auth_user');
        const user = stored ? JSON.parse(stored) : (currentUser || { name: 'Elena Rostova' });
        const updated = { ...user, role: 'Viewer', name: `${user.name.split(' (')[0]} (Viewer)` };
        localStorage.setItem('mfe_auth_user', JSON.stringify(updated));
        eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, updated, 'palette');
      },
    },
  ];

  const filteredActions = actions.filter(
    (act) =>
      act.title.toLowerCase().includes(query.toLowerCase()) ||
      act.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredActions[selectedIndex];
        if (selected) {
          selected.perform();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search modules... (e.g. Users, Dark, Role)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching commands found for <span className="font-semibold text-slate-800 dark:text-slate-200">"{query}"</span>
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    action.perform();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {action.title}
                      </span>
                      <span
                        className={`ml-2 text-[10px] ${
                          isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        • {action.category}
                      </span>
                    </div>
                  </div>
                  {action.shortcut && (
                    <kbd
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                        isSelected
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>↵ Select</span>
            <span>•</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>MicroDash MFD Command Hub</span>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

export default CommandPalette;
