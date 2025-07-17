import express from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types pour les analytics
interface AnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: string;
  endDate?: string;
  productType?: string;
  expertId?: string;
  clientType?: string;
}

interface AnalyticsMetric {
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

interface ConversionData {
  step: string;
  conversions: number;
  dropoffs: number;
  rate: number;
  color: string;
}

interface TimeData {
  step: string;
  averageTime: number;
  medianTime: number;
  totalTime: number;
  color: string;
}

interface AbandonmentPoint {
  step: string;
  abandonmentRate: number;
  totalUsers: number;
  abandonedUsers: number;
  color: string;
}

interface ProductPerformance {
  name: string;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgRevenue: number;
  color: string;
}

interface ExpertPerformance {
  name: string;
  assignments: number;
  successRate: number;
  avgCompletionTime: number;
  totalRevenue: number;
  color: string;
}

interface GeographicData {
  city: string;
  count: number;
  percentage: number;
  color: string;
}

interface RealTimeMetric {
  timestamp: string;
  value: number;
  type: string;
}

interface AnalyticsData {
  metrics: AnalyticsMetric[];
  conversionData: ConversionData[];
  timeData: TimeData[];
  abandonmentPoints: AbandonmentPoint[];
  topProducts: ProductPerformance[];
  expertPerformance: ExpertPerformance[];
  geographicData: GeographicData[];
  realTimeMetrics: RealTimeMetric[];
  funnel: {
    clients: number;
    eligibleProducts: number;
    audits: number;
    completed: number;
  };
}

// Fonction utilitaire pour calculer la date de début
function calculateStartDate(timeRange: string, customStartDate?: string): string {
  if (customStartDate) return customStartDate;

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
}

// Fonction pour valider et parser les filtres
function parseFilters(query: any): AnalyticsFilters {
  const timeRange = query.timeRange as string;
  
  // Valider le timeRange
  const validTimeRanges: ('7d' | '30d' | '90d' | '1y' | 'custom')[] = ['7d', '30d', '90d', '1y', 'custom'];
  const validatedTimeRange = validTimeRanges.includes(timeRange as any) ? timeRange as '7d' | '30d' | '90d' | '1y' | 'custom' : '30d';

  return {
    timeRange: validatedTimeRange,
    startDate: query.startDate as string,
    endDate: query.endDate as string,
    productType: query.productType as string,
    expertId: query.expertId as string,
    clientType: query.clientType as string
  };
}

// GET /api/analytics/dashboard - Dashboard analytics principal
router.get('/dashboard', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    // Récupérer toutes les données en parallèle
    const [
      metrics,
      conversionData,
      timeData,
      abandonmentPoints,
      topProducts,
      expertPerformance,
      geographicData,
      realTimeMetrics,
      funnel
    ] = await Promise.all([
      getMetrics(startDateCalculated, endDateCalculated, filters),
      getConversionData(startDateCalculated, endDateCalculated, filters),
      getTimeData(startDateCalculated, endDateCalculated, filters),
      getAbandonmentPoints(startDateCalculated, endDateCalculated, filters),
      getTopProducts(startDateCalculated, endDateCalculated, filters),
      getExpertPerformance(startDateCalculated, endDateCalculated, filters),
      getGeographicData(startDateCalculated, endDateCalculated, filters),
      getRealTimeMetrics(),
      getFunnelData(startDateCalculated, endDateCalculated, filters)
    ]);

    const analyticsData: AnalyticsData = {
      metrics,
      conversionData,
      timeData,
      abandonmentPoints,
      topProducts,
      expertPerformance,
      geographicData,
      realTimeMetrics,
      funnel
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics'
    });
  }
}));

// GET /api/analytics/metrics - Métriques principales uniquement
router.get('/metrics', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    const metrics = await getMetrics(startDateCalculated, endDateCalculated, filters);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques'
    });
  }
}));

// GET /api/analytics/conversion - Données de conversion
router.get('/conversion', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    const [conversionData, abandonmentPoints] = await Promise.all([
      getConversionData(startDateCalculated, endDateCalculated, filters),
      getAbandonmentPoints(startDateCalculated, endDateCalculated, filters)
    ]);

    res.json({
      success: true,
      data: {
        conversionData,
        abandonmentPoints
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de conversion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de conversion'
    });
  }
}));

// GET /api/analytics/products - Performance des produits
router.get('/products', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    const topProducts = await getTopProducts(startDateCalculated, endDateCalculated, filters);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
}));

