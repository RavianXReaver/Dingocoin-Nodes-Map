'use client';

import { useMemo, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useTierStats } from '@/hooks/useTierStats';

// Custom tooltip component with proper theme support
function CustomTooltip({ active, payload }: any) {
  const [colors, setColors] = useState({ card: '', border: '', text: '' });

  useEffect(() => {
    const root = document.documentElement;
    setColors({
      card: getComputedStyle(root).getPropertyValue('--color-card').trim() || '#ffffff',
      border: getComputedStyle(root).getPropertyValue('--color-border').trim() || '#d4d4d4',
      text: getComputedStyle(root).getPropertyValue('--color-foreground').trim() || '#171717',
    });
  }, []);

  if (!active || !payload || !payload.length || !colors.card) return null;

  return (
    <div
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '12px', height: '4px', borderRadius: '2px', backgroundColor: payload[0].fill }} />
        <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
          {payload[0].payload.tier}
        </p>
      </div>
      <p style={{ color: colors.text, fontSize: '14px', marginLeft: '20px' }}>
        Nodes: <strong>{payload[0].value}</strong>
      </p>
    </div>
  );
}

export function TierDistributionChart() {
  const theme = getThemeConfig();
  const { tiers, isLoading, error } = useTierStats();

  // Get CSS variables for tier colors
  const [tierColors, setTierColors] = useState<Record<string, string>>({});
  const [borderColor, setBorderColor] = useState('');
  const [tickColor, setTickColor] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    setTierColors({
      diamond: getComputedStyle(root).getPropertyValue('--color-chart-1').trim() || '#06b6d4',
      gold: getComputedStyle(root).getPropertyValue('--color-warning').trim() || '#eab308',
      silver: getComputedStyle(root).getPropertyValue('--color-muted-foreground').trim() || '#a3a3a3',
      bronze: getComputedStyle(root).getPropertyValue('--color-chart-3').trim() || '#f97316',
      standard: theme.primaryColor,
    });
    setBorderColor(getComputedStyle(root).getPropertyValue('--color-border').trim() || '#d4d4d4');
    setTickColor(getComputedStyle(root).getPropertyValue('--color-muted-foreground').trim() || '#737373');
  }, [theme.primaryColor]);

  // Transform data for chart with capitalized tier names (memoized for performance)
  const chartData = useMemo(() => {
    if (Object.keys(tierColors).length === 0) return [];

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
        <div className="h-[300px] flex items-center justify-center">
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
        <div className="h-[300px] flex items-center justify-center">
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
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
          <XAxis
            dataKey="tier"
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={{ stroke: borderColor }}
            height={60}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={{ stroke: borderColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="nodes" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
