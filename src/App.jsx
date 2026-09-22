import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { WifiOff, Layers, ShieldCheck, Sun, Moon, Terminal, Timer, X } from 'lucide-react';
import { useAuth } from './shared/hooks/useAuth.js';
import { useTheme } from './shared/context/ThemeContext.jsx';
import { eventBus, MFE_EVENTS } from './shared/services/eventBus.js';
import Navbar from './shared/components/Navbar.jsx';
import Sidebar from './shared/components/Sidebar.jsx';
import ProtectedRoute from './shared/components/ProtectedRoute.jsx';
import ErrorBoundary from './shared/components/ErrorBoundary.jsx';
import LoadingSpinner from './shared/components/LoadingSpinner.jsx';
import ToastContainer from './shared/components/ToastContainer.jsx';
import CommandPalette from './shared/components/CommandPalette.jsx';
import DevToolsDrawer from './shared/components/DevToolsDrawer.jsx';

// ===== Lazy-loaded Micro-Frontend Modules =====
const LoginPage = lazy(() =>
  import('./modules/auth/pages/LoginPage.jsx').then((m) => ({ default: m.default }))
);
const RegisterPage = lazy(() =>
  import('./modules/auth/pages/RegisterPage.jsx').then((m) => ({ default: m.default }))
);
const DashboardPage = lazy(() =>
  import('./modules/dashboard/pages/DashboardPage.jsx').then((m) => ({ default: m.default }))
);
const UsersListPage = lazy(() =>
  import('./modules/users/pages/UsersListPage.jsx').then((m) => ({ default: m.default }))
);
const UserDetailPage = lazy(() =>
  import('./modules/users/pages/UserDetailPage.jsx').then((m) => ({ default: m.default }))
);
const AnalyticsPage = lazy(() =>
  import('./modules/analytics/pages/AnalyticsPage.jsx').then((m) => ({ default: m.default }))
);
const NotificationsPage = lazy(() =>
  import('./modules/notifications/pages/NotificationsPage.jsx').then((m) => ({ default: m.default }))
);

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" text="Loading federated module..." />
    </div>
  );
}

export default function App() {
  const { user: currentUser, isAuthenticated, loading, showTimeoutWarning, extendSession, dismissWarning } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  // Global Keyboard shortcut: Ctrl+K / Cmd+K (only active when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  // EventBus Subscriptions
  useEffect(() => {
    const unsubNet = eventBus.subscribe(MFE_EVENTS.NETWORK_STATUS_CHANGED, (payload) => {
      if (payload && typeof payload.isOnline === 'boolean') {
        setIsOnline(payload.isOnline);
      }
    });

    const unsubDev = eventBus.subscribe('mfe:toggle-devtools', () => {
      setIsDevToolsOpen((prev) => !prev);
    });

    const unsubNav = eventBus.subscribe(MFE_EVENTS.NAVIGATE, (payload) => {
      if (payload?.path) {
        navigate(payload.path);
      }
    });

    return () => {
      unsubNet();
      unsubDev();
      unsubNav();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <LoadingSpinner size="xl" text="Initializing MicroDash MFD Cluster..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Offline Detection Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md z-40">
          <WifiOff className="w-4 h-4" />
          <span>Network Disconnected: Operating in local mock cache mode.</span>
        </div>
      )}

      {/* CONDITION 1: Unauthenticated Session (Authentication Page ONLY comes first) */}
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <Routes>
              <Route
                path="/register"
                element={
                  <Suspense fallback={<ModuleLoader />}>
                    <ErrorBoundary fallbackMessage="Registration module failed to load.">
                      <RegisterPage />
                    </ErrorBoundary>
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<ModuleLoader />}>
                    <ErrorBoundary fallbackMessage="Authentication module failed to load.">
                      <LoginPage onToggleDevTools={() => setIsDevToolsOpen((prev) => !prev)} />
                    </ErrorBoundary>
                  </Suspense>
                }
              />
            </Routes>
          </main>
        </div>
      ) : (
        /* CONDITION 2: Authenticated Session (Executive Dashboard Shell) */
        <div className="flex-1 flex min-h-screen">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-72">
            <Navbar
              onMenuToggle={() => setSidebarOpen(true)}
              onToggleDevTools={() => setIsDevToolsOpen((prev) => !prev)}
              isDevToolsOpen={isDevToolsOpen}
              onToggleCommandPalette={() => setIsCommandPaletteOpen(true)}
            />

            {/* Main Module Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
              <Routes>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="Dashboard module encountered an error.">
                        <DashboardPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="Dashboard module encountered an error.">
                        <DashboardPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="User Management module encountered an error.">
                        <UsersListPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="User detail module encountered an error.">
                        <UserDetailPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="Analytics module encountered an error.">
                        <AnalyticsPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="Notifications module encountered an error.">
                        <NotificationsPage />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="Authentication module failed to load.">
                        <LoginPage onToggleDevTools={() => setIsDevToolsOpen((prev) => !prev)} />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/auth"
                  element={
                    <Suspense fallback={<ModuleLoader />}>
                      <ErrorBoundary fallbackMessage="Authentication module failed to load.">
                        <LoginPage onToggleDevTools={() => setIsDevToolsOpen((prev) => !prev)} />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}

      {/* Universal Command Palette (Available for Authenticated Sessions) */}
      {isAuthenticated && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* MFE Architecture DevTools Drawer */}
      <DevToolsDrawer
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Session Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm mx-4 rounded-3xl border border-amber-500/30 bg-white dark:bg-slate-900 p-7 shadow-2xl shadow-amber-500/10 dark:shadow-black/60 space-y-5 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={dismissWarning}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Timer className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Session Expiring Soon</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Your session will expire in less than 2 minutes due to inactivity.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={dismissWarning}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={extendSession}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-colors cursor-pointer"
              >
                Extend Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
