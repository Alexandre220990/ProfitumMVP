import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, Users, UserCheck, FileText, DollarSign, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données réelles
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les KPIs globaux
        const { data: kpisData, error: kpisError } = await supabase
          .from('vue_admin_kpis_globaux')
          .select('*')
          .single();

        if (kpisError) throw kpisError;

        // Récupérer l'activité récente
        const { data: activityData, error: activityError } = await supabase
          .from('vue_admin_activite_globale')
          .select('*')
          .order('date_action', { ascending: false })
          .limit(10);

        if (activityError) throw activityError;

        // Récupérer les alertes
        const { data: alertsData, error: alertsError } = await supabase
          .from('vue_admin_alertes_globales')
          .select('*');

        if (alertsError) throw alertsError;

        // Récupérer les sessions actives
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('vue_sessions_actives_globale')
          .select('*');

        if (sessionsError) throw sessionsError;

        // Récupérer les KPIs dashboard v2
        const { data: dashboardKPIsData, error: dashboardKPIsError } = await supabase
          .from('vue_dashboard_kpis_v2')
          .select('*')
          .single();

        if (dashboardKPIsError) throw dashboardKPIsError;

        // Récupérer les sessions actives détaillées
        const { data: sessionsDetailData, error: sessionsDetailError } = await supabase
          .from('vue_sessions_actives')
          .select('*');

        if (sessionsDetailError) throw sessionsDetailError;

        setData({
          kpis: kpisData,
          activity: activityData || [],
          alerts: alertsData || [],
          sessions: sessionsData || [],
          dashboardKPIs: dashboardKPIsData || {},
          sessionsDetail: sessionsDetailData || []
        });
      } catch (err) {
        console.error('Erreur chargement données admin:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Fonction de rafraîchissement
  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Recharger les données
      const { data: kpisData, error: kpisError } = await supabase
        .from('vue_admin_kpis_globaux')
        .select('*')
        .single();

      if (kpisError) throw kpisError;

      const { data: activityData, error: activityError } = await supabase
        .from('vue_admin_activite_globale')
        .select('*')
        .order('date_action', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      const { data: alertsData, error: alertsError } = await supabase
        .from('vue_admin_alertes_globales')
        .select('*');

      if (alertsError) throw alertsError;

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('vue_sessions_actives_globale')
        .select('*');

      if (sessionsError) throw sessionsError;

      // Récupérer les KPIs dashboard v2
      const { data: dashboardKPIsData, error: dashboardKPIsError } = await supabase
        .from('vue_dashboard_kpis_v2')
        .select('*')
        .single();

      if (dashboardKPIsError) throw dashboardKPIsError;

      // Récupérer les sessions actives détaillées
      const { data: sessionsDetailData, error: sessionsDetailError } = await supabase
        .from('vue_sessions_actives')
        .select('*');

      if (sessionsDetailError) throw sessionsDetailError;

      setData({
        kpis: kpisData,
        activity: activityData || [],
        alerts: alertsData || [],
        sessions: sessionsData || [],
        dashboardKPIs: dashboardKPIsData || {},
        sessionsDetail: sessionsDetailData || []
      });
    } catch (err) {
      console.error('Erreur rafraîchissement données admin:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  };

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

  if (!data?.kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <span>Aucune donnée disponible</span>
      </div>
    );
  }

  const { kpis, activity, alerts, sessions, dashboardKPIs, sessionsDetail } = data;

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
            <div className="text-2xl font-bold">{(kpis.tauxCompletionGlobal || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Dossiers terminés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.tauxConversion || 0).toFixed(1)}%</div>
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
              {alerts.map((alert: any, index: number) => (
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
            {activity.slice(0, 10).map((item: any, index: number) => (
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
              {sessions.map((session: any, index: number) => (
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

      {/* KPIs Dashboard V2 */}
      {dashboardKPIs && Object.keys(dashboardKPIs).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>KPIs Système (V2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(dashboardKPIs).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions Actives Détaillées */}
      {sessionsDetail.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions Détaillées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionsDetail.map((session: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{session.userType || 'Utilisateur'}</span>
                    <span className="text-sm text-muted-foreground">
                      {session.sessionsActives || 0} session(s)
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.utilisateursUniques || 0} unique(s)
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
