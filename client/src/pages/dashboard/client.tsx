import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { API_URL } from "@/config";
import { Loader2, PiggyBank, Rocket, RefreshCw, FolderOpen, DollarSign, BarChart3, AlertCircle, TrendingUp, CheckCircle } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard } from "@/components/ui/design-system/Card";
import Badge from "@/components/ui/design-system/Badge";
import HeaderClient from "@/components/HeaderClient";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { AuditTable } from "@/components/dashboard/AuditTable";
import { EmptyAuditState } from "@/components/dashboard/EmptyAuditState";
import { useDashboardClientEffects } from "@/hooks/useDashboardClientEffects";
import { useKpiData } from "@/hooks/useKpiData";
import "react-circular-progressbar/dist/styles.css";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Audit } from "@/types/audit";
import { EmptyEligibleProductsState } from "@/components/empty-eligible-products-state";

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { showSimulationDialog, setShowSimulationDialog, loadingTooLong, useFallbackData, setUseFallbackData, audits, isLoadingAudits, auditsError, refreshAudits, hasRecentSimulation } = useDashboardClientEffects();

  const kpiData = useKpiData(audits as Audit[]);

  // Mapping des types d'audit vers les URLs des pages de produits
  const auditTypeToProductUrl = (auditType: string, clientProduitId: string): string => {
    const mapping: Record<string, string> = {
      'TICPE': `/produits/ticpe/${clientProduitId}`,
      'URSSAF': `/produits/urssaf/${clientProduitId}`,
      'DFS': `/produits/dfs/${clientProduitId}`,
      'FONCIER': `/produits/foncier/${clientProduitId}`,
      'MSA': `/produits/msa/${clientProduitId}`,
      'CIR': `/produits/cir/${clientProduitId}`,
      'SOCIAL': `/produits/social/${clientProduitId}`,
      'AUDIT_ENERGETIQUE': `/produits/audit_energetique/${clientProduitId}`,
    };
    
    // Normaliser le type d'audit (majuscules, supprimer les espaces)
    const normalizedType = auditType.toUpperCase().replace(/\s+/g, '_');
    
    return mapping[normalizedType] || `/dossier-client/${auditType}/${clientProduitId}`;
  };

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

  const filteredAudits = useFallbackData ? [
    { id: "1", client_id: user?.id || "", expert_id: "1", audit_type: "TICPE", status: "en_cours", current_step: 2, potential_gain: 25000, obtained_gain: 0, reliability: 0, progress: 45, description: "Optimisation de la taxe intérieure sur les produits énergétiques", is_eligible_product: true, charter_signed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tauxFinal: 0.02, dureeFinale: 12 }
  ] : audits;

  if (isLoadingAudits && !loadingTooLong) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card variant="glass" className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Chargement de votre tableau de bord...</CardTitle>
            <CardDescription>
              Nous préparons vos données personnalisées
            </CardDescription>
            {isLoadingAudits && (
              <Button 
                variant="secondary" 
                className="mt-4"
                onClick={() => setUseFallbackData(true)}
              >
                Utiliser des données de démonstration
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleNavigation("/connexion-client")}
              className="w-full"
            >
              Se connecter
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleNavigation("/")}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (auditsError && !useFallbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <HeaderClient />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Problème de chargement des données</CardTitle>
              <CardDescription>
                Une erreur est survenue lors du chargement des audits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Message d'erreur : {auditsError}
                </AlertDescription>
              </Alert>
              
              <p className="text-slate-600 mb-6">
                Nous rencontrons actuellement des difficultés pour charger vos données. Vous pouvez :
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button onClick={refreshAudits} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
                  </Button>
                  <Button 
                    onClick={() => setUseFallbackData(true)}
                    variant="secondary"
                    className="flex-1"
                  >
                    <PiggyBank className="mr-2 h-4 w-4" /> Utiliser des données de démonstration
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={() => handleNavigation("/")}
                  className="text-slate-500"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (Array.isArray(audits) && audits.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-16">
        <HeaderClient />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          <div className="text-center mb-8">
            <SectionTitle 
              title="Votre stratégie d'optimisation fiscale" 
              subtitle="Analysez vos opportunités, suivez vos gains et optimisez votre fiscalité en temps réel" 
            />
          </div>

          <EmptyEligibleProductsState />
        </div>

        <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Simulation récente détectée</DialogTitle>
              <DialogDescription>
                Nous avons détecté une simulation récente. Voulez-vous la continuer ou en créer une nouvelle ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSimulation} className="w-full sm:w-auto">
                Continuer la simulation
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleCloseDialog}
                className="w-full sm:w-auto"
              >
                Créer une nouvelle simulation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderClient onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mt-16"></div>
        
        {/* Header moderne et compact */}
        <div className="mb-3">
          <div className="relative">
            {/* Titre principal avec bouton à gauche */}
            <div className="flex items-center justify-between mb-1">
              <Button
                onClick={handleSimulation}
                className="flex items-center justify-center gap-2 text-sm"
              >
                <Rocket className="w-5 h-5" />
                Nouvelle simulation
              </Button>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <div className="w-24"></div> {/* Espaceur pour centrer le titre */}
            </div>
            
            {/* Sous-titre avec style moderne */}
            <p className="text-sm md:text-base text-gray-600 font-light max-w-2xl mx-auto text-center">
              Vue d'ensemble de vos <span className="font-semibold text-blue-600">optimisations fiscales</span>
            </p>
            
            {/* Ligne décorative moderne */}
            <div className="flex justify-center mt-2">
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Dossiers en cours"
            value={kpiData.dossiersEnCours.toString()}
            icon={<FolderOpen className="w-4 h-4" />}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          />
          
          <StatCard
            title="Gains potentiels"
            value={`${kpiData.gainsPotentiels.toLocaleString()} €`}
            change={`${kpiData.gainsObtenus.toLocaleString()} € obtenus`}
            trend="up"
            icon={<DollarSign className="w-4 h-4" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          />
          
          <StatCard
            title="Audits finalisés"
            value={kpiData.auditsFinalises.toString()}
            icon={<CheckCircle className="w-4 h-4" />}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
          />
          
          <StatCard
            title="Avancement global"
            value={`${kpiData.avancementGlobal.toFixed(0)}%`}
            icon={<TrendingUp className="w-4 h-4" />}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
          />
        </div>

        {/* Section des audits compacte */}
        {!isLoadingAudits && !auditsError && filteredAudits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <EmptyAuditState hasRecentSimulation={hasRecentSimulation} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                Vos Audits
                <Badge variant="primary" className="ml-2">
                  {filteredAudits.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AuditTable
                activeTab="opportunities"
                allDossiers={filteredAudits}
                user={user}
                onNewSimulation={handleSimulation}
                onViewDossier={(id, auditType) => {
                  const produitNom = auditType || 'TICPE';
                  const productUrl = auditTypeToProductUrl(produitNom, id);
                  console.log('🔗 Redirection vers:', productUrl, 'pour le produit:', produitNom);
                  handleNavigation(productUrl);
                }}
                // onViewAudit={(id) => {
                //   console.log('🔍 Voir audit:', id);
                //   // Pour l'instant, rediriger vers la même page que onViewDossier
                //   const audit = filteredAudits.find(a => a.id.toString() === id);
                //   if (audit) {
                //     const productUrl = auditTypeToProductUrl(audit.audit_type, id);
                //     handleNavigation(productUrl);
                //   }
                // }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de simulation - Amélioré */}
      <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simulation récente détectée</DialogTitle>
            <DialogDescription>
              Nous avons détecté une simulation récente. Voulez-vous la continuer ou en créer une nouvelle ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSimulation} className="w-full sm:w-auto">
              Continuer la simulation
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleCloseDialog}
              className="w-full sm:w-auto"
            >
              Créer une nouvelle simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}