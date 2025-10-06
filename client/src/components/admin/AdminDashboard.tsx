import { useAdminAnalytics } from '../../hooks/use-admin-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, Users, UserCheck, FileText, DollarSign, AlertTriangle, Activity } from 'lucide-react';

export function AdminDashboard() {
  const { analytics, loading, error, refresh } = useAdminAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
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

  const { kpis, activity, alerts, sessions } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.clientsActifs} actifs • {kpis.clientsCeMois} ce mois
            </p>
          </CardContent>
        </Card>

        {/* Experts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalExperts}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.expertsActifs} actifs • {kpis.expertsEnAttente} en attente
            </p>
          </CardContent>
        </Card>

        {/* Dossiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalDossiers}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.dossiersTermines} terminés • {kpis.dossiersEnCours} en cours
            </p>
          </CardContent>
        </Card>

        {/* Montants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montants</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(kpis.montantTotalGlobal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(kpis.montantRealiseGlobal)} réalisé
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tauxCompletionGlobal.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Dossiers terminés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tauxConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Prospects → Clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.produitsActifs}</div>
            <p className="text-xs text-muted-foreground">Produits disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertes ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'warning' ? 'default' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{alert.nombre} éléments</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activité Récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activity.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{item.typeEntite}</Badge>
                  <span className="font-medium">{item.nom}</span>
                  <span className="text-sm text-muted-foreground">{item.action}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(item.dateAction).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Actives */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessions.map((session, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{session.sessionsActives}</div>
                  <div className="text-sm text-muted-foreground">{session.userType}</div>
                  <div className="text-xs text-muted-foreground">
                    {session.utilisateursUniques} utilisateurs uniques
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
