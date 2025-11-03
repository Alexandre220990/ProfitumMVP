/**
 * Bandeau de notifications pour le dashboard client
 * Affiche les notifications récentes avec auto-dismiss
 */

import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata?: {
    dossier_id?: string;
    client_produit_id?: string;
    action_required?: boolean;
    status_change?: string;
  };
}

interface NotificationBannerProps {
  notifications: Notification[];
  onDismiss: (notificationId: string) => void;
  onNavigate?: (dossierId: string) => void;
}

export function NotificationBanner({ notifications, onDismiss, onNavigate }: NotificationBannerProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);

  // Afficher les 3 notifications les plus récentes non lues
  const recentUnreadNotifs = notifications
    .filter((n) => !n.read)
    .slice(0, 3);

  // Auto-dismiss après 10 secondes
  useEffect(() => {
    recentUnreadNotifs.forEach((notif) => {
      if (!visibleNotifications.includes(notif.id)) {
        setVisibleNotifications((prev) => [...prev, notif.id]);

        // Auto-dismiss après 10 secondes
        setTimeout(() => {
          setVisibleNotifications((prev) => prev.filter((id) => id !== notif.id));
        }, 10000);
      }
    });
  }, [recentUnreadNotifs.length]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const handleDismiss = (notificationId: string) => {
    setVisibleNotifications((prev) => prev.filter((id) => id !== notificationId));
    onDismiss(notificationId);
  };

  const handleNavigate = (notif: Notification) => {
    const dossierId = notif.metadata?.client_produit_id || notif.metadata?.dossier_id;
    if (dossierId && onNavigate) {
      onNavigate(dossierId);
      handleDismiss(notif.id);
    }
  };

  const visibleNotifs = recentUnreadNotifs.filter((n) => visibleNotifications.includes(n.id));

  if (visibleNotifs.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      {visibleNotifs.map((notif) => (
        <Alert
          key={notif.id}
          className={`${getNotificationStyle(notif.type)} border-2 shadow-lg animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notif.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-gray-900">{notif.title}</h4>
                  {notif.metadata?.action_required && (
                    <Badge className="bg-red-500 text-white text-xs animate-pulse">
                      Action requise
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/50"
                  onClick={() => handleDismiss(notif.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <AlertDescription className="text-sm text-gray-700 mb-3">
                {notif.message}
              </AlertDescription>

              {(notif.metadata?.client_produit_id || notif.metadata?.dossier_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleNavigate(notif)}
                >
                  Voir le dossier
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}

