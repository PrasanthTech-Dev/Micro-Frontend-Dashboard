import { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { eventBus, MFE_EVENTS } from '../services/eventBus.js';
import { apiService, AUTH_CONFIG } from '../services/api.js';

export const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = AUTH_CONFIG.TOKEN_EXPIRY_MS; // 30 minutes
const WARNING_BEFORE_MS = AUTH_CONFIG.REFRESH_THRESHOLD_MS; // 2 minutes before expiry
const IDLE_RESET_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  sessionExpiresAt: null,
  showTimeoutWarning: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
        sessionExpiresAt: action.payload.expiresAt || (Date.now() + SESSION_TIMEOUT_MS),
        showTimeoutWarning: false,
      };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'AUTH_LOGOUT':
      return { ...initialState, loading: false };
    case 'AUTH_INIT_DONE':
      return { ...state, loading: false };
    case 'SESSION_TIMEOUT_WARNING':
      return { ...state, showTimeoutWarning: true };
    case 'SESSION_EXTENDED':
      return {
        ...state,
        token: action.payload.token,
        sessionExpiresAt: action.payload.expiresAt,
        showTimeoutWarning: false,
      };
    case 'DISMISS_WARNING':
      return { ...state, showTimeoutWarning: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const performLogoutRef = useRef(null);

  // --- Session Timer Management ---
  const clearTimers = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  // --- Persistence Helpers ---
  const persistSession = useCallback((user, token) => {
    if (typeof window === 'undefined') return;
    const sessionData = JSON.stringify({ user, token, savedAt: Date.now() });
    sessionStorage.setItem('mfe_auth_session', sessionData);
    localStorage.setItem('mfe_auth_user', JSON.stringify(user));
  }, []);

  const clearPersistedSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('mfe_auth_session');
    sessionStorage.removeItem('mfe_auth_user');
    localStorage.removeItem('mfe_auth_user');
    localStorage.removeItem('microdash_user');
  }, []);

  // --- Core Auth Actions ---
  const performLogout = useCallback(() => {
    clearTimers();
    clearPersistedSession();
    dispatch({ type: 'AUTH_LOGOUT' });
    eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, null, 'auth');
  }, [clearTimers, clearPersistedSession]);

  // Store performLogout in ref so timers can access latest version
  performLogoutRef.current = performLogout;

  const startSessionTimers = useCallback((token, expiresAt) => {
    clearTimers();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const timeUntilWarning = Math.max(0, timeUntilExpiry - WARNING_BEFORE_MS);

    // Warning timer — fires 2 min before session expires
    if (timeUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        dispatch({ type: 'SESSION_TIMEOUT_WARNING' });
        eventBus.publish(MFE_EVENTS.SESSION_TIMEOUT_WARNING, {
          expiresAt,
          remainingMs: WARNING_BEFORE_MS,
        }, 'auth');
      }, timeUntilWarning);
    }

    // Hard expiry timer
    if (timeUntilExpiry > 0) {
      sessionTimerRef.current = setTimeout(() => {
        if (performLogoutRef.current) performLogoutRef.current();
        eventBus.publish(MFE_EVENTS.NOTIFICATION_EMIT, {
          title: 'Session Expired',
          message: 'Your session has expired due to inactivity. Please sign in again.',
          type: 'warning',
        }, 'auth');
      }, timeUntilExpiry);
    }
  }, [clearTimers]);

  const loginUser = useCallback((user, token) => {
    const authToken = token || `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = Date.now() + SESSION_TIMEOUT_MS;

    persistSession(user, authToken);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, token: authToken, expiresAt },
    });
    startSessionTimers(authToken, expiresAt);
    eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, user, 'auth');
  }, [persistSession, startSessionTimers]);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const result = await apiService.login(email, password);
      const expiresAt = Date.now() + (result.expiresIn || SESSION_TIMEOUT_MS);

      persistSession(result.user, result.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: result.user, token: result.token, expiresAt },
      });
      startSessionTimers(result.token, expiresAt);
      eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, result.user, 'auth');
      return { success: true, user: result.user };
    } catch (err) {
      const message = err?.message || 'Authentication failed.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw err;
    }
  }, [persistSession, startSessionTimers]);

  const register = useCallback(async (name, email, password, options = {}) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const result = await apiService.register(name, email, password);
      const expiresAt = Date.now() + (result.expiresIn || SESSION_TIMEOUT_MS);

      const user = {
        ...result.user,
        role: options.role || result.user.role,
        department: options.department || result.user.department,
        name: options.role ? `${name} (${options.role})` : result.user.name,
      };

      persistSession(user, result.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token: result.token, expiresAt },
      });
      startSessionTimers(result.token, expiresAt);
      eventBus.publish(MFE_EVENTS.AUTH_STATE_CHANGED, user, 'auth');
      return { success: true, user };
    } catch (err) {
      const message = err?.message || 'Registration failed.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw err;
    }
  }, [persistSession, startSessionTimers]);

  const extendSession = useCallback(() => {
    if (!state.token || !state.user) return;
    const newToken = apiService.refreshToken(state.token);
    if (!newToken) return;

    const newExpiresAt = Date.now() + SESSION_TIMEOUT_MS;
    persistSession(state.user, newToken);
    dispatch({
      type: 'SESSION_EXTENDED',
      payload: { token: newToken, expiresAt: newExpiresAt },
    });
    startSessionTimers(newToken, newExpiresAt);
  }, [state.token, state.user, persistSession, startSessionTimers]);

  const dismissWarning = useCallback(() => {
    dispatch({ type: 'DISMISS_WARNING' });
  }, []);

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_INIT_DONE' });
  }, []);

  // --- Initialize auth from persisted session ---
  useEffect(() => {
    const sessionRaw = typeof window !== 'undefined' ? sessionStorage.getItem('mfe_auth_session') : null;

    if (sessionRaw) {
      try {
        const { user, token, savedAt } = JSON.parse(sessionRaw);
        const elapsed = Date.now() - savedAt;
        if (elapsed < SESSION_TIMEOUT_MS && user) {
          const expiresAt = savedAt + SESSION_TIMEOUT_MS;
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token, expiresAt },
          });
          startSessionTimers(token, expiresAt);
        } else {
          sessionStorage.removeItem('mfe_auth_session');
          dispatch({ type: 'AUTH_INIT_DONE' });
        }
      } catch {
        sessionStorage.removeItem('mfe_auth_session');
        dispatch({ type: 'AUTH_INIT_DONE' });
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mfe_auth_user');
        localStorage.removeItem('microdash_user');
      }
      dispatch({ type: 'AUTH_INIT_DONE' });
    }

    // Subscribe to cross-MFE Auth state changes
    const unsub = eventBus.subscribe(MFE_EVENTS.AUTH_STATE_CHANGED, (user) => {
      if (user) {
        const crossToken = `mfe_cross_${Date.now()}`;
        const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mfe_auth_session', JSON.stringify({ user, token: crossToken, savedAt: Date.now() }));
          localStorage.setItem('mfe_auth_user', JSON.stringify(user));
        }
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: crossToken, expiresAt },
        });
        startSessionTimers(crossToken, expiresAt);
      } else {
        clearPersistedSession();
        clearTimers();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    });

    return () => {
      unsub();
      clearTimers();
    };
  }, []);

  // --- Idle Activity Tracking ---
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    IDLE_RESET_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    return () => {
      IDLE_RESET_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
    };
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      loginUser,
      register,
      logout,
      clearError,
      extendSession,
      dismissWarning,
      failedAttempts: apiService.getFailedAttemptCount(),
      lockoutStatus: apiService.isLockedOut(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

