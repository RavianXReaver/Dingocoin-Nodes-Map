'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { getProjectConfig } from '@/config';

export interface NetworkHistoryPoint {
  snapshotTime: string;
  totalNodes: number;
  onlineNodes: number;
  countries: number;
  avgUptime: number | null;
  avgLatency: number | null;
  avgPixScore: number | null;
}

export function useNetworkHistory(days: number = 30) {
  const chain = getProjectConfig().chain;
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    const supabase = getClient();

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('network_history')
        .select('*')
        .eq('chain', chain)
        .gte('snapshot_time', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('snapshot_time', { ascending: true });

      if (queryError) throw queryError;

      const transformedHistory: NetworkHistoryPoint[] = (data || []).map((point) => ({
        snapshotTime: point.snapshot_time,
        totalNodes: point.total_nodes || 0,
        onlineNodes: point.online_nodes || 0,
        countries: point.countries || 0,
        avgUptime: point.avg_uptime,
        avgLatency: point.avg_latency,
        avgPixScore: point.avg_pix_score,
      }));

      setHistory(transformedHistory);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching network history:', err);
      }
      setError(
        err instanceof Error ? err.message : 'Failed to fetch network history'
      );
    } finally {
      setIsLoading(false);
    }
  }, [chain, days]);

  useEffect(() => {
    fetchHistory();

    // Refresh every 5 minutes
    const interval = setInterval(fetchHistory, 300000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
