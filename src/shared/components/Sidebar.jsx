import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Bell,
  Layers,
  ChevronRight,
  X,
  LogOut,
} from 'lucide-react';
import { Badge } from './Badge.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const navItems = [
    {
      id: '/',
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      module: '@modules/dashboard',
      description: 'Overview & KPIs',
    },
    {
      id: '/users',
      path: '/users',
      label: 'User Directory',
      icon: Users,
      module: '@modules/users',
      description: 'CRUD & RBAC Controls',
    },
    {
      id: '/analytics',
      path: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      module: '@modules/analytics',
      description: 'Metrics & Projections',
    },
    {
      id: '/notifications',
      path: '/notifications',
      label: 'Notifications',
      icon: Bell,
      module: '@modules/notifications',
      description: 'Live Event Aggregator',
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 dark:bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 lg:bg-white/90 dark:bg-slate-950/95 lg:dark:bg-slate-950/80 border-r border-slate-200 dark:border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand & Cluster Logo */}
          <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>MicroDash</span>
                  <span className="text-xs px-1.5 py-0.2 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono">
                    MFD
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold">
                  Federated Architecture
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Module Navigation List */}
          <div className="px-3 py-6 space-y-1">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-mono">
              Federated Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/'
                ? (currentPath === '/' || currentPath === '/dashboard')
                : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div
                        className={`text-[10px] font-normal tracking-wide ${
                          isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isActive ? 'text-white translate-x-0.5' : 'text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persona Role Card & Cluster Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Cluster Status
                </span>
              </div>
              <Badge variant="active" size="sm">
                Online
              </Badge>
            </div>
            {currentUser && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left group"
                  title="Click to toggle account actions"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-lg ring-1 ring-indigo-500/30 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {currentUser.role || 'Admin'}
                      </p>
                    </div>
                  </div>
                  <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>

                {isProfileMenuOpen && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
