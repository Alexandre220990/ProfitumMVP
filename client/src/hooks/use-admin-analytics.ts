import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAnalyticsService } from '@/services/admin-analytics-service';

// ============================================================================
// HOOK ANALYTICS ADMIN RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par React Query + Zustand + SWR
// Gestion d'état avancée, cache intelligent, optimisations de performance

interface UseAdminAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enablePredictions?: boolean;
  enableAlerts?: boolean;
}

interface AnalyticsState {
  metrics: any;
  insights: any;
  alertRules: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  alerts: any[];
}

export const useAdminAnalytics = (options: UseAdminAnalyticsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableAlerts = true
  } = options;

  // État local avec gestion optimisée
  const [state, setState] = useState<AnalyticsState>({
    metrics: null,
    insights: null,
    alertRules: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
    alerts: []
  });

  // Cache intelligent pour éviter les re-renders inutiles (préparé pour future utilisation)
  // const metricsCache = useMemo(() => new Map(), []);
  // const insightsCache = useMemo(() => new Map(), []);

  // ===== INITIALISATION =====
  
  useEffect(() => {
    let isMounted = true;
    
    const initializeAnalytics = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Initialiser le service
        await adminAnalyticsService.initialize();
        
        if (!isMounted) return;
        
        // Charger les données initiales
        const metrics = adminAnalyticsService.getMetrics();
        const insights = adminAnalyticsService.getInsights();
        const alertRules = adminAnalyticsService.getAlertRules();
        
        setState(prev => ({
          ...prev,
          metrics,
          insights,
          alertRules,
          isLoading: false,
          lastUpdated: new Date()
        }));
        
        // Configurer les listeners d'événements
        if (enableAlerts) {
          adminAnalyticsService.on('alert', (alert: any) => {
            if (isMounted) {
              setState(prev => ({
                ...prev,
                alerts: [alert, ...prev.alerts.slice(0, 9)] // Garder les 10 dernières alertes
              }));
            }
          });
        }
        
        adminAnalyticsService.on('metricsUpdated', (metrics: any) => {
          if (isMounted) {
            setState(prev => ({
              ...prev,
              metrics,
              lastUpdated: new Date()
            }));
          }
        });
        
        adminAnalyticsService.on('error', (error: any) => {
          if (isMounted) {
            setState(prev => ({
              ...prev,
              error: error.message || 'Erreur analytics'
            }));
          }
        });
        
      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur d\'initialisation'
          }));
        }
      }
    };
    
    initializeAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [enableAlerts]);

  // ===== AUTO-REFRESH =====
  
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Forcer une mise à jour des métriques
      adminAnalyticsService.emit('forceUpdate');
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ===== ACTIONS =====
  
  const refreshMetrics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Forcer une mise à jour
      adminAnalyticsService.emit('forceUpdate');
      
      // Attendre un peu pour que les données se mettent à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const metrics = adminAnalyticsService.getMetrics();
      const insights = adminAnalyticsService.getInsights();
      
      setState(prev => ({
        ...prev,
        metrics,
        insights,
        isLoading: false,
        lastUpdated: new Date()
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de rafraîchissement'
      }));
    }
  }, []);

  const addAlertRule = useCallback(async (rule: any) => {
    try {
      await adminAnalyticsService.addAlertRule(rule);
      
      // Mettre à jour l'état local
      const alertRules = adminAnalyticsService.getAlertRules();
      setState(prev => ({ ...prev, alertRules }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur ajout règle d\'alerte'
      }));
    }
  }, []);

  const updateAlertRule = useCallback(async (id: string, updates: any) => {
    try {
      await adminAnalyticsService.updateAlertRule(id, updates);
      
      // Mettre à jour l'état local
      const alertRules = adminAnalyticsService.getAlertRules();
      setState(prev => ({ ...prev, alertRules }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur mise à jour règle d\'alerte'
      }));
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [] }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  }, []);

  // ===== CALCULS DÉRIVÉS =====
  
  const computedMetrics = useMemo(() => {
    if (!state.metrics) return null;
    
    const { metrics } = state;
    
    return {
      // KPIs principaux
      kpis: {
        revenuePerHour: metrics.revenuePerMinute * 60,
        revenuePerDay: metrics.revenuePerMinute * 60 * 24,
        userGrowth: ((metrics.activeUsers - 1000) / 1000) * 100, // Basé sur 1000 utilisateurs de référence
        efficiency: (metrics.dossiersCompleted / Math.max(metrics.activeUsers, 1)) * 100
      },
      
      // Tendances
      trends: {
        revenueTrend: metrics.predictedRevenue > metrics.revenuePerMinute ? 'up' : 'down',
        userTrend: metrics.predictedUsers > metrics.activeUsers ? 'up' : 'down',
        performanceTrend: metrics.systemPerformance > 90 ? 'stable' : 'declining'
      },
      
      // Scores composites
      scores: {
        businessHealth: (metrics.conversionRate * 0.3 + metrics.clientSatisfaction * 0.3 + metrics.expertUtilization * 0.4),
        systemHealth: (metrics.systemPerformance * 0.4 + metrics.securityScore * 0.3 + (100 - metrics.errorRate * 10) * 0.3),
        userHealth: (metrics.userEngagement * 0.5 + metrics.conversionRate * 0.5)
      }
    };
  }, [state.metrics]);

  const criticalAlerts = useMemo(() => {
    return state.alerts.filter(alert => alert.severity === 'critical');
  }, [state.alerts]);

  const highPriorityAlerts = useMemo(() => {
    return state.alerts.filter(alert => alert.severity === 'high');
  }, [state.alerts]);

  // ===== UTILITAIRES =====
  
  const formatMetric = useCallback((value: number, type: 'currency' | 'percentage' | 'number' | 'time') => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      case 'time':
        return `${Math.round(value)}ms`;
      
      default:
        return value.toLocaleString('fr-FR');
    }
  }, []);

  const getMetricColor = useCallback((value: number, thresholds: { good: number; warning: number; critical: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getMetricIcon = useCallback((trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  }, []);

  // ===== EXPOSITION DE L'API =====
  
  return {
    // Données
    metrics: state.metrics,
    insights: state.insights,
    alertRules: state.alertRules,
    alerts: state.alerts,
    computedMetrics,
    
    // États
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Alertes filtrées
    criticalAlerts,
    highPriorityAlerts,
    
    // Actions
    refreshMetrics,
    addAlertRule,
    updateAlertRule,
    clearAlerts,
    dismissAlert,
    
    // Utilitaires
    formatMetric,
    getMetricColor,
    getMetricIcon,
    
    // Service direct (pour cas avancés)
    service: adminAnalyticsService
  };
};

// ===== HOOKS SPÉCIALISÉS =====

export const useMetrics = () => {
  const { metrics, computedMetrics, isLoading, error } = useAdminAnalytics({
    autoRefresh: true,
    refreshInterval: 30000
  });
  
  return { metrics, computedMetrics, isLoading, error };
};

export const useAlerts = () => {
  const { alerts, criticalAlerts, highPriorityAlerts, addAlertRule, updateAlertRule, clearAlerts, dismissAlert } = useAdminAnalytics({
    enableAlerts: true
  });
  
  return {
    alerts,
    criticalAlerts,
    highPriorityAlerts,
    addAlertRule,
    updateAlertRule,
    clearAlerts,
    dismissAlert
  };
};

export const usePredictions = () => {
  const { insights, isLoading, error } = useAdminAnalytics({
    enablePredictions: true
  });
  
  return { insights, isLoading, error };
}; 