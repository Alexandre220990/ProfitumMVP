import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProgressiveMigrationFlow } from '../components/ProgressiveMigrationFlow';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function SimulationMigration() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Récupérer le token de session depuis l'URL ou le state
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('session');
    const tokenFromState = (location.state as any)?.sessionToken;
    
    const token = tokenFromUrl || tokenFromState;
    
    if (token) {
      setSessionToken(token);
      validateSession(token);
    } else {
      setIsValidSession(false);
      toast.error("Aucun token de session fourni");
    }
  }, [location]);

  const validateSession = async (token: string) => {
    try {
      const response = await fetch(`/api/session-migration/validate/${token}`);
      const result = await response.json();
      
      if (result.success) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
        toast.error("Votre session a expiré. Veuillez refaire une simulation.");
      }
    } catch (error) {
      setIsValidSession(false);
      toast.error("Impossible de valider la session");
    }
  };

  const handleMigrationComplete = (clientId: string) => {
    console.log('Migration terminée pour le client:', clientId);
    // La redirection est gérée dans le composant ProgressiveMigrationFlow
  };

  const handleBackToSimulator = () => {
    navigate('/simulateur');
  };

  // Affichage de chargement
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validation de votre session...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Session expirée
            </h1>
            
            <p className="text-gray-600 mb-6">
              Votre session de simulation a expiré ou est invalide. 
              Veuillez refaire une simulation pour créer votre compte.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleBackToSimulator}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au simulateur
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage du flux de migration
  if (sessionToken && isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Profitum" 
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  Profitum
                </span>
              </div>
              
              <Button 
                variant="outline"
                onClick={handleBackToSimulator}
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au simulateur
              </Button>
            </div>
          </div>
        </div>
        
        <div className="py-8">
          <ProgressiveMigrationFlow 
            sessionToken={sessionToken}
            onComplete={handleMigrationComplete}
          />
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
} 