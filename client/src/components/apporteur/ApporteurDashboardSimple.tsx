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

  // Données de fallback
  const prospects = analytics.prospects || [];
  const prospectsActifs = getProspectsByStatus('active');

  // Utiliser les données enrichies si disponibles, sinon fallback
  const dashboardData = hasEnhancedData ? {
    total_prospects: stats.totalProspects,
    total_active_clients: stats.totalClients,
    nouveaux_clients_30j: stats.nouveaux30j,
    total_montant_demande: stats.montantTotal,
    taux_conversion_pourcent: stats.tauxConversion,
    dossiers_acceptes: stats.dossiersAcceptes
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Mon Dashboard</h1>
              <p className="text-gray-600 mt-1">Bienvenue, voici un aperçu de votre activité</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={refresh} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Users className="h-4 w-4 mr-2" />
                Nouveau Prospect
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques principales - Données enrichies */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.total_prospects}
              </div>
              <p className="text-xs text-muted-foreground">
                Prospects totaux
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.total_active_clients}
              </div>
              <p className="text-xs text-muted-foreground">
                Clients convertis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux 30j</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.nouveaux_clients_30j}
              </div>
              <p className="text-xs text-muted-foreground">
                Prospects récents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.total_montant_demande 
                  ? `${(dashboardData.total_montant_demande / 1000).toFixed(0)}K€`
                  : '0€'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Montant total demandé
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs et Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.taux_conversion_pourcent}%
              </div>
              <p className="text-xs text-muted-foreground">
                Prospects → Clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dossiers Acceptés</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.dossiers_acceptes}
              </div>
              <p className="text-xs text-muted-foreground">
                Dossiers validés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasEnhancedData && objectivesData ? `${objectivesData.realisationCommission.toFixed(0)}€` : '0€'}
              </div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des prospects enrichie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mes Prospects</CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Voir tout
              </Button>
            </CardHeader>
            <CardContent>
              {prospectsData.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun prospect pour le moment</p>
                  <Button className="mt-4">
                    <Users className="h-4 w-4 mr-2" />
                    Ajouter un prospect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {prospectsData.slice(0, 5).map((prospect: any) => (
                    <div key={prospect.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium">{prospect.nom || prospect.name}</h4>
                        <p className="text-sm text-gray-500">{prospect.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={prospect.statut === 'active' ? 'default' : 'secondary'}>
                            {prospect.statut}
                          </Badge>
                          <Badge variant="outline">
                            {prospect.nbDossiers || 0} dossiers
                          </Badge>
                          {(prospect.montantTotal || 0) > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              {prospect.montantTotal.toFixed(0)}€
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {prospectsData.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline">
                        Voir tous les prospects ({prospectsData.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              {activityData.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune activité récente</p>
                  <p className="text-sm text-gray-400 mt-2">
                    L'historique des actions apparaîtra ici
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityData.slice(0, 5).map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'nouveau_client' && <Users className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'nouveau_dossier' && <BarChart3 className="h-4 w-4 text-green-500" />}
                        {activity.type === 'dossier_accepte' && <Award className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.libelle}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {activity.montant > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          {activity.montant}€
                        </Badge>
                      )}
                    </div>
                  ))}
                  {activityData.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        Voir toute l'activité
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Objectifs et Performance */}
        {objectivesData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objectifs et Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {objectivesData.objectifProspects}
                  </div>
                  <p className="text-sm text-gray-600">Objectif Prospects</p>
                  <p className="text-xs text-gray-500">Ce mois</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {objectivesData.objectifConversion}%
                  </div>
                  <p className="text-sm text-gray-600">Objectif Conversion</p>
                  <p className="text-xs text-gray-500">Taux cible</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {objectivesData.objectifCommission}€
                  </div>
                  <p className="text-sm text-gray-600">Objectif Commission</p>
                  <p className="text-xs text-gray-500">Ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages d'information */}
        <div className="mt-6 space-y-4">
          {!hasEnhancedData && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <h3 className="font-medium text-orange-900 mb-1">Données avancées non disponibles</h3>
                  <p className="text-orange-700 text-sm">
                    Les vues enrichies ne sont pas encore déployées. Utilisation des données de base.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className={`border-2 ${hasEnhancedData ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${hasEnhancedData ? 'text-green-500' : 'text-blue-500'}`} />
                <h3 className={`font-medium mb-1 ${hasEnhancedData ? 'text-green-900' : 'text-blue-900'}`}>
                  {hasEnhancedData ? 'Dashboard Enrichi Actif' : 'Dashboard Optimisé'}
                </h3>
                <p className={`text-sm ${hasEnhancedData ? 'text-green-700' : 'text-blue-700'}`}>
                  {hasEnhancedData 
                    ? 'Utilisation des vues SQL corrigées pour des données complètes et précises.'
                    : 'Cette version utilise les nouvelles vues SQL corrigées pour des données plus précises et complètes.'
                  }
                  {enhancedLoading && " Chargement des données enrichies..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
