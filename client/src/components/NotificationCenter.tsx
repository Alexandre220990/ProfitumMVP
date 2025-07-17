import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, MessageSquare, Trash2, Users, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";

interface Notification {
  id: string;
  type: 'preselection' | 'message' | 'assignment' | 'system';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  data?: any;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  expertId: string;
}

// Optimisation : Composant Notification optimisé avec React.memo
const NotificationItem = React.memo(({
  notification,
  isExpanded,
  onToggleExpanded,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getNotificationBadge
}: {
  notification: Notification;
  isExpanded: boolean;
  onToggleExpanded: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: string) => React.ReactNode;
  getNotificationBadge: (type: string) => React.ReactNode;
}) => (
  <Card 
    className={`transition-all hover:shadow-md ${
      !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
    }`}
  >
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 text-sm">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                {getNotificationBadge(notification.type)}
                <span className="text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {notification.message}
            </p>
            
            {isExpanded && notification.data && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(notification.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {notification.data && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded(notification.id)}
              aria-label={isExpanded ? "Réduire" : "Développer"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
          
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              aria-label="Marquer comme lu"
            >
              <CheckCircle className="w-4 h-4 text-green-500" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

NotificationItem.displayName = 'NotificationItem';

export default function NotificationCenter({ isOpen, onClose, expertId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Optimisation : Charger les notifications avec useCallback
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/expert/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications: ', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les notifications quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && expertId) {
      loadNotifications();
    }
  }, [isOpen, expertId, loadNotifications]);

  // Optimisation : Marquer comme lu avec useCallback
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/expert/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu: ', error);
    }
  }, []);

  // Optimisation : Supprimer notification avec useCallback
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/expert/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression: ', error);
    }
  }, []);

  // Optimisation : Toggle expanded avec useCallback
  const toggleExpanded = useCallback((notificationId: string) => {
    setExpandedNotifications(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(notificationId)) {
        newExpanded.delete(notificationId);
      } else {
        newExpanded.add(notificationId);
      }
      return newExpanded;
    });
  }, []);

  // Optimisation : Icônes de notification avec useMemo
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'preselection':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'assignment':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  }, []);

  // Optimisation : Badges de notification avec useMemo
  const getNotificationBadge = useCallback((type: string) => {
    switch (type) {
      case 'preselection':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pré-sélection</Badge>;
      case 'message':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Message</Badge>;
      case 'assignment':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Assignment</Badge>;
      case 'system':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Système</Badge>;
      default:
        return <Badge variant="secondary">Autre</Badge>;
    }
  }, []);

  // Optimisation : Compteur de notifications non lues avec useMemo
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Optimisation : Notifications optimisées avec useMemo
  const optimizedNotifications = useMemo(() => {
    return notifications.map(notification => ({
      ...notification,
      isExpanded: expandedNotifications.has(notification.id)
    }));
  }, [notifications, expandedNotifications]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-6 h-6 mr-2 text-blue-600" />
              Centre de notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadNotifications}
              disabled={loading}
            >
              Actualiser
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune notification</h3>
              <p className="text-gray-500">
                Vous n'avez pas encore de notifications.
              </p>
            </div>
          ) : (
            optimizedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isExpanded={notification.isExpanded}
                onToggleExpanded={toggleExpanded}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                getNotificationIcon={getNotificationIcon}
                getNotificationBadge={getNotificationBadge}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 