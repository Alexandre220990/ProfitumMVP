import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { BarChart3, AlertTriangle, RefreshCw, Download, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Types pour les métriques
interface Metric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'number' | 'percentage' | 'currency' | 'duration';
  icon: React.ReactNode;
  color: string;
}

interface ConversionData {
  step: string;
  conversions: number;
  dropoffs: number;
  rate: number;
}

interface TimeData {
  step: string;
  averageTime: number;
  medianTime: number;
  totalTime: number;
}

interface AbandonmentPoint {
  step: string;
  abandonmentRate: number;
  totalUsers: number;
  abandonedUsers: number;
}

interface AnalyticsData {
  metrics: Metric[];
  conversionData: ConversionData[];
  timeData: TimeData[];
  abandonmentPoints: AbandonmentPoint[];
  topProducts: Array<{ name: string; conversions: number; revenue: number }>;
  expertPerformance: Array<{ name: string; assignments: number; successRate: number }>;
}

export const AnalyticsDashboard: React.FC = () => { 
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshKey, setRefreshKey] = useState(0);

  // Charger les données analytics
  useEffect(() => {
    loadAnalyticsData(); }, [timeRange, refreshKey]);

  const loadAnalyticsData = async () => { 
    try {
      setLoading(true);
      
      // TODO: Remplacer par l'appel API réel
      setData(null);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="w-4 h-4" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) { return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    ); }

  if (!data) { return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Impossible de charger les données analytics</p>
      </div>
    ); }

  return (
    <div className="space-y-6">
      { /* Header avec contrôles */ }
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Suivi des performances et métriques critiques
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button
            variant="outline"
            onClick={ () => setRefreshKey(prev => prev + 1) }
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </Button>
        </div>
      </div>

      { /* Métriques principales */ }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        { data.metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                { metric.name }
              </CardTitle>
              <div className={ cn('p-2 rounded-full', metric.color) }>
                { metric.icon }
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                { formatValue(metric.value, metric.format) }
              </div>
              <div className={ cn('flex items-center space-x-1 text-sm mt-1', getChangeColor(metric.changeType)) }>
                { getChangeIcon(metric.changeType) }
                <span>
                  { metric.change > 0 ? '+' : '' }{ metric.change.toFixed(1) }%
                </span>
                <span className="text-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      { /* Onglets détaillés */ }
      <Tabs defaultValue="conversion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="time">Temps de traitement</TabsTrigger>
          <TabsTrigger value="abandonment">Points d'abandon</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
        </TabsList>

        { /* Onglet Conversion */ }
        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Funnel de conversion</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { data.conversionData.map((step) => (
                  <div key={step.step } className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                      { step.step }
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{ step.conversions } utilisateurs</span>
                        <span className="text-green-600">{ step.rate }%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={ { width: `${step.rate}%` }}
                        />
                      </div>
                    </div>
                    { step.dropoffs > 0 && (
                      <div className="text-sm text-red-600">
                        -{step.dropoffs }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Onglet Temps de traitement */ }
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Temps de traitement par étape</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { data.timeData.map((step) => (<div key={step.step } className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        { step.step }
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Moyenne: { step.averageTime.toFixed(1) } jours | Médiane: { step.medianTime.toFixed(1) } jours
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        { step.totalTime }h
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Temps total
                      </div>
                    </div>
                  </div>
                ),)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Onglet Points d'abandon */ }
        <TabsContent value="abandonment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="w-5 h-5" />
                <span>Points d'abandon</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { data.abandonmentPoints.map((point) => (
                  <div key={point.step } className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        { point.step }
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        { point.abandonedUsers } utilisateurs abandonnés sur { point.totalUsers }
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        { point.abandonmentRate.toFixed(1) }%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Taux d'abandon
                      </div>
                    </div>
                  </div>
                ),)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Onglet Produits */ }
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Performance par produit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { data.topProducts.map((product) => (
                  <div key={product.name } className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        { product.name }
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        { product.conversions } conversions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        { new Intl.NumberFormat('fr-FR', {
                          style: 'currency', currency: 'EUR' }).format(product.revenue)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Revenus générés
                      </div>
                    </div>
                  </div>
                ),)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Onglet Experts */ }
        <TabsContent value="experts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Performance des experts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { data.expertPerformance.map((expert) => (
                  <div key={expert.name } className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        { expert.name }
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        { expert.assignments } assignations
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        { expert.successRate.toFixed(1) }%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Taux de succès
                      </div>
                    </div>
                  </div>
                ),)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 