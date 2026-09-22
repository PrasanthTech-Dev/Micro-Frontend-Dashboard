import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Production ProtectedRoute with RBAC enforcement.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render when authorized
 * @param {string[]} [props.requiredRoles] - Array of allowed roles (e.g., ['Admin', 'Manager'])
 *   If omitted, any authenticated user can access the route.
 */
export default function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // Redirect unauthenticated users to login, preserving the attempted URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // RBAC: check if user's role is in the allowed list
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user?.role || '';
    if (!requiredRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-[70vh] p-6">
          <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
              <ShieldX className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Your current role <span className="font-semibold text-slate-700 dark:text-slate-300">({userRole})</span>{' '}
                does not have permission to access this resource.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                Required: {requiredRoles.join(' or ')}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="md"
                className="flex-1 justify-center"
                leftIcon={ArrowLeft}
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 justify-center"
                leftIcon={Lock}
                onClick={() => window.location.href = '/dashboard'}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}
