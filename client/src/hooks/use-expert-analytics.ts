import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types pour les analytics expert
export interface ExpertAnalyticsMetric {
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

export interface ExpertPerformanceData {
  month: string;
  assignments: number;
  revenue: number;
  completionRate: number;
  avgCompletionTime: number;
}

export interface ProductPerformanceData {
  name: string;
  count: number;
  revenue: number;
  conversionRate: number;
  avgRevenue: number;
}

export interface ClientDistributionData {
  clientType: string;
  count: number;
  percentage: number;
}

export interface ExpertAnalyticsData {
  metrics: ExpertAnalyticsMetric[];
  performanceByMonth: ExpertPerformanceData[];
  topProducts: ProductPerformanceData[];
  clientDistribution: ClientDistributionData[];
  timeAnalysis: {
    averageResponseTime: number;
    averageProcessingTime: number;
    peakHours: string[];
    preferredDays: string[];
  };
}

export interface ExpertAnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | '1y';
  expertId?: string;
  productType?: string;
  clientType?: string;
}

export const useExpertAnalytics = (filters: ExpertAnalyticsFilters = { timeRange: '30d' }) => {
  const [data, setData] = useState<ExpertAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Calculer la date de début basée sur la période
  const calculateStartDate = useCallback((timeRange: string): string => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, []);

  // Récupérer les métriques principales
  const getMetrics = useCallback(async (startDate: string, endDate: string, expertId?: string) => {
    try {
      // Requêtes pour les métriques expert
      const [
        totalAssignments,
        completedAssignments,
        
        
        monthlyRevenue,
        
        avgCompletionTime,
        
      ] = await Promise.all([
        // Total des assignations
        supabase
          .from('expertassignment')
          .select('*', { count: 'exact', head: true })
          .eq('expert_id', expertId)
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Assignations terminées
        supabase
          .from('expertassignment')
          .select('*', { count: 'exact', head: true })
          .eq('expert_id', expertId)
          .eq('status', 'terminé')
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Assignations en cours
        supabase
          .from('expertassignment')
          .select('*', { count: 'exact', head: true })
          .eq('expert_id', expertId)
          .eq('status', 'en_cours')
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Revenus totaux
        supabase
          .from('expertassignment')
          .select('compensation_amount')
          .eq('expert_id', expertId)
          .eq('status', 'terminé')
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Revenus du mois
        supabase
          .from('expertassignment')
          .select('compensation_amount')
          .eq('expert_id', expertId)
          .eq('status', 'terminé')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lte('created_at', endDate),

        // Taux de conversion (assignations terminées / total)
        supabase
          .from('expertassignment')
          .select('status')
          .eq('expert_id', expertId)
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Temps moyen de completion
        supabase
          .from('expertassignment')
          .select('created_at, completed_at')
          .eq('expert_id', expertId)
          .eq('status', 'terminé')
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Satisfaction client (simulé pour l'instant)
        Promise.resolve({ data: null })
      ]);

      // Calculer les métriques
      const totalAssignmentsCount = totalAssignments.count || 0;
      const completedAssignmentsCount = completedAssignments.count || 0;
      // const pendingAssignmentsCount = pendingAssignments.count || 0;
      
      // const totalRevenueAmount = totalRevenue.data?.reduce((sum, item) => sum + (item.compensation_amount || 0), 0) || 0;
      const monthlyRevenueAmount = monthlyRevenue.data?.reduce((sum, item) => sum + (item.compensation_amount || 0), 0) || 0;
      
      const conversionRateValue = totalAssignmentsCount > 0 ? (completedAssignmentsCount / totalAssignmentsCount) * 100 : 0;
      
      // Calculer le temps moyen de completion
      let avgCompletionTimeValue = 0;
      if (avgCompletionTime.data && avgCompletionTime.data.length > 0) {
        const totalDays = avgCompletionTime.data.reduce((sum, item: any) => {
          if (item.created_at && item.completed_at) {
            const start = new Date(item.created_at);
            const end = new Date(item.completed_at);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0);
        avgCompletionTimeValue = totalDays / avgCompletionTime.data.length;
      }

      // Créer les métriques
      const metrics: ExpertAnalyticsMetric[] = [
        {
          id: 'total-assignments',
          name: 'Total Assignations',
          value: totalAssignmentsCount,
          change: 12.5, // Simulé
          changeType: 'increase',
          format: 'number',
          icon: 'target',
          color: 'bg-blue-100 text-blue-600',
          trend: 'up'
        },
        {
          id: 'completed-assignments',
          name: 'Assignations Terminées',
          value: completedAssignmentsCount,
          change: 8.3,
          changeType: 'increase',
          format: 'number',
          icon: 'check-circle',
          color: 'bg-green-100 text-green-600',
          trend: 'up'
        },
        {
          id: 'monthly-revenue',
          name: 'Revenus du Mois',
          value: monthlyRevenueAmount,
          change: 15.2,
          changeType: 'increase',
          format: 'currency',
          icon: 'dollar-sign',
          color: 'bg-purple-100 text-purple-600',
          trend: 'up'
        },
        {
          id: 'conversion-rate',
          name: 'Taux de Conversion',
          value: conversionRateValue,
          change: 2.1,
          changeType: 'increase',
          format: 'percentage',
          icon: 'trending-up',
          color: 'bg-orange-100 text-orange-600',
          trend: 'up'
        },
        {
          id: 'avg-completion-time',
          name: 'Temps Moyen',
          value: avgCompletionTimeValue,
          change: -5.8,
          changeType: 'decrease',
          format: 'duration',
          icon: 'clock',
          color: 'bg-indigo-100 text-indigo-600',
          trend: 'down'
        },
        {
          id: 'client-satisfaction',
          name: 'Satisfaction Client',
          value: 4.2, // Simulé
          change: 0.3,
          changeType: 'increase',
          format: 'number',
          icon: 'award',
          color: 'bg-pink-100 text-pink-600',
          trend: 'up'
        }
      ];

      return metrics;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error);
      throw new Error('Impossible de récupérer les métriques');
    }
  }, []);

  // Récupérer les performances par mois
  const getPerformanceByMonth = useCallback(async (_startDate: string, _endDate: string, _expertId?: string) => {
    try {
      // Simuler des données de performance par mois
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
      const performanceData: ExpertPerformanceData[] = months.map((month, _index) => ({
        month,
        assignments: Math.floor(Math.random() * 20) + 10,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        completionRate: Math.random() * 30 + 70,
        avgCompletionTime: Math.random() * 10 + 5
      }));

      return performanceData;
    } catch (error) {
      console.error('Erreur lors de la récupération des performances:', error);
      return [];
    }
  }, []);

  // Récupérer les produits les plus performants
  const getTopProducts = useCallback(async (_startDate: string, _endDate: string, _expertId?: string) => {
    try {
      // Simuler des données de produits
      const products: ProductPerformanceData[] = [
        {
          name: 'CEE',
          count: 45,
          revenue: 12500,
          conversionRate: 85,
          avgRevenue: 278
        },
        {
          name: 'CIR',
          count: 32,
          revenue: 8900,
          conversionRate: 78,
          avgRevenue: 278
        },
        {
          name: 'TICPE',
          count: 28,
          revenue: 7200,
          conversionRate: 82,
          avgRevenue: 257
        },
        {
          name: 'Audit Énergétique',
          count: 15,
          revenue: 4500,
          conversionRate: 90,
          avgRevenue: 300
        }
      ];

      return products;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return [];
    }
  }, []);

  // Récupérer la répartition des clients
  const getClientDistribution = useCallback(async (_startDate: string, _endDate: string, _expertId?: string) => {
    try {
      // Simuler des données de répartition clients
      const distribution: ClientDistributionData[] = [
        {
          clientType: 'PME',
          count: 65,
          percentage: 45
        },
        {
          clientType: 'Grande Entreprise',
          count: 35,
          percentage: 25
        },
        {
          clientType: 'TPE',
          count: 30,
          percentage: 20
        },
        {
          clientType: 'Association',
          count: 15,
          percentage: 10
        }
      ];

      return distribution;
    } catch (error) {
      console.error('Erreur lors de la récupération de la répartition clients:', error);
      return [];
    }
  }, []);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = calculateStartDate(filters.timeRange);
      const endDate = new Date().toISOString();

      // Récupérer l'ID de l'expert connecté (à adapter selon votre logique d'auth)
      const { data: { user } } = await supabase.auth.getUser();
      const expertId = user?.id;

      const [metrics, performanceByMonth, topProducts, clientDistribution] = await Promise.all([
        getMetrics(startDate, endDate, expertId),
        getPerformanceByMonth(startDate, endDate, expertId),
        getTopProducts(startDate, endDate, expertId),
        getClientDistribution(startDate, endDate, expertId)
      ]);

      const analyticsData: ExpertAnalyticsData = {
        metrics,
        performanceByMonth,
        topProducts,
        clientDistribution,
        timeAnalysis: {
          averageResponseTime: 2.5,
          averageProcessingTime: 8.3,
          peakHours: ['9h-11h', '14h-16h'],
          preferredDays: ['Mardi', 'Jeudi', 'Vendredi']
        }
      };

      setData(analyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des analytics';
      setError(errorMessage);
      console.error('Erreur analytics expert:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.timeRange]); // Réduire les dépendances au minimum

  // Fonction pour rafraîchir les données
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    // Éviter les rechargements inutiles
    const controller = new AbortController();
    
    const loadDataSafely = async () => {
      if (controller.signal.aborted) return;
      await loadData();
    };
    
    loadDataSafely();
    
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.timeRange]);

  return {
    data,
    metrics: data?.metrics || [],
    performanceByMonth: data?.performanceByMonth || [],
    topProducts: data?.topProducts || [],
    clientDistribution: data?.clientDistribution || [],
    timeAnalysis: data?.timeAnalysis,
    loading,
    error,
    lastUpdated,
    refresh
  };
}; 