'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Server, Globe, Activity, Zap, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useNodes } from '@/hooks/useNodes';

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
    <div className="glass-strong rounded-2xl p-6 shadow-2xl border border-border/50 animate-pulse">
      <div className="h-6 bg-muted/50 rounded-lg w-1/3 mb-6"></div>
      <div className="h-[300px] bg-muted/30 rounded-xl"></div>
    </div>
  );
}

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}{suffix}</>;
}

// Circular progress indicator
function CircularProgress({ percentage, size = 120, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const theme = getThemeConfig();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 90) return '#10b981'; // green
    if (percentage >= 70) return theme.primaryColor;
    if (percentage >= 50) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-foreground">
          {percentage.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Uptime
        </div>
      </div>
    </div>
  );
}

// Stat card component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconColor?: string;
  pulse?: boolean;
}

function StatCard({ icon: Icon, label, value, subtitle, trend, trendValue, iconColor, pulse }: StatCardProps) {
  const theme = getThemeConfig();
  const color = iconColor || theme.primaryColor;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <div className="group relative glass-strong rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 overflow-hidden">
      {/* Gradient background overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`
        }}
      />

      <div className="relative z-10">
        {/* Icon and label */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 rounded-xl shadow-lg ${pulse ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: `${color}20`,
              boxShadow: `0 8px 16px -4px ${color}30`
            }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </div>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-1" style={{ color: trendColor }}>
                <TrendIcon className="h-3 w-3" />
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="mb-2">
          <div className="text-4xl font-bold text-foreground tracking-tight">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-sm font-medium" style={{ color }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Decorative corner gradient */}
      <div
        className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ backgroundColor: color }}
      />
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
    const countries = new Set(nodes.map(n => n.countryName).filter(Boolean)).size;

    return { total, online, uptime, avgLatency, countries };
  }, [nodes]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: theme.secondaryColor }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div
                className="p-4 rounded-2xl shadow-2xl animate-fade-in-scale"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  boxShadow: `0 20px 40px -10px ${theme.primaryColor}50`
                }}
              >
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  Network Dashboard
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  Real-time analytics and network insights
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            // Loading state
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`glass-strong rounded-2xl p-8 shadow-xl border border-border/50 animate-pulse ${i === 0 ? 'lg:col-span-1 lg:row-span-2' : ''}`}
                >
                  <div className="h-12 w-12 bg-muted/50 rounded-xl mb-4"></div>
                  <div className="h-16 bg-muted/50 rounded-lg mb-2"></div>
                  <div className="h-6 bg-muted/50 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Hero Stats Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Featured: Network Uptime (Large card) */}
                <div className="lg:col-span-1 lg:row-span-2 glass-strong rounded-2xl p-8 shadow-2xl border border-border/50 hover:shadow-3xl transition-all duration-500 group overflow-hidden relative">
                  {/* Animated gradient background */}
                  <div
                    className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle at center, ${theme.primaryColor}, transparent 70%)`
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="h-6 w-6 text-success animate-pulse" />
                      <h3 className="text-lg font-semibold text-foreground">Network Health</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center py-8">
                      <CircularProgress percentage={stats.uptime} size={140} strokeWidth={10} />

                      <div className="mt-8 space-y-4 w-full">
                        <div className="flex justify-between items-center p-4 glass rounded-xl">
                          <span className="text-sm text-muted-foreground">Online Nodes</span>
                          <span className="text-2xl font-bold text-success">{stats.online}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 glass rounded-xl">
                          <span className="text-sm text-muted-foreground">Total Nodes</span>
                          <span className="text-2xl font-bold text-foreground">{stats.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative pulse ring */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full animate-ping opacity-20"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                </div>

                {/* Stat cards grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <StatCard
                    icon={Server}
                    label="Total Nodes"
                    value={stats.total}
                    subtitle={`${stats.online} online now`}
                    iconColor={theme.primaryColor}
                  />

                  <StatCard
                    icon={Globe}
                    label="Countries"
                    value={stats.countries}
                    subtitle="Global coverage"
                    iconColor={theme.secondaryColor}
                  />

                  <StatCard
                    icon={Zap}
                    label="Avg Latency"
                    value={`${stats.avgLatency.toFixed(0)}ms`}
                    subtitle={stats.avgLatency < 200 ? 'Excellent' : stats.avgLatency < 500 ? 'Good' : 'Fair'}
                    trend={stats.avgLatency < 200 ? 'up' : stats.avgLatency > 500 ? 'down' : 'neutral'}
                    iconColor={stats.avgLatency < 200 ? '#10b981' : stats.avgLatency < 500 ? '#f59e0b' : '#ef4444'}
                  />

                  <StatCard
                    icon={Activity}
                    label="Active Now"
                    value={stats.online}
                    subtitle={`${stats.uptime.toFixed(1)}% uptime`}
                    trend="up"
                    iconColor="#10b981"
                    pulse={true}
                  />
                </div>
              </div>

              {/* Analytics Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                  Network Analytics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
