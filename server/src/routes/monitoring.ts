import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { monitoringSystem } from '../lib/monitoring-system';
import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'child_process';
import path from 'path';
import os from 'os';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gestion du serveur partagé (processus enfant)
let sharedServerProcess: any = null;

// Fonction pour obtenir l'adresse IP locale
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface_ of interfaces[name]!) {
            if (interface_.family === 'IPv4' && !interface_.internal) {
                return interface_.address;
            }
        }
    }
    return '[::1]';
}

/**
 * GET /api/monitoring/health - Test de santé complet
 */
router.get('/health', asyncHandler(async (req, res) => {
    const healthChecks = await monitoringSystem.performHealthCheck();
    
    const overallStatus = healthChecks.every(check => check.status === 'pass') ? 'healthy' : 'unhealthy';
    
    res.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks: healthChecks,
        summary: {
            total: healthChecks.length,
            passed: healthChecks.filter(c => c.status === 'pass').length,
            failed: healthChecks.filter(c => c.status === 'fail').length,
            warnings: healthChecks.filter(c => c.status === 'warning').length
        }
    });
}));

/**
 * GET /api/monitoring/metrics - Métriques système récentes
 */
router.get('/metrics', asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours as string) || 24;
    const metrics = await monitoringSystem.getRecentMetrics(hours);
    
    // Grouper par type de métrique
    const groupedMetrics = metrics.reduce((acc, metric) => {
        if (!acc[metric.metric_type]) {
            acc[metric.metric_type] = [];
        }
        acc[metric.metric_type].push(metric);
        return acc;
    }, {} as any);
    
    // Calculer les moyennes par type
    const averages = Object.entries(groupedMetrics).map(([type, metricsList]: [string, any]) => {
        const avg = metricsList.reduce((sum: number, m: any) => sum + m.metric_value, 0) / metricsList.length;
        return {
            type,
            average: Math.round(avg * 100) / 100,
            count: metricsList.length,
            latest: metricsList[0]
        };
    });
    
    res.json({
        metrics: groupedMetrics,
        averages,
        summary: {
            total_metrics: metrics.length,
            time_range_hours: hours,
            metric_types: Object.keys(groupedMetrics)
        }
    });
}));

/**
 * GET /api/monitoring/alerts - Alertes actives
 */
router.get('/alerts', asyncHandler(async (req, res) => {
    const alerts = await monitoringSystem.getActiveAlerts();
    
    res.json({
        alerts,
        summary: {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            error: alerts.filter(a => a.severity === 'error').length,
            warning: alerts.filter(a => a.severity === 'warning').length,
            info: alerts.filter(a => a.severity === 'info').length
        }
    });
}));

/**
 * GET /api/monitoring/dashboard - Données pour le dashboard de monitoring
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
    // Récupérer toutes les données nécessaires
    const [metrics, alerts, incidents, vulnerabilities, healthChecks] = await Promise.all([
        monitoringSystem.getRecentMetrics(1), // Dernière heure
        monitoringSystem.getActiveAlerts(),
        supabase.from('security_incidents').select('*').order('timestamp', { ascending: false }).limit(10),
        supabase.from('security_vulnerabilities').select('*').order('timestamp', { ascending: false }).limit(10),
        supabase.from('health_checks').select('*').order('timestamp', { ascending: false }).limit(20)
    ]);

    // Récupérer les logs d'audit
    const [systemLogs, isoReports, terminalLogs] = await Promise.all([
        monitoringSystem.getAuditLogs(24), // 24 dernières heures
        monitoringSystem.getISOReports(24),
        monitoringSystem.getTerminalLogs(24)
    ]);
    
    // Calculer les métriques système actuelles
    const currentMetrics = metrics.reduce((acc, metric) => {
        if (!acc[metric.metric_type]) {
            acc[metric.metric_type] = [];
        }
        acc[metric.metric_type].push(metric);
        return acc;
    }, {} as any);
    
    const systemStatus = {
        cpu: currentMetrics.cpu?.[0]?.metric_value || 0,
        memory: currentMetrics.memory?.[0]?.metric_value || 0,
        disk: currentMetrics.disk?.[0]?.metric_value || 0,
        network: currentMetrics.network?.[0]?.metric_value || 0
    };
    
    // Calculer le statut global
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const openIncidents = incidents.data?.filter(i => i.status === 'open').length || 0;
    const criticalVulnerabilities = vulnerabilities.data?.filter(v => v.severity === 'critical' && v.status === 'open').length || 0;
    
    const overallStatus = criticalAlerts > 0 || openIncidents > 0 || criticalVulnerabilities > 0 ? 'critical' : 'healthy';
    
    res.json({
        overall_status: overallStatus,
        system_metrics: systemStatus,
        alerts: {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            error: alerts.filter(a => a.severity === 'error').length,
            warning: alerts.filter(a => a.severity === 'warning').length
        },
        incidents: {
            total: incidents.data?.length || 0,
            open: incidents.data?.filter(i => i.status === 'open').length || 0,
            critical: incidents.data?.filter(i => i.severity === 'critical').length || 0
        },
        vulnerabilities: {
            total: vulnerabilities.data?.length || 0,
            open: vulnerabilities.data?.filter(v => v.status === 'open').length || 0,
            critical: vulnerabilities.data?.filter(v => v.severity === 'critical').length || 0
        },
        health_checks: {
            total: healthChecks.data?.length || 0,
            passed: healthChecks.data?.filter(h => h.status === 'pass').length || 0,
            failed: healthChecks.data?.filter(h => h.status === 'fail').length || 0,
            warning: healthChecks.data?.filter(h => h.status === 'warning').length || 0
        },
        recent_data: {
            metrics: metrics.slice(0, 10),
            alerts: alerts.slice(0, 10),
            incidents: incidents.data?.slice(0, 5) || [],
            vulnerabilities: vulnerabilities.data?.slice(0, 5) || []
        },
        audit_logs: {
            system_logs: systemLogs || [],
            iso_reports: isoReports || [],
            terminal_logs: terminalLogs || []
        }
    });
}));

/**
 * POST /api/monitoring/logs/refresh - Relance les tests et recharge les logs
 */
