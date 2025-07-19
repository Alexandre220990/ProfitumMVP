import { supabase } from '../lib/supabase';

// Types pour les analytics
export interface AnalyticsMetric {
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

export interface ConversionData {
  step: string;
  conversions: number;
  dropoffs: number;
  rate: number;
  color: string;
}

export interface TimeData {
  step: string;
  averageTime: number;
  medianTime: number;
  totalTime: number;
  color: string;
}

export interface AbandonmentPoint {
  step: string;
  abandonmentRate: number;
  totalUsers: number;
  abandonedUsers: number;
  color: string;
}

export interface ProductPerformance {
  name: string;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgRevenue: number;
  color: string;
}

export interface ExpertPerformance {
  name: string;
  assignments: number;
  successRate: number;
  avgCompletionTime: number;
  totalRevenue: number;
  color: string;
}

export interface GeographicData {
  city: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RealTimeMetric {
  timestamp: string;
  value: number;
  type: string;
}

export interface AnalyticsData {
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

export interface AnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: string;
  endDate?: string;
  productType?: string;
  expertId?: string;
  clientType?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private realTimeInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(data: AnalyticsData) => void> = new Set();

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Récupérer les données analytics principales
  async getAnalyticsData(filters: AnalyticsFilters = { timeRange: '30d' }): Promise<AnalyticsData> {
    try {
      const startDate = this.calculateStartDate(filters.timeRange, filters.startDate);
      const endDate = filters.endDate || new Date().toISOString();

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
        this.getMetrics(startDate, endDate, filters),
        this.getConversionData(startDate, endDate, filters),
        this.getTimeData(startDate, endDate, filters),
        this.getAbandonmentPoints(startDate, endDate, filters),
        this.getTopProducts(startDate, endDate, filters),
        this.getExpertPerformance(startDate, endDate, filters),
        this.getGeographicData(startDate, endDate, filters),
        this.getRealTimeMetrics(),
        this.getFunnelData(startDate, endDate, filters)
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
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error);
      throw new Error('Impossible de récupérer les données analytics');
    }
  }

  // Récupérer les métriques principales
  private async getMetrics(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<AnalyticsMetric[]> {
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

      const totalPotentialGain = auditsData?.reduce((sum, audit) => 
        sum + (audit.potential_gain || 0), 0) || 0;
      
      const totalObtainedGain = auditsData?.reduce((sum, audit) => 
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

  // Récupérer les données de conversion
  private async getConversionData(_startDate: string, _endDate: string, _filters: AnalyticsFilters): Promise<ConversionData[]> {
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

  // Récupérer les données de temps
  private async getTimeData(_startDate: string, _endDate: string, _filters: AnalyticsFilters): Promise<TimeData[]> {
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

  // Récupérer les points d'abandon
  private async getAbandonmentPoints(_startDate: string, _endDate: string, _filters: AnalyticsFilters): Promise<AbandonmentPoint[]> {
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

  // Récupérer les produits les plus performants
  private async getTopProducts(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<ProductPerformance[]> {
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

      productData?.forEach(item => {
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

  // Récupérer les performances des experts
  private async getExpertPerformance(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<ExpertPerformance[]> {
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

      expertData?.forEach(item => {
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

  // Récupérer les données géographiques
  private async getGeographicData(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<GeographicData[]> {
    try {
      const { data: clientData } = await supabase
        .from('Client')
        .select('city')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('city', 'is', null);

      const cityStats: Record<string, number> = {};
      clientData?.forEach(client => {
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

  // Récupérer les métriques en temps réel
  private async getRealTimeMetrics(): Promise<RealTimeMetric[]> {
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

  // Récupérer les données du funnel
  private async getFunnelData(startDate: string, endDate: string, _filters: AnalyticsFilters): Promise<{ clients: number; eligibleProducts: number; audits: number; completed: number }> {
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

  // Calculer la date de début selon la période
  private calculateStartDate(timeRange: string, customStartDate?: string): string {
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

  // Démarrer le monitoring en temps réel
  startRealTimeMonitoring(callback: (data: AnalyticsData) => void): void {
    this.subscribers.add(callback);
    
    if (!this.realTimeInterval) {
      this.realTimeInterval = setInterval(async () => {
        try {
          const data = await this.getAnalyticsData({ timeRange: '30d' });
          this.subscribers.forEach(subscriber => subscriber(data));
        } catch (error) {
          console.error('Erreur lors du monitoring temps réel:', error);
        }
      }, 30000); // Mise à jour toutes les 30 secondes
    }
  }

  // Arrêter le monitoring en temps réel
  stopRealTimeMonitoring(callback?: (data: AnalyticsData) => void): void {
    if (callback) {
      this.subscribers.delete(callback);
    } else {
      this.subscribers.clear();
    }

    if (this.subscribers.size === 0 && this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
    }
  }

  // Exporter les données analytics
  async exportAnalyticsData(filters: AnalyticsFilters, format: 'csv' | 'json' | 'excel' = 'csv'): Promise<string> {
    try {
      const data = await this.getAnalyticsData(filters);
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }
      
      if (format === 'csv') {
        return this.convertToCSV(data);
      }
      
      // Pour Excel, on retourne du CSV (peut être étendu avec une librairie Excel)
      return this.convertToCSV(data);
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      throw new Error('Impossible d\'exporter les données');
    }
  }

  // Convertir les données en CSV
  private convertToCSV(data: AnalyticsData): string {
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

  // Générer un rapport PDF (simulation)
  async generatePDFReport(filters: AnalyticsFilters): Promise<Blob> {
    try {
      const data = await this.getAnalyticsData(filters);
      
      // Simuler la génération d'un PDF
      const reportContent = `
        Rapport Analytics - ${new Date().toLocaleDateString('fr-FR')}
        
        Métriques principales:
        ${data.metrics.map(m => `- ${m.name}: ${m.value}`).join('\n')}
        
        Produits les plus performants:
        ${data.topProducts.map(p => `- ${p.name}: ${p.conversions} conversions, ${p.revenue}€`).join('\n')}
      `;
      
      return new Blob([reportContent], { type: 'application/pdf' });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport PDF:', error);
      throw new Error('Impossible de générer le rapport PDF');
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService; 