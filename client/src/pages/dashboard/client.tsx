import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  RefreshCw, 
  AlertCircle, 
  FolderOpen,
  TrendingUp,
  CheckCircle,
  Clock,
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
  Users,
  UserCheck,
  Bell,
  Sparkles,
  Upload,
  Calculator,
  Flame
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useClientProducts } from '@/hooks/use-client-products';
import { useDossierNotifications } from '@/hooks/useDossierNotifications';
import { UniversalNotificationCenter } from '@/components/notifications/UniversalNotificationCenter';
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyEligibleProductsState } from "@/components/empty-eligible-products-state";
import LoadingScreen from '@/components/LoadingScreen';

// Composant StatCard pour les KPIs
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
  trend?: string;
}

const StatCard = ({ title, value, icon, className = "", trend }: StatCardProps) => (
  <Card className={`p-4 sm:p-6 ${className} hover:shadow-lg transition-all duration-300`}>
    <CardContent className="p-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">{value}</p>
          {trend && (
            <p className="text-[10px] sm:text-xs text-green-600 font-medium truncate">{trend}</p>
          )}
        </div>
        <div className="text-blue-600 p-2 sm:p-3 bg-blue-50 rounded-full flex-shrink-0 ml-2">
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
    // Étape 6 : Remboursement obtenu (100%)
    if (progress === 100 || status === 'termine') return 'Remboursement obtenu';
    
    // Étape 5 : Validation finale
    if (current_step >= 5) return 'Validation finale en cours';
    
    // Étape 4 : Audit technique (verrouillé)
    if (current_step >= 4) return 'Audit technique en cours';
    
    // Étape 3 : Collecte documents complémentaires
    if (current_step >= 3) return 'Collecte des documents complémentaires';
    
    // Étape 2 : Expert sélectionné
    if (current_step >= 2 && expert_id) return 'Expert sélectionné';
    
    // Étape 1 : En attente de validation d'éligibilité par l'admin
    if (current_step === 1 || status === 'documents_uploaded') {
      return 'En attente de validation d\'éligibilité';
    }
    
    // État initial : pas encore de documents
    return 'Documents d\'éligibilité requis';
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

// Fonction de calcul intelligent de la progression basée sur les étapes
const calculateProgress = (produit: any): number => {
  // Si le dossier est terminé, 100%
  if (produit.statut === 'termine') return 100;
  
  // Calcul basé sur current_step (6 étapes au total)
  const step = produit.current_step || 0;
  
  // Mapping précis : chaque étape = ~16.67% (100/6)
  const stepProgress: { [key: number]: number } = {
    0: 0,   // Pas encore commencé
    1: 10,  // Étape 1 : Documents uploadés, en attente validation éligibilité
    2: 30,  // Étape 2 : Éligibilité validée, expert sélectionné
    3: 50,  // Étape 3 : Collecte documents complémentaires
    4: 70,  // Étape 4 : Audit technique (verrouillé)
    5: 85,  // Étape 5 : Validation finale
    6: 100  // Étape 6 : Remboursement
  };
  
  let calculatedProgress = stepProgress[step] || 0;
  
  // Ajustements selon le statut pour affiner
  if (produit.statut === 'documents_uploaded' && step === 1) {
    calculatedProgress = 10; // En attente de validation admin
  }
  
  if (produit.statut === 'eligibility_validated' && step === 1) {
    calculatedProgress = 25; // Éligibilité validée, peut passer à l'étape 2
  }
  
  // Utiliser le progress de la BDD s'il est plus élevé
  if (produit.progress && produit.progress > calculatedProgress) {
    return Math.min(100, produit.progress);
  }
  
  return Math.min(100, Math.max(0, calculatedProgress));
};

// Composant ProductCard moderne
interface ProductCardProps {
  produit: any;
  onClick: () => void;
  notificationData?: {
    unreadCount: number;
    hasActionRequired: boolean;
    isNewStatus: boolean;
    latestNotification?: any;
  };
}

type SortOption = 'progress_desc' | 'progress_asc' | 'amount_desc' | 'amount_asc';

const ProductCard = ({ produit, onClick, notificationData }: ProductCardProps) => {
  const getProductIcon = (nom?: string) => {
    if (!nom) return <FolderOpen className="w-6 h-6" />;
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('ticpe')) return <Zap className="w-6 h-6" />;
    if (nomLower.includes('urssaf')) return <Target className="w-6 h-6" />;
    if (nomLower.includes('foncier')) return <Calendar className="w-6 h-6" />;
    if (nomLower.includes('dfs') || nomLower.includes('dsf')) return <Euro className="w-6 h-6" />;
    if (nomLower.includes('msa')) return <Percent className="w-6 h-6" />;
    if (nomLower.includes('énergie') || nomLower.includes('energie')) return <Flame className="w-6 h-6" />;
    if (nomLower.includes('logiciel') || nomLower.includes('solid')) return <Calculator className="w-6 h-6" />;
    return <FolderOpen className="w-6 h-6" />;
  };

  const getStatusConfig = (statut: string) => {
    switch (statut) {
      case 'termine':
        return { 
          color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300', 
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: '✅ Terminé'
        };
      case 'admin_validated':
      case 'eligibility_validated':
        return { 
          color: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-400', 
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: '✓ Validé par admin'
        };
      case 'en_cours':
        return { 
          color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300', 
          icon: <Play className="w-4 h-4" />,
          label: '⚙️ En cours'
        };
      case 'documents_uploaded':
        return { 
          color: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-300', 
          icon: <FileText className="w-4 h-4" />,
          label: '📄 Docs reçus'
        };
      case 'pending_upload':
        return null;
      case 'en_attente':
        return { 
          color: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300', 
          icon: <Clock3 className="w-4 h-4" />,
          label: '⏳ En attente'
        };
      case 'eligible':
        return { 
          color: 'bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-800 border border-cyan-300', 
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: '✨ Éligible'
        };
      default:
        return { 
          color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-300', 
          icon: <AlertTriangle className="w-4 h-4" />,
          label: statut ? statut.replace(/_/g, ' ') : 'Statut à confirmer'
        };
    }
  };

  const statusConfig = getStatusConfig(produit.statut);
  
  // Détecter si le produit vient d'un apporteur d'affaires
  const isFromApporteur = produit.metadata?.source === 'apporteur';
  const isHighPriority = produit.priorite === 1;

  // Fonction pour obtenir la description courte du produit
  const getProductSubtitle = (nom?: string) => {
    if (!nom) return 'Optimisation fiscale et sociale';
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('ticpe')) return 'Remboursement de la TICPE';
    if (nomLower.includes('urssaf')) return 'Optimisation des charges sociales';
    if (nomLower.includes('foncier')) return 'Optimisation de la taxe foncière';
    if (nomLower.includes('dfs') || nomLower.includes('dsf')) return 'Optimisation de la taxe sur les salaires';
    if (nomLower.includes('msa')) return 'Optimisation des cotisations MSA';
    if (nomLower.includes('énergie') || nomLower.includes('energie')) return 'Réduisez vos dépenses énergétiques';
    if (nomLower.includes('logiciel') || nomLower.includes('solid')) return 'Mise à disposition clé en main';
    return 'Optimisation fiscale et sociale';
  };

  const pendingConfig = (() => {
    if (produit.statut === 'eligibility_validated') {
      return {
        container: 'border border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50',
        icon: <UserCheck className="w-3.5 h-3.5 text-emerald-700" />,
        headline: 'Éligibilité validée',
        headlineClass: 'text-emerald-800',
        subline: 'Votre expert sera attribué sous 48h.',
        sublineClass: 'text-emerald-600'
      };
    }
    if (produit.statut === 'documents_uploaded') {
      return {
        container: 'border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50',
        icon: <FileText className="w-3.5 h-3.5 text-purple-700" />,
        headline: 'Validation en cours',
        headlineClass: 'text-purple-800',
        subline: 'Notre équipe vérifie vos envois.',
        sublineClass: 'text-purple-600'
      };
    }
    return {
      container: 'border border-amber-200 bg-gradient-to-r from-orange-50 to-amber-50',
      icon: <Upload className="w-3.5 h-3.5 text-orange-700" />,
      headline: 'Informations requises',
      headlineClass: 'text-orange-800',
      subline: 'Complétez les réponses demandées.',
      sublineClass: 'text-orange-600'
    };
  })();

  return (
    <Card
      className={`relative h-full flex flex-col transition-all duration-300 cursor-pointer group rounded-2xl border border-slate-200/70 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 ${
        isFromApporteur ? 'ring-1 ring-blue-200 bg-blue-50/50' : 'hover:border-blue-300'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {/* Pastille notification (intégrée dans la tuile) */}
      {notificationData && notificationData.unreadCount > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <Bell className="h-5 w-5 text-white bg-red-500 rounded-full p-1 shadow-md" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {notificationData.unreadCount}
            </span>
          </div>
        </div>
      )}

      <CardContent className="p-5 flex flex-col h-full gap-4">
        {/* Badge "Action requise" */}
        {notificationData?.hasActionRequired && (
          <div className="p-2 bg-gradient-to-r from-red-50 to-pink-100 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-red-600 text-white flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3" />
                🔔 Action requise
              </Badge>
            </div>
          </div>
        )}

        {/* Badge "Nouveau statut" */}
        {notificationData?.isNewStatus && !notificationData?.hasActionRequired && (
          <div className="p-2 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-green-600 text-white flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                ✨ Nouveau statut
              </Badge>
            </div>
          </div>
        )}

        {/* Badge "Via Apporteur" si applicable */}
        {isFromApporteur && (
          <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-blue-600 text-white flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Recommandé par votre conseiller
              </Badge>
              {isHighPriority && (
                <Badge className="bg-amber-500 text-white">
                  ⭐ Priorité
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Badge "Documents manquants" si demande active */}
        {produit.has_pending_document_request && (
          <div className="p-2 bg-gradient-to-r from-orange-50 to-amber-100 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-orange-600 text-white flex items-center gap-1 font-semibold">
                <FileText className="h-3 w-3" />
                📄 Documents manquants ({produit.pending_documents_count})
              </Badge>
            </div>
            <p className="text-xs text-orange-800 text-center mt-1 font-medium">
              Votre expert attend des documents
            </p>
          </div>
        )}

        {/* En-tête avec titre centré et icône */}
        <div className="flex items-start gap-3 pt-1">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-blue-50 rounded-xl text-blue-600 shadow-sm shrink-0">
            {getProductIcon(produit.ProduitEligible?.nom)}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-[15px] leading-tight text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
              {produit.ProduitEligible?.nom || 'Produit non défini'}
            </h3>
            <p className="text-[12px] text-gray-600 leading-snug">
              {getProductSubtitle(produit.ProduitEligible?.nom)}
            </p>
          </div>
        </div>
        {statusConfig && (
          <Badge className={`${statusConfig.color} flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-full shadow-md absolute -top-3 right-6`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        )}

        {/* Montant estimé */}
        <div className="p-3 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-center shadow-sm">
          <p className="text-[10px] text-emerald-700 mb-1 font-semibold uppercase tracking-[0.24em]">
            Montant estimé
          </p>
          <p className="font-bold text-[19px] text-emerald-700">
            {produit.montantFinal ? produit.montantFinal.toLocaleString('fr-FR') + ' €' : 'Prix sur demande'}
          </p>
        </div>

        {/* Barre de progression haute couture */}
        <div>
          <ProgressBar
            progress={calculateProgress(produit)}
            status={produit.statut}
            expert_id={produit.expert_id}
            current_step={produit.current_step || 0}
          />
        </div>

        {/* Section Expert - hauteur fixe pour alignement - Affichage conditionnel */}
        <div className="mb-2 min-h-[3rem] flex flex-col justify-center">
          {produit.expert_id || produit.expert_pending_id ? (
            <div 
              className="bg-green-50 p-3 rounded-lg border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-green-700 mb-1 font-medium">
                    {produit.expert_id ? '✓ Expert confirmé' : '⏳ Expert en attente d\'acceptation'}
                  </p>
                  <p className="text-sm text-green-800 font-semibold">
                    {produit.Expert?.name || produit.Expert?.first_name && produit.Expert?.last_name 
                      ? `${produit.Expert.first_name} ${produit.Expert.last_name}` 
                      : 'Expert assigné'}
                  </p>
                  {!produit.expert_id && produit.expert_pending_id && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      L'expert va étudier votre dossier (jusqu'à 48h)
                    </p>
                  )}
                  {produit.expert_id && produit.Expert && (
                    <div className="flex items-center gap-2 mt-1">
                      {produit.Expert.specialites && produit.Expert.specialites.length > 0 && (
                        <span className="text-xs text-green-600">
                          {produit.Expert.specialites.slice(0, 2).join(', ')}
                          {produit.Expert.specialites.length > 2 && '...'}
                        </span>
                      )}
                      {produit.Expert.rating && (
                        <>
                          <span className="text-xs text-green-600">•</span>
                          <span className="text-xs text-green-600">⭐ {produit.Expert.rating}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right flex items-center gap-1 text-green-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded-lg ${pendingConfig.container}`}>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold mb-1">
                {pendingConfig.icon}
                <span className={`${pendingConfig.headlineClass}`}>
                  {pendingConfig.headline}
                </span>
              </div>
              <p className={`text-xs text-center leading-snug ${pendingConfig.sublineClass}`}>
                {pendingConfig.subline}
              </p>
            </div>
          )}
        </div>

        {/* Bouton Continuer - toujours aligné en bas */}
        <div className="mt-auto pt-2 text-center text-[11px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Cliquez pour voir les informations détaillées
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>('progress_desc');
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  
  // Hook pour les produits éligibles du client
  const { 
    produits, 
    loading: loadingProducts, 
    error: productsError, 
    hasProducts,
    inProgressProducts
  } = useClientProducts();

  // Hook pour les notifications par dossier
  const {
    getDossierNotifications
  } = useDossierNotifications();

  // L'authentification est gérée par les hooks

  // Redirection automatique vers le simulateur client si le client n'a pas de produits éligibles
  useEffect(() => {
    if (!loadingProducts && !hasProducts && !productsError) {
      console.log('🔄 Client sans produits éligibles - redirection automatique vers simulateur client');
      navigate('/simulateur-client');
    }
  }, [loadingProducts, hasProducts, productsError, navigate]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    navigate(0);
  }, [navigate]);

  const buildProduitSlug = useCallback((nom?: string) => {
    if (!nom) return 'produit';
    const normalized = nom
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'produit';
  }, []);

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
    } else if (nomProduit.includes('logiciel') || nomProduit.includes('solid')) {
      navigate(`/produits/logiciel-solid/${produit.id}`);
    } else {
      // Fallback vers une page générique avec slug produit
      const slug = buildProduitSlug(produit.ProduitEligible?.nom);
      navigate(`/dossier-client/${slug}/${produit.id}`);
    }
  }, [navigate, buildProduitSlug]);

  // Fonction pour ouvrir le modal de sélection d'expert

  const sortedProduits = useMemo(() => {
    if (!produits || produits.length === 0) {
      return [];
    }

    const copy = [...produits];

    return copy.sort((a, b) => {
      switch (sortOption) {
        case 'progress_desc':
          return calculateProgress(b) - calculateProgress(a);
        case 'progress_asc':
          return calculateProgress(a) - calculateProgress(b);
        case 'amount_desc':
          return (b.montantFinal ?? 0) - (a.montantFinal ?? 0);
        case 'amount_asc':
          return (a.montantFinal ?? 0) - (b.montantFinal ?? 0);
        default:
          return 0;
      }
    });
  }, [produits, sortOption]);

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
    return <LoadingScreen />;
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
      <div>
        <div className="max-w-5xl mx-auto px-4 py-10">
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
      <div>
        <div className="max-w-5xl mx-auto px-4 py-10 pb-16">
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
    <div>
      {/* Centre de notifications universel */}
      {notificationCenterOpen && (
        <UniversalNotificationCenter
          mode="modal"
          onClose={() => setNotificationCenterOpen(false)}
          title="Notifications"
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        
        {/* Header moderne et compact */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            {/* Titre principal avec bouton à gauche */}
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
            </div>
            
            {/* Sous-titre avec style moderne */}
            <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light max-w-3xl mx-auto text-center px-2">
              Vue d'ensemble de vos <span className="font-semibold text-blue-600">optimisations fiscales</span>
            </p>
            
            {/* Ligne décorative moderne */}
            <div className="flex justify-center mt-3 sm:mt-4">
              <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* KPIs compacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Dossiers en cours"
            value={kpiData.dossiersEnCours.toString()}
            icon={<FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
            trend="+2 ce mois"
          />
          
          <StatCard
            title="Gains potentiels"
            value={kpiData.gainsPotentiels}
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            trend="+15% vs mois dernier"
          />
          
          <StatCard
            title="Gains obtenus"
            value={kpiData.gainsObtenus}
            icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200"
            trend="+8% ce trimestre"
          />
          
          <StatCard
            title="Progression"
            value={kpiData.progression}
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
            trend="En progression"
          />
        </div>

        {/* Section des produits éligibles */}
        {produits.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos optimisations en cours</h2>
                <p className="text-gray-600">
                  {produits.length} produit(s) éligible(s) trouvé(s) • Cliquez pour continuer
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {produits.filter(p => p.statut === 'en_cours').length} en cours
                </Badge>
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Trier les dossiers" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="progress_desc">Progression décroissante</SelectItem>
                    <SelectItem value="progress_asc">Progression croissante</SelectItem>
                    <SelectItem value="amount_desc">Montant décroissant</SelectItem>
                    <SelectItem value="amount_asc">Montant croissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedProduits.map((produit) => (
                  <ProductCard
                    key={produit.id}
                    produit={produit}
                    onClick={() => handleProductClick(produit)}
                    notificationData={getDossierNotifications(produit.id)}
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
      </div>
    </div>
  );
}