import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
  userType?: string;
}

interface ErrorMetrics {
  endpoint: string;
  method: string;
  error: string;
  stack?: string;
  timestamp: string;
  userId?: string;
  userType?: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  databaseConnections: number;
  timestamp: string;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metricsBuffer: PerformanceMetrics[] = [];
  private errorBuffer: ErrorMetrics[] = [];
  private systemMetricsBuffer: SystemMetrics[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  private constructor() {
    this.startPeriodicFlush();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Enregistrer une métrique de performance
   */
  recordPerformance(metrics: PerformanceMetrics) {
    this.metricsBuffer.push(metrics);
    
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushPerformanceMetrics();
    }
  }

  /**
   * Enregistrer une erreur
   */
  recordError(error: ErrorMetrics) {
    this.errorBuffer.push(error);
    
    // Les erreurs sont importantes, on les flush immédiatement
    if (this.errorBuffer.length >= 10) {
      this.flushErrorMetrics();
    }
  }

  /**
   * Enregistrer des métriques système
   */
  recordSystemMetrics(metrics: SystemMetrics) {
    this.systemMetricsBuffer.push(metrics);
    
    if (this.systemMetricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushSystemMetrics();
    }
  }

  /**
   * Flush des métriques de performance
   */
  private async flushPerformanceMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      const { error } = await supabase
        .from('PerformanceMetrics')
        .insert(metrics);

      if (error) {
        logger.error('Erreur flush métriques performance:', error);
      } else {
        logger.info(`📊 ${metrics.length} métriques performance flushées`);
      }
    } catch (error) {
      logger.error('Erreur flush métriques performance:', error);
    }
  }

  /**
   * Flush des métriques d'erreur
   */
  private async flushErrorMetrics() {
    if (this.errorBuffer.length === 0) return;

    try {
      const errors = [...this.errorBuffer];
      this.errorBuffer = [];

      const { error } = await supabase
        .from('ErrorMetrics')
        .insert(errors);

      if (error) {
        logger.error('Erreur flush métriques erreur:', error);
      } else {
        logger.warn(`⚠️ ${errors.length} erreurs flushées`);
      }
    } catch (error) {
      logger.error('Erreur flush métriques erreur:', error);
    }
  }

  /**
   * Flush des métriques système
   */
  private async flushSystemMetrics() {
    if (this.systemMetricsBuffer.length === 0) return;

    try {
      const metrics = [...this.systemMetricsBuffer];
      this.systemMetricsBuffer = [];

      const { error } = await supabase
        .from('SystemMetrics')
        .insert(metrics);

      if (error) {
        logger.error('Erreur flush métriques système:', error);
      } else {
        logger.info(`🖥️ ${metrics.length} métriques système flushées`);
      }
    } catch (error) {
      logger.error('Erreur flush métriques système:', error);
    }
  }

  /**
   * Démarrer le flush périodique
   */
  private startPeriodicFlush() {
    setInterval(() => {
      this.flushPerformanceMetrics();
      this.flushErrorMetrics();
      this.flushSystemMetrics();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Obtenir les statistiques de performance
   */
  async getPerformanceStats(timeRange: string = '1h') {
    try {
      const { data, error } = await supabase
        .from('PerformanceMetrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString());

      if (error) throw error;

      return this.calculatePerformanceStats(data || []);
    } catch (error) {
      logger.error('Erreur récupération stats performance:', error);
      return null;
    }
  }

  /**
   * Obtenir les statistiques d'erreur
   */
  async getErrorStats(timeRange: string = '1h') {
    try {
      const { data, error } = await supabase
        .from('ErrorMetrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString());

      if (error) throw error;

      return this.calculateErrorStats(data || []);
    } catch (error) {
      logger.error('Erreur récupération stats erreur:', error);
      return null;
    }
  }

  /**
   * Obtenir les statistiques système
   */
  async getSystemStats(timeRange: string = '1h') {
    try {
      const { data, error } = await supabase
        .from('SystemMetrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return this.calculateSystemStats(data || []);
    } catch (error) {
      logger.error('Erreur récupération stats système:', error);
      return null;
    }
  }

  /**
   * Calculer les statistiques de performance
   */
  private calculatePerformanceStats(metrics: PerformanceMetrics[]) {
    if (metrics.length === 0) return null;

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const maxResponseTime = Math.max(...metrics.map(m => m.responseTime));
    const minResponseTime = Math.min(...metrics.map(m => m.responseTime));

    const statusCodes = metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const endpoints = metrics.reduce((acc, m) => {
      acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests: metrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      minResponseTime: Math.round(minResponseTime),
      statusCodes,
      topEndpoints: Object.entries(endpoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }

  /**
   * Calculer les statistiques d'erreur
   */
  private calculateErrorStats(errors: ErrorMetrics[]) {
    if (errors.length === 0) return null;

    const errorTypes = errors.reduce((acc, e) => {
      acc[e.error] = (acc[e.error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const endpoints = errors.reduce((acc, e) => {
      acc[e.endpoint] = (acc[e.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      errorTypes,
      topErrorEndpoints: Object.entries(endpoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }

  /**
   * Calculer les statistiques système
   */
  private calculateSystemStats(metrics: SystemMetrics[]) {
    if (metrics.length === 0) return null;

    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const avgConnections = metrics.reduce((sum, m) => sum + m.activeConnections, 0) / metrics.length;

    return {
      avgCpuUsage: Math.round(avgCpu * 100) / 100,
      avgMemoryUsage: Math.round(avgMemory * 100) / 100,
      avgActiveConnections: Math.round(avgConnections),
      maxCpuUsage: Math.max(...metrics.map(m => m.cpuUsage)),
      maxMemoryUsage: Math.max(...metrics.map(m => m.memoryUsage)),
      maxConnections: Math.max(...metrics.map(m => m.activeConnections))
    };
  }

  /**
   * Convertir une plage de temps en millisecondes
   */
  private getTimeRangeMs(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // 1h par défaut
    }
  }

  /**
   * Créer une alerte
   */
  async createAlert(type: 'performance' | 'error' | 'system', message: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    try {
      const { error } = await supabase
        .from('Alerts')
        .insert({
          type,
          message,
          severity,
          timestamp: new Date().toISOString()
        });

      if (error) {
        logger.error('Erreur création alerte:', error);
      } else {
        logger.warn(`🚨 Alerte créée: ${message}`);
      }
    } catch (error) {
      logger.error('Erreur création alerte:', error);
    }
  }

  /**
   * Vérifier les seuils et créer des alertes automatiques
   */
  async checkThresholds() {
    const performanceStats = await this.getPerformanceStats('15m');
    const errorStats = await this.getErrorStats('15m');
    const systemStats = await this.getSystemStats('15m');

    // Seuils de performance
    if (performanceStats && performanceStats.avgResponseTime > 2000) {
      await this.createAlert('performance', `Temps de réponse élevé: ${performanceStats.avgResponseTime}ms`, 'high');
    }

    // Seuils d'erreur
    if (errorStats && errorStats.totalErrors > 10) {
      await this.createAlert('error', `${errorStats.totalErrors} erreurs détectées`, 'high');
    }

    // Seuils système
    if (systemStats && systemStats.avgCpuUsage > 80) {
      await this.createAlert('system', `Utilisation CPU élevée: ${systemStats.avgCpuUsage}%`, 'medium');
    }

    if (systemStats && systemStats.avgMemoryUsage > 85) {
      await this.createAlert('system', `Utilisation mémoire élevée: ${systemStats.avgMemoryUsage}%`, 'high');
    }
  }
} 