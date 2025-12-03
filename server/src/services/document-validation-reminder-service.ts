/**
 * Service de rappels SLA pour les documents en attente de validation
 * Système de remplacement en cascade :
 * - Notification initiale → SLA 24h (remplace initiale)
 * - SLA 24h → SLA 48h (remplace 24h)
 * - SLA 48h → SLA 120h (remplace 48h)
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationPreferencesChecker } from './notification-preferences-checker';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DOCUMENT_SLA_CONFIG = {
  targetHours: 24,      // 24h : Rappel normal
  acceptableHours: 48,  // 48h : Rappel important
  criticalHours: 120    // 120h (5 jours) : Rappel urgent
};

interface DossierPending {
  id: string;
  created_at: string;
  updated_at: string;
  admin_eligibility_status: string;
  metadata: any;
  Client?: {
    id: string;
    name?: string;
    company_name?: string;
  };
  ProduitEligible?: {
    id: string;
    nom?: string;
    type_produit?: string;
  };
}

export class DocumentValidationReminderService {
  /**
   * Vérifier et envoyer les rappels pour les documents en attente
   */
  static async checkAndSendReminders(): Promise<void> {
    try {
      console.log('🔔 [Document SLA Reminder] Début de la vérification...');

      const now = new Date();
      
      // Récupérer TOUS les dossiers en attente de validation admin
      const { data: dossiers, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          created_at,
          updated_at,
          admin_eligibility_status,
          metadata,
          Client:clientId(id, name, company_name),
          ProduitEligible:produitId(id, nom, type_produit)
        `)
        .or('admin_eligibility_status.eq.pending,admin_eligibility_status.is.null')
        .limit(500);

      if (error) {
        console.error('❌ [Document SLA Reminder] Erreur récupération dossiers:', error);
        return;
      }

      if (!dossiers || dossiers.length === 0) {
        console.log('ℹ️  [Document SLA Reminder] Aucun dossier en attente.');
        return;
      }

      console.log(`📊 [Document SLA Reminder] ${dossiers.length} dossier(s) en attente trouvé(s)`);
      let remindersSent = 0;

      for (const dossier of dossiers) {
        const transformedDossier: DossierPending = {
          ...dossier,
          Client: Array.isArray(dossier.Client) && dossier.Client.length > 0 
            ? dossier.Client[0] 
            : undefined,
          ProduitEligible: Array.isArray(dossier.ProduitEligible) && dossier.ProduitEligible.length > 0 
            ? dossier.ProduitEligible[0] 
            : undefined,
        };
        
        const shouldRemind = this.shouldSendReminder(transformedDossier, now);
        
        if (shouldRemind.should && shouldRemind.threshold) {
          await this.sendReminder(transformedDossier, shouldRemind.threshold);
          remindersSent++;
        }
      }

      console.log(`✅ [Document SLA Reminder] Vérification terminée - ${remindersSent} rappel(s) envoyé(s)`);
    } catch (error) {
      console.error('❌ [Document SLA Reminder] Erreur lors de la vérification:', error);
    }
  }

  /**
   * Détermine si un rappel doit être envoyé selon les seuils SLA
   */
  static shouldSendReminder(
    dossier: DossierPending,
    now: Date
  ): { should: boolean; threshold: '24h' | '48h' | '120h' | null } {
    try {
      const metadata = dossier.metadata || {};
      const remindersSent = metadata.reminders_sent || {};
      
      // Utiliser updated_at (dernière modification) ou created_at si pas de maj
      const referenceDate = new Date(dossier.updated_at || dossier.created_at);
      const hoursElapsed = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);

      // Vérifier chaque seuil dans l'ordre (du plus critique au moins critique)
      if (hoursElapsed >= DOCUMENT_SLA_CONFIG.criticalHours && !remindersSent['120h']) {
        return { should: true, threshold: '120h' };
      }
      if (hoursElapsed >= DOCUMENT_SLA_CONFIG.acceptableHours && !remindersSent['48h']) {
        return { should: true, threshold: '48h' };
      }
      if (hoursElapsed >= DOCUMENT_SLA_CONFIG.targetHours && !remindersSent['24h']) {
        return { should: true, threshold: '24h' };
      }

      return { should: false, threshold: null };
    } catch (error) {
      console.error(`❌ [Document SLA Reminder] Erreur calcul shouldSendReminder pour dossier ${dossier.id}:`, error);
      return { should: false, threshold: null };
    }
  }

  /**
   * Envoie un rappel SLA et REMPLACE la notification précédente
   * Système en cascade :
   * - 24h remplace notification initiale (admin_action_required)
   * - 48h remplace SLA 24h
   * - 120h remplace SLA 48h
   */
  static async sendReminder(
    dossier: DossierPending,
    threshold: '24h' | '48h' | '120h'
  ): Promise<void> {
    try {
      const referenceDate = new Date(dossier.updated_at || dossier.created_at);
      const now = new Date();
      const hoursElapsed = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);
      const daysElapsed = Math.floor(hoursElapsed / 24);

      // Déterminer la priorité et le message
      let reminderPriority: 'high' | 'urgent' = 'high';
      let reminderTitle = '';
      const clientName = dossier.Client?.company_name || dossier.Client?.name || 'Client';
      const produitNom = dossier.ProduitEligible?.nom || 'Dossier';

      if (threshold === '120h') {
        reminderPriority = 'urgent';
        reminderTitle = `🚨 URGENT : Documents à valider - ${produitNom}`;
      } else if (threshold === '48h') {
        reminderPriority = 'high';
        reminderTitle = `⚠️ Documents à valider - ${produitNom}`;
      } else {
        reminderPriority = 'high';
        reminderTitle = `📋 Documents à valider - ${produitNom}`;
      }

      const reminderMessage = `Dossier ${produitNom} - Client ${clientName} - En attente depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`;

      // Récupérer tous les admins actifs
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id, email, name')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (!admins || admins.length === 0) {
        console.warn('⚠️ [Document SLA Reminder] Aucun admin actif trouvé');
        return;
      }

      // Créer une notification et remplacer l'ancienne pour chaque admin
      for (const admin of admins) {
        if (!admin.auth_user_id) continue;

        // Vérifier les préférences
        const shouldSendInApp = await NotificationPreferencesChecker.shouldSendInApp(
          admin.auth_user_id,
          'admin',
          'documents_pending_validation_reminder'
        );

        if (!shouldSendInApp) {
          console.log(`⏭️ [Document SLA Reminder] Notification non créée pour ${admin.email} - préférences désactivées`);
          continue;
        }

        // ====================================================================
        // ÉTAPE 1 : CRÉER LA NOUVELLE NOTIFICATION SLA
        // ====================================================================
        const { data: newNotification, error: insertError } = await supabase
          .from('notification')
          .insert({
            user_id: admin.auth_user_id,
            user_type: 'admin',
            title: reminderTitle,
            message: reminderMessage,
            notification_type: 'documents_pending_validation_reminder',
            priority: reminderPriority,
            is_read: false,
            status: 'unread',
            action_url: `/admin/dossiers/${dossier.id}`,
            action_data: {
              client_produit_id: dossier.id,
              threshold: threshold,
              sla_reminder: true,
              days_elapsed: daysElapsed,
              hours_elapsed: Math.floor(hoursElapsed)
            },
            metadata: {
              client_produit_id: dossier.id,
              threshold: threshold,
              days_elapsed: daysElapsed,
              hours_elapsed: Math.floor(hoursElapsed),
              client_name: clientName,
              produit_nom: produitNom
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (insertError) {
          console.error(`❌ [Document SLA Reminder] Erreur création notification pour ${admin.email}:`, insertError);
          continue;
        }

        if (!newNotification || newNotification.length === 0) {
          console.error(`❌ [Document SLA Reminder] Aucune notification créée pour ${admin.email}`);
          continue;
        }

        console.log(`✅ [Document SLA Reminder] Notification ${threshold} créée pour ${admin.email} (dossier ${dossier.id})`);

        // ====================================================================
        // ÉTAPE 2 : REMPLACER LES ANCIENNES NOTIFICATIONS (SYSTÈME EN CASCADE)
        // ====================================================================
        
        // 2A. Déterminer quelles notifications doivent être remplacées
        let typesToReplace: string[] = [];
        if (threshold === '24h') {
          // Remplace la notification initiale
          typesToReplace = ['admin_action_required'];
        } else if (threshold === '48h') {
          // Remplace SLA 24h (et initiale si elle existe encore)
          typesToReplace = ['admin_action_required', 'documents_pending_validation_reminder'];
        } else if (threshold === '120h') {
          // Remplace SLA 48h (et 24h + initiale si elles existent encore)
          typesToReplace = ['admin_action_required', 'documents_pending_validation_reminder'];
        }

        // 2B. Récupérer les notifications à remplacer pour ce dossier
        const { data: oldNotifications } = await supabase
          .from('notification')
          .select('id, notification_type, metadata, action_data')
          .eq('user_id', admin.auth_user_id)
          .in('notification_type', typesToReplace)
          .eq('is_read', false)
          .neq('status', 'replaced')
          .or(`action_data->>client_produit_id.eq.${dossier.id},metadata->>client_produit_id.eq.${dossier.id}`);

        if (oldNotifications && oldNotifications.length > 0) {
          // 2C. Filtrer pour ne remplacer que les notifications de seuil inférieur
          const notificationsToReplace = oldNotifications.filter(notif => {
            if (notif.notification_type === 'admin_action_required') {
              return true; // Toujours remplacer l'initiale
            }
            
            if (notif.notification_type === 'documents_pending_validation_reminder') {
              const oldThreshold = notif.action_data?.threshold || notif.metadata?.threshold;
              
              // Ne remplacer que si l'ancien seuil est inférieur au nouveau
              if (threshold === '48h' && oldThreshold === '24h') return true;
              if (threshold === '120h' && (oldThreshold === '24h' || oldThreshold === '48h')) return true;
              
              return false;
            }
            
            return false;
          });

          if (notificationsToReplace.length > 0) {
            // 2D. Marquer chaque notification comme "replaced"
            for (const notif of notificationsToReplace) {
              const updatedMetadata = {
                ...(notif.metadata || {}),
                replaced_by_sla_reminder: true,
                sla_reminder_notification_id: newNotification[0].id,
                replacement_date: new Date().toISOString(),
                replaced_threshold: notif.action_data?.threshold || notif.metadata?.threshold
              };

              await supabase
                .from('notification')
                .update({
                  status: 'replaced',
                  metadata: updatedMetadata,
                  updated_at: new Date().toISOString()
                })
                .eq('id', notif.id);
            }
            
            console.log(`✅ [Document SLA Reminder] ${notificationsToReplace.length} notification(s) remplacée(s) pour admin ${admin.email}`);
          }
        }
      }

      // ====================================================================
      // ÉTAPE 3 : METTRE À JOUR LE DOSSIER (marquer le rappel comme envoyé)
      // ====================================================================
      const currentMetadata = dossier.metadata || {};
      const updatedRemindersSent = {
        ...(currentMetadata.reminders_sent || {}),
        [threshold]: true
      };

      await supabase
        .from('ClientProduitEligible')
        .update({
          metadata: {
            ...currentMetadata,
            reminders_sent: updatedRemindersSent,
            last_sla_reminder_at: new Date().toISOString(),
            last_sla_reminder_threshold: threshold
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', dossier.id);

      console.log(`✅ [Document SLA Reminder] Rappel ${threshold} envoyé et dossier ${dossier.id} mis à jour`);
    } catch (error) {
      console.error(`❌ [Document SLA Reminder] Erreur lors de l'envoi du rappel:`, error);
    }
  }
}

