'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import type { VersionDistribution } from '@atlasp2p/types';

export function useVersionStats() {
  const [versions, setVersions] = useState<VersionDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersionStats = useCallback(async () => {
    const supabase = getClient();

    try {
      setIsLoading(true);
      setError(null);

      // Use the version_distribution view which is already aggregated in the database
      const { data, error: queryError } = await supabase
        .from('version_distribution')
        .select('*')
        .order('count', { ascending: false })
        .limit(10); // Top 10 versions

      if (queryError) throw queryError;

      const transformedVersions: VersionDistribution[] = (data || []).map((v) => ({
        version: v.version || 'Unknown',
        count: v.count || 0,
        percentage: v.percentage || 0,
        onlineCount: v.online_count || 0,
        isCurrentVersion: v.is_current_version || false,
      }));

      setVersions(transformedVersions);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching version stats:', err);
      }
      setError(
        err instanceof Error ? err.message : 'Failed to fetch version stats'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersionStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchVersionStats, 300000);
    return () => clearInterval(interval);
  }, [fetchVersionStats]);

  return {
    versions,
    isLoading,
    error,
    refetch: fetchVersionStats,
  };
}

