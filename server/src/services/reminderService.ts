import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { NotificationService } from './NotificationService';

interface ReminderConfig {
  dossierIncompletDays: number;
  documentManquantDays: number;
  slaExpertDays: number;
  slaClientDays: number;
}

interface ReminderItem {
  id: string;
  type: 'dossier_incomplet' | 'document_manquant' | 'sla_expert' | 'sla_client';
  clientId: string;
  expertId?: string;
  produitId: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
}

export class ReminderService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private config: ReminderConfig;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    this.config = {
      dossierIncompletDays: 7, // Relance après 7 jours d'inactivité
      documentManquantDays: 3, // Relance après 3 jours sans document
      slaExpertDays: 2, // SLA expert : 2 jours pour répondre
      slaClientDays: 5 // SLA client : 5 jours pour fournir les documents
    };
  }

  /**
   * Vérifier et créer les relances nécessaires
   */
  async checkAndCreateReminders(): Promise<void> {
    try {
      console.log('🔔 Début de la vérification des relances...');

      // 1. Dossiers incomplets
      await this.checkIncompleteDossiers();

      // 2. Documents manquants
      await this.checkMissingDocuments();

      // 3. SLA experts non respectés
      await this.checkExpertSLA();

      // 4. SLA clients non respectés
      await this.checkClientSLA();

      console.log('✅ Vérification des relances terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des relances:', error);
    }
  }

  /**
   * Vérifier les dossiers incomplets
   */
  private async checkIncompleteDossiers(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.dossierIncompletDays);

    const { data: incompleteDossiers, error } = await this.supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (id, email, company_name, first_name, last_name),
        Expert (id, email, name),
        ProduitEligible (nom)
      `)
      .lt('updated_at', cutoffDate.toISOString())
      .in('statut', ['en_cours', 'dossier_en_cours'])
      .lt('progress', 100);

    if (error) {
      console.error('❌ Erreur récupération dossiers incomplets:', error);
      return;
    }

    for (const dossier of incompleteDossiers || []) {
      await this.createReminder({
        id: dossier.id,
        type: 'dossier_incomplet',
        clientId: dossier.clientId,
        expertId: dossier.expert_id,
        produitId: dossier.produitId,
        message: `Le dossier "${dossier.ProduitEligible?.nom}" est incomplet depuis ${this.config.dossierIncompletDays} jours. Progression actuelle: ${dossier.progress || 0}%`,
        priority: this.getPriority(dossier.progress || 0),
        dueDate: new Date()
      });
    }
  }

  /**
   * Vérifier les documents manquants
   */
  private async checkMissingDocuments(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.documentManquantDays);

    // Vérifier les assignations avec documents manquants
    const { data: assignmentsWithMissingDocs, error } = await this.supabase
      .from('ExpertAssignment')
      .select(`
        *,
        Client (id, email, company_name, first_name, last_name),
        Expert (id, email, name),
        ClientProduitEligible (
          id,
          ProduitEligible (nom),
          documents_required,
          documents_provided
        )
      `)
      .lt('updated_at', cutoffDate.toISOString())
      .eq('status', 'in_progress');

    if (error) {
      console.error('❌ Erreur récupération assignations documents manquants:', error);
      return;
    }

    for (const assignment of assignmentsWithMissingDocs || []) {
      const dossier = assignment.ClientProduitEligible;
      if (!dossier) continue;

      const documentsRequired = dossier.documents_required || [];
      const documentsProvided = dossier.documents_provided || [];
      const missingDocs = documentsRequired.filter((doc: string) => !documentsProvided.includes(doc));

      if (missingDocs.length > 0) {
        await this.createReminder({
          id: assignment.id,
          type: 'document_manquant',
          clientId: assignment.client_id,
          expertId: assignment.expert_id,
          produitId: dossier.id,
          message: `Documents manquants pour "${dossier.ProduitEligible?.nom}": ${missingDocs.join(', ')}`,
          priority: 'high',
          dueDate: new Date()
        });
      }
    }
  }

  /**
   * Vérifier les SLA experts non respectés
   */
  private async checkExpertSLA(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.slaExpertDays);

    // Messages non répondus par les experts
    const { data: unansweredMessages, error } = await this.supabase
      .from('message')
      .select(`
        *,
        ExpertAssignment!inner (
          id,
          expert_id,
          client_id,
          status,
          Client (email, company_name, first_name, last_name),
          Expert (email, name),
          ClientProduitEligible (
            ProduitEligible (nom)
          )
        )
      `)
      .lt('timestamp', cutoffDate.toISOString())
      .eq('sender_type', 'client')
      .is('read_at', null);

    if (error) {
      console.error('❌ Erreur récupération messages non répondus:', error);
      return;
    }

    for (const message of unansweredMessages || []) {
      const assignment = message.ExpertAssignment;
      if (!assignment) continue;

      await this.createReminder({
        id: message.id,
        type: 'sla_expert',
        clientId: assignment.client_id,
        expertId: assignment.expert_id,
        produitId: assignment.ClientProduitEligible?.id || '',
        message: `Message client non traité depuis ${this.config.slaExpertDays} jours pour "${assignment.ClientProduitEligible?.ProduitEligible?.nom}"`,
        priority: 'high',
        dueDate: new Date()
      });
    }
  }

  /**
   * Vérifier les SLA clients non respectés
   */
  private async checkClientSLA(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.slaClientDays);

    // Demandes d'experts non traitées par les clients
    const { data: pendingRequests, error } = await this.supabase
      .from('ExpertAssignment')
      .select(`
        *,
        Client (id, email, company_name, first_name, last_name),
        Expert (id, email, name),
        ClientProduitEligible (
          ProduitEligible (nom)
        )
      `)
      .lt('created_at', cutoffDate.toISOString())
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Erreur récupération demandes en attente:', error);
      return;
    }

    for (const request of pendingRequests || []) {
      await this.createReminder({
        id: request.id,
        type: 'sla_client',
        clientId: request.client_id,
        expertId: request.expert_id,
        produitId: request.ClientProduitEligible?.id || '',
        message: `Demande d'expert en attente depuis ${this.config.slaClientDays} jours pour "${request.ClientProduitEligible?.ProduitEligible?.nom}"`,
        priority: 'medium',
        dueDate: new Date()
      });
    }
  }

  /**
   * Créer une relance
   */
  private async createReminder(reminder: ReminderItem): Promise<void> {
    try {
      // Vérifier si une relance similaire existe déjà
      const { data: existingReminder } = await this.supabase
        .from('Reminder')
        .select('id')
        .eq('type', reminder.type)
        .eq('client_id', reminder.clientId)
        .eq('produit_id', reminder.produitId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Dernières 24h
        .single();

      if (existingReminder) {
        console.log(`⚠️ Relance déjà existante pour ${reminder.type} - ${reminder.clientId}`);
        return;
      }

      // Créer la relance
      const { data: newReminder, error } = await this.supabase
        .from('Reminder')
        .insert({
          type: reminder.type,
          client_id: reminder.clientId,
          expert_id: reminder.expertId,
          produit_id: reminder.produitId,
          message: reminder.message,
          priority: reminder.priority,
          due_date: reminder.dueDate.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création relance:', error);
        return;
      }

      console.log(`✅ Relance créée: ${reminder.type} pour ${reminder.clientId}`);

      // Envoyer les notifications
      await this.sendReminderNotifications(newReminder, reminder);

    } catch (error) {
      console.error('❌ Erreur lors de la création de la relance:', error);
    }
  }

  /**
   * Envoyer les notifications de relance
   */
  private async sendReminderNotifications(reminder: any, reminderData: ReminderItem): Promise<void> {
    try {
      // Notification au client
      await NotificationService.sendNotification({
        expert_id: reminderData.clientId,
        type: 'system',
        title: 'Relance - Action requise',
        message: reminderData.message,
        data: {
          notification_type: 'reminder',
          related_id: reminder.id,
          priority: reminderData.priority
        }
      });

      // Notification à l'expert si applicable
      if (reminderData.expertId) {
        await NotificationService.sendNotification({
          expert_id: reminderData.expertId,
          type: 'system',
          title: 'Relance - Action requise',
          message: reminderData.message,
          data: {
            notification_type: 'reminder',
            related_id: reminder.id,
            priority: reminderData.priority
          }
        });
      }

      // Notification admin pour les relances critiques
      if (reminderData.priority === 'critical') {
        await this.sendAdminNotification(reminder, reminderData);
      }

    } catch (error) {
      console.error('❌ Erreur envoi notifications relance:', error);
    }
  }

  /**
   * Envoyer notification admin
   */
  private async sendAdminNotification(reminder: any, reminderData: ReminderItem): Promise<void> {
    try {
      const { data: admins } = await this.supabase
        .from('Admin')
        .select('auth_id');

      if (!admins) return;

      for (const admin of admins) {
        await NotificationService.sendNotification({
          expert_id: admin.auth_id,
          type: 'system',
          title: 'ALERTE - Relance critique',
          message: `Relance critique: ${reminderData.message}`,
          data: {
            notification_type: 'reminder_critical',
            related_id: reminder.id,
            priority: 'critical'
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur notification admin:', error);
    }
  }

  /**
   * Déterminer la priorité basée sur la progression
   */
  private getPriority(progress: number): 'low' | 'medium' | 'high' | 'critical' {
    if (progress >= 80) return 'low';
    if (progress >= 50) return 'medium';
    if (progress >= 20) return 'high';
    return 'critical';
  }

  /**
   * Marquer une relance comme traitée
   */
  async markReminderAsHandled(reminderId: string): Promise<void> {
    try {
      await this.supabase
        .from('Reminder')
        .update({
          status: 'handled',
          handled_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      console.log(`✅ Relance ${reminderId} marquée comme traitée`);
    } catch (error) {
      console.error('❌ Erreur marquage relance:', error);
    }
  }

  /**
   * Obtenir les relances en cours
   */
  async getActiveReminders(userId: string, userType: 'client' | 'expert' | 'admin'): Promise<any[]> {
    try {
      let query = this.supabase
        .from('Reminder')
        .select(`
          *,
          Client (email, company_name, first_name, last_name),
          Expert (email, name),
          ClientProduitEligible (
            ProduitEligible (nom)
          )
        `)
        .eq('status', 'pending');

      // Filtrer selon le type d'utilisateur
      if (userType === 'client') {
        query = query.eq('client_id', userId);
      } else if (userType === 'expert') {
        query = query.eq('expert_id', userId);
      }
      // Admin voit toutes les relances

      const { data: reminders, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération relances:', error);
        return [];
      }

      return reminders || [];
    } catch (error) {
      console.error('❌ Erreur récupération relances:', error);
      return [];
    }
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig: Partial<ReminderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Configuration des relances mise à jour:', this.config);
  }
} 