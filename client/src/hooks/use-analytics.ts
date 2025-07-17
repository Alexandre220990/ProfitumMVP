import { useState, useEffect, useCallback, useRef } from 'react';
import analyticsService, { 
  AnalyticsData, 
  AnalyticsFilters, 
  AnalyticsMetric,
  ConversionData,
  TimeData,
  AbandonmentPoint,
  ProductPerformance,
  ExpertPerformance,
  GeographicData,
  RealTimeMetric
} from '@/services/analyticsService';

interface UseAnalyticsReturn {
  // Données
  data: AnalyticsData | null;
  metrics: AnalyticsMetric[];
  conversionData: ConversionData[];
  timeData: TimeData[];
  abandonmentPoints: AbandonmentPoint[];
  topProducts: ProductPerformance[];
  expertPerformance: ExpertPerformance[];
  geographicData: GeographicData[];
  realTimeMetrics: RealTimeMetric[];
  funnel: { clients: number; eligibleProducts: number; audits: number; completed: number } | null;
  
  // État
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  exportData: (format: 'csv' | 'json' | 'excel') => Promise<string>;
  generateReport: () => Promise<Blob>;
  
  // Filtres
  filters: AnalyticsFilters;
  
  // Monitoring temps réel
  isRealTimeEnabled: boolean;
  enableRealTime: () => void;
  disableRealTime: () => void;
}

export const useAnalytics = (initialFilters: AnalyticsFilters = { timeRange: '30d' }): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  
  const realTimeCallbackRef = useRef<(data: AnalyticsData) => void>();

  // Fonction pour charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analyticsData = await analyticsService.getAnalyticsData(filters);
      setData(analyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des analytics';
      setError(errorMessage);
      console.error('Erreur analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fonction pour rafraîchir les données
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Fonction pour mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Fonction pour exporter les données
  const exportData = useCallback(async (format: 'csv' | 'json' | 'excel'): Promise<string> => {
    try {
      return await analyticsService.exportAnalyticsData(filters, format);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      throw new Error(errorMessage);
    }
  }, [filters]);

  // Fonction pour générer un rapport PDF
  const generateReport = useCallback(async (): Promise<Blob> => {
    try {
      return await analyticsService.generatePDFReport(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération du rapport';
      throw new Error(errorMessage);
    }
  }, [filters]);

  // Fonction pour activer le monitoring temps réel
  const enableRealTime = useCallback(() => {
    if (!isRealTimeEnabled) {
      realTimeCallbackRef.current = (newData: AnalyticsData) => {
        setData(newData);
        setLastUpdated(new Date());
      };
      
      analyticsService.startRealTimeMonitoring(realTimeCallbackRef.current);
      setIsRealTimeEnabled(true);
    }
  }, [isRealTimeEnabled]);

  // Fonction pour désactiver le monitoring temps réel
  const disableRealTime = useCallback(() => {
    if (isRealTimeEnabled && realTimeCallbackRef.current) {
      analyticsService.stopRealTimeMonitoring(realTimeCallbackRef.current);
      setIsRealTimeEnabled(false);
      realTimeCallbackRef.current = undefined;
    }
  }, [isRealTimeEnabled]);

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Nettoyer le monitoring temps réel au démontage
  useEffect(() => {
    return () => {
      if (realTimeCallbackRef.current) {
        analyticsService.stopRealTimeMonitoring(realTimeCallbackRef.current);
      }
    };
  }, []);

  return {
    // Données
    data,
    metrics: data?.metrics || [],
    conversionData: data?.conversionData || [],
    timeData: data?.timeData || [],
    abandonmentPoints: data?.abandonmentPoints || [],
    topProducts: data?.topProducts || [],
    expertPerformance: data?.expertPerformance || [],
    geographicData: data?.geographicData || [],
    realTimeMetrics: data?.realTimeMetrics || [],
    funnel: data?.funnel || null,
    
    // État
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh,
    updateFilters,
    exportData,
    generateReport,
    
    // Filtres
    filters,
    
    // Monitoring temps réel
    isRealTimeEnabled,
    enableRealTime,
    disableRealTime
  };
};

// Hook spécialisé pour les métriques principales
export const useAnalyticsMetrics = (filters: AnalyticsFilters = { timeRange: '30d' }) => {
  const { metrics, loading, error, refresh } = useAnalytics(filters);
  
  return {
    metrics,
    loading,
    error,
    refresh
  };
};

// Hook spécialisé pour les données de conversion
export const useConversionAnalytics = (filters: AnalyticsFilters = { timeRange: '30d' }) => {
  const { conversionData, abandonmentPoints, loading, error, refresh } = useAnalytics(filters);
  
  return {
    conversionData,
    abandonmentPoints,
    loading,
    error,
    refresh
  };
};

// Hook spécialisé pour les performances des produits
export const useProductAnalytics = (filters: AnalyticsFilters = { timeRange: '30d' }) => {
  const { topProducts, loading, error, refresh } = useAnalytics(filters);
  
  return {
    topProducts,
    loading,
    error,
    refresh
  };
};

// Hook spécialisé pour les performances des experts
export const useExpertAnalytics = (filters: AnalyticsFilters = { timeRange: '30d' }) => {
  const { expertPerformance, loading, error, refresh } = useAnalytics(filters);
  
  return {
    expertPerformance,
    loading,
    error,
    refresh
  };
};

// Hook spécialisé pour les données géographiques
export const useGeographicAnalytics = (filters: AnalyticsFilters = { timeRange: '30d' }) => {
  const { geographicData, loading, error, refresh } = useAnalytics(filters);
  
  return {
    geographicData,
    loading,
    error,
    refresh
  };
};

// Hook spécialisé pour les métriques en temps réel
export const useRealTimeAnalytics = () => {
  const { realTimeMetrics, isRealTimeEnabled, enableRealTime, disableRealTime, loading, error } = useAnalytics({ timeRange: '7d' });
  
  return {
    realTimeMetrics,
    isRealTimeEnabled,
    enableRealTime,
    disableRealTime,
    loading,
    error
  };
};

export default useAnalytics; 