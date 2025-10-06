import { useApporteurSimple } from '../../hooks/use-apporteur-simple';
import { useApporteurEnhanced } from '../../hooks/use-apporteur-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, Users, TrendingUp, Calendar, DollarSign, BarChart3, Target, Award, Activity, Eye } from 'lucide-react';

interface ApporteurDashboardSimpleProps {
  apporteurId: string;
}

export function ApporteurDashboardSimple({ apporteurId }: ApporteurDashboardSimpleProps) {
  // Hook pour les données de base (fallback)
  const { 
    analytics, 
    loading: basicLoading, 
    error: basicError, 
    refresh: refreshBasic,
    getProspectsByStatus
  } = useApporteurSimple(apporteurId);

  // Hook pour les données enrichies depuis les vues SQL
  const {
    stats,
    objectives,
    recentActivity,
    enrichedProspects,
    loading: enhancedLoading,
    error: enhancedError,
    refresh: refreshEnhanced,
    hasEnhancedData,
    isLoading,
    hasError
  } = useApporteurEnhanced(apporteurId);

  // Utiliser les données enrichies si disponibles, sinon fallback sur les données de base
  const loading = isLoading || basicLoading;
  const error = hasError ? enhancedError : basicError;
  const refresh = () => {
    refreshEnhanced();
    refreshBasic();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de vos données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Erreur: {error}</span>
        <Button onClick={refresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  // Données réelles ou 0 si vide, logs si erreur
  const prospects = analytics.prospects || [];
  const prospectsActifs = getProspectsByStatus('active');

  // Utiliser les données enrichies si disponibles, sinon données réelles avec 0 si vide
  const dashboardData = hasEnhancedData ? {
    total_prospects: stats.totalProspects || 0,
    total_active_clients: stats.totalClients || 0,
    nouveaux_clients_30j: stats.nouveaux30j || 0,
    total_montant_demande: stats.montantTotal || 0,
    taux_conversion_pourcent: stats.tauxConversion || 0,
    dossiers_acceptes: stats.dossiersAcceptes || 0
  } : {
    total_prospects: prospects.length,
    total_active_clients: prospectsActifs.length,
    nouveaux_clients_30j: prospects.filter(p => {
      const created = new Date(p.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length,
    total_montant_demande: 0,
    taux_conversion_pourcent: 0,
    dossiers_acceptes: 0
  };

  const prospectsData = hasEnhancedData ? enrichedProspects : prospects;
  const activityData = hasEnhancedData ? recentActivity : [];
  const objectivesData = hasEnhancedData ? objectives : null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Compact */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Aperçu de votre activité</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Users className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Statistiques principales - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prospects</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_prospects}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_active_clients}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nouveaux</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.nouveaux_clients_30j}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Montant</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.total_montant_demande 
                      ? `${(dashboardData.total_montant_demande / 1000).toFixed(0)}K€`
                      : '0€'
                    }
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.taux_conversion_pourcent}%</p>
                </div>
                <Target className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dossiers</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.dossiers_acceptes}</p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal en 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Prospects récents */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Prospects Récents</CardTitle>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {prospectsData.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucun prospect</p>
                </div>
              ) : (
                <div className="divide-y">
                  {prospectsData.slice(0, 4).map((prospect: any) => (
                    <div key={prospect.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{prospect.nom || prospect.name}</h4>
                          <p className="text-xs text-gray-500">{prospect.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={prospect.statut === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {prospect.statut}
                          </Badge>
                          {(prospect.montantTotal || 0) > 0 && (
                            <span className="text-xs font-medium text-green-600">
                              {prospect.montantTotal.toFixed(0)}€
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Activité</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityData.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucune activité</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {activityData.slice(0, 4).map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'nouveau_client' && <Users className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'nouveau_dossier' && <BarChart3 className="h-4 w-4 text-green-500" />}
                        {activity.type === 'dossier_accepte' && <Award className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{activity.libelle}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                      {activity.montant > 0 && (
                        <span className="text-xs font-medium text-green-600">
                          {activity.montant}€
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Objectifs et Messages d'information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Objectifs */}
          {objectivesData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Objectifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {objectivesData.objectifProspects}
                    </div>
                    <p className="text-xs text-gray-600">Prospects</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {objectivesData.objectifConversion}%
                    </div>
                    <p className="text-xs text-gray-600">Conversion</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {objectivesData.objectifCommission}€
                    </div>
                    <p className="text-xs text-gray-600">Commission</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card className={`border-2 ${hasEnhancedData ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${hasEnhancedData ? 'text-green-500' : 'text-blue-500'}`} />
                <h3 className={`font-medium mb-1 text-sm ${hasEnhancedData ? 'text-green-900' : 'text-blue-900'}`}>
                  {hasEnhancedData ? 'Dashboard Enrichi Actif' : 'Dashboard Optimisé'}
                </h3>
                <p className={`text-xs ${hasEnhancedData ? 'text-green-700' : 'text-blue-700'}`}>
                  {hasEnhancedData 
                    ? 'Vues SQL enrichies actives'
                    : 'Prêt pour les vues SQL enrichies'
                  }
                  {enhancedLoading && " Chargement..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
