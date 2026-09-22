import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  LogOut,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { Button } from '../../../shared/components/Button.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { useAuth } from '../../../shared/hooks/useAuth.js';
import { useTheme } from '../../../shared/context/ThemeContext.jsx';
import { apiService } from '../../../shared/services/api.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_PERSONAS = [
  {
    role: 'Admin',
    name: 'Sarah Chen',
    email: 'admin@enterprise.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: 'border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:border-indigo-500',
  },
  {
    role: 'Manager',
    name: 'Marcus Vance',
    email: 'manager@enterprise.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: 'border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 hover:border-cyan-500',
  },
  {
    role: 'Viewer',
    name: 'Elena Rostova',
    email: 'viewer@enterprise.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/70 hover:border-slate-400 dark:hover:border-slate-500',
  },
];

export default function LoginPage() {
  const { user: currentUser, loginUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const lockoutIntervalRef = useRef(null);

  // --- Rate Limit Lockout Countdown ---
  useEffect(() => {
    const checkLockout = () => {
      const status = apiService.isLockedOut();
      if (status.locked) {
        setLockoutRemaining(Math.ceil(status.remainingMs / 1000));
      } else {
        setLockoutRemaining(0);
        if (lockoutIntervalRef.current) {
          clearInterval(lockoutIntervalRef.current);
          lockoutIntervalRef.current = null;
        }
      }
    };

    checkLockout();

    return () => {
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    };
  }, []);

  const startLockoutCountdown = (ms) => {
    setLockoutRemaining(Math.ceil(ms / 1000));
    if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    lockoutIntervalRef.current = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(lockoutIntervalRef.current);
          lockoutIntervalRef.current = null;
          setErrorMsg('');
          setErrorCode('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- Field-Level Validation ---
  const validateFields = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Demo Persona Quick Login ---
  const handlePersonaSelect = (persona) => {
    if (lockoutRemaining > 0) return;
    const user = {
      id: `usr-${persona.role.toLowerCase()}`,
      name: `${persona.name} (${persona.role})`,
      email: persona.email,
      role: persona.role,
      avatar: persona.avatar,
      token: `mfe-jwt-${Math.random().toString(36).substring(2)}-${Date.now()}`,
      loginAt: new Date().toISOString(),
      mfaVerified: true,
    };
    loginUser(user);
    navigate('/dashboard');
  };

  // --- Production Login via API ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorCode('');

    if (!validateFields()) return;
    if (lockoutRemaining > 0) return;

    setIsLoading(true);

    try {
      const result = await apiService.login(email, password);

      if (result.success) {
        // Persist preference for "Remember Me"
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('mfe_remember_email', email);
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('mfe_remember_email');
        }

        loginUser(result.user, result.token);
        navigate('/dashboard');
      }
    } catch (err) {
      const code = err?.code || 'AUTH_ERROR';
      const message = err?.message || 'Authentication failed. Please try again.';
      setErrorCode(code);
      setErrorMsg(message);

      if (code === 'AUTH_RATE_LIMITED' && err.remainingMs) {
        startLockoutCountdown(err.remainingMs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Load remembered email on mount ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const remembered = localStorage.getItem('mfe_remember_email');
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    }
  }, []);

  const failedAttempts = apiService.getFailedAttemptCount();
  const isLocked = lockoutRemaining > 0;

  // If already authenticated: show clean active session card
  if (currentUser) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 text-center space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
            <button
              id="auth-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

          <div className="relative inline-block mx-auto -mt-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg mx-auto"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.email}</p>
            <div className="mt-2 flex justify-center">
              <Badge variant={currentUser.role} size="sm">
                {currentUser.role}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1 justify-center"
              leftIcon={LogOut}
              onClick={logout}
            >
              Sign Out
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1 justify-center"
              rightIcon={ArrowRight}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Simple, Attractive Centered Login Card with Dark/Light Mode Switcher
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/85 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 space-y-6 animate-in fade-in duration-300">
        {/* Top Card Bar: Logo and Theme Toggle Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              MicroDash <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">MFD</span>
            </span>
          </div>

          {/* Theme Mode Toggle Button */}
          <button
            id="auth-theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px]">Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Header Greeting */}
        <div className="text-center space-y-1.5 pt-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your micro-frontend workspace
          </p>
        </div>

        {/* Rate Limit Lockout Warning */}
        {isLocked && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2" role="alert">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Account temporarily locked.</span>{' '}
              Too many failed attempts. Try again in{' '}
              <span className="font-mono font-bold">{lockoutRemaining}s</span>
            </div>
            <Clock className="w-3.5 h-3.5 animate-spin opacity-60" />
          </div>
        )}


        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Global Error Alert */}
          {errorMsg && !isLocked && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2" role="alert" aria-live="polite">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {failedAttempts > 0 && failedAttempts < 5 && (
                  <span className="block text-[10px] mt-0.5 opacity-80">
                    {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? 's' : ''} remaining before lockout
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@enterprise.io"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                disabled={isLocked}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                  fieldErrors.email
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p id="login-email-error" className="text-[11px] text-rose-500 mt-1 pl-1" role="alert">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@enterprise.io');
                  setPassword('Enterprise@2026');
                  setFieldErrors({});
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Fill Demo
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                disabled={isLocked}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all font-mono disabled:opacity-50 ${
                  fieldErrors.password
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="login-password-error" className="text-[11px] text-rose-500 mt-1 pl-1" role="alert">{fieldErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center mt-2 shadow-lg shadow-indigo-600/25"
            loading={isLoading}
            disabled={isLocked}
            rightIcon={ArrowRight}
          >
            {isLocked ? `Locked (${lockoutRemaining}s)` : 'Sign In to Dashboard'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
