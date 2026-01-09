'use client';

import { useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useVersionStats } from '@/hooks/useVersionStats';

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
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: payload[0].payload.color }} />
        <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
          {payload[0].name}
        </p>
      </div>
      <p style={{ color: colors.text, fontSize: '14px', marginLeft: '20px' }}>
        Nodes: <strong>{payload[0].value}</strong> ({payload[0].payload.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

export function VersionDistributionChart() {
  const theme = getThemeConfig();
  const { versions, isLoading, error } = useVersionStats();

  // Get CSS variables for chart colors
  const [chartColors, setChartColors] = useState<string[]>([]);
  const [labelColor, setLabelColor] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    const colors = [
      theme.primaryColor,
      theme.secondaryColor,
      theme.accentColor,
      getComputedStyle(root).getPropertyValue('--color-chart-2').trim() || '#8b5cf6',
      getComputedStyle(root).getPropertyValue('--color-chart-3').trim() || '#f97316',
      getComputedStyle(root).getPropertyValue('--color-chart-4').trim() || '#10b981',
      getComputedStyle(root).getPropertyValue('--color-chart-5').trim() || '#f59e0b',
      getComputedStyle(root).getPropertyValue('--color-muted-foreground').trim() || '#737373',
    ];
    setChartColors(colors);
    setLabelColor(getComputedStyle(root).getPropertyValue('--color-muted-foreground').trim() || '#737373');
  }, [theme.primaryColor, theme.secondaryColor, theme.accentColor]);

  // Transform data for chart with theme colors (memoized for performance)
  const chartData = useMemo(() => {
    if (chartColors.length === 0) return [];

    return versions.slice(0, 8).map((v, index) => ({
      name: v.version,
      value: v.count,
      percentage: v.percentage,
      color: chartColors[index % chartColors.length],
    }));
  }, [versions, chartColors]);

  // Custom label component - only show for slices > 5%
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null; // Hide label for small slices

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={labelColor}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 600 }}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Version Distribution</h3>
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
        <h3 className="text-lg font-semibold mb-4 text-foreground">Version Distribution</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No version data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Version Distribution
      </h3>
      <div style={{ width: '100%', height: '320px', position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart margin={{ top: 20, right: 120, bottom: 20, left: 120 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={70}
              fill={theme.primaryColor}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
