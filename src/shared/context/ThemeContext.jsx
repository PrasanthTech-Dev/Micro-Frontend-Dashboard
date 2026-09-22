import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { eventBus, EVENTS, MFE_EVENTS } from '../services/eventBus.js';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('microdash_theme') || localStorage.getItem('mfe_theme');
      if (stored) return stored;
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      document.body.className = theme;
      localStorage.setItem('microdash_theme', theme);
      localStorage.setItem('mfe_theme', theme);
      eventBus.publish(EVENTS.THEME_CHANGED, theme);
      eventBus.publish(MFE_EVENTS.THEME_TOGGLE, { isDark: theme === 'dark' }, 'theme');
    }
  }, [theme]);

  // Synchronize with external theme toggle events
  useEffect(() => {
    const unsub = eventBus.subscribe(MFE_EVENTS.THEME_TOGGLE, (payload) => {
      if (payload && typeof payload.isDark === 'boolean') {
        setTheme(payload.isDark ? 'dark' : 'light');
      }
    });
    return unsub;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
