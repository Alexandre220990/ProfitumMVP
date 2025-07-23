import { useState, useEffect, useCallback, useMemo } from 'react';
import { get } from '@/lib/api';
import { WORKFLOW_STEPS, TOTAL_WORKFLOW_STEPS } from '@/lib/workflow-constants';

// ============================================================================
// HOOK PIPELINE BUSINESS RÉVOLUTIONNAIRE
// ============================================================================
// Calé sur le workflow existant avec prédictions IA et métriques business

interface BusinessPipelineMetrics {
  // Pipeline par étapes (calé sur WORKFLOW_STEPS)
  pipelineByStep: {
    [key: string]: {
      count: number;
      value: number;
      conversionRate: number;
      averageTime: number;
      dealsAtRisk: number;
    };
  };
  
  // Métriques globales
  totalPipelineValue: number;
  monthlyTarget: number;
  currentAchievement: number;
  targetAchievement: number;
  
  // Prédictions IA
  predictions: {
    endOfMonthDeals: number;
    endOfMonthRevenue: number;
    confidenceScore: number;
    dealsAtRisk: number;
    recommendedTarget: number;
  };
  
  // Répartition par produit
  productDistribution: {
    CEE: { count: number; value: number; conversionRate: number; averageTime: number };
    CIR: { count: number; value: number; conversionRate: number; averageTime: number };
    TICPE: { count: number; value: number; conversionRate: number; averageTime: number };
    DFS: { count: number; value: number; conversionRate: number; averageTime: number };
    MSA: { count: number; value: number; conversionRate: number; averageTime: number };
  };
  
  // Force de vente
  salesForce: {
    activeExperts: number;
    expertsByProduct: { [key: string]: number };
    averageProductivity: number;
    subscriptionRevenue: number;
  };
  
  // Alertes et recommandations
  alerts: {
    bottlenecks: string[];
    opportunities: string[];
    actions: string[];
    risks: string[];
  };
}

interface UseBusinessPipelineOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enablePredictions?: boolean;
}

// Configuration business basée sur vos données
const BUSINESS_CONFIG = {
  // Objectifs mensuels
  monthlyTarget: 4, // ClientProduitsEligibles
  
  // Cycles de vente moyens (en jours)
  salesCycles: {
    CEE: 45,
    CIR: 30,
    TICPE: 30,
    DFS: 60,
    MSA: 30
  },
  
  // Valeurs moyennes par taille d'entreprise
  dealValues: {
    small: 1000,    // Petites entreprises
    medium: 3000,   // Moyennes entreprises
    large: 5000     // Grosses entreprises
  },
  
  // Valeurs moyennes par produit (estimées)
  productValues: {
    CEE: 2500,
    CIR: 2000,
    TICPE: 1500,
    DFS: 4000,
    MSA: 1800
  }
};

