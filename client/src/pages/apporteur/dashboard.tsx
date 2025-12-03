import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApporteurDashboardSimple } from '../../components/apporteur/ApporteurDashboardSimple';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

/**
 * Page Dashboard Apporteur - Architecture identique au dashboard client
 */
export default function ApporteurDashboardPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  // Récupérer l'ID directement comme le dashboard client
  const apporteurId = user?.id;

  // Fonctions de navigation avec useCallback comme dashboard client
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Gestion d'erreur - Vérifier si l'utilisateur est bien un apporteur
  if (!user || user.type !== 'apporteur' || !apporteurId) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
              Accès au Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Authentification Requise
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                Veuillez vous connecter pour accéder à votre dashboard.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button 
                onClick={() => handleNavigation('/apporteur/login')}
                className="flex items-center gap-2 text-sm sm:text-base"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Retour à la connexion
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-sm sm:text-base"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard principal
  return <ApporteurDashboardSimple apporteurId={apporteurId} />;
}
