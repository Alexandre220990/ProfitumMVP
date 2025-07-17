import { useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Eye, Share2, AlertCircle, Info, X, Clock, User, CheckCircle, FileText } from "lucide-react";
import { DocumentNotification } from "@/services/messaging-document-integration";
import { useToast } from "@/hooks/use-toast";

interface DocumentNotificationsProps {
  notifications: DocumentNotification[];
  onDismiss?: (notificationId: string) => void;
  onAction?: (notification: DocumentNotification) => void;
  maxNotifications?: number;
}

// Configuration statique pour les types de notifications
const NOTIFICATION_CONFIG = {
  document_uploaded: {
    icon: <FileText className="h-4 w-4 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200',
    badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">Uploadé</Badge>,
    toast: { title: "Document uploadé", description: "Le document a été ajouté à votre espace documentaire" }
  },
  document_shared: {
    icon: <Share2 className="h-4 w-4 text-green-500" />,
    color: 'bg-green-50 border-green-200',
    badge: <Badge variant="secondary" className="bg-green-100 text-green-800">Partagé</Badge>,
    toast: { title: "Document partagé", description: "Le document a été partagé avec succès" }
  },
  document_approved: {
    icon: <CheckCircle className="h-4 w-4 text-green-600" />,
    color: 'bg-green-50 border-green-200',
    badge: <Badge variant="secondary" className="bg-green-100 text-green-800">Approuvé</Badge>,
    toast: { title: "Document approuvé", description: "Le document a été approuvé par l'expert" }
  },
  document_rejected: {
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    color: 'bg-red-50 border-red-200',
    badge: <Badge variant="secondary" className="bg-red-100 text-red-800">Rejeté</Badge>,
    toast: { title: "Document rejeté", description: "Le document nécessite des modifications", variant: "destructive" as const }
  }
} as const;

// Composant mémorisé pour une notification individuelle
const NotificationItem = memo<{
  notification: DocumentNotification;
  isExpanded: boolean;
  onToggleExpanded: (id: string) => void;
  onAction: (notification: DocumentNotification) => void;
  onDismiss?: (id: string) => void;
}>(({ notification, isExpanded, onToggleExpanded, onAction, onDismiss }) => {
  const config = NOTIFICATION_CONFIG[notification.type] || {
    icon: <Info className="h-4 w-4 text-gray-500" />,
    color: 'bg-gray-50 border-gray-200',
    badge: <Badge variant="secondary">Info</Badge>
  };

  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  }, []);

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${config.color}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {config.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.message}
                </p>
                {config.badge}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(notification.timestamp || new Date().toISOString())}</span>
                </div>
                
                {notification.expertId && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Expert</span>
                  </div>
                )}
              </div>

              {/* Détails étendus */}
              {isExpanded && (
                <div className="mt-3 p-3 bg-white rounded-lg border">
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong>Document ID: </strong> {notification.documentId}
                    </div>
                    <div>
                      <strong>Client ID: </strong> {notification.clientId}
                    </div>
                    {notification.expertId && (
                      <div>
                        <strong>Expert ID: </strong> {notification.expertId}
                      </div>
                    )}
                    {notification.actionUrl && (
                      <div>
                        <strong>Action URL: </strong> {notification.actionUrl}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded(notification.documentId)}
              className="h-6 w-6 p-0"
            >
              <Info className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(notification)}
              className="h-6 w-6 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.documentId)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

NotificationItem.displayName = 'NotificationItem';

export const DocumentNotifications = memo<DocumentNotificationsProps>(({ 
  notifications, 
  onDismiss, 
  onAction, 
  maxNotifications = 10 
}) => {
  const { toast } = useToast();
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Callbacks mémorisés
  const toggleExpanded = useCallback((notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  const handleAction = useCallback((notification: DocumentNotification) => {
    if (onAction) {
      onAction(notification);
    } else {
      // Actions par défaut
      const config = NOTIFICATION_CONFIG[notification.type];
      if (config?.toast) {
        toast(config.toast);
      }
    }
  }, [onAction, toast]);

  const handleDismiss = useCallback((notificationId: string) => {
    if (onDismiss) {
      onDismiss(notificationId);
    }
  }, [onDismiss]);

  // États mémorisés
  const displayedNotifications = useMemo(() => 
    notifications.slice(0, maxNotifications), 
    [notifications, maxNotifications]
  );

  const emptyState = useMemo(() => (
    <Card className="p-6">
      <CardContent className="text-center">
        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Aucune notification documentaire</p>
      </CardContent>
    </Card>
  ), []);

  if (notifications.length === 0) {
    return emptyState;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Notifications documentaires ({notifications.length})
        </h3>
        {notifications.length > maxNotifications && (
          <Badge variant="outline" className="text-xs">
            +{notifications.length - maxNotifications} autres
          </Badge>
        )}
      </div>

      {displayedNotifications.map((notification) => (
        <NotificationItem
          key={notification.documentId}
          notification={notification}
          isExpanded={expandedNotifications.has(notification.documentId)}
          onToggleExpanded={toggleExpanded}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
});

DocumentNotifications.displayName = 'DocumentNotifications';

export default DocumentNotifications; 