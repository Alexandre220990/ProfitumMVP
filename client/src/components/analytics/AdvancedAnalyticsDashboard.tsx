import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  BarChart3, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Target, 
  Users, 
  UserCheck,
  MapPin,
  Activity,
  Zap,
  Filter,
  Play,
  Pause,
  Globe,
  Award,
  TrendingUpIcon,
  TrendingDownIcon,
  Minus
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  showRealTime?: boolean;
  defaultTimeRange?: '7d' | '30d' | '90d' | '1y';
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className,
  showRealTime = true,
  defaultTimeRange = '30d'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const {
    metrics,
    conversionData,
    timeData,
    abandonmentPoints,
    topProducts,
    expertPerformance,
    geographicData,
    realTimeMetrics,
    funnel,
    loading,
    error,
    lastUpdated,
    refresh,
    updateFilters,
    exportData,
    generateReport,
    filters,
    isRealTimeEnabled,
    enableRealTime,
    disableRealTime
  } = useAnalytics({ timeRange: defaultTimeRange });

  // Gérer le changement de période
  const handleTimeRangeChange = useCallback((value: string) => {
    updateFilters({ timeRange: value as any });
  }, [updateFilters]);

  // Gérer l'export
  const handleExport = useCallback(async (format: 'csv' | 'json' | 'excel') => {
    try {
      const data = await exportData(format);
      
      if (format === 'json') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  }, [exportData]);

  // Gérer la génération de rapport
  const handleGenerateReport = useCallback(async () => {
    try {
      const blob = await generateReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
    }
  }, [generateReport]);

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
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Erreur: {error}</p>
        <Button onClick={refresh} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête avec contrôles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Analytics Avancées
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {lastUpdated && `Dernière mise à jour: ${lastUpdated.toLocaleString('fr-FR')}`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de période */}
          <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
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

          {/* Bouton filtres */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtres</span>
          </Button>

          {/* Bouton temps réel */}
          {showRealTime && (
            <Button
              variant={isRealTimeEnabled ? "default" : "outline"}
              onClick={isRealTimeEnabled ? disableRealTime : enableRealTime}
              className="flex items-center space-x-2"
            >
              {isRealTimeEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>Temps réel</span>
            </Button>
          )}

          {/* Bouton actualiser */}
          <Button
            variant="outline"
            onClick={refresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </Button>

          {/* Menu d'export */}
          <div className="relative group">
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </Button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Rapport PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filtres avancés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => updateFilters({ 
                    timeRange: 'custom', 
                    startDate: customDateRange.startDate, 
                    endDate: customDateRange.endDate 
                  })}
                  className="w-full"
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.name}
              </CardTitle>
              <div className={cn('p-2 rounded-full', metric.color)}>
                {metric.icon === 'users' && <Users className="w-4 h-4" />}
                {metric.icon === 'user-plus' && <UserCheck className="w-4 h-4" />}
                {metric.icon === 'user-check' && <UserCheck className="w-4 h-4" />}
                {metric.icon === 'trending-up' && <TrendingUp className="w-4 h-4" />}
                {metric.icon === 'dollar-sign' && <DollarSign className="w-4 h-4" />}
                {metric.icon === 'target' && <Target className="w-4 h-4" />}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Géographie</TabsTrigger>
          <TabsTrigger value="realtime">Temps réel</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des produits */}
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
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique des experts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Performance des experts</span>
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
                    <Bar dataKey="totalRevenue" fill="#10B981" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Conversion */}
        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel de conversion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Funnel de conversion</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversions" fill="#3B82F6" />
                    <Bar dataKey="dropoffs" fill="#EF4444" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Points d'abandon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5" />
                  <span>Points d'abandon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={abandonmentPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="abandonmentRate" fill="#F59E0B" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temps de traitement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Temps de traitement par étape</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageTime" fill="#8B5CF6" />
                    <Bar dataKey="medianTime" fill="#06B6D4" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition des produits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Répartition des conversions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="conversions"
                    >
                      {topProducts.map((_, index) => (
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

        {/* Onglet Géographie */}
        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Répartition géographique</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {geographicData.map((location) => (
                  <div key={location.city} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{location.city}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{location.count}</div>
                      <div className="text-sm text-gray-500">{location.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Temps réel */}
        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Métriques en temps réel</span>
                {isRealTimeEnabled && (
                  <Badge variant="secondary" className="ml-2">
                    <Zap className="w-3 h-3 mr-1" />
                    Actif
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={realTimeMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Funnel */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Funnel de conversion global</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {funnel && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{funnel.clients}</div>
                      <div className="text-sm text-gray-600">Clients</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{funnel.eligibleProducts}</div>
                      <div className="text-sm text-gray-600">Produits éligibles</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{funnel.audits}</div>
                      <div className="text-sm text-gray-600">Audits</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{funnel.completed}</div>
                      <div className="text-sm text-gray-600">Terminés</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(funnel.completed / funnel.clients) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    Taux de conversion global: {((funnel.completed / funnel.clients) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard; 