import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types pour les analytics expert
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

// GET /api/expert/analytics/metrics - Métriques principales de l'expert
router.get('/metrics', asyncHandler(async (req, res) => {
  try {
    const expertId = (req as any).user?.database_id;
    
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Expert non authentifié'
      });
    }

    // Récupérer les assignations de l'expert
    const { data: assignments } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId);

    const totalAssignments = assignments?.length || 0;
    const completedAssignments = assignments?.filter(a => a.status === 'completed').length || 0;
    const activeAssignments = assignments?.filter(a => a.status === 'active' || a.status === 'in_progress').length || 0;
    
    // Calculer les revenus
    const totalRevenue = assignments
      ?.filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (Number(a.compensation_amount) || 0), 0) || 0;

    // Taux de succès
    const successRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100 * 10) / 10
      : 0;

    // Temps moyen de traitement
    const completionTimes = assignments
      ?.filter(a => a.completed_date && a.assignment_date)
      .map(a => {
        const start = new Date(a.assignment_date).getTime();
        const end = new Date(a.completed_date).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // en jours
      }) || [];
    
    const avgCompletionTime = completionTimes.length > 0
      ? Math.round((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) * 10) / 10
      : 0;

    // Récupérer les clients uniques
    const uniqueClients = new Set(assignments?.map(a => a.client_id)).size;

    const metrics: ExpertMetric[] = [
      {
        id: 'total-assignments',
        name: 'Assignations Actives',
        value: activeAssignments,
        change: 0,
        changeType: 'neutral',
        format: 'number',
        icon: 'briefcase',
        color: 'text-blue-600',
        trend: 'stable'
      },
      {
        id: 'clients-actifs',
        name: 'Clients Actifs',
        value: uniqueClients,
        change: 0,
        changeType: 'neutral',
        format: 'number',
        icon: 'users',
        color: 'text-green-600',
        trend: 'stable'
      },
      {
        id: 'total-revenue',
        name: 'Revenus Totaux',
        value: totalRevenue,
        change: 0,
        changeType: 'neutral',
        format: 'currency',
        icon: 'dollar-sign',
        color: 'text-green-600',
        trend: 'stable'
      },
      {
        id: 'success-rate',
        name: 'Taux de Succès',
        value: successRate,
        change: 0,
        changeType: 'neutral',
        format: 'percentage',
        icon: 'trending-up',
        color: 'text-purple-600',
        trend: 'stable'
      },
      {
        id: 'avg-completion',
        name: 'Temps Moyen',
        value: avgCompletionTime,
        change: 0,
        changeType: 'neutral',
        format: 'duration',
        icon: 'clock',
        color: 'text-orange-600',
        trend: 'stable'
      },
      {
        id: 'completed',
        name: 'Dossiers Terminés',
        value: completedAssignments,
        change: 0,
        changeType: 'neutral',
        format: 'number',
        icon: 'check-circle',
        color: 'text-green-600',
        trend: 'stable'
      }
    ];

    return res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Erreur analytics metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques'
    });
  }
}));

// GET /api/expert/analytics/performance - Performance mensuelle
router.get('/performance', asyncHandler(async (req, res) => {
  try {
    const expertId = (req as any).user?.database_id;
    const { timeRange = '30d' } = req.query;
    
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Expert non authentifié'
      });
    }

    // Calculer la date de début
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Récupérer les assignations
    const { data: assignments } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId)
      .gte('assignment_date', startDate.toISOString());

    // Grouper par mois
    const monthlyData: Record<string, {
      revenue: number;
      assignments: number;
      completed: number;
      completionTimes: number[];
    }> = {};

    assignments?.forEach(a => {
      const date = new Date(a.assignment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

      if (!monthlyData[monthName]) {
        monthlyData[monthName] = {
          revenue: 0,
          assignments: 0,
          completed: 0,
          completionTimes: []
        };
      }

      monthlyData[monthName].assignments++;
      
      if (a.status === 'completed') {
        monthlyData[monthName].completed++;
        monthlyData[monthName].revenue += Number(a.compensation_amount) || 0;
        
        if (a.completed_date && a.assignment_date) {
          const start = new Date(a.assignment_date).getTime();
          const end = new Date(a.completed_date).getTime();
          const days = (end - start) / (1000 * 60 * 60 * 24);
          monthlyData[monthName].completionTimes.push(days);
        }
      }
    });

    const performance: MonthlyPerformance[] = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      assignments: data.assignments,
      completionRate: data.assignments > 0 
        ? Math.round((data.completed / data.assignments) * 100 * 10) / 10
        : 0,
      avgCompletionTime: data.completionTimes.length > 0
        ? Math.round((data.completionTimes.reduce((a, b) => a + b, 0) / data.completionTimes.length) * 10) / 10
        : 0
    }));

    return res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Erreur analytics performance:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la performance'
    });
  }
}));

