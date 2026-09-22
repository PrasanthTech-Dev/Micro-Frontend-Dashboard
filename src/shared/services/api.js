/**
 * Enterprise Asynchronous Mock API Service
 * Includes in-memory TTL caching, in-flight promise deduplication,
 * retry policies with exponential backoff, local storage persistence,
 * network connectivity listeners, and deliberate failure/latency controls.
 */

import { eventBus, MFE_EVENTS } from './eventBus.js';

const STORAGE_KEYS = {
  USERS: 'mfe_data_users',
  NOTIFICATIONS: 'mfe_data_notifications',
  FAIL_MODE: 'mfe_simulate_failure',
  LATENCY: 'mfe_simulated_latency',
  NOTIF_PREFS: 'mfe_notification_preferences',
  AUTH_ATTEMPTS: 'mfe_auth_attempts',
  AUTH_LOCKOUT: 'mfe_auth_lockout',
};

// --- Auth Token Helpers ---
const AUTH_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 60000, // 60 seconds
  TOKEN_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes
  REFRESH_THRESHOLD_MS: 2 * 60 * 1000, // refresh if < 2 min left
};

function generateMockJWT(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Date.now();
  const body = btoa(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + AUTH_CONFIG.TOKEN_EXPIRY_MS,
    iss: 'microdash-mfe-auth',
    sub: payload.id || payload.email,
    jti: `${now}-${Math.random().toString(36).substring(2, 10)}`,
  }));
  const sig = btoa(`mock-sig-${Math.random().toString(36).substring(2, 12)}`);
  return `${header}.${body}.${sig}`;
}

function decodeMockJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = decodeMockJWT(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() > decoded.exp;
}

function getTokenRemainingMs(token) {
  const decoded = decodeMockJWT(token);
  if (!decoded || !decoded.exp) return 0;
  return Math.max(0, decoded.exp - Date.now());
}

// Initial Seed Users
const SEED_USERS = [
  {
    id: 'usr-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@enterprise.io',
    role: 'Admin',
    department: 'Engineering',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-01-15',
    lastActive: 'Just now',
    lastIp: '192.168.1.42',
    activityLog: [
      { action: 'Updated security policies', timestamp: '10m ago' },
      { action: 'Provisioned Kubernetes node pool', timestamp: '2h ago' },
      { action: 'Assigned Manager role to Marcus', timestamp: '1d ago' },
    ],
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@enterprise.io',
    role: 'Manager',
    department: 'Product',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-02-01',
    lastActive: '5m ago',
    lastIp: '192.168.1.88',
    activityLog: [
      { action: 'Exported quarterly conversion funnel', timestamp: '25m ago' },
      { action: 'Approved feature release sprint', timestamp: '4h ago' },
    ],
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.io',
    role: 'Viewer',
    department: 'Marketing',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-03-10',
    lastActive: '1h ago',
    lastIp: '10.0.4.12',
    activityLog: [
      { action: 'Reviewed campaign analytics report', timestamp: '1h ago' },
    ],
  },
  {
    id: 'usr-4',
    name: 'David Kim',
    email: 'david.kim@enterprise.io',
    role: 'Manager',
    department: 'Finance',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-04-18',
    lastActive: '2h ago',
    lastIp: '10.0.8.21',
    activityLog: [
      { action: 'Generated invoice reconciliation ledger', timestamp: '2h ago' },
    ],
  },
  {
    id: 'usr-5',
    name: 'Amara Okafor',
    email: 'amara.okafor@enterprise.io',
    role: 'Admin',
    department: 'Operations',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-05-02',
    lastActive: '30m ago',
    lastIp: '192.168.3.15',
    activityLog: [
      { action: 'Configured automated database failover', timestamp: '30m ago' },
    ],
  },
  {
    id: 'usr-6',
    name: 'Julian Hayes',
    email: 'julian.hayes@enterprise.io',
    role: 'Viewer',
    department: 'Sales',
    status: 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-06-12',
    lastActive: '3d ago',
    lastIp: '172.16.0.5',
    activityLog: [
      { action: 'Completed sales onboarding module', timestamp: '3d ago' },
    ],
  },
  {
    id: 'usr-7',
    name: 'Priya Sharma',
    email: 'priya.sharma@enterprise.io',
    role: 'Manager',
    department: 'Engineering',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-07-20',
    lastActive: '12m ago',
    lastIp: '192.168.2.99',
    activityLog: [
      { action: 'Merged micro-frontend federation PR', timestamp: '12m ago' },
    ],
  },
  {
    id: 'usr-8',
    name: 'Lucas Dupont',
    email: 'lucas.dupont@enterprise.io',
    role: 'Viewer',
    department: 'Customer Support',
    status: 'Suspended',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-08-05',
    lastActive: '2w ago',
    lastIp: '192.168.9.11',
    activityLog: [
      { action: 'Account temporarily suspended by security', timestamp: '2w ago' },
    ],
  },
];

