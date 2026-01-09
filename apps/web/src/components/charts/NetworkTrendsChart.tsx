'use client';

import { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useNetworkHistory } from '@/hooks/useNetworkHistory';

// Custom tooltip component with proper theme support
function CustomTooltip({ active, payload, label }: any) {
  const [colors, setColors] = useState({ card: '', border: '', text: '' });

  useEffect(() => {
    const root = document.documentElement;
    setColors({
      card: getComputedStyle(root).getPropertyValue('--color-card').trim() || '#ffffff',
      border: getComputedStyle(root).getPropertyValue('--color-border').trim() || '#d4d4d4',
      text: getComputedStyle(root).getPropertyValue('--color-foreground').trim() || '#171717',
    });
  }, []);

  if (!active || !payload || !colors.card) return null;

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
      <p style={{ color: colors.text, fontWeight: 600, marginBottom: '8px' }}>{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }} />
          <p style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        </div>
      ))}
    </div>
  );
}

export function NetworkTrendsChart() {
  const theme = getThemeConfig();
  const { history, isLoading, error } = useNetworkHistory(30);

  // Get CSS variables for colors
  const [borderColor, setBorderColor] = useState('');
  const [tickColor, setTickColor] = useState('');
  const [successColor, setSuccessColor] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    setBorderColor(getComputedStyle(root).getPropertyValue('--color-border').trim() || '#d4d4d4');
    setTickColor(getComputedStyle(root).getPropertyValue('--color-muted-foreground').trim() || '#737373');
    setSuccessColor(getComputedStyle(root).getPropertyValue('--color-success').trim() || '#22c55e');
  }, []);

  // Transform data for chart (memoized for performance)
  const chartData = useMemo(() => {
    return history.map((point) => ({
      date: new Date(point.snapshotTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalNodes: point.totalNodes,
      onlineNodes: point.onlineNodes,
      countries: point.countries,
    }));
  }, [history]);

  // Show loading/error states only if data fetching, Suspense handles initial load
  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Network Trends (30 Days)</h3>
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
        <h3 className="text-lg font-semibold mb-4 text-foreground">Network Trends (30 Days)</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No historical data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Network Trends (30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={{ stroke: borderColor }}
            height={50}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={{ stroke: borderColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '12px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="totalNodes"
            stroke={theme.primaryColor}
            strokeWidth={2.5}
            name="Total Nodes"
            dot={{ fill: theme.primaryColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="onlineNodes"
            stroke={successColor}
            strokeWidth={2.5}
            name="Online Nodes"
            dot={{ fill: successColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="countries"
            stroke={theme.secondaryColor}
            strokeWidth={2.5}
            name="Countries"
            dot={{ fill: theme.secondaryColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
