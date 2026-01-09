'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Server, Globe, Activity, Zap, Loader2 } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useNodes } from '@/hooks/useNodes';
import { useMemo } from 'react';

// Lazy load chart components for better performance
const NetworkTrendsChart = dynamic(() => import('@/components/charts/NetworkTrendsChart').then(mod => ({ default: mod.NetworkTrendsChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
const VersionDistributionChart = dynamic(() => import('@/components/charts/VersionDistributionChart').then(mod => ({ default: mod.VersionDistributionChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
const CountryDistributionChart = dynamic(() => import('@/components/charts/CountryDistributionChart').then(mod => ({ default: mod.CountryDistributionChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
const TierDistributionChart = dynamic(() => import('@/components/charts/TierDistributionChart').then(mod => ({ default: mod.TierDistributionChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

// Chart loading skeleton
function ChartSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
      <div className="h-[300px] bg-muted/50 rounded"></div>
    </div>
  );
}

export default function DashboardPage() {
  const theme = getThemeConfig();
  const { nodes, isLoading } = useNodes();

  const stats = useMemo(() => {
    const total = nodes.length;
    const online = nodes.filter(n => n.status === 'up').length;
    const uptime = total > 0 ? (online / total) * 100 : 0;
    const avgLatency = nodes.length > 0
      ? nodes.reduce((acc, n) => acc + (n.latencyAvg || 0), 0) / nodes.length
      : 0;

    return { total, online, uptime, avgLatency };
  }, [nodes]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl shadow-lg" style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              boxShadow: `0 10px 25px -5px ${theme.primaryColor}40`
            }}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive network analytics and insights
          </p>
        </div>

        {/* Quick Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-lg border border-border animate-pulse">
                <div className="h-8 w-8 bg-muted rounded mb-3"></div>
                <div className="h-10 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Server className="h-8 w-8" style={{ color: theme.primaryColor }} />
                <span className="text-xs font-semibold text-muted-foreground uppercase">Total Nodes</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Activity className="h-8 w-8 text-success" />
                <span className="text-xs font-semibold text-muted-foreground uppercase">Online</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.online}</div>
              <div className="text-sm text-success mt-1">
                {stats.uptime.toFixed(1)}% uptime
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Globe className="h-8 w-8" style={{ color: theme.secondaryColor }} />
                <span className="text-xs font-semibold text-muted-foreground uppercase">Countries</span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {new Set(nodes.map(n => n.countryName).filter(Boolean)).size}
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Zap className="h-8 w-8" style={{ color: theme.accentColor }} />
                <span className="text-xs font-semibold text-muted-foreground uppercase">Avg Latency</span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {stats.avgLatency.toFixed(0)}<span className="text-lg text-muted-foreground">ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid - Lazy loaded for better performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            <NetworkTrendsChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <VersionDistributionChart />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <CountryDistributionChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <TierDistributionChart />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
