import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Smartphone, CheckCircle, AlertCircle, Share2, ArrowUp } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
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
  const { isInstallable, isInstalled, installing, platform, install } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSInstructions(true);
      return;
    }

    const success = await install();
    
    if (success) {
      toast.success('Installation démarrée', {
        description: 'Suivez les instructions à l\'écran pour terminer l\'installation.'
      });
    } else {
      toast.error('Installation annulée', {
        description: 'L\'installation a été annulée ou n\'est pas disponible.'
      });
    }
  };

  // Si l'app est déjà installée
  if (isInstalled) {
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

  // Sur Android ou Desktop, afficher le bouton d'installation
  if (isInstallable || platform === 'android' || platform === 'desktop') {
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
        <CardContent>
          <Button
            onClick={handleInstall}
            disabled={installing || !isInstallable}
            className="w-full bg-blue-600 hover:bg-blue-700"
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
                Installer l'app
              </>
            )}
          </Button>
          {!isInstallable && platform !== 'ios' && (
            <p className="text-xs text-gray-600 mt-2 text-center">
              L'installation n'est pas disponible pour le moment. Essayez avec Chrome ou Edge.
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

