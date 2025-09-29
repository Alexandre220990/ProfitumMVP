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
  Award,
  TrendingUpIcon,
  TrendingDownIcon,
  Minus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Table
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import { useExpertAnalytics } from '@/hooks/use-expert-analytics';
import { useAdminAnalytics } from '@/hooks/use-admin-analytics';
import { AdvancedMetrics } from '@/components/admin/AdvancedMetrics';
import { BusinessPipelineDashboard } from '@/components/admin/BusinessPipelineDashboard';
import { ValidationActionsDashboard } from '@/components/admin/ValidationActionsDashboard';
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

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filtres avancés pour admin
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedExpert, setSelectedExpert] = useState<string>('all');
  const [selectedApporteur, setSelectedApporteur] = useState<string>('all');
  const [selectedAmount, setSelectedAmount] = useState<string>('all');

  // Vérifier les permissions (admin et expert uniquement)
  if (!user || (user.type !== 'admin' && user.type !== 'expert')) {
    return <Navigate to="/auth" replace />;
  }

  // Utiliser le hook approprié selon le type d'utilisateur
  const isExpert = user.type === 'expert';
  const isAdmin = user.type === 'admin';
  
  // Hook AdminAnalytics (révolutionnaire avec IA prédictive)
  const {
    metrics: adminAdvancedMetrics,
    isLoading: adminAdvancedLoading,
    error: adminAdvancedError,
    lastUpdated: adminAdvancedLastUpdated,
    refreshMetrics: adminAdvancedRefresh
  } = useAdminAnalytics();

  // Hook Analytics standard
  const {
    metrics: adminMetrics,
    topProducts: adminTopProducts,
    expertPerformance: adminExpertPerformance,
    loading: adminLoading,
    error: adminError,
    lastUpdated: adminLastUpdated,
    refresh: adminRefresh
  } = useAnalytics({ timeRange });

  // Hook ExpertAnalytics
  const {
    metrics: expertMetrics,
    performanceByMonth,
    topProducts: expertTopProducts,
    clientDistribution,
    timeAnalysis,
    loading: expertLoading,
    error: expertError,
    lastUpdated: expertLastUpdated,
    refresh: expertRefresh
  } = useExpertAnalytics({ timeRange });

  // Utiliser les données appropriées selon le type d'utilisateur
  const metrics = isExpert ? expertMetrics : (isAdmin ? adminAdvancedMetrics : adminMetrics);
  const topProducts = isExpert ? expertTopProducts : adminTopProducts;
  const expertPerformance = isExpert ? performanceByMonth : adminExpertPerformance;
  const loading = isExpert ? expertLoading : (isAdmin ? adminAdvancedLoading : adminLoading);
  const error = isExpert ? expertError : (isAdmin ? adminAdvancedError : adminError);
  const lastUpdated = isExpert ? expertLastUpdated : (isAdmin ? adminAdvancedLastUpdated : adminLastUpdated);
  const refresh = isExpert ? expertRefresh : (isAdmin ? adminAdvancedRefresh : adminRefresh);

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

  // Obtenir l'icône de tendance
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  // Couleurs pour les graphiques
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Chargement des analytics...</p>
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
                Analytics {isExpert ? 'Expert' : 'Avancées'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isExpert ? 'Pilotage de votre activité et performance' : 'Dashboard complet avec métriques en temps réel'}
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

              {/* Boutons d'export et rapports pour admin */}
              {isAdmin && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Table className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="default" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Rapport Personnalisé
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtres avancés pour admin */}
        {isAdmin && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Produit</label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les produits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les produits</SelectItem>
                        <SelectItem value="ticpe">TICPE</SelectItem>
                        <SelectItem value="urssaf">URSSAF</SelectItem>
                        <SelectItem value="dfs">DFS</SelectItem>
                        <SelectItem value="foncier">Foncier</SelectItem>
                        <SelectItem value="cir">CIR/CII/JEI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Expert</label>
                    <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les experts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les experts</SelectItem>
                        <SelectItem value="expert1">Expert 1</SelectItem>
                        <SelectItem value="expert2">Expert 2</SelectItem>
                        <SelectItem value="expert3">Expert 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Apporteur</label>
                    <Select value={selectedApporteur} onValueChange={setSelectedApporteur}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les apporteurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les apporteurs</SelectItem>
                        <SelectItem value="apporteur1">Apporteur 1</SelectItem>
                        <SelectItem value="apporteur2">Apporteur 2</SelectItem>
                        <SelectItem value="apporteur3">Apporteur 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Montant</label>
                    <Select value={selectedAmount} onValueChange={setSelectedAmount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les montants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les montants</SelectItem>
                        <SelectItem value="0-15k">&lt; 15k€</SelectItem>
                        <SelectItem value="15k-50k">15k€ - 50k€</SelectItem>
                        <SelectItem value="50k-150k">50k€ - 150k€</SelectItem>
                        <SelectItem value="150k+">&gt; 150k€</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.slice(0, 4).map((metric: any) => (
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
                  {metric.icon === 'award' && <Award className="w-4 h-4" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatValue(metric.value, metric.format)}
                </div>
                <div className="flex items-center space-x-1 text-sm mt-1">
                  {getTrendIcon(metric.trend)}
                  <span className={cn(
                    'font-medium',
                    metric.changeType === 'increase' ? 'text-green-600' : 
                    metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs période précédente</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Onglets détaillés */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-7' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="advanced">Métriques Avancées</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline Business</TabsTrigger>
                <TabsTrigger value="validations">Validations</TabsTrigger>
              </>
            )}
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
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={expertPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={isExpert ? "revenue" : "totalRevenue"} 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Revenus"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={isExpert ? "assignments" : "assignments"} 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Assignations"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Graphique des produits les plus performants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Produits les plus performants</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Revenus" />
                      <Bar dataKey={isExpert ? "count" : "conversions"} fill="#10B981" name={isExpert ? "Nombre" : "Conversions"} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Métriques secondaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Temps de traitement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {metrics.find((m: any) => m.name.includes('Temps') || m.name.includes('Moyen'))?.value || 0} jours
                  </div>
                  <p className="text-sm text-gray-600">Temps moyen de traitement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Taux de conversion</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {metrics.find((m: any) => m.name.includes('Conversion'))?.value || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Taux de conversion global</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Satisfaction client</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {metrics.find((m: any) => m.name.includes('Satisfaction'))?.value || 0}/5
                  </div>
                  <p className="text-sm text-gray-600">Note moyenne des clients</p>
                </CardContent>
              </Card>
            </div>

            {/* Section spécifique expert */}
            {isExpert && timeAnalysis && (
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
                      <div className="text-2xl font-bold text-blue-600">{timeAnalysis.averageResponseTime}h</div>
                      <p className="text-sm text-gray-600">Temps de réponse moyen</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{timeAnalysis.averageProcessingTime}j</div>
                      <p className="text-sm text-gray-600">Temps de traitement moyen</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {timeAnalysis.peakHours.join(', ')}
                      </div>
                      <p className="text-sm text-gray-600">Heures de pointe</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {timeAnalysis.preferredDays.join(', ')}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique de performance détaillé */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Performance détaillée</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={expertPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey={isExpert ? "completionRate" : "successRate"} fill="#10B981" name="Taux de succès (%)" />
                      <Bar dataKey={isExpert ? "avgCompletionTime" : "avgCompletionTime"} fill="#F59E0B" name="Temps moyen (jours)" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition des assignations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Répartition des assignations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">En cours</span>
                      <Badge variant="secondary">
                        {metrics.find((m: any) => m.name.includes('En cours') || m.name.includes('Assignations'))?.value || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Terminés</span>
                      <Badge variant="default">
                        {metrics.find((m: any) => m.name.includes('Terminées'))?.value || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">En attente</span>
                      <Badge variant="outline">
                        {metrics.find((m: any) => m.name.includes('Attente'))?.value || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Revenus (€)" />
                      <Bar dataKey={isExpert ? "conversionRate" : "conversionRate"} fill="#10B981" name="Taux de conversion (%)" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={topProducts as any[]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {topProducts.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Clients */}
          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistiques clients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Statistiques clients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">Nouveaux clients</p>
                        <p className="text-sm text-gray-600">Ce mois</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {metrics.find((m: any) => m.name.includes('Nouveaux'))?.value || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">Clients actifs</p>
                        <p className="text-sm text-gray-600">En cours de traitement</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {metrics.find((m: any) => m.name.includes('Actifs'))?.value || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">Clients satisfaits</p>
                        <p className="text-sm text-gray-600">Note ≥ 4/5</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {metrics.find((m: any) => m.name.includes('Satisfaits'))?.value || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition géographique ou par type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>{isExpert ? 'Répartition par type' : 'Répartition géographique'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isExpert && clientDistribution ? (
                    <div className="space-y-3">
                      {clientDistribution.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{item.clientType}</span>
                          <Badge variant="secondary">{item.percentage}%</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Île-de-France</span>
                        <Badge variant="secondary">45%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Provence-Alpes-Côte d'Azur</span>
                        <Badge variant="secondary">23%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Auvergne-Rhône-Alpes</span>
                        <Badge variant="secondary">18%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Autres régions</span>
                        <Badge variant="secondary">14%</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Métriques Avancées (Admin uniquement) */}
          {isAdmin && (
            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Métriques Avancées avec IA Prédictive</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdvancedMetrics />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Onglet Pipeline Business (Admin uniquement) */}
          {isAdmin && (
            <TabsContent value="pipeline" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Pipeline Business avec Prédictions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BusinessPipelineDashboard />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Onglet Validations (Admin uniquement) */}
          {isAdmin && (
            <TabsContent value="validations" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Actions de Validation et Workflows</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ValidationActionsDashboard />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage; 