import { createClient } from '@supabase/supabase-js';
import os from 'os';
import { performance } from 'perf_hooks';

/**
 * Système de Monitoring et Observabilité
 * Collecte et gère toutes les métriques de la plateforme
 */

export interface SystemMetric {
    metric_type: 'cpu' | 'memory' | 'disk' | 'network' | 'response_time' | 'error_rate';
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    service_name: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    metadata?: any;
}

export interface HealthCheck {
    check_name: string;
    check_type: 'connectivity' | 'database' | 'api' | 'security' | 'performance';
    status: 'pass' | 'fail' | 'warning';
    response_time_ms?: number;
    error_message?: string;
    details?: any;
}

export interface SecurityIncident {
    incident_type: 'security_breach' | 'data_leak' | 'unauthorized_access' | 'system_failure';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    affected_service?: string;
    impact_assessment?: string;
    mitigation_steps?: string;
}

export interface PerformanceTest {
    test_name: string;
    test_type: 'load' | 'stress' | 'endurance' | 'spike';
    endpoint: string;
    method: string;
    status: 'pass' | 'fail' | 'warning';
    response_time_avg: number;
    response_time_p95: number;
    response_time_p99: number;
    requests_per_second: number;
    error_rate: number;
    total_requests: number;
    failed_requests: number;
    test_duration_seconds: number;
}

