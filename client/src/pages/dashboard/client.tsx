import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import ExpertSelectionModal from '@/components/ExpertSelectionModal';
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Rocket,
  FolderOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  Target,
  Calendar,
  Euro,
  Percent,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Award,
  FileText,
  Shield,
  Users
} from 'lucide-react';
import HeaderClient from '@/components/HeaderClient';
import { useAuth } from '@/hooks/use-auth';
import { useClientProducts } from '@/hooks/use-client-products';
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyEligibleProductsState } from "@/components/empty-eligible-products-state";
import { toast } from '@/hooks/use-toast';

// Composant StatCard pour les KPIs
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
  trend?: string;
}

const StatCard = ({ title, value, icon, className = "", trend }: StatCardProps) => (
  <Card className={`p-6 ${className} hover:shadow-lg transition-all duration-300`}>
    <CardContent className="p-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 font-medium">{trend}</p>
          )}
        </div>
        <div className="text-blue-600 p-3 bg-blue-50 rounded-full">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Composant ProgressBar haute couture
interface ProgressBarProps {
  progress: number;
  status: string;
  expert_id?: string;
  current_step: number;
}

const ProgressBar = ({ progress, status, expert_id, current_step }: ProgressBarProps) => {
  // Calcul intelligent de la couleur selon la progression et le statut
  const getProgressColor = () => {
    if (progress === 100 || status === 'termine') return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (progress >= 75 || current_step >= 4) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (progress >= 50 || current_step >= 3) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (progress >= 25 || current_step >= 2) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-gray-300 to-gray-400';
  };

  // Texte contextuel selon la progression et le statut
  const getProgressText = () => {
    if (progress === 100 || status === 'termine') return 'Remboursement obtenu';
    if (progress >= 75 || current_step >= 4) return 'Validation finale en cours';
    if (progress >= 50 || current_step >= 3) return 'Audit technique en cours';
    if (progress >= 25 || current_step >= 2) return 'Documents collectés';
    if (expert_id) return 'Expert sélectionné';
    return 'En attente d\'expert';
  };

  // Icône selon l'étape et le statut
  const getProgressIcon = () => {
    if (progress === 100 || status === 'termine') return <Award className="w-4 h-4" />;
    if (progress >= 75 || current_step >= 4) return <Shield className="w-4 h-4" />;
    if (progress >= 50 || current_step >= 3) return <FileText className="w-4 h-4" />;
    if (progress >= 25 || current_step >= 2) return <CheckCircle className="w-4 h-4" />;
    if (expert_id) return <Users className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      {/* En-tête avec pourcentage et icône */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getProgressIcon()}
          <span className="text-sm font-medium text-gray-700">Progression</span>
        </div>
        <span className="text-sm font-bold text-gray-900">{progress}%</span>
      </div>
      
      {/* Barre de progression avec animation */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor()} shadow-sm`}
            style={{ 
              width: `${progress}%`,
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>
        {/* Indicateur de progression avec glow effect */}
        {progress > 0 && (
          <div 
            className="absolute top-0 right-0 w-1 h-2.5 bg-white rounded-full shadow-lg"
            style={{ 
              left: `calc(${progress}% - 2px)`,
              transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        )}
      </div>
      
      {/* Texte explicatif */}
      <p className="text-xs text-gray-500 text-center font-medium">
        {getProgressText()}
      </p>
    </div>
  );
};

// Fonction de calcul intelligent de la progression
const calculateProgress = (produit: any): number => {
  // Base : 0% si pas d'expert
  if (!produit.expert_id) return 0;
  
  // Si le dossier est terminé, 100%
  if (produit.statut === 'termine') return 100;
  
  // Utiliser le progress existant ou calculer basé sur current_step
  let baseProgress = produit.progress || 0;
  
  // Ajustements selon le statut
  switch (produit.statut) {
    case 'en_cours':
      baseProgress = Math.max(baseProgress, 25);
      break;
    case 'en_attente':
      baseProgress = Math.max(baseProgress, 10);
      break;
    case 'eligible':
      baseProgress = Math.max(baseProgress, 15);
      break;
  }
  
  // Bonus pour expert sélectionné
  if (produit.expert_id) {
    baseProgress = Math.max(baseProgress, 10);
  }
  
  // Bonus pour étapes avancées
  if (produit.current_step >= 3) baseProgress = Math.max(baseProgress, 50);
  if (produit.current_step >= 4) baseProgress = Math.max(baseProgress, 75);
  if (produit.current_step >= 5) baseProgress = Math.max(baseProgress, 90);
  
  return Math.min(100, Math.max(0, baseProgress));
};

// Composant ProductCard moderne
interface ProductCardProps {
  produit: any;
  onClick: () => void;
  onExpertSelection?: (produitId: string) => void;
}

const ProductCard = ({ produit, onClick, onExpertSelection }: ProductCardProps) => {
  const getProductIcon = (nom: string) => {
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('ticpe')) return <Zap className="w-6 h-6" />;
    if (nomLower.includes('urssaf')) return <Target className="w-6 h-6" />;
    if (nomLower.includes('foncier')) return <Calendar className="w-6 h-6" />;
    if (nomLower.includes('dfs') || nomLower.includes('dsf')) return <Euro className="w-6 h-6" />;
    if (nomLower.includes('msa')) return <Percent className="w-6 h-6" />;
    return <FolderOpen className="w-6 h-6" />;
  };

  const getStatusConfig = (statut: string) => {
    switch (statut) {
      case 'termine':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'en_cours':
        return { color: 'bg-blue-100 text-blue-800', icon: <Play className="w-4 h-4" /> };
      case 'en_attente':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock3 className="w-4 h-4" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <AlertTriangle className="w-4 h-4" /> };
    }
  };

  const statusConfig = getStatusConfig(produit.statut);

  // Fonction pour obtenir la description courte du produit
  const getProductDescription = (nom: string) => {
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('ticpe')) return 'Remboursement de la Taxe Intérieure de Consommation sur les Produits Énergétiques';
    if (nomLower.includes('urssaf')) return 'Optimisation de Charges Sociales';
    if (nomLower.includes('foncier')) return 'Optimisation de la Taxe Foncière';
    if (nomLower.includes('dfs') || nomLower.includes('dsf')) return 'Optimisation de la Taxe sur les Salaires';
    if (nomLower.includes('msa')) return 'Optimisation des Cotisations MSA';
    return 'Optimisation fiscale et sociale';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-300">
      <CardContent className="p-6 flex flex-col h-full">
        {/* En-tête avec titre centré et icône */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3 text-blue-600">
            {getProductIcon(produit.ProduitEligible?.nom)}
          </div>
          <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
            {produit.ProduitEligible?.nom || 'Produit non défini'}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {getProductDescription(produit.ProduitEligible?.nom)}
          </p>
        </div>

        {/* Badge de statut */}
        <div className="flex justify-center mb-4">
          <Badge className={`${statusConfig.color} flex items-center gap-1 px-3 py-1`}>
            {statusConfig.icon}
            {produit.statut === 'en_cours' ? 'En cours' : 
             produit.statut === 'en_attente' ? 'En attente' : 
             produit.statut === 'termine' ? 'Terminé' : produit.statut}
          </Badge>
        </div>

        {/* Montant estimé */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 text-center">
          <p className="text-xs text-gray-600 mb-1 font-medium">Montant estimé</p>
          <p className="font-bold text-2xl text-gray-900">
            {produit.montantFinal ? produit.montantFinal.toLocaleString('fr-FR') + ' €' : 'Non défini'}
          </p>
        </div>

        {/* Barre de progression haute couture */}
        <div className="mb-4">
          <ProgressBar 
            progress={calculateProgress(produit)}
            status={produit.statut}
            expert_id={produit.expert_id}
            current_step={produit.current_step || 0}
          />
        </div>

        {/* Section Expert - hauteur fixe pour alignement */}
        <div className="mb-4 min-h-[3.5rem] flex flex-col justify-center">
          {produit.expert_id ? (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 mb-1 font-medium">Expert sélectionné</p>
              <p className="text-sm text-green-800 font-semibold">
                {produit.Expert?.name || 'Expert assigné'}
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 mb-1 font-medium">Experts disponibles</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-orange-700 hover:text-orange-800 hover:bg-orange-100 p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onExpertSelection) {
                    onExpertSelection(produit.id);
                  }
                }}
              >
                Voir les experts →
              </Button>
            </div>
          )}
        </div>

        {/* Bouton Continuer - toujours aligné en bas */}
        <div className="mt-auto pt-4">
          <Button 
            className="w-full group-hover:bg-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProduitId, setSelectedProduitId] = useState<string | null>(null);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  
  // Hook pour les produits éligibles du client
  const { 
    produits, 
    loading: loadingProducts, 
    error: productsError, 
    hasProducts,
    inProgressProducts
  } = useClientProducts();

  // Suppression des tests d'authentification inutiles - l'authentification est gérée par les hooks

  // Redirection automatique vers le simulateur si le client n'a pas de produits éligibles
  useEffect(() => {
    if (!loadingProducts && !hasProducts && !productsError) {
      console.log('🔄 Client sans produits éligibles - redirection automatique vers simulateur');
      navigate('/simulateur');
    }
  }, [loadingProducts, hasProducts, productsError, navigate]);

  const handleSimulation = useCallback(async () => {
    try {
      // Vérifier si l'utilisateur peut faire une nouvelle simulation
      const response = await fetch('/api/client/simulation/status', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.canRunNewSimulation) {
          // Rediriger vers le simulateur en mode client connecté
          navigate('/simulateur?mode=client');
        } else {
          // Afficher un message d'information
          toast({
            title: "Simulation en cours",
            description: "Une simulation est déjà en cours. Veuillez attendre qu'elle se termine.",
            variant: "default",
          });
        }
      } else {
        // En cas d'erreur, rediriger vers le simulateur public
        navigate('/simulateur');
      }
    } catch (error) {
      console.error('Erreur vérification statut simulation:', error);
      // En cas d'erreur, rediriger vers le simulateur public
      navigate('/simulateur');
    }
  }, [navigate]);

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

  // Fonction pour rediriger vers le workflow approprié
  const handleProductClick = useCallback((produit: any) => {
    const nomProduit = produit.ProduitEligible?.nom?.toLowerCase() || '';
    
    // Mapping des produits vers les workflows
    if (nomProduit.includes('ticpe')) {
      navigate(`/produits/ticpe/${produit.id}`);
    } else if (nomProduit.includes('urssaf')) {
      navigate(`/produits/urssaf/${produit.id}`);
    } else if (nomProduit.includes('foncier')) {
      navigate(`/produits/foncier/${produit.id}`);
    } else if (nomProduit.includes('dfs') || nomProduit.includes('dsf')) {
      navigate(`/produits/dfs/${produit.id}`);
    } else if (nomProduit.includes('msa')) {
      navigate(`/produits/msa/${produit.id}`);
    } else if (nomProduit.includes('cir')) {
      navigate(`/produits/cir/${produit.id}`);
    } else if (nomProduit.includes('social')) {
      navigate(`/produits/social/${produit.id}`);
    } else if (nomProduit.includes('audit_energetique') || nomProduit.includes('audit énergétique')) {
      navigate(`/produits/audit_energetique/${produit.id}`);
    } else {
      // Fallback vers une page générique
      navigate(`/dossier-client/${produit.id}`);
    }
  }, [navigate]);

  // Fonction pour ouvrir le modal de sélection d'expert
  const handleExpertSelection = useCallback((produitId: string) => {
    setSelectedProduitId(produitId);
    setIsExpertModalOpen(true);
  }, []);

  // Fonction pour fermer le modal
  const handleCloseExpertModal = useCallback(() => {
    setIsExpertModalOpen(false);
    setSelectedProduitId(null);
  }, []);

  // Fonction appelée quand un expert est sélectionné
  const handleExpertSelected = useCallback((expert: any) => {
    toast({
      title: "Expert sélectionné",
      description: `${expert.name} a été assigné à votre dossier.`,
      variant: "default",
    });
    handleCloseExpertModal();
    // Optionnel : rafraîchir les données
    window.location.reload();
  }, [handleCloseExpertModal]);

  // Calcul des vraies données KPI depuis ClientProduitEligible
  const kpiData = {
    dossiersEnCours: inProgressProducts,
    gainsPotentiels: produits
      .filter(p => p.montantFinal && p.montantFinal > 0)
      .reduce((sum, p) => sum + (p.montantFinal || 0), 0)
      .toLocaleString('fr-FR') + ' €',
    gainsObtenus: produits
      .filter(p => p.statut === 'termine' && p.montantFinal && p.montantFinal > 0)
      .reduce((sum, p) => sum + (p.montantFinal || 0), 0)
      .toLocaleString('fr-FR') + ' €',
    progression: produits.length > 0 
      ? Math.round(produits.reduce((sum, p) => sum + (p.progress || 0), 0) / produits.length) + '%'
      : '0%'
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
              </div>
            </div>
            <CardTitle className="text-xl mb-2">Chargement de votre tableau de bord...</CardTitle>
            <CardDescription>
              Nous préparons vos données personnalisées
            </CardDescription>
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

  if (productsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <HeaderClient />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Problème de chargement des données</CardTitle>
              <CardDescription>
                Une erreur est survenue lors du chargement des données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Message d'erreur : {productsError}
                </AlertDescription>
              </Alert>
              
              <p className="text-slate-600 mb-6">
                Nous rencontrons actuellement des difficultés pour charger vos données. Vous pouvez :
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button onClick={handleRefresh} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
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

  if (!hasProducts) {
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderClient onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mt-16"></div>
        
        {/* Header moderne et compact */}
        <div className="mb-8">
          <div className="relative">
            {/* Titre principal avec bouton à gauche */}
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={handleSimulation}
                className="flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Rocket className="w-5 h-5" />
                Nouvelle simulation
              </Button>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <div className="w-24"></div> {/* Espaceur pour centrer le titre */}
            </div>
            
            {/* Sous-titre avec style moderne */}
            <p className="text-base md:text-lg text-gray-600 font-light max-w-3xl mx-auto text-center">
              Vue d'ensemble de vos <span className="font-semibold text-blue-600">optimisations fiscales</span>
            </p>
            
            {/* Ligne décorative moderne */}
            <div className="flex justify-center mt-4">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Dossiers en cours"
            value={kpiData.dossiersEnCours.toString()}
            icon={<FolderOpen className="w-6 h-6" />}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
            trend="+2 ce mois"
          />
          
          <StatCard
            title="Gains potentiels"
            value={kpiData.gainsPotentiels}
            icon={<TrendingUp className="w-6 h-6" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            trend="+15% vs mois dernier"
          />
          
          <StatCard
            title="Gains obtenus"
            value={kpiData.gainsObtenus}
            icon={<CheckCircle className="w-6 h-6" />}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200"
            trend="+8% ce trimestre"
          />
          
          <StatCard
            title="Progression"
            value={kpiData.progression}
            icon={<Clock className="w-6 h-6" />}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
            trend="En progression"
          />
        </div>

        {/* Section des produits éligibles */}
        {produits.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos optimisations en cours</h2>
                <p className="text-gray-600">
                  {produits.length} produit(s) éligible(s) trouvé(s) • Cliquez pour continuer
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {produits.filter(p => p.statut === 'en_cours').length} en cours
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produits.map((produit) => (
                <ProductCard
                  key={produit.id}
                  produit={produit}
                  onClick={() => handleProductClick(produit)}
                  onExpertSelection={handleExpertSelection}
                />
              ))}
            </div>
          </div>
                )}

        {/* Footer simple avec informations */}
        <footer className="mt-12 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span>© 2024 Profitum</span>
            <span>•</span>
            <span>Optimisation fiscale & sociale</span>
            <span>•</span>
            <span>Support disponible 24/7</span>
          </div>
        </footer>

        {/* Modal de sélection d'expert */}
        <ExpertSelectionModal
          isOpen={isExpertModalOpen}
          onClose={handleCloseExpertModal}
          dossierId={selectedProduitId || ''}
          onExpertSelected={handleExpertSelected}
        />
      </div>
    </div>
  );
}