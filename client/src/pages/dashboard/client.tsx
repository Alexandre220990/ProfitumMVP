import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Rocket,
  FolderOpen,
  TrendingUp,
  CheckCircle,
  Clock
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
}

const StatCard = ({ title, value, icon, className = "" }: StatCardProps) => (
  <Card className={`p-4 ${className}`}>
    <CardContent className="p-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

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
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
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
            value={kpiData.gainsPotentiels}
            icon={<TrendingUp className="w-4 h-4" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          />
          
          <StatCard
            title="Gains obtenus"
            value={kpiData.gainsObtenus}
            icon={<CheckCircle className="w-4 h-4" />}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200"
          />
          
          <StatCard
            title="Progression"
            value={kpiData.progression}
            icon={<Clock className="w-4 h-4" />}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
          />
        </div>

        {/* Contenu principal */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue sur votre tableau de bord</CardTitle>
              <CardDescription>
                Gérez vos optimisations fiscales et suivez vos gains en temps réel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Votre contenu principal sera affiché ici.</p>
            </CardContent>
          </Card>

          {/* Section des produits éligibles */}
          {produits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vos produits éligibles</CardTitle>
                <CardDescription>
                  {produits.length} produit(s) éligible(s) trouvé(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {produits.map((produit) => (
                    <div key={produit.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {produit.ProduitEligible?.nom || 'Produit non défini'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          produit.statut === 'termine' ? 'bg-green-100 text-green-800' :
                          produit.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {produit.statut}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Montant :</span>
                          <p className="font-medium">
                            {produit.montantFinal ? produit.montantFinal.toLocaleString('fr-FR') + ' €' : 'Non défini'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Taux :</span>
                          <p className="font-medium">
                            {produit.tauxFinal ? (produit.tauxFinal * 100).toFixed(2) + '%' : 'Non défini'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Durée :</span>
                          <p className="font-medium">
                            {produit.dureeFinale ? produit.dureeFinale + ' jours' : 'Non définie'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Progression :</span>
                          <p className="font-medium">{produit.progress || 0}%</p>
                        </div>
                      </div>
                      
                      {produit.ProduitEligible?.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {produit.ProduitEligible.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}