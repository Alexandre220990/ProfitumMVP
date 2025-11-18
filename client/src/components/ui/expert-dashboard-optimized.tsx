import { useState, useEffect, useCallback } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CabinetTeamManagement } from "@/components/cabinet/CabinetTeamManagement";
import { 
  Briefcase, 
  Users, 
  Calendar,
  AlertTriangle,
  Phone,
  Mail,
  Target,
  Zap,
  CheckCircle,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Archive,
  Bell,
  LayoutDashboard,
  UserCog,
  XCircle,
  Edit,
  ArrowUp,
  ArrowDown,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { get, put } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCabinetContext } from "@/hooks/useCabinetContext";

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
  daysWaitingDocuments?: number;
  documentRequestDate?: string;
  hasDocumentRequest?: boolean;
  hasPendingDocuments?: boolean;
  pendingDocumentsCount?: number;
  actionType?: 'documents_pending_validation' | 'documents_requested' | 'other';
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
  const { context: cabinetContext, loading: cabinetLoading } = useCabinetContext();
  
  // Debug: Log cabinet context
  useEffect(() => {
    if (cabinetContext) {
      console.log('🔍 Cabinet Context:', {
        hasContext: !!cabinetContext,
        permissions: cabinetContext.permissions,
        canManageMembers: cabinetContext.permissions?.canManageMembers,
        membership: cabinetContext.membership
      });
    } else if (!cabinetLoading) {
      console.log('⚠️ Pas de cabinet context pour cet expert');
    }
  }, [cabinetContext, cabinetLoading]);
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prioritizedDossiers, setPrioritizedDossiers] = useState<PrioritizedDossier[]>([]);
  const [activeTable, setActiveTable] = useState<'urgences' | 'clients' | 'dossiers' | 'apporteurs' | null>(null);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [dossiersList, setDossiersList] = useState<any[]>([]);
  const [apporteursList, setApporteursList] = useState<any[]>([]);
  const [rejectedAudits, setRejectedAudits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'team'>('dashboard');
  const alertsRef = React.useRef<HTMLDivElement>(null);
  
  // États pour les filtres des dossiers
  const [sortProgress, setSortProgress] = useState<'asc' | 'desc' | null>(null);
  const [sortMontant, setSortMontant] = useState<'asc' | 'desc' | null>(null);
  const [filterPriorityActions, setFilterPriorityActions] = useState<boolean>(false);

  // Charger toutes les données du dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Charger toutes les données en parallèle
      const [overviewRes, alertsRes, prioritizedRes, rejectedRes] = await Promise.all([
        get<{ kpis: KPIs; apporteurs: Apporteur[] }>('/api/expert/dashboard/overview'),
        get<Alert[]>('/api/expert/dashboard/alerts'),
        get<PrioritizedDossier[]>('/api/expert/dashboard/prioritized'),
        get<any[]>('/api/expert/dashboard/rejected-audits')
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

      if (rejectedRes.success && rejectedRes.data) {
        setRejectedAudits(rejectedRes.data);
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



  // Gérer le cas où l'expert n'a pas de cabinet (useCabinetContext peut retourner une erreur)
  const hasCabinet = cabinetContext !== null;

  if (loading || (cabinetLoading && hasCabinet)) {
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
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'dashboard' | 'team')}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg border border-gray-100/50">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`
                  relative flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium text-sm
                  transition-all duration-300 ease-out
                  ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  }
                `}
              >
                {activeTab === 'dashboard' && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-xl -z-10" />
                )}
                <LayoutDashboard className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400'}`} />
                <span className="relative z-10">Synthèse</span>
                {activeTab === 'dashboard' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/60 rounded-full" />
                )}
              </button>
              
              {cabinetContext?.permissions?.canManageMembers && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`
                    relative flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium text-sm
                    transition-all duration-300 ease-out
                    ${
                      activeTab === 'team'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    }
                  `}
                >
                  {activeTab === 'team' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl -z-10" />
                  )}
                  <UserCog className={`h-4 w-4 ${activeTab === 'team' ? 'text-white' : 'text-gray-400'}`} />
                  <span className="relative z-10">Gestion équipe</span>
                  {activeTab === 'team' && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/60 rounded-full" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* TabsList caché mais nécessaire pour le fonctionnement des TabsContent */}
          <TabsList className="hidden">
            <TabsTrigger value="dashboard">Synthèse</TabsTrigger>
            {cabinetContext?.permissions?.canManageMembers && (
              <TabsTrigger value="team">Gestion équipe</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
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

          {/* KPI 5 : MES DOSSIERS */}
          <Card 
            className={`bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-all ${activeTable === 'dossiers' ? 'ring-4 ring-orange-300' : ''}`} 
            onClick={() => setActiveTable(activeTable === 'dossiers' ? null : 'dossiers')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Mes dossiers</p>
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

        {/* 🔴 DOSSIERS REFUSÉS PAR LE CLIENT */}
        {rejectedAudits.length > 0 && !activeTable && (
          <Card className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-900">Audits Refusés ({rejectedAudits.length})</span>
                </div>
                <Badge className="bg-red-600 text-white">Action requise</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rejectedAudits.slice(0, 5).map((rejected) => (
                <div 
                  key={rejected.id}
                  className="p-4 rounded-xl border-l-4 border-red-500 bg-white hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-white text-gray-700">
                          {rejected.produitName}
                        </Badge>
                        {rejected.revisionNumber > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Révision #{rejected.revisionNumber}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          Il y a {rejected.daysSinceRejection} jour{rejected.daysSinceRejection > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">
                        {rejected.clientName}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Montant: {rejected.montantFinal.toLocaleString('fr-FR')} €
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                        <p className="text-xs font-semibold text-red-900 mb-1">Raison du refus :</p>
                        <p className="text-sm text-red-800">{rejected.rejectionReason}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="shrink-0 bg-red-600 hover:bg-red-700"
                      onClick={() => navigate(`/expert/dossier/${rejected.id}?action=revise`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Nouvelle proposition
                    </Button>
                  </div>
                </div>
              ))}
              
              {rejectedAudits.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    + {rejectedAudits.length - 5} autre(s) refus(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* TABLEAU URGENCES : Dossiers en cours */}
        {activeTable === 'urgences' && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-600" />
                  <span>Dossiers en cours</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {prioritizedDossiers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun dossier à traiter</p>
                </div>
              ) : (
                prioritizedDossiers.slice(0, 5).map((dossier, index) => {
                  const statutLabel = dossier.statut === 'eligible' ? 'Prospect' : 'En cours';
                  const statutVariant = dossier.statut === 'eligible' ? 'secondary' : 'default';
                  const nextActionLabel = dossier.nextAction || 'Voir dossier';
                  const canCall = Boolean(dossier.clientPhone);
                  const canEmail = Boolean(dossier.clientEmail);
                  
                  // Déterminer la couleur de la tuile selon le type d'action
                  const getTileBorderColor = () => {
                    if (dossier.actionType === 'documents_pending_validation') {
                      return 'border-orange-400 bg-orange-50/30'; // Orange pour documents en attente de validation
                    } else if (dossier.actionType === 'documents_requested') {
                      return 'border-blue-400 bg-blue-50/30'; // Bleu pour documents demandés
                    }
                    return 'border-gray-200 bg-white'; // Par défaut
                  };

                  return (
                    <div
                      key={dossier.id}
                      className={`p-5 border-2 rounded-2xl hover:shadow-md transition-all cursor-pointer ${getTileBorderColor()}`}
                      onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? 'bg-red-100 text-red-700'
                                : index === 1
                                ? 'bg-orange-100 text-orange-700'
                                : index === 2
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">{dossier.clientName}</h3>
                              <Badge variant="outline">{dossier.productName}</Badge>
                              <Badge variant={statutVariant}>{statutLabel}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {dossier.apporteurName} • Dernier contact il y a {dossier.daysSinceLastContact} jour(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-emerald-600 leading-tight">
                            {dossier.montantFinal.toLocaleString()}€
                          </p>
                        </div>
                      </div>

                      {/* Alerte documents en attente de validation (PRIORITÉ 1) */}
                      {dossier.hasPendingDocuments && dossier.pendingDocumentsCount && (
                        <div className="mt-3 p-3 rounded-lg border-2 bg-orange-50 border-orange-400">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 mt-0.5 text-orange-600" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-orange-800">
                                📋 Documents reçus, vérification à effectuer
                              </p>
                              <p className="text-xs mt-1 text-orange-700">
                                {dossier.pendingDocumentsCount} document{dossier.pendingDocumentsCount > 1 ? 's' : ''} en attente de validation par l'expert
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Alerte documents demandés (PRIORITÉ 2) - Relances système */}
                      {!dossier.hasPendingDocuments && dossier.hasDocumentRequest && dossier.daysWaitingDocuments !== undefined && (
                        <div className={`mt-3 p-3 rounded-lg border-2 ${
                          dossier.daysWaitingDocuments >= 15
                            ? 'bg-purple-50 border-purple-300'
                            : dossier.daysWaitingDocuments >= 10
                            ? 'bg-indigo-50 border-indigo-300'
                            : dossier.daysWaitingDocuments >= 5
                            ? 'bg-violet-50 border-violet-300'
                            : 'bg-slate-50 border-slate-300'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                              dossier.daysWaitingDocuments >= 15
                                ? 'text-purple-600'
                                : dossier.daysWaitingDocuments >= 10
                                ? 'text-indigo-600'
                                : dossier.daysWaitingDocuments >= 5
                                ? 'text-violet-600'
                                : 'text-slate-600'
                            }`} />
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${
                                dossier.daysWaitingDocuments >= 15
                                  ? 'text-purple-800'
                                  : dossier.daysWaitingDocuments >= 10
                                  ? 'text-indigo-800'
                                  : dossier.daysWaitingDocuments >= 5
                                  ? 'text-violet-800'
                                  : 'text-slate-800'
                              }`}>
                                {dossier.daysWaitingDocuments >= 15
                                  ? '⚠️ Relance 3 envoyée'
                                  : dossier.daysWaitingDocuments >= 10
                                  ? '⚠️ Relance 2 envoyée'
                                  : dossier.daysWaitingDocuments >= 5
                                  ? '⚠️ Relance 1 envoyée'
                                  : '📄 En attente documents client'}
                              </p>
                              <p className={`text-xs mt-1 ${
                                dossier.daysWaitingDocuments >= 15
                                  ? 'text-purple-700'
                                  : dossier.daysWaitingDocuments >= 10
                                  ? 'text-indigo-700'
                                  : dossier.daysWaitingDocuments >= 5
                                  ? 'text-violet-700'
                                  : 'text-slate-700'
                              }`}>
                                En attente de documents depuis {dossier.daysWaitingDocuments} jour{dossier.daysWaitingDocuments > 1 ? 's' : ''}
                                {dossier.daysWaitingDocuments >= 15 && (
                                  <span className="block mt-1 font-semibold">
                                    Si pas de retour dans les 5 prochains jours, l'expert se réserve le droit d'annuler la collaboration.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section "Prochaine action" - Masquée si une alerte est déjà affichée */}
                      {!(dossier.hasPendingDocuments || dossier.hasDocumentRequest) && (
                        <div className="mt-3 border-t pt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm text-gray-700">
                            <p className="font-medium text-gray-900">Prochaine action</p>
                            <p>{nextActionLabel}</p>
                          </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {canCall && (
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
                          )}
                          {canEmail && (
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
                          )}
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/expert/dossier/${dossier.id}`);
                            }}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            {nextActionLabel}
                          </Button>
                        </div>
                        </div>
                      )}
                    </div>
                  );
                })
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                  <span>Mes Dossiers ({dossiersList.length})</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Filtre Actions prioritaires */}
                  <Button
                    variant={filterPriorityActions ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterPriorityActions(!filterPriorityActions)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Actions prioritaires
                  </Button>
                  
                  {/* Tri par progression */}
                  <Button
                    variant={sortProgress ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (sortProgress === 'asc') {
                        setSortProgress('desc');
                      } else if (sortProgress === 'desc') {
                        setSortProgress(null);
                      } else {
                        setSortProgress('asc');
                      }
                      setSortMontant(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    Progression
                    {sortProgress === 'asc' && <ArrowUp className="h-4 w-4" />}
                    {sortProgress === 'desc' && <ArrowDown className="h-4 w-4" />}
                  </Button>
                  
                  {/* Tri par montant */}
                  <Button
                    variant={sortMontant ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (sortMontant === 'asc') {
                        setSortMontant('desc');
                      } else if (sortMontant === 'desc') {
                        setSortMontant(null);
                      } else {
                        setSortMontant('asc');
                      }
                      setSortProgress(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    Montant
                    {sortMontant === 'asc' && <ArrowUp className="h-4 w-4" />}
                    {sortMontant === 'desc' && <ArrowDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dossiersList.length > 0 ? (
                <div className="space-y-3">
                  {dossiersList
                    .filter(dossier => dossier && dossier.id)
                    .filter(dossier => {
                      // Filtre actions prioritaires
                      if (filterPriorityActions) {
                        return dossier.hasPriorityAction === true;
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      // Tri par progression
                      if (sortProgress === 'asc') {
                        return (a.progress || 0) - (b.progress || 0);
                      } else if (sortProgress === 'desc') {
                        return (b.progress || 0) - (a.progress || 0);
                      }
                      
                      // Tri par montant
                      if (sortMontant === 'asc') {
                        return (a.montant || 0) - (b.montant || 0);
                      } else if (sortMontant === 'desc') {
                        return (b.montant || 0) - (a.montant || 0);
                      }
                      
                      return 0;
                    })
                    .map((dossier) => (
                    <div 
                      key={dossier.id} 
                      className={`p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer ${
                        dossier.hasPriorityAction ? 'border-orange-400 bg-orange-50/30' : ''
                      }`}
                      onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{dossier?.client_name || 'Client inconnu'}</h4>
                            {dossier.hasPriorityAction && (
                              <Badge className="bg-orange-500 text-white">
                                Action requise
                              </Badge>
                            )}
                            {dossier.hasPendingAcceptance && (
                              <Badge className="bg-red-500 text-white">
                                Acceptation en attente
                              </Badge>
                            )}
                            {dossier.hasPendingDocuments && (
                              <Badge className="bg-yellow-500 text-white">
                                {dossier.pendingDocumentsCount} doc(s) à valider
                              </Badge>
                            )}
                            {dossier.hasAuditToSubmit && (
                              <Badge className="bg-blue-500 text-white">
                                Audit à soumettre
                              </Badge>
                            )}
                          </div>
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
          </TabsContent>

          <TabsContent value="team">
            <CabinetTeamManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

