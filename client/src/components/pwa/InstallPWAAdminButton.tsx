import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Smartphone, CheckCircle, AlertCircle, Share2, Shield } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

/**
 * Composant SPÉCIALISÉ pour installer l'application PWA ADMIN
 * Redirige toujours vers www.profitum.app/connect-admin
 */
export function InstallPWAAdminButton() {
  const { isInstallable, isInstalled, installing, platform, deferredPrompt, install } = usePWAInstall();
  const { user } = useAuth();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Changer le manifest pour les admins au montage
  useEffect(() => {
    // Changer le lien du manifest vers manifest-admin.json
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = '/manifest-admin.json';
      console.log('✅ Manifest changé vers manifest-admin.json pour admin');
    }
    
    // Stocker les valeurs admin dans localStorage
    localStorage.setItem('pwa_user_type', 'admin');
    localStorage.setItem('pwa_start_url', '/admin-redirect');
    
    return () => {
      // Restaurer le manifest normal au démontage
      if (manifestLink) {
        manifestLink.href = '/manifest.json';
      }
    };
  }, []);

  const handleAdminInstall = async () => {
    // Stocker les valeurs admin AVANT l'installation
    localStorage.setItem('pwa_user_type', 'admin');
    localStorage.setItem('pwa_start_url', '/admin-redirect');
    
    console.log('🔴 Installation PWA ADMIN - Configuration:', {
      pwa_user_type: localStorage.getItem('pwa_user_type'),
      pwa_start_url: localStorage.getItem('pwa_start_url')
    });

    if (platform === 'ios') {
      setShowIOSInstructions(true);
      return;
    }

    const success = await install();
    
    if (success) {
      toast.success('Installation démarrée', {
        description: 'L\'app admin s\'ouvrira automatiquement sur la page de connexion admin'
      });
    } else {
      if (platform === 'desktop') {
        toast.info('Installation via Chrome', {
          description: 'Utilisez l\'icône "Installer" dans la barre d\'adresse Chrome'
        });
      }
    }
  };

  // Si l'app est déjà installée
  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-green-900 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Application admin installée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-green-700 mb-3">
            L'application admin est déjà installée sur votre appareil.
          </p>
          <Button
            onClick={() => window.location.href = 'https://www.profitum.app/connect-admin'}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            Accéder à l'espace admin
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sur iOS, afficher les instructions spéciales pour admin
  if (platform === 'ios') {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-purple-600" />
            Installer l'app ADMIN
          </CardTitle>
          <CardDescription className="text-xs">
            Instructions pour installer l'app admin sur iOS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showIOSInstructions ? (
            <Button
              onClick={handleAdminInstall}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Voir les instructions admin
            </Button>
          ) : (
            <div className="space-y-2 text-xs text-gray-700">
              <Alert className="bg-purple-50 border-purple-200">
                <AlertCircle className="w-4 h-4 text-purple-600" />
                <AlertDescription className="text-xs">
                  <p className="font-semibold mb-2 text-purple-900">Instructions pour iOS :</p>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Appuyez sur le bouton <strong>Partager</strong> <Share2 className="w-3 h-3 inline" /> en bas de Safari</li>
                    <li>Sélectionnez <strong>"Sur l'écran d'accueil"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong></li>
                    <li>Appuyez sur <strong>"Ajouter"</strong></li>
                  </ol>
                  <p className="mt-3 text-purple-800 font-semibold">
                    ✅ L'app s'ouvrira automatiquement sur la page de connexion admin !
                  </p>
                  <p className="mt-2 text-purple-700 text-xs">
                    Note : Si le champ URL est visible mais non modifiable, c'est normal sur iOS. L'app utilisera automatiquement la bonne URL grâce au manifest admin.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Sur Android ou Desktop
  if (isInstallable || platform === 'android' || platform === 'desktop') {
    const hasDeferredPrompt = !!deferredPrompt;
    const canInstall = isInstallable || platform === 'desktop';
    
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-purple-600" />
            Installer l'app ADMIN
          </CardTitle>
          <CardDescription className="text-xs">
            Installation spéciale pour accéder à l'espace admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAdminInstall}
            disabled={installing}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
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
                Installer l'app ADMIN
              </>
            )}
          </Button>
          <p className="text-xs text-purple-700 mt-3 text-center">
            ⚡ Cette installation redirigera automatiquement vers <br />
            <strong>www.profitum.app/connect-admin</strong>
          </p>
          {platform === 'desktop' && !hasDeferredPrompt && (
            <Alert className="mt-3">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <p className="font-semibold mb-1">Instructions pour Chrome Desktop :</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Cliquez sur le bouton d'installation ci-dessus</li>
                  <li>L'app s'ouvrira sur <strong>www.profitum.app/connect-admin</strong></li>
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

  // Plateforme non supportée
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
          L'installation n'est pas disponible sur cette plateforme.
        </p>
      </CardContent>
    </Card>
  );
}

