/**
 * Service pour vérifier les préférences utilisateur avant d'envoyer des notifications
 * Respecte les préférences granulaires par type de notification et niveau SLA
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface NotificationPreferenceCheck {
  shouldSendEmail: boolean;
  shouldSendPush: boolean;
  shouldSendInApp: boolean;
  reason?: string;
}

export class NotificationPreferencesChecker {
  /**
   * Vérifie si une notification doit être envoyée selon les préférences utilisateur
   */
  static async checkPreferences(
    userId: string,
    userType: 'admin' | 'expert' | 'client' | 'apporteur',
    notificationType: string,
    slaLevel?: 'target' | 'acceptable' | 'critical'
  ): Promise<NotificationPreferenceCheck> {
    try {
      // Récupérer les préférences utilisateur
      const { data: preferences, error } = await supabase
        .from('UserNotificationPreferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur récupération préférences:', error);
        // Par défaut, autoriser l'envoi si erreur
        return {
          shouldSendEmail: true,
          shouldSendPush: true,
          shouldSendInApp: true,
          reason: 'Erreur récupération préférences, envoi autorisé par défaut'
        };
      }

      // Si pas de préférences, utiliser les valeurs par défaut (tout activé)
      if (!preferences) {
        return {
          shouldSendEmail: true,
          shouldSendPush: true,
          shouldSendInApp: true,
          reason: 'Pas de préférences, valeurs par défaut appliquées'
        };
      }

      // Vérifier les préférences globales
      if (!preferences.email_enabled && !preferences.push_enabled && !preferences.in_app_enabled) {
        return {
          shouldSendEmail: false,
          shouldSendPush: false,
          shouldSendInApp: false,
          reason: 'Tous les canaux désactivés globalement'
        };
      }

      // Vérifier les préférences par type de notification
      const notificationTypes = preferences.notification_types || {};
      const typePref = notificationTypes[notificationType];

      if (typePref) {
        // Type spécifique trouvé
        if (!typePref.enabled) {
          return {
            shouldSendEmail: false,
            shouldSendPush: false,
            shouldSendInApp: false,
            reason: `Type de notification ${notificationType} désactivé`
          };
        }

        // Vérifier les canaux selon le niveau SLA
        if (slaLevel && typePref.slaChannels) {
          const slaChannels = typePref.slaChannels[slaLevel];
          return {
            shouldSendEmail: preferences.email_enabled && typePref.channels.email && slaChannels.email,
            shouldSendPush: preferences.push_enabled && typePref.channels.push && slaChannels.push,
            shouldSendInApp: preferences.in_app_enabled,
            reason: `Vérification selon SLA ${slaLevel}`
          };
        }

        // Vérifier les canaux généraux du type
        return {
          shouldSendEmail: preferences.email_enabled && typePref.channels.email,
          shouldSendPush: preferences.push_enabled && typePref.channels.push,
          shouldSendInApp: preferences.in_app_enabled,
          reason: `Vérification selon préférences du type ${notificationType}`
        };
      }

      // Pas de préférences spécifiques pour ce type, utiliser les préférences globales
      return {
        shouldSendEmail: preferences.email_enabled ?? true,
        shouldSendPush: preferences.push_enabled ?? true,
        shouldSendInApp: preferences.in_app_enabled ?? true,
        reason: 'Pas de préférences spécifiques, utilisation des préférences globales'
      };
    } catch (error) {
      console.error('❌ Erreur vérification préférences:', error);
      // En cas d'erreur, autoriser l'envoi par défaut
      return {
        shouldSendEmail: true,
        shouldSendPush: true,
        shouldSendInApp: true,
        reason: 'Erreur lors de la vérification, envoi autorisé par défaut'
      };
    }
  }

  /**
   * Vérifie uniquement si l'email doit être envoyé
   */
  static async shouldSendEmail(
    userId: string,
    userType: 'admin' | 'expert' | 'client' | 'apporteur',
    notificationType: string,
    slaLevel?: 'target' | 'acceptable' | 'critical'
  ): Promise<boolean> {
    const check = await this.checkPreferences(userId, userType, notificationType, slaLevel);
    return check.shouldSendEmail;
  }

  /**
   * Vérifie uniquement si la notification push doit être envoyée
   */
  static async shouldSendPush(
    userId: string,
    userType: 'admin' | 'expert' | 'client' | 'apporteur',
    notificationType: string,
    slaLevel?: 'target' | 'acceptable' | 'critical'
  ): Promise<boolean> {
    const check = await this.checkPreferences(userId, userType, notificationType, slaLevel);
    return check.shouldSendPush;
  }

  /**
   * Vérifie uniquement si la notification in-app doit être créée
   */
  static async shouldSendInApp(
    userId: string,
    userType: 'admin' | 'expert' | 'client' | 'apporteur',
    notificationType: string
  ): Promise<boolean> {
    const check = await this.checkPreferences(userId, userType, notificationType);
    return check.shouldSendInApp;
  }
}

