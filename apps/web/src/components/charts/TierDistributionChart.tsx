'use client';

import { useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useTierStats } from '@/hooks/useTierStats';

// Memoized tooltip
const CustomTooltip = memo(({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-1 rounded-sm" style={{ backgroundColor: payload[0].fill }} />
        <p className="text-foreground font-semibold">{payload[0].payload.tier}</p>
      </div>
      <p className="text-foreground text-sm ml-5">
        Nodes: <strong>{payload[0].value}</strong>
      </p>
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

export const TierDistributionChart = memo(function TierDistributionChart() {
  const theme = getThemeConfig();
  const { tiers, isLoading, error } = useTierStats();

  // Tier colors map (static, no need for state)
  const tierColors: Record<string, string> = useMemo(() => ({
    diamond: 'hsl(var(--chart-1))',
    gold: 'hsl(var(--warning))',
    silver: 'hsl(var(--muted-foreground))',
    bronze: 'hsl(var(--chart-3))',
    standard: theme.primaryColor,
  }), [theme.primaryColor]);

  // Transform data for chart with capitalized tier names (memoized for performance)
  const chartData = useMemo(() => {
    return tiers.map((t) => ({
      tier: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
      nodes: t.count,
      color: tierColors[t.tier] || theme.primaryColor,
    }));
  }, [tiers, tierColors, theme.primaryColor]);

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Node Tier Distribution</h3>
        <div className="h-[320px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0 && !isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Node Tier Distribution</h3>
        <div className="h-[320px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No tier data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Node Tier Distribution
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-30" />
          <XAxis
            dataKey="tier"
            className="text-muted-foreground"
            style={{ fontSize: 12 }}
            height={60}
          />
          <YAxis
            className="text-muted-foreground"
            style={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="nodes" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
