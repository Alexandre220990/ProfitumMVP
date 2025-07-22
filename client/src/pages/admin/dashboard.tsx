import React, { useState, useCallback } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { useAdminAnalytics } from "@/hooks/use-admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/design-system/Card";
import Button from "@/components/ui/design-system/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Badge from "@/components/ui/design-system/Badge";
import { useToast } from "@/components/ui/toast-notifications";
import AdvancedMetrics from "@/components/admin/AdvancedMetrics";
import '@/styles/admin-dashboard.css';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  BookOpen,
  Settings,
  UserCheck,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Monitor,
  TestTube,
  Terminal,
  Gauge,
  AlertTriangle,
  Brain,
  Shield,
  Clock,
  Minus,
  Plus,
  Bell,
  Diamond,
  Crown,
  Cpu
} from "lucide-react";

// ============================================================================
// DASHBOARD ADMIN RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par Amazon AWS Console + Google Analytics + Tesla Dashboard
// Interface temps réel, prédictive et auto-optimisante

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { addToast } = useToast();

  // Hook analytics révolutionnaire
  const {
    metrics,
    insights,
    alerts,
    criticalAlerts,
    computedMetrics,
    lastUpdated,
    refreshMetrics,
    formatMetric,
    getMetricIcon
  } = useAdminAnalytics({
    autoRefresh: true,
    refreshInterval: 30000,
    enableAlerts: true
  });

  // État local pour les animations
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ===== GESTION DES PERMISSIONS =====
  
  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    if (user.type === 'client') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.type === 'expert') {
      return <Navigate to="/expert" replace />;
    } else {
      return <Navigate to="/connect-admin" replace />;
    }
  }

  // ===== ACTIONS =====
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshMetrics();
    setIsRefreshing(false);
    
    addToast({
      type: 'success',
      title: 'Métriques actualisées',
      message: 'Les données ont été mises à jour avec succès',
      duration: 3000
    });
  }, [refreshMetrics, addToast]);

  // ===== COMPOSANTS DE MÉTRIQUES =====
  
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color, 
    format = 'number',
    trend,
    subtitle,
    onClick
  }: any) => (
    <Card 
      className={`hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6 relative overflow-hidden">
        {/* Gradient de fond */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              {trend && (
                <span className="text-2xl">{getMetricIcon(trend)}</span>
              )}
              {change !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  changeType === 'increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {changeType === 'increase' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {formatMetric(value, format)}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AlertCard = ({ alert }: { alert: any }) => (
    <Card className={`border-l-4 ${
      alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
      alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
      alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
      'border-blue-500 bg-blue-50'
    } hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
            alert.severity === 'critical' ? 'text-red-600' :
            alert.severity === 'high' ? 'text-orange-600' :
            alert.severity === 'medium' ? 'text-yellow-600' :
            'text-blue-600'
          }`} />
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">{alert.rule.name}</h4>
            <p className="text-sm text-slate-600 mb-2">
              Valeur actuelle: {formatMetric(alert.currentValue, 'number')}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={alert.severity === 'critical' ? 'error' : 'base'}>
                {alert.severity.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500">
                {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PredictionCard = ({ title, predictions, icon: Icon, color }: any) => (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        
        <div className="space-y-3">
          {Object.entries(predictions).map(([period, value]: [string, any]) => (
            <div key={period} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600 capitalize">
                {period.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-semibold text-slate-900">
                {formatMetric(value, 'currency')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ===== MÉTRIQUES PRINCIPALES =====
  
  const mainMetrics = [
    {
      title: 'Utilisateurs Actifs',
      value: metrics?.activeUsers || 0,
      change: 12.5,
      changeType: 'increase' as const,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      format: 'number' as const,
      trend: computedMetrics?.trends?.userTrend,
      subtitle: `${metrics?.concurrentSessions || 0} sessions simultanées`
    },
    {
      title: 'Revenus/Minute',
      value: metrics?.revenuePerMinute || 0,
      change: 15.2,
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      format: 'currency' as const,
      trend: computedMetrics?.trends?.revenueTrend,
      subtitle: `${formatMetric(computedMetrics?.kpis?.revenuePerHour || 0, 'currency')}/h`
    },
    {
      title: 'Dossiers Complétés',
      value: metrics?.dossiersCompleted || 0,
      change: 8.3,
      changeType: 'increase' as const,
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      format: 'number' as const,
      subtitle: `Efficacité: ${computedMetrics?.kpis?.efficiency?.toFixed(1) || 0}%`
    },
    {
      title: 'Performance Système',
      value: metrics?.systemPerformance || 0,
      change: -2.1,
      changeType: 'decrease' as const,
      icon: Gauge,
      color: 'from-orange-500 to-red-500',
      format: 'percentage' as const,
      trend: computedMetrics?.trends?.performanceTrend,
      subtitle: `Latence: ${formatMetric(metrics?.databaseLatency || 0, 'time')}`
    }
  ];

  // ===== MODULES DU DASHBOARD =====
  
  const dashboardModules = {
    monitoring: [
      {
        id: 'monitoring',
        title: 'Monitoring & Analytics',
        description: 'Surveillance système et tableaux de bord',
        icon: Monitor,
        color: 'from-blue-500 to-cyan-500',
        path: '/admin/monitoring',
        stats: { active: 12, total: 15 }
      },
      {
        id: 'tests',
        title: 'Tests Système',
        description: 'Tests automatisés et diagnostics',
        icon: TestTube,
        color: 'from-purple-500 to-pink-500',
        path: '/admin/tests',
        stats: { passed: 89, total: 92 }
      },
      {
        id: 'terminal',
        title: 'Terminal Tests',
        description: 'Tests avancés et diagnostics techniques',
        icon: Terminal,
        color: 'from-orange-500 to-red-500',
        path: '/admin/terminal-tests',
        stats: { running: 3, total: 8 }
      }
    ],
    users: [
      {
        id: 'clients',
        title: 'Gestion Clients',
        description: 'Gestion complète de la base clients',
        icon: Users,
        color: 'from-indigo-500 to-purple-500',
        path: '/admin/gestion-clients',
        stats: { total: 890, active: 756 }
      },
      {
        id: 'experts',
        title: 'Gestion Experts',
        description: 'Gestion des experts et compétences',
        icon: UserCheck,
        color: 'from-teal-500 to-cyan-500',
        path: '/admin/gestion-experts',
        stats: { total: 156, available: 89 }
      },
      {
        id: 'validation',
        title: 'Validation Dashboard',
        description: 'Validation des processus et workflows',
        icon: CheckCircle,
        color: 'from-green-500 to-emerald-500',
        path: '/admin/validation-dashboard',
        stats: { pending: 45, total: 67 }
      }
    ],
    documents: [
      {
        id: 'ged',
        title: 'GED Management',
        description: 'Gestion Électronique Documentaire',
        icon: FileText,
        color: 'from-slate-500 to-gray-500',
        path: '/admin/enhanced-admin-documents',
        stats: { documents: 1234, categories: 8 }
      },
      {
        id: 'upload',
        title: 'Upload Documents',
        description: 'Upload et gestion des guides prêts',
        icon: BookOpen,
        color: 'from-amber-500 to-orange-500',
        path: '/admin/enhanced-admin-documents',
        stats: { uploaded: 89, templates: 15 }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header révolutionnaire */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500" />
              Dashboard Administrateur
            </h1>
            <p className="text-slate-600 text-lg">
              Centre de contrôle révolutionnaire - Données temps réel & IA prédictive
            </p>
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-1">
                Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh} 
              variant="base" 
              disabled={isRefreshing}
              className="flex items-center gap-2 hover:shadow-md transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
            <Button 
              className="flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Alertes critiques */}
        {criticalAlerts.length > 0 && (
          <div className="animate-slide-in">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Alertes Critiques</h3>
                  <Badge variant="error">{criticalAlerts.length}</Badge>
                </div>
                <div className="space-y-2">
                  {criticalAlerts.slice(0, 3).map((alert, index) => (
                    <AlertCard key={alert.id || index} alert={alert} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Métriques principales révolutionnaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainMetrics.map((metric, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        {/* Onglets révolutionnaires */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-slide-in">
          <TabsList className="grid w-full grid-cols-6 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Diamond className="w-4 h-4" />
              Métriques Avancées
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Brain className="w-4 h-4" />
              Prédictions IA
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Monitor className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble révolutionnaire */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Scores de santé */}
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Scores de Santé
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Business</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">
                          {computedMetrics?.scores?.businessHealth?.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-blue-700">Excellent</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Système</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-900">
                          {computedMetrics?.scores?.systemHealth?.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-green-700">Stable</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Utilisateurs</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-900">
                          {computedMetrics?.scores?.userHealth?.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-purple-700">Engagés</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prédictions rapides */}
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Prédictions IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights?.revenueForecast && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                        <span className="text-sm font-medium text-purple-900">Prochaine heure</span>
                        <span className="font-bold text-purple-900">
                          {formatMetric(insights.revenueForecast.nextHour, 'currency')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg">
                        <span className="text-sm font-medium text-indigo-900">Prochain jour</span>
                        <span className="font-bold text-indigo-900">
                          {formatMetric(insights.revenueForecast.nextDay, 'currency')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {insights?.userBehavior && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">Heures de pointe</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {insights.userBehavior.peakHours?.map((hour: string, index: number) => (
                          <Badge key={index} variant="base" className="text-xs">
                            {hour}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alertes actives */}
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Alertes Actives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Aucune alerte active</p>
                    </div>
                  ) : (
                    alerts.slice(0, 3).map((alert, index) => (
                      <AlertCard key={alert.id || index} alert={alert} />
                    ))
                  )}
                  
                  {alerts.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full">
                      Voir toutes les alertes ({alerts.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Métriques Avancées */}
          <TabsContent value="metrics" className="space-y-6">
            <AdvancedMetrics />
          </TabsContent>

          {/* Prédictions IA */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Prédictions de revenus */}
              {insights?.revenueForecast && (
                <PredictionCard
                  title="Prédictions de Revenus"
                  predictions={insights.revenueForecast}
                  icon={DollarSign}
                  color="from-emerald-500 to-teal-500"
                />
              )}
              
              {/* Comportement utilisateur */}
              {insights?.userBehavior && (
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Comportement Utilisateur</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Risque de churn</span>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">
                            {insights.userBehavior.churnRisk?.toFixed(1) || 0}%
                          </div>
                          <div className="text-xs text-slate-500">Faible</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-900">Tendances d'engagement</span>
                        </div>
                        <div className="space-y-1">
                          {insights.userBehavior.engagementTrends?.map((trend: string, index: number) => (
                            <div key={index} className="text-xs text-slate-600 flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              {trend}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.monitoring.map((module, index) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card 
                    className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" 
                    onClick={() => window.location.href = module.path}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.users.map((module, index) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card 
                    className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" 
                    onClick={() => window.location.href = module.path}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.documents.map((module, index) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card 
                    className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" 
                    onClick={() => window.location.href = module.path}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardPage;