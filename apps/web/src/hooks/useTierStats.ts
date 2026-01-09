'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';

export interface TierDistribution {
  tier: string;
  count: number;
  percentage: number;
  onlineCount: number;
  avgUptime: number | null;
  avgLatency: number | null;
  avgPixScore: number | null;
}

export function useTierStats() {
  const [tiers, setTiers] = useState<TierDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTierStats = useCallback(async () => {
    const supabase = getClient();

    try {
      setIsLoading(true);
      setError(null);

      // Use the tier_distribution view which is already aggregated in the database
      const { data, error: queryError } = await supabase
        .from('tier_distribution')
        .select('*')
        .order('tier', { ascending: true }); // Orders by tier rank (diamond, gold, silver, bronze, standard)

      if (queryError) throw queryError;

      const transformedTiers: TierDistribution[] = (data || []).map((t) => ({
        tier: t.tier || 'standard',
        count: t.count || 0,
        percentage: t.percentage || 0,
        onlineCount: t.online_count || 0,
        avgUptime: t.avg_uptime,
        avgLatency: t.avg_latency,
        avgPixScore: t.avg_pix_score,
      }));

      setTiers(transformedTiers);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching tier stats:', err);
      }
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tier stats'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTierStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTierStats, 300000);
    return () => clearInterval(interval);
  }, [fetchTierStats]);

  return {
    tiers,
    isLoading,
    error,
    refetch: fetchTierStats,
  };
}