router.post('/logs/refresh', asyncHandler(async (req, res) => {
    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.resolve(__dirname, '../../scripts/insert_test_audit_logs.js');

    // Exécuter le script d'insertion de logs de test
    await new Promise((resolve, reject) => {
        exec(`node ${scriptPath}`, (error: any, stdout: string, stderr: string) => {
            if (error) {
                console.error('Erreur lors de l\'insertion des logs de test:', error);
                return reject(error);
            }
            if (stderr) {
                console.error('stderr:', stderr);
            }
            console.log('stdout:', stdout);
            resolve(true);
        });
    });

    // Récupérer les logs à jour
    const [systemLogs, isoReports, terminalLogs] = await Promise.all([
        monitoringSystem.getAuditLogs(24),
        monitoringSystem.getISOReports(24),
        monitoringSystem.getTerminalLogs(24)
    ]);

    res.json({
        success: true,
        audit_logs: {
            system_logs: systemLogs || [],
            iso_reports: isoReports || [],
            terminal_logs: terminalLogs || []
        }
    });
}));

// GET /api/monitoring/network-server/status
router.get('/network-server/status', (req, res) => {
    const isRunning = !!sharedServerProcess && !sharedServerProcess.killed;
    const ip = isRunning ? getLocalIP() + ':4000' : ''; // Adresse IP du serveur partagé
    res.json({
        on: isRunning,
        ip: ip,
        message: isRunning ? 'Serveur partagé actif' : 'Serveur partagé arrêté'
    });
});

// POST /api/monitoring/network-server/on
router.post('/network-server/on', (req, res) => {
    if (sharedServerProcess && !sharedServerProcess.killed) {
        return res.json({ 
            on: true, 
            ip: getLocalIP() + ':4000',
            message: 'Serveur déjà actif' 
        });
    }
    const scriptPath = path.resolve(process.cwd(), 'shared-network-server.js');
    sharedServerProcess = spawn('node', [scriptPath], {
        detached: true,
        stdio: 'ignore'
    });
    sharedServerProcess.unref();
    res.json({ 
        on: true, 
        ip: getLocalIP() + ':4000',
        message: 'Serveur partagé démarré' 
    });
});

// POST /api/monitoring/network-server/off
router.post('/network-server/off', (req, res) => {
    if (sharedServerProcess && !sharedServerProcess.killed) {
        try {
            process.kill(sharedServerProcess.pid, 'SIGTERM');
            sharedServerProcess = null;
            res.json({ on: false, ip: '', message: 'Serveur partagé arrêté' });
        } catch (e) {
            res.status(500).json({ on: true, ip: getLocalIP() + ':4000', message: 'Erreur lors de l\'arrêt du serveur partagé' });
        }
    } else {
        // Tentative d'arrêt d'un éventuel process zombie
        try {
            execSync("pkill -f shared-network-server.js");
        } catch {}
        res.json({ on: false, ip: '', message: 'Serveur déjà arrêté' });
    }
});

export default router;
