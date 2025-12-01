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

import { useMemo, useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Clock,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import { RDVReportModal } from '@/components/rdv/RDVReportModal';
import { FileText as FileTextIcon } from 'lucide-react';
import { config } from '@/config/env';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived' | 'late' | 'events' | 'contact_requests' | 'leads_to_treat'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAll, setShowAll] = useState(false);
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
  
  // État pour stocker les rapports des événements
  const [eventReports, setEventReports] = useState<Record<string, any>>({});
  const loadingReportsRef = useRef<Set<string>>(new Set());
  
  // État pour le popup de résumé de rapport
  const [reportSummaryPopup, setReportSummaryPopup] = useState<{
    isOpen: boolean;
    report: any | null;
    eventTitle?: string;
  }>({
    isOpen: false,
    report: null
  });

  // État pour le modal de réponse à un événement proposé
  const [eventResponseModal, setEventResponseModal] = useState<{
    isOpen: boolean;
    eventId: string | null;
    action: 'accept' | 'refuse' | 'propose_alternative' | null;
    eventTitle?: string;
  }>({
    isOpen: false,
    eventId: null,
    action: null
  });

  // État pour le formulaire de proposition d'horaire alternatif
  const [alternativeDateTime, setAlternativeDateTime] = useState({
    date: '',
    time: '',
    notes: ''
  });

  // Charger les rapports pour les événements terminés
  useEffect(() => {
    const loadEventReports = async () => {
      const eventNotifications = notifications.filter((n: any) => {
        const metadata = n.metadata && typeof n.metadata === 'object' ? n.metadata : {};
        const isEventCompleted = 
          n.notification_type === 'event_completed' ||
          metadata.event_status === 'completed';
        const eventId = metadata.event_id;
        return isEventCompleted && eventId && 
               !eventReports[eventId] && 
               eventReports[eventId] !== null &&
               !loadingReportsRef.current.has(eventId);
      });

      if (eventNotifications.length === 0) return;

      const promises = eventNotifications.map(async (notification: any) => {
        const metadata = notification.metadata || {};
        const eventId = metadata.event_id;
        
        if (!eventId || loadingReportsRef.current.has(eventId)) return;

        loadingReportsRef.current.add(eventId);

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/api/rdv/${eventId}/report`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setEventReports(prev => ({
                ...prev,
                [eventId]: data.data
              }));
            } else {
              setEventReports(prev => ({
                ...prev,
                [eventId]: null
              }));
            }
          } else {
            setEventReports(prev => ({
              ...prev,
              [eventId]: null
            }));
          }
        } catch (error) {
          console.error('Erreur chargement rapport:', error);
          setEventReports(prev => ({
            ...prev,
            [eventId]: null
          }));
        } finally {
          loadingReportsRef.current.delete(eventId);
        }
      });

      await Promise.all(promises);
    };

    loadEventReports();
  }, [notifications]);

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

      // Vérifier si un rapport existe pour cet événement
      const eventId = metadata.event_id;
      const hasReport = eventId ? !!eventReports[eventId] : false;
      const report = eventId ? eventReports[eventId] : null;

      return {
        ...notification,
        metadata: {
          ...metadata,
          has_report: hasReport,
          report: report
        },
        sla: {
          dueAt,
          triggeredAt,
          slaHours,
          isLate,
          hoursRemaining
        }
      };
    });
  }, [notifications, eventReports]);

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
  
  // Compteurs pour les filtres spécifiques
  const eventCount = enrichedNotifications.filter((n) => {
    if (n.status === 'archived') return false;
    const isEvent = n.metadata?.event_id || 
      ['event_upcoming', 'event_in_progress', 'event_completed'].includes(n.notification_type || '');
    return isEvent;
  }).length;
  
  const contactRequestCount = enrichedNotifications.filter((n) => {
    if (n.status === 'archived') return false;
    return n.notification_type === 'contact_message' || 
           n.notification_type === 'expert_contact_request';
  }).length;
  
  const leadsToTreatCount = enrichedNotifications.filter((n) => {
    if (n.status === 'archived') return false;
    return n.notification_type === 'lead_to_treat';
  }).length;
  
  const leadsToTreatUnreadCount = enrichedNotifications.filter((n) => {
    if (n.status === 'archived') return false;
    const isUnread = n.status === 'unread' || (!n.is_read && n.status !== 'read');
    return n.notification_type === 'lead_to_treat' && isUnread;
  }).length;

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
      } else if (filter === 'events') {
        // Filtrer uniquement les notifications d'événement
        const isEvent = notification.metadata?.event_id || 
          ['event_upcoming', 'event_in_progress', 'event_completed'].includes(notification.notification_type || '');
        matchesFilter = isEvent && notification.status !== 'archived';
      } else if (filter === 'contact_requests') {
        // Filtrer uniquement les notifications de demande de contact
        matchesFilter = (notification.notification_type === 'contact_message' || 
                        notification.notification_type === 'expert_contact_request') &&
                       notification.status !== 'archived';
      } else if (filter === 'leads_to_treat') {
        // Filtrer uniquement les notifications de leads à traiter
        matchesFilter = notification.notification_type === 'lead_to_treat' && 
                       notification.status !== 'archived';
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

  // Fonction pour répondre à un événement proposé
  const handleEventResponse = async (
    eventId: string,
    action: 'accept' | 'refuse' | 'propose_alternative',
    refusalReason?: string,
    alternativeDate?: string,
    alternativeTime?: string,
    notes?: string
  ) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/rdv/${eventId}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          refusal_reason: refusalReason,
          alternative_date: alternativeDate,
          alternative_time: alternativeTime,
          notes
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          action === 'accept' ? 'Événement accepté' :
          action === 'refuse' ? 'Événement refusé' :
          'Horaire alternatif proposé'
        );
        reload();
        setEventResponseModal({ isOpen: false, eventId: null, action: null });
        setAlternativeDateTime({ date: '', time: '', notes: '' });
      } else {
        toast.error(data.message || 'Erreur lors de la réponse');
      }
    } catch (error: any) {
      console.error('Erreur réponse événement:', error);
      toast.error('Erreur lors de la réponse à l\'événement');
    }
  };

  // Ouvrir le modal de réponse
  const openEventResponseModal = (eventId: string, action: 'accept' | 'refuse' | 'propose_alternative', eventTitle?: string) => {
    setEventResponseModal({
      isOpen: true,
      eventId,
      action,
      eventTitle
    });
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
      notification.notification_type === 'event_proposed' ||
      notification.notification_type === 'event_invitation' ||
      metadata.event_id;
    
    // Vérifier si c'est une proposition d'événement (nécessite une réponse)
    const isEventProposed = 
      notification.notification_type === 'event_proposed' ||
      (metadata.event_status === 'proposed' && metadata.event_id);
    
    const eventTimeRemaining = isEventNotification ? formatEventTimeRemaining(notification) : null;
    const eventStatus = metadata.event_status || 
      (notification.notification_type === 'event_upcoming' ? 'upcoming' :
       notification.notification_type === 'event_in_progress' ? 'in_progress' :
       notification.notification_type === 'event_completed' ? 'completed' :
       notification.notification_type === 'event_proposed' ? 'proposed' : null);

    const isUnread = !notification.is_read && !isArchived;
    
    // Déterminer si la tuile est cliquable
    const isClickable = !isArchived && !!actionUrl;
    
    // Pour les événements, améliorer la distinction visuelle lu/non lu
    const getEventCardStyle = () => {
      if (isArchived) return "opacity-60";
      
      if (isEventNotification) {
        if (isUnread) {
          // Non lu : bordure épaisse et fond coloré plus marqué
          if (eventStatus === 'completed') {
            return "border-l-4 border-l-green-600 bg-green-100 shadow-md";
          } else if (eventStatus === 'in_progress') {
            return "border-l-4 border-l-orange-600 bg-orange-100 shadow-md";
          } else if (eventStatus === 'proposed' || isEventProposed) {
            return "border-l-4 border-l-purple-600 bg-purple-100 shadow-md";
          } else {
            return "border-l-4 border-l-blue-600 bg-blue-100 shadow-md";
          }
        } else {
          // Lu : bordure fine et fond plus clair
          if (eventStatus === 'completed') {
            return "border-l-2 border-l-green-300 bg-green-50";
          } else if (eventStatus === 'in_progress') {
            return "border-l-2 border-l-orange-300 bg-orange-50";
          } else if (eventStatus === 'proposed' || isEventProposed) {
            return "border-l-2 border-l-purple-300 bg-purple-50";
          } else {
            return "border-l-2 border-l-blue-300 bg-blue-50";
          }
        }
      }
      
      // Pour les autres notifications
      if (notification.sla.isLate && !isArchived) {
        return "border-l-4 border-l-red-500 bg-red-50";
      } else if (isUnread) {
        return "border-l-4 border-l-blue-500 bg-blue-50 shadow-sm";
      } else if (!isArchived) {
        return "border-l-2 border-l-gray-200 bg-white";
      }
      
      return "opacity-60";
    };
    
    return (
      <Card
        key={notification.id}
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          getEventCardStyle()
        )}
      >
        <CardContent
          className={cn(
            "p-3 sm:p-4",
            isClickable && "cursor-pointer hover:bg-gray-50 transition-colors"
          )}
          onClick={() => {
            if (isClickable) {
              handleNotificationClick(notification);
            }
          }}
        >
          <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0 w-full">
              <div className={cn(
                "mt-1 flex-shrink-0",
                isUnread && "opacity-100",
                !isUnread && "opacity-60"
              )}>
                {getTypeIcon(notification.notification_type)}
              </div>
              <div className="flex-1 min-w-0 space-y-1 w-full">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h4 className={cn(
                      "truncate text-sm md:text-base",
                      isUnread 
                        ? isEventNotification 
                          ? "font-bold text-gray-900" 
                          : "font-semibold text-gray-900"
                        : isEventNotification
                        ? "font-medium text-gray-700"
                        : "font-medium text-gray-700"
                    )}>
                      {notification.title}
                    </h4>
                    {isUnread && (
                      <div className={cn(
                        "rounded-full flex-shrink-0",
                        isEventNotification ? "w-3 h-3 bg-blue-600" : "w-2 h-2 bg-blue-500"
                      )} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
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
                  "text-xs md:text-sm line-clamp-2 break-words",
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
                    {/* Badge pour les événements proposés */}
                    {(eventStatus === 'proposed' || isEventProposed) && (
                      <div className="text-xs font-semibold px-2 py-1 rounded inline-block bg-purple-100 text-purple-700">
                        En attente de réponse
                      </div>
                    )}
                  </div>
                )}
                {/* Actions pour les événements proposés */}
                {isEventProposed && metadata.event_id && !isArchived && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      onClick={() => {
                        handleEventResponse(metadata.event_id, 'accept');
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
                      onClick={() => {
                        openEventResponseModal(metadata.event_id, 'propose_alternative', metadata.event_title || notification.title);
                      }}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Proposer horaire
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 w-full sm:w-auto"
                      onClick={() => {
                        openEventResponseModal(metadata.event_id, 'refuse', metadata.event_title || notification.title);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Refuser
                    </Button>
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

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full md:w-auto">
              {isArchived ? (
                <div
                  className="flex items-center gap-2 w-full sm:w-auto"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unarchiveNotification(notification.id)}
                    className="h-8 px-2 text-green-600 hover:text-green-700 flex-1 sm:flex-initial"
                    title="Restaurer"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 flex-1 sm:flex-initial"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 w-full sm:w-auto">
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
                      className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
                      title="Archiver"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Bouton rapport pour les événements terminés */}
                  {isEventNotification && eventStatus === 'completed' && metadata.event_id && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      {/* Icône de rapport si un rapport existe */}
                      {metadata.has_report && metadata.report && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setReportSummaryPopup({
                              isOpen: true,
                              report: metadata.report,
                              eventTitle: metadata.event_title || notification.message
                            });
                          }}
                          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 relative w-full sm:w-auto"
                          title="Voir le résumé du rapport"
                        >
                          <FileTextIcon className="w-5 h-5" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenReportModal(metadata.event_id, metadata.event_title || notification.message);
                        }}
                        className="flex items-center gap-2 w-full sm:w-auto text-xs"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        {metadata.has_report ? 'Modifier rapport' : 'Ajouter rapport'}
                      </Button>
                    </div>
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
                    const metadata = notification.metadata || {};
                    const isEventNotification = 
                      notification.notification_type === 'event_upcoming' ||
                      notification.notification_type === 'event_in_progress' ||
                      notification.notification_type === 'event_completed' ||
                      metadata.event_id;
                    const eventStatus = metadata.event_status || 
                      (notification.notification_type === 'event_upcoming' ? 'upcoming' :
                       notification.notification_type === 'event_in_progress' ? 'in_progress' :
                       notification.notification_type === 'event_completed' ? 'completed' : null);
                    
                    // Style amélioré pour les événements lu/non lu
                    const getCompactCardStyle = () => {
                      if (isArchived) return "opacity-60";
                      
                      if (isEventNotification) {
                        if (isUnread) {
                          if (eventStatus === 'completed') {
                            return "border-l-4 border-l-green-600 bg-green-100 shadow-md";
                          } else if (eventStatus === 'in_progress') {
                            return "border-l-4 border-l-orange-600 bg-orange-100 shadow-md";
                          } else {
                            return "border-l-4 border-l-blue-600 bg-blue-100 shadow-md";
                          }
                        } else {
                          if (eventStatus === 'completed') {
                            return "border-l-2 border-l-green-300 bg-green-50";
                          } else if (eventStatus === 'in_progress') {
                            return "border-l-2 border-l-orange-300 bg-orange-50";
                          } else {
                            return "border-l-2 border-l-blue-300 bg-blue-50";
                          }
                        }
                      }
                      
                      if (isUnread) {
                        return "border-l-4 border-l-blue-500 bg-blue-50 shadow-sm";
                      } else if (!isArchived) {
                        return "border-l-2 border-l-gray-200 bg-white";
                      }
                      
                      return "opacity-60";
                    };
                    
                    return (
                      <Card key={notification.id} className={cn(
                        "transition-all hover:shadow-md",
                        getCompactCardStyle(),
                        notification.action_url && "cursor-pointer hover:border-blue-300"
                      )}>
                        <CardContent className="p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
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
                                    isUnread 
                                      ? isEventNotification 
                                        ? "font-bold text-gray-900" 
                                        : "font-semibold text-gray-900"
                                      : "font-medium text-gray-700"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {isUnread && (
                                    <div className={cn(
                                      "rounded-full flex-shrink-0",
                                      isEventNotification ? "w-3 h-3 bg-blue-600" : "w-2 h-2 bg-blue-500"
                                    )} />
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
                            {/* Icône de rapport pour les événements terminés */}
                            {isEventNotification && eventStatus === 'completed' && metadata.event_id && metadata.has_report && metadata.report && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setReportSummaryPopup({
                                    isOpen: true,
                                    report: metadata.report,
                                    eventTitle: metadata.event_title || notification.message
                                  });
                                }}
                                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 relative"
                                title="Voir le résumé du rapport"
                              >
                                <FileTextIcon className="w-4 h-4" />
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                              </Button>
                            )}
                            
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
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0"
    : "w-full h-full";

  const contentClass = mode === 'modal'
    ? "bg-white rounded-none sm:rounded-lg shadow-xl w-full max-w-full md:max-w-4xl h-screen sm:h-[90vh] md:h-[80vh] flex flex-col overflow-hidden"
    : "bg-white rounded-lg shadow-lg w-full h-full flex flex-col overflow-hidden";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold truncate">{title || 'Centre de Notifications'}</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{getRoleLabel()} • {totalCount} notification(s)</p>
            </div>
          </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 flex-1 sm:flex-initial"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Préférences</span>
            </Button>
            {mode === 'modal' && onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 h-8 sm:h-9 w-8 sm:w-9 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Sidebar */}
          <div className="w-full md:w-64 border-r border-b md:border-b-0 bg-gray-50 p-3 sm:p-4 md:p-4 overflow-y-auto max-h-[250px] sm:max-h-[350px] md:max-h-none flex-shrink-0 md:flex-shrink">
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
                    onClick={() => setFilter('events')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'events' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Événements</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{eventCount}</Badge>
                  </button>
                  <button
                    onClick={() => setFilter('contact_requests')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'contact_requests' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span>Demandes de contact</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{contactRequestCount}</Badge>
                  </button>
                  <button
                    onClick={() => setFilter('leads_to_treat')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'leads_to_treat' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <UserCheck className="h-4 w-4 mr-2" />
                      <span>Leads à traiter</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {leadsToTreatUnreadCount > 0 ? leadsToTreatUnreadCount : leadsToTreatCount}
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
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Search bar */}
            <div className="p-3 sm:p-4 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications list */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification trouvée</p>
                  </div>
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
            // Recharger le rapport pour mettre à jour l'affichage
            const eventId = rdvReportModal.rdvId;
            if (eventId) {
              const token = localStorage.getItem('token');
              fetch(`${config.API_URL}/api/rdv/${eventId}/report`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.data) {
                    setEventReports(prev => ({
                      ...prev,
                      [eventId]: data.data
                    }));
                  }
                })
                .catch(err => console.error('Erreur rechargement rapport:', err));
            }
            setRdvReportModal({ isOpen: false, rdvId: null, existingReport: null });
          }}
          existingReport={rdvReportModal.existingReport}
        />
      )}
      
      {/* Popup de résumé de rapport */}
      <Dialog open={reportSummaryPopup.isOpen} onOpenChange={(open) => {
        if (!open) {
          setReportSummaryPopup({ isOpen: false, report: null });
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6 m-2 sm:m-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-green-600" />
              Résumé du rapport
            </DialogTitle>
          </DialogHeader>
          {reportSummaryPopup.report && (
            <div className="space-y-4 mt-4">
              {reportSummaryPopup.eventTitle && (
                <div className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-md">
                  {reportSummaryPopup.eventTitle}
                </div>
              )}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Résumé</h4>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {reportSummaryPopup.report.summary}
                </div>
              </div>
              {reportSummaryPopup.report.action_items && 
               Array.isArray(reportSummaryPopup.report.action_items) && 
               reportSummaryPopup.report.action_items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Actions à suivre</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {reportSummaryPopup.report.action_items.map((item: any, index: number) => (
                      <li key={index} className="bg-gray-50 p-2 rounded-md">
                        {typeof item === 'string' ? item : item.text || JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportSummaryPopup.report.created_at && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Créé le {new Date(reportSummaryPopup.report.created_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de réponse à un événement proposé */}
      <Dialog open={eventResponseModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setEventResponseModal({ isOpen: false, eventId: null, action: null });
          setAlternativeDateTime({ date: '', time: '', notes: '' });
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 m-2 sm:m-4">
          <DialogHeader>
            <DialogTitle>
              {eventResponseModal.action === 'accept' && 'Accepter l\'événement'}
              {eventResponseModal.action === 'refuse' && 'Refuser l\'événement'}
              {eventResponseModal.action === 'propose_alternative' && 'Proposer un horaire alternatif'}
            </DialogTitle>
            <DialogDescription>
              {eventResponseModal.eventTitle && (
                <div className="mt-2 text-sm font-medium text-gray-700">
                  {eventResponseModal.eventTitle}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {eventResponseModal.action === 'refuse' && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="refusal-reason">Motif de refus *</Label>
                <Textarea
                  id="refusal-reason"
                  placeholder="Expliquez pourquoi vous refusez cet événement..."
                  className="mt-1"
                  rows={4}
                  onChange={(e) => {
                    const reason = e.target.value;
                    // Stocker temporairement dans alternativeDateTime.notes pour le refus
                    setAlternativeDateTime(prev => ({ ...prev, notes: reason }));
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEventResponseModal({ isOpen: false, eventId: null, action: null });
                    setAlternativeDateTime({ date: '', time: '', notes: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!alternativeDateTime.notes.trim()) {
                      toast.error('Veuillez indiquer un motif de refus');
                      return;
                    }
                    if (eventResponseModal.eventId) {
                      handleEventResponse(
                        eventResponseModal.eventId,
                        'refuse',
                        alternativeDateTime.notes
                      );
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Confirmer le refus
                </Button>
              </div>
            </div>
          )}
          
          {eventResponseModal.action === 'propose_alternative' && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alternative-date">Date *</Label>
                  <Input
                    id="alternative-date"
                    type="date"
                    className="mt-1"
                    value={alternativeDateTime.date}
                    onChange={(e) => {
                      setAlternativeDateTime(prev => ({ ...prev, date: e.target.value }));
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="alternative-time">Heure *</Label>
                  <Input
                    id="alternative-time"
                    type="time"
                    className="mt-1"
                    value={alternativeDateTime.time}
                    onChange={(e) => {
                      const time = e.target.value;
                      // Valider que l'heure est à :00 ou :30
                      const minutes = time.split(':')[1];
                      if (minutes && minutes !== '00' && minutes !== '30') {
                        toast.error('L\'heure doit être à :00 ou :30');
                        return;
                      }
                      setAlternativeDateTime(prev => ({ ...prev, time }));
                    }}
                    step="1800"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="alternative-notes">Notes (optionnel)</Label>
                <Textarea
                  id="alternative-notes"
                  placeholder="Ajoutez des notes sur cet horaire alternatif..."
                  className="mt-1"
                  rows={3}
                  value={alternativeDateTime.notes}
                  onChange={(e) => {
                    setAlternativeDateTime(prev => ({ ...prev, notes: e.target.value }));
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEventResponseModal({ isOpen: false, eventId: null, action: null });
                    setAlternativeDateTime({ date: '', time: '', notes: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    if (!alternativeDateTime.date || !alternativeDateTime.time) {
                      toast.error('Veuillez remplir la date et l\'heure');
                      return;
                    }
                    if (eventResponseModal.eventId) {
                      handleEventResponse(
                        eventResponseModal.eventId,
                        'propose_alternative',
                        undefined,
                        alternativeDateTime.date,
                        alternativeDateTime.time,
                        alternativeDateTime.notes
                      );
                    }
                  }}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Proposer cet horaire
                </Button>
              </div>
            </div>
          )}
          
          {eventResponseModal.action === 'accept' && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir accepter cet événement ?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEventResponseModal({ isOpen: false, eventId: null, action: null });
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    if (eventResponseModal.eventId) {
                      handleEventResponse(eventResponseModal.eventId, 'accept');
                    }
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UniversalNotificationCenter;