// GET /api/analytics/experts - Performance des experts
router.get('/experts', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    const expertPerformance = await getExpertPerformance(startDateCalculated, endDateCalculated, filters);

    res.json({
      success: true,
      data: expertPerformance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des experts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des experts'
    });
  }
}));

// GET /api/analytics/geographic - Données géographiques
router.get('/geographic', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    const geographicData = await getGeographicData(startDateCalculated, endDateCalculated, filters);

    res.json({
      success: true,
      data: geographicData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données géographiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données géographiques'
    });
  }
}));

// GET /api/analytics/realtime - Métriques en temps réel
router.get('/realtime', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const realTimeMetrics = await getRealTimeMetrics();

    res.json({
      success: true,
      data: realTimeMetrics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques temps réel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques temps réel'
    });
  }
}));

// GET /api/analytics/export - Export des données
router.get('/export', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const format = (req.query.format as string) || 'csv';
    
    const startDateCalculated = calculateStartDate(filters.timeRange, filters.startDate);
    const endDateCalculated = filters.endDate || new Date().toISOString();

    const analyticsData = await getFullAnalyticsData(filters);
    const exportData = convertToFormat(analyticsData, format as 'csv' | 'json');

    const filename = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export'
    });
  }
}));

// Fonctions utilitaires pour récupérer les données