// GET /api/expert/analytics/products - Top produits
router.get('/products', asyncHandler(async (req, res) => {
  try {
    const expertId = (req as any).user?.database_id;
    
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Expert non authentifié'
      });
    }

    // Récupérer les assignations avec les produits
    const { data: assignments } = await supabase
      .from('expertassignment')
      .select(`
        *,
        ProduitEligible(*)
      `)
      .eq('expert_id', expertId);

    // Grouper par produit
    const productStats: Record<string, {
      count: number;
      completed: number;
      revenue: number;
    }> = {};

    assignments?.forEach(a => {
      const productName = (a.ProduitEligible as any)?.nom || 'Inconnu';
      
      if (!productStats[productName]) {
        productStats[productName] = {
          count: 0,
          completed: 0,
          revenue: 0
        };
      }

      productStats[productName].count++;
      
      if (a.status === 'completed') {
        productStats[productName].completed++;
        productStats[productName].revenue += Number(a.compensation_amount) || 0;
      }
    });

    const topProducts: TopProduct[] = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        revenue: stats.revenue,
        conversionRate: stats.count > 0 
          ? Math.round((stats.completed / stats.count) * 100 * 10) / 10
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return res.json({
      success: true,
      data: topProducts
    });

  } catch (error) {
    console.error('Erreur analytics products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
}));

// GET /api/expert/analytics/clients - Distribution des clients
router.get('/clients', asyncHandler(async (req, res) => {
  try {
    const expertId = (req as any).user?.database_id;
    
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Expert non authentifié'
      });
    }

    // Récupérer les assignations avec les clients
    const { data: assignments } = await supabase
      .from('expertassignment')
      .select(`
        *,
        Client:client_id (
          id,
          type
        )
      `)
      .eq('expert_id', expertId);

    // Compter les clients uniques par type
    const clientsByType: Record<string, Set<string>> = {};
    
    assignments?.forEach(a => {
      const clientType = (a.Client as any)?.type || 'Autre';
      const clientId = a.client_id;
      
      if (!clientsByType[clientType]) {
        clientsByType[clientType] = new Set();
      }
      
      clientsByType[clientType].add(clientId);
    });

    const totalClients = new Set(assignments?.map(a => a.client_id)).size;

    const distribution: ClientDistribution[] = Object.entries(clientsByType)
      .map(([clientType, clients]) => ({
        clientType,
        count: clients.size,
        percentage: totalClients > 0 
          ? Math.round((clients.size / totalClients) * 100 * 10) / 10
          : 0
      }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Erreur analytics clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la distribution clients'
    });
  }
}));

// GET /api/expert/analytics/time - Analyse temporelle
router.get('/time', asyncHandler(async (req, res) => {
  try {
    const expertId = (req as any).user?.database_id;
    
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Expert non authentifié'
      });
    }

    // Récupérer les assignations
    const { data: assignments } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId);

    // Calculer temps de réponse moyen (basé sur accepted_date)
    const responseTimes = assignments
      ?.filter(a => a.accepted_date && a.assignment_date)
      .map(a => {
        const start = new Date(a.assignment_date).getTime();
        const end = new Date(a.accepted_date).getTime();
        return (end - start) / (1000 * 60 * 60); // en heures
      }) || [];
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
      : 0;

    // Calculer temps de traitement moyen
    const processingTimes = assignments
      ?.filter(a => a.completed_date && a.assignment_date)
      .map(a => {
        const start = new Date(a.assignment_date).getTime();
        const end = new Date(a.completed_date).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // en jours
      }) || [];
    
    const avgProcessingTime = processingTimes.length > 0
      ? Math.round((processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) * 10) / 10
      : 0;

    // Analyser heures de pointe
    const hourCounts: Record<number, number> = {};
    assignments?.forEach(a => {
      if (a.assignment_date) {
        const hour = new Date(a.assignment_date).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}h`);

    // Analyser jours préférés
    const dayCounts: Record<string, number> = {};
    assignments?.forEach(a => {
      if (a.assignment_date) {
        const day = new Date(a.assignment_date).toLocaleDateString('fr-FR', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });
    
    const preferredDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    const timeAnalysis: TimeAnalysis = {
      averageResponseTime: avgResponseTime,
      averageProcessingTime: avgProcessingTime,
      peakHours,
      preferredDays
    };

    return res.json({
      success: true,
      data: timeAnalysis
    });

  } catch (error) {
    console.error('Erreur analytics time:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse temporelle'
    });
  }
}));

export default router;