export const useBusinessPipeline = (options: UseBusinessPipelineOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enablePredictions = true
  } = options;

  const [metrics, setMetrics] = useState<BusinessPipelineMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ===== FONCTIONS DE CALCUL BUSINESS =====

  const calculatePipelineByStep = useCallback((clientProduitsEligibles: any[]) => {
    const pipeline: any = {};
    
    // Initialiser toutes les étapes du workflow
    Object.values(WORKFLOW_STEPS).forEach(step => {
      pipeline[step.name] = {
        count: 0,
        value: 0,
        conversionRate: 0,
        averageTime: 0,
        dealsAtRisk: 0
      };
    });

    // Analyser chaque ClientProduitEligible
    clientProduitsEligibles.forEach(cpe => {
      const currentStep = cpe.current_step || 0;
      const stepName = Object.values(WORKFLOW_STEPS).find(s => s.id === currentStep)?.name || 'Unknown';
      
      if (pipeline[stepName]) {
        pipeline[stepName].count++;
        
        // Calculer la valeur estimée
        const estimatedValue = BUSINESS_CONFIG.productValues[cpe.produitId as keyof typeof BUSINESS_CONFIG.productValues] || 2000;
        pipeline[stepName].value += estimatedValue;
        
        // Identifier les deals à risque (bloqués depuis trop longtemps)
        const daysInStep = Math.floor((Date.now() - new Date(cpe.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        const maxDaysForStep = BUSINESS_CONFIG.salesCycles[cpe.produitId as keyof typeof BUSINESS_CONFIG.salesCycles] || 30;
        
        if (daysInStep > maxDaysForStep * 0.8) {
          pipeline[stepName].dealsAtRisk++;
        }
      }
    });

    // Calculer les taux de conversion
    Object.keys(pipeline).forEach((stepName, index) => {
      const nextStep = Object.values(WORKFLOW_STEPS)[index + 1];
      if (nextStep && pipeline[nextStep.name]) {
        const currentCount = pipeline[stepName].count;
        const nextCount = pipeline[nextStep.name].count;
        pipeline[stepName].conversionRate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
      }
    });

    return pipeline;
  }, []);

  const calculatePredictions = useCallback((pipeline: any, currentMonth: number) => {
    const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - new Date().getDate();
    
    // Calculer la vélocité actuelle (deals par jour)
    const totalActiveDeals = Object.values(pipeline).reduce((sum: number, step: any) => sum + step.count, 0);
    const averageConversionRate = Object.values(pipeline).reduce((sum: number, step: any) => sum + step.conversionRate, 0) / Object.keys(pipeline).length;
    
    // Prédiction basée sur la vélocité et le taux de conversion
    const dailyVelocity = totalActiveDeals / 30; // Estimation sur 30 jours
    const predictedDeals = Math.round(dailyVelocity * daysRemaining * (averageConversionRate / 100));
    
    // Calculer la valeur prédite
    const averageDealValue = Object.values(pipeline).reduce((sum: number, step: any) => sum + step.value, 0) / totalActiveDeals || 2000;
    const predictedRevenue = predictedDeals * averageDealValue;
    
    // Score de confiance basé sur la stabilité des données
    const confidenceScore = Math.min(95, Math.max(50, averageConversionRate));
    
    // Recommandation d'objectif pour le mois suivant
    const currentAchievement = Object.values(pipeline).find((step: any) => step.name === 'Dossier clôturé')?.count || 0;
    const recommendedTarget = Math.max(
      BUSINESS_CONFIG.monthlyTarget,
      Math.round(currentAchievement * 1.2) // +20% si on dépasse l'objectif
    );

    return {
      endOfMonthDeals: predictedDeals,
      endOfMonthRevenue: predictedRevenue,
      confidenceScore,
      dealsAtRisk: Object.values(pipeline).reduce((sum: number, step: any) => sum + step.dealsAtRisk, 0),
      recommendedTarget
    };
  }, []);

  const calculateProductDistribution = useCallback((clientProduitsEligibles: any[]) => {
    const distribution: any = {};
    
    // Initialiser tous les produits
    Object.keys(BUSINESS_CONFIG.productValues).forEach(product => {
      distribution[product] = {
        count: 0,
        value: 0,
        conversionRate: 0,
        averageTime: 0
      };
    });

    // Analyser par produit
    clientProduitsEligibles.forEach(cpe => {
      const product = cpe.produitId;
      if (distribution[product]) {
        distribution[product].count++;
        distribution[product].value += BUSINESS_CONFIG.productValues[product as keyof typeof BUSINESS_CONFIG.productValues] || 2000;
      }
    });

    return distribution;
  }, []);

  const generateAlerts = useCallback((pipeline: any, predictions: any) => {
    const alerts = {
      bottlenecks: [] as string[],
      opportunities: [] as string[],
      actions: [] as string[],
      risks: [] as string[]
    };

    // Identifier les goulots d'étranglement
    Object.entries(pipeline).forEach(([stepName, step]: [string, any]) => {
      if (step.count > 5 && step.conversionRate < 30) {
        alerts.bottlenecks.push(`${stepName}: ${step.count} dossiers bloqués (${step.conversionRate.toFixed(1)}% conversion)`);
      }
    });

    // Opportunités
    if (predictions.endOfMonthDeals > BUSINESS_CONFIG.monthlyTarget) {
      alerts.opportunities.push(`Objectif dépassé prévu: ${predictions.endOfMonthDeals} vs ${BUSINESS_CONFIG.monthlyTarget}`);
    }

    // Actions recommandées
    if (predictions.dealsAtRisk > 0) {
      alerts.actions.push(`${predictions.dealsAtRisk} dossiers à risque - Intervention requise`);
    }

    // Risques
    if (predictions.confidenceScore < 70) {
      alerts.risks.push(`Score de confiance faible: ${predictions.confidenceScore.toFixed(1)}%`);
    }

    return alerts;
  }, []);

  // ===== CHARGEMENT DES DONNÉES =====

  const loadPipelineData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les ClientProduitEligible
      const response = await get('/admin/client-produits-eligibles');
      
      if (!response.success) {
        throw new Error('Erreur lors du chargement des données');
      }

      const clientProduitsEligibles = response.data || [];

      // Calculer le pipeline par étapes
      const pipelineByStep = calculatePipelineByStep(clientProduitsEligibles);
      
      // Calculer les prédictions
      const predictions = enablePredictions ? calculatePredictions(pipelineByStep, new Date().getMonth()) : {
        endOfMonthDeals: 0,
        endOfMonthRevenue: 0,
        confidenceScore: 0,
        dealsAtRisk: 0,
        recommendedTarget: BUSINESS_CONFIG.monthlyTarget
      };

      // Calculer la répartition par produit
      const productDistribution = calculateProductDistribution(clientProduitsEligibles);

      // Charger les données des experts
      const expertsResponse = await get('/admin/experts');
      const experts = expertsResponse.success ? expertsResponse.data : [];
      
      const salesForce = {
        activeExperts: experts.filter((e: any) => e.status === 'active').length,
        expertsByProduct: experts.reduce((acc: any, expert: any) => {
          expert.specializations?.forEach((spec: string) => {
            acc[spec] = (acc[spec] || 0) + 1;
          });
          return acc;
        }, {}),
        averageProductivity: 0, // À calculer
        subscriptionRevenue: experts.filter((e: any) => e.abonnement).length * 100 // Estimation
      };

      // Générer les alertes
      const alerts = generateAlerts(pipelineByStep, predictions);

      const metrics: BusinessPipelineMetrics = {
        pipelineByStep,
        totalPipelineValue: Object.values(pipelineByStep).reduce((sum: number, step: any) => sum + step.value, 0),
        monthlyTarget: BUSINESS_CONFIG.monthlyTarget,
        currentAchievement: pipelineByStep['Dossier clôturé']?.count || 0,
        targetAchievement: (pipelineByStep['Dossier clôturé']?.count || 0) / BUSINESS_CONFIG.monthlyTarget * 100,
        predictions,
        productDistribution,
        salesForce,
        alerts
      };

      setMetrics(metrics);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [calculatePipelineByStep, calculatePredictions, calculateProductDistribution, generateAlerts, enablePredictions]);

  // ===== EFFETS =====

  useEffect(() => {
    loadPipelineData();

    if (autoRefresh) {
      const interval = setInterval(loadPipelineData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadPipelineData, autoRefresh, refreshInterval]);

  // ===== FONCTIONS UTILITAIRES =====

  const refreshData = useCallback(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  const getStepProgress = useCallback((stepName: string) => {
    if (!metrics) return 0;
    const step = metrics.pipelineByStep[stepName];
    return step ? (step.count / Object.values(metrics.pipelineByStep).reduce((sum: number, s: any) => sum + s.count, 0)) * 100 : 0;
  }, [metrics]);

  const getProductPerformance = useCallback((productName: string) => {
    if (!metrics) return null;
    return metrics.productDistribution[productName as keyof typeof metrics.productDistribution];
  }, [metrics]);

  return {
    metrics,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    getStepProgress,
    getProductPerformance,
    businessConfig: BUSINESS_CONFIG
  };
}; 