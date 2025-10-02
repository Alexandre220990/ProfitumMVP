import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogIn } from 'lucide-react';

interface ApporteurAuthGuardProps {
  children: React.ReactNode;
}

export default function ApporteurAuthGuard({ children }: ApporteurAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('user_type');
      const userData = localStorage.getItem('user_data');

      if (!token || !userType || !userData) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Vérifier que l'utilisateur est bien un apporteur d'affaires
      if (userType !== 'apporteur_affaires') {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Optionnel : vérifier la validité du token avec l'API
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/apporteur/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token invalide ou expiré
          localStorage.removeItem('token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user_data');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erreur vérification token:', error);
        // En cas d'erreur réseau, on considère l'utilisateur comme authentifié
        // pour éviter les déconnexions intempestives
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur checkAuthentication:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/apporteur/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Accès non autorisé
              </h2>
              <p className="text-gray-600 mb-6">
                Vous devez être connecté en tant qu'apporteur d'affaires pour accéder à cette page.
              </p>
              <Button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
