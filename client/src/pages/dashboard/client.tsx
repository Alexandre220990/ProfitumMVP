import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { API_URL } from "@/config";
import {
  Loader2,
  PiggyBank,
  RefreshCcw,
  Rocket,
  RefreshCw,
  FolderOpen,
  DollarSign,
  BarChart3,
  AlertCircle,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { AuditTable } from "@/components/dashboard/AuditTable";
import { EmptyAuditState } from "@/components/dashboard/EmptyAuditState";
import { useDashboardClientEffects } from "@/hooks/useDashboardClientEffects";
import { useKpiData } from "@/hooks/useKpiData";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Audit, AuditStatus } from "@/types/audit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyEligibleProductsState } from "@/components/empty-eligible-products-state";

// Extension du type AuditStatus pour inclure "all"
type StatusType = AuditStatus | "all";

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  
  // Données de démonstration pour TICPE
  const demoAudits: Audit[] = [
    {
      id: "1",
      client_id: user?.id || "",
      expert_id: "1",
      audit_type: "TICPE",
      status: "en_cours",
      current_step: 2,
      potential_gain: 25000,
      obtained_gain: 0,
      reliability: 0,
      progress: 45,
      description: "Optimisation de la taxe intérieure sur les produits énergétiques",
      is_eligible_product: true,
      charter_signed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tauxFinal: 0.02,
      dureeFinale: 12
    }
  ];

  const {
    showWelcomeDialog,
    setShowWelcomeDialog,
    showSimulationDialog,
    setShowSimulationDialog,
    loadingTooLong,
    useFallbackData,
    setUseFallbackData,
    audits,
    isLoadingAudits,
    auditsError,
    refreshAudits,
    hasRecentSimulation
  } = useDashboardClientEffects();

  const kpiData = useKpiData(audits as Audit[]);

  const handleCloseDialog = useCallback(() => {
    setShowSimulationDialog(false);
    if (user?.id) {
      localStorage.removeItem(`hasRecentSimulation_${user.id}`);
    }
  }, [user, setShowSimulationDialog]);

  const handleSimulation = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/simulations/check-recent/${user?.id}`);
      const data = await response.json();
      
      if (data.success && data.data.simulation) {
        navigate(`/simulateur?simulationID=${data.data.simulation.id}`);
      } else {
        navigate('/simulateur');
      }
    } catch (error) {
      navigate('/simulateur');
    }
  }, [user, navigate]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    navigate(0);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    handleRefresh();
  }, [handleRefresh]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (value: StatusType) => {
    setStatusFilter(value);
  };

  const filteredAudits = (useFallbackData ? [
    {
      id: "1",
      client_id: user?.id || "",
      expert_id: "1",
      audit_type: "TICPE",
      status: "en_cours",
      current_step: 2,
      potential_gain: 25000,
      obtained_gain: 0,
      reliability: 0,
      progress: 45,
      description: "Optimisation de la taxe intérieure sur les produits énergétiques",
      is_eligible_product: true,
      charter_signed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tauxFinal: 0.02,
      dureeFinale: 12
    }
  ] : audits).filter((audit) => {
    const matchesSearch = audit.audit_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoadingAudits && !loadingTooLong) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        {isLoadingAudits && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setUseFallbackData(true)}
          >
            Utiliser des données de démonstration
          </Button>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6 text-center">
            Vous devez être connecté pour accéder à cette page.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => handleNavigation("/connexion-client")}
              className="w-full"
            >
              Se connecter
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleNavigation("/")}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (auditsError && !useFallbackData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Problème de chargement des données</h2>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">Une erreur est survenue lors du chargement des audits</p>
              <p className="text-gray-600 mt-2">Message d'erreur : {auditsError}</p>
            </div>
            
            <p className="text-gray-600 mb-6">
              Nous rencontrons actuellement des difficultés pour charger vos données. Vous pouvez :
            </p>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Button onClick={refreshAudits} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
                </Button>
                <Button 
                  onClick={() => setUseFallbackData(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <PiggyBank className="mr-2 h-4 w-4" /> Utiliser des données de démonstration
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation("/")}
                className="text-gray-500"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (Array.isArray(audits) && audits.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <HeaderClient />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          <div className="flex items-center gap-3">
            <SectionTitle 
              title="Bienvenue sur votre tableau de bord" 
              subtitle="Commencez par effectuer une simulation pour découvrir vos opportunités d'optimisation" 
            />
            <button
              onClick={refreshAudits}
              className="text-gray-600 hover:text-blue-600 transition duration-300 ml-auto"
              title="Rafraîchir les audits"
            >
              <RefreshCcw className="w-6 h-6" />
            </button>
          </div>

          <EmptyEligibleProductsState />
        </div>

        <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-blue-500" />
                Découvrez vos opportunités
              </DialogTitle>
              <DialogDescription>
                Effectuez une simulation rapide pour identifier les possibilités d'optimisation pour votre entreprise.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Cette simulation ne prendra que quelques minutes et vous permettra d'avoir une première estimation de vos gains potentiels.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSimulation}
                className="w-full"
              >
                Accéder à la simulation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <HeaderClient onLogout={handleLogout} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulation}
            className="text-gray-600 hover:text-blue-600 transition duration-300"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
          <SectionTitle title="Suivi de vos Audits" subtitle="Suivi en temps réel de vos dossiers et gains" />
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setUseFallbackData(true)}
              className="flex items-center gap-2"
            >
              <PiggyBank className="w-4 h-4" />
              Données de démonstration
            </Button>
            <button
              onClick={refreshAudits}
              className="text-gray-600 hover:text-blue-600 transition duration-300"
              title="Rafraîchir les audits"
            >
              <RefreshCcw className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex-1">
            <Label htmlFor="search">Rechercher un audit</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Rechercher par type ou description..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="status">Filtrer par statut</Label>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="non_démarré">Non démarré</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminé">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[
            { icon: FolderOpen, value: kpiData.dossiersEnCours, label: "Dossiers en cours", color: "text-blue-500" },
            {
              icon: DollarSign,
              component: (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-red-500 font-medium">Potentiel:</span>
                    <span className="text-lg">{kpiData.gainsPotentiels.toLocaleString()} €</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-green-500 font-medium">Obtenus:</span>
                    <span className="text-lg">{kpiData.gainsObtenus.toLocaleString()} €</span>
                  </div>
                </div>
              ),
              label: "Gains",
              color: "text-green-500"
            },
            { icon: PiggyBank, value: kpiData.auditsFinalises, label: "Audits finalisés", color: "text-indigo-500" },
            {
              icon: BarChart3,
              value: (
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={kpiData.avancementGlobal}
                    text={`${kpiData.avancementGlobal.toFixed(0)}%`}
                    styles={buildStyles({
                      textColor: "#1E293B",
                      pathColor: kpiData.avancementGlobal === 100 ? "#10B981" : "#3B82F6",
                      trailColor: "#E5E7EB",
                      textSize: "20px",
                    })}
                  />
                </div>
              ),
              label: "Avancement global",
              color: "text-purple-500"
            }
          ].map(({ icon, value, component, label, color }) => (
            <KpiCard key={label} icon={icon} value={value} component={component} label={label} color={color} />
          ))}
        </div>

        {!isLoadingAudits && !auditsError && filteredAudits.length === 0 ? (
          <EmptyAuditState hasRecentSimulation={hasRecentSimulation} />
        ) : (
          <AuditTable
            activeTab={statusFilter === "all" ? "opportunities" : 
                      statusFilter === "non_démarré" ? "opportunities" :
                      statusFilter === "en_cours" ? "pending" : "completed"}
            allDossiers={filteredAudits}
            user={user}
            onNewSimulation={handleSimulation}
            onViewDossier={(id, auditType) => {
              const produitNom = auditType || 'TICPE';
              handleNavigation(`/dossier-client/${produitNom}/${id}`);
            }}
            onViewAudit={(id) => handleNavigation(`/audit/${id}`)}
          />
        )}
      </div>

      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-blue-500" />
              Découvrez vos opportunités
            </DialogTitle>
            <DialogDescription>
              Effectuez une simulation rapide pour identifier les possibilités d'optimisation pour votre entreprise.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Cette simulation ne prendra que quelques minutes et vous permettra d'avoir une première estimation de vos gains potentiels.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowWelcomeDialog(false);
                if (user?.id) {
                  handleNavigation(`/chatbot/user?${user.id}`);
                } else {
                  handleNavigation('/chatbot');
                }
              }}
              className="w-full"
            >
              Commencer avec l'assistant IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simulation terminée</DialogTitle>
            <DialogDescription>
              Votre simulation a été effectuée avec succès, mais aucun audit n'a été créé. 
              Veuillez vérifier vos réponses ou contacter notre support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Fermer
            </Button>
            <Button onClick={() => handleNavigation('/simulateur')}>
              Refaire une simulation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loadingTooLong && !useFallbackData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Le chargement prend plus de temps que prévu. Voulez-vous utiliser les données en cache ?
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => setUseFallbackData(true)}>
                Utiliser les données en cache
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}