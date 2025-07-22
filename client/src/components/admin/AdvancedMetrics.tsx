import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/design-system/Card';
import { useAdminAnalytics } from '@/hooks/use-admin-analytics';
import { 
  TrendingUp, 
  Minus, 
  Plus, 
  Target, 
  Brain, 
  Trophy,
  Star,
  Award,
  Diamond,
  Gauge,
  BarChart3,
  DollarSign,
  Users,
  UserCheck
} from 'lucide-react';

// ============================================================================
// COMPOSANT MÉTRIQUES AVANCÉES RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par Amazon CloudWatch + Google Analytics + Tesla Dashboard
// Visualisations interactives, prédictions IA, métriques temps réel

interface MetricData {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  target: number;
  unit: string;
  color: string;
  icon: React.ComponentType<any>;
  trend: 'up' | 'down' | 'stable';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

export const AdvancedMetrics: React.FC = () => {
  const { metrics, insights, computedMetrics, formatMetric, getMetricIcon } = useAdminAnalytics();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // ===== MÉTRIQUES AVANCÉES =====
  
  const advancedMetrics: MetricData[] = useMemo(() => [
    {
      label: 'Revenus Temps Réel',
      value: metrics?.revenuePerMinute || 0,
      change: 15.2,
      changeType: 'increase',
      target: 200,
      unit: '€/min',
      color: 'from-emerald-500 to-teal-500',
      icon: DollarSign,
      trend: 'up',
      priority: 'critical'
    },
    {
      label: 'Performance Système',
      value: metrics?.systemPerformance || 0,
      change: -2.1,
      changeType: 'decrease',
      target: 95,
      unit: '%',
      color: 'from-blue-500 to-cyan-500',
      icon: Gauge,
      trend: 'stable',
      priority: 'high'
    },
    {
      label: 'Engagement Utilisateurs',
      value: metrics?.userEngagement || 0,
      change: 8.7,
      changeType: 'increase',
      target: 85,
      unit: '%',
      color: 'from-purple-500 to-pink-500',
      icon: Users,
      trend: 'up',
      priority: 'high'
    },
    {
      label: 'Taux de Conversion',
      value: metrics?.conversionRate || 0,
      change: 12.3,
      changeType: 'increase',
      target: 20,
      unit: '%',
      color: 'from-orange-500 to-red-500',
      icon: Target,
      trend: 'up',
      priority: 'critical'
    },
    {
      label: 'Utilisation Experts',
      value: metrics?.expertUtilization || 0,
      change: 5.4,
      changeType: 'increase',
      target: 90,
      unit: '%',
      color: 'from-indigo-500 to-purple-500',
      icon: UserCheck,
      trend: 'up',
      priority: 'medium'
    },
    {
      label: 'Satisfaction Client',
      value: metrics?.clientSatisfaction || 0,
      change: 3.2,
      changeType: 'increase',
      target: 95,
      unit: '%',
      color: 'from-green-500 to-emerald-500',
      icon: Star,
      trend: 'stable',
      priority: 'high'
    }
  ], [metrics]);

  // ===== DONNÉES DE GRAPHIQUE =====
  
  const chartData: ChartData = useMemo(() => ({
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Revenus',
        data: [120, 180, 220, 280, 320, 260, 200],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Utilisateurs',
        data: [800, 1200, 1800, 2200, 2000, 1600, 1000],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  }), []);

  // ===== COMPOSANTS DE MÉTRIQUES =====
  
  const MetricCard = ({ metric }: { metric: MetricData }) => {
    const Icon = metric.icon;
    const isSelected = selectedMetric === metric.label;
    
    return (
      <Card 
        className={`hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
        }`}
        onClick={() => setSelectedMetric(isSelected ? null : metric.label)}
      >
        <CardContent className="p-6 relative overflow-hidden">
          {/* Gradient de fond */}
          <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMetricIcon(metric.trend)}</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  metric.changeType === 'increase' ? 'bg-green-100 text-green-700' : 
                  metric.changeType === 'decrease' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {metric.changeType === 'increase' ? <Plus className="w-3 h-3" /> : 
                   metric.changeType === 'decrease' ? <Minus className="w-3 h-3" /> : 
                   <Minus className="w-3 h-3" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {formatMetric(metric.value, metric.unit.includes('%') ? 'percentage' : 'number')}
              </p>
              
              {/* Barre de progression vers l'objectif */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Objectif: {metric.target}{metric.unit}</span>
                  <span>{((metric.value / metric.target) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Indicateur de priorité */}
              <div className="mt-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metric.priority === 'critical' ? 'bg-red-500' :
                  metric.priority === 'high' ? 'bg-orange-500' :
                  metric.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <span className="text-xs text-slate-500 capitalize">{metric.priority}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== COMPOSANT DE GRAPHIQUE SIMPLIFIÉ =====
  
  const SimpleChart = ({ data }: { data: ChartData }) => {
    const maxValue = Math.max(...data.datasets[0].data);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Évolution Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.datasets.map((dataset, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{dataset.label}</span>
                  <span className="text-sm text-slate-500">
                    {dataset.data[dataset.data.length - 1]}
                  </span>
                </div>
                <div className="flex items-end gap-1 h-20">
                  {dataset.data.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t"
                      style={{ 
                        height: `${(value / maxValue) * 100}%`,
                        opacity: 0.7 + (valueIndex / dataset.data.length) * 0.3
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  {data.labels.map((label, labelIndex) => (
                    <span key={labelIndex}>{label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== COMPOSANT DE PRÉDICTIONS IA =====
  
  const AIPredictions = () => {
    if (!insights) return null;
    
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Prédictions IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.revenueForecast && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Prévisions de Revenus
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatMetric(insights.revenueForecast.nextHour, 'currency')}
                  </div>
                  <div className="text-xs text-green-700">Prochaine heure</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {formatMetric(insights.revenueForecast.nextDay, 'currency')}
                  </div>
                  <div className="text-xs text-blue-700">Prochain jour</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {formatMetric(insights.revenueForecast.nextWeek, 'currency')}
                  </div>
                  <div className="text-xs text-purple-700">Prochaine semaine</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 text-center">
                Confiance: {(insights.revenueForecast.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}
          
          {insights.userBehavior && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Comportement Utilisateur
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Risque de churn</span>
                  <span className={`text-sm font-medium ${
                    insights.userBehavior.churnRisk < 5 ? 'text-green-600' :
                    insights.userBehavior.churnRisk < 10 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {insights.userBehavior.churnRisk?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Heures de pointe</span>
                  <div className="flex gap-1">
                    {insights.userBehavior.peakHours?.slice(0, 2).map((hour: string, index: number) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {hour}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ===== COMPOSANT DE SCORES COMPOSITES =====
  
  const CompositeScores = () => {
    if (!computedMetrics) return null;
    
    const scores = [
      {
        name: 'Santé Business',
        value: computedMetrics.scores?.businessHealth || 0,
        icon: Trophy,
        color: 'from-blue-500 to-cyan-500',
        description: 'Performance globale business'
      },
      {
        name: 'Santé Système',
        value: computedMetrics.scores?.systemHealth || 0,
        icon: Gauge,
        color: 'from-green-500 to-emerald-500',
        description: 'Performance technique'
      },
      {
        name: 'Santé Utilisateurs',
        value: computedMetrics.scores?.userHealth || 0,
        icon: Users,
        color: 'from-purple-500 to-pink-500',
        description: 'Engagement utilisateurs'
      }
    ];
    
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Scores Composites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scores.map((score, index) => {
            const Icon = score.icon;
            return (
              <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${score.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{score.name}</span>
                    <span className="text-lg font-bold text-slate-900">
                      {score.value.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{score.description}</p>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${score.color} transition-all duration-500`}
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Diamond className="w-6 h-6 text-blue-500" />
            Métriques Avancées
          </h2>
          <p className="text-slate-600">Analytics temps réel et prédictions IA</p>
        </div>
        
        <div className="flex items-center gap-2">
          {['1h', '6h', '24h', '7j'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advancedMetrics.map((metric, index) => (
          <div key={metric.label} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <MetricCard metric={metric} />
          </div>
        ))}
      </div>

      {/* Graphiques et prédictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart data={chartData} />
        <AIPredictions />
      </div>

      {/* Scores composites */}
      <CompositeScores />
    </div>
  );
};

export default AdvancedMetrics; 