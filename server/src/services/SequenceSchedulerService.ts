/**
 * Service de Programmation des Séquences d'Emails
 * Gère la planification et l'envoi automatique des séquences générées
 */

import { supabase } from '../lib/supabase';
import { GeneratedSequence, EmailStep } from '../types/enrichment-v4';

interface ScheduleSequenceParams {
  prospectId: string;
  sequence: GeneratedSequence;
  startDate?: Date;
  sequenceId?: string;
  sequenceName?: string;
}

interface ScheduledEmail {
  id: string;
  prospect_id: string;
  sequence_id: string | null;
  step_number: number;
  subject: string;
  body: string;
  scheduled_for: string;
  status: 'scheduled' | 'sent' | 'cancelled' | 'paused';
  created_at: string;
}

export class SequenceSchedulerService {
  
  /**
   * Calculer la date d'envoi d'un email selon le délai
   */
  calculateSendDate(startDate: Date, delayDays: number): Date {
    const sendDate = new Date(startDate);
    sendDate.setDate(sendDate.getDate() + delayDays);
    
    // Ajuster pour éviter le week-end
    const dayOfWeek = sendDate.getDay();
    if (dayOfWeek === 0) { // Dimanche -> Lundi
      sendDate.setDate(sendDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Samedi -> Lundi
      sendDate.setDate(sendDate.getDate() + 2);
    }
    
    // Définir l'heure optimale (9h00 par défaut)
    sendDate.setHours(9, 0, 0, 0);
    
    return sendDate;
  }

  /**
   * Programmer une séquence complète
   */
  async scheduleSequence(params: ScheduleSequenceParams): Promise<{
    success: boolean;
    scheduledEmails: ScheduledEmail[];
    error?: string;
  }> {
    try {
      const { prospectId, sequence, startDate = new Date(), sequenceId, sequenceName } = params;

      console.log(`📅 Programmation séquence pour prospect ${prospectId}...`);

      const scheduledEmails: ScheduledEmail[] = [];

      // Créer ou récupérer la séquence
      let finalSequenceId = sequenceId;
      if (!finalSequenceId && sequenceName) {
        const { data: newSequence, error: seqError } = await supabase
          .from('prospect_email_sequences')
          .insert({
            name: sequenceName,
            description: `Séquence V4 générée automatiquement - ${sequence.steps.length} emails`,
            is_active: true
          })
          .select()
          .single();

        if (seqError) {
          throw new Error(`Erreur création séquence: ${seqError.message}`);
        }

        finalSequenceId = newSequence.id;
      }

      // Programmer chaque email
      for (const step of sequence.steps) {
        const scheduledFor = this.calculateSendDate(startDate, step.delayDays);

        const { data, error } = await supabase
          .from('prospect_emails_scheduled')
          .insert({
            prospect_id: prospectId,
            sequence_id: finalSequenceId,
            step_number: step.stepNumber,
            subject: step.subject,
            body: step.body,
            scheduled_for: scheduledFor.toISOString(),
            status: 'scheduled',
            metadata: {
              enrichment_version: 'v4.0',
              ice_breakers: step.ice_breakers_fusionnes,
              fluidite_score: step.fluidite_narrative?.score_fluidite,
              personalization_score: step.personalization_score,
              timing_strategy: sequence.meta.timing_strategy,
              adjustment_applied: sequence.meta_sequence?.timing_strategy
            }
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Erreur programmation email ${step.stepNumber}:`, error);
          throw error;
        }

        scheduledEmails.push(data);
        console.log(`✅ Email ${step.stepNumber} programmé pour ${scheduledFor.toISOString()}`);
      }

      // Mettre à jour le statut du prospect
      await supabase
        .from('prospects')
        .update({
          emailing_status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectId);

      console.log(`✅ Séquence programmée : ${scheduledEmails.length} emails`);

      return {
        success: true,
        scheduledEmails
      };

    } catch (error: any) {
      console.error('❌ Erreur programmation séquence:', error);
      return {
        success: false,
        scheduledEmails: [],
        error: error.message
      };
    }
  }

  /**
   * Programmer une séquence en batch pour plusieurs prospects
   */
  async scheduleSequenceBatch(
    prospects: Array<{ id: string; sequence: GeneratedSequence }>,
    startDate?: Date,
    sequenceName?: string
  ): Promise<{
    success: boolean;
    total: number;
    scheduled: number;
    results: Array<{ prospectId: string; success: boolean; error?: string }>;
  }> {
    try {
      console.log(`📋 Programmation batch pour ${prospects.length} prospects...`);

      const results = [];
      let scheduled = 0;

      for (const prospect of prospects) {
        const result = await this.scheduleSequence({
          prospectId: prospect.id,
          sequence: prospect.sequence,
          startDate,
          sequenceName: sequenceName ? `${sequenceName} - ${prospect.id}` : undefined
        });

        results.push({
          prospectId: prospect.id,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          scheduled++;
        }

        // Pause entre prospects
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Batch terminé : ${scheduled}/${prospects.length} programmés`);

      return {
        success: true,
        total: prospects.length,
        scheduled,
        results
      };

    } catch (error: any) {
      console.error('❌ Erreur programmation batch:', error);
      return {
        success: false,
        total: prospects.length,
        scheduled: 0,
        results: []
      };
    }
  }

  /**
   * Annuler une séquence programmée
   */
  async cancelSequence(prospectId: string, reason?: string): Promise<{
    success: boolean;
    cancelled: number;
    error?: string;
  }> {
    try {
      const { data: scheduledEmails } = await supabase
        .from('prospect_emails_scheduled')
        .select('id')
        .eq('prospect_id', prospectId)
        .eq('status', 'scheduled');

      if (!scheduledEmails || scheduledEmails.length === 0) {
        return {
          success: true,
          cancelled: 0
        };
      }

      const { error } = await supabase
        .from('prospect_emails_scheduled')
        .update({
          status: 'cancelled',
          cancelled_reason: reason || 'Annulation manuelle'
        })
        .eq('prospect_id', prospectId)
        .eq('status', 'scheduled');

      if (error) throw error;

      console.log(`✅ Séquence annulée : ${scheduledEmails.length} emails`);

      return {
        success: true,
        cancelled: scheduledEmails.length
      };

    } catch (error: any) {
      console.error('❌ Erreur annulation séquence:', error);
      return {
        success: false,
        cancelled: 0,
        error: error.message
      };
    }
  }

  /**
   * Mettre en pause une séquence
   */
  async pauseSequence(prospectId: string): Promise<{
    success: boolean;
    paused: number;
    error?: string;
  }> {
    try {
      const { data: scheduledEmails } = await supabase
        .from('prospect_emails_scheduled')
        .select('id')
        .eq('prospect_id', prospectId)
        .eq('status', 'scheduled');

      if (!scheduledEmails || scheduledEmails.length === 0) {
        return {
          success: true,
          paused: 0
        };
      }

      const { error } = await supabase
        .from('prospect_emails_scheduled')
        .update({ status: 'paused' })
        .eq('prospect_id', prospectId)
        .eq('status', 'scheduled');

      if (error) throw error;

      console.log(`⏸️ Séquence mise en pause : ${scheduledEmails.length} emails`);

      return {
        success: true,
        paused: scheduledEmails.length
      };

    } catch (error: any) {
      console.error('❌ Erreur pause séquence:', error);
      return {
        success: false,
        paused: 0,
        error: error.message
      };
    }
  }

  /**
   * Reprendre une séquence en pause
   */
  async resumeSequence(prospectId: string): Promise<{
    success: boolean;
    resumed: number;
    error?: string;
  }> {
    try {
      const { data: pausedEmails } = await supabase
        .from('prospect_emails_scheduled')
        .select('id')
        .eq('prospect_id', prospectId)
        .eq('status', 'paused');

      if (!pausedEmails || pausedEmails.length === 0) {
        return {
          success: true,
          resumed: 0
        };
      }

      const { error } = await supabase
        .from('prospect_emails_scheduled')
        .update({ status: 'scheduled' })
        .eq('prospect_id', prospectId)
        .eq('status', 'paused');

      if (error) throw error;

      console.log(`▶️ Séquence reprise : ${pausedEmails.length} emails`);

      return {
        success: true,
        resumed: pausedEmails.length
      };

    } catch (error: any) {
      console.error('❌ Erreur reprise séquence:', error);
      return {
        success: false,
        resumed: 0,
        error: error.message
      };
    }
  }

  /**
   * Récupérer les séquences programmées pour un prospect
   */
  async getScheduledSequence(prospectId: string): Promise<{
    success: boolean;
    emails: ScheduledEmail[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('prospect_emails_scheduled')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('step_number', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        emails: data || []
      };

    } catch (error: any) {
      console.error('❌ Erreur récupération séquence:', error);
      return {
        success: false,
        emails: [],
        error: error.message
      };
    }
  }

  /**
   * Obtenir les statistiques de programmation
   */
  async getSchedulingStats(): Promise<{
    total_scheduled: number;
    total_sent: number;
    total_cancelled: number;
    total_paused: number;
    by_status: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('prospect_emails_scheduled')
        .select('status');

      if (error) throw error;

      const stats = {
        total_scheduled: 0,
        total_sent: 0,
        total_cancelled: 0,
        total_paused: 0,
        by_status: {} as Record<string, number>
      };

      data?.forEach(email => {
        const status = email.status;
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;

        switch (status) {
          case 'scheduled':
            stats.total_scheduled++;
            break;
          case 'sent':
            stats.total_sent++;
            break;
          case 'cancelled':
            stats.total_cancelled++;
            break;
          case 'paused':
            stats.total_paused++;
            break;
        }
      });

      return stats;

    } catch (error) {
      console.error('❌ Erreur stats programmation:', error);
      return {
        total_scheduled: 0,
        total_sent: 0,
        total_cancelled: 0,
        total_paused: 0,
        by_status: {}
      };
    }
  }
}

export default new SequenceSchedulerService();

