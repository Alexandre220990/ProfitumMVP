import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Users, 
  Target, 
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useExpertAnalyticsSimple } from '@/hooks/use-expert-analytics-simple';
import { cn } from '@/lib/utils';

// Composants de graphiques Recharts
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

const AnalyticsSimplePage: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Vérifier les permissions (expert uniquement pour cette version simplifiée)
  if (!user || user.type !== 'expert') {
    return <Navigate to="/auth" replace />;
  }

  // Charger les données avec le hook simplifié
  const {
    metrics,
    performance,
    topProducts,
    clientDistribution,
    timeAnalysis,
    loading,
    error,
    lastUpdated,
    refresh
  } = useExpertAnalyticsSimple({ timeRange });

  // Formater les valeurs
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
      case 'duration':
        return `${value.toFixed(1)} jours`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  // Couleurs pour les graphiques
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Chargement de vos analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Erreur: {error}</p>
          <Button onClick={refresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Analytics Expert
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Pilotage de votre activité et performance
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Dernière mise à jour: {lastUpdated.toLocaleString('fr-FR')}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={refresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric) => (
            <Card key={metric.id} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.name}
                </CardTitle>
                <div className={cn('p-2 rounded-full', metric.color)}>
                  {metric.icon === 'users' && <Users className="w-4 h-4" />}
                  {metric.icon === 'dollar-sign' && <DollarSign className="w-4 h-4" />}
                  {metric.icon === 'target' && <Target className="w-4 h-4" />}
                  {metric.icon === 'trending-up' && <TrendingUp className="w-4 h-4" />}
                  {metric.icon === 'clock' && <Clock className="w-4 h-4" />}
                  {metric.icon === 'activity' && <Activity className="w-4 h-4" />}
                  {metric.icon === 'check-circle' && <CheckCircle className="w-4 h-4" />}
                  {metric.icon === 'briefcase' && <Briefcase className="w-4 h-4" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatValue(metric.value, metric.format)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Onglets détaillés */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique des performances mensuelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Évolution mensuelle</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {performance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={performance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Revenus (€)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="assignments" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Assignations"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Graphique des produits les plus performants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Top Produits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={topProducts.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3B82F6" name="Revenus (€)" />
                        <Bar dataKey="count" fill="#10B981" name="Nombre" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analyse temporelle */}
            {timeAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Analyse temporelle</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {timeAnalysis.averageResponseTime}h
                      </div>
                      <p className="text-sm text-gray-600">Temps de réponse moyen</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {timeAnalysis.averageProcessingTime}j
                      </div>
                      <p className="text-sm text-gray-600">Temps de traitement moyen</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {timeAnalysis.peakHours.join(', ') || 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600">Heures de pointe</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {timeAnalysis.preferredDays.join(', ') || 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600">Jours préférés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Performance */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Performance détaillée par mois</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completionRate" fill="#10B981" name="Taux de succès (%)" />
                      <Bar dataKey="avgCompletionTime" fill="#F59E0B" name="Temps moyen (jours)" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Produits */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique des produits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Performance par produit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={topProducts.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3B82F6" name="Revenus (€)" />
                        <Bar dataKey="conversionRate" fill="#10B981" name="Taux de conversion (%)" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Répartition des produits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Répartition des produits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={topProducts.slice(0, 6) as any}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {topProducts.slice(0, 6).map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Clients */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Répartition par type de client</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {clientDistribution.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{item.clientType}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{item.count} clients</Badge>
                          <span className="text-sm text-gray-600">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsSimplePage;

