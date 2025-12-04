/**
 * Hook pour gérer les notifications temps réel via WebSocket
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import type { ProspectReplySummary } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface NotificationEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Créer la connexion WebSocket
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Événement de connexion
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connecté');
      setIsConnected(true);

      // S'authentifier
      const token = localStorage.getItem('token');
      if (token) {
        newSocket.emit('authenticate', token);
      }
    });

    // Événement de déconnexion
    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket déconnecté');
      setIsConnected(false);
    });

    // Nouvelle réponse prospect
    newSocket.on('new_reply', (event: NotificationEvent) => {
      const reply = event.data as ProspectReplySummary;
      
      console.log('📨 Nouvelle réponse reçue:', reply);

      // Afficher une notification toast
      toast.success(
        `Nouvelle réponse de ${reply.firstname} ${reply.lastname}`,
        {
          description: reply.company_name || reply.prospect_email,
          action: {
            label: 'Voir',
            onClick: () => navigate('/admin/prospection/reponses')
          },
          duration: 10000
        }
      );

      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['prospect-replies'] });
      queryClient.invalidateQueries({ queryKey: ['replies-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unread-replies-count'] });

      // Jouer un son de notification (optionnel)
      playNotificationSound();
    });

    // Rapport enrichi
    newSocket.on('report_enriched', (event: NotificationEvent) => {
      const { prospectId, prospectName } = event.data;
      
      console.log('✨ Rapport enrichi:', prospectName);

      // Afficher une notification
      toast.success(
        'Rapport enrichi prêt !',
        {
          description: `Le rapport de ${prospectName} a été enrichi par l'IA`,
          duration: 5000
        }
      );

      // Invalider le cache du rapport
      queryClient.invalidateQueries({ 
        queryKey: ['prospect-report', prospectId] 
      });
    });

    // Gestion des erreurs
    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error);
    });

    setSocket(newSocket);

    // Cleanup lors du démontage
    return () => {
      newSocket.close();
    };
  }, [queryClient, navigate]);

  return {
    socket,
    isConnected
  };
}

/**
 * Jouer un son de notification
 */
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignorer les erreurs de lecture (permission navigateur)
    });
  } catch (error) {
    // Ignorer si le fichier n'existe pas
  }
}
