import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  Server,
  Zap,
  Bell,
  RefreshCw,
  Clock,
  ShieldCheck,
  Layers,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../../../shared/components/Card.jsx';
import { StatCard } from '../../../shared/components/StatCard.jsx';
import { Button } from '../../../shared/components/Button.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Modal } from '../../../shared/components/Modal.jsx';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader.jsx';
import { InteractiveTrajectoryChart } from '../../../shared/components/InteractiveTrajectoryChart.jsx';
import { apiService } from '../../../shared/services/api.js';
import { eventBus, MFE_EVENTS } from '../../../shared/services/eventBus.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedDrilldown, setSelectedDrilldown] = useState(null);

  const [refreshInterval, setRefreshInterval] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Configurable widget visibility
  const [visibleWidgets, setVisibleWidgets] = useState({
    kpis: true,
    chart: true,
    actions: true,
    stream: true,
    topology: true,
  });

  const [activities, setActivities] = useState([
    {
      id: 'act-1',
      title: 'Module Federation Initialized',
      description: 'Host shell connected to 5 lazy-loaded module chunks.',
      timestamp: '2m ago',
      type: 'system',
    },
    {
      id: 'act-2',
      title: 'Active Session Verified',
      description: 'Enterprise token validation completed.',
      timestamp: '5m ago',
      type: 'auth',
    },
    {
      id: 'act-3',
      title: 'Analytics Pipeline Synced',
      description: 'Stream aggregation processed 14,200 events.',
      timestamp: '15m ago',
      type: 'analytics',
    },
  ]);

  const loadData = useCallback(async (period = timeframe, isBackground = false) => {
    try {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await apiService.getDashboardMetrics(period);
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData(timeframe);

    const unsubUser = eventBus.subscribe(MFE_EVENTS.USER_MUTATED, (payload) => {
      apiService.invalidateCache('dashboard');
      loadData(timeframe);
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: `User ${payload?.action || 'Updated'}`,
          description: `${payload?.user?.name || 'User'} was ${payload?.action?.toLowerCase() || 'modified'}.`,
          timestamp: 'Just now',
          type: 'users',
        },
        ...prev.slice(0, 7),
      ]);
    });

    const unsubAuth = eventBus.subscribe(MFE_EVENTS.AUTH_STATE_CHANGED, (user) => {
      if (user) {
        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            title: 'User Authenticated',
            description: `${user.name} logged in with ${user.role} permissions.`,
            timestamp: 'Just now',
            type: 'auth',
          },
          ...prev.slice(0, 7),
        ]);
      }
    });

    return () => {
      unsubUser();
      unsubAuth();
    };
  }, [loadData, timeframe]);

  // Auto-refresh interval handler
  useEffect(() => {
    if (refreshInterval <= 0) {
      setCountdown(0);
      return;
    }
    setCountdown(refreshInterval);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          apiService.invalidateCache('dashboard');
          loadData(timeframe, true);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, loadData, timeframe]);

  const handleSimulateAlert = () => {
    eventBus.publish(
      MFE_EVENTS.NOTIFICATION_EMIT,
      {
        title: 'Cluster Alert Dispatched',
        message: 'High latency detected in Analytics ingestion pipeline.',
        type: 'warning',
        category: 'System',
      },
      'dashboard'
    );
  };

  // Drilldown content generators
  const getDrilldownContent = (type) => {
    switch (type) {
      case 'revenue':
        return {
          title: 'Gross Revenue Telemetry & Breakdown',
          metric: metrics?.revenue.formatted,
          change: metrics?.revenue.change,
          breakdown: [
            { label: 'SaaS Recurring Seats (Enterprise)', value: '$940,000', share: '75%' },
            { label: 'API Metered Usage & Bandwidth', value: '$186,500', share: '15%' },
            { label: 'Professional SLA Add-ons', value: '$122,000', share: '10%' },
          ],
          regions: [
            { name: 'North America (US-East / West)', value: '54%' },
            { name: 'European Union (Frankfurt / Dublin)', value: '28%' },
            { name: 'Asia Pacific (Tokyo / Singapore)', value: '18%' },
          ],
          health: 'All payment webhooks operational with 99.99% settlement rate.',
        };
      case 'users':
        return {
          title: 'Active Platform User Distribution',
          metric: metrics?.activeUsers.formatted,
          change: metrics?.activeUsers.change,
          breakdown: [
            { label: 'Daily Active Users (DAU)', value: '18,400', share: '62%' },
            { label: 'Weekly Active Users (WAU)', value: '8,200', share: '28%' },
            { label: 'Monthly Re-engagements', value: '3,000', share: '10%' },
          ],
          regions: [
            { name: 'Desktop Web App', value: '58%' },
            { name: 'Mobile Web App', value: '36%' },
            { name: 'CLI & API Tokens', value: '6%' },
          ],
          health: 'Peak concurrent sessions: 4,820 active sockets.',
        };
      case 'conversion':
        return {
          title: 'Conversion Efficiency Diagnostics',
          metric: metrics?.conversionRate.formatted,
          change: metrics?.conversionRate.change,
          breakdown: [
            { label: 'Self-Serve Checkout Funnel', value: '4.8%', share: 'Optimal' },
            { label: 'Enterprise Inbound Demos', value: '14.2%', share: 'High' },
            { label: 'Trial-to-Paid Upgrade Rate', value: '2.4%', share: 'Average' },
          ],
          regions: [
            { name: 'Organic Search Traffic', value: '42%' },
            { name: 'Direct Enterprise Referrals', value: '38%' },
            { name: 'Partner Integrations', value: '20%' },
          ],
          health: 'Conversion index is outperforming industry average by +1.4%.',
        };
      case 'sla':
        return {
          title: 'High-Availability Cluster SLA Monitor',
          metric: metrics?.systemHealth.formatted,
          change: metrics?.systemHealth.change,
          breakdown: [
            { label: 'Host Shell Gateway (Port 3000)', value: '100.0%', share: 'Healthy' },
            { label: 'Federated Remotes (:3000 / Dynamic Chunks)', value: '99.98%', share: 'Healthy' },
            { label: 'Cross-Origin Event Bus', value: '0 dropped msgs', share: 'Optimal' },
          ],
          regions: [
            { name: 'Average P99 Round-trip', value: '18ms' },
            { name: 'Zero-Downtime Hot Deployments', value: '14/14' },
            { name: 'Fault-Isolation Boundaries', value: '5 active' },
          ],
          health: 'Zero unhandled micro-frontend runtime faults in last 720 hours.',
        };
      default:
        return null;
    }
  };

  const drilldownData = useMemo(() => getDrilldownContent(selectedDrilldown), [selectedDrilldown, metrics]);

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="stat-cards" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonLoader type="chart" className="lg:col-span-2" />
          <SkeletonLoader type="table" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Executive Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-indigo-500" />
            Micro-Frontend Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry, federated cluster health, and operational performance indicators.
          </p>
        </div>

        {/* Global Controls: Timeframe, Auto-Refresh & Layout Customizer */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            {['7d', '30d', '90d', 'ytd'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Auto-Refresh Controller */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <Clock className={`w-3.5 h-3.5 text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <option value={0} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Refresh: Off</option>
              <option value={5} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 5s</option>
              <option value={15} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 15s</option>
              <option value={30} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 30s</option>
            </select>
            {refreshInterval > 0 && (
              <span className="font-mono text-[10px] text-indigo-500 font-bold ml-1">
                ({countdown}s)
              </span>
            )}
          </div>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            isLoading={loading || isRefreshing}
            onClick={() => {
              apiService.invalidateCache('dashboard');
              loadData(timeframe, false);
            }}
            title="Invalidate cache and reload metrics"
          >
            Sync
          </Button>

          {/* Widget Layout Customizer Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize View</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCustomizing && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Toggle Widgets
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries({
                    kpis: 'KPI Stat Cards',
                    chart: 'Revenue Trajectory Chart',
                    actions: 'Quick Operations',
                    stream: 'Live Event Stream',
                    topology: 'Cluster Health Monitor',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-700 dark:text-slate-300">{label}</span>
                      <input
                        type="checkbox"
                        checked={visibleWidgets[key]}
                        onChange={(e) =>
                          setVisibleWidgets((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Drilldown Modal */}
      <Modal
        isOpen={Boolean(selectedDrilldown)}
        onClose={() => setSelectedDrilldown(null)}
        title={drilldownData?.title || 'Metric Intelligence'}
        maxWidth="max-w-lg"
      >
        {drilldownData && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Aggregated Value ({timeframe.toUpperCase()})
                </span>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {drilldownData.metric}
                </div>
              </div>
              <Badge variant="active" size="md">
                {drilldownData.change}
              </Badge>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Sub-Component Distribution
              </h4>
              <div className="space-y-2">
                {drilldownData.breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{item.value}</span>
                      <Badge variant="default" size="sm">
                        {item.share}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Regional & Channel Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {drilldownData.regions.map((reg, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center"
                  >
                    <p className="text-[10px] text-slate-400 truncate">{reg.name}</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{reg.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{drilldownData.health}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDrilldown(null)}>
                Dismiss Drilldown
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* KPI Cards Grid */}
      {visibleWidgets.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => setSelectedDrilldown('revenue')}
            className="cursor-pointer transition-transform active:scale-[0.98]"
            title="Click to view revenue drilldown telemetry"
          >
            <StatCard
              title="Gross Platform Revenue"
              value={metrics?.revenue.formatted}
              change={metrics?.revenue.change}
              isPositive={metrics?.revenue.isPositive}
              period={metrics?.revenue.period}
              icon={DollarSign}
              colorScheme="indigo"
              sparkline={metrics?.revenue.sparkline}
            />
          </div>
          <div
            onClick={() => setSelectedDrilldown('users')}
            className="cursor-pointer transition-transform active:scale-[0.98]"
            title="Click to view user density drilldown"
          >
            <StatCard
              title="Active Platform Users"
              value={metrics?.activeUsers.formatted}
              change={metrics?.activeUsers.change}
              isPositive={metrics?.activeUsers.isPositive}
              period={metrics?.activeUsers.period}
              icon={Users}
              colorScheme="cyan"
              sparkline={metrics?.activeUsers.sparkline}
            />
          </div>
          <div
            onClick={() => setSelectedDrilldown('conversion')}
            className="cursor-pointer transition-transform active:scale-[0.98]"
            title="Click to inspect conversion diagnostics"
          >
            <StatCard
              title="Conversion Efficiency"
              value={metrics?.conversionRate.formatted}
              change={metrics?.conversionRate.change}
              isPositive={metrics?.conversionRate.isPositive}
              period={metrics?.conversionRate.period}
              icon={TrendingUp}
              colorScheme="emerald"
              sparkline={metrics?.conversionRate.sparkline}
            />
          </div>
          <div
            onClick={() => setSelectedDrilldown('sla')}
            className="cursor-pointer transition-transform active:scale-[0.98]"
            title="Click to inspect cluster SLA monitor"
          >
            <StatCard
              title="Cluster Health SLA"
              value={metrics?.systemHealth.formatted}
              change={metrics?.systemHealth.change}
              isPositive={metrics?.systemHealth.isPositive}
              period={metrics?.systemHealth.period}
              icon={Activity}
              colorScheme="purple"
              sparkline={metrics?.systemHealth.sparkline}
            />
          </div>
        </div>
      )}

      {/* Main Charts & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Growth Chart (2 cols) */}
        {visibleWidgets.chart && (
          <div className={visibleWidgets.actions || visibleWidgets.stream ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card
              title="Revenue & Performance Trajectory"
              subtitle={`Cross-regional transaction telemetry over ${timeframe.toUpperCase()}`}
              action={
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time aggregation</span>
                </div>
              }
            >
              {/* Interactive Animated Trajectory Chart with Scrubber Crosshair & On-Line Values */}
              <div className="pt-2">
                <InteractiveTrajectoryChart
                  data={metrics?.revenueTrend || []}
                  timeframe={timeframe}
                  height={250}
                  metricLabel="Gross Revenue"
                  targetLabel="Target Baseline"
                  valuePrefix="$"
                />
              </div>

                {/* Chart Legend */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                      <span>Actual Gross Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 border-t-2 border-cyan-500 dark:border-cyan-400 border-dashed inline-block" />
                      <span>Target Baseline</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/analytics')}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Detailed Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
            </Card>
          </div>
        )}

        {/* Quick Actions & Live Activity (1 col) */}
        {(visibleWidgets.actions || visibleWidgets.stream) && (
          <div className="space-y-6">
            {/* Quick Actions Card */}
            {visibleWidgets.actions && (
              <Card title="Module Operations" subtitle="Trigger cross-module operations">
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/users')}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-600/15 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white">
                          Create & Audit Users
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Jump to User Management MFE</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/analytics')}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-cyan-50 dark:hover:bg-cyan-600/15 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-white">
                          Predictive Funnel Analysis
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Jump to Analytics MFE</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateAlert}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-amber-50 dark:hover:bg-amber-600/15 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-white">
                          Broadcast Cluster Alert
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Emits cross-MFE toast notification</p>
                      </div>
                    </div>
                    <Zap className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
                  </button>
                </div>
              </Card>
            )}

            {/* Real-time Activity Feed */}
            {visibleWidgets.stream && (
              <Card
                title="Real-time Event Stream"
                subtitle="Live event subscriptions from connected MFEs"
              >
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700/50">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{act.title}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{act.timestamp}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-snug">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Federated Cluster Health Monitor */}
      {visibleWidgets.topology && (
        <Card
          title="Micro-Frontend Cluster Topology"
          subtitle="Live health, port mapping, and latency across independent modules"
          className="border-indigo-500/15"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {metrics?.clusterStatus?.map((node, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    {node.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">:{node.port}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="active" size="sm" dot>
                    {node.status}
                  </Badge>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{node.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
