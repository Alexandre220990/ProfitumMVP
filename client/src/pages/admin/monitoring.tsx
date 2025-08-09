import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertTriangle, Clock, Cpu, HardDrive, Network, RefreshCw, Shield, Eye, Server, Wifi, Database, Lock, Bug, Terminal, Code, User, ChevronUp, CheckCircle, FileText, Zap, Copy, Search, Download, Calendar, ChevronDown } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';

// Configuration Supabase - Utilise l'instance importée depuis @/lib/supabase

interface MonitoringData {
    overall_status: 'healthy' | 'warning' | 'critical';
    system_metrics: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
    alerts: {
        total: number;
        critical: number;
        error: number;
        warning: number;
    };
    incidents: {
        total: number;
        open: number;
        critical: number;
    };
    vulnerabilities: {
        total: number;
        open: number;
        critical: number;
    };
    health_checks: {
        total: number;
        passed: number;
        failed: number;
        warning: number;
    };
    recent_data: {
        metrics: any[];
        alerts: any[];
        incidents: any[];
        vulnerabilities: any[];
    };
    audit_logs: {
        system_logs: AuditLog[];
        iso_reports: ISOReport[];
        terminal_logs: TerminalLog[];
    };
}

interface AuditLog {
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    category: 'security' | 'performance' | 'database' | 'api' | 'user_action' | 'system';
    message: string;
    details?: any;
    user_id?: string;
    user_email?: string;
    ip_address?: string;
    resource_type?: string;
    resource_id?: string;
    success: boolean;
}

interface ISOReport {
    id: string;
    timestamp: string;
    script_name: string;
    status: 'success' | 'warning' | 'error' | 'running';
    duration_ms: number;
    output: string;
    error_output?: string;
    exit_code: number;
    metadata?: any;
}

interface TerminalLog {
    id: string;
    timestamp: string;
    command: string;
    output: string;
    error_output?: string;
    exit_code: number;
    duration_ms: number;
    user: string;
    working_directory: string;
} 

const MonitoringPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isLoading: authLoading } = useAuth();
    const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    
    // États pour les logs
    const [activeLogTab, setActiveLogTab] = useState<'system' | 'iso' | 'terminal'>('system');
    const [logFilter, setLogFilter] = useState({ level: 'all', category: 'all', search: '', dateRange: '24h' });
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [networkServerOn, setNetworkServerOn] = useState<boolean>(false);
    const [networkServerLoading, setNetworkServerLoading] = useState<boolean>(false);
    const [networkServerIp, setNetworkServerIp] = useState<string>('');

    // Vérification d'authentification
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/connect-admin" replace />;
    }

    if (user.type !== 'admin') {
        return <Navigate to="/connect-admin" replace />;
    }

    // Charger les données de monitoring
    const fetchMonitoringData = async () => {
        try {
            const response = await get('/monitoring/dashboard');
            
            if (response.success && response.data) {
                setMonitoringData(response.data as any);
                setLastUpdate(new Date());
            } else {
                throw new Error('Erreur lors du chargement des données de monitoring');
            }
        } catch (err) {
            setError('Erreur lors du chargement du monitoring');
            console.error('Erreur monitoring: ', err);
        } finally {
            setLoading(false);
        }
    };

    // Vérifier l'état du serveur partagé
    const fetchNetworkServerStatus = async () => {
        try {
            setNetworkServerLoading(true);
            
            const response = await get('/monitoring/network-server/status');
            
            if (response.success && response.data) {
                const data = response.data as any;
                setNetworkServerOn(data.on === true);
                setNetworkServerIp(data.ip || '');
            } else {
                setNetworkServerOn(false);
            }
        } catch (e) {
            setNetworkServerOn(false);
            console.error('Erreur fetchNetworkServerStatus: ', e);
        } finally {
            setNetworkServerLoading(false);
        }
    };

    // Changer l'état du serveur partagé
    const toggleNetworkServer = async () => {
        setNetworkServerLoading(true);
        try {
            const url = networkServerOn
                ? '/monitoring/network-server/off'
                : '/monitoring/network-server/on';
                
            const response = await fetch(`https://profitummvp-production.up.railway.app${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors du changement d\'état');
            }
            
            const data = await response.json();
            setNetworkServerOn(data.on === true);
            setNetworkServerIp(data.ip || '');
            toast({
                title: data.on ? 'Serveur partagé activé' : 'Serveur partagé désactivé',
                description: data.message || ''
            });
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de changer l\'état du serveur partagé'
            });
        } finally {
            setNetworkServerLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitoringData();
        fetchNetworkServerStatus();
        
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(fetchMonitoringData, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'critical': return <AlertTriangle className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    // Fonctions utilitaires pour les logs
    const getLogLevelColor = (level: string) => {
        switch (level) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'error': return 'text-orange-600 bg-orange-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'info': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getLogLevelIcon = (level: string) => {
        switch (level) {
            case 'critical': return <AlertTriangle className="w-4 h-4" />;
            case 'error': return <AlertTriangle className="w-4 h-4" />;
            case 'warning': return <AlertTriangle className="w-4 h-4" />;
            case 'info': return <CheckCircle className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const toggleLogExpansion = (logId: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedLogs(newExpanded);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Optionnel: afficher une notification
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }; 

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du monitoring...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchMonitoringData}>Réessayer</Button>
                </div>
            </div>
        );
    } 

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                                <div className="w-6 h-4 bg-red-600 rounded"></div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Monitoring & Observabilité</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Dernière mise à jour: </span>
                                <span className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchMonitoringData}
                                className="flex items-center space-x-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Actualiser
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate('/admin/dashboard-optimized')}
                            >
                                ← Retour au Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-6">
                {/* Statut Global */}
                <Card className="mb-6 bg-white shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Statut Global de la Plateforme
                            </CardTitle>
                            <Badge className={`${getStatusColor(monitoringData?.overall_status || 'unknown')} px-3 py-1`}>
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(monitoringData?.overall_status || 'unknown')}
                                    <span className="capitalize">{monitoringData?.overall_status || 'unknown'}</span>
                                </div>
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Serveur Partagé - Centré */}
                        <div className="flex justify-center">
                            <div className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-lg border">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={networkServerOn}
                                        onCheckedChange={toggleNetworkServer}
                                        disabled={networkServerLoading}
                                        id="network-server-switch"
                                    />
                                    <span className={`text-sm font-medium ${networkServerOn ? 'text-green-600' : 'text-gray-500'}`}>
                                        Serveur partagé {networkServerOn ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                {networkServerOn && networkServerIp && (
                                    <div className="flex items-center space-x-2">
                                        <Wifi className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-600">IP: </span>
                                        <code className="text-sm bg-white px-2 py-1 rounded border font-mono text-green-700">
                                            {networkServerIp}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(networkServerIp);
                                                toast({
                                                    title: 'Adresse IP copiée',
                                                    description: 'L\'adresse IP a été copiée dans le presse-papiers'
                                                });
                                            }}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Métriques Système */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">CPU</CardTitle>
                            <Cpu className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {monitoringData?.system_metrics.cpu.toFixed(1)}%
                            </div>
                            <Progress 
                                value={monitoringData?.system_metrics.cpu || 0} 
                                className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Utilisation processeur (% par cœur)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Mémoire</CardTitle>
                            <Activity className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {monitoringData?.system_metrics.memory.toFixed(1)}%
                            </div>
                            <Progress 
                                value={monitoringData?.system_metrics.memory || 0} 
                                className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Utilisation mémoire
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Disque</CardTitle>
                            <HardDrive className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {monitoringData?.system_metrics.disk.toFixed(1)}%
                            </div>
                            <Progress 
                                value={monitoringData?.system_metrics.disk || 0} 
                                className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Utilisation disque
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Réseau</CardTitle>
                            <Network className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {monitoringData?.system_metrics.network.toFixed(1)}ms
                            </div>
                            <div className="mt-2 h-2 bg-gray-200 rounded-full">
                                <div 
                                    className="h-2 bg-orange-600 rounded-full" 
                                    style={{ width: `${Math.min((monitoringData?.system_metrics.network || 0) / 100 * 10, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Latence réseau
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Onglets de Monitoring */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview" className="flex items-center space-x-2">
                            <Eye className="w-4 h-4" />
                            <span>Vue d'ensemble</span>
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Alertes</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>Sécurité</span>
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>Performance</span>
                        </TabsTrigger>
                        <TabsTrigger value="health" className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Santé</span>
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Logs</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Vue d'ensemble */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Alertes */}
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        <span>Alertes Actives</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total</span>
                                            <Badge variant="outline">{monitoringData?.alerts.total || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-red-600">Critiques</span>
                                            <Badge variant="destructive">{monitoringData?.alerts.critical || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-600">Erreurs</span>
                                            <Badge variant="secondary">{monitoringData?.alerts.error || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-yellow-600">Avertissements</span>
                                            <Badge variant="outline">{monitoringData?.alerts.warning || 0}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Incidents de Sécurité */}
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                        <Shield className="w-5 h-5 text-red-500" />
                                        <span>Incidents de Sécurité</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total</span>
                                            <Badge variant="outline">{monitoringData?.incidents.total || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-red-600">Ouverts</span>
                                            <Badge variant="destructive">{monitoringData?.incidents.open || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-600">Critiques</span>
                                            <Badge variant="secondary">{monitoringData?.incidents.critical || 0}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Vulnérabilités */}
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                        <Bug className="w-5 h-5 text-purple-500" />
                                        <span>Vulnérabilités</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total</span>
                                            <Badge variant="outline">{monitoringData?.vulnerabilities.total || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-red-600">Ouvertes</span>
                                            <Badge variant="destructive">{monitoringData?.vulnerabilities.open || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-600">Critiques</span>
                                            <Badge variant="secondary">{monitoringData?.vulnerabilities.critical || 0}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tests de Santé */}
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Tests de Santé</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total</span>
                                            <Badge variant="outline">{monitoringData?.health_checks.total || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-green-600">Réussis</span>
                                            <Badge variant="default">{monitoringData?.health_checks.passed || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-red-600">Échoués</span>
                                            <Badge variant="destructive">{monitoringData?.health_checks.failed || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-yellow-600">Avertissements</span>
                                            <Badge variant="secondary">{monitoringData?.health_checks.warning || 0}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Alertes */}
                    <TabsContent value="alerts" className="space-y-6">
                        <Card className="bg-white shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">Alertes Système</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {monitoringData?.recent_data.alerts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                        <p className="text-gray-600">Aucune alerte active</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {monitoringData?.recent_data.alerts.map((alert, index) => (
                                            <Alert key={index} className={`border-l-4 ${
                                                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                                                alert.severity === 'error' ? 'border-orange-500 bg-orange-50' :
                                                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                                                'border-blue-500 bg-blue-50'}`}>
                                                <AlertTriangle className="w-4 h-4" />
                                                <AlertDescription>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{alert.title}</p>
                                                            <p className="text-sm text-gray-600">{alert.message}</p>
                                                        </div>
                                                        <Badge className={`${
                                                            alert.severity === 'critical' ? 'bg-red-500' :
                                                            alert.severity === 'error' ? 'bg-orange-500' :
                                                            alert.severity === 'warning' ? 'bg-yellow-500' :
                                                            'bg-blue-500'}`}>
                                                            {alert.severity}
                                                        </Badge>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sécurité */}
                    <TabsContent value="security" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Incidents Récents */}
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">Incidents Récents</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {monitoringData?.recent_data.incidents.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                            <p className="text-gray-600">Aucun incident récent</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {monitoringData?.recent_data.incidents.map((incident, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium">{incident.title}</h4>
                                                        <Badge className={`${
                                                            incident.severity === 'critical' ? 'bg-red-500' :
                                                            incident.severity === 'high' ? 'bg-orange-500' :
                                                            incident.severity === 'medium' ? 'bg-yellow-500' :
                                                            'bg-blue-500'}`}>
                                                            {incident.severity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>{incident.incident_type}</span>
                                                        <span>{new Date(incident.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Vulnérabilités Récentes */}
                            <Card className="bg-white shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">Vulnérabilités Récentes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {monitoringData?.recent_data.vulnerabilities.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Bug className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                            <p className="text-gray-600">Aucune vulnérabilité détectée</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {monitoringData?.recent_data.vulnerabilities.map((vuln, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium">{vuln.title}</h4>
                                                        <Badge className={`${
                                                            vuln.severity === 'critical' ? 'bg-red-500' :
                                                            vuln.severity === 'high' ? 'bg-orange-500' :
                                                            vuln.severity === 'medium' ? 'bg-yellow-500' :
                                                            'bg-blue-500'}`}>
                                                            {vuln.severity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>{vuln.vulnerability_type}</span>
                                                        <span>{new Date(vuln.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Performance */}
                    <TabsContent value="performance" className="space-y-6">
                        <Card className="bg-white shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">Métriques de Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">
                                            {monitoringData?.system_metrics.network.toFixed(1)}ms
                                        </div>
                                        <p className="text-sm text-gray-600">Latence API</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600">
                                            {monitoringData?.health_checks.passed || 0}
                                        </div>
                                        <p className="text-sm text-gray-600">Tests réussis</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-600">
                                            {monitoringData?.system_metrics.cpu.toFixed(1)}%
                                        </div>
                                        <p className="text-sm text-gray-600">Utilisation CPU</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Santé */}
                    <TabsContent value="health" className="space-y-6">
                        <Card className="bg-white shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">Tests de Santé Système</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Database className="w-5 h-5 text-blue-500" />
                                            <div className="flex-1">
                                                <p className="font-medium">Base de données</p>
                                                <p className="text-sm text-gray-600">Connectivité et performance</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Server className="w-5 h-5 text-green-500" />
                                            <div className="flex-1">
                                                <p className="font-medium">API Server</p>
                                                <p className="text-sm text-gray-600">Disponibilité et réponse</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Wifi className="w-5 h-5 text-purple-500" />
                                            <div className="flex-1">
                                                <p className="font-medium">Réseau</p>
                                                <p className="text-sm text-gray-600">Connectivité et latence</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Lock className="w-5 h-5 text-orange-500" />
                                            <div className="flex-1">
                                                <p className="font-medium">Sécurité</p>
                                                <p className="text-sm text-gray-600">Headers et authentification</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Zap className="w-5 h-5 text-yellow-500" />
                                            <div className="flex-1">
                                                <p className="font-medium">Performance</p>
                                                <p className="text-sm text-gray-600">Temps de réponse</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Activity className="w-5 h-5 text-red-500" />
                                            <div className="flex-1">
                                                <p className="font-medium">Monitoring</p>
                                                <p className="text-sm text-gray-600">Collecte de métriques</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Logs */}
                    <TabsContent value="logs" className="space-y-6">
                        <Card className="bg-white shadow-lg">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <span>Logs d'Audit Récents</span>
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={fetchMonitoringData}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Actualiser
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Exporter
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Filtres */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher dans les logs..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={logFilter.search}
                                            onChange={(e) => setLogFilter(prev => ({ ...prev, search: e.target.value }))}
                                        />
                                    </div>
                                    <select
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={logFilter.level}
                                        onChange={(e) => setLogFilter(prev => ({ ...prev, level: e.target.value }))}
                                    >
                                        <option value="all">Tous les niveaux</option>
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="error">Error</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                    <select
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={logFilter.category}
                                        onChange={(e) => setLogFilter(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <option value="all">Toutes les catégories</option>
                                        <option value="security">Sécurité</option>
                                        <option value="performance">Performance</option>
                                        <option value="database">Base de données</option>
                                        <option value="api">API</option>
                                        <option value="user_action">Actions utilisateur</option>
                                        <option value="system">Système</option>
                                    </select>
                                    <select
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={logFilter.dateRange}
                                        onChange={(e) => setLogFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                                    >
                                        <option value="1h">Dernière heure</option>
                                        <option value="24h">Dernières 24h</option>
                                        <option value="7d">7 derniers jours</option>
                                        <option value="30d">30 derniers jours</option>
                                    </select>
                                </div>

                                {/* Onglets des types de logs */}
                                <div className="space-y-4">
                                    <div className="flex space-x-2 border-b">
                                        <button
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                                activeLogTab === 'system' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveLogTab('system')}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-4 h-4" />
                                                <span>Logs Système</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                                activeLogTab === 'iso' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveLogTab('iso')}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Code className="w-4 h-4" />
                                                <span>Rapports ISO</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                                activeLogTab === 'terminal' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveLogTab('terminal')}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Terminal className="w-4 h-4" />
                                                <span>Terminal</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Contenu des logs */}
                                    <div className="space-y-4">
                                        {activeLogTab === 'system' && (
                                            <div>
                                                {monitoringData?.audit_logs?.system_logs?.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                        <p className="text-gray-600">Aucun log système récent</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {monitoringData?.audit_logs?.system_logs?.slice(0, 20).map((log) => (
                                                            <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start space-x-3 flex-1">
                                                                        <div className={`p-1 rounded-full ${getLogLevelColor(log.level)}`}>
                                                                            {getLogLevelIcon(log.level)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                <span className="font-medium text-gray-900">{log.message}</span>
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {log.category}
                                                                                </Badge>
                                                                                {log.success !== undefined && (
                                                                                    <Badge className={log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                                                        {log.success ? 'Succès' : 'Échec'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                                <span className="flex items-center space-x-1">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    <span>{formatTimestamp(log.timestamp)}</span>
                                                                                </span>
                                                                                {log.user_email && (
                                                                                    <span className="flex items-center space-x-1">
                                                                                        <User className="w-3 h-3" />
                                                                                        <span>{log.user_email}</span>
                                                                                    </span>
                                                                                )}
                                                                                {log.ip_address && (
                                                                                    <span>IP: {log.ip_address}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => toggleLogExpansion(log.id)}
                                                                        >
                                                                            {expandedLogs.has(log.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                                                                        >
                                                                            <Copy className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Détails expandus */}
                                                                {expandedLogs.has(log.id) && (
                                                                    <div className="mt-4 pt-4 border-t">
                                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                                                                {JSON.stringify(log.details || {}, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeLogTab === 'iso' && (
                                            <div>
                                                {monitoringData?.audit_logs?.iso_reports?.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                        <p className="text-gray-600">Aucun rapport ISO récent</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {monitoringData?.audit_logs?.iso_reports?.slice(0, 20).map((report) => (
                                                            <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start space-x-3 flex-1">
                                                                        <div className={`p-1 rounded-full ${getStatusColor(report.status)}`}>
                                                                            {report.status === 'success' ? <CheckCircle className="w-4 h-4" /> : 
                                                                             report.status === 'running' ? <Activity className="w-4 h-4" /> :
                                                                             <AlertTriangle className="w-4 h-4" />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                <span className="font-medium text-gray-900">{report.script_name}</span>
                                                                                <Badge className={getStatusColor(report.status)}>
                                                                                    {report.status}
                                                                                </Badge>
                                                                                <span className="text-sm text-gray-500">
                                                                                    {formatDuration(report.duration_ms)}
                                                                                </span>
                                                                                {report.exit_code !== undefined && (
                                                                                    <span className="text-sm text-gray-500">
                                                                                        Exit: {report.exit_code}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                                <span className="flex items-center space-x-1">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    <span>{formatTimestamp(report.timestamp)}</span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => toggleLogExpansion(report.id)}
                                                                        >
                                                                            {expandedLogs.has(report.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyToClipboard(report.output)}
                                                                        >
                                                                            <Copy className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Sortie expandue */}
                                                                {expandedLogs.has(report.id) && (
                                                                    <div className="mt-4 pt-4 border-t space-y-3">
                                                                        {report.output && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Sortie standard:</h4>
                                                                                <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                                                                    <pre>{report.output}</pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {report.error_output && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Erreurs:</h4>
                                                                                <div className="bg-red-900 text-red-200 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                                                                    <pre>{report.error_output}</pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeLogTab === 'terminal' && (
                                            <div>
                                                {monitoringData?.audit_logs?.terminal_logs?.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                        <p className="text-gray-600">Aucun log terminal récent</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {monitoringData?.audit_logs?.terminal_logs?.slice(0, 20).map((log) => (
                                                            <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start space-x-3 flex-1">
                                                                        <div className={`p-1 rounded-full ${log.exit_code === 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                                                                            <Terminal className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                <span className="font-medium text-gray-900 font-mono text-sm">
                                                                                    $ {log.command}
                                                                                </span>
                                                                                <Badge className={log.exit_code === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                                                    Exit: {log.exit_code}
                                                                                </Badge>
                                                                                <span className="text-sm text-gray-500">
                                                                                    {formatDuration(log.duration_ms)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                                <span className="flex items-center space-x-1">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    <span>{formatTimestamp(log.timestamp)}</span>
                                                                                </span>
                                                                                <span className="flex items-center space-x-1">
                                                                                    <User className="w-3 h-3" />
                                                                                    <span>{log.user}</span>
                                                                                </span>
                                                                                <span className="font-mono">{log.working_directory}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => toggleLogExpansion(log.id)}
                                                                        >
                                                                            {expandedLogs.has(log.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyToClipboard(log.output)}
                                                                        >
                                                                            <Copy className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Sortie expandue */}
                                                                {expandedLogs.has(log.id) && (
                                                                    <div className="mt-4 pt-4 border-t space-y-3">
                                                                        {log.output && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Sortie standard:</h4>
                                                                                <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                                                                    <pre>{log.output}</pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {log.error_output && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Erreurs:</h4>
                                                                                <div className="bg-red-900 text-red-200 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                                                                    <pre>{log.error_output}</pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default MonitoringPage; 