/**
 * ============================================================================
 * CENTRE DE NOTIFICATIONS UNIVERSEL
 * ============================================================================
 * 
 * Composant unifié qui remplace TOUS les NotificationCenter spécifiques.
 * Détecte automatiquement le rôle utilisateur et adapte l'affichage.
 * 
 * Remplace :
 * - components/admin/NotificationCenter.tsx
 * - components/apporteur/NotificationCenter.tsx
 * - components/UnifiedNotificationCenter.tsx
 * - pages/apporteur/notifications.tsx
 * - pages/notification-center.tsx
 * 
 * Date: 27 Octobre 2025
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  FileText, 
  Users, 
  Zap, 
  Shield, 
  Search, 
  Trash2, 
  Archive, 
  ArchiveRestore,
  MessageSquare,
  Calendar,
  DollarSign,
  UserCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';

interface UniversalNotificationCenterProps {
  /** Mode d'affichage : modal plein écran ou compact intégré */
  mode?: 'modal' | 'compact' | 'page';
  /** Callback de fermeture (pour mode modal) */
  onClose?: () => void;
  /** Titre personnalisé */
  title?: string;
}

export function UniversalNotificationCenter({ 
  mode = 'modal',
  onClose,
  title
}: UniversalNotificationCenterProps) {
  // Détection du rôle utilisateur
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.type || 'client';

  // Préférences et notifications push
  const {
    isSupported,
    isEnabled,
    isLoading: loadingPush,
    requestPermission,
    preferences,
    updatePreferences
  } = usePushNotifications();

  // Notifications realtime
  const { notifications, loading, reload } = useSupabaseNotifications();
  
  // État local
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived' | 'late'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [groupByDossier, setGroupByDossier] = useState(true);
  const expandLimit = 5; // Afficher 5 par défaut

  const enrichedNotifications = useMemo(() => {
    const now = Date.now();
    return notifications.map((notification: any) => {
      const metadata =
        notification.metadata && typeof notification.metadata === 'object'
          ? notification.metadata
          : {};

      const dueAt = metadata.due_at ? new Date(metadata.due_at) : null;
      const triggeredAt = metadata.triggered_at ? new Date(metadata.triggered_at) : null;
      const slaHours =
        metadata.sla_hours !== undefined ? Number(metadata.sla_hours) : null;
      const isLate =
        notification.status === 'late' ||
        (!!dueAt && dueAt.getTime() <= now && !notification.is_read);
      const hoursRemaining =
        dueAt && dueAt.getTime() > now
          ? (dueAt.getTime() - now) / (1000 * 60 * 60)
          : 0;

      return {
        ...notification,
        metadata,
        sla: {
          dueAt,
          triggeredAt,
          slaHours,
          isLate,
          hoursRemaining
        }
      };
    });
  }, [notifications]);

  // Statistiques
  const totalCount = enrichedNotifications.filter((n) => n.status !== 'archived').length;
  const unreadCount = enrichedNotifications.filter(
    (n) => (n.status === 'unread' || !n.is_read) && n.status !== 'archived'
  ).length;
  const archivedCount = enrichedNotifications.filter((n) => n.status === 'archived').length;
  const lateCount = enrichedNotifications.filter(
    (n) => n.status !== 'archived' && n.sla.isLate
  ).length;

  // Filtrage dynamique selon le rôle
  const filteredNotifications = useMemo(() => {
    return enrichedNotifications.filter((notification: any) => {
      const matchesSearch =
        notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (filter === 'unread') {
        matchesFilter = notification.status === 'unread' || !notification.is_read;
      } else if (filter === 'archived') {
        matchesFilter = notification.status === 'archived';
      } else if (filter === 'late') {
        matchesFilter = notification.sla.isLate;
      } else if (filter === 'all') {
        matchesFilter = notification.status !== 'archived';
      }

      if (userRole === 'client' && notification.user_type === 'admin') {
        return false;
      }
      if (userRole === 'expert' && notification.user_type === 'admin') {
        return false;
      }

      return matchesSearch && matchesFilter;
    });
  }, [enrichedNotifications, filter, searchQuery, userRole]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const markAsRead = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/read`;
      if (userRole === 'expert') endpoint = `/api/expert/notifications/${notificationId}/read`;
      if (userRole === 'admin') endpoint = `/api/admin/notifications/${notificationId}/read`;
      
      const token = localStorage.getItem('token');
      await fetch(endpoint, { 
        method: 'PUT', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      reload(); // Recharger les notifications
    } catch (error) { 
      console.error('Erreur marquage lu:', error); 
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/unread`;
      if (userRole === 'expert') endpoint = `/api/expert/notifications/${notificationId}/unread`;
      if (userRole === 'admin') endpoint = `/api/admin/notifications/${notificationId}/unread`;
      
      const token = localStorage.getItem('token');
      await fetch(endpoint, { 
        method: 'PUT', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      reload(); // Recharger les notifications
    } catch (error) { 
      console.error('Erreur marquage non lu:', error); 
    }
  };

  const toggleReadStatus = async (notification: any) => {
    if (notification.is_read) {
      await markAsUnread(notification.id);
    } else {
      await markAsRead(notification.id);
    }
  };

  const getPrimaryActionUrl = (notification: any): string | null => {
    if (notification.action_url) {
      return notification.action_url;
    }

    if (notification.action_data && notification.action_data.action_url) {
      return notification.action_data.action_url;
    }

    const metadata = notification.metadata || {};

    if (metadata.action_url) {
      return metadata.action_url;
    }

    const dossierId = metadata.dossier_id;

    if (!dossierId) {
      return null;
    }

    const produitSource = metadata.produit_slug || metadata.produit || 'dossier';
    const slug = produitSource
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'dossier';

    if (userRole === 'client') {
      return `/produits/${slug}/${dossierId}`;
    }

    if (userRole === 'expert') {
      return `/expert/dossier/${dossierId}`;
    }

    if (userRole === 'admin') {
      return `/admin/dossiers/${dossierId}`;
    }

    if (userRole === 'apporteur') {
      return `/apporteur/dossiers/${dossierId}`;
    }

    return null;
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const targetUrl = getPrimaryActionUrl(notification);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/archive`;
      if (userRole === 'expert') endpoint = `/api/expert/notifications/${notificationId}/archive`;
      if (userRole === 'admin') endpoint = `/api/admin/notifications/${notificationId}/archive`;
      
      const token = localStorage.getItem('token');
      await fetch(endpoint, { 
        method: 'PUT', 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      reload(); // Recharger les notifications
    } catch (error) { 
      console.error('Erreur archivage:', error); 
    }
  };

  const unarchiveNotification = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/unarchive`;
      if (userRole === 'expert') endpoint = `/api/expert/notifications/${notificationId}/unarchive`;
      if (userRole === 'admin') endpoint = `/api/admin/notifications/${notificationId}/unarchive`;
      
      const token = localStorage.getItem('token');
      await fetch(endpoint, { 
        method: 'PUT', 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
    } catch (error) { 
      console.error('Erreur restauration:', error); 
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}`;
      if (userRole === 'expert') endpoint = `/api/expert/notifications/${notificationId}`;
      if (userRole === 'admin') endpoint = `/api/admin/notifications/${notificationId}`;
      
      const token = localStorage.getItem('token');
      await fetch(endpoint, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
    } catch (error) { 
      console.error('Erreur suppression:', error); 
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = enrichedNotifications.filter(
        (n) => (n.status === 'unread' || !n.is_read) && n.status !== 'archived'
      );
      await Promise.all(unreadNotifs.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
    }
  };

  const deleteAllRead = async () => {
    try {
      const readNotifs = enrichedNotifications.filter((n) => n.status === 'read');
      await Promise.all(readNotifs.map(n => deleteNotification(n.id)));
      reload();
    } catch (error) {
      console.error('Erreur suppression tout lu:', error);
    }
  };

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      success: <Check className="h-4 w-4 text-green-500" />,
      warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      error: <X className="h-4 w-4 text-red-500" />,
      security: <Shield className="h-4 w-4 text-purple-500" />,
      system: <Zap className="h-4 w-4 text-indigo-500" />,
      user: <Users className="h-4 w-4 text-blue-500" />,
      business: <FileText className="h-4 w-4 text-emerald-500" />,
      message: <MessageSquare className="h-4 w-4 text-blue-500" />,
      calendar: <Calendar className="h-4 w-4 text-orange-500" />,
      payment: <DollarSign className="h-4 w-4 text-green-500" />,
      assignment: <UserCheck className="h-4 w-4 text-purple-500" />,
      document: <FileText className="h-4 w-4 text-gray-500" />,
      dossier_status_change: <FileText className="h-4 w-4 text-blue-500" />,
      expert_comment: <MessageSquare className="h-4 w-4 text-green-500" />,
      document_uploaded: <FileText className="h-4 w-4 text-orange-500" />,
      commission_earned: <DollarSign className="h-4 w-4 text-green-600" />
    };
    
    return iconMap[type] || <Info className="h-4 w-4 text-gray-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFutureTime = (hours: number | null) => {
    if (hours === null) return null;
    if (hours <= 0) return 'immédiatement';
    if (hours < 1) return 'dans moins d’une heure';
    if (hours < 24) return `dans ${Math.ceil(hours)}h`;
    const days = Math.ceil(hours / 24);
    return `dans ${days} jour${days > 1 ? 's' : ''}`;
  };

  const formatPastTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return 'moins d’une heure';
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}j`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}sem`;
  };

  const formatSlaDescription = (notification: any) => {
    if (!notification.sla.dueAt) {
      return null;
    }

    if (notification.sla.isLate) {
      return `En retard depuis ${formatPastTime(notification.sla.dueAt)}`;
    }

    const futureLabel = formatFutureTime(notification.sla.hoursRemaining);
    if (!futureLabel) {
      return null;
    }

    return `À traiter ${futureLabel}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'client': return 'Client';
      case 'expert': return 'Expert';
      case 'admin': return 'Administrateur';
      case 'apporteur': return 'Apporteur d\'affaires';
      default: return 'Utilisateur';
    }
  };

  const renderNotificationCard = (notification: any) => {
    const metadata = notification.metadata || {};
    const slaDescription = formatSlaDescription(notification);
    const actionUrl = getPrimaryActionUrl(notification);
    const dossierLabel =
      metadata.dossier_nom ||
      metadata.produit ||
      (metadata.dossier_id ? `Dossier ${metadata.dossier_id.slice(0, 8)}…` : null);
    const isArchived = notification.status === 'archived';

    return (
      <Card
        key={notification.id}
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          notification.sla.isLate && !isArchived
            ? "border-l-4 border-l-red-500 bg-red-50"
            : !isArchived && notification.status === 'unread'
            ? "border-l-4 border-l-blue-500 bg-blue-50"
            : ""
        )}
      >
        <CardContent
          className="p-4"
          onClick={() => {
            if (!isArchived) {
              handleNotificationClick(notification);
            }
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1">
                {getTypeIcon(notification.notification_type)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {notification.title}
                  </h4>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs capitalize", getPriorityColor(notification.priority))}
                  >
                    {notification.priority}
                  </Badge>
                  {notification.sla.isLate && !isArchived && (
                    <Badge
                      variant="destructive"
                      className="text-xs bg-red-100 text-red-700 border-red-200"
                    >
                      En retard
                    </Badge>
                  )}
                  {notification.sla.slaHours && (
                    <Badge variant="outline" className="text-xs">
                      {notification.sla.slaHours}h SLA
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {notification.message}
                </p>
                {(metadata.next_step_label || metadata.next_step_description) && (
                  <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 space-y-1">
                    <div className="font-medium text-gray-700">
                      Prochaine étape : {metadata.next_step_label || 'à définir'}
                    </div>
                    {metadata.next_step_description && (
                      <div>{metadata.next_step_description}</div>
                    )}
                  </div>
                )}
                {metadata.recommended_action && (
                  <div className="text-xs text-gray-500">
                    Action recommandée : {metadata.recommended_action}
                  </div>
                )}
                {metadata.support_email && (
                  <div className="text-xs text-gray-400">
                    Besoin d’aide ? {metadata.support_email}
                  </div>
                )}
                {slaDescription && !isArchived && (
                  <p
                    className={cn(
                      "text-xs font-medium",
                      notification.sla.isLate ? "text-red-600" : "text-gray-500"
                    )}
                  >
                    {slaDescription}
                  </p>
                )}
                {(dossierLabel || metadata.client_nom) && (
                  <p className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                    {dossierLabel && <span>{dossierLabel}</span>}
                    {metadata.client_nom && <span>• {metadata.client_nom}</span>}
                  </p>
                )}
                <span className="text-xs text-gray-400">
                  {formatDate(notification.created_at)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {isArchived ? (
                <div
                  className="flex items-center gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unarchiveNotification(notification.id)}
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                    title="Restaurer"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center gap-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={notification.is_read}
                        onCheckedChange={() => toggleReadStatus(notification)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {notification.is_read ? 'Lu' : 'Non lu'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        archiveNotification(notification.id);
                      }}
                      className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      title="Archiver"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                  {actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="flex items-center gap-2"
                    >
                      Ouvrir
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // RENDER - Mode Compact
  // ============================================================================

  const groupedNotifications = useMemo(() => {
    if (!groupByDossier || filter === 'archived') {
      return null;
    }

    const groups = new Map<string, any[]>();
    filteredNotifications.forEach((notification: any) => {
      const key = notification.metadata?.dossier_id || '__autres__';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries()).map(([dossierId, items]) => ({
      dossierId,
      items: items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }));
  }, [filteredNotifications, groupByDossier]);

  if (mode === 'compact') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={reload}>
              Actualiser
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <>
                  {filteredNotifications.slice(0, showAll ? filteredNotifications.length : expandLimit).map((notification) => (
                    <Card key={notification.id} className={cn(
                      "transition-all hover:shadow-md",
                      !notification.is_read && "border-l-4 border-l-blue-500 bg-blue-50",
                      notification.action_url && "cursor-pointer hover:border-blue-300"
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div 
                            className="flex items-start space-x-2 flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            {getTypeIcon(notification.notification_type)}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                              <span className="text-xs text-gray-400">{formatDate(notification.created_at)}</span>
                            </div>
                          </div>
                          
                          {/* Actions pour chaque notification */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Toggle lu/non lu */}
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={notification.is_read}
                                onCheckedChange={() => toggleReadStatus(notification)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {notification.is_read ? 'Lu' : 'Non lu'}
                              </span>
                            </div>
                            
                            {/* Bouton archiver */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => archiveNotification(notification.id)}
                              className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                              title="Archiver"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Bouton Voir plus/moins */}
                  {filteredNotifications.length > expandLimit && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        {showAll ? (
                          <>
                            Voir moins
                            <ChevronUp className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            Voir plus ({filteredNotifications.length - expandLimit} autres)
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - Mode Modal / Page
  // ============================================================================

  const containerClass = mode === 'modal' 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    : "w-full h-full";

  const contentClass = mode === 'modal'
    ? "bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
    : "bg-white rounded-lg shadow-lg w-full h-full flex flex-col";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">{title || 'Centre de Notifications'}</h2>
              <p className="text-sm text-gray-500">{getRoleLabel()} • {totalCount} notification(s)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Préférences</span>
            </Button>
            {mode === 'modal' && onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Filtres */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Filtres</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'all' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span>Toutes</span>
                    <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'unread' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span>Non lues</span>
                    <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                      {unreadCount}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setFilter('late')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'late' ? "bg-red-100 text-red-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>En retard</span>
                    </div>
                    <Badge variant="destructive" className="ml-2 bg-red-500 text-white">
                      {lateCount}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setFilter('archived')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'archived' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <Archive className="h-4 w-4 mr-2" />
                      <span>Archivées</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{archivedCount}</Badge>
                  </button>
                </div>
              </div>

              {/* Actions rapides */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="w-full justify-start"
                    disabled={unreadCount === 0}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteAllRead}
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    disabled={!enrichedNotifications.some(n => n.status === 'read')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer tout lu
                  </Button>
                </div>
              </div>

              {/* Affichage */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Affichage</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Regrouper par dossier</span>
                  <Switch
                    checked={groupByDossier}
                    onCheckedChange={setGroupByDossier}
                  />
                </div>
              </div>

              {/* Préférences */}
              {showPreferences && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Préférences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notifications push</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={requestPermission}
                        disabled={!isSupported || loadingPush}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Emails</span>
                      <Switch
                        checked={preferences?.email_enabled || false}
                        onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">SMS</span>
                      <Switch
                        checked={preferences?.sms_enabled || false}
                        onCheckedChange={(checked) => updatePreferences({ sms_enabled: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications list */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification trouvée</p>
                  </div>
                ) : groupByDossier && groupedNotifications && groupedNotifications.length > 0 ? (
                  groupedNotifications.map((group) => {
                    const first = group.items[0];
                    const metadata = first.metadata || {};
                    const groupLabel =
                      metadata.dossier_nom ||
                      metadata.produit ||
                      (group.dossierId === '__autres__'
                        ? 'Autres notifications'
                        : `Dossier ${group.dossierId.slice(0, 8)}…`);
                    const lateInGroup = group.items.filter((item: any) => item.sla.isLate).length;
                    const actionUrl =
                      group.items
                        .map((item: any) => getPrimaryActionUrl(item))
                        .find((url: string | null) => !!url) || null;

                    return (
                      <Card key={`${group.dossierId}-${group.items.length}`} className="border border-gray-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{groupLabel}</h3>
                              {metadata.client_nom && (
                                <p className="text-xs text-gray-500">{metadata.client_nom}</p>
                              )}
                              {metadata.produit && metadata.produit !== groupLabel && (
                                <p className="text-xs text-gray-500">{metadata.produit}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {group.items.length} notif.
                              </Badge>
                              {lateInGroup > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs bg-red-100 text-red-700 border-red-200"
                                >
                                  {lateInGroup} en retard
                                </Badge>
                              )}
                              {actionUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(actionUrl)}
                                >
                                  Ouvrir
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            {group.items.map((notification: any) => renderNotificationCard(notification))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  filteredNotifications.map((notification: any) => renderNotificationCard(notification))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UniversalNotificationCenter;

