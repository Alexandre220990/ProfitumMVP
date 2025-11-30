import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Smartphone, CheckCircle, AlertCircle, Share2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

/**
 * Composant pour installer l'application PWA
 * 
 * Affiche :
 * - Un bouton d'installation pour Android
 * - Des instructions pour iOS
 * - Le statut d'installation actuel
 */
export function InstallPWAButton() {
  const { isInstallable, isInstalled, installing, platform, deferredPrompt, install } = usePWAInstall();
  const { user } = useAuth();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSInstructions(true);
      return;
    }

    // AVANT l'installation, stocker le type d'utilisateur et l'URL de démarrage
    if (user?.type) {
      localStorage.setItem('pwa_user_type', user.type);
      
      // Définir l'URL de démarrage selon le type
      // Pour les admins, utiliser l'URL absolue www.profitum.app/connect-admin
      const startUrls: Record<string, string> = {
        'admin': 'https://www.profitum.app/connect-admin',
        'client': user.id ? `/dashboard/client/${user.id}` : '/dashboard/client',
        'expert': '/expert/dashboard',
        'apporteur': '/apporteur/dashboard'
      };
      
      const startUrl = startUrls[user.type] || '/';
      localStorage.setItem('pwa_start_url', startUrl);
      
      console.log(`📱 Installation PWA pour type ${user.type}, start_url: ${startUrl}`);
    } else {
      // Si pas d'utilisateur connecté, utiliser '/' par défaut
      localStorage.setItem('pwa_user_type', 'guest');
      localStorage.setItem('pwa_start_url', '/');
    }

    const success = await install();
    
    if (success) {
      if (platform === 'desktop' && !deferredPrompt) {
        toast.info('Installation disponible', {
          description: 'Recherchez l\'icône "Installer" dans la barre d\'adresse Chrome, ou utilisez le menu Chrome (⋮) → Installer Profitum...',
          duration: 8000,
        });
      } else {
        toast.success('Installation démarrée', {
          description: 'Suivez les instructions à l\'écran pour terminer l\'installation.'
        });
      }
    } else {
      if (platform === 'desktop') {
        toast.info('Installation via Chrome', {
          description: 'Utilisez l\'icône "Installer" dans la barre d\'adresse Chrome, ou le menu Chrome (⋮) → Installer Profitum...',
          duration: 8000,
        });
      } else {
        toast.error('Installation annulée', {
          description: 'L\'installation a été annulée ou n\'est pas disponible.'
        });
      }
    }
  };

  // Si l'app est déjà installée
  if (isInstalled) {
    // Si admin et app installée, vérifier et rediriger si nécessaire
    useEffect(() => {
      if (user?.type === 'admin') {
        const pwaUserType = localStorage.getItem('pwa_user_type');
        const currentPath = window.location.pathname;
        
        // Si on est admin mais pas sur connect-admin, rediriger
        if (currentPath !== '/connect-admin' && currentPath !== '/') {
          console.log('🚨 Admin détecté sur app installée - Redirection vers connect-admin');
          window.location.href = 'https://www.profitum.app/connect-admin';
        } else if (pwaUserType === 'admin' && currentPath === '/') {
          console.log('🚨 Admin détecté sur home - Redirection vers connect-admin');
          window.location.href = 'https://www.profitum.app/connect-admin';
        }
      }
    }, [user, isInstalled]);
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-green-900 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Application installée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-green-700">
            L'application est déjà installée sur votre appareil.
          </p>
          {user?.type === 'admin' && (
            <Button
              onClick={() => window.location.href = 'https://www.profitum.app/connect-admin'}
              className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              Accéder à la page admin
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Sur iOS, afficher les instructions
  if (platform === 'ios') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
            Installer l'application
          </CardTitle>
          <CardDescription className="text-xs">
            Suivez ces étapes pour installer l'app sur iOS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showIOSInstructions ? (
            <Button
              onClick={handleInstall}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Voir les instructions
            </Button>
          ) : (
            <div className="space-y-2 text-xs text-gray-700">
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Appuyez sur le bouton <strong>Partager</strong> <Share2 className="w-3 h-3 inline" /> en bas de l'écran Safari</li>
                    <li>Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong></li>
                    <li>Confirmez en appuyant sur <strong>"Ajouter"</strong></li>
                  </ol>
                </AlertDescription>
              </Alert>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Note :</strong> Cette fonctionnalité nécessite iOS 16.4 ou supérieur.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Bouton spécial pour les admins qui redirige vers www.profitum.app/connect-admin
  const handleAdminInstall = () => {
    console.log('🔴 BOUTON ADMIN CLIQUÉ - Configuration PWA admin');
    
    // Stocker l'URL absolue pour les admins AVANT l'installation
    localStorage.setItem('pwa_user_type', 'admin');
    localStorage.setItem('pwa_start_url', 'https://www.profitum.app/connect-admin');
    
    console.log('✅ localStorage configuré:', {
      pwa_user_type: localStorage.getItem('pwa_user_type'),
      pwa_start_url: localStorage.getItem('pwa_start_url')
    });
    
    // Si on est déjà en mode PWA, rediriger immédiatement
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      console.log('🚨 Déjà en mode PWA - Redirection IMMÉDIATE');
      window.location.href = 'https://www.profitum.app/connect-admin';
      return;
    }
    
    // Sinon, déclencher l'installation normale qui utilisera les valeurs stockées
    handleInstall();
  };

  // Sur Android ou Desktop, afficher le bouton d'installation
  if (isInstallable || platform === 'android' || platform === 'desktop') {
    const hasDeferredPrompt = !!deferredPrompt;
    const canInstall = isInstallable || platform === 'desktop';
    const isAdmin = user?.type === 'admin';
    
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
            Installer l'application
          </CardTitle>
          <CardDescription className="text-xs">
            Installez Profitum sur votre appareil pour un accès rapide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Bouton spécial pour les admins */}
          {isAdmin && (
            <div className="space-y-2">
              <Button
                onClick={handleAdminInstall}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Installer pour Admin (www.profitum.app/connect-admin)
              </Button>
              <p className="text-xs text-purple-700 text-center">
                ⚡ Bouton spécial admin : redirige directement vers la page de connexion admin
              </p>
              <div className="border-t border-purple-200 my-2"></div>
            </div>
          )}
          
          {/* Bouton d'installation standard */}
          <Button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            size="sm"
          >
            {installing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Installation...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {isAdmin ? 'Installer l\'app (standard)' : 'Installer l\'app'}
              </>
            )}
          </Button>
          {platform === 'desktop' && !hasDeferredPrompt && (
            <Alert className="mt-3">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <p className="font-semibold mb-1">Instructions pour Chrome Desktop :</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Cliquez sur le bouton d'installation ci-dessus</li>
                  <li>Si le prompt n'apparaît pas, utilisez l'icône <strong>Installer</strong> dans la barre d'adresse Chrome</li>
                  <li>Ou allez dans le menu Chrome (⋮) → <strong>Installer Profitum...</strong></li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
          {!canInstall && (
            <p className="text-xs text-gray-600 mt-2 text-center">
              L'installation nécessite Chrome ou Edge avec HTTPS activé.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Plateforme non supportée ou inconnue
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-gray-600" />
          Installation non disponible
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-600">
          L'installation n'est pas disponible sur cette plateforme. Utilisez Chrome ou Edge sur Android pour installer l'application.
        </p>
      </CardContent>
    </Card>
  );
}

