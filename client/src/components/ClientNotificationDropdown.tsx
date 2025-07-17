import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  MessageSquare, 
  FileText, 
  Briefcase, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useClientNotifications } from '@/hooks/use-client-notifications';
import { ClientNotification } from '@/services/client-notification-service';
import { cn } from '@/lib/utils';

interface ClientNotificationDropdownProps {
  className?: string;
}

export const ClientNotificationDropdown: React.FC<ClientNotificationDropdownProps> = ({ 
  className 
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showRead, setShowRead] = useState(false);
  
  const {
    notifications,
    unreadNotifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    getRedirectUrl,
    getIcon,
    getColor
  } = useClientNotifications();

  // Afficher les notifications (non lues + lues si demandé, max 10)
  const displayedNotifications = showRead 
    ? notifications.slice(0, 10)
    : unreadNotifications.slice(0, 10);

  // Gérer le clic sur une notification
  const handleNotificationClick = async (notification: ClientNotification) => {
    // Marquer comme lue
    await markAsRead(notification.id);
    
    // Rediriger si une URL est définie
    const redirectUrl = getRedirectUrl(notification);
    if (redirectUrl) {
      navigate(redirectUrl);
    }
    
    // Fermer le dropdown
    setIsOpen(false);
  };

  // Gérer le marquage comme lu
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  // Gérer le rejet
  const handleDismiss = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await dismissNotification(notificationId);
  };

  // Obtenir l'icône pour un type de notification
  const getNotificationIcon = (type: string) => {
    const iconName = getIcon(type);
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare className="h-4 w-4" />;
      case 'FileText':
        return <FileText className="h-4 w-4" />;
      case 'Briefcase':
        return <Briefcase className="h-4 w-4" />;
      case 'Users':
        return <Users className="h-4 w-4" />;
      case 'Clock':
        return <Clock className="h-4 w-4" />;
      case 'AlertTriangle':
        return <AlertTriangle className="h-4 w-4" />;
      case 'CheckCircle':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {stats.unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-hidden"
        sideOffset={8}
      >
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {stats.unread > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.unread} non lues
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRead(!showRead)}
                className="h-8 w-8 p-0"
                title={showRead ? "Masquer les lues" : "Afficher les lues"}
              >
                {showRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {stats.unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs"
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {showRead ? "Aucune notification" : "Aucune notification non lue"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                    !notification.is_read && "bg-blue-50 hover:bg-blue-100"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Icône */}
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      getColor(notification.notification_type).split(' ')[1] // bg-color
                    )}>
                      <div className={cn(
                        "h-4 w-4",
                        getColor(notification.notification_type).split(' ')[0] // text-color
                      )}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              Urgent
                            </Badge>
                          )}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </span>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="h-6 w-6 p-0 hover:bg-green-100"
                              title="Marquer comme lu"
                            >
                              <Eye className="h-3 w-3 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDismiss(notification.id, e)}
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            title="Rejeter"
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>

        {/* Pied de page */}
        {displayedNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {stats.total} notification{stats.total > 1 ? 's' : ''} au total
              </span>
              {stats.urgent > 0 && (
                <span className="text-red-600 font-medium">
                  {stats.urgent} urgent{stats.urgent > 1 ? 'es' : 'e'}
                </span>
              )}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 