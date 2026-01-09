'use client';

import { useMemo, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { getThemeConfig } from '@/config';
import { useCountryStats } from '@/hooks/useCountryStats';

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
        <div style={{ width: '4px', height: '12px', borderRadius: '2px', backgroundColor: payload[0].fill }} />
        <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
          {payload[0].payload.country}
        </p>
      </div>
      <p style={{ color: colors.text, fontSize: '14px', marginLeft: '20px' }}>
        Nodes: <strong>{payload[0].value}</strong>
      </p>
    </div>
  );
}

export function CountryDistributionChart() {
  const theme = getThemeConfig();
  const { countries, isLoading, error } = useCountryStats();

  // Get CSS variables for colors
  const [borderColor, setBorderColor] = useState('');
  const [tickColor, setTickColor] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    setBorderColor(getComputedStyle(root).getPropertyValue('--color-border').trim() || '#d4d4d4');
    setTickColor(getComputedStyle(root).getPropertyValue('--color-muted-foreground').trim() || '#737373');
  }, []);

  // Transform data for chart, take top 8 countries and group the rest as "Others"
  const chartData = useMemo(() => {
    if (!countries || countries.length === 0) {
      return [];
    }

    const topCountries = countries.slice(0, 8);
    const othersCount = countries.slice(8).reduce((sum, c) => sum + c.count, 0);

    const data = topCountries.map(c => ({
      country: c.countryName || c.countryCode,
      nodes: c.count
    }));

    if (othersCount > 0) {
      data.push({ country: 'Others', nodes: othersCount });
    }

    return data;
  }, [countries]);

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Top Countries</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Failed to load country data</p>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0 && !isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Top Countries</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No country data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Top Countries
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
          <XAxis
            type="number"
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={{ stroke: borderColor }}
          />
          <YAxis
            dataKey="country"
            type="category"
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={{ stroke: borderColor }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="nodes"
            fill={theme.primaryColor}
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
