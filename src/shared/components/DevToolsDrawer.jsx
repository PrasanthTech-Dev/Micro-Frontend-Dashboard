import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  Zap,
  RotateCcw,
  Sliders,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { Badge } from './Badge.jsx';
import { Button } from './Button.jsx';
import { eventBus, MFE_EVENTS } from '../services/eventBus.js';
import { apiService } from '../services/api.js';

export function DevToolsDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'network' | 'cache' | 'topology'
  const [events, setEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);

  // Network simulator settings
  const [isFailMode, setIsFailMode] = useState(() => apiService.isFailureSimulated());
  const [latency, setLatency] = useState(() => apiService.getSimulatedLatency());

  // Cache stats
  const [cacheStats, setCacheStats] = useState([]);

  useEffect(() => {
    setEvents(eventBus.getHistory());

    const unsub = eventBus.subscribeAll((eventRecord) => {
      setEvents((prev) => [eventRecord, ...prev].slice(0, 60));
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updateStats = () => setCacheStats(apiService.getCacheStats());
    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleToggleFailMode = () => {
    const next = !isFailMode;
    setIsFailMode(next);
    apiService.setFailureSimulation(next);
    eventBus.publish(MFE_EVENTS.SIMULATE_ERROR, { failMode: next }, 'devtools');
    eventBus.publish(
      MFE_EVENTS.NOTIFICATION_EMIT,
      {
        title: next ? 'Network Failure Mode Activated' : 'Network Normal Restored',
        message: next
          ? 'API endpoints will now return HTTP 503 errors to test MFE error boundaries & retry logic.'
          : 'API endpoints have resumed standard 200 OK operations.',
        type: next ? 'error' : 'success',
      },
      'devtools'
    );
  };

  const handleLatencyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setLatency(val);
    apiService.setSimulatedLatency(val);
  };

  const handleClearCache = () => {
    apiService.invalidateCache();
    setCacheStats([]);
    eventBus.publish(
      MFE_EVENTS.NOTIFICATION_EMIT,
      {
        title: 'Cache Purged',
        message: 'In-memory TTL cache entries were invalidated.',
        type: 'info',
      },
      'devtools'
    );
  };

  const handleResetDefaults = () => {
    apiService.resetToFactoryDefaults();
    setIsFailMode(false);
    setLatency(250);
    eventBus.publish(
      MFE_EVENTS.NOTIFICATION_EMIT,
      {
        title: 'Factory Defaults Restored',
        message: 'Seed user directory and notification records have been reset in localStorage.',
        type: 'info',
      },
      'devtools'
    );
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[580px] h-[540px] max-h-[85vh] rounded-t-3xl bg-white/95 dark:bg-slate-950/95 border-t border-l border-r border-indigo-500/30 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>MFE Architecture DevTools</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                Live Inspector
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cross-module event bus telemetry, network throttle & cache monitoring
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Event Bus ({events.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'network'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Network Throttle</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cache')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cache'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>TTL Cache ({cacheStats.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'topology'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Topology</span>
          </button>
        </div>

        {activeTab === 'events' && events.length > 0 && (
          <button
            type="button"
            onClick={() => {
              eventBus.clearHistory();
              setEvents([]);
            }}
            className="text-[11px] text-slate-500 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
            title="Clear event history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'events' && (
          <div className="space-y-2.5">
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No events recorded yet. Trigger an action in any MFE to watch events stream in real-time.
              </div>
            ) : (
              events.map((evt) => {
                const isExpanded = expandedEventId === evt.id;
                return (
                  <div
                    key={evt.id}
                    className="rounded-xl bg-slate-900/70 border border-slate-800 text-xs overflow-hidden transition-all"
                  >
                    <div
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-850"
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 uppercase shrink-0">
                          {evt.sender}
                        </span>
                        <span className="font-mono text-slate-200 truncate font-semibold">
                          {evt.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 bg-black/40 border-t border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
                        <div className="text-slate-500 mb-1 text-[10px] uppercase font-bold">
                          Transmitted Payload:
                        </div>
                        <pre className="text-emerald-400">
                          {JSON.stringify(evt.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-5 text-xs">
            {/* Fail Mode Simulator */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Simulate HTTP 503 Network Failure</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Forces all mock API calls to reject with network failure to evaluate Error Boundaries and Retry triggers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleFailMode}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFailMode ? 'bg-rose-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      isFailMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {isFailMode && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Failure mode active! Navigate or refresh any view to see error boundaries in action.</span>
                </div>
              )}
            </div>

            {/* Latency Simulator */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Simulated Network Latency</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Adjusts artificial delay before API resolutions to evaluate shimmer Skeleton loaders.
                  </p>
                </div>
                <span className="font-mono font-bold text-indigo-400 text-sm">{latency}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="50"
                value={latency}
                onChange={handleLatencyChange}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0ms (Instant)</span>
                <span>250ms (Normal)</span>
                <span>1500ms (Slow 3G)</span>
              </div>
            </div>

            {/* Reset Factory Defaults */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={RotateCcw}
                onClick={handleResetDefaults}
                className="w-full"
              >
                Reset All Local Data & Storage to Factory Defaults
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">In-Memory TTL Cache Entries</h4>
                <p className="text-slate-400 text-[11px]">
                  Deduplicates concurrent requests and caches data with automatic expiration.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={Trash2}
                onClick={handleClearCache}
              >
                Purge All
              </Button>
            </div>

            {cacheStats.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Cache is currently empty or expired. Trigger queries in any MFE to populate entries.
              </div>
            ) : (
              <div className="space-y-2">
                {cacheStats.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-semibold text-slate-200 text-xs truncate max-w-xs">
                        {item.key}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Cached at {item.cachedAt}</p>
                    </div>
                    <Badge variant="active" size="sm">
                      {item.ttlRemainingSec}s TTL
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'topology' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400 text-[11px] mb-2">
              Micro-frontend modules loaded dynamically with fault isolation:
            </p>
            {[
              { name: 'Host Container (Port 3000)', port: 3000, type: 'Shell Application', status: 'Running' },
              { name: 'Auth Module (@modules/auth)', port: 3000, type: 'Lazy Chunk', status: 'Active' },
              { name: 'Dashboard Module (@modules/dashboard)', port: 3000, type: 'Lazy Chunk', status: 'Active' },
              { name: 'User Management (@modules/users)', port: 3000, type: 'Lazy Chunk', status: 'Active' },
              { name: 'Analytics Module (@modules/analytics)', port: 3000, type: 'Lazy Chunk', status: 'Active' },
              { name: 'Notifications (@modules/notifications)', port: 3000, type: 'Lazy Chunk', status: 'Active' },
            ].map((node, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-slate-200">{node.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {node.type}
                  </p>
                </div>
                <Badge variant="active" size="sm" dot>
                  {node.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DevToolsDrawer;
