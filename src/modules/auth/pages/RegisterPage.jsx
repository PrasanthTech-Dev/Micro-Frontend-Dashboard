import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@shared/components/Button.jsx';
import { useAuth } from '@shared/hooks/useAuth.js';
import { useTheme } from '@shared/context/ThemeContext.jsx';
import { apiService } from '@shared/services/api.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Password Strength Calculator ---
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '', width: '0%' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: '', width: '0%' },
    { label: 'Weak', color: 'bg-rose-500', width: '20%' },
    { label: 'Fair', color: 'bg-amber-500', width: '40%' },
    { label: 'Good', color: 'bg-yellow-500', width: '60%' },
    { label: 'Strong', color: 'bg-emerald-500', width: '80%' },
    { label: 'Very Strong', color: 'bg-emerald-400', width: '100%' },
  ];

  return { score, ...levels[Math.min(score, 5)] };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  // --- Debounced Email Uniqueness Check ---
  useEffect(() => {
    if (!email || !EMAIL_REGEX.test(email)) {
      setEmailExists(false);
      return;
    }

    setEmailChecking(true);
    const timeout = setTimeout(async () => {
      try {
        const exists = await apiService.checkEmailExists(email);
        setEmailExists(exists);
        if (exists) {
          setFieldErrors((prev) => ({ ...prev, email: 'This email is already registered.' }));
        } else {
          setFieldErrors((prev) => ({ ...prev, email: '' }));
        }
      } catch {
        // Ignore check errors
      } finally {
        setEmailChecking(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [email]);

  // --- Validate All Fields ---
  const validateFields = useCallback(() => {
    const errors = {};

    if (!name.trim()) errors.name = 'Full name is required.';
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Enter a valid email address.';
    } else if (emailExists) {
      errors.email = 'This email is already registered.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, email, password, confirmPassword, acceptTerms, emailExists]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateFields()) return;

    setIsLoading(true);

    try {
      const res = await register(name, email, password, { role, department: 'Engineering' });
      if (res && res.success !== false) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 800);
      } else {
        setFormError(res?.error || 'Registration failed.');
      }
    } catch (err) {
      const message = err?.message || 'An unexpected error occurred.';
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      {/* Ambient glow */}
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
            id="auth-register-theme-toggle-btn"
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

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join the MicroDash Workspace
          </p>
        </div>

        {/* Feedback alerts */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2" role="alert">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Vasu Dev"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                aria-invalid={!!fieldErrors.name}
                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.name && <p className="text-[11px] text-rose-500 mt-1 pl-1" role="alert">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="vasu.dev@enterprise.io"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={!!fieldErrors.email}
                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.email || emailExists ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {emailChecking && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 animate-pulse">Checking...</span>
              )}
            </div>
            {fieldErrors.email && <p className="text-[11px] text-rose-500 mt-1 pl-1" role="alert">{fieldErrors.email}</p>}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Initial Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', desc: 'Full' },
                { label: 'Manager', desc: 'Write' },
                { label: 'Viewer', desc: 'Read' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setRole(item.label)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    role === item.label
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs block">{item.label}</span>
                  <span className="text-[10px] opacity-70 block font-normal">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                aria-invalid={!!fieldErrors.password}
                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all font-mono ${
                  fieldErrors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
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
            {fieldErrors.password && <p className="text-[11px] text-rose-500 mt-1 pl-1" role="alert">{fieldErrors.password}</p>}

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold ${
                    passwordStrength.score <= 1 ? 'text-rose-500' :
                    passwordStrength.score <= 2 ? 'text-amber-500' :
                    passwordStrength.score <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-emerald-500'
                  }`}>
                    {passwordStrength.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {passwordStrength.score >= 4 ? '✓ Strong enough' : 'Mix upper, lower, digits & symbols'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                aria-invalid={!!fieldErrors.confirmPassword}
                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all font-mono ${
                  fieldErrors.confirmPassword ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {confirmPassword && password === confirmPassword && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {fieldErrors.confirmPassword && <p className="text-[11px] text-rose-500 mt-1 pl-1" role="alert">{fieldErrors.confirmPassword}</p>}
          </div>

          {/* Terms & Conditions */}
          <div>
            <label htmlFor="accept-terms" className="flex items-start gap-2 cursor-pointer select-none">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: '' }));
                }}
                className={`w-3.5 h-3.5 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer ${
                  fieldErrors.terms ? 'ring-1 ring-rose-500' : ''
                }`}
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                I agree to the <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Terms of Service</span> and <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Privacy Policy</span>
              </span>
            </label>
            {fieldErrors.terms && <p className="text-[11px] text-rose-500 mt-1 pl-6" role="alert">{fieldErrors.terms}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center mt-2 shadow-lg shadow-indigo-600/25"
            loading={isLoading}
            disabled={emailExists || emailChecking}
            rightIcon={ArrowRight}
          >
            Create Account & Enter
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
