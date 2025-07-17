import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Progress } from "./progress";
import { Users, FileText, DollarSign, TrendingUp, TrendingDown, Shield, CheckCircle, AlertTriangle, RefreshCw, Activity, Target, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

// Interface supprimée car non utilisée

interface AdminDashboardProps {
  metrics: {
    activeUsers: number;
    completedDossiers: number;
    totalRevenue: number;
    conversionRate: number;
    securityScore: number;
    complianceScore: number;
  };
  securityAlerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
  }>;
  timeRange: string;
  setTimeRange: (range: string) => void;
  refreshMetrics: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  securityAlerts,
  notifications,
  timeRange,
  setTimeRange,
  refreshMetrics
}) => {
  const metricCards: MetricCard[] = [
    {
      title: 'Utilisateurs Actifs',
      value: metrics.activeUsers,
      change: 12.5,
      changeType: 'increase',
      icon: <Users className="w-4 h-4" />,
      color: 'text-blue-600',
      format: 'number'
    },
    {
      title: 'Dossiers Complétés',
      value: metrics.completedDossiers,
      change: 8.3,
      changeType: 'increase',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-green-600',
      format: 'number'
    },
    {
      title: 'Revenus Totaux',
      value: metrics.totalRevenue,
      change: 15.2,
      changeType: 'increase',
      icon: <DollarSign className="w-4 h-4" />,
      color: 'text-emerald-600',
      format: 'currency'
    },
    {
      title: 'Taux de Conversion',
      value: metrics.conversionRate,
      change: -2.1,
      changeType: 'decrease',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-orange-600',
      format: 'percentage'
    },
    {
      title: 'Score Sécurité',
      value: metrics.securityScore,
      change: 3.5,
      changeType: 'increase',
      icon: <Shield className="w-4 h-4" />,
      color: 'text-purple-600',
      format: 'number'
    },
    {
      title: 'Conformité ISO',
      value: metrics.complianceScore,
      change: 1.8,
      changeType: 'increase',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-indigo-600',
      format: 'percentage'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${value.toFixed(1)} jours`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  const getChangeColor = (changeType: string) => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  const criticalAlerts = securityAlerts.filter(a => a.severity === 'critical' && !a.resolved);
  // Variable supprimée car non utilisée

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vue d'ensemble de la plateforme et métriques clés
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => window.location.href = '/admin/admin-document-upload'} 
            className="flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Gestion Documentaire</span>
          </Button>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refreshMetrics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="w-5 h-5" />
              <span>Alertes Critiques ({criticalAlerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {alert.description}
                    </p>
                  </div>
                  <Badge variant="destructive">Critique</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <div className={cn('p-2 rounded-full', metric.color)}>
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatValue(metric.value as number, metric.format || 'number')}
              </div>
              {metric.change && (
                <div className={cn('flex items-center space-x-1 text-sm mt-1', getChangeColor(metric.changeType!))}>
                  {getChangeIcon(metric.changeType!)}
                  <span>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs période précédente</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="security">Sécurité & Conformité</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progression des objectifs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Objectifs Mensuels</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Nouveaux utilisateurs</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Dossiers complétés</span>
                      <span>68%</span>
                    </div>
                    <Progress value={68} className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Revenus cible</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Conformité ISO</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Activité Récente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Nouveau dossier créé', user: 'Client A', time: '2 min' },
                    { action: 'Expert assigné', user: 'Expert B', time: '5 min' },
                    { action: 'Document uploadé', user: 'Client C', time: '12 min' },
                    { action: 'Dossier validé', user: 'Admin', time: '15 min' },
                    { action: 'Paiement reçu', user: 'Client D', time: '23 min' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Notifications Système</span>
                <Badge variant="outline">
                  {notifications.filter(n => !n.read).length} non lues
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        notification.read 
                          ? 'bg-gray-50 dark:bg-gray-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.read ? 'bg-gray-400' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${
                            notification.read 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          notification.read 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune notification pour le moment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 