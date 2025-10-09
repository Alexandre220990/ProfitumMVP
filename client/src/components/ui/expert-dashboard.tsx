import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonMeetingCard } from "@/components/ui/loading-skeleton";
import { 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Search,
  AlertCircle,
  Play,
  AlertTriangle,
  Star,
  Target,
  Zap,
  Award,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileSignature,
  CalendarDays,
  Timer,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ExpertRealDataService } from "@/services/expert-real-data-service";
import HeaderExpert from "@/components/HeaderExpert";
import { useNavigate } from "react-router-dom";
import { usePendingRDVs } from "@/hooks/use-rdv";
import { ExpertMeetingProposalCard } from "@/components/expert/ExpertMeetingProposalCard";

// Composant KPI Card ultra-optimisé
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
  subtitle?: string;
  onClick?: () => void;
}> = ({ title, value, icon, trend, color, subtitle, onClick }) => (
  <Card 
    className={`hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Composant Dossier Card ultra-détaillé
const DossierCard: React.FC<{
  dossier: any;
  onView: (id: string) => void;
  onAction: (id: string, action: string) => void;
}> = ({ dossier, onView, onAction }) => {
  const clientName = dossier.Client?.company_name || dossier.Client?.name || 'Client inconnu';
  const productName = dossier.ProduitEligible?.nom || 'Produit inconnu';
  const status = dossier.statut || 'en_cours';
  const progress = dossier.progress || 0;
  const montantFinal = dossier.montantFinal || 0;
  const currentStep = dossier.current_step || 0;
  const charteSigned = dossier.charte_signed || false;
  const priorite = dossier.priorite || 1;
  
  // Calculer l'âge du dossier
  const createdDate = new Date(dossier.created_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
  const isOverdue = daysDiff > 30;
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'eligible':
        return { label: 'Éligible', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'en_cours':
        return { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Play };
      case 'termine':
        return { label: 'Terminé', color: 'bg-purple-100 text-purple-800', icon: Award };
      case 'annule':
        return { label: 'Annulé', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
      default:
        return { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardContent className="p-6">
        {/* Header avec priorité et statut */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                {clientName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {productName}
              </p>
              <div className="flex items-center space-x-2">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {priorite > 2 && (
                  <Badge variant="destructive" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Priorité {priorite}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    En retard
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              €{montantFinal.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Gain potentiel
            </p>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{dossier.Client?.phone || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{dossier.Client?.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{dossier.Client?.city || 'Non renseigné'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CalendarDays className="w-4 h-4" />
              <span>Créé il y a {daysDiff} jours</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileSignature className="w-4 h-4" />
              <span>Charte {charteSigned ? 'signée' : 'non signée'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>Étape {currentStep}/5</span>
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Progression</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Timer className="w-4 h-4" />
            <span>Durée: {dossier.dureeFinale || 0} jours</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onView(dossier.id)}>
              <Eye className="w-4 h-4 mr-2" />
              Détails
            </Button>
            {status === 'en_cours' && (
              <Button size="sm" onClick={() => onAction(dossier.id, 'continue')}>
                <Play className="w-4 h-4 mr-2" />
                Continuer
              </Button>
            )}
            {status === 'eligible' && (
              <Button size="sm" onClick={() => onAction(dossier.id, 'start')}>
                <Zap className="w-4 h-4 mr-2" />
                Démarrer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant principal du Dashboard Expert Ultra-Optimisé
export const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Hook pour les RDV en attente
  const { pendingRDVs, loading: rdvLoading, refresh: refreshRDVs } = usePendingRDVs();

  // Charger les données réelles
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const service = new ExpertRealDataService(user.id);
        const result = await service.getAllData();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Erreur lors du chargement des données');
        }
      } catch (err) {
        console.error('Erreur chargement données expert:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Filtrage des dossiers
  const filteredDossiers = (data?.dossiers ?? []).filter((dossier: any) => {
    const clientName = dossier.Client?.company_name || dossier.Client?.name || 'Client inconnu';
    const productName = dossier.ProduitEligible?.nom || 'Produit inconnu';
    
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || dossier.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Fonction de rafraîchissement
  const refreshData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const service = new ExpertRealDataService(user.id);
      const result = await service.getAllData();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur rafraîchissement données expert:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  };

  // Actions sur les dossiers
  const handleViewDossier = (id: string) => {
    navigate(`/expert/dossier/${id}`);
  };

  const handleDossierAction = (id: string, action: string) => {
    console.log(`Action ${action} sur le dossier ${id}`);
    // Ici on peut implémenter les actions spécifiques
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HeaderExpert />
        <div className="flex items-center justify-center h-64 pt-24">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Chargement du dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HeaderExpert />
        <div className="flex items-center justify-center h-64 pt-24">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-2">Erreur lors du chargement</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderExpert />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* KPIs Principaux Ultra-Optimisés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Dossiers actifs"
            value={data?.dossiersActifs || 0}
            icon={<Briefcase className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100 dark:bg-blue-900/20"
            onClick={() => setFilterStatus('en_cours')}
          />
          <KPICard
            title="Gains du mois"
            value={`€${(data?.gainsDuMois || 0).toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            color="bg-green-100 dark:bg-green-900/20"
            onClick={() => navigate('/expert/analytics')}
          />
          <KPICard
            title="Taux de réussite"
            value={`${(data?.tauxReussite || 0).toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            color="bg-purple-100 dark:bg-purple-900/20"
          />
          <KPICard
            title="Opportunités"
            value={data?.opportunites || 0}
            icon={<Users className="w-6 h-6 text-orange-600" />}
            color="bg-orange-100 dark:bg-orange-900/20"
            onClick={() => setFilterStatus('eligible')}
          />
        </div>

        {/* RDV EN ATTENTE - NOUVEAU */}
        {!rdvLoading && pendingRDVs.length > 0 && (
          <div className="mb-8">
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900">Rendez-vous en attente ({pendingRDVs.length})</span>
                  </div>
                  <Badge className="bg-purple-600 text-white">Action requise</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rdvLoading ? (
                  <>
                    <SkeletonMeetingCard />
                    <SkeletonMeetingCard />
                  </>
                ) : (
                  <>
                    {pendingRDVs.slice(0, 3).map((rdv) => (
                    <ExpertMeetingProposalCard
                    key={rdv.id}
                    meeting={{
                      id: rdv.id,
                      client: {
                        name: rdv.Client?.name || 'Client',
                        company_name: rdv.Client?.company_name || ''
                      },
                      products: rdv.RDV_Produits?.map((rp: any) => ({
                        name: rp.ProduitEligible?.nom || 'Produit',
                        estimated_savings: 0
                      })) || [],
                      scheduled_date: rdv.scheduled_date,
                      scheduled_time: rdv.scheduled_time,
                      meeting_type: rdv.meeting_type,
                      location: rdv.location,
                      duration_minutes: rdv.duration_minutes,
                      notes: rdv.notes
                    }}
                    onAccept={async () => {
                      await refreshRDVs();
                      await refreshData();
                    }}
                    onPropose={async () => {
                      await refreshRDVs();
                      await refreshData();
                    }}
                  />
                    ))}
                  </>
                )}
                {!rdvLoading && pendingRDVs.length > 3 && (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/expert/agenda')}>
                    Voir tous les RDV en attente ({pendingRDVs.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertes et priorités */}
        {data?.dossiers && (
          <div className="mb-8 space-y-4">
            {data.dossiers.filter((d: any) => {
              const createdDate = new Date(d.created_at);
              const now = new Date();
              const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
              return d.statut === 'en_cours' && daysDiff > 30;
            }).length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      {data.dossiers.filter((d: any) => {
                        const createdDate = new Date(d.created_at);
                        const now = new Date();
                        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
                        return d.statut === 'en_cours' && daysDiff > 30;
                      }).length} dossier(s) en retard
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setFilterStatus('en_cours')}>
                      Voir les dossiers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {data.dossiers.filter((d: any) => d.priorite > 2).length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800">
                      {data.dossiers.filter((d: any) => d.priorite > 2).length} dossier(s) prioritaire(s)
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setFilterStatus('en_cours')}>
                      Voir les priorités
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tableau des dossiers avec 3 onglets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mes Dossiers</span>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un dossier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="eligible">
                  <Target className="h-4 w-4 mr-2" />
                  Opportunités ({data?.dossiers?.filter((d: any) => d.statut === 'eligible').length || 0})
                </TabsTrigger>
                <TabsTrigger value="en_cours">
                  <Play className="h-4 w-4 mr-2" />
                  En cours ({data?.dossiers?.filter((d: any) => d.statut === 'en_cours').length || 0})
                </TabsTrigger>
                <TabsTrigger value="termine">
                  <Award className="h-4 w-4 mr-2" />
                  Terminés ({data?.dossiers?.filter((d: any) => d.statut === 'termine').length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Contenu des onglets */}
              <div className="space-y-4">
                {filteredDossiers.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredDossiers.map((dossier: any) => (
                      <DossierCard
                        key={dossier.id}
                        dossier={dossier}
                        onView={handleViewDossier}
                        onAction={handleDossierAction}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                      {filterStatus === "eligible" && <Target className="h-16 w-16 mx-auto" />}
                      {filterStatus === "en_cours" && <Play className="h-16 w-16 mx-auto" />}
                      {filterStatus === "termine" && <Award className="h-16 w-16 mx-auto" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm 
                        ? 'Aucun dossier trouvé'
                        : filterStatus === 'eligible' ? 'Aucune opportunité disponible'
                        : filterStatus === 'en_cours' ? 'Aucun dossier en cours'
                        : 'Aucun dossier terminé'
                      }
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Les nouveaux dossiers apparaîtront ici'
                      }
                    </p>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 