// Initial Seed Notifications
const SEED_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Cluster Node Scaled',
    message: 'Analytics remote worker auto-scaled to 8 instances to handle peak workload.',
    type: 'success',
    category: 'System',
    read: false,
    timestamp: '10 minutes ago',
  },
  {
    id: 'notif-2',
    title: 'New User Registered',
    message: 'Priya Sharma was added to the Engineering workspace as a Manager.',
    type: 'info',
    category: 'Users',
    read: false,
    timestamp: '25 minutes ago',
  },
  {
    id: 'notif-3',
    title: 'API Rate Limit Warning',
    message: 'Billing gateway reached 84% capacity threshold over the last hour.',
    type: 'warning',
    category: 'Security',
    read: false,
    timestamp: '2 hours ago',
  },
  {
    id: 'notif-4',
    title: 'Database Backup Completed',
    message: 'Automated snapshot backup completed successfully across all US-East regions.',
    type: 'info',
    category: 'System',
    read: true,
    timestamp: '5 hours ago',
  },
  {
    id: 'notif-5',
    title: 'Failed Login Attempt Detected',
    message: 'Three failed attempts detected from IP 192.168.1.105. Account temporarily throttled.',
    type: 'error',
    category: 'Security',
    read: true,
    timestamp: '1 day ago',
  },
];

const DEFAULT_PREFERENCES = {
  System: { inApp: true, email: true, slack: true, push: false },
  Users: { inApp: true, email: true, slack: false, push: false },
  Security: { inApp: true, email: true, slack: true, push: true },
  Billing: { inApp: true, email: true, slack: false, push: false },
};

class MockApiService {
  constructor() {
    this.cache = new Map();
    this.inFlightRequests = new Map();
    this.defaultTtl = 20000; // 20 seconds TTL
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.initStorage();
    this.initNetworkListener();
  }

