import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Shield,
  LogOut,
  ChevronDown,
  Terminal,
  Check,
  User,
  Search,
} from 'lucide-react';
import { Badge } from './Badge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { eventBus, MFE_EVENTS } from '../services/eventBus.js';
import { apiService } from '../services/api.js';

export function Navbar({ onMenuToggle, onToggleDevTools, isDevToolsOpen, onToggleCommandPalette }) {
  const { user: currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const roleDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Sync unread notification count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await apiService.getNotifications();
        const unread = notifs.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch {
        // ignore offline / simulated error on initial count
      }
    };
    fetchUnread();

    const unsubNotif = eventBus.subscribe(MFE_EVENTS.NOTIFICATION_EMIT, () => {
      setUnreadCount((prev) => prev + 1);
    });
    const unsubRead = eventBus.subscribe(MFE_EVENTS.NOTIFICATION_READ, () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
    const unsubCleared = eventBus.subscribe(MFE_EVENTS.NOTIFICATION_CLEARED, () => {
      setUnreadCount(0);
    });

    return () => {
      unsubNotif();
      unsubRead();
      unsubCleared();
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (role) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      role,
      name: `${currentUser.name.split(' (')[0]} (${role})`,
    };
    localStorage.setItem('mfe_auth_user', JSON.stringify(updated));
    eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, updated, 'header');
    eventBus.publish(
      MFE_EVENTS.NOTIFICATION_EMIT,
      {
        title: 'Role Switched via Header',
        message: `Active session permissions updated to ${role}.`,
        type: 'warning',
      },
      'header'
    );
    setIsRoleDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };

  const currentRoute = location.pathname;
  const routeTitles = {
    '/': 'Dashboard Overview',
    '/dashboard': 'Dashboard Overview',
    '/users': 'User Directory & Access Control',
    '/analytics': 'Predictive Analytics & Intelligence',
    '/notifications': 'Notification Center',
    '/login': 'Authentication & Session',
    '/register': 'Create Enterprise Account',
  };

  const activeSegment = currentRoute === '/' ? 'dashboard' : currentRoute.replace('/', '').split('/')[0];

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
            {routeTitles[currentRoute] || 'Dashboard Overview'}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono sm:mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>MFD Cluster</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{activeSegment}</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal Command Palette Trigger */}
        <button
          type="button"
          onClick={onToggleCommandPalette}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-medium cursor-pointer transition-colors"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick Actions</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            Ctrl K
          </kbd>
        </button>

        {/* Quick Role Switcher Pill */}
        {currentUser && (
          <div className="relative" ref={roleDropdownRef}>
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden sm:inline">Role:</span>
              <Badge variant={currentUser.role || 'Admin'} size="sm">
                {currentUser.role || 'Admin'}
              </Badge>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                  Switch Active Role
                </div>
                {['Admin', 'Manager', 'Viewer'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{role}</span>
                    {(currentUser.role || 'Admin') === role && (
                      <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>



        {/* User Profile Dropdown */}
        {currentUser ? (
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl ring-2 ring-indigo-500/30 bg-slate-100 dark:bg-slate-800 object-cover"
              />
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-900 dark:text-white leading-tight">{currentUser.name}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">{currentUser.role || 'Admin'}</div>
              </div>
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>Security Gateway & RBAC</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
