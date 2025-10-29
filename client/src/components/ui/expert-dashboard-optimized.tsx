import { useState, useEffect, useCallback } from "react";
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
  Clock,
  Phone,
  Mail,
  Euro,
  Target,
  Zap,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  FileText,
  ArrowUpRight,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { get } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface PrioritizedDossier {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  productName: string;
  apporteurName: string;
  statut: string;
  montantFinal: number;
  priorityScore: number;
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
  actionLabel: string;
  actionUrl: string;
}

interface RevenuePipeline {
  prospects: {
    count: number;
    montantTotal: number;
    montantPotentiel: number;
    probability: number;
  };
  enSignature: {
    count: number;
    montantTotal: number;
    montantPotentiel: number;
    probability: number;
  };
  signes: {
    count: number;
    montantTotal: number;
    commissionExpert: number;
  };
  totalPrevisionnel: number;
}

interface KPIs {
  clientsActifs: number;
  rdvCetteSemaine: number;
  dossiersEnCours: number;
  apporteursActifs: number;
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
  const [revenuePipeline, setRevenuePipeline] = useState<RevenuePipeline | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'prospects' | 'clients'>('all');

  // Charger toutes les données du dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Charger toutes les données en parallèle
      const [overviewRes, alertsRes, prioritizedRes, pipelineRes] = await Promise.all([
        get<{ kpis: KPIs }>('/api/expert/dashboard/overview'),
        get<Alert[]>('/api/expert/dashboard/alerts'),
        get<PrioritizedDossier[]>('/api/expert/dashboard/prioritized'),
        get<RevenuePipeline>('/api/expert/dashboard/revenue-pipeline')
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

      if (pipelineRes.success && pipelineRes.data) {
        setRevenuePipeline(pipelineRes.data);
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

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard actualisé');
  };

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

  const filteredDossiers = prioritizedDossiers.filter(d => {
    if (activeView === 'all') return true;
    if (activeView === 'prospects') return d.statut === 'eligible';
    if (activeView === 'clients') return d.statut === 'en_cours';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        
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

        {/* KPIs Cliquables */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveView('clients')}>
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

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveView('clients')}>
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

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-all">
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

        {/* 🚨 FEATURE 2 : ALERTES PROACTIVES (ACTIONS URGENTES) */}
        {alerts.length > 0 && (
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
            <CardContent className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'critique' ? 'bg-red-100 border-red-500' :
                    alert.type === 'important' ? 'bg-orange-100 border-orange-500' :
                    'bg-yellow-100 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={
                          alert.type === 'critique' ? 'bg-red-600' :
                          alert.type === 'important' ? 'bg-orange-600' :
                          'bg-yellow-600'
                        }>
                          {alert.type === 'critique' ? '🔴' : alert.type === 'important' ? '🟠' : '🟡'}
                        </Badge>
                        <span className="font-bold text-gray-900">{alert.title}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>{alert.clientName}</strong> • {alert.description}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => navigate(alert.actionUrl)}>
                      {alert.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 💰 FEATURE 3 : REVENUE PIPELINE (MONTANT RÉCUPÉRABLE POTENTIEL) */}
        {revenuePipeline && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-900">Pipeline de Revenus</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prospects */}
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">Prospects qualifiés</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {revenuePipeline.prospects.count} dossiers • {revenuePipeline.prospects.montantTotal.toLocaleString()}€
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {revenuePipeline.prospects.montantPotentiel.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-500">Potentiel {revenuePipeline.prospects.probability * 100}%</p>
                  </div>
                </div>
                <Progress value={revenuePipeline.prospects.probability * 100} className="h-2" />
              </div>

              {/* En signature */}
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-gray-900">En signature</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {revenuePipeline.enSignature.count} dossiers • {revenuePipeline.enSignature.montantTotal.toLocaleString()}€
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {revenuePipeline.enSignature.montantPotentiel.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-500">Potentiel {revenuePipeline.enSignature.probability * 100}%</p>
                  </div>
                </div>
                <Progress value={revenuePipeline.enSignature.probability * 100} className="h-2" />
              </div>

              {/* Signés */}
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-gray-900">Signés (sécurisés)</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {revenuePipeline.signes.count} dossiers • {revenuePipeline.signes.montantTotal.toLocaleString()}€
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {revenuePipeline.signes.commissionExpert.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-500">Commission 10%</p>
                  </div>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              {/* Total prévisionnel */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm mb-1">💵 TOTAL PRÉVISIONNEL CE TRIMESTRE</p>
                    <p className="text-xs text-emerald-200">Montant récupérable potentiel</p>
                  </div>
                  <p className="text-3xl font-bold">
                    {revenuePipeline.totalPrevisionnel.toLocaleString()}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🤝 SECTION MES APPORTEURS */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Mes Apporteurs Partenaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpis && kpis.apporteursActifs > 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">{kpis.apporteursActifs} apporteur(s) actif(s)</p>
                <p className="text-sm text-gray-500">Vos partenaires qui vous envoient des prospects</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun apporteur actif</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 🎯 FEATURE 1 : DOSSIERS PRIORISÉS (SCORE DE CLOSING) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
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
              filteredDossiers.map((dossier, index) => (
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
                      
                      {/* Infos client */}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{dossier.clientName}</h3>
                        <p className="text-gray-600 mb-2">{dossier.productName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{dossier.clientEmail}</span>
                          </div>
                          {dossier.clientPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{dossier.clientPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score et montant */}
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
                      <p className="text-xs text-gray-500">Potentiel</p>
                    </div>
                  </div>

                  {/* Barre d'infos */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          Contact il y a {dossier.daysSinceLastContact}j
                        </span>
                      </div>
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
                        title="Appeler le client"
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
                        title="Envoyer un email"
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
      </div>
    </div>
  );
};

