import { useApporteurAnalytics } from '../../hooks/use-apporteur-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, Users, UserCheck, FileText, DollarSign, AlertTriangle, Activity, Target, Calendar, MessageSquare, BarChart3, TrendingUp } from 'lucide-react';

interface ApporteurDashboardProps {
  apporteurId: string;
}

export function ApporteurDashboard({ apporteurId }: ApporteurDashboardProps) {
  const { 
    analytics, 
    loading, 
    error, 
    refresh, 
    getProspectsByStatus
  } = useApporteurAnalytics(apporteurId);

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

  if (!analytics.kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <span>Aucune donnée disponible</span>
      </div>
    );
  }

  const { kpis, activity, prospects, alerts } = analytics;

  // Statistiques des prospects
  const prospectsInactifs = getProspectsByStatus('inactif');
  const prospectsActifs = getProspectsByStatus('actif');
  const prospectsJamaisConnectes = getProspectsByStatus('jamais_connecte');

  // Alertes par sévérité (pour usage futur)
  // const alertesHigh = getAlertsBySeverity('high');
  // const alertesMedium = getAlertsBySeverity('medium');
  // const alertesLow = getAlertsBySeverity('low');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
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

        {/* Quick Actions Optimisées */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button className="h-20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">Nouveau Prospect</div>
              <div className="text-xs opacity-90">Ajouter un client</div>
            </div>
          </Button>
          <Button className="h-20 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">Planifier RDV</div>
              <div className="text-xs opacity-90">Créer un rendez-vous</div>
            </div>
          </Button>
          <Button className="h-20 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">Messagerie</div>
              <div className="text-xs opacity-90">Envoyer un message</div>
            </div>
          </Button>
          <Button className="h-20 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">Statistiques</div>
              <div className="text-xs opacity-90">Voir les analyses</div>
            </div>
          </Button>
        </div>

        {/* KPIs Cards Optimisées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Prospects */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Mes Prospects</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpis.mesProspects}</div>
              <p className="text-sm text-gray-600 mb-3">
                {kpis.prospectsQualifies} qualifiés • {kpis.nouveauxProspects30j} ce mois
              </p>
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% vs mois dernier
              </div>
            </CardContent>
          </Card>

          {/* Clients */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Mes Clients</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpis.mesClientsActifs}</div>
              <p className="text-sm text-gray-600 mb-3">
                {kpis.nouveauxClients30j} nouveaux ce mois
              </p>
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3 mr-1" />
                Actifs
              </div>
            </CardContent>
          </Card>

          {/* Dossiers */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Dossiers</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpis.dossiersMesClients}</div>
              <p className="text-sm text-gray-600 mb-3">
                {kpis.dossiersTerminesMesClients} terminés
              </p>
              <div className="flex items-center text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                <Activity className="h-3 w-3 mr-1" />
                En cours
              </div>
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Commissions</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(kpis.commissionsTotales)}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(kpis.commissionsPayees)} payées
              </p>
              <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3 mr-1" />
                En attente
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Optimisée */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-800 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Taux de Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700 mb-2">{kpis.tauxConversionProspects.toFixed(1)}%</div>
              <p className="text-sm text-green-600">Prospects → Clients</p>
              <div className="mt-3 bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(kpis.tauxConversionProspects, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-800 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-700 mb-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(kpis.montantTotalMesClients)}
              </div>
              <p className="text-sm text-blue-600">Dossiers de mes clients</p>
              <div className="mt-3 flex items-center text-sm text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                Chiffre d'affaires
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-purple-800 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Montant Réalisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-700 mb-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(kpis.montantRealiseMesClients)}
              </div>
              <p className="text-sm text-purple-600">Dossiers terminés</p>
              <div className="mt-3 flex items-center text-sm text-purple-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                Réalisé
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes Personnelles Optimisées */}
        {alerts.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-red-800">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                Mes Alertes ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
                        className="text-xs font-semibold"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-medium text-gray-900">{alert.message}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-red-600">{alert.nombre} éléments</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mes Prospects Optimisés */}
        {prospects.length > 0 && (
          <Card className="mb-8 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-gray-800">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Mes Prospects ({prospects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">{prospectsActifs.length}</div>
                  <div className="text-sm font-semibold text-green-700">Actifs</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{prospectsInactifs.length}</div>
                  <div className="text-sm font-semibold text-yellow-700">Inactifs</div>
                </div>
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600 mb-1">{prospectsJamaisConnectes.length}</div>
                  <div className="text-sm font-semibold text-gray-700">Jamais connectés</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {prospects.slice(0, 10).map((prospect, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={prospect.statutActivite === 'actif' ? 'default' : prospect.statutActivite === 'inactif' ? 'secondary' : 'outline'}
                        className="text-xs font-semibold"
                      >
                        {prospect.statutActivite}
                      </Badge>
                      <div>
                        <span className="font-semibold text-gray-900">{prospect.name}</span>
                        <div className="text-sm text-gray-600">{prospect.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{prospect.nbDossiers} dossiers</div>
                      <div className="text-sm text-gray-600">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(prospect.montantTotalDossiers)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activité Personnelle Optimisée */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-gray-800">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              Mon Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-xs font-semibold">{item.typeEntite}</Badge>
                    <div>
                      <span className="font-semibold text-gray-900">{item.nom}</span>
                      <div className="text-sm text-gray-600">{item.action}</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {new Date(item.dateAction).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}