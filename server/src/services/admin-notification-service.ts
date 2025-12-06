/**
 * AdminNotificationService
 * Service pour envoyer des notifications aux administrateurs
 */

import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_SLA_CONFIG, calculateSLAStatus } from '../config/notification-sla-config';
import { DocumentStatusChecker } from './document-status-checker';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import SSE service (lazy pour éviter circular dependencies)
let notificationSSE: any = null;
const getSSEService = () => {
  if (!notificationSSE) {
    try {
      notificationSSE = require('./notification-sse-service').notificationSSE;
    } catch (error) {
      // SSE pas encore initialisé
    }
  }
  return notificationSSE;
};

export class AdminNotificationService {
  
  /**
   * Vérifier si une notification existe déjà pour éviter les doublons
   */
  private static async checkExistingNotification(data: {
    user_id: string;
    notification_type: string;
    dossier_id?: string;
    contact_message_id?: string;
  }): Promise<{ exists: boolean; notification_id?: string }> {
    try {
      let query = supabase
        .from('notification')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('notification_type', data.notification_type)
        .eq('status', 'unread')
        .limit(1);

      // Vérifier par dossier_id si fourni
      if (data.dossier_id) {
        query = query.eq('action_data->>client_produit_id', data.dossier_id);
      }

      // Vérifier par contact_message_id si fourni
      if (data.contact_message_id) {
        query = query.eq('action_data->>contact_message_id', data.contact_message_id);
      }

      const { data: existing, error } = await query.single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Erreur vérification notification existante:', error);
        return { exists: false };
      }

      return {
        exists: !!existing,
        notification_id: existing?.id
      };
    } catch (error) {
      console.error('❌ Erreur checkExistingNotification:', error);
      return { exists: false };
    }
  }

  /**
   * Créer ou mettre à jour une notification (évite les doublons)
   */
  private static async createOrUpdateNotification(data: {
    user_id: string;
    user_type: 'admin' | 'expert' | 'client' | 'apporteur';
    title: string;
    message: string;
    notification_type: string;
    priority: string;
    action_url?: string;
    action_data?: any;
    metadata?: any;
    dossier_id?: string;
    contact_message_id?: string;
  }): Promise<{ success: boolean; notification_id?: string; is_update?: boolean }> {
    try {
      // Vérifier si notification existe déjà
      const checkResult = await this.checkExistingNotification({
        user_id: data.user_id,
        notification_type: data.notification_type,
        dossier_id: data.dossier_id,
        contact_message_id: data.contact_message_id
      });

      if (checkResult.exists && checkResult.notification_id) {
        // Mettre à jour la notification existante
        const { data: updated, error } = await supabase
          .from('notification')
          .update({
            title: data.title,
            message: data.message,
            priority: data.priority,
            action_url: data.action_url,
            action_data: data.action_data,
            metadata: data.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkResult.notification_id)
          .select()
          .single();

        if (error) {
          console.error('❌ Erreur mise à jour notification:', error);
          return { success: false };
        }

        // 📡 Envoyer via SSE en temps réel
        const sse = getSSEService();
        if (sse && updated) {
          sse.sendNotificationToUser(data.user_id, updated);
        }

        return {
          success: true,
          notification_id: updated?.id,
          is_update: true
        };
      }

      // Créer nouvelle notification
      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: data.user_id,
          user_type: data.user_type,
          title: data.title,
          message: data.message,
          notification_type: data.notification_type,
          priority: data.priority,
          is_read: false,
          status: 'unread',
          action_url: data.action_url,
          action_data: data.action_data,
          metadata: data.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création notification:', error);
        return { success: false };
      }

      // 📡 Envoyer via SSE en temps réel
      const sse = getSSEService();
      if (sse && notification) {
        sse.sendNotificationToUser(data.user_id, notification);
      }

      return {
        success: true,
        notification_id: notification?.id,
        is_update: false
      };
    } catch (error) {
      console.error('❌ Erreur createOrUpdateNotification:', error);
      return { success: false };
    }
  }
  
  /**
   * Récupérer tous les IDs des admins actifs
   */
  static async getAdminIds(): Promise<string[]> {
    try {
      // Récupérer depuis la table Admin (plus fiable que auth.admin.listUsers)
      const { data: admins, error } = await supabase
        .from('Admin')
        .select('auth_user_id')
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Erreur récupération admins:', error);
        return [];
      }

      return admins?.map(admin => admin.auth_user_id) || [];
    } catch (error) {
      console.error('❌ Erreur getAdminIds:', error);
      return [];
    }
  }

  /**
   * Notifier les admins : Documents de pré-éligibilité uploadés
   * Utilise DocumentStatusChecker pour déterminer le type de notification approprié
   */
  static async notifyDocumentsPreEligibilityUploaded(data: {
    client_produit_id: string;
    client_id: string;
    client_name?: string;
    client_email?: string;
    client_company?: string;
    product_type: string;
    product_name?: string;
    documents: Array<{
      id: string;
      type: string;
      filename: string;
    }>;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      // Vérifier l'état des documents pour déterminer le type de notification
      const notificationInfo = await DocumentStatusChecker.getNotificationTypeForDossier(data.client_produit_id);
      
      if (!notificationInfo) {
        console.log('ℹ️ Aucune notification à créer (documents déjà validés ou autre raison)');
        return { success: false, notification_ids: [] };
      }

      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        console.warn('⚠️ Aucun admin trouvé pour recevoir la notification');
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      // Créer une notification pour chaque admin
      for (const adminId of adminIds) {
        // Déterminer l'action_url selon le type de notification
        let actionUrl = `/admin/dossiers/${data.client_produit_id}`;
        if (notificationInfo.notificationType === 'dossier_complete') {
          actionUrl = `/admin/dossiers/${data.client_produit_id}`; // Redirige vers la synthèse avec bouton "Sélectionner un expert"
        }

        const notificationType = notificationInfo.notificationType === 'waiting_documents' 
          ? 'admin_action_required' 
          : notificationInfo.notificationType === 'documents_to_validate'
          ? 'admin_action_required'
          : 'dossier_complete';

        const actionData = {
          client_produit_id: data.client_produit_id,
          client_id: data.client_id,
          client_name: data.client_name,
          client_email: data.client_email,
          client_company: data.client_company,
          product_type: data.product_type,
          product_name: data.product_name,
          documents: data.documents,
          action_required: notificationInfo.notificationType === 'dossier_complete' 
            ? 'select_expert' 
            : 'validate_eligibility',
          ...notificationInfo.metadata
        };

        const metadata = {
          client_produit_id: data.client_produit_id,
          client_id: data.client_id,
          client_name: data.client_name,
          client_company: data.client_company,
          product_type: data.product_type,
          product_name: data.product_name,
          ...notificationInfo.metadata
        };

        // Utiliser createOrUpdateNotification pour éviter les doublons
        const result = await this.createOrUpdateNotification({
          user_id: adminId,
          user_type: 'admin',
          title: notificationInfo.title,
          message: notificationInfo.message,
          notification_type: notificationType,
          priority: notificationInfo.priority,
          action_url: actionUrl,
          action_data: actionData,
          metadata: metadata,
          dossier_id: data.client_produit_id
        });

        if (result.success && result.notification_id) {
          notificationIds.push(result.notification_id);
          if (result.is_update) {
            console.log(`🔄 Notification mise à jour pour admin ${adminId}:`, result.notification_id);
          } else {
            console.log(`✅ Notification créée pour admin ${adminId}:`, result.notification_id);
          }
        }
      }

      // 📡 Rafraîchir KPI dashboard admin
      const sse = getSSEService();
      if (sse) {
        sse.sendKPIRefresh();
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyDocumentsPreEligibilityUploaded:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : Documents complémentaires uploadés (Étape 3)
   */
  static async notifyDocumentsComplementaryUploaded(data: {
    client_produit_id: string;
    client_id: string;
    client_name?: string;
    client_company?: string;
    product_type: string;
    documents: Array<{
      id: string;
      type: string;
      filename: string;
    }>;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            title: `📑 Documents complémentaires ${data.product_type}`,
            message: `${data.client_company || data.client_name || 'Un client'} a uploadé des documents complémentaires. Vérifier avant transmission à l'expert.`,
            notification_type: 'admin_action_required',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/dossiers/${data.client_produit_id}/validate-complete`,
            action_data: {
              client_produit_id: data.client_produit_id,
              client_id: data.client_id,
              client_name: data.client_name,
              client_company: data.client_company,
              product_type: data.product_type,
              documents: data.documents,
              action_required: 'validate_complete_dossier'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);

          // 📡 Envoyer via SSE en temps réel
          const sse = getSSEService();
          if (sse) {
            sse.sendNotificationToUser(adminId, notification);
            sse.sendKPIRefresh();
          }
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyDocumentsComplementaryUploaded:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : Expert a refusé le dossier
   */
  static async notifyExpertRefusedDossier(data: {
    client_produit_id: string;
    expert_id: string;
    expert_name: string;
    client_name?: string;
    product_type: string;
    refusal_reason?: string;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      for (const adminId of adminIds) {
        const result = await this.createOrUpdateNotification({
          user_id: adminId,
          user_type: 'admin',
          title: `⚠️ Expert a refusé le dossier`,
          message: `L'expert ${data.expert_name} a refusé le dossier ${data.product_type} de ${data.client_name || 'un client'}. ${data.refusal_reason || ''}`,
          notification_type: 'admin_action_required',
          priority: 'high',
          action_url: `/admin/dossiers/${data.client_produit_id}/reassign`,
          action_data: {
            client_produit_id: data.client_produit_id,
            expert_id: data.expert_id,
            expert_name: data.expert_name,
            client_name: data.client_name,
            product_type: data.product_type,
            refusal_reason: data.refusal_reason,
            action_required: 'reassign_expert'
          },
          dossier_id: data.client_produit_id
        });

        if (result.success && result.notification_id) {
          notificationIds.push(result.notification_id);
        }
      }

      // 📡 Rafraîchir KPI dashboard admin
      const sse = getSSEService();
      if (sse) {
        sse.sendKPIRefresh();
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyExpertRefusedDossier:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Récupérer l'auth_user_id d'un utilisateur depuis sa table
   */
  private static async getAuthUserId(userId: string, userType: 'admin' | 'expert' | 'client' | 'apporteur'): Promise<string | null> {
    try {
      let tableName: string;
      if (userType === 'admin') {
        tableName = 'Admin';
      } else if (userType === 'expert') {
        tableName = 'Expert';
      } else if (userType === 'client') {
        tableName = 'Client';
      } else if (userType === 'apporteur') {
        tableName = 'ApporteurAffaires';
      } else {
        return null;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('auth_user_id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error(`❌ Erreur récupération auth_user_id pour ${userType}:`, error);
        return null;
      }

      return data.auth_user_id || null;
    } catch (error) {
      console.error(`❌ Erreur getAuthUserId pour ${userType}:`, error);
      return null;
    }
  }

  /**
   * Notifier les admins : Nouveau message de contact
   */
  static async notifyNewContactMessage(data: {
    contact_message_id: string;
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
    sender_id?: string | null;
    sender_type?: 'admin' | 'expert' | 'client' | 'apporteur' | null;
    participants?: Array<{
      user_id: string;
      user_type: 'admin' | 'expert' | 'client' | 'apporteur';
      user_email?: string;
      user_name?: string;
    }>;
    contexte?: string;
  }): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const notificationIds: string[] = [];
      const slaConfig = NOTIFICATION_SLA_CONFIG.contact_message;
      const priority = slaConfig.defaultPriority;

      // Extraire le contexte (message ou contexte fourni)
      const contexte = data.contexte || data.message;
      
      // Construire le message de contact avec téléphone si disponible
      const contactInfo = `${data.name}${data.phone ? ` - ${data.phone}` : ''}`;
      const contactDetails = `Contact: ${contactInfo} - ${data.email}`;

      // Logique conditionnelle selon le type de lead
      if (data.sender_id && data.sender_type) {
        // Lead créé par un utilisateur (admin, expert, client, apporteur)
        
        if (data.sender_type === 'admin') {
          // Lead créé par admin
          const senderAuthUserId = await this.getAuthUserId(data.sender_id, 'admin');
          
          if (!senderAuthUserId) {
            console.error('❌ Impossible de récupérer auth_user_id pour le sender admin');
            return { success: false, notification_ids: [] };
          }

          // Notification pour le sender (admin)
          const title = `📋 Lead à traiter : ${contexte}`;
          const message = `Contexte: ${contexte} - ${contactDetails}`;
          
          const createdAt = new Date().toISOString();
          const slaStatus = calculateSLAStatus('contact_message', createdAt);
          const dueAt = new Date(new Date(createdAt).getTime() + slaConfig.targetHours * 60 * 60 * 1000).toISOString();
          
          const { data: senderNotification, error: senderError } = await supabase
            .from('notification')
            .insert({
              user_id: senderAuthUserId,
              user_type: 'admin',
              title: title,
              message: message,
              notification_type: 'lead_to_treat',
              priority: priority,
              is_read: false,
              status: 'unread',
              action_url: `/admin/contact/${data.contact_message_id}`,
              action_data: {
                contact_message_id: data.contact_message_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                message: data.message,
                contexte: contexte,
                action_required: 'view_lead'
              },
              metadata: {
                contact_message_id: data.contact_message_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                message: data.message,
                contexte: contexte,
                action_required: 'view_lead',
                sla: {
                  targetHours: slaConfig.targetHours,
                  acceptableHours: slaConfig.acceptableHours,
                  criticalHours: slaConfig.criticalHours,
                  status: slaStatus.status,
                  hoursRemaining: slaStatus.hoursRemaining
                },
                due_at: dueAt,
                sla_hours: slaConfig.targetHours,
                escalation_level: 0,
                reminders_sent: {
                  '24h': false,
                  '48h': false,
                  '120h': false
                }
              },
              created_at: createdAt,
              updated_at: createdAt
            })
            .select()
            .single();

          if (!senderError && senderNotification) {
            notificationIds.push(senderNotification.id);
            
            // 📡 Envoyer via SSE en temps réel
            const sse = getSSEService();
            if (sse) {
              sse.sendNotificationToUser(senderAuthUserId, senderNotification);
            }
          }

          // Notifications pour les participants si fournis
          if (data.participants && data.participants.length > 0) {
            for (const participant of data.participants) {
              // Récupérer auth_user_id si pas déjà fourni
              let participantAuthUserId = participant.user_id;
              
              // Si user_id n'est pas un auth_user_id, le récupérer depuis la table
              if (participant.user_type !== 'admin') {
                const authUserId = await this.getAuthUserId(participant.user_id, participant.user_type);
                if (authUserId) {
                  participantAuthUserId = authUserId;
                } else {
                  console.warn(`⚠️ Impossible de récupérer auth_user_id pour participant ${participant.user_type}:${participant.user_id}`);
                  continue;
                }
              }

              const participantTitle = `📋 Lead à traiter : ${contexte}`;
              const participantMessage = `Contexte: ${contexte} - ${contactDetails}`;
              
              // Déterminer l'action_url selon le type de participant
              let actionUrl = `/admin/contact/${data.contact_message_id}`;
              if (participant.user_type === 'expert') {
                actionUrl = `/expert/leads/${data.contact_message_id}`;
              } else if (participant.user_type === 'client') {
                actionUrl = `/leads/${data.contact_message_id}`;
              } else if (participant.user_type === 'apporteur') {
                actionUrl = `/apporteur/leads/${data.contact_message_id}`;
              }

              const createdAt = new Date().toISOString();
              const slaStatus = calculateSLAStatus('contact_message', createdAt);
              const dueAt = new Date(new Date(createdAt).getTime() + slaConfig.targetHours * 60 * 60 * 1000).toISOString();
              
              const { data: participantNotification, error: participantError } = await supabase
                .from('notification')
                .insert({
                  user_id: participantAuthUserId,
                  user_type: participant.user_type,
                  title: participantTitle,
                  message: participantMessage,
                  notification_type: 'lead_to_treat',
                  priority: priority,
                  is_read: false,
                  status: 'unread',
                  action_url: actionUrl,
                  action_data: {
                    contact_message_id: data.contact_message_id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    subject: data.subject,
                    message: data.message,
                    contexte: contexte,
                    action_required: 'view_lead'
                  },
                  metadata: {
                    contact_message_id: data.contact_message_id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    subject: data.subject,
                    message: data.message,
                    contexte: contexte,
                    action_required: 'view_lead',
                    sla: {
                      targetHours: slaConfig.targetHours,
                      acceptableHours: slaConfig.acceptableHours,
                      criticalHours: slaConfig.criticalHours,
                      status: slaStatus.status,
                      hoursRemaining: slaStatus.hoursRemaining
                    },
                    due_at: dueAt,
                    sla_hours: slaConfig.targetHours,
                    escalation_level: 0,
                    reminders_sent: {
                      '24h': false,
                      '48h': false,
                      '120h': false
                    }
                  },
                  created_at: createdAt,
                  updated_at: createdAt
                })
                .select()
                .single();

              if (!participantError && participantNotification) {
                notificationIds.push(participantNotification.id);
                
                // 📡 Envoyer via SSE en temps réel
                const sse = getSSEService();
                if (sse) {
                  sse.sendNotificationToUser(participantAuthUserId, participantNotification);
                }
              }
            }
          }

          // 📡 Rafraîchir KPI
          const sse = getSSEService();
          if (sse) {
            sse.sendKPIRefresh();
          }

        } else {
          // Lead créé par expert/client/apporteur → Notifier UNIQUEMENT tous les admins
          const adminIds = await this.getAdminIds();
          
          if (adminIds.length === 0) {
            return { success: false, notification_ids: [] };
          }

          const title = `📋 Lead à traiter : ${contexte}`;
          const message = `Contexte: ${contexte} - ${contactDetails}`;
          
          for (const adminId of adminIds) {
            const createdAt = new Date().toISOString();
            const slaStatus = calculateSLAStatus('contact_message', createdAt);
            const dueAt = new Date(new Date(createdAt).getTime() + slaConfig.targetHours * 60 * 60 * 1000).toISOString();
            
            const { data: adminNotification, error: adminError } = await supabase
              .from('notification')
              .insert({
                user_id: adminId,
                user_type: 'admin',
                title: title,
                message: message,
                notification_type: 'lead_to_treat',
                priority: priority,
                is_read: false,
                status: 'unread',
                action_url: `/admin/contact/${data.contact_message_id}`,
                action_data: {
                  contact_message_id: data.contact_message_id,
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
                  subject: data.subject,
                  message: data.message,
                  contexte: contexte,
                  sender_id: data.sender_id,
                  sender_type: data.sender_type,
                  action_required: 'view_lead'
                },
                metadata: {
                  contact_message_id: data.contact_message_id,
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
                  subject: data.subject,
                  message: data.message,
                  contexte: contexte,
                  sender_id: data.sender_id,
                  sender_type: data.sender_type,
                  action_required: 'view_lead',
                  sla: {
                    targetHours: slaConfig.targetHours,
                    acceptableHours: slaConfig.acceptableHours,
                    criticalHours: slaConfig.criticalHours,
                    status: slaStatus.status,
                    hoursRemaining: slaStatus.hoursRemaining
                  },
                  due_at: dueAt,
                  sla_hours: slaConfig.targetHours,
                  escalation_level: 0,
                  reminders_sent: {
                    '24h': false,
                    '48h': false,
                    '120h': false
                  }
                },
                created_at: createdAt,
                updated_at: createdAt
              })
              .select()
              .single();

            if (!adminError && adminNotification) {
              notificationIds.push(adminNotification.id);
              
              // 📡 Envoyer via SSE en temps réel
              const sse = getSSEService();
              if (sse) {
                sse.sendNotificationToUser(adminId, adminNotification);
              }
            }
          }

          // 📡 Rafraîchir KPI
          const sse = getSSEService();
          if (sse) {
            sse.sendKPIRefresh();
          }
        }

      } else {
        // Lead public classique (sans sender_id) → Notifier tous les admins avec format classique
        const adminIds = await this.getAdminIds();
        
        if (adminIds.length === 0) {
          return { success: false, notification_ids: [] };
        }

        // ✅ MIGRATION: Créer une notification dans notification pour chaque admin
        // (Plus besoin de notification globale, chaque admin a sa propre notification)

        // Créer aussi une notification dans la table 'notification' pour chaque admin
        const title = `📧 Nouveau message de contact`;
        const messageText = `${data.name} (${data.email}) vous a envoyé un message${data.subject ? ` : ${data.subject}` : ''}`;
        
        for (const adminId of adminIds) {
          const createdAt = new Date().toISOString();
          const slaStatus = calculateSLAStatus('contact_message', createdAt);
          const dueAt = new Date(new Date(createdAt).getTime() + slaConfig.targetHours * 60 * 60 * 1000).toISOString();
          
          const { data: userNotification, error: userNotifError } = await supabase
            .from('notification')
            .insert({
              user_id: adminId,
              user_type: 'admin',
              title: title,
              message: messageText,
              notification_type: 'contact_message',
              priority: priority,
              is_read: false,
              status: 'unread',
              action_url: `/admin/contact/${data.contact_message_id}`,
              action_data: {
                contact_message_id: data.contact_message_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                message: data.message,
                action_required: 'view_contact'
              },
              metadata: {
                contact_message_id: data.contact_message_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                message: data.message,
                action_required: 'view_contact',
                sla: {
                  targetHours: slaConfig.targetHours,
                  acceptableHours: slaConfig.acceptableHours,
                  criticalHours: slaConfig.criticalHours,
                  status: slaStatus.status,
                  hoursRemaining: slaStatus.hoursRemaining
                },
                due_at: dueAt,
                sla_hours: slaConfig.targetHours,
                escalation_level: 0,
                reminders_sent: {
                  '24h': false,
                  '48h': false,
                  '120h': false
                }
              },
              created_at: createdAt,
              updated_at: createdAt
            })
            .select()
            .single();

          if (!userNotifError && userNotification) {
            notificationIds.push(userNotification.id);
            
            // 📡 Envoyer via SSE en temps réel
            const sse = getSSEService();
            if (sse) {
              sse.sendNotificationToUser(adminId, userNotification);
            }
          }
        }

        // 📡 Rafraîchir KPI
        const sse = getSSEService();
        if (sse) {
          sse.sendKPIRefresh();
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };

    } catch (error) {
      console.error('❌ Erreur notifyNewContactMessage:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : X prospects prêts pour emailing
   */
  static async notifyProspectsReadyForEmailing(count: number): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        console.warn('⚠️ Aucun admin trouvé pour recevoir la notification');
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      // Créer une notification pour chaque admin
      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            notification_type: 'prospects_ready_for_emailing',
            title: `📧 ${count} prospect${count > 1 ? 's' : ''} prêt${count > 1 ? 's' : ''} pour emailing`,
            message: `${count} prospect${count > 1 ? 's' : ''} ${count > 1 ? 'sont' : 'est'} prêt${count > 1 ? 's' : ''} à recevoir un email`,
            priority: 'medium',
            status: 'unread',
            is_read: false,
            action_url: '/admin/prospection?filter=ready_for_emailing',
            action_data: {
              count,
              filter: 'ready_for_emailing'
            },
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);
          
          // Envoyer via SSE
          const sse = getSSEService();
          if (sse) {
            sse.sendNotificationToUser(adminId, notification);
          }
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };
    } catch (error) {
      console.error('❌ Erreur notifyProspectsReadyForEmailing:', error);
      return { success: false, notification_ids: [] };
    }
  }

  /**
   * Notifier les admins : Prospects avec score de priorité élevé
   */
  static async notifyHighPriorityProspects(count: number, minScore: number = 80): Promise<{ success: boolean; notification_ids: string[] }> {
    try {
      const adminIds = await this.getAdminIds();
      
      if (adminIds.length === 0) {
        console.warn('⚠️ Aucun admin trouvé pour recevoir la notification');
        return { success: false, notification_ids: [] };
      }

      const notificationIds: string[] = [];

      // ✅ MIGRATION: Créer une notification dans notification pour chaque admin
      for (const adminId of adminIds) {
        const { data: notification, error } = await supabase
          .from('notification')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            notification_type: 'high_priority_prospects',
            title: `⭐ ${count} prospect${count > 1 ? 's' : ''} haute priorité`,
            message: `${count} prospect${count > 1 ? 's' : ''} avec un score de priorité ≥ ${minScore}/100`,
            priority: 'high',
            status: 'unread',
            action_url: `/admin/prospection?filter=high_priority&min_score=${minScore}`,
            action_data: {
              count,
              min_score: minScore,
              filter: 'high_priority'
            },
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && notification) {
          notificationIds.push(notification.id);
          
          // Envoyer via SSE
          const sse = getSSEService();
          if (sse) {
            sse.sendNotificationToUser(adminId, notification);
          }
        }
      }

      return {
        success: notificationIds.length > 0,
        notification_ids: notificationIds
      };
    } catch (error) {
      console.error('❌ Erreur notifyHighPriorityProspects:', error);
      return { success: false, notification_ids: [] };
    }
  }
}

