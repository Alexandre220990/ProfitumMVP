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
  User
} from 'lucide-react';
import { config } from '@/config/env';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'medium' | 'high';
  is_read: boolean;
  action_url?: string;
  action_data?: any;
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
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (error) {
      console.error('❌ Erreur marquage lu:', error);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
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
    if (filter === 'urgent') return n.priority === 'high' && !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => n.priority === 'high' && !n.is_read).length;

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
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${!notification.is_read ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'}
                    ${getPriorityColor(notification.priority)}
                    hover:shadow-md
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </h4>
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
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{new Date(notification.created_at).toLocaleString('fr-FR')}</span>
                        {notification.action_data?.product_type && (
                          <Badge variant="outline" className="text-xs">
                            {notification.action_data.product_type}
                          </Badge>
                        )}
                        {!notification.is_read && (
                          <Badge className="bg-blue-500 text-white">Nouveau</Badge>
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
              ))}
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

