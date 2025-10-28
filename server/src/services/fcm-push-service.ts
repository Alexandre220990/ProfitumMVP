/**
 * FCM PUSH SERVICE
 * 
 * Service pour envoyer des notifications push via Firebase Cloud Messaging
 * Permet d'envoyer des notifications même quand l'application est fermée
 * 
 * ⚠️ TEMPORAIREMENT DÉSACTIVÉ : firebase-admin pas encore installé
 * Utiliser web-push (déjà installé) en attendant
 */

// TODO: Installer firebase-admin quand prêt
// import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// INITIALISATION FIREBASE ADMIN (DÉSACTIVÉ)
// ============================================================================

// TODO: Réactiver quand firebase-admin sera installé
/*
let firebaseApp: admin.app.App | null = null;

function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

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
*/

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
   * ⚠️ SERVICE TEMPORAIREMENT DÉSACTIVÉ
   * Envoyer une notification push à un utilisateur spécifique
   * 
   * TODO: Activer quand firebase-admin sera installé
   * Pour l'instant, utiliser web-push (routes/notifications.ts)
   */
  static async sendToUser(
    userId: string,
    notification: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    console.warn('⚠️ FCM Service désactivé - Utiliser web-push à la place');
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      results: []
    };
  }

  /**
   * Envoyer une notification à plusieurs tokens spécifiques
   * ⚠️ DÉSACTIVÉ - Utiliser web-push
   */
  static async sendToTokens(
    tokens: string[],
    notification: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    console.warn('⚠️ FCM Service désactivé - Utiliser web-push à la place');
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      results: tokens.map(token => ({
        token,
        success: false,
        error: 'FCM service désactivé'
      }))
    };
  }

  /**
   * Envoyer à tous les utilisateurs d'un type spécifique
   * ⚠️ DÉSACTIVÉ - Utiliser web-push
   */
  static async sendToUserType(
    userType: 'client' | 'expert' | 'admin' | 'apporteur',
    notification: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    console.warn('⚠️ FCM Service désactivé - Utiliser web-push à la place');
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      results: []
    };
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

