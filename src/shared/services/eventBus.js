/**
 * Cross-Micro-Frontend Pub-Sub Event Bus & Global State Store
 * Decoupled, typed event communication across independent micro-frontend modules
 * with state replay caching and audit logging for DevTools inspection.
 */

export const MFE_EVENTS = {
  AUTH_STATE_CHANGED: 'mfe:auth-changed',
  NOTIFICATION_EMIT: 'mfe:notification-emit',
  NOTIFICATION_READ: 'mfe:notification-read',
  NOTIFICATION_CLEARED: 'mfe:notification-cleared',
  NAVIGATE: 'mfe:navigate',
  USER_MUTATED: 'mfe:user-mutated',
  USER_CREATED: 'mfe:user-created',
  USER_UPDATED: 'mfe:user-updated',
  USER_DELETED: 'mfe:user-deleted',
  THEME_TOGGLE: 'mfe:theme-toggle',
  SIMULATE_ERROR: 'mfe:simulate-error',
  REFRESH_DATA: 'mfe:refresh-data',
  DASHBOARD_REFRESH: 'mfe:dashboard-refresh',
  NETWORK_STATUS_CHANGED: 'mfe:network-status-changed',
  CACHE_INVALIDATED: 'mfe:cache-invalidated',
  SESSION_TIMEOUT_WARNING: 'mfe:session-timeout-warning',
  COMMAND_PALETTE_TOGGLE: 'mfe:command-palette-toggle',
  PREFERENCES_CHANGED: 'mfe:preferences-changed',
};

// Backwards compatibility alias
export const EVENTS = MFE_EVENTS;

class MicroFrontendEventBus {
  constructor() {
    this.target = typeof window !== 'undefined' ? window : new EventTarget();
    this.history = [];
    this.maxHistory = 80;
    this.state = new Map();
  }

  setState(slice, value, sender = 'system') {
    this.state.set(slice, value);
    this.publish(`mfe:state:${slice}`, value, sender);
  }

  getState(slice) {
    return this.state.get(slice);
  }

  subscribeState(slice, callback) {
    if (this.state.has(slice)) {
      callback(this.state.get(slice), { sender: 'state-replay', timestamp: new Date().toISOString() });
    }
    return this.subscribe(`mfe:state:${slice}`, callback);
  }

  publish(eventType, payload = {}, sender = 'system') {
    const timestamp = new Date().toISOString();
    const eventRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: eventType,
      payload,
      sender,
      timestamp,
    };

    this.history.unshift(eventRecord);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent(eventType, {
        detail: eventRecord,
        bubbles: true,
        composed: true,
      });
      window.dispatchEvent(customEvent);

      window.dispatchEvent(
        new CustomEvent('mfe:any-event', { detail: eventRecord })
      );
    }
  }

  // Alias for backward compatibility
  emit(eventType, payload, sender) {
    this.publish(eventType, payload, sender);
  }

  subscribe(eventType, callback) {
    if (typeof window === 'undefined') return () => {};

    const handler = (event) => {
      const detail = event.detail || {};
      callback(detail.payload, detail);
    };

    window.addEventListener(eventType, handler);

    return () => {
      window.removeEventListener(eventType, handler);
    };
  }

  // Alias for backward compatibility
  on(eventType, callback) {
    return this.subscribe(eventType, callback);
  }

  subscribeAll(callback) {
    if (typeof window === 'undefined') return () => {};

    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener('mfe:any-event', handler);
    return () => {
      window.removeEventListener('mfe:any-event', handler);
    };
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mfe:history-cleared'));
    }
  }
}

export const eventBus = new MicroFrontendEventBus();
