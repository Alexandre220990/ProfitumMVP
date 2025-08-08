import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Clock3
} from 'lucide-react';
import HeaderClient from '@/components/HeaderClient';
import { useAuth } from '@/hooks/use-auth';
import { useClientProducts } from '@/hooks/use-client-products';
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyEligibleProductsState } from "@/components/empty-eligible-products-state";

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

// Composant ProductCard moderne
interface ProductCardProps {
  produit: any;
  onClick: () => void;
}

const ProductCard = ({ produit, onClick }: ProductCardProps) => {
  const getProductIcon = (nom: string) => {
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('ticpe')) return <Zap className="w-5 h-5" />;
    if (nomLower.includes('urssaf')) return <Target className="w-5 h-5" />;
    if (nomLower.includes('foncier')) return <Calendar className="w-5 h-5" />;
    if (nomLower.includes('dfs') || nomLower.includes('dsf')) return <Euro className="w-5 h-5" />;
    if (nomLower.includes('msa')) return <Percent className="w-5 h-5" />;
    return <FolderOpen className="w-5 h-5" />;
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

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-300"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              {getProductIcon(produit.ProduitEligible?.nom)}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {produit.ProduitEligible?.nom || 'Produit non défini'}
              </h3>
              <p className="text-sm text-gray-600">
                {produit.ProduitEligible?.description || 'Aucune description'}
              </p>
            </div>
          </div>
          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
            {statusConfig.icon}
            {produit.statut}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Montant estimé</p>
            <p className="font-bold text-lg text-gray-900">
              {produit.montantFinal ? produit.montantFinal.toLocaleString('fr-FR') + ' €' : 'Non défini'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Taux d'optimisation</p>
            <p className="font-bold text-lg text-gray-900">
              {produit.tauxFinal ? (produit.tauxFinal * 100).toFixed(2) + '%' : 'Non défini'}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span>{produit.progress || 0}%</span>
          </div>
          <Progress value={produit.progress || 0} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {produit.dureeFinale ? produit.dureeFinale + ' jours' : 'Durée non définie'}
            </span>
          </div>
          <Button 
            size="sm" 
            className="group-hover:bg-blue-600 transition-colors"
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
  
  // Hook pour les produits éligibles du client
  const { 
    produits, 
    loading: loadingProducts, 
    error: productsError, 
    hasProducts,
    inProgressProducts
  } = useClientProducts();

  // Test d'authentification et de chargement
  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🧪 Test API dashboard client...');
        
        // Test d'authentification
        const authResponse = await fetch('/api/client/test-auth', {
          credentials: 'include'
        });
        console.log('✅ Test auth dashboard client:', authResponse.status, authResponse.ok);
        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          console.error('❌ Erreur auth dashboard client:', errorData);
        }
        
        // Test des produits éligibles
        const produitsResponse = await fetch('/api/client/produits-eligibles', {
          credentials: 'include'
        });
        console.log('✅ Test produits dashboard client:', produitsResponse.status, produitsResponse.ok);
        if (!produitsResponse.ok) {
          const errorData = await produitsResponse.json();
          console.error('❌ Erreur produits dashboard client:', errorData);
        }
      } catch (error) {
        console.error('❌ Erreur test API dashboard client:', error);
      }
    };
    
    if (user?.id) {
      testAPI();
    }
  }, [user?.id]);

  // Redirection automatique vers le simulateur si le client n'a pas de produits éligibles
  useEffect(() => {
    if (!loadingProducts && !hasProducts && !productsError) {
      console.log('🔄 Client sans produits éligibles - redirection automatique vers simulateur');
      navigate('/simulateur');
    }
  }, [loadingProducts, hasProducts, productsError, navigate]);

  const handleSimulation = useCallback(async () => {
    try {
      // Logique de simulation simplifiée
      navigate('/simulateur');
    } catch (error) {
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
                />
              ))}
            </div>
          </div>
        )}

        {/* Section d'actions rapides */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl">Actions rapides</CardTitle>
            <CardDescription>
              Accédez rapidement aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
                onClick={() => navigate('/documents-client')}
              >
                <FolderOpen className="w-6 h-6" />
                <span>Mes documents</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
                onClick={() => navigate('/agenda-client')}
              >
                <Calendar className="w-6 h-6" />
                <span>Mon agenda</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
                onClick={() => navigate('/messagerie-client')}
              >
                <AlertCircle className="w-6 h-6" />
                <span>Messagerie</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}