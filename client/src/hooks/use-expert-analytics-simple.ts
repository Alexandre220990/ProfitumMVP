import { useState, useEffect, useCallback } from 'react';
import { get } from '@/lib/api';

interface ExpertMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'number' | 'percentage' | 'currency' | 'duration';
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface MonthlyPerformance {
  name: string;
  revenue: number;
  assignments: number;
  completionRate: number;
  avgCompletionTime: number;
}

interface TopProduct {
  name: string;
  count: number;
  revenue: number;
  conversionRate: number;
}

interface ClientDistribution {
  clientType: string;
  count: number;
  percentage: number;
}

interface TimeAnalysis {
  averageResponseTime: number;
  averageProcessingTime: number;
  peakHours: string[];
  preferredDays: string[];
}

interface ExpertAnalyticsData {
  metrics: ExpertMetric[];
  performance: MonthlyPerformance[];
  topProducts: TopProduct[];
  clientDistribution: ClientDistribution[];
  timeAnalysis: TimeAnalysis;
}

interface UseExpertAnalyticsSimpleParams {
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const useExpertAnalyticsSimple = ({ timeRange = '30d' }: UseExpertAnalyticsSimpleParams = {}) => {
  const [data, setData] = useState<ExpertAnalyticsData>({
    metrics: [],
    performance: [],
    topProducts: [],
    clientDistribution: [],
    timeAnalysis: {
      averageResponseTime: 0,
      averageProcessingTime: 0,
      peakHours: [],
      preferredDays: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger toutes les données en parallèle
      const [metricsRes, performanceRes, productsRes, clientsRes, timeRes] = await Promise.all([
        get<ExpertMetric[]>('/api/expert/analytics/metrics'),
        get<MonthlyPerformance[]>(`/api/expert/analytics/performance?timeRange=${timeRange}`),
        get<TopProduct[]>('/api/expert/analytics/products'),
        get<ClientDistribution[]>('/api/expert/analytics/clients'),
        get<TimeAnalysis>('/api/expert/analytics/time')
      ]);

      const defaultTimeAnalysis: TimeAnalysis = {
        averageResponseTime: 0,
        averageProcessingTime: 0,
        peakHours: [],
        preferredDays: []
      };

      setData({
        metrics: metricsRes.success && metricsRes.data ? metricsRes.data : [],
        performance: performanceRes.success && performanceRes.data ? performanceRes.data : [],
        topProducts: productsRes.success && productsRes.data ? productsRes.data : [],
        clientDistribution: clientsRes.success && clientsRes.data ? clientsRes.data : [],
        timeAnalysis: timeRes.success && timeRes.data ? timeRes.data : defaultTimeAnalysis
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erreur chargement analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

