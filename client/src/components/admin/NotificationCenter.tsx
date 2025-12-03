/**
 * NotificationCenter - Centre de notifications admin
 * Intégré dans le dashboard admin optimisé
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Users,
  Eye,
  Trash2,
  Mail,
  Phone,
  User,
  Zap,
  Timer
} from 'lucide-react';
import { config } from '@/config/env';
import { useNavigate } from 'react-router-dom';
import { 
  calculateSLAStatus, 
  formatTimeRemaining, 
  formatTimeElapsed,
  getSLAStatusClasses
} from '@/utils/notification-sla';
import { NotificationGroup } from './NotificationGroup';

interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_parent?: boolean;
  is_child?: boolean;
  hidden_in_list?: boolean;
  children_count?: number;
  parent_id?: string;
  action_url?: string;
  action_data?: any;
  metadata?: any;
  created_at: string;
}

interface NotificationCenterProps {
  onNotificationAction?: (notificationId: string, action: 'validate' | 'reject') => void;
  compact?: boolean;
}

export function NotificationCenter({ onNotificationAction, compact = false }: NotificationCenterProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('unread');
  const [selectedContact, setSelectedContact] = useState<Notification | null>(null);

  useEffect(() => {
    loadNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/api/notifications/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Mettre à jour l'état local immédiatement
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        // Recharger depuis le serveur pour garantir la cohérence
        await loadNotifications();
      }
    } catch (error) {
      console.error('❌ Erreur marquage lu:', error);
      // En cas d'erreur, recharger quand même pour récupérer l'état réel
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Si c'est une notification de contact, ouvrir le popup
    if (notification.notification_type === 'contact_message') {
      setSelectedContact(notification);
      return;
    }

    // Rediriger vers l'action
    if (notification.action_url) {
      // Si l'action_url contient un ID de dossier, on peut déclencher l'action directement
      if (notification.action_data?.action_required === 'validate_eligibility') {
        const dossierId = notification.action_data.client_produit_id;
        if (onNotificationAction && dossierId) {
          onNotificationAction(dossierId, 'validate');
        }
      } else {
        navigate(notification.action_url);
      }
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/notifications/${notificationId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Notification supprimée');
      }
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationTileClasses = (notification: Notification) => {
    const baseClasses = 'p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md';
    
    // Indicateur visuel pour non lue
    const unreadClasses = !notification.is_read 
      ? 'bg-blue-50/80 border-blue-300 shadow-sm ring-2 ring-blue-200/50' 
      : 'bg-white border-gray-200';
    
    // Indicateur visuel pour urgence
    const urgentClasses = (notification.priority === 'urgent' || notification.priority === 'high') && !notification.is_read
      ? 'ring-2 ring-red-300/50 border-red-300'
      : '';
    
    // Calculer le statut SLA
    const slaStatus = calculateSLAStatus(notification.notification_type, notification.created_at);
    const slaClasses = slaStatus.status === 'overdue' 
      ? 'ring-2 ring-red-500/30 border-red-400'
      : slaStatus.status === 'critical'
      ? 'ring-1 ring-red-300/30'
      : '';
    
    return `${baseClasses} ${unreadClasses} ${urgentClasses} ${slaClasses}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'admin_action_required': return <FileText className="w-5 h-5 text-red-500" />;
      case 'expert_assigned': return <Users className="w-5 h-5 text-blue-500" />;
      case 'contact_message': return <Mail className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'urgent') {
      const isUrgent = (n.priority === 'high' || n.priority === 'urgent') && !n.is_read;
      if (isUrgent) return true;
      // Inclure aussi les notifications avec SLA dépassé
      const slaStatus = calculateSLAStatus(n.notification_type, n.created_at);
      return slaStatus.status === 'overdue' || slaStatus.status === 'critical';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => {
    const isUrgent = (n.priority === 'high' || n.priority === 'urgent') && !n.is_read;
    if (isUrgent) return true;
    const slaStatus = calculateSLAStatus(n.notification_type, n.created_at);
    return (slaStatus.status === 'overdue' || slaStatus.status === 'critical') && !n.is_read;
  }).length;

  if (loading) {
    return (
      <Card className={compact ? '' : 'shadow-lg'}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${compact ? '' : 'shadow-lg'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Non lues ({unreadCount})
            </Button>
            <Button
              variant={filter === 'urgent' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('urgent')}
            >
              Urgentes ({urgentCount})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toutes
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucune notification</p>
            <p className="text-sm">Vous êtes à jour !</p>
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[500px]'}>
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                // Si c'est une notification parent (groupée), utiliser NotificationGroup
                if (notification.is_parent && notification.notification_type === 'client_actions_summary') {
                  return (
                    <NotificationGroup
                      key={notification.id}
                      notification={notification}
                      onNotificationClick={handleNotificationClick}
                      onDismiss={dismissNotification}
                    />
                  );
                }

                // Sinon, affichage normal pour les notifications individuelles
                const slaStatus = calculateSLAStatus(notification.notification_type, notification.created_at);
                const isUrgent = notification.priority === 'urgent' || notification.priority === 'high';
                
                return (
                <div
                  key={notification.id}
                  className={getNotificationTileClasses(notification)}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Indicateur visuel non lue - point bleu */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      </div>
                    )}
                    
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              <Zap className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                          {getPriorityIcon(notification.priority)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                      
                      <p className={`text-sm mt-1 line-clamp-2 ${!notification.is_read ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                        <span className="text-gray-500">{formatTimeElapsed(slaStatus.hoursElapsed)}</span>
                        
                        {/* Badge SLA */}
                        {slaStatus.status !== 'ok' && (
                          <Badge className={`text-xs ${getSLAStatusClasses(slaStatus.status)}`}>
                            <Timer className="w-3 h-3 mr-1" />
                            {slaStatus.status === 'overdue' 
                              ? 'SLA dépassé' 
                              : slaStatus.status === 'critical'
                              ? `Critique: ${formatTimeRemaining(slaStatus.hoursRemaining)}`
                              : `Attention: ${formatTimeRemaining(slaStatus.hoursRemaining)}`}
                          </Badge>
                        )}
                        
                        {notification.action_data?.product_type && (
                          <Badge variant="outline" className="text-xs">
                            {notification.action_data.product_type}
                          </Badge>
                        )}
                        
                        {!notification.is_read && (
                          <Badge className="bg-blue-500 text-white text-xs font-semibold">
                            Non lu
                          </Badge>
                        )}
                      </div>

                      {notification.action_data?.action_required && (
                        <div className="mt-3 pt-2 border-t flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNotificationAction) {
                                onNotificationAction(notification.action_data.client_produit_id, 'validate');
                              }
                            }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNotificationAction) {
                                onNotificationAction(notification.action_data.client_produit_id, 'reject');
                              }
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir détails
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Popup de visualisation du message de contact */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              Message de contact
            </DialogTitle>
            <DialogDescription>
              Détails du message reçu
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && selectedContact.action_data && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nom</p>
                    <p className="font-semibold text-gray-900">{selectedContact.action_data.name || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 break-all">{selectedContact.action_data.email || 'Non renseigné'}</p>
                  </div>
                </div>
                
                {selectedContact.action_data.phone && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                      <p className="font-semibold text-gray-900">{selectedContact.action_data.phone}</p>
                    </div>
                  </div>
                )}
                
                {selectedContact.action_data.subject && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sujet</p>
                      <p className="font-semibold text-gray-900">{selectedContact.action_data.subject}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500 mb-2">Message</p>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {selectedContact.action_data.message || 'Aucun message'}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Reçu le {new Date(selectedContact.created_at).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedContact.action_data?.email) {
                        window.location.href = `mailto:${selectedContact.action_data.email}`;
                      }
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Répondre
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedContact(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

