import React, { useState } from 'react';
import { useBusinessPipeline } from '@/hooks/use-business-pipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/design-system/Card';
import Button from '@/components/ui/design-system/Button';
import Badge from '@/components/ui/design-system/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  MessageSquare,
  BookOpen,
  BarChart3,
  Brain,
  Crown,
  Zap,
  PieChart
} from 'lucide-react';

// ============================================================================
// DASHBOARD BUSINESS PIPELINE RÉVOLUTIONNAIRE
// ============================================================================
// Calé sur le workflow existant avec prédictions IA et métriques business

interface BusinessPipelineDashboardProps {
  onActionClick?: (action: string) => void;
}

export const BusinessPipelineDashboard: React.FC<BusinessPipelineDashboardProps> = ({ 
  onActionClick 
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'predictions' | 'products' | 'actions'>('pipeline');
  
  const {
    metrics,
    isLoading,
    error,
    lastUpdated,
    getStepProgress,
    businessConfig
  } = useBusinessPipeline({
    autoRefresh: true,
    refreshInterval: 30000,
    enablePredictions: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <span>Aucune donnée disponible</span>
        </CardContent>
      </Card>
    );
  }

  // ===== COMPOSANTS DE MÉTRIQUES =====

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color = 'blue',
    subtitle,
    onClick
  }: any) => (
    <Card className={`cursor-pointer transition-all hover:shadow-lg ${onClick ? 'hover:scale-105' : ''}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
        {change && (
          <div className="flex items-center mt-2">
            {changeType === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const PipelineStepCard = ({ stepName, stepData }: any) => {
    const progress = getStepProgress(stepName);
    const isAtRisk = stepData.dealsAtRisk > 0;
    
    return (
      <Card className={`${isAtRisk ? 'border-orange-200 bg-orange-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAtRisk ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
              <h3 className="font-semibold text-sm">{stepName}</h3>
              {isAtRisk && <AlertTriangle className="h-4 w-4 text-orange-600" />}
            </div>
            <Badge variant={isAtRisk ? 'error' : 'base'}>
              {stepData.count}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Valeur</span>
              <span className="font-medium">{stepData.value.toLocaleString()}€</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span>Conversion</span>
              <span className="font-medium">{stepData.conversionRate.toFixed(1)}%</span>
            </div>
            
            {isAtRisk && (
              <div className="flex justify-between text-xs text-orange-600">
                <span>À risque</span>
                <span className="font-medium">{stepData.dealsAtRisk}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const PredictionCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend }: any) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full bg-${color}-100`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center">
            <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionButton = ({ title, icon: Icon, color = 'blue' }: any) => (
    <Button
      variant="secondary"
      className={`w-full justify-start space-x-2 hover:bg-${color}-50 hover:border-${color}-300`}
      onClick={() => onActionClick?.(title.toLowerCase())}
    >
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </Button>
  );

  // ===== RENDU PRINCIPAL =====

  return (
    <div className="space-y-6">
      {/* Header avec KPIs critiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Objectif Mensuel"
          value={`${metrics.currentAchievement}/${metrics.monthlyTarget}`}
          change={`${metrics.targetAchievement.toFixed(1)}%`}
          changeType={metrics.targetAchievement >= 100 ? 'up' : 'down'}
          icon={Target}
          color={metrics.targetAchievement >= 100 ? 'green' : 'orange'}
          subtitle="ClientProduitsEligibles"
        />
        
        <MetricCard
          title="Pipeline Total"
          value={`${metrics.totalPipelineValue.toLocaleString()}€`}
          icon={DollarSign}
          color="blue"
          subtitle="Valeur estimée"
        />
        
        <MetricCard
          title="Experts Actifs"
          value={metrics.salesForce.activeExperts}
          icon={Users}
          color="purple"
          subtitle="Force de vente"
        />
        
        <MetricCard
          title="Score IA"
          value={`${metrics.predictions.confidenceScore.toFixed(1)}%`}
          icon={Brain}
          color="indigo"
          subtitle="Confiance prédiction"
        />
      </div>

      {/* Navigation par onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'pipeline', label: 'Pipeline', icon: BarChart3 },
          { id: 'predictions', label: 'Prédictions', icon: Brain },
          { id: 'products', label: 'Produits', icon: PieChart },
          { id: 'actions', label: 'Actions', icon: Zap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Pipeline par étapes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Pipeline par Étapes</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Mis à jour: {lastUpdated?.toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Object.entries(metrics.pipelineByStep).map(([stepName, stepData], index) => (
                <PipelineStepCard
                  key={stepName}
                  stepName={stepName}
                  stepData={stepData}
                  stepIndex={index}
                />
              ))}
            </div>
          </div>

          {/* Alertes critiques */}
          {metrics.alerts.bottlenecks.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Goulots d'étranglement détectés</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {metrics.alerts.bottlenecks.map((alert, index) => (
                    <li key={index} className="text-sm text-orange-700">• {alert}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PredictionCard
              title="Deals Fin de Mois"
              value={metrics.predictions.endOfMonthDeals}
              icon={Target}
              subtitle="Prédiction IA"
              trend={((metrics.predictions.endOfMonthDeals - metrics.monthlyTarget) / metrics.monthlyTarget) * 100}
            />
            
            <PredictionCard
              title="Revenus Prévus"
              value={`${metrics.predictions.endOfMonthRevenue.toLocaleString()}€`}
              icon={DollarSign}
              subtitle="Estimation"
            />
            
            <PredictionCard
              title="Dossiers à Risque"
              value={metrics.predictions.dealsAtRisk}
              icon={AlertTriangle}
              color="orange"
              subtitle="Intervention requise"
            />
          </div>

          {/* Recommandations IA */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Brain className="h-5 w-5" />
                <span>Recommandations IA</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Objectif recommandé mois prochain:</span>
                  <Badge variant="base" className="text-blue-600">
                    {metrics.predictions.recommendedTarget} deals
                  </Badge>
                </div>
                
                {metrics.alerts.opportunities.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800">Opportunités:</p>
                    {metrics.alerts.opportunities.map((opportunity, index) => (
                      <p key={index} className="text-sm text-blue-700">• {opportunity}</p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics.productDistribution).map(([productName, productData]) => (
              <Card key={productName}>
                <CardHeader>
                  <CardTitle className="text-lg">{productName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dossiers actifs</span>
                      <span className="font-medium">{productData.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valeur pipeline</span>
                      <span className="font-medium">{productData.value.toLocaleString()}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cycle moyen</span>
                      <span className="font-medium">{businessConfig.salesCycles[productName as keyof typeof businessConfig.salesCycles]} jours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-6">
          {/* Actions rapides */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionButton
                title="Nouveau Client"
                icon={Plus}
                color="green"
              />
              <QuickActionButton
                title="Nouvel Expert"
                icon={Users}
                color="blue"
              />
              <QuickActionButton
                title="Messagerie Admin"
                icon={MessageSquare}
                color="purple"
              />
              <QuickActionButton
                title="Documentation"
                icon={BookOpen}
                color="indigo"
              />
            </div>
          </div>

          {/* Actions recommandées */}
          {metrics.alerts.actions.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Zap className="h-5 w-5" />
                  <span>Actions Recommandées</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {metrics.alerts.actions.map((action, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-blue-700">
                      <ArrowRight className="h-4 w-4" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Force de vente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Force de Vente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{metrics.salesForce.activeExperts}</p>
                  <p className="text-sm text-gray-600">Experts actifs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{metrics.salesForce.subscriptionRevenue}€</p>
                  <p className="text-sm text-gray-600">Revenus abonnements</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">1+</p>
                  <p className="text-sm text-gray-600">Expert par produit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 