  initStorage() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIF_PREFS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIF_PREFS, JSON.stringify(DEFAULT_PREFERENCES));
    }
  }

  initNetworkListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      this.isOnline = true;
      eventBus.publish(MFE_EVENTS.NETWORK_STATUS_CHANGED, { isOnline: true }, 'network');
      eventBus.setState('network', { isOnline: true });
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      eventBus.publish(MFE_EVENTS.NETWORK_STATUS_CHANGED, { isOnline: false }, 'network');
      eventBus.setState('network', { isOnline: false });
    });
  }

  getSimulatedLatency() {
    if (typeof window === 'undefined') return 250;
    const lat = localStorage.getItem(STORAGE_KEYS.LATENCY);
    return lat ? parseInt(lat, 10) : 250;
  }

  setSimulatedLatency(ms) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LATENCY, ms.toString());
    }
  }

  isFailureSimulated() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.FAIL_MODE) === 'true';
  }

  setFailureSimulation(enable) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FAIL_MODE, enable ? 'true' : 'false');
    }
  }

  async delay() {
    const ms = this.getSimulatedLatency();
    await new Promise((resolve) => setTimeout(resolve, ms));

    if (!this.isOnline) {
      throw new Error('Network Offline: Browser connection is currently unavailable.');
    }

    if (this.isFailureSimulated()) {
      throw new Error('Simulated Network Error: Service endpoint returned HTTP 503 Service Unavailable');
    }
  }

  async withRetry(operation, retries = 2, delayMs = 250) {
    try {
      return await operation();
    } catch (err) {
      if (retries <= 0 || !this.isOnline) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.withRetry(operation, retries - 1, delayMs * 1.5);
    }
  }

  async fetchWithCache(cacheKey, fetcher, ttlMs = this.defaultTtl) {
    const now = Date.now();
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now < cached.expiry) {
        return JSON.parse(JSON.stringify(cached.data));
      }
      this.cache.delete(cacheKey);
    }

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = this.withRetry(async () => {
      const data = await fetcher();
      this.cache.set(cacheKey, {
        data,
        expiry: now + ttlMs,
        cachedAt: new Date().toLocaleTimeString(),
      });
      return data;
    }).finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    this.inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  invalidateCache(pattern = '') {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
    eventBus.publish(MFE_EVENTS.CACHE_INVALIDATED, { pattern }, 'api');
  }

  getCacheStats() {
    return Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      cachedAt: item.cachedAt,
      ttlRemainingSec: Math.max(0, Math.round((item.expiry - Date.now()) / 1000)),
    }));
  }

  // --- Authentication API ---
  isLockedOut() {
    if (typeof window === 'undefined') return { locked: false };
    const lockUntil = parseInt(localStorage.getItem(STORAGE_KEYS.AUTH_LOCKOUT) || '0', 10);
    if (lockUntil > Date.now()) {
      return { locked: true, remainingMs: lockUntil - Date.now() };
    }
    // Clear stale lockout
    if (lockUntil > 0) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_LOCKOUT);
      localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, '0');
    }
    return { locked: false };
  }

  _recordFailedAttempt() {
    if (typeof window === 'undefined') return 0;
    const attempts = parseInt(localStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, String(attempts));
    if (attempts >= AUTH_CONFIG.MAX_ATTEMPTS) {
      localStorage.setItem(STORAGE_KEYS.AUTH_LOCKOUT, String(Date.now() + AUTH_CONFIG.LOCKOUT_DURATION_MS));
    }
    return attempts;
  }

  _clearFailedAttempts() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, '0');
    localStorage.removeItem(STORAGE_KEYS.AUTH_LOCKOUT);
  }

  getFailedAttemptCount() {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS) || '0', 10);
  }

  async login(email, password) {
    // Check lockout
    const lockStatus = this.isLockedOut();
    if (lockStatus.locked) {
      const remainSec = Math.ceil(lockStatus.remainingMs / 1000);
      throw {
        code: 'AUTH_RATE_LIMITED',
        message: `Too many failed attempts. Try again in ${remainSec}s.`,
        remainingMs: lockStatus.remainingMs,
        status: 429,
      };
    }

    await this.delay();

    // Validate inputs
    if (!email || !password) {
      throw { code: 'AUTH_INVALID_INPUT', message: 'Email and password are required.', status: 400 };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw { code: 'AUTH_INVALID_EMAIL', message: 'Please enter a valid email address.', status: 400 };
    }

    if (password.length < 6) {
      this._recordFailedAttempt();
      throw { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password.', status: 401 };
    }

    // Determine role from email for mock
    const role = email.includes('admin') ? 'Admin' : email.includes('manager') ? 'Manager' : 'Viewer';
    const namePart = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const user = {
      id: `usr-${Date.now()}`,
      name: `${namePart} (${role})`,
      email,
      role,
      department: 'Engineering',
      status: 'Active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      loginAt: new Date().toISOString(),
      mfaVerified: true,
    };

    const token = generateMockJWT(user);
    this._clearFailedAttempts();

    return {
      success: true,
      user,
      token,
      expiresIn: AUTH_CONFIG.TOKEN_EXPIRY_MS,
    };
  }

  async register(name, email, password) {
    await this.delay();

    // Validate inputs
    if (!name || !email || !password) {
      throw { code: 'REG_INVALID_INPUT', message: 'All fields are required.', status: 400 };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw { code: 'REG_INVALID_EMAIL', message: 'Please enter a valid email address.', status: 400 };
    }

    if (password.length < 6) {
      throw { code: 'REG_WEAK_PASSWORD', message: 'Password must be at least 6 characters.', status: 400 };
    }

    // Check email uniqueness against existing users
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : SEED_USERS;
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw { code: 'REG_EMAIL_EXISTS', message: 'An account with this email already exists.', status: 409 };
    }

    const role = email.includes('admin') ? 'Admin' : email.includes('manager') ? 'Manager' : 'Viewer';

    const user = {
      id: `usr-${Date.now()}`,
      name: `${name} (${role})`,
      email,
      role,
      department: 'Engineering',
      status: 'Active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      loginAt: new Date().toISOString(),
      mfaVerified: true,
    };

    const token = generateMockJWT(user);
    return {
      success: true,
      user,
      token,
      expiresIn: AUTH_CONFIG.TOKEN_EXPIRY_MS,
    };
  }

  async checkEmailExists(email) {
    await new Promise((r) => setTimeout(r, 100));
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : SEED_USERS;
    return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  refreshToken(currentToken) {
    const decoded = decodeMockJWT(currentToken);
    if (!decoded) return null;
    // Generate a fresh token with the same user payload
    const { iat, exp, jti, ...userPayload } = decoded;
    return generateMockJWT(userPayload);
  }

  getTokenExpiryMs(token) {
    return getTokenRemainingMs(token);
  }

  isTokenValid(token) {
    return token && !isTokenExpired(token);
  }

  // --- Users API ---
  async getUsers({ search = '', role = 'All', status = 'All', sortBy = 'name', sortOrder = 'asc' } = {}) {
    const cacheKey = `users:${search}:${role}:${status}:${sortBy}:${sortOrder}`;
    return this.fetchWithCache(cacheKey, async () => {
      await this.delay();
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      let users = raw ? JSON.parse(raw) : SEED_USERS;

      if (search && search.trim()) {
        const q = search.toLowerCase();
        users = users.filter((u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
        );
      }
      if (role && role !== 'All' && role !== '') {
        users = users.filter((u) => u.role.toLowerCase() === role.toLowerCase());
      }
      if (status && status !== 'All' && status !== '') {
        users = users.filter((u) => u.status.toLowerCase() === status.toLowerCase());
      }

      users.sort((a, b) => {
        const fieldA = (a[sortBy] || '').toString().toLowerCase();
        const fieldB = (b[sortBy] || '').toString().toLowerCase();
        if (sortOrder === 'desc') {
          return fieldB.localeCompare(fieldA);
        }
        return fieldA.localeCompare(fieldB);
      });

      return [...users];
    });
  }

  async getUserById(id) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : SEED_USERS;
    const user = users.find((u) => String(u.id) === String(id));
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  }

  async createUser(userData) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : [...SEED_USERS];

    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error(`A user with email "${userData.email}" already exists.`);
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'Viewer',
      department: userData.department || 'Engineering',
      status: userData.status || 'Active',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      lastIp: '127.0.0.1 (Direct)',
      activityLog: [{ action: 'Account created via Directory MFE', timestamp: 'Just now' }],
    };

    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.invalidateCache('users');
    this.invalidateCache('dashboard');
    eventBus.publish(MFE_EVENTS.USER_MUTATED, { action: 'create', user: newUser }, 'users');
    return { success: true, data: newUser };
  }

  async updateUser(id, updates) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users = raw ? JSON.parse(raw) : [...SEED_USERS];
    const index = users.findIndex((u) => String(u.id) === String(id));

    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }

    if (updates.email && updates.email !== users[index].email) {
      if (users.some((u) => String(u.id) !== String(id) && u.email.toLowerCase() === updates.email.toLowerCase())) {
        throw new Error(`Email "${updates.email}" is already in use by another account.`);
      }
    }

    const updatedUser = {
      ...users[index],
      ...updates,
      activityLog: [
        { action: 'Account modified via Directory MFE', timestamp: 'Just now' },
        ...(users[index].activityLog || []),
      ],
    };

    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.invalidateCache('users');
    this.invalidateCache('dashboard');
    eventBus.publish(MFE_EVENTS.USER_MUTATED, { action: 'update', user: updatedUser }, 'users');
    return { success: true, data: updatedUser };
  }

  async deleteUser(id) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users = raw ? JSON.parse(raw) : [...SEED_USERS];
    const filtered = users.filter((u) => String(u.id) !== String(id));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.invalidateCache('users');
    this.invalidateCache('dashboard');
    eventBus.publish(MFE_EVENTS.USER_MUTATED, { action: 'delete', id }, 'users');
    return { success: true, id };
  }

  async bulkDeleteUsers(ids = []) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users = raw ? JSON.parse(raw) : [...SEED_USERS];
    const idSet = new Set(ids.map(String));
    const filtered = users.filter((u) => !idSet.has(String(u.id)));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.invalidateCache('users');
    this.invalidateCache('dashboard');
    eventBus.publish(MFE_EVENTS.USER_MUTATED, { action: 'bulkDelete', count: ids.length }, 'users');
    return { success: true, count: ids.length };
  }

  // --- Notifications API ---
  async getNotifications() {
    return this.fetchWithCache('notifications:all', async () => {
      await this.delay();
      const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return raw ? JSON.parse(raw) : [...SEED_NOTIFICATIONS];
    }, 5000);
  }

  async markNotificationRead(id) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs = raw ? JSON.parse(raw) : [...SEED_NOTIFICATIONS];
    notifs = notifs.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.invalidateCache('notifications');
    return notifs;
  }

  async markAllNotificationsRead() {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs = raw ? JSON.parse(raw) : [...SEED_NOTIFICATIONS];
    notifs = notifs.map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.invalidateCache('notifications');
    return notifs;
  }

  async deleteNotification(id) {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs = raw ? JSON.parse(raw) : [...SEED_NOTIFICATIONS];
    notifs = notifs.filter((n) => String(n.id) !== String(id));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.invalidateCache('notifications');
    return notifs;
  }

  async deleteAllReadNotifications() {
    await this.delay();
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs = raw ? JSON.parse(raw) : [...SEED_NOTIFICATIONS];
    notifs = notifs.filter((n) => !n.read);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.invalidateCache('notifications');
    return notifs;
  }

  async addNotification(notif) {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs = raw ? JSON.parse(raw) : [...SEED_NOTIFICATIONS];
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: notif.title || 'System Update',
      message: notif.message || 'Action was performed.',
      type: notif.type || 'info',
      category: notif.category || 'General',
      read: false,
      timestamp: 'Just now',
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.invalidateCache('notifications');
    eventBus.publish(MFE_EVENTS.NOTIFICATION_EMIT, newNotif, 'notifications');
    return newNotif;
  }

  async getNotificationPreferences() {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIF_PREFS);
    return raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
  }

  async updateNotificationPreferences(prefs) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NOTIF_PREFS, JSON.stringify(prefs));
    }
    return prefs;
  }

  // --- Metrics & Analytics API ---
  async getDashboardMetrics(timeframe = '30d') {
    const cacheKey = `dashboard:metrics:${timeframe}`;
    return this.fetchWithCache(cacheKey, async () => {
      await this.delay();
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = rawUsers ? JSON.parse(rawUsers) : SEED_USERS;
      const activeCount = users.filter((u) => u.status === 'Active').length;

      const multipliers = {
        '7d': { rev: 284500, revFmt: '$284,500', revChange: '+8.1%', userMul: 850, userChange: '+4.2%' },
        '30d': { rev: 1248500, revFmt: '$1,248,500', revChange: '+14.2%', userMul: 3120, userChange: '+8.4%' },
        '90d': { rev: 3840000, revFmt: '$3,840,000', revChange: '+22.6%', userMul: 9400, userChange: '+15.1%' },
        'ytd': { rev: 14200000, revFmt: '$14,200,000', revChange: '+31.4%', userMul: 36000, userChange: '+28.0%' },
      }[timeframe] || { rev: 1248500, revFmt: '$1,248,500', revChange: '+14.2%', userMul: 3120, userChange: '+8.4%' };

      // Generate realistic trajectory data for the revenue chart
      const trajectoryConfigs = {
        '7d': [
          { label: 'Mon', actual: 34200, target: 36000, volume: 420 },
          { label: 'Tue', actual: 38500, target: 37500, volume: 465 },
          { label: 'Wed', actual: 41200, target: 39000, volume: 512 },
          { label: 'Thu', actual: 39800, target: 40000, volume: 490 },
          { label: 'Fri', actual: 46500, target: 42000, volume: 580 },
          { label: 'Sat', actual: 42100, target: 43000, volume: 520 },
          { label: 'Sun', actual: 48200, target: 45000, volume: 610 },
        ],
        '30d': [
          { label: 'Sep 01', actual: 38000, target: 42000, volume: 1120 },
          { label: 'Sep 04', actual: 46000, target: 45000, volume: 1240 },
          { label: 'Sep 07', actual: 55000, target: 50000, volume: 1480 },
          { label: 'Sep 10', actual: 51000, target: 54000, volume: 1390 },
          { label: 'Sep 13', actual: 65000, target: 60000, volume: 1680 },
          { label: 'Sep 16', actual: 72000, target: 68000, volume: 1850 },
          { label: 'Sep 19', actual: 84000, target: 75000, volume: 2100 },
          { label: 'Sep 22', actual: 96000, target: 82000, volume: 2450 },
          { label: 'Sep 25', actual: 108000, target: 90000, volume: 2780 },
          { label: 'Sep 28', actual: 115000, target: 98000, volume: 2950 },
          { label: 'Sep 30', actual: 128500, target: 105000, volume: 3240 },
        ],
        '90d': [
          { label: 'Wk 01', actual: 180000, target: 200000, volume: 4500 },
          { label: 'Wk 02', actual: 210000, target: 215000, volume: 5100 },
          { label: 'Wk 03', actual: 245000, target: 230000, volume: 5900 },
          { label: 'Wk 04', actual: 260000, target: 250000, volume: 6300 },
          { label: 'Wk 05', actual: 295000, target: 270000, volume: 7100 },
          { label: 'Wk 06', actual: 310000, target: 290000, volume: 7600 },
          { label: 'Wk 07', actual: 340000, target: 310000, volume: 8200 },
          { label: 'Wk 08', actual: 385000, target: 335000, volume: 9100 },
          { label: 'Wk 09', actual: 420000, target: 360000, volume: 9900 },
          { label: 'Wk 10', actual: 460000, target: 390000, volume: 10800 },
          { label: 'Wk 11', actual: 495000, target: 415000, volume: 11600 },
          { label: 'Wk 12', actual: 540000, target: 440000, volume: 12800 },
        ],
        'ytd': [
          { label: 'Jan', actual: 780000, target: 800000, volume: 19500 },
          { label: 'Feb', actual: 890000, target: 880000, volume: 22100 },
          { label: 'Mar', actual: 1050000, target: 980000, volume: 26400 },
          { label: 'Apr', actual: 1180000, target: 1100000, volume: 29800 },
          { label: 'May', actual: 1340000, target: 1220000, volume: 33500 },
          { label: 'Jun', actual: 1520000, target: 1350000, volume: 38200 },
          { label: 'Jul', actual: 1690000, target: 1500000, volume: 42500 },
          { label: 'Aug', actual: 1880000, target: 1650000, volume: 47000 },
          { label: 'Sep', actual: 2150000, target: 1800000, volume: 53500 },
        ],
      };

      const jitter = Math.floor(Math.random() * 80) - 30;
      const currentRev = multipliers.rev + Math.floor(Math.random() * 2400) - 800;
      const currentActive = Math.max(1, activeCount * multipliers.userMul + 24800 + jitter);
      const healthJitter = Number(((Math.random() * 0.03) - 0.01).toFixed(2));
      const currentHealth = Math.min(100, Math.max(99.9, Number((99.98 + healthJitter).toFixed(2))));
      const convJitter = Number(((Math.random() * 0.08) - 0.04).toFixed(2));
      const currentConv = Math.max(0.1, Number((3.82 + convJitter).toFixed(2)));

      const baseTrajectory = trajectoryConfigs[timeframe] || trajectoryConfigs['30d'];
      const dynamicTrajectory = baseTrajectory.map((pt, idx) => {
        if (idx >= baseTrajectory.length - 2) {
          const varVal = Math.floor(Math.random() * 1200) - 500;
          return { ...pt, actual: pt.actual + varVal, volume: pt.volume + Math.floor(varVal / 60) };
        }
        return pt;
      });

      return {
        revenue: {
          value: currentRev,
          formatted: `$${currentRev.toLocaleString()}`,
          change: multipliers.revChange,
          isPositive: true,
          period: `vs prior ${timeframe.toUpperCase()}`,
          sparkline: [35, 42, 48, 45, 58, 62, 70, 75, 82, 90, 88, Math.min(100, Math.max(70, 96 + Math.floor(jitter / 4)))],
        },
        revenueTrend: dynamicTrajectory,
        activeUsers: {
          value: currentActive,
          formatted: currentActive.toLocaleString(),
          change: multipliers.userChange,
          isPositive: true,
          period: `vs prior ${timeframe.toUpperCase()}`,
          sparkline: [20, 24, 22, 28, 32, 35, 40, 42, 45, 48, 52, Math.min(70, Math.max(40, 55 + Math.floor(jitter / 8)))],
        },
        conversionRate: {
          value: currentConv,
          formatted: `${currentConv}%`,
          change: '+1.2%',
          isPositive: true,
          period: 'vs benchmark',
          sparkline: [3.1, 3.2, 3.0, 3.4, 3.5, 3.6, 3.5, 3.7, currentConv],
        },
        systemHealth: {
          value: currentHealth,
          formatted: `${currentHealth}%`,
          change: '+0.02%',
          isPositive: true,
          period: '30-day uptime',
          sparkline: [99.9, 99.92, 99.95, 99.94, 99.98, 99.98, currentHealth],
        },
        clusterStatus: [
          { name: 'Auth MFE', port: 5001, status: 'Healthy', ping: '12ms', version: 'v1.0.0' },
          { name: 'Dashboard MFE', port: 5002, status: 'Healthy', ping: '18ms', version: 'v1.0.0' },
          { name: 'Users MFE', port: 5003, status: 'Healthy', ping: '15ms', version: 'v1.0.0' },
          { name: 'Analytics MFE', port: 5004, status: 'Healthy', ping: '24ms', version: 'v1.0.0' },
          { name: 'Notifications MFE', port: 5005, status: 'Healthy', ping: '10ms', version: 'v1.0.0' },
        ],
      };
    }, 15000);
  }

  async getAnalyticsData(timeframe = '30d') {
    const cacheKey = `analytics:${timeframe}`;
    return this.fetchWithCache(cacheKey, async () => {
      await this.delay();
      const pointsCount = timeframe === '7d' ? 7 : timeframe === '90d' ? 12 : timeframe === 'ytd' ? 12 : 15;

      const revenueTrend = Array.from({ length: pointsCount }, (_, i) => {
        const base = 40000 + i * 5000;
        const target = base + 3000;
        const actual = base + Math.floor(Math.sin(i) * 6000) + 2000;
        const label = timeframe === '7d' ? `Day ${i + 1}` : timeframe === '90d' ? `Wk ${i + 1}` : `Sep ${i + 1}`;
        return { label, actual, target };
      });

      const monthlyCohorts = [
        { month: 'Apr', newUsers: 1420, activeMRR: 84000 },
        { month: 'May', newUsers: 1890, activeMRR: 98000 },
        { month: 'Jun', newUsers: 2210, activeMRR: 112000 },
        { month: 'Jul', newUsers: 2750, activeMRR: 135000 },
        { month: 'Aug', newUsers: 3100, activeMRR: 158000 },
        { month: 'Sep', newUsers: 3640, activeMRR: 182000 },
      ];

      const trafficChannels = [
        { name: 'Organic Search', visitors: 48200, percentage: 42, color: '#6366f1' },
        { name: 'Direct Traffic', visitors: 28400, percentage: 25, color: '#06b6d4' },
        { name: 'Social Media', visitors: 21600, percentage: 19, color: '#10b981' },
        { name: 'Referral & Ads', visitors: 16100, percentage: 14, color: '#f59e0b' },
      ];

      const conversionFunnel = [
        { stage: 'Unique Visitors', count: 114300, dropoff: '100%', tip: 'Initial discovery across channels' },
        { stage: 'Product Views', count: 68400, dropoff: '59.8%', tip: 'Inspect feature details and pricing' },
        { stage: 'Added to Cart', count: 24200, dropoff: '35.4%', tip: 'Seat selection and tier options' },
        { stage: 'Checkout Initiated', count: 12100, dropoff: '50.0%', tip: 'Billing address and invoice config' },
        { stage: 'Completed Purchase', count: 4366, dropoff: '36.1%', tip: 'Successful tokenized charge' },
      ];

      const deviceBreakdown = [
        { device: 'Desktop', share: 58, color: '#6366f1' },
        { device: 'Mobile', share: 36, color: '#06b6d4' },
        { device: 'Tablet', share: 6, color: '#a855f7' },
      ];

      return {
        revenueTrend,
        monthlyCohorts,
        trafficChannels,
        conversionFunnel,
        deviceBreakdown,
        totalVolume: '$428,950',
        avgOrderValue: '$98.24',
        retentionRate: '68.4%',
      };
    }, 20000);
  }

  // --- Backwards Compatibility Adapters ---
  async getDashboardStats() {
    const metrics = await this.getDashboardMetrics('30d');
    return {
      totalUsers: 14200,
      activeUsers: metrics.activeUsers.value,
      revenue: metrics.revenue.value,
      growth: 14.2,
      conversionRate: metrics.conversionRate.value,
      avgSessionDuration: '4m 32s',
      bounceRate: 31.8,
      newSignups: 342,
    };
  }

  async getRevenueData() {
    const data = await this.getAnalyticsData('30d');
    return data.revenueTrend.map((r, i) => ({
      month: r.label,
      revenue: r.actual,
      expenses: Math.round(r.actual * 0.6),
      profit: Math.round(r.actual * 0.4),
    }));
  }

  async getTrafficData() {
    return [
      { date: 'Mon', visitors: 4200, pageViews: 12600, sessions: 5800 },
      { date: 'Tue', visitors: 4800, pageViews: 14400, sessions: 6200 },
      { date: 'Wed', visitors: 5100, pageViews: 15300, sessions: 6800 },
      { date: 'Thu', visitors: 4600, pageViews: 13800, sessions: 6100 },
      { date: 'Fri', visitors: 5500, pageViews: 16500, sessions: 7200 },
      { date: 'Sat', visitors: 3800, pageViews: 11400, sessions: 4900 },
      { date: 'Sun', visitors: 3200, pageViews: 9600, sessions: 4100 },
    ];
  }

  async getConversionData() {
    const data = await this.getAnalyticsData('30d');
    return data.conversionFunnel.map((f) => ({
      name: f.stage,
      visitors: f.count,
      conversions: Math.round(f.count * 0.1),
      rate: parseFloat(f.dropoff) || 5.0,
    }));
  }

  async getAnalyticsMetrics() {
    const data = await this.getAnalyticsData('30d');
    return {
      totalViews: 142800,
      viewsGrowth: 14.2,
      bounceRate: 31.8,
      bounceGrowth: -2.1,
      avgDuration: '4m 12s',
      durationGrowth: 8.5,
      conversionRate: 3.82,
      convGrowth: 1.2,
      topPages: [
        { page: '/dashboard', views: 54200 },
        { page: '/users', views: 38100 },
        { page: '/analytics', views: 24900 },
        { page: '/notifications', views: 18400 },
        { page: '/auth', views: 7200 },
      ],
    };
  }

  async markAllNotificationsAsRead() {
    return this.markAllNotificationsRead();
  }

  resetToFactoryDefaults() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.NOTIF_PREFS, JSON.stringify(DEFAULT_PREFERENCES));
    localStorage.setItem(STORAGE_KEYS.FAIL_MODE, 'false');
    localStorage.setItem(STORAGE_KEYS.LATENCY, '250');
    this.cache.clear();
    this.invalidateCache();
  }
}

export const apiService = new MockApiService();
export const api = apiService;
export { AUTH_CONFIG, generateMockJWT, decodeMockJWT, isTokenExpired, getTokenRemainingMs };
