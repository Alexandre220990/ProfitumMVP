/**
 * FCM PUSH SERVICE
 * 
 * Service pour envoyer des notifications push via Firebase Cloud Messaging
 * Permet d'envoyer des notifications même quand l'application est fermée
 */

import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// INITIALISATION FIREBASE ADMIN
// ============================================================================

let firebaseApp: admin.app.App | null = null;

/**
 * Initialiser Firebase Admin SDK
 */
function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Vérifier si déjà initialisé
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  // Configuration depuis les variables d'environnement
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID || 'profitum-app',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@profitum-app.iam.gserviceaccount.com',
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
      };

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId
  });

  console.log('🔥 Firebase Admin SDK initialisé');
  return firebaseApp;
}

// ============================================================================
// TYPES
// ============================================================================

export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  clickAction?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, string>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface FCMSendResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: Array<{
    token: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// SERVICE FCM
// ============================================================================

export class FCMPushService {
  
  /**
   * Envoyer une notification push à un utilisateur spécifique
   */
  static async sendToUser(
    userId: string,
    notification: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    try {
      // Récupérer tous les tokens FCM actifs de l'utilisateur
      const { data: devices, error } = await supabase
        .from('UserDevices')
        .select('fcm_token, device_type, device_name')
        .eq('user_id', userId)
        .eq('active', true)
        .not('fcm_token', 'is', null);

      if (error) {
        console.error('❌ Erreur récupération devices:', error);
        return {
          success: false,
          successCount: 0,
          failureCount: 0,
          results: []
        };
      }

      if (!devices || devices.length === 0) {
        console.log(`⚠️ Aucun device FCM trouvé pour user ${userId}`);
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          results: []
        };
      }

      // Envoyer à tous les devices de l'utilisateur
      const tokens = devices.map(d => d.fcm_token).filter(Boolean) as string[];
      return await this.sendToTokens(tokens, notification);

    } catch (error) {
      console.error('❌ Erreur sendToUser:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        results: []
      };
    }
  }

  /**
   * Envoyer une notification à plusieurs tokens spécifiques
   */
  static async sendToTokens(
    tokens: string[],
    notification: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    try {
      if (tokens.length === 0) {
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          results: []
        };
      }

      const app = initializeFirebaseAdmin();
      const messaging = admin.messaging(app);

      // Préparer le message
      const message: admin.messaging.MulticastMessage = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image
        },
        data: {
          ...notification.data,
          click_action: notification.clickAction || '/',
          icon: notification.icon || '/Logo-Profitum.png',
          badge: notification.badge || '/favicon.ico',
          tag: notification.tag || 'profitum-notification',
          require_interaction: notification.requireInteraction ? 'true' : 'false'
        },
        webpush: {
          notification: {
            icon: notification.icon || '/Logo-Profitum.png',
            badge: notification.badge || '/favicon.ico',
            tag: notification.tag,
            requireInteraction: notification.requireInteraction || false,
            vibrate: [200, 100, 200],
            actions: notification.actions
          },
          fcmOptions: {
            link: notification.clickAction || '/'
          }
        }
      };

      // Envoyer le message
      const response = await messaging.sendMulticast(message);

      console.log(`📤 FCM envoyé à ${tokens.length} devices:`, {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      // Traiter les résultats
      const results = tokens.map((token, index) => ({
        token,
        success: response.responses[index].success,
        error: response.responses[index].error?.message
      }));

      // Désactiver les tokens invalides
      for (const result of results) {
        if (!result.success && (
          result.error?.includes('not-registered') ||
          result.error?.includes('invalid-registration-token')
        )) {
          console.log(`🗑️ Désactivation token invalide: ${result.token.substring(0, 20)}...`);
          await this.deactivateToken(result.token);
        }
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        results
      };

    } catch (error) {
      console.error('❌ Erreur sendToTokens:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(token => ({
          token,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }))
      };
    }
  }

  /**
   * Envoyer à tous les utilisateurs d'un type spécifique
   */
  static async sendToUserType(
    userType: 'client' | 'expert' | 'admin' | 'apporteur',
    notification: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    try {
      const { data: devices, error } = await supabase
        .from('UserDevices')
        .select('fcm_token')
        .eq('user_type', userType)
        .eq('active', true)
        .not('fcm_token', 'is', null);

      if (error || !devices) {
        console.error('❌ Erreur récupération devices par type:', error);
        return {
          success: false,
          successCount: 0,
          failureCount: 0,
          results: []
        };
      }

      const tokens = devices.map(d => d.fcm_token).filter(Boolean) as string[];
      return await this.sendToTokens(tokens, notification);

    } catch (error) {
      console.error('❌ Erreur sendToUserType:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        results: []
      };
    }
  }

  /**
   * Désactiver un token invalide
   */
  private static async deactivateToken(token: string): Promise<void> {
    try {
      await supabase
        .from('UserDevices')
        .update({
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('fcm_token', token);
    } catch (error) {
      console.error('❌ Erreur désactivation token:', error);
    }
  }

  /**
   * Nettoyer les tokens inactifs depuis plus de 90 jours
   */
  static async cleanupInactiveTokens(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from('UserDevices')
        .delete()
        .eq('active', false)
        .lt('updated_at', ninetyDaysAgo.toISOString())
        .select();

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      console.log(`🧹 ${count} tokens inactifs supprimés`);
      return count;

    } catch (error) {
      console.error('❌ Erreur nettoyage tokens:', error);
      return 0;
    }
  }
}

