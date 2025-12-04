/**
 * Service WebSocket pour notifications temps réel
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ProspectReplySummary } from '../types/prospects';

export class WebSocketService {
  private static io: SocketIOServer | null = null;

  /**
   * Initialiser le serveur WebSocket
   */
  static initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log('🔌 Client WebSocket connecté:', socket.id);

      // Authentification
      socket.on('authenticate', (token: string) => {
        try {
          // Ici on pourrait vérifier le token JWT
          // Pour l'instant, on considère que tous les admins peuvent recevoir les notifications
          socket.join('admins');
          console.log('✅ Client authentifié et ajouté au groupe admins');
        } catch (error) {
          console.error('❌ Erreur authentification WebSocket:', error);
          socket.disconnect();
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client WebSocket déconnecté:', socket.id);
      });
    });

    console.log('✅ WebSocket Service initialisé');
  }

  /**
   * Notifier une nouvelle réponse prospect
   */
  static notifyNewReply(reply: ProspectReplySummary): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket non initialisé');
      return;
    }

    this.io.to('admins').emit('new_reply', {
      type: 'new_reply',
      data: reply,
      timestamp: new Date().toISOString()
    });

    console.log(`📨 Notification nouvelle réponse envoyée: ${reply.prospect_email}`);
  }

  /**
   * Notifier qu'un rapport a été enrichi
   */
  static notifyReportEnriched(prospectId: string, prospectName: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket non initialisé');
      return;
    }

    this.io.to('admins').emit('report_enriched', {
      type: 'report_enriched',
      data: {
        prospectId,
        prospectName
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✨ Notification enrichissement rapport envoyée: ${prospectName}`);
  }

  /**
   * Obtenir le nombre de clients connectés
   */
  static getConnectedClientsCount(): number {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }
}

