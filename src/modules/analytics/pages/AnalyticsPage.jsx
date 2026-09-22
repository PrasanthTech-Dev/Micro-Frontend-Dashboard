import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Download,
  Radio,
  BarChart3,
  PieChart,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  Compass,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  FileSpreadsheet,
  FileCode,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card } from '../../../shared/components/Card.jsx';
import { Button } from '../../../shared/components/Button.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Modal } from '../../../shared/components/Modal.jsx';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader.jsx';
import { InteractiveTrajectoryChart } from '../../../shared/components/InteractiveTrajectoryChart.jsx';
import { apiService } from '../../../shared/services/api.js';
import { eventBus, MFE_EVENTS } from '../../../shared/services/eventBus.js';

const TIMEFRAMES = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last Quarter' },
  { id: 'ytd', label: 'Year to Date' },
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d');
  const [chartMode, setChartMode] = useState('area'); // 'area' | 'bar'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Pulse Engine
  const [livePulse, setLivePulse] = useState(false);
  const [pulseSpeed, setPulseSpeed] = useState(1);
  const [pulseCount, setPulseCount] = useState(0);

  // Hover Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredCohort, setHoveredCohort] = useState(null);

  // Funnel Inspection State
  const [selectedFunnelStage, setSelectedFunnelStage] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getAnalyticsData(timeframe);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics telemetry.');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Live Pulse Simulator
  useEffect(() => {
    if (!livePulse) return;
    const intervalMs = Math.round(2000 / pulseSpeed);

    const interval = setInterval(() => {
      setPulseCount((prev) => prev + 1);
      setData((prev) => {
        if (!prev || !prev.revenueTrend) return prev;
        const updated = [...prev.revenueTrend];
        const lastIdx = updated.length - 1;
        const delta = Math.floor((Math.random() - 0.38) * 2000);
        updated[lastIdx] = {
          ...updated[lastIdx],
          actual: Math.max(20000, updated[lastIdx].actual + delta),
        };
        return { ...prev, revenueTrend: updated };
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [livePulse, pulseSpeed]);

  const maxRevenue = useMemo(() => {
    if (!data?.revenueTrend) return 100000;
    return Math.max(...data.revenueTrend.map((d) => Math.max(d.actual, d.target)));
  }, [data]);

  const maxCohortMRR = useMemo(() => {
    if (!data?.monthlyCohorts) return 200000;
    return Math.max(...data.monthlyCohorts.map((c) => c.activeMRR));
  }, [data]);

  const handleExportCSV = () => {
    if (!data?.revenueTrend) return;
    const headers = ['Period', 'Actual Revenue', 'Target Baseline'];
    const rows = data.revenueTrend.map((r) => [r.label, r.actual, r.target]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `analytics-export-${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!data) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `analytics-dataset-${timeframe}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="chart" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader type="card" count={3} />
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Predictive Analytics & Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time streaming ingestion pipeline, financial cohort retention, and funnel conversion stages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Ingestion Simulator Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLivePulse(!livePulse)}
              className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <span className={`w-2 h-2 rounded-full ${livePulse ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{livePulse ? 'Live Ingestion: Active' : 'Live Ingestion: Off'}</span>
            </button>

            {livePulse && (
              <div className="flex items-center gap-1 ml-2 border-l border-slate-300 dark:border-slate-700 pl-2">
                {[1, 2, 5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPulseSpeed(speed)}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                      pulseSpeed === speed
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileSpreadsheet}
              onClick={handleExportCSV}
              title="Download CSV"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileCode}
              onClick={handleExportJSON}
              title="Download JSON Payload"
            >
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Top Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-md dark:shadow-xl">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Processed Volume</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{data?.totalVolume}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +16.8%
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Adjusted across all payment rails</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-md dark:shadow-xl">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{data?.avgOrderValue}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +4.2%
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Median per completed enterprise checkout</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-md dark:shadow-xl">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cohort 90-Day Retention</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{data?.retentionRate}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +2.1%
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Active seats retaining contract after trial</p>
        </div>
      </div>

      {/* Main Interactive Chart Card */}
      <Card
        title={chartMode === 'area' ? 'Revenue Trajectory vs Quota Benchmark' : 'Monthly Cohort ARR Expansion'}
        subtitle={`Aggregated financial telemetry over ${timeframe.toUpperCase()}`}
        action={
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Area Trend
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cohort Bar
            </button>
          </div>
        }
      >
        <div className="relative min-h-[290px] w-full pt-2">
          {chartMode === 'area' ? (
            <InteractiveTrajectoryChart
              data={data?.revenueTrend || []}
              timeframe={timeframe}
              height={280}
              livePulse={livePulse}
              metricLabel="Actual Revenue"
              targetLabel="Quota Benchmark"
              valuePrefix="$"
            />
          ) : (
            /* Bar Chart for Monthly Cohorts with Staggered Entrance and Interactive Tooltips */
            <div className="space-y-4">
              <div className="w-full h-64 flex items-end justify-between gap-4 pt-6 px-4">
                {data?.monthlyCohorts?.map((cohort, i) => {
                  const heightPct = Math.round((cohort.activeMRR / maxCohortMRR) * 100);
                  const isHovered = hoveredCohort?.month === cohort.month;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredCohort(cohort)}
                      onMouseLeave={() => setHoveredCohort(null)}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer transition-transform duration-200 hover:scale-105"
                    >
                      <div className="w-full max-w-[56px] h-48 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-hidden flex items-end">
                        <div
                          className={`w-full rounded-xl transition-all duration-300 chart-bar-animate ${
                            isHovered
                              ? 'bg-gradient-to-t from-indigo-500 to-cyan-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                              : 'bg-gradient-to-t from-indigo-600 to-cyan-400 group-hover:brightness-110'
                          }`}
                          style={{
                            height: `${heightPct}%`,
                            animationDelay: `${i * 90}ms`,
                          }}
                        />
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${
                        isHovered ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {cohort.month}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ${Math.round(cohort.activeMRR / 1000)}k
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cohort detail footer card when hovered */}
              {hoveredCohort ? (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {hoveredCohort.month} Expansion Cohort
                    </span>
                  </div>
                  <div className="flex items-center gap-5 font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      MRR: ${hoveredCohort.activeMRR.toLocaleString()}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Seats: {hoveredCohort.newUsers.toLocaleString()} active
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400">
                      Avg: ${Math.round(hoveredCohort.activeMRR / hoveredCohort.newUsers)}/seat
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>Hover across cohort bars to inspect monthly retention, seat volume & ARPU</span>
                  <span className="font-mono text-[10px] text-indigo-500 font-medium">Cohort ARR Engine</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>


      {/* Two Column Section: Funnel Inspection & Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card
          title="Conversion Funnel Efficiency"
          subtitle="Dropoff analysis across acquisition stages"
        >
          <div className="space-y-3 pt-2">
            {data?.conversionFunnel?.map((step, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedFunnelStage(step)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedFunnelStage?.stage === step.stage
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {idx + 1}. {step.stage}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">{step.count.toLocaleString()}</span>
                    <Badge variant={idx === 0 ? 'active' : 'info'} size="sm">
                      {step.dropoff}
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.max(10, 100 - idx * 16)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">{step.tip}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Traffic Channels & Device Share */}
        <div className="space-y-6">
          <Card title="Traffic Acquisition Channels" subtitle="Primary sources generating visits">
            <div className="space-y-3 pt-1">
              {data?.trafficChannels?.map((channel, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{channel.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500">{channel.visitors.toLocaleString()}</span>
                    <span className="font-bold text-slate-900 dark:text-white w-8 text-right">{channel.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Device Platform Distribution" subtitle="Client device mix across web sessions">
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              {data?.deviceBreakdown?.map((dev, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800"
                >
                  <p className="text-xs text-slate-500">{dev.device}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{dev.share}%</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
