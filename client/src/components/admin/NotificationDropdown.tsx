/**
 * NotificationDropdown - Menu déroulant de notifications dans le layout admin
 * Affiche les notifications non lues avec possibilité de cliquer pour marquer comme lu et rediriger
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Archive, Mail, FileText, Users, Zap, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { toast } from 'sonner';
import { 
  calculateSLAStatus, 
  formatTimeElapsed,
  getSLAStatusClasses
} from '@/utils/notification-sla';

interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  action_data?: any;
  metadata?: any;
  created_at: string;
}

interface NotificationDropdownProps {
  unreadCount: number;
  onCountChange?: (count: number) => void;
}

export function NotificationDropdown({ unreadCount, onCountChange }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Charger les notifications quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await getSupabaseToken();
      if (!token) return;

      const response = await fetch(`${config.API_URL}/api/notifications/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Filtrer uniquement les notifications non lues
          const unreadNotifs = data.data.filter((n: Notification) => !n.is_read);
          setNotifications(unreadNotifs);
          if (onCountChange) {
            onCountChange(unreadNotifs.length);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour corriger les messages de notification avec les métadonnées
  const getCorrectedNotificationMessage = (notification: Notification): string => {
    const metadata = notification.metadata || {};
    const actionData = notification.action_data || {};
    
    // Récupérer les noms depuis les métadonnées
    const clientName = metadata.client_name || actionData.client_name || actionData.client_company;
    const productName = metadata.product_name || metadata.produit_nom || actionData.product_name;
    
    // Si le message contient "Dossier Dossier" ou "Client Client", le corriger
    let message = notification.message || '';
    
    if (message.includes('Dossier Dossier') && productName && productName !== 'Dossier') {
      message = message.replace(/Dossier Dossier/g, productName);
    }
    
    if (message.includes('Client Client') && clientName && clientName !== 'Client') {
      message = message.replace(/Client Client/g, clientName);
    }
    
    // Corriger aussi les cas où on a juste "Dossier" ou "Client" répétés
    if (message.includes('Dossier - Client') && productName && clientName) {
      message = message.replace(/Dossier - Client/g, `${productName} - ${clientName}`);
    }
    
    return message;
  };

  // Fonction pour corriger les titres de notification avec les métadonnées
  const getCorrectedNotificationTitle = (notification: Notification): string => {
    const metadata = notification.metadata || {};
    const actionData = notification.action_data || {};
    
    // Récupérer le nom du produit depuis les métadonnées
    const productName = metadata.product_name || metadata.produit_nom || actionData.product_name;
    
    // Si le titre contient "Dossier" répété, le corriger
    let title = notification.title || '';
    
    if (title.includes('Dossier Dossier') && productName && productName !== 'Dossier') {
      title = title.replace(/Dossier Dossier/g, productName);
    }
    
    return title;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Mettre à jour l'état local - retirer la notification de la liste
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Mettre à jour le count
        if (onCountChange) {
          onCountChange(notifications.length - 1);
        }
      }
    } catch (error) {
      console.error('❌ Erreur marquage lu:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu
    await markAsRead(notification.id);
    
    // Fermer le dropdown
    setIsOpen(false);
    
    // Rediriger si action_url existe
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const archiveNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/notifications/${notificationId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (onCountChange) {
          onCountChange(notifications.length - 1);
        }
        toast.success('Notification archivée');
      }
    } catch (error) {
      console.error('❌ Erreur archivage notification:', error);
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

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return (
        <Badge variant="destructive" className="text-xs px-1.5 py-0 ml-2">
          <Zap className="w-3 h-3 mr-1" />
          Urgent
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Bell */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
        className="relative bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-lg shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{notifications.length}</Badge>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-900">Aucune notification</p>
                <p className="text-xs text-gray-500 mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const slaStatus = calculateSLAStatus(notification.notification_type, notification.created_at);
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icône de type */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.notification_type)}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {getCorrectedNotificationTitle(notification)}
                                </p>
                                {getPriorityBadge(notification.priority)}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                {getCorrectedNotificationMessage(notification)}
                              </p>
                            </div>

                            {/* Bouton archiver */}
                            <button
                              onClick={(e) => archiveNotification(notification.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded hover:bg-orange-100"
                              title="Archiver"
                            >
                              <Archive className="w-4 h-4 text-gray-400 hover:text-orange-600" />
                            </button>
                          </div>

                          {/* Footer - Time & SLA */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">
                              {formatTimeElapsed(slaStatus.hoursElapsed)}
                            </span>
                            
                            {slaStatus.status !== 'ok' && (
                              <Badge className={`text-xs ${getSLAStatusClasses(slaStatus.status)}`}>
                                <Timer className="w-3 h-3 mr-1" />
                                {slaStatus.status === 'overdue' 
                                  ? 'SLA dépassé' 
                                  : 'Urgent'}
                              </Badge>
                            )}

                            {/* Point bleu indiquant non lu */}
                            <div className="ml-auto">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Action vers le centre de notifications */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notification-center');
                }}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              >
                Voir toutes les notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

