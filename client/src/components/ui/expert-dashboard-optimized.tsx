import { useState, useEffect, useCallback } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  Users, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Phone,
  Mail,
  Euro,
  Target,
  Zap,
  CheckCircle,
  RefreshCw,
  ArrowUpRight,
  Star,
  Eye,
  Archive,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { get, put } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface PrioritizedDossier {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  productName: string;
  apporteurName: string;
  statut: string;
  montantFinal: number;
  priorityScore: number;
  urgenceScore: number;
  valeurScore: number;
  probabiliteScore: number;
  faciliteScore: number;
  nextAction: string;
  daysSinceLastContact: number;
}

interface Alert {
  id: string;
  type: 'critique' | 'important' | 'attention';
  category: string;
  title: string;
  description: string;
  clientName: string;
  productName?: string;
  actionLabel: string;
  actionUrl: string;
}

interface KPIs {
  clientsActifs: number;
  rdvCetteSemaine: number;
  dossiersEnCours: number;
  apporteursActifs: number;
}

interface Apporteur {
  id: string;
  company_name: string;
  email: string;
  prospectsActifs: number;
  clientsEnCours: number;
  dernierProspect: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const ExpertDashboardOptimized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prioritizedDossiers, setPrioritizedDossiers] = useState<PrioritizedDossier[]>([]);
  const [activeView, setActiveView] = useState<'all' | 'prospects' | 'clients'>('all');
  const [activeTable, setActiveTable] = useState<'urgences' | 'clients' | 'dossiers' | 'apporteurs' | null>(null);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [dossiersList, setDossiersList] = useState<any[]>([]);
  const [apporteursList, setApporteursList] = useState<any[]>([]);
  const alertsRef = React.useRef<HTMLDivElement>(null);

  // Charger toutes les données du dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Charger toutes les données en parallèle
      const [overviewRes, alertsRes, prioritizedRes] = await Promise.all([
        get<{ kpis: KPIs; apporteurs: Apporteur[] }>('/api/expert/dashboard/overview'),
        get<Alert[]>('/api/expert/dashboard/alerts'),
        get<PrioritizedDossier[]>('/api/expert/dashboard/prioritized')
      ]);

      if (overviewRes.success && overviewRes.data) {
        setKpis(overviewRes.data.kpis);
      }

      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data);
      }

      if (prioritizedRes.success && prioritizedRes.data) {
        setPrioritizedDossiers(prioritizedRes.data);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Charger les données du tableau filtrable
  useEffect(() => {
    const loadTableData = async () => {
      if (!activeTable || !user?.id) return;

      try {
        if (activeTable === 'clients') {
          const res = await get<any[]>('/api/expert/dashboard/clients-list');
          if (res.success && res.data) {
            setClientsList(res.data);
          }
        } else if (activeTable === 'dossiers') {
          const res = await get<any[]>('/api/expert/dashboard/dossiers-list');
          if (res.success && res.data) {
            setDossiersList(res.data);
          }
        } else if (activeTable === 'apporteurs') {
          const res = await get<any[]>('/api/expert/dashboard/apporteurs-list');
          if (res.success && res.data) {
            setApporteursList(res.data);
          }
        }
      } catch (error) {
        console.error('Erreur chargement tableau:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    loadTableData();
  }, [activeTable, user?.id]);

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard actualisé');
  };

  // Gérer les actions sur les alertes
  const handleMarkAlertRead = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await put(`/api/expert/alerts/${alertId}/read`, {});
      if (response.success) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        toast.success('Alerte marquée comme lue');
      }
    } catch (error) {
      toast.error('Erreur lors du marquage de l\'alerte');
    }
  };

  const handleArchiveAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await put(`/api/expert/alerts/${alertId}/archive`, {});
      if (response.success) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        toast.success('Alerte archivée');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'archivage de l\'alerte');
    }
  };

  // Filtrer les dossiers selon la vue active
  const filteredDossiers = prioritizedDossiers.filter(d => {
    if (activeView === 'all') return true;
    if (activeView === 'prospects') return d.statut === 'eligible';
    if (activeView === 'clients') return d.statut === 'en_cours';
    return true;
  });


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Expert</h1>
            <p className="text-gray-600">Pilotez votre activité commerciale</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* KPIs Cliquables - 6 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {/* KPI 1 : MES ALERTES */}
          <Card 
            className={`bg-gradient-to-br from-red-500 to-red-600 text-white cursor-pointer hover:shadow-lg transition-all ${alerts.length > 0 ? 'ring-4 ring-red-300 animate-pulse' : ''}`} 
            onClick={() => {
              setActiveTable(null);
              if (alertsRef.current) {
                alertsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Mes alertes</p>
                  <p className="text-3xl font-bold">{alerts.length}</p>
                  {alerts.length > 0 && (
                    <p className="text-xs text-red-200 mt-1">Actions requises</p>
                  )}
                </div>
                <div className="relative">
                  <Bell className="h-10 w-10 text-red-200" />
                  {alerts.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-700 text-white border-2 border-white">
                      {alerts.length}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI 2 : URGENCES */}
          <Card 
            className={`bg-gradient-to-br from-red-500 to-red-600 text-white cursor-pointer hover:shadow-lg transition-all ${activeTable === 'urgences' ? 'ring-4 ring-red-300' : ''}`} 
            onClick={() => setActiveTable(activeTable === 'urgences' ? null : 'urgences')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Urgences</p>
                  <p className="text-3xl font-bold">{prioritizedDossiers.length}</p>
                </div>
                <Zap className="h-10 w-10 text-red-200" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 3 : CLIENTS ACTIFS */}
          <Card 
            className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all ${activeTable === 'clients' ? 'ring-4 ring-blue-300' : ''}`} 
            onClick={() => setActiveTable(activeTable === 'clients' ? null : 'clients')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Clients actifs</p>
                  <p className="text-3xl font-bold">{kpis?.clientsActifs || 0}</p>
                </div>
                <Users className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 4 : RDV CETTE SEMAINE */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/expert/agenda')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">RDV cette semaine</p>
                  <p className="text-3xl font-bold">{kpis?.rdvCetteSemaine || 0}</p>
                </div>
                <Calendar className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 5 : DOSSIERS EN COURS */}
          <Card 
            className={`bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-all ${activeTable === 'dossiers' ? 'ring-4 ring-orange-300' : ''}`} 
            onClick={() => setActiveTable(activeTable === 'dossiers' ? null : 'dossiers')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Dossiers en cours</p>
                  <p className="text-3xl font-bold">{kpis?.dossiersEnCours || 0}</p>
                </div>
                <Briefcase className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 6 : APPORTEURS ACTIFS */}
          <Card 
            className={`bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-all ${activeTable === 'apporteurs' ? 'ring-4 ring-green-300' : ''}`} 
            onClick={() => setActiveTable(activeTable === 'apporteurs' ? null : 'apporteurs')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Apporteurs actifs</p>
                  <p className="text-3xl font-bold">{kpis?.apporteursActifs || 0}</p>
                </div>
                <Target className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🚨 ALERTES URGENTES */}
        <div ref={alertsRef}>
        {alerts.length > 0 && !activeTable && (
          <Card className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-900">Actions Urgentes ({alerts.length})</span>
                </div>
                <Badge className="bg-red-600 text-white">Attention requise</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {alerts.slice(0, 5).map((alert) => {
                const productLabel = alert.productName || 'Dossier';
                return (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all ${
                      alert.type === 'critique' ? 'bg-red-100 border-red-500 hover:bg-red-200' :
                      alert.type === 'important' ? 'bg-orange-100 border-orange-500 hover:bg-orange-200' :
                      'bg-yellow-100 border-yellow-500 hover:bg-yellow-200'
                    }`}
                    onClick={() => {
                      if (alert.actionUrl) {
                        navigate(alert.actionUrl);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600 mb-1">
                          <Badge className={
                            alert.type === 'critique' ? 'bg-red-600' :
                            alert.type === 'important' ? 'bg-orange-600' :
                            'bg-yellow-600'
                          }>
                            {alert.type === 'critique' ? '🔴' : alert.type === 'important' ? '🟠' : '🟡'}
                          </Badge>
                          <Badge variant="outline" className="bg-white/70 text-gray-700 border-dashed">
                            {productLabel}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-900 leading-tight">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {alert.clientName}
                        </p>
                        <p className="text-sm text-gray-700">
                          {alert.description}
                        </p>
                      </div>
                      <Button size="sm" className="shrink-0" onClick={() => navigate(alert.actionUrl)}>
                        {alert.actionLabel}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => handleMarkAlertRead(alert.id, e)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Marquer lue
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => handleArchiveAlert(alert.id, e)}
                        className="text-xs"
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archiver
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {alerts.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    + {alerts.length - 5} autre(s) alerte(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>

        {/* 📊 TABLEAUX FILTRABLES (selon KPI cliqué) */}

        {/* TABLEAU URGENCES : Dossiers à Traiter (Priorisés par Score) */}
        {activeTable === 'urgences' && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-600" />
                  <span>Dossiers à Traiter (Priorisés par Score)</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeView === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('all')}
                  >
                    Tous ({prioritizedDossiers.length})
                  </Button>
                  <Button
                    variant={activeView === 'prospects' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('prospects')}
                  >
                    Prospects ({prioritizedDossiers.filter(d => d.statut === 'eligible').length})
                  </Button>
                  <Button
                    variant={activeView === 'clients' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('clients')}
                  >
                    Clients ({prioritizedDossiers.filter(d => d.statut === 'en_cours').length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredDossiers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun dossier à traiter</p>
                </div>
              ) : (
                filteredDossiers.slice(0, 5).map((dossier, index) => (
                  <div 
                    key={dossier.id}
                    className="p-6 bg-white border-2 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        {/* Numéro de priorité */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{dossier.clientName}</h3>
                            <Badge variant="outline">{dossier.productName}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>{dossier.apporteurName}</strong> • Dernier contact il y a {dossier.daysSinceLastContact} jour(s)
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-orange-600" />
                              Urgence: {dossier.urgenceScore}/40
                            </span>
                            <span className="flex items-center gap-1">
                              <Euro className="h-4 w-4 text-green-600" />
                              Valeur: {dossier.valeurScore}/30
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-purple-600" />
                              Probabilité: {dossier.probabiliteScore}/20
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4 text-blue-600" />
                              Facilité: {dossier.faciliteScore}/10
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-100 text-purple-800">
                            <Star className="h-3 w-3 mr-1" />
                            Score: {dossier.priorityScore}/100
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {dossier.montantFinal.toLocaleString()}€
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions rapides */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Badge variant={dossier.statut === 'eligible' ? 'secondary' : 'default'}>
                          {dossier.statut === 'eligible' ? 'Prospect' : 'En cours'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {dossier.clientEmail}
                        </span>
                        <Badge variant="outline">{dossier.apporteurName}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${dossier.clientPhone}`;
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${dossier.clientEmail}`;
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          {dossier.nextAction}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* TABLEAU CLIENTS : Mes Clients Actifs */}
        {activeTable === 'clients' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Mes Clients Actifs ({clientsList.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientsList.length > 0 ? (
                <div className="space-y-3">
                  {clientsList.filter(client => client && client.id).map((client: any) => (
                    <div 
                      key={client.id} 
                      className="p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/expert/client/${client.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{client?.company_name || client?.name || 'Client inconnu'}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client?.email || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client?.phone_number || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {client?.dossiers_count || 0} dossier(s)
                            </span>
                            <Badge variant="outline">{client?.apporteur_name || 'Direct'}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={client?.status === 'prospect' ? 'secondary' : 'default'}>
                            {client?.status || 'inconnu'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Chargement des clients...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTable === 'dossiers' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-600" />
                <span>Mes Dossiers ({dossiersList.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dossiersList.length > 0 ? (
                <div className="space-y-3">
                  {dossiersList.filter(dossier => dossier && dossier.id).map((dossier) => (
                    <div 
                      key={dossier.id} 
                      className="p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{dossier?.client_name || 'Client inconnu'}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {dossier?.produit_nom || 'Produit'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Badge variant={dossier?.statut === 'eligible' ? 'secondary' : dossier?.statut === 'en_cours' ? 'default' : 'outline'}>
                              {dossier?.statut || 'inconnu'}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {dossier?.client_email || 'N/A'}
                            </span>
                            <Progress value={dossier?.progress || 0} className="w-20 h-1" />
                            <span>{dossier?.progress || 0}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            {(dossier?.montant || 0).toLocaleString()}€
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Priorité: {dossier?.priorite || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Chargement des dossiers...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTable === 'apporteurs' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Mes Apporteurs Partenaires ({apporteursList.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apporteursList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apporteursList.filter(apporteur => apporteur && apporteur.id).map((apporteur) => (
                    <div 
                      key={apporteur.id}
                      className="p-4 bg-gradient-to-br from-white to-green-50 border-2 border-green-100 rounded-lg hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{apporteur?.company_name || 'Apporteur'}</h4>
                          <p className="text-xs text-gray-500">{apporteur?.email || 'N/A'}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (apporteur?.email) {
                              window.location.href = `mailto:${apporteur.email}`;
                            }
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-500 text-xs">Prospects</p>
                          <p className="font-bold text-blue-600">{apporteur?.prospects_count || 0}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-500 text-xs">Clients</p>
                          <p className="font-bold text-green-600">{apporteur?.clients_count || 0}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-500 text-xs">Total</p>
                          <p className="font-bold text-purple-600">{apporteur?.total_dossiers || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun apporteur actif</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

