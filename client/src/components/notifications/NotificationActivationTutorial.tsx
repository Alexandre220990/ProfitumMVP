/**
 * Didacticiel pour activer les notifications navigateur
 * Intégré dans les settings avec le bouton d'installation PWA
 * Guide l'utilisateur étape par étape pour activer les notifications
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Info,
  Download,
  ChevronRight
} from 'lucide-react';
import { useBrowserPushNotifications } from '@/hooks/useBrowserPushNotifications';
import { InstallPWAButton } from '@/components/pwa/InstallPWAButton';
import { cn } from '@/lib/utils';

export function NotificationActivationTutorial() {
  const { permission, requestPermission, isSupported, isLoading } = useBrowserPushNotifications();
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  // Détecter le navigateur
  const getBrowser = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('edg')) return 'edge';
    return 'unknown';
  };

  const browser = getBrowser();

  const steps = [
    {
      id: 'install',
      title: 'Installer l\'application',
      description: 'Pour recevoir les notifications même quand l\'app est fermée, installez l\'application sur votre appareil.',
      icon: Download,
      completed: false, // Sera déterminé dynamiquement
      action: <InstallPWAButton />
    },
    {
      id: 'permission',
      title: 'Activer les notifications navigateur',
      description: 'Autorisez les notifications dans votre navigateur pour recevoir des alertes en temps réel.',
      icon: Bell,
      completed: permission === 'granted',
      action: (
        <Button 
          onClick={requestPermission} 
          disabled={permission === 'granted' || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Vérification...
            </>
          ) : permission === 'granted' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Notifications activées
            </>
          ) : permission === 'denied' ? (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Permission refusée - Voir le guide
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Activer les notifications
            </>
          )}
        </Button>
      )
    },
    {
      id: 'browser-settings',
      title: 'Vérifier les paramètres du navigateur',
      description: 'Si les notifications ne fonctionnent pas, vérifiez les paramètres de votre navigateur.',
      icon: Settings,
      completed: permission === 'granted',
      action: (
        <div className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => setShowBrowserGuide(!showBrowserGuide)}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showBrowserGuide ? 'Masquer' : 'Afficher'} le guide d'activation
            <ChevronRight className={cn(
              "w-4 h-4 ml-2 transition-transform",
              showBrowserGuide && "rotate-90"
            )} />
          </Button>
          
          {showBrowserGuide && (
            <Card className="bg-blue-50 border-blue-200 mt-2">
              <CardContent className="pt-4 p-4 sm:p-6">
                {browser === 'chrome' && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-semibold text-blue-900">Chrome :</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-blue-800 leading-relaxed">
                      <li>Cliquez sur l'icône <strong>🔒</strong> ou <strong>ℹ️</strong> à gauche de l'adresse</li>
                      <li>Sélectionnez <strong>"Notifications"</strong></li>
                      <li>Choisissez <strong>"Autoriser"</strong></li>
                      <li>Actualisez la page</li>
                    </ol>
                    <Alert className="mt-3 bg-blue-100 border-blue-300">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                        <strong>Alternative :</strong> Paramètres → Confidentialité et sécurité → Notifications → Autoriser pour ce site
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                {browser === 'firefox' && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-semibold text-blue-900">Firefox :</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-blue-800 leading-relaxed">
                      <li>Cliquez sur l'icône <strong>🔒</strong> à gauche de l'adresse</li>
                      <li>Sélectionnez <strong>"Plus d'informations"</strong></li>
                      <li>Dans l'onglet <strong>"Permissions"</strong>, trouvez <strong>"Notifications"</strong></li>
                      <li>Choisissez <strong>"Autoriser"</strong></li>
                    </ol>
                  </div>
                )}
                
                {browser === 'safari' && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-semibold text-blue-900">Safari :</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-blue-800 leading-relaxed">
                      <li>Menu <strong>Safari</strong> → <strong>"Préférences"</strong></li>
                      <li>Onglet <strong>"Sites web"</strong></li>
                      <li>Section <strong>"Notifications"</strong></li>
                      <li>Sélectionnez le site et choisissez <strong>"Autoriser"</strong></li>
                    </ol>
                  </div>
                )}
                
                {browser === 'edge' && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-semibold text-blue-900">Edge :</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-blue-800 leading-relaxed">
                      <li>Cliquez sur l'icône <strong>🔒</strong> à gauche de l'adresse</li>
                      <li>Sélectionnez <strong>"Notifications"</strong></li>
                      <li>Choisissez <strong>"Autoriser"</strong></li>
                    </ol>
                  </div>
                )}
                
                {browser === 'unknown' && (
                  <Alert className="bg-blue-100 border-blue-300">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                      Consultez les paramètres de votre navigateur pour activer les notifications.
                      Recherchez "Notifications" dans les paramètres de confidentialité.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )
    }
  ];

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <XCircle className="w-5 h-5" />
            Notifications non supportées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDescription className="text-orange-800">
            Votre navigateur ne supporte pas les notifications push. 
            Veuillez utiliser un navigateur moderne (Chrome, Firefox, Safari, Edge).
          </AlertDescription>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = steps.filter(s => s.completed).length;
  const allCompleted = permission === 'granted';

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <span className="break-words">Activation des notifications</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Suivez ces étapes pour activer les notifications et recevoir des alertes en temps réel
            </CardDescription>
          </div>
          {allCompleted && (
            <Badge variant="default" className="bg-green-500 self-start sm:self-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Activé
            </Badge>
          )}
        </div>
        
        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>Progression</span>
            <span className="font-semibold">{completedSteps} / {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-6">
        {steps.map((step, index) => {
          const isCompleted = step.completed;

          return (
            <div 
              key={step.id}
              className={cn(
                "border-l-4 pl-3 sm:pl-4 py-3 sm:py-4 transition-all rounded-r-lg",
                isCompleted ? "border-l-green-500 bg-green-50" : 
                "border-l-gray-300 bg-gray-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
                      isCompleted ? "bg-green-500 text-white" :
                      "bg-gray-300 text-gray-600"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <span className="text-xs sm:text-sm">{index + 1}</span>
                      )}
                    </div>
                    <h3 className={cn(
                      "font-semibold text-sm sm:text-base break-words",
                      isCompleted && "text-green-700"
                    )}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 ml-0 sm:ml-10 mb-3 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="ml-0 sm:ml-10">
                    {step.action}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Message de succès */}
        {allCompleted && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <AlertDescription className="text-green-800 text-sm sm:text-base">
              <strong>Parfait !</strong> Les notifications sont activées. 
              Vous recevrez désormais des alertes en temps réel pour toutes vos notifications importantes.
            </AlertDescription>
          </Alert>
        )}

        {/* Message si permission refusée */}
        {permission === 'denied' && (
          <Alert className="bg-orange-50 border-orange-200">
            <XCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <AlertDescription className="text-orange-800 text-sm sm:text-base">
              <strong>Permission refusée.</strong> Pour activer les notifications, vous devez modifier les paramètres de votre navigateur. 
              Consultez le guide ci-dessus pour les instructions détaillées.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

