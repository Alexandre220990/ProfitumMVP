/**
 * Service SSE (Server-Sent Events) pour notifications temps réel
 * Envoie automatiquement les nouvelles notifications aux clients connectés
 */

import { Response } from 'express';
import { supabase } from '../lib/supabase';

interface SSEClient {
  id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin' | 'apporteur';
  res: Response;
  lastEventId: number;
}

class NotificationSSEService {
  private clients: Map<string, SSEClient> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Ajouter un client SSE
   */
  addClient(clientId: string, userId: string, userType: string, res: Response) {
    console.log(`📡 Nouveau client SSE: ${userType} ${userId}`);

    const client: SSEClient = {
      id: clientId,
      user_id: userId,
      user_type: userType as any,
      res,
      lastEventId: Date.now()
    };

    this.clients.set(clientId, client);

    // Configurer les headers SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Pour nginx
    });

    // Envoyer un message de connexion
    this.sendToClient(clientId, {
      type: 'connected',
      message: 'Connecté au flux de notifications',
      timestamp: new Date().toISOString()
    });

    // Heartbeat toutes les 30 secondes
    const heartbeat = setInterval(() => {
      this.sendToClient(clientId, {
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }, 30000);

    // Nettoyer à la déconnexion
    res.on('close', () => {
      console.log(`📡 Client SSE déconnecté: ${userType} ${userId}`);
      clearInterval(heartbeat);
      this.clients.delete(clientId);
    });

    // Démarrer la vérification périodique si pas déjà démarrée
    if (!this.checkInterval) {
      this.startPeriodicCheck();
    }
  }

  /**
   * Envoyer un événement à un client spécifique
   */
  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const event = `data: ${JSON.stringify(data)}\n\n`;
      client.res.write(event);
    } catch (error) {
      console.error(`❌ Erreur envoi SSE à ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  sendNotificationToUser(userId: string, notification: any) {
    let sent = 0;

    this.clients.forEach((client) => {
      if (client.user_id === userId) {
        this.sendToClient(client.id, {
          type: 'notification',
          data: notification,
          timestamp: new Date().toISOString()
        });
        sent++;
      }
    });

    if (sent > 0) {
      console.log(`📤 Notification SSE envoyée à ${sent} client(s) de l'utilisateur ${userId}`);
    }

    return sent;
  }

  /**
   * Envoyer une notification à tous les admins
   */
  sendNotificationToAllAdmins(notification: any) {
    let sent = 0;

    this.clients.forEach((client) => {
      if (client.user_type === 'admin') {
        this.sendToClient(client.id, {
          type: 'notification',
          data: notification,
          timestamp: new Date().toISOString()
        });
        sent++;
      }
    });

    if (sent > 0) {
      console.log(`📤 Notification SSE envoyée à ${sent} admin(s) connecté(s)`);
    }

    return sent;
  }

  /**
   * Vérifier périodiquement les nouvelles notifications
   */
  private startPeriodicCheck() {
    console.log('🔄 Démarrage vérification périodique notifications SSE (toutes les 5s)');

    this.checkInterval = setInterval(async () => {
      await this.checkNewNotifications();
    }, 5000); // Vérifier toutes les 5 secondes
  }

  /**
   * Vérifier les nouvelles notifications pour tous les clients connectés
   */
  private async checkNewNotifications() {
    if (this.clients.size === 0) {
      // Arrêter la vérification si aucun client
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
        console.log('⏸️ Arrêt vérification périodique (aucun client connecté)');
      }
      return;
    }

    for (const [clientId, client] of this.clients.entries()) {
      try {
        // Récupérer les nouvelles notifications depuis le dernier check
        const { data: notifications, error } = await supabase
          .from('notification')
          .select('*')
          .eq('user_id', client.user_id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error(`❌ Erreur récupération notifications pour ${client.user_id}:`, error);
          continue;
        }

        if (notifications && notifications.length > 0) {
          // Envoyer chaque nouvelle notification
          notifications.forEach(notif => {
            this.sendToClient(clientId, {
              type: 'new_notification',
              data: notif,
              timestamp: new Date().toISOString()
            });
          });
        }
      } catch (error) {
        console.error(`❌ Erreur check notifications pour ${clientId}:`, error);
      }
    }
  }

  /**
   * Envoyer un événement de rafraîchissement KPI (pour admins)
   */
  sendKPIRefresh() {
    let sent = 0;

    this.clients.forEach((client) => {
      if (client.user_type === 'admin') {
        this.sendToClient(client.id, {
          type: 'refresh_kpi',
          timestamp: new Date().toISOString()
        });
        sent++;
      }
    });

    if (sent > 0) {
      console.log(`📊 Événement refresh_kpi envoyé à ${sent} admin(s)`);
    }

    return sent;
  }

  /**
   * Obtenir le nombre de clients connectés
   */
  getConnectedClientsCount(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {
      admin: 0,
      client: 0,
      expert: 0,
      apporteur: 0
    };

    this.clients.forEach(client => {
      byType[client.user_type] = (byType[client.user_type] || 0) + 1;
    });

    return {
      total: this.clients.size,
      byType
    };
  }

  /**
   * Arrêter le service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Fermer toutes les connexions
    this.clients.forEach((client) => {
      try {
        client.res.end();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
    });

    this.clients.clear();
    console.log('⏹️ Service SSE arrêté');
  }
}

// Singleton
export const notificationSSE = new NotificationSSEService();

