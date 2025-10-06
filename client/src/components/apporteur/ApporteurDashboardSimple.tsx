import { useApporteurSimple } from '../../hooks/use-apporteur-simple';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, Users, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface ApporteurDashboardSimpleProps {
  apporteurId: string;
}

export function ApporteurDashboardSimple({ apporteurId }: ApporteurDashboardSimpleProps) {
  const { 
    analytics, 
    loading, 
    error, 
    refresh,
    getProspectsByStatus
  } = useApporteurSimple(apporteurId);

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

  const prospects = analytics.prospects || [];
  const prospectsActifs = getProspectsByStatus('active');

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

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Prospects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prospects.length}</div>
              <p className="text-xs text-muted-foreground">
                Total de vos prospects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects Actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prospectsActifs.length}</div>
              <p className="text-xs text-muted-foreground">
                Prospects en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {prospects.filter(p => {
                  const created = new Date(p.createdAt);
                  const now = new Date();
                  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                  return diffDays <= 30;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Prospects ajoutés récemment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Clients convertis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des prospects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes Prospects</CardTitle>
            </CardHeader>
            <CardContent>
              {prospects.length === 0 ? (
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
                  {prospects.slice(0, 5).map((prospect) => (
                    <div key={prospect.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{prospect.name || prospect.companyName}</h4>
                        <p className="text-sm text-gray-500">{prospect.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={prospect.statutActivite === 'active' ? 'default' : 'secondary'}>
                            {prospect.statutActivite}
                          </Badge>
                          <Badge variant="outline">
                            {prospect.anciennete}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {prospects.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline">
                        Voir tous les prospects ({prospects.length})
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
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune activité récente</p>
                <p className="text-sm text-gray-400 mt-2">
                  L'historique des actions apparaîtra ici
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message d'information */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-2">Dashboard en cours de développement</h3>
              <p className="text-gray-600 text-sm">
                Cette version simplifiée utilise les données de base disponibles. 
                Les fonctionnalités avancées seront ajoutées progressivement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
