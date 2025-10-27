/**
 * FCM PERMISSION PROMPT
 * 
 * Composant pour demander les permissions de notifications push
 * Affiche un prompt élégant et explicatif
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, BellOff, Check, X, Smartphone, Laptop, Info } from 'lucide-react';
import { useFCMNotifications } from '@/hooks/useFCMNotifications';
import { toast } from 'sonner';

interface FCMPermissionPromptProps {
  variant?: 'card' | 'inline' | 'modal';
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  className?: string;
}

export function FCMPermissionPrompt({
  variant = 'card',
  onPermissionGranted,
  onPermissionDenied,
  className = ''
}: FCMPermissionPromptProps) {
  
  const {
    isSupported,
    isInitialized,
    permission,
    isLoading,
    requestPermission,
    unregisterToken
  } = useFCMNotifications();

  const [isDismissed, setIsDismissed] = useState(false);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    
    if (granted) {
      onPermissionGranted?.();
      toast.success('Notifications activées !', {
        description: 'Vous recevrez désormais les notifications même quand l\'app est fermée.'
      });
    } else {
      onPermissionDenied?.();
      toast.error('Permission refusée', {
        description: 'Vous pouvez l\'activer plus tard dans les paramètres de votre navigateur.'
      });
    }
  };

  const handleDisableNotifications = async () => {
    const success = await unregisterToken();
    if (success) {
      toast.success('Notifications désactivées');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('fcm_prompt_dismissed', 'true');
  };

  // Ne pas afficher si :
  // - Pas supporté
  // - Déjà initialisé et permissions accordées
  // - Dismissed par l'utilisateur
  if (!isSupported) {
    return null;
  }

  if (permission === 'granted' && isInitialized) {
    return null;
  }

  if (isDismissed || localStorage.getItem('fcm_prompt_dismissed') === 'true') {
    return null;
  }

  // ============================================================================
  // VARIANTE CARD (par défaut)
  // ============================================================================

  if (variant === 'card') {
    return (
      <Card className={`border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Activer les notifications push</CardTitle>
                <CardDescription className="mt-1">
                  Restez informé même quand l'application est fermée
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avantages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Notifications instantanées</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Fonctionne en arrière-plan</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Sur tous vos appareils</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Désactivable à tout moment</span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Activation...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Activer les notifications
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
            >
              Plus tard
            </Button>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-100/50 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Vous pouvez gérer vos préférences de notifications dans les Paramètres
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // VARIANTE INLINE (compacte)
  // ============================================================================

  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-sm text-gray-900">Activer les notifications push</p>
            <p className="text-xs text-gray-600">Recevoir les alertes en temps réel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            {isLoading ? 'Activation...' : 'Activer'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VARIANTE MODAL (plein écran)
  // ============================================================================

  if (variant === 'modal') {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${className}`}>
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Bell className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              Activer les notifications
            </CardTitle>
            <CardDescription className="text-center mt-2">
              Ne manquez plus aucune mise à jour importante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avantages */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Sur mobile</p>
                  <p className="text-xs text-gray-600">Recevez les notifications sur votre téléphone</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Laptop className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Sur ordinateur</p>
                  <p className="text-xs text-gray-600">Même quand le navigateur est fermé</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Temps réel</p>
                  <p className="text-xs text-gray-600">Soyez notifié instantanément des mises à jour</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="w-full"
              >
                Plus tard
              </Button>
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isLoading ? 'Activation...' : 'Activer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// ============================================================================
// COMPOSANT STATUS (afficher l'état des notifications)
// ============================================================================

export function FCMNotificationStatus({ className = '' }: { className?: string }) {
  const { isSupported, isInitialized, permission } = useFCMNotifications();

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <BellOff className="w-4 h-4" />
        <span>Notifications non supportées sur cet appareil</span>
      </div>
    );
  }

  if (permission === 'granted' && isInitialized) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Notifications actives
        </Badge>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="destructive" className="flex items-center gap-1">
          <X className="w-3 h-3" />
          Permission refusée
        </Badge>
        <span className="text-xs text-gray-600">
          Vous pouvez l'activer dans les paramètres du navigateur
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="flex items-center gap-1">
        <Bell className="w-3 h-3" />
        Non activées
      </Badge>
    </div>
  );
}

