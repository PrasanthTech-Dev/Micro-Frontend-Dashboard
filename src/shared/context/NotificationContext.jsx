import { createContext, useReducer, useCallback, useContext } from 'react';

export const NotificationContext = createContext(null);

const initialState = {
  toasts: [],
};

let toastId = 0;

function notificationReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { id: ++toastId, ...action.payload }],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    case 'CLEAR_TOASTS':
      return { ...state, toasts: [] };
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    dispatch({ type: 'ADD_TOAST', payload: { message, type, duration } });
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, []);

  return (
    <NotificationContext.Provider value={{ ...state, addToast, removeToast, clearToasts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useToast() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useToast must be used within NotificationProvider');
  return context;
}
