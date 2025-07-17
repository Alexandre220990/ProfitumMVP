import { useCallback, useState, useEffect } from "react";
import { DocumentNotification } from "@/services/messaging-document-integration";
import { useToast } from "@/hooks/use-toast";

interface UseDocumentNotificationsOptions { 
  clientId?: string;
  expertId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
  maxNotifications?: number; 
}

interface NotificationState { 
  notifications: DocumentNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null 
}

export const useDocumentNotifications = (options: UseDocumentNotificationsOptions = {}) => { 
  const {
    clientId, 
    expertId, 
    autoRefresh = true, 
    refreshInterval = 30000, // 30 secondes
    maxNotifications = 50 
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<NotificationState>({ 
    notifications: [], 
    unreadCount: 0, 
    isLoading: false, 
    error: null 
  });

  // Simuler des notifications pour le développement
  const generateMockNotifications = useCallback((): DocumentNotification[] => { 
    const mockNotifications: DocumentNotification[] = [];
    
    if (clientId) {
      // Notifications pour le client
      mockNotifications.push(
        {
          type: 'document_uploaded', 
          documentId: 'doc_001', 
          clientId, 
          message: 'Document "Facture_2024.pdf" uploadé avec succès', 
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min ago 
        },
        { 
          type: 'document_shared', 
          documentId: 'doc_002', 
          clientId, 
          expertId: 'expert_001', 
          message: 'Document partagé avec l\'expert Jean Dupont', 
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 min ago 
        },
        { 
          type: 'document_approved', 
          documentId: 'doc_003', 
          clientId, 
          expertId: 'expert_002', 
          message: 'Document "Audit_energetique.pdf" approuvé', 
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h ago 
        }
      );
    }

    if (expertId) { 
      // Notifications pour l'expert
      mockNotifications.push(
        {
          type: 'document_uploaded', 
          documentId: 'doc_004', 
          clientId: 'client_001', 
          expertId, 
          message: 'Nouveau document uploadé par le client', 
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 min ago 
        },
        { 
          type: 'document_rejected', 
          documentId: 'doc_005', 
          clientId: 'client_002', 
          expertId, 
          message: 'Document rejeté - informations manquantes', 
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago 
        }
      );
    }

    return mockNotifications.slice(0, maxNotifications);
  }, [clientId, expertId, maxNotifications]);

  // Charger les notifications
  const loadNotifications = useCallback(async () => { 
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try { 
      // TODO: Remplacer par un appel API réel
      // const response = await fetch(`/api/notifications?clientId=${clientId}&expertId=${expertId}`);
      // const notifications = await response.json();
      
      // Pour l'instant, utiliser des données simulées
      const notifications = generateMockNotifications();
      
      const unreadCount = notifications.filter(n => !n.read).length;

      setState({ notifications, unreadCount, isLoading: false, error: null });

    } catch (error) { 
      console.error('Erreur chargement notifications: ', error);
      setState(prev => ({
        ...prev, 
        isLoading: false, 
        error: 'Erreur lors du chargement des notifications' 
      }));
    }
  }, [clientId, expertId, generateMockNotifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => { 
    try {
      // TODO: Appel API pour marquer comme lue
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      
      setState(prev => ({ 
        ...prev, 
        notifications: prev.notifications.map(n => 
          n.documentId === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));

      toast({ 
        title: "Notification marquée comme lue", 
        description: "La notification a été mise à jour" 
      });

    } catch (error) { 
      console.error('Erreur marquage notification: ', error);
      toast({
        title: "Erreur", 
        description: "Impossible de marquer la notification comme lue", 
        variant: "destructive" 
      });
    }
  }, [toast]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => { 
    try {
      // TODO: Appel API pour marquer toutes comme lues
      // await fetch(`/api/notifications/read-all`, { method: 'PUT' });
      
      setState(prev => ({ 
        ...prev, 
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));

      toast({ 
        title: "Toutes les notifications marquées comme lues", 
        description: "Vos notifications ont été mises à jour" 
      });

    } catch (error) { 
      console.error('Erreur marquage notifications: ', error);
      toast({
        title: "Erreur", 
        description: "Impossible de marquer les notifications comme lues", 
        variant: "destructive" 
      });
    }
  }, [toast]);

  // Supprimer une notification
  const dismissNotification = useCallback(async (notificationId: string) => { 
    try {
      // TODO: Appel API pour supprimer
      // await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      
      setState(prev => { 
        const notification = prev.notifications.find(n => n.documentId === notificationId);
        return {
          ...prev, 
          notifications: prev.notifications.filter(n => n.documentId !== notificationId), 
          unreadCount: notification?.read ? prev.unreadCount : Math.max(0, prev.unreadCount - 1) 
        };
      });

      toast({ 
        title: "Notification supprimée", 
        description: "La notification a été supprimée" 
      });

    } catch (error) { 
      console.error('Erreur suppression notification: ', error);
      toast({
        title: "Erreur", 
        description: "Impossible de supprimer la notification", 
        variant: "destructive" 
      });
    }
  }, [toast]);

  // Ajouter une nouvelle notification
  const addNotification = useCallback((notification: DocumentNotification) => { 
    setState(prev => ({
      ...prev, 
      notifications: [notification, ...prev.notifications].slice(0, maxNotifications), 
      unreadCount: prev.unreadCount + 1 
    }));

    // Notification toast pour les nouvelles notifications importantes
    if (notification.type === 'document_rejected' || notification.type === 'document_approved') { 
      toast({
        title: notification.type === 'document_approved' ? 'Document approuvé' : 'Document rejeté', 
        description: notification.message, 
        variant: notification.type === 'document_rejected' ? 'destructive' : 'default' 
      });
    }
  }, [maxNotifications, toast]);

  // Auto-refresh
  useEffect(() => { 
    if (autoRefresh && (clientId || expertId)) {
      loadNotifications();
      
      const interval = setInterval(loadNotifications, refreshInterval);
      return () => clearInterval(interval); 
    }
  }, [autoRefresh, clientId, expertId, refreshInterval, loadNotifications]);

  // Chargement initial
  useEffect(() => { 
    if (clientId || expertId) {
      loadNotifications(); 
    }
  }, [clientId, expertId, loadNotifications]);

  return { 
    // État
    notifications: state.notifications, 
    unreadCount: state.unreadCount, 
    isLoading: state.isLoading, 
    error: state.error, 
    // Actions
    loadNotifications, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification, 
    addNotification, 
    // Utilitaires
    hasUnread: state.unreadCount > 0, 
    totalCount: state.notifications.length 
  };
}; 