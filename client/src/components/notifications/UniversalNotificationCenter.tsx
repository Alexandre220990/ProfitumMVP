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
import { RDVReportModal } from '@/components/rdv/RDVReportModal';
import { FileText as FileTextIcon } from 'lucide-react';
import { config } from '@/config/env';
import { toast } from 'sonner';

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
  const {
    notifications,
    loading,
    reload,
    markAsRead,
    markAsUnread,
    archiveNotification,
    unarchiveNotification,
    deleteNotification,
    markAllAsRead,
    deleteAllRead,
  } = useSupabaseNotifications();
  
  // État local
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived' | 'late'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [groupByDossier, setGroupByDossier] = useState(true);
  const expandLimit = 5; // Afficher 5 par défaut
  const [rdvReportModal, setRdvReportModal] = useState<{
    isOpen: boolean;
    rdvId: string | null;
    rdvTitle?: string;
    existingReport: any | null;
  }>({
    isOpen: false,
    rdvId: null,
    existingReport: null
  });

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
  // Pour toutes les notifications: status peut être 'unread' (non lu), 'read' (lu), 'archived' (archivé)
  const totalCount = enrichedNotifications.filter((n) => n.status !== 'archived').length;
  const unreadCount = enrichedNotifications.filter(
    (n) => {
      const isUnread = n.status === 'unread' || (!n.is_read && n.status !== 'read' && n.status !== 'archived');
      return isUnread && n.status !== 'archived';
    }
  ).length;
  const archivedCount = enrichedNotifications.filter((n) => n.status === 'archived').length;
  const lateCount = enrichedNotifications.filter(
    (n) => n.status !== 'archived' && n.sla.isLate
  ).length;

  // Filtrage dynamique selon le rôle
  const filteredNotifications = useMemo(() => {
    // Trier les notifications (événements en premier)
    const sortedNotifications = [...enrichedNotifications].sort((a, b) => {
      const aIsEvent = a.metadata?.event_id || 
        ['event_upcoming', 'event_in_progress', 'event_completed'].includes(a.notification_type || '');
      const bIsEvent = b.metadata?.event_id || 
        ['event_upcoming', 'event_in_progress', 'event_completed'].includes(b.notification_type || '');
      
      if (aIsEvent && !bIsEvent) return -1;
      if (!aIsEvent && bIsEvent) return 1;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return sortedNotifications.filter((notification: any) => {
      const matchesSearch =
        notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (filter === 'unread') {
        // Pour toutes les notifications: 'unread' = non lu
        matchesFilter = notification.status === 'unread' || (!notification.is_read && notification.status !== 'read' && notification.status !== 'archived');
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

  const toggleReadStatus = async (notification: any) => {
    if (notification.is_read) {
      await markAsUnread(notification.id);
    } else {
      await markAsRead(notification.id);
    }
  };

  const getPrimaryActionUrl = (notification: any): string | null => {
    // Log pour déboguer
    console.log('🔍 getPrimaryActionUrl - Notification:', {
      id: notification.id,
      notification_type: notification.notification_type,
      action_url: notification.action_url,
      action_data: notification.action_data,
      metadata: notification.metadata,
      userRole
    });

    const metadata = notification.metadata || {};
    
    // Pour les notifications d'événement, TOUJOURS construire l'URL depuis metadata.event_id
    // pour éviter les redirections vers le popup (le popup n'est utilisé que sur les pages agenda)
    const isEventNotification = 
      notification.notification_type === 'event_upcoming' ||
      notification.notification_type === 'event_in_progress' ||
      notification.notification_type === 'event_completed' ||
      metadata.event_id;

    if (isEventNotification && metadata.event_id) {
      const eventId = metadata.event_id;
      
      // Vérifier que l'ID est valide
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        console.error('❌ getPrimaryActionUrl - event_id invalide:', eventId, 'metadata:', metadata);
        return null;
      }
      
      let eventUrl: string | null = null;
      
      if (userRole === 'admin') {
        // Rediriger vers la page de synthèse événement dédiée pour les admins
        eventUrl = `/admin/events/${eventId}`;
      } else if (userRole === 'expert') {
        // Rediriger vers la page de synthèse événement dédiée pour les experts
        eventUrl = `/expert/events/${eventId}`;
      } else if (userRole === 'apporteur') {
        // Rediriger vers la page de synthèse événement dédiée pour les apporteurs
        eventUrl = `/apporteur/events/${eventId}`;
      } else if (userRole === 'client') {
        // Rediriger vers la page de synthèse événement dédiée pour les clients
        eventUrl = `/events/${eventId}`;
      }
      
      if (eventUrl) {
        console.log('✅ getPrimaryActionUrl - URL construite pour événement:', {
          eventUrl,
          eventId,
          userRole,
          notificationType: notification.notification_type,
          metadata
        });
        return eventUrl;
      }
    }

    // Pour les autres types de notifications, utiliser action_url si disponible
    if (notification.action_url) {
      console.log('✅ getPrimaryActionUrl - Utilisation action_url direct:', notification.action_url);
      return notification.action_url;
    }

    if (notification.action_data && notification.action_data.action_url) {
      console.log('✅ getPrimaryActionUrl - Utilisation action_data.action_url:', notification.action_data.action_url);
      return notification.action_data.action_url;
    }

    if (metadata.action_url) {
      console.log('✅ getPrimaryActionUrl - Utilisation metadata.action_url:', metadata.action_url);
      return metadata.action_url;
    }

    const dossierId = metadata.dossier_id;

    if (!dossierId) {
      console.log('⚠️ getPrimaryActionUrl - Aucune URL trouvée pour la notification');
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
    console.log('🔔 handleNotificationClick - Notification cliquée:', {
      id: notification.id,
      notification_type: notification.notification_type,
      is_read: notification.is_read,
      userRole,
      user: user ? { id: user.id, type: user.type, email: user.email } : null,
      metadata: notification.metadata,
      action_url: notification.action_url
    });

    // Vérifier que l'utilisateur est bien authentifié avant de continuer
    if (!user || !userRole) {
      console.error('❌ handleNotificationClick - Utilisateur non authentifié, impossible de naviguer');
      return;
    }

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const targetUrl = getPrimaryActionUrl(notification);
    console.log('🔗 handleNotificationClick - URL cible:', targetUrl, {
      metadata: notification.metadata,
      eventId: notification.metadata?.event_id
    });
    
    if (targetUrl) {
      // Pour les notifications d'événement, vérifier que le userRole correspond à l'URL
      const metadata = notification.metadata || {};
      if (metadata.event_id) {
        // Vérifier que l'URL correspond au rôle de l'utilisateur
        const expectedRole = targetUrl.includes('/admin/') ? 'admin' :
                            targetUrl.includes('/expert/') ? 'expert' :
                            targetUrl.includes('/apporteur/') ? 'apporteur' :
                            targetUrl.includes('/agenda-client') ? 'client' : null;
        
        if (expectedRole && expectedRole !== userRole) {
          console.error('❌ handleNotificationClick - Rôle utilisateur incompatible:', {
            expectedRole,
            userRole,
            targetUrl
          });
          return;
        }
        
        // Vérifier que l'ID d'événement est valide
        const eventId = metadata.event_id;
        if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
          console.error('❌ handleNotificationClick - event_id invalide:', eventId);
          toast.error('ID d\'événement invalide dans la notification');
          return;
        }
      }
      
      console.log('➡️ handleNotificationClick - Navigation vers:', targetUrl, {
        userRole,
        userType: user.type,
        eventId: metadata.event_id
      });
      
      // Utiliser navigate() pour toutes les notifications pour préserver le contexte d'authentification
      // window.location.href force un rechargement complet qui peut perdre le contexte d'authentification
      navigate(targetUrl);
    } else {
      console.warn('⚠️ handleNotificationClick - Aucune URL trouvée pour la notification:', {
        notification_type: notification.notification_type,
        metadata: notification.metadata,
        action_url: notification.action_url
      });
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

  /**
   * Formater le temps restant pour un événement (compteur statique)
   */
  const formatEventTimeRemaining = (notification: any): string | null => {
    const metadata = notification.metadata || {};
    const eventStatus = metadata.event_status || 
      (notification.notification_type === 'event_upcoming' ? 'upcoming' :
       notification.notification_type === 'event_in_progress' ? 'in_progress' :
       notification.notification_type === 'event_completed' ? 'completed' : null);

    if (!eventStatus || !metadata.scheduled_date || !metadata.scheduled_time) {
      return null;
    }

    const now = new Date();
    const eventStart = new Date(`${metadata.scheduled_date}T${metadata.scheduled_time}`);
    const durationMs = (metadata.duration_minutes || 60) * 60 * 1000;
    const eventEnd = new Date(eventStart.getTime() + durationMs);

    if (eventStatus === 'upcoming') {
      const timeRemaining = eventStart.getTime() - now.getTime();
      // Si l'événement devrait commencer maintenant ou est en retard, ne pas afficher "Maintenant"
      // mais plutôt le décompte négatif ou rien (la date/heure sera affichée séparément)
      if (timeRemaining <= 0) return null; // Ne pas afficher de décompte si l'événement est passé
      
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `Dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
      } else {
        return `Dans ${minutes}min`;
      }
    } else if (eventStatus === 'in_progress') {
      const timeRemaining = eventEnd.getTime() - now.getTime();
      if (timeRemaining <= 0) return null; // Ne pas afficher si terminé
      
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      return `Se termine dans ${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
    } else {
      // Pour les événements terminés, ne pas afficher de décompte
      return null;
    }
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

  const handleOpenReportModal = async (rdvId: string, rdvTitle?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/rdv/${rdvId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      const existingReport = data.success && data.data ? data.data : null;

      setRdvReportModal({
        isOpen: true,
        rdvId,
        rdvTitle,
        existingReport
      });
    } catch (error) {
      console.error('Erreur récupération rapport:', error);
      // Ouvrir le modal même en cas d'erreur (pas de rapport existant)
      setRdvReportModal({
        isOpen: true,
        rdvId,
        rdvTitle,
        existingReport: null
      });
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
    
    // Vérifier si c'est une notification d'événement
    const isEventNotification = 
      notification.notification_type === 'event_upcoming' ||
      notification.notification_type === 'event_in_progress' ||
      notification.notification_type === 'event_completed' ||
      metadata.event_id;
    
    const eventTimeRemaining = isEventNotification ? formatEventTimeRemaining(notification) : null;
    const eventStatus = metadata.event_status || 
      (notification.notification_type === 'event_upcoming' ? 'upcoming' :
       notification.notification_type === 'event_in_progress' ? 'in_progress' :
       notification.notification_type === 'event_completed' ? 'completed' : null);

    const isUnread = !notification.is_read && !isArchived;
    
    // Déterminer si la tuile est cliquable
    const isClickable = !isArchived && !!actionUrl;
    
    return (
      <Card
        key={notification.id}
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          isEventNotification && eventStatus === 'in_progress' && !isArchived
            ? "border-l-4 border-l-orange-500 bg-orange-50"
            : isEventNotification && eventStatus === 'completed' && !isArchived
            ? "border-l-4 border-l-green-500 bg-green-50"
            : isEventNotification && eventStatus === 'upcoming' && !isArchived
            ? "border-l-4 border-l-blue-500 bg-blue-50"
            : notification.sla.isLate && !isArchived
            ? "border-l-4 border-l-red-500 bg-red-50"
            : isUnread
            ? "border-l-4 border-l-blue-500 bg-blue-50 shadow-sm"
            : !isArchived
            ? "border-l-2 border-l-gray-200 bg-white"
            : "opacity-60"
        )}
      >
        <CardContent
          className={cn(
            "p-4",
            isClickable && "cursor-pointer hover:bg-gray-50 transition-colors"
          )}
          onClick={() => {
            if (isClickable) {
              handleNotificationClick(notification);
            }
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <div className={cn(
                "mt-1",
                isUnread && "opacity-100",
                !isUnread && "opacity-60"
              )}>
                {getTypeIcon(notification.notification_type)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "truncate",
                      isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                    )}>
                      {notification.title}
                    </h4>
                    {isUnread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
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
                <p className={cn(
                  "text-sm line-clamp-2",
                  isUnread ? "text-gray-700" : "text-gray-600"
                )}>
                  {notification.message}
                </p>
                {isEventNotification && (
                  <div className="space-y-1">
                    {/* Date/heure du RDV - toujours afficher */}
                    {metadata.scheduled_datetime ? (
                      <div className="text-xs text-gray-600 font-medium">
                        📅 {metadata.scheduled_datetime}
                      </div>
                    ) : metadata.scheduled_date && metadata.scheduled_time ? (
                      <div className="text-xs text-gray-600 font-medium">
                        📅 {new Date(`${metadata.scheduled_date}T${metadata.scheduled_time}`).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    ) : null}
                    {/* Décompte jusqu'au début/fin - seulement si l'événement n'est pas terminé */}
                    {eventTimeRemaining && eventStatus !== 'completed' && (
                      <div className={cn(
                        "text-xs font-semibold px-2 py-1 rounded inline-block",
                        eventStatus === 'upcoming' && "bg-blue-100 text-blue-700",
                        eventStatus === 'in_progress' && "bg-orange-100 text-orange-700"
                      )}>
                        {eventTimeRemaining}
                      </div>
                    )}
                    {/* Badge statut pour les événements terminés */}
                    {eventStatus === 'completed' && (
                      <div className="text-xs font-semibold px-2 py-1 rounded inline-block bg-green-100 text-green-700">
                        Terminé
                      </div>
                    )}
                  </div>
                )}
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
                {/* Pour les notifications d'événement, ne pas afficher "Il y a X" mais plutôt le décompte */}
                {!isEventNotification && (
                  <span className="text-xs text-gray-400">
                    {formatDate(notification.created_at)}
                  </span>
                )}
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
                  {/* Bouton rapport pour les événements terminés */}
                  {isEventNotification && eventStatus === 'completed' && metadata.event_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenReportModal(metadata.event_id, metadata.event_title || notification.message);
                      }}
                      className="flex items-center gap-2"
                    >
                      <FileTextIcon className="w-4 h-4" />
                      {metadata.has_report ? 'Modifier rapport' : 'Ajouter rapport'}
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
                  {filteredNotifications.slice(0, showAll ? filteredNotifications.length : expandLimit).map((notification) => {
                    const isArchived = notification.status === 'archived';
                    const isUnread = !notification.is_read && !isArchived;
                    
                    return (
                      <Card key={notification.id} className={cn(
                        "transition-all hover:shadow-md",
                        isUnread && "border-l-4 border-l-blue-500 bg-blue-50 shadow-sm",
                        !isUnread && !isArchived && "border-l-2 border-l-gray-200 bg-white",
                        isArchived && "opacity-60",
                        notification.action_url && "cursor-pointer hover:border-blue-300"
                      )}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div 
                              className="flex items-start space-x-2 flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className={cn(
                                "mt-0.5",
                                isUnread && "opacity-100",
                                !isUnread && "opacity-60"
                              )}>
                                {getTypeIcon(notification.notification_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "text-sm truncate",
                                    isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {isUnread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                <p className={cn(
                                  "text-xs line-clamp-2 mt-1",
                                  isUnread ? "text-gray-700" : "text-gray-600"
                                )}>
                                  {notification.message}
                                </p>
                                <span className="text-xs text-gray-400 mt-1 block">{formatDate(notification.created_at)}</span>
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
                    );
                  })}
                  
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
      
      {/* Modal de rapport RDV */}
      {rdvReportModal.rdvId && (
        <RDVReportModal
          rdvId={rdvReportModal.rdvId}
          rdvTitle={rdvReportModal.rdvTitle}
          isOpen={rdvReportModal.isOpen}
          onClose={() => setRdvReportModal({ isOpen: false, rdvId: null, existingReport: null })}
          onSuccess={() => {
            reload();
            setRdvReportModal({ isOpen: false, rdvId: null, existingReport: null });
          }}
          existingReport={rdvReportModal.existingReport}
        />
      )}
    </div>
  );
}

export default UniversalNotificationCenter;

