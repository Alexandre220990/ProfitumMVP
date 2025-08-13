import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { config } from '@/config/env';
import { useToast } from '../components/ui/toast-notifications';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, ArrowRight, UserPlus, Database, Rocket, Check } from 'lucide-react';

// Types pour la migration
interface SessionData {
  sessionId: string;
  simulationData: any;
  products: any[];
}

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface ProgressiveMigrationFlowProps {
  sessionToken: string;
  onComplete?: (clientId: string) => void;
}

export const ProgressiveMigrationFlow: React.FC<ProgressiveMigrationFlowProps> = ({
  sessionToken,
  onComplete
}) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { addToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les données de session au montage
  useEffect(() => {
    loadSessionData();
  }, [sessionToken]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/session-migration/validate/${sessionToken}`);
      const result = await response.json();
      
      if (result.success) {
        setSessionData(result.data);
      } else {
        addToast({
          type: 'error',
          title: "Erreur",
          message: "Session expirée ou invalide"
        });
        navigate('/simulateur');
      }
    } catch (error) {
      console.error('Erreur chargement session:', error);
      addToast({
        type: 'error',
        title: "Erreur",
        message: "Impossible de charger les données de session"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (registrationData: any) => {
    setMigrationProgress(25);
    
    try {
      // Migrer la session vers le compte client
      const response = await fetch(`${config.API_URL}/api/session-migration/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionToken,
          clientData: registrationData
        })
      });

      const result = await response.json();

      if (result.success) {
        setMigrationProgress(100);
        
        // Connexion automatique
        const loginResponse = await fetch(`${config.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: registrationData.email,
            password: registrationData.password
          })
        });

        const loginResult = await loginResponse.json();

        if (loginResult.success) {
          localStorage.setItem('token', loginResult.data.token);
          setUser(loginResult.data.user);

          addToast({
            type: 'success',
            title: "🎉 Compte créé avec succès !",
            message: `Bienvenue ${registrationData.username} ! ${result.data.migratedProducts.length} produits éligibles ont été migrés.`
          });

          // Appeler le callback de complétion
          if (onComplete) {
            onComplete(result.data.clientId);
          }

          // Rediriger vers le dashboard
          navigate(`/dashboard/client/${result.data.clientId}`);
        }
      } else {
        throw new Error(result.error || 'Erreur lors de la migration');
      }
    } catch (error) {
      console.error('Erreur migration:', error);
      setMigrationProgress(0);
      
      addToast({
        type: 'error',
        title: "Erreur",
        message: error instanceof Error ? error.message : "Erreur lors de la migration"
      });
    }
  };

  // Composants pour chaque étape
  const SimulationResultsDisplay: React.FC = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vos résultats de simulation
        </h2>
        <p className="text-gray-600">
          Découvrez les produits éligibles pour votre entreprise
        </p>
      </div>

      {sessionData?.products && sessionData.products.length > 0 ? (
        <div className="grid gap-4">
          {sessionData.products.map((product: any) => (
            <Card key={product.id} className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">
                      {product.ProduitEligible?.nom || 'Produit'}
                    </h3>
                    <p className="text-sm text-green-600">
                      {product.ProduitEligible?.description || 'Description non disponible'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800">
                      {product.montantFinal?.toLocaleString('fr-FR')} €
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {Math.round((product.tauxFinal || 0) * 100)}% d'éligibilité
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Aucun produit éligible trouvé</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={() => setCurrentStep(1)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuer
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const ValueProposition: React.FC = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pourquoi créer un compte ?
        </h2>
        <p className="text-gray-600">
          Accédez à tous les avantages de Profitum
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Sauvegarde de vos résultats</h3>
                <p className="text-sm text-gray-600">
                  Vos produits éligibles sont sauvegardés et accessibles à tout moment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <UserPlus className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold">Accompagnement personnalisé</h3>
                <p className="text-sm text-gray-600">
                  Nos experts vous accompagnent dans la mise en œuvre de vos optimisations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Rocket className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold">Suivi en temps réel</h3>
                <p className="text-sm text-gray-600">
                  Suivez l'avancement de vos dossiers et optimisations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep(0)}
        >
          Retour
        </Button>
        <Button 
          onClick={() => setCurrentStep(2)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Créer mon compte
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const ClientRegistrationForm: React.FC = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      username: '',
      company_name: '',
      phone_number: '',
      address: '',
      city: '',
      postal_code: '',
      siren: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleRegistration(formData);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Créer votre compte
          </h2>
          <p className="text-gray-600">
            Remplissez le formulaire pour créer votre compte client
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SIREN *
              </label>
              <input
                type="text"
                required
                value={formData.siren}
                onChange={(e) => setFormData({...formData, siren: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal *
              </label>
              <input
                type="text"
                required
                value={formData.postal_code}
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              Retour
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Création en cours...' : 'Créer mon compte'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  const MigrationProgress: React.FC = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Migration de vos données
        </h2>
        <p className="text-gray-600">
          Nous migrons vos résultats de simulation vers votre nouveau compte
        </p>
      </div>

      <div className="space-y-4">
        <Progress value={migrationProgress} className="w-full" />
        <p className="text-center text-sm text-gray-600">
          {migrationProgress}% terminé
        </p>
      </div>

      <div className="grid gap-4">
        <Card className={migrationProgress >= 25 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {migrationProgress >= 25 ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              <div>
                <h3 className="font-semibold">Création du compte client</h3>
                <p className="text-sm text-gray-600">Création de votre profil utilisateur</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={migrationProgress >= 50 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {migrationProgress >= 50 ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              <div>
                <h3 className="font-semibold">Migration des produits éligibles</h3>
                <p className="text-sm text-gray-600">Transfert de vos résultats de simulation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={migrationProgress >= 75 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {migrationProgress >= 75 ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              <div>
                <h3 className="font-semibold">Configuration du dashboard</h3>
                <p className="text-sm text-gray-600">Préparation de votre espace personnel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={migrationProgress >= 100 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {migrationProgress >= 100 ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              <div>
                <h3 className="font-semibold">Finalisation</h3>
                <p className="text-sm text-gray-600">Redirection vers votre dashboard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const OnboardingComplete: React.FC = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue sur Profitum !
        </h2>
        <p className="text-gray-600">
          Votre compte a été créé avec succès et vos données ont été migrées.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Explorez vos produits éligibles dans votre dashboard</li>
          <li>• Contactez nos experts pour commencer vos optimisations</li>
          <li>• Suivez l'avancement de vos dossiers en temps réel</li>
        </ul>
      </div>

      <Button 
        onClick={() => navigate('/dashboard')}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Accéder à mon dashboard
      </Button>
    </div>
  );

  // Configuration des étapes
  const steps: MigrationStep[] = [
    {
      id: 'results',
      title: 'Vos résultats de simulation',
      description: 'Découvrez les produits éligibles',
      icon: <Database className="h-5 w-5" />,
      component: <SimulationResultsDisplay />
    },
    {
      id: 'value',
      title: 'Pourquoi créer un compte ?',
      description: 'Les avantages de Profitum',
      icon: <UserPlus className="h-5 w-5" />,
      component: <ValueProposition />
    },
    {
      id: 'registration',
      title: 'Créer votre compte',
      description: 'Formulaire d\'inscription',
      icon: <UserPlus className="h-5 w-5" />,
      component: <ClientRegistrationForm />
    },
    {
      id: 'migration',
      title: 'Migration de vos données',
      description: 'Transfert en cours',
      icon: <Database className="h-5 w-5" />,
      component: <MigrationProgress />
    },
    {
      id: 'onboarding',
      title: 'Bienvenue !',
      description: 'Configuration terminée',
      icon: <Rocket className="h-5 w-5" />,
      component: <OnboardingComplete />
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Indicateur d'étapes */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            {steps[currentStep].title}
          </h1>
          <p className="text-sm text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Contenu de l'étape actuelle */}
      <Card>
        <CardContent className="p-6">
          {steps[currentStep].component}
        </CardContent>
      </Card>
    </div>
  );
}; 