async function getMetrics(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<AnalyticsMetric[]> {
  try {
    // KPIs Clients
    const { count: totalClients } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: newClients } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // KPIs Experts
    const { count: totalExperts } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // KPIs Dossiers
    const { count: totalAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: completedAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // KPIs Financiers
    const { data: auditsData } = await supabase
      .from('Audit')
      .select('potential_gain, obtained_gain')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalPotentialGain = auditsData?.reduce((sum: number, audit: any) => 
      sum + (audit.potential_gain || 0), 0) || 0;
    
    const totalObtainedGain = auditsData?.reduce((sum: number, audit: any) => 
      sum + (audit.obtained_gain || 0), 0) || 0;

    // Calculer les taux de conversion
    const conversionRate = (totalAudits || 0) > 0 ? ((completedAudits || 0) / (totalAudits || 0)) * 100 : 0;
    const revenueConversion = totalPotentialGain > 0 ? (totalObtainedGain / totalPotentialGain) * 100 : 0;

    return [
      {
        id: 'total-clients',
        name: 'Total Clients',
        value: totalClients || 0,
        change: 12.5,
        changeType: 'increase',
        format: 'number',
        icon: 'users',
        color: 'text-blue-600',
        trend: 'up'
      },
      {
        id: 'new-clients',
        name: 'Nouveaux Clients',
        value: newClients || 0,
        change: 8.3,
        changeType: 'increase',
        format: 'number',
        icon: 'user-plus',
        color: 'text-green-600',
        trend: 'up'
      },
      {
        id: 'total-experts',
        name: 'Experts Actifs',
        value: totalExperts || 0,
        change: 5.2,
        changeType: 'increase',
        format: 'number',
        icon: 'user-check',
        color: 'text-purple-600',
        trend: 'up'
      },
      {
        id: 'conversion-rate',
        name: 'Taux de Conversion',
        value: Math.round(conversionRate * 100) / 100,
        change: 2.1,
        changeType: 'increase',
        format: 'percentage',
        icon: 'trending-up',
        color: 'text-green-600',
        trend: 'up'
      },
      {
        id: 'total-revenue',
        name: 'Revenus Totaux',
        value: totalObtainedGain,
        change: 15.7,
        changeType: 'increase',
        format: 'currency',
        icon: 'dollar-sign',
        color: 'text-green-600',
        trend: 'up'
      },
      {
        id: 'revenue-conversion',
        name: 'Conversion Revenus',
        value: Math.round(revenueConversion * 100) / 100,
        change: -1.2,
        changeType: 'decrease',
        format: 'percentage',
        icon: 'target',
        color: 'text-orange-600',
        trend: 'down'
      }
    ];
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    return [];
  }
}

async function getConversionData(_startDate: string, _endDate: string, _filters: AnalyticsFilters): Promise<ConversionData[]> {
  try {
    // Simuler les données de conversion par étape
    const steps = [
      { name: 'Signature charte', color: '#3B82F6' },
      { name: 'Sélection expert', color: '#10B981' },
      { name: 'Complétion dossier', color: '#F59E0B' },
      { name: 'Validation admin', color: '#EF4444' },
      { name: 'Dossier finalisé', color: '#8B5CF6' }
    ];

    const conversionData: ConversionData[] = [];
    let previousConversions = 100;

    for (const step of steps) {
      const dropoffs = Math.floor(Math.random() * 20) + 5;
      const conversions = previousConversions - dropoffs;
      const rate = (conversions / previousConversions) * 100;

      conversionData.push({
        step: step.name,
        conversions,
        dropoffs,
        rate: Math.round(rate * 10) / 10,
        color: step.color
      });

      previousConversions = conversions;
    }

    return conversionData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de conversion:', error);
    return [];
  }
}

async function getTimeData(_startDate: string, _endDate: string, _filters: AnalyticsFilters): Promise<TimeData[]> {
  try {
    const steps = [
      { name: 'Signature charte', color: '#3B82F6' },
      { name: 'Sélection expert', color: '#10B981' },
      { name: 'Complétion dossier', color: '#F59E0B' },
      { name: 'Validation admin', color: '#EF4444' },
      { name: 'Dossier finalisé', color: '#8B5CF6' }
    ];

    return steps.map(step => ({
      step: step.name,
      averageTime: Math.random() * 5 + 1,
      medianTime: Math.random() * 3 + 0.5,
      totalTime: Math.random() * 200 + 50,
      color: step.color
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des données de temps:', error);
    return [];
  }
}

async function getAbandonmentPoints(_startDate: string, _endDate: string, _filters: AnalyticsFilters): Promise<AbandonmentPoint[]> {
  try {
    const steps = [
      { name: 'Signature charte', color: '#EF4444' },
      { name: 'Sélection expert', color: '#F59E0B' },
      { name: 'Complétion dossier', color: '#10B981' },
      { name: 'Validation admin', color: '#3B82F6' },
      { name: 'Dossier finalisé', color: '#8B5CF6' }
    ];

    return steps.map(step => {
      const totalUsers = Math.floor(Math.random() * 100) + 50;
      const abandonedUsers = Math.floor(Math.random() * 20) + 5;
      const abandonmentRate = (abandonedUsers / totalUsers) * 100;

      return {
        step: step.name,
        abandonmentRate: Math.round(abandonmentRate * 10) / 10,
        totalUsers,
        abandonedUsers,
        color: step.color
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des points d\'abandon:', error);
    return [];
  }
}

async function getTopProducts(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<ProductPerformance[]> {
  try {
    const { data: productData } = await supabase
      .from('ClientProduitEligible')
      .select(`
        statut,
        ProduitEligible (id, nom),
        created_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const productStats: Record<string, { conversions: number; revenue: number; total: number }> = {};

    productData?.forEach((item: any) => {
      const productName = (item.ProduitEligible as any)?.nom || 'Inconnu';
      if (!productStats[productName]) {
        productStats[productName] = { conversions: 0, revenue: 0, total: 0 };
      }
      productStats[productName].total++;
      if (item.statut === 'eligible') {
        productStats[productName].conversions++;
        productStats[productName].revenue += Math.random() * 1000 + 500; // Simuler les revenus
      }
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

    return Object.entries(productStats)
      .map(([name, stats], index) => ({
        name,
        conversions: stats.conversions,
        revenue: stats.revenue,
        conversionRate: (stats.conversions / stats.total) * 100,
        avgRevenue: stats.conversions > 0 ? stats.revenue / stats.conversions : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }
}

async function getExpertPerformance(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<ExpertPerformance[]> {
  try {
    const { data: expertData } = await supabase
      .from('expertassignment')
      .select(`
        status,
        compensation_amount,
        assignment_date,
        completed_date,
        Expert (id, name)
      `)
      .gte('assignment_date', startDate)
      .lte('assignment_date', endDate);

    const expertStats: Record<string, { assignments: number; completed: number; revenue: number; completionTimes: number[] }> = {};

    expertData?.forEach((item: any) => {
      const expertName = (item.Expert as any)?.name || 'Inconnu';
      if (!expertStats[expertName]) {
        expertStats[expertName] = { assignments: 0, completed: 0, revenue: 0, completionTimes: [] };
      }
      expertStats[expertName].assignments++;
      if (item.status === 'completed') {
        expertStats[expertName].completed++;
        expertStats[expertName].revenue += Number(item.compensation_amount) || 0;
        if (item.assignment_date && item.completed_date) {
          const completionTime = (new Date(item.completed_date).getTime() - new Date(item.assignment_date).getTime()) / (1000 * 60 * 60 * 24);
          expertStats[expertName].completionTimes.push(completionTime);
        }
      }
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

    return Object.entries(expertStats)
      .map(([name, stats], index) => ({
        name,
        assignments: stats.assignments,
        successRate: (stats.completed / stats.assignments) * 100,
        avgCompletionTime: stats.completionTimes.length > 0 
          ? stats.completionTimes.reduce((a, b) => a + b, 0) / stats.completionTimes.length 
          : 0,
        totalRevenue: stats.revenue,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 8);
  } catch (error) {
    console.error('Erreur lors de la récupération des performances experts:', error);
    return [];
  }
}

async function getGeographicData(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<GeographicData[]> {
  try {
    const { data: clientData } = await supabase
      .from('Client')
      .select('city')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('city', 'is', null);

    const cityStats: Record<string, number> = {};
    clientData?.forEach((client: any) => {
      cityStats[client.city] = (cityStats[client.city] || 0) + 1;
    });

    const total = Object.values(cityStats).reduce((sum, count) => sum + count, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

    return Object.entries(cityStats)
      .map(([city, count], index) => ({
        city,
        count,
        percentage: (count / total) * 100,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch (error) {
    console.error('Erreur lors de la récupération des données géographiques:', error);
    return [];
  }
}

async function getRealTimeMetrics(): Promise<RealTimeMetric[]> {
  try {
    const now = new Date();
    const metrics: RealTimeMetric[] = [];

    // Simuler des métriques en temps réel pour les dernières 24 heures
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
      metrics.push({
        timestamp,
        value: Math.floor(Math.random() * 100) + 50,
        type: 'active_users'
      });
    }

    return metrics;
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques temps réel:', error);
    return [];
  }
}

async function getFunnelData(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<{ clients: number; eligibleProducts: number; audits: number; completed: number }> {
  try {
    const { count: clients } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: eligibleProducts } = await supabase
      .from('ClientProduitEligible')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'eligible')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: audits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: completed } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return {
      clients: clients || 0,
      eligibleProducts: eligibleProducts || 0,
      audits: audits || 0,
      completed: completed || 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données du funnel:', error);
    return { clients: 0, eligibleProducts: 0, audits: 0, completed: 0 };
  }
}

async function getFullAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  const startDate = calculateStartDate(filters.timeRange, filters.startDate);
  const endDate = filters.endDate || new Date().toISOString();

  const [
    metrics,
    conversionData,
    timeData,
    abandonmentPoints,
    topProducts,
    expertPerformance,
    geographicData,
    realTimeMetrics,
    funnel
  ] = await Promise.all([
    getMetrics(startDate, endDate, filters),
    getConversionData(startDate, endDate, filters),
    getTimeData(startDate, endDate, filters),
    getAbandonmentPoints(startDate, endDate, filters),
    getTopProducts(startDate, endDate, filters),
    getExpertPerformance(startDate, endDate, filters),
    getGeographicData(startDate, endDate, filters),
    getRealTimeMetrics(),
    getFunnelData(startDate, endDate, filters)
  ]);

  return {
    metrics,
    conversionData,
    timeData,
    abandonmentPoints,
    topProducts,
    expertPerformance,
    geographicData,
    realTimeMetrics,
    funnel
  };
}

function convertToFormat(data: AnalyticsData, format: 'csv' | 'json'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  
  // CSV
  const csvRows: string[] = [];
  
  // En-têtes
  csvRows.push('Métrique,Valeur,Changement,Type');
  
  // Métriques
  data.metrics.forEach(metric => {
    csvRows.push(`${metric.name},${metric.value},${metric.change}%,${metric.changeType}`);
  });
  
  // Produits
  csvRows.push('');
  csvRows.push('Produit,Conversions,Revenus,Taux de conversion');
  data.topProducts.forEach(product => {
    csvRows.push(`${product.name},${product.conversions},${product.revenue},${product.conversionRate}%`);
  });
  
  // Experts
  csvRows.push('');
  csvRows.push('Expert,Assignations,Taux de succès,Revenus totaux');
  data.expertPerformance.forEach(expert => {
    csvRows.push(`${expert.name},${expert.assignments},${expert.successRate}%,${expert.totalRevenue}`);
  });
  
  return csvRows.join('\n');
}

export default router; 