export class MonitoringSystem {
    private supabase: any;
    private metricsBuffer: SystemMetric[] = [];
    private bufferSize = 10;
    private flushInterval = 30000; // 30 secondes
    private isRunning = false;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
        this.startPeriodicCollection();
    }

    /**
     * Démarre la collecte périodique des métriques
     */
    private startPeriodicCollection(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Collecte des métriques système toutes les 30 secondes
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Collecte des métriques de performance toutes les minutes
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000);

        // Flush du buffer toutes les 30 secondes
        setInterval(() => {
            this.flushMetricsBuffer();
        }, this.flushInterval);

        console.log('🔍 Système de monitoring démarré');
    }

    /**
     * Collecte les métriques système
     */
    private async collectSystemMetrics(): Promise<void> {
        try {
            const metrics: SystemMetric[] = [];

            // CPU Usage
            const loadAvg = os.loadavg()[0]; // 1 minute average
            const cpuCores = os.cpus().length;
            const cpuUsage = Math.min((loadAvg / cpuCores) * 100, 100); // Normaliser par nombre de cœurs
            
            metrics.push({
                metric_type: 'cpu',
                metric_name: 'cpu_usage_percent',
                metric_value: Math.round(cpuUsage * 100) / 100,
                metric_unit: 'percent',
                service_name: 'system',
                severity: cpuUsage > 80 ? 'warning' : 'info'
            });

            // Memory Usage
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memoryUsage = (usedMem / totalMem) * 100;
            
            metrics.push({
                metric_type: 'memory',
                metric_name: 'memory_usage_percent',
                metric_value: Math.round(memoryUsage * 100) / 100,
                metric_unit: 'percent',
                service_name: 'system',
                severity: memoryUsage > 85 ? 'warning' : 'info'
            });

            // Disk Usage (simulation)
            const diskUsage = Math.random() * 30 + 50; // 50-80%
            metrics.push({
                metric_type: 'disk',
                metric_name: 'disk_usage_percent',
                metric_value: Math.round(diskUsage * 100) / 100,
                metric_unit: 'percent',
                service_name: 'system',
                severity: diskUsage > 80 ? 'warning' : 'info'
            });

            // Network (simulation)
            const networkLatency = Math.random() * 50 + 10; // 10-60ms
            metrics.push({
                metric_type: 'network',
                metric_name: 'network_latency_ms',
                metric_value: Math.round(networkLatency * 100) / 100,
                metric_unit: 'ms',
                service_name: 'network',
                severity: networkLatency > 100 ? 'warning' : 'info'
            });

            // Ajouter au buffer
            this.metricsBuffer.push(...metrics);

        } catch (error) {
            console.error('Erreur lors de la collecte des métriques système:', error);
        }
    }

    /**
     * Collecte les métriques de performance
     */
    private async collectPerformanceMetrics(): Promise<void> {
        try {
            // Test de performance de l'API
            const startTime = performance.now();
            
            // Test de connectivité à la base de données
            const dbStartTime = performance.now();
            const { data: dbTest } = await this.supabase
                .from('Client')
                .select('count', { count: 'exact', head: true });
            const dbResponseTime = performance.now() - dbStartTime;

            const totalResponseTime = performance.now() - startTime;

            const metrics: SystemMetric[] = [
                {
                    metric_type: 'response_time',
                    metric_name: 'api_response_time_ms',
                    metric_value: Math.round(totalResponseTime * 100) / 100,
                    metric_unit: 'ms',
                    service_name: 'api',
                    severity: totalResponseTime > 1000 ? 'warning' : 'info'
                },
                {
                    metric_type: 'response_time',
                    metric_name: 'database_response_time_ms',
                    metric_value: Math.round(dbResponseTime * 100) / 100,
                    metric_unit: 'ms',
                    service_name: 'database',
                    severity: dbResponseTime > 500 ? 'warning' : 'info'
                }
            ];

            this.metricsBuffer.push(...metrics);

        } catch (error) {
            console.error('Erreur lors de la collecte des métriques de performance:', error);
            
            // Enregistrer l'erreur comme métrique
            this.metricsBuffer.push({
                metric_type: 'error_rate',
                metric_name: 'performance_collection_error',
                metric_value: 1,
                metric_unit: 'count',
                service_name: 'monitoring',
                severity: 'error',
                metadata: { error: error instanceof Error ? error.message : String(error) }
            });
        }
    }

    /**
     * Vide le buffer de métriques vers la base de données
     */
    private async flushMetricsBuffer(): Promise<void> {
        if (this.metricsBuffer.length === 0) return;

        try {
            const metricsToFlush = [...this.metricsBuffer];
            this.metricsBuffer = [];

            const { error } = await this.supabase
                .from('system_metrics')
                .insert(metricsToFlush);

            if (error) {
                console.error('Erreur lors de l\'insertion des métriques:', error);
                // Remettre les métriques dans le buffer en cas d'erreur
                this.metricsBuffer.unshift(...metricsToFlush);
            } else {
                console.log(`📊 ${metricsToFlush.length} métriques envoyées à la base de données`);
            }

        } catch (error) {
            console.error('Erreur lors du flush des métriques:', error);
            // Remettre les métriques dans le buffer en cas d'erreur
            this.metricsBuffer.unshift(...this.metricsBuffer);
        }
    }

    /**
     * Effectue un test de santé complet
     */
    async performHealthCheck(): Promise<HealthCheck[]> {
        const checks: HealthCheck[] = [];
        const startTime = performance.now();

        try {
            // Test de connectivité à la base de données
            const dbStartTime = performance.now();
            const { data: dbTest, error: dbError } = await this.supabase
                .from('Client')
                .select('count', { count: 'exact', head: true });
            
            const dbResponseTime = performance.now() - dbStartTime;
            
            checks.push({
                check_name: 'Database Connectivity',
                check_type: 'database',
                status: dbError ? 'fail' : 'pass',
                response_time_ms: Math.round(dbResponseTime),
                error_message: dbError?.message,
                details: { table: 'Client', operation: 'count' }
            });

            // Test de l'API
            const apiStartTime = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const apiResponse = await fetch('http://[::1]:5001/api/health', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const apiResponseTime = performance.now() - apiStartTime;

            checks.push({
                check_name: 'API Health',
                check_type: 'api',
                status: apiResponse.ok ? 'pass' : 'fail',
                response_time_ms: Math.round(apiResponseTime),
                error_message: apiResponse.ok ? undefined : `HTTP ${apiResponse.status}`,
                details: { endpoint: '/api/health', status_code: apiResponse.status }
            });

            // Test de sécurité (vérification des headers)
            const securityStartTime = performance.now();
            const securityHeaders = apiResponse.headers;
            const hasSecurityHeaders = securityHeaders.get('x-content-type-options') === 'nosniff' &&
                                     securityHeaders.get('x-frame-options') === 'DENY';
            const securityResponseTime = performance.now() - securityStartTime;

            checks.push({
                check_name: 'Security Headers',
                check_type: 'security',
                status: hasSecurityHeaders ? 'pass' : 'warning',
                response_time_ms: Math.round(securityResponseTime),
                error_message: hasSecurityHeaders ? undefined : 'Security headers manquants',
                details: { 
                    x_content_type_options: securityHeaders.get('x-content-type-options'),
                    x_frame_options: securityHeaders.get('x-frame-options')
                }
            });

            // Test de performance
            const totalResponseTime = performance.now() - startTime;
            checks.push({
                check_name: 'Overall Performance',
                check_type: 'performance',
                status: totalResponseTime < 2000 ? 'pass' : totalResponseTime < 5000 ? 'warning' : 'fail',
                response_time_ms: Math.round(totalResponseTime),
                details: { total_checks: checks.length }
            });

        } catch (error) {
            checks.push({
                check_name: 'Health Check Error',
                check_type: 'connectivity',
                status: 'fail',
                error_message: error instanceof Error ? error.message : String(error),
                details: { error: error instanceof Error ? error.toString() : String(error) }
            });
        }

        // Sauvegarder les résultats
        await this.saveHealthChecks(checks);

        return checks;
    }

    /**
     * Sauvegarde les résultats des tests de santé
     */
    private async saveHealthChecks(checks: HealthCheck[]): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('health_checks')
                .insert(checks);

            if (error) {
                console.error('Erreur lors de la sauvegarde des tests de santé:', error);
            } else {
                console.log(`✅ ${checks.length} tests de santé sauvegardés`);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des tests de santé:', error);
        }
    }

    /**
     * Enregistre un incident de sécurité
     */
    async recordSecurityIncident(incident: SecurityIncident): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('security_incidents')
                .insert([incident]);

            if (error) {
                console.error('Erreur lors de l\'enregistrement de l\'incident:', error);
            } else {
                console.log(`🚨 Incident de sécurité enregistré: ${incident.title}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'incident:', error);
        }
    }

    /**
     * Enregistre un test de performance
     */
    async recordPerformanceTest(test: PerformanceTest): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('performance_tests')
                .insert([test]);

            if (error) {
                console.error('Erreur lors de l\'enregistrement du test de performance:', error);
            } else {
                console.log(`⚡ Test de performance enregistré: ${test.test_name}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du test de performance:', error);
        }
    }

    /**
     * Enregistre un log d'audit système
     */
    async recordAuditLog(log: {
        level: 'info' | 'warning' | 'error' | 'critical';
        category: 'security' | 'performance' | 'database' | 'api' | 'user_action' | 'system';
        message: string;
        details?: any;
        user_id?: string;
        user_email?: string;
        ip_address?: string;
        resource_type?: string;
        resource_id?: string;
        success?: boolean;
    }): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('audit_logs')
                .insert({
                    level: log.level,
                    category: log.category,
                    message: log.message,
                    details: log.details,
                    user_id: log.user_id,
                    user_email: log.user_email,
                    ip_address: log.ip_address,
                    resource_type: log.resource_type,
                    resource_id: log.resource_id,
                    success: log.success
                });

            if (error) {
                console.error('Erreur enregistrement log audit:', error);
            }
        } catch (error) {
            console.error('Erreur recordAuditLog:', error);
        }
    }

    /**
     * Enregistre un rapport ISO
     */
    async recordISOReport(report: {
        script_name: string;
        status: 'success' | 'warning' | 'error' | 'running';
        duration_ms: number;
        output?: string;
        error_output?: string;
        exit_code?: number;
        metadata?: any;
    }): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('iso_reports')
                .insert({
                    script_name: report.script_name,
                    status: report.status,
                    duration_ms: report.duration_ms,
                    output: report.output,
                    error_output: report.error_output,
                    exit_code: report.exit_code,
                    metadata: report.metadata
                });

            if (error) {
                console.error('Erreur enregistrement rapport ISO:', error);
            }
        } catch (error) {
            console.error('Erreur recordISOReport:', error);
        }
    }

    /**
     * Enregistre un log terminal
     */
    async recordTerminalLog(log: {
        command: string;
        output?: string;
        error_output?: string;
        exit_code: number;
        duration_ms: number;
        user: string;
        working_directory: string;
    }): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('terminal_logs')
                .insert({
                    command: log.command,
                    output: log.output,
                    error_output: log.error_output,
                    exit_code: log.exit_code,
                    duration_ms: log.duration_ms,
                    user: log.user,
                    working_directory: log.working_directory
                });

            if (error) {
                console.error('Erreur enregistrement log terminal:', error);
            }
        } catch (error) {
            console.error('Erreur recordTerminalLog:', error);
        }
    }

    /**
     * Obtient les métriques récentes
     */
    async getRecentMetrics(hours: number = 24): Promise<any[]> {
        try {
            const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            
            const { data, error } = await this.supabase
                .from('system_metrics')
                .select('*')
                .gte('timestamp', cutoffTime.toISOString())
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Erreur lors de la récupération des métriques:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des métriques:', error);
            return [];
        }
    }

    /**
     * Obtient les alertes actives
     */
    async getActiveAlerts(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('system_alerts')
                .select('*')
                .eq('status', 'active')
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Erreur lors de la récupération des alertes:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des alertes:', error);
            return [];
        }
    }

    /**
     * Arrête le système de monitoring
     */
    stop(): void {
        this.isRunning = false;
        this.flushMetricsBuffer();
        console.log('🛑 Système de monitoring arrêté');
    }

    /**
     * Récupère les logs d'audit système récents
     */
    async getAuditLogs(hours: number = 24): Promise<any[]> {
        try {
            const { data: logs, error } = await this.supabase
                .from('audit_logs')
                .select('*')
                .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
                .order('timestamp', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Erreur récupération logs audit:', error);
                return [];
            }

            return logs || [];
        } catch (error) {
            console.error('Erreur getAuditLogs:', error);
            return [];
        }
    }

    /**
     * Récupère les rapports ISO récents
     */
    async getISOReports(hours: number = 24): Promise<any[]> {
        try {
            const { data: reports, error } = await this.supabase
                .from('iso_reports')
                .select('*')
                .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
                .order('timestamp', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Erreur récupération rapports ISO:', error);
                return [];
            }

            return reports || [];
        } catch (error) {
            console.error('Erreur getISOReports:', error);
            return [];
        }
    }

    /**
     * Récupère les logs terminal récents
     */
    async getTerminalLogs(hours: number = 24): Promise<any[]> {
        try {
            const { data: logs, error } = await this.supabase
                .from('terminal_logs')
                .select('*')
                .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
                .order('timestamp', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Erreur récupération logs terminal:', error);
                return [];
            }

            return logs || [];
        } catch (error) {
            console.error('Erreur getTerminalLogs:', error);
            return [];
        }
    }
}

// Export d'une instance par défaut
export const monitoringSystem = new MonitoringSystem();
