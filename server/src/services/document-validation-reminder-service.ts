/**
 * Service de rappels SLA pour les documents en attente de validation
 * Système de remplacement en cascade :
 * - Notification initiale → SLA 24h (remplace initiale)
 * - SLA 24h → SLA 48h (remplace 24h)
 * - SLA 48h → SLA 120h (remplace 48h)
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationPreferencesChecker } from './notification-preferences-checker';
import { NotificationAggregationService } from './notification-aggregation-service';
import { DocumentStatusChecker } from './document-status-checker';

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
          clientId,
          produitId,
          created_at,
          updated_at,
          admin_eligibility_status,
          metadata
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
      const adminsToAggregate = new Set<string>();

      for (const dossier of dossiers) {
        // Récupérer les informations du client séparément
        let clientData: { id: string; name?: string; company_name?: string } | undefined;
        if (dossier.clientId) {
          const { data: client } = await supabase
            .from('Client')
            .select('id, name, company_name')
            .eq('id', dossier.clientId)
            .single();
          if (client) {
            clientData = client;
          }
        }

        // Récupérer les informations du produit séparément
        let produitData: { id: string; nom?: string; type_produit?: string } | undefined;
        if (dossier.produitId) {
          const { data: produit } = await supabase
            .from('ProduitEligible')
            .select('id, nom, type_produit')
            .eq('id', dossier.produitId)
            .single();
          if (produit) {
            produitData = produit;
          }
        }

        const transformedDossier: DossierPending = {
          ...dossier,
          Client: clientData,
          ProduitEligible: produitData,
        };
        
        const shouldRemind = this.shouldSendReminder(transformedDossier, now);
        
        if (shouldRemind.should && shouldRemind.threshold) {
          const affectedAdmins = await this.sendReminder(transformedDossier, shouldRemind.threshold);
          remindersSent++;
          
          // Collecter les admins qui ont reçu des notifications pour agrégation
          affectedAdmins.forEach(adminId => adminsToAggregate.add(adminId));
        }
      }

      console.log(`✅ [Document SLA Reminder] Vérification terminée - ${remindersSent} rappel(s) envoyé(s)`);

      // Agréger les notifications par client pour chaque admin affecté
      if (adminsToAggregate.size > 0) {
        console.log(`\n📊 [Document SLA Reminder] Agrégation pour ${adminsToAggregate.size} admin(s)...`);
        for (const adminId of adminsToAggregate) {
          await NotificationAggregationService.aggregateNotificationsByClient(adminId);
        }
        console.log('✅ [Document SLA Reminder] Agrégation terminée');
      }
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
  ): Promise<string[]> {
    const affectedAdmins: string[] = [];
    try {
      const referenceDate = new Date(dossier.updated_at || dossier.created_at);
      const now = new Date();
      const hoursElapsed = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);
      const daysElapsed = Math.floor(hoursElapsed / 24);

      // Déterminer la priorité
      let reminderPriority: 'high' | 'urgent' = 'high';
      if (threshold === '120h') {
        reminderPriority = 'urgent';
      } else if (threshold === '48h') {
        reminderPriority = 'high';
      } else {
        reminderPriority = 'high';
      }
      
      // Utiliser les noms du dossier ou récupérer depuis DocumentStatusChecker
      let clientName = dossier.Client?.company_name || dossier.Client?.name || 'Client';
      let produitNom = dossier.ProduitEligible?.nom || 'Dossier';
      
      // Si les noms ne sont pas disponibles, utiliser DocumentStatusChecker
      if (clientName === 'Client' || produitNom === 'Dossier') {
        const documentStatus = await DocumentStatusChecker.checkDocumentStatus(dossier.id);
        if (documentStatus) {
          if (clientName === 'Client') {
            clientName = documentStatus.clientName;
          }
          if (produitNom === 'Dossier') {
            produitNom = documentStatus.productName;
          }
        }
      }

      // Vérifier l'état réel des documents pour générer le bon message
      const documentStatus = await DocumentStatusChecker.checkDocumentStatus(dossier.id);
      
      let reminderTitle = '';
      let reminderMessage = '';
      
      if (documentStatus) {
        if (!documentStatus.hasUploadedDocuments) {
          // Aucun document uploadé
          const days = documentStatus.daysWaitingDocuments || 0;
          reminderTitle = threshold === '120h' 
            ? `🚨 URGENT : En attente de documents - ${produitNom}`
            : threshold === '48h'
            ? `⚠️ En attente de documents - ${produitNom}`
            : `📋 En attente de documents - ${produitNom}`;
          reminderMessage = `Dossier ${produitNom} - Client ${clientName} - Depuis ${days} jour${days > 1 ? 's' : ''}`;
        } else if (documentStatus.pendingDocumentsCount > 0) {
          // Documents uploadés mais en attente de validation
          const days = documentStatus.daysWaitingValidation || 0;
          reminderTitle = threshold === '120h'
            ? `🚨 URGENT : Documents à valider - ${produitNom}`
            : threshold === '48h'
            ? `⚠️ Documents à valider - ${produitNom}`
            : `📋 Documents à valider - ${produitNom}`;
          reminderMessage = `Client ${clientName} - ${documentStatus.pendingDocumentsCount} document${documentStatus.pendingDocumentsCount > 1 ? 's' : ''} en attente de validation admin - En attente depuis ${days} jour${days > 1 ? 's' : ''}`;
        } else {
          // Tous les documents sont validés - ne pas créer de rappel
          return [];
        }
      } else {
        // Fallback si la vérification échoue
        reminderMessage = `Dossier ${produitNom} - Client ${clientName} - En attente depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`;
      }
      
      // Si reminderTitle n'a pas été défini, utiliser l'ancien format
      if (!reminderTitle) {
        reminderTitle = threshold === '120h'
          ? `🚨 URGENT : Documents à valider - ${produitNom}`
          : threshold === '48h'
          ? `⚠️ Documents à valider - ${produitNom}`
          : `📋 Documents à valider - ${produitNom}`;
      }

      // Récupérer tous les admins actifs
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id, email, name')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (!admins || admins.length === 0) {
        console.warn('⚠️ [Document SLA Reminder] Aucun admin actif trouvé');
        return [];
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
        // ÉTAPE 1 : CRÉER LA NOUVELLE NOTIFICATION SLA (ENFANT)
        // ====================================================================
        const { data: newNotification, error: insertError } = await supabase
          .from('notification')
          .insert({
            user_id: admin.auth_user_id,
            user_type: 'admin',
            title: reminderTitle || `📋 Documents à valider - ${produitNom}`,
            message: reminderMessage || `Dossier ${produitNom} - Client ${clientName} - Depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`,
            notification_type: 'documents_pending_validation_reminder',
            priority: reminderPriority,
            is_read: false,
            status: 'unread',
            is_child: false, // Sera mis à true lors de l'agrégation
            hidden_in_list: false, // Sera mis à true lors de l'agrégation
            action_url: `/admin/dossiers/${dossier.id}`,
            action_data: {
              client_produit_id: dossier.id,
              client_id: dossier.Client?.id,
              client_name: clientName,
              client_company: clientName,
              product_name: produitNom,
              threshold: threshold,
              sla_reminder: true,
              days_elapsed: daysElapsed,
              hours_elapsed: Math.floor(hoursElapsed)
            },
            metadata: {
              client_produit_id: dossier.id,
              client_id: dossier.Client?.id,
              client_name: clientName,
              produit_nom: produitNom,
              threshold: threshold,
              days_elapsed: daysElapsed,
              hours_elapsed: Math.floor(hoursElapsed)
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
        affectedAdmins.push(admin.auth_user_id);

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
      
      return affectedAdmins;
    } catch (error) {
      console.error(`❌ [Document SLA Reminder] Erreur lors de l'envoi du rappel:`, error);
      return [];
    }
  }
}

