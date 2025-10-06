import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ApporteurDashboardSimple } from '../../components/apporteur/ApporteurDashboardSimple';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';

/**
 * Page Dashboard Apporteur Optimisée
 * Utilise les fonctions SQL pour afficher les données personnelles
 * Gestion d'erreurs avancée et interface utilisateur améliorée
 */
export default function ApporteurDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apporteurId = searchParams.get('apporteurId');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérification de l'ID apporteur avec délai pour éviter les erreurs de hydration
    const timer = setTimeout(() => {
      if (!apporteurId || typeof apporteurId !== 'string') {
        setError('ID Apporteur manquant ou invalide');
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [apporteurId]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de votre dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Gestion d'erreur
  if (error || !apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Accès au Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {error || 'ID Apporteur Requis'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error 
                  ? 'Une erreur est survenue lors du chargement de votre dashboard.'
                  : 'Veuillez vous connecter pour accéder à votre dashboard.'
                }
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/apporteur/login')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <ApporteurDashboardSimple apporteurId={apporteurId} />
      </div>
    </div>
  );
}
