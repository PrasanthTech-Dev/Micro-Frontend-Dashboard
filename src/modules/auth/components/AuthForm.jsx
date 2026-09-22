import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

export default function AuthForm({ mode = 'login', onSubmit, loading, error }) {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [validation, setValidation] = useState({});

  const isLogin = mode === 'login';

  function validate() {
    const errors = {};
    if (!isLogin && !formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Min 6 characters';
    setValidation(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validation[field]) {
      setValidation((prev) => ({ ...prev, [field]: null }));
    }
  }

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Very Weak', color: 'bg-danger-500' },
      { label: 'Weak', color: 'bg-danger-400' },
      { label: 'Fair', color: 'bg-warning-400' },
      { label: 'Good', color: 'bg-success-400' },
      { label: 'Strong', color: 'bg-success-500' },
    ];
    return { score, ...levels[Math.min(score, levels.length) - 1] || levels[0] };
  };

  const inputClass = cn(
    'input-field',
    isDark ? 'input-dark' : 'input-light',
    'pl-11'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm animate-slide-down">
          {error}
        </div>
      )}

      {/* Name (register only) */}
      {!isLogin && (
        <div>
          <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>
            Full Name
          </label>
          <div className="relative">
            <UserIcon className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
              className={cn(inputClass, validation.name && 'border-danger-500')}
              style={{ paddingLeft: '2.75rem' }}
              id="auth-name"
            />
          </div>
          {validation.name && <p className="text-xs text-danger-400 mt-1">{validation.name}</p>}
        </div>
      )}

      {/* Email */}
      <div>
        <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>
          Email Address
        </label>
        <div className="relative">
          <Mail className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@example.com"
            className={cn(inputClass, validation.email && 'border-danger-500')}
            style={{ paddingLeft: '2.75rem' }}
            id="auth-email"
          />
        </div>
        {validation.email && <p className="text-xs text-danger-400 mt-1">{validation.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>
          Password
        </label>
        <div className="relative">
          <Lock className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-surface-500' : 'text-surface-400')} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="••••••••"
            className={cn(inputClass, validation.password && 'border-danger-500')}
            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
            id="auth-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={cn('absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md', isDark ? 'text-surface-500 hover:text-surface-300' : 'text-surface-400 hover:text-surface-600')}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {validation.password && <p className="text-xs text-danger-400 mt-1">{validation.password}</p>}

        {/* Password Strength (register only) */}
        {!isLogin && formData.password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all',
                    i <= getPasswordStrength().score ? getPasswordStrength().color : isDark ? 'bg-surface-700' : 'bg-surface-200'
                  )}
                />
              ))}
            </div>
            <p className={cn('text-xs', isDark ? 'text-surface-500' : 'text-surface-400')}>
              {getPasswordStrength().label}
            </p>
          </div>
        )}
      </div>

      {/* Demo hint for login with 1-click autofill */}
      {isLogin && (
        <div
          onClick={() => setFormData((prev) => ({ ...prev, email: 'demo@microdash.com', password: 'password' }))}
          className={cn(
            'p-3 rounded-xl border text-xs cursor-pointer transition-all',
            isDark
              ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-indigo-500/50'
              : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900 hover:bg-indigo-100/70'
          )}
          title="Click to autofill demo credentials"
        >
          <span className="font-semibold">Quick Demo Login:</span>{' '}
          <span className="font-mono underline decoration-dotted">demo@microdash.com</span> / <span className="font-mono underline decoration-dotted">password</span> (click to autofill)
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        id="auth-submit"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
