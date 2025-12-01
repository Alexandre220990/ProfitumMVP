import { createClient } from '@supabase/supabase-js';
import {
  Prospect,
  ProspectEmail,
  CreateProspectInput,
  UpdateProspectInput,
  CreateProspectEmailInput,
  UpdateProspectEmailInput,
  ProspectFilters,
  ProspectListResponse,
  ProspectStats,
  ApiResponse,
  EnrichmentStatus,
  AIStatus,
  EmailingStatus
} from '../types/prospects';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ProspectService {
  
  // ===== CRUD PROSPECTS =====
  
  /**
   * Crée un nouveau prospect
   */
  static async createProspect(input: CreateProspectInput): Promise<ApiResponse<Prospect>> {
    try {
      // Si skip_enrichment est true, on met 'skipped' dans enrichment_status (ou on crée un nouveau statut)
      // Pour l'instant, on met 'pending' mais on ne déclenchera pas l'enrichissement automatique
      const enrichmentStatus = input.skip_enrichment ? 'pending' as EnrichmentStatus : 'pending' as EnrichmentStatus;
      
      const prospectData = {
        email: input.email,
        source: input.source,
        email_validity: input.email_validity || null,
        firstname: input.firstname || null,
        lastname: input.lastname || null,
        company_name: input.company_name || null,
        siren: input.siren || null,
        enrichment_status: enrichmentStatus,
        ai_status: 'pending' as AIStatus,
        emailing_status: 'pending' as EmailingStatus,
        score_priority: 0,
        metadata: {
          ...(input.metadata || {}),
          skip_enrichment: input.skip_enrichment || false
        }
      };

      const { data, error } = await supabase
        .from('prospects')
        .insert(prospectData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Erreur création prospect: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as Prospect
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue lors de la création du prospect'
      };
    }
  }

  /**
   * Récupère un prospect par ID
   */
  static async getProspectById(id: string): Promise<ApiResponse<Prospect>> {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: `Erreur récupération prospect: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as Prospect
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Liste les prospects avec filtres et pagination
   */
  static async listProspects(filters: ProspectFilters = {}): Promise<ApiResponse<ProspectListResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        source,
        email_validity,
        enrichment_status,
        ai_status,
        emailing_status,
        search,
        min_score_priority,
        has_siren,
        has_sequences,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      const offset = (page - 1) * limit;

      // Si filtre sur séquences, on doit faire une sous-requête
      let query = supabase
        .from('prospects')
        .select('*', { count: 'exact' });

      // Application des filtres
      if (source) {
        query = query.eq('source', source);
      }
      if (email_validity) {
        query = query.eq('email_validity', email_validity);
      }
      if (enrichment_status) {
        query = query.eq('enrichment_status', enrichment_status);
      }
      if (ai_status) {
        query = query.eq('ai_status', ai_status);
      }
      if (emailing_status) {
        query = query.eq('emailing_status', emailing_status);
      }
      if (min_score_priority !== undefined) {
        query = query.gte('score_priority', min_score_priority);
      }
      if (has_siren === true) {
        query = query.not('siren', 'is', null);
      }
      // Note: Le filtre has_sequences sera géré après la requête principale
      // car Supabase ne supporte pas facilement les sous-requêtes dans .in()
      if (search) {
        query = query.or(`email.ilike.%${search}%,firstname.ilike.%${search}%,lastname.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      // Tri
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Pagination (sans limite si filtre séquences, on filtrera après)
      if (has_sequences === undefined) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: `Erreur récupération prospects: ${error.message}`
        };
      }

      let filteredData = (data || []) as Prospect[];
      let filteredCount = count || 0;

      // Filtrer par séquences si demandé
      if (has_sequences !== undefined) {
        if (has_sequences) {
          // Récupérer les IDs des prospects avec séquences programmées
          const { data: scheduledData } = await supabase
            .from('prospect_email_scheduled')
            .select('prospect_id')
            .in('status', ['scheduled', 'paused']);

          const prospectIdsWithSequences = new Set(
            (scheduledData || []).map((d: any) => d.prospect_id)
          );

          // Filtrer pour ne garder que ceux avec séquences
          filteredData = filteredData.filter((p: Prospect) => {
            return prospectIdsWithSequences.has(p.id);
          });
        } else {
          // Récupérer les IDs des prospects avec séquences programmées
          const { data: scheduledData } = await supabase
            .from('prospect_email_scheduled')
            .select('prospect_id')
            .in('status', ['scheduled', 'paused']);

          const prospectIdsWithSequences = new Set(
            (scheduledData || []).map((d: any) => d.prospect_id)
          );

          // Récupérer les IDs des prospects avec emails envoyés
          const { data: emailsData } = await supabase
            .from('prospects_emails')
            .select('prospect_id')
            .not('sent_at', 'is', null);

          const prospectIdsWithEmails = new Set(
            (emailsData || []).map((d: any) => d.prospect_id)
          );

          // Filtrer pour ne garder que ceux sans séquences ET sans emails envoyés
          filteredData = filteredData.filter((p: Prospect) => {
            const hasSeq = prospectIdsWithSequences.has(p.id);
            const hasEmails = prospectIdsWithEmails.has(p.id);
            return !hasSeq && !hasEmails;
          });
        }

        filteredCount = filteredData.length;

        // Appliquer la pagination après filtrage
        filteredData = filteredData.slice(offset, offset + limit);
      }

      return {
        success: true,
        data: {
          data: filteredData,
          total: filteredCount,
          page,
          limit,
          total_pages: Math.ceil(filteredCount / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Met à jour un prospect
   */
  static async updateProspect(id: string, input: UpdateProspectInput): Promise<ApiResponse<Prospect>> {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Erreur mise à jour prospect: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as Prospect
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Supprime un prospect
   */
  static async deleteProspect(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `Erreur suppression prospect: ${error.message}`
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  // ===== VUES UTILITAIRES =====

  /**
   * Récupère les prospects en attente d'enrichissement
   */
  static async getPendingEnrichment(): Promise<ApiResponse<Prospect[]>> {
    try {
      const { data, error } = await supabase
        .from('prospects_pending_enrichment')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Erreur récupération: ${error.message}`
        };
      }

      return {
        success: true,
        data: (data || []) as Prospect[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les prospects en attente de traitement IA
   */
  static async getPendingAI(): Promise<ApiResponse<Prospect[]>> {
    try {
      const { data, error } = await supabase
        .from('prospects_pending_ai')
        .select('*')
        .order('score_priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Erreur récupération: ${error.message}`
        };
      }

      return {
        success: true,
        data: (data || []) as Prospect[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les prospects prêts pour l'emailing
   */
  static async getReadyForEmailing(): Promise<ApiResponse<Prospect[]>> {
    try {
      const { data, error } = await supabase
        .from('prospects_ready_for_emailing')
        .select('*')
        .order('score_priority', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Erreur récupération: ${error.message}`
        };
      }

      return {
        success: true,
        data: (data || []) as Prospect[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les statistiques de prospection
   */
  static async getStats(): Promise<ApiResponse<ProspectStats>> {
    try {
      const { data, error } = await supabase
        .from('prospects_stats')
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: `Erreur récupération stats: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as ProspectStats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  // ===== GESTION EMAILS =====

  /**
   * Crée un email pour un prospect
   */
  static async createProspectEmail(input: CreateProspectEmailInput): Promise<ApiResponse<ProspectEmail>> {
    try {
      const { data, error } = await supabase
        .from('prospects_emails')
        .insert(input)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Erreur création email: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as ProspectEmail
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les emails d'un prospect
   */
  static async getProspectEmails(prospectId: string): Promise<ApiResponse<ProspectEmail[]>> {
    try {
      const { data, error } = await supabase
        .from('prospects_emails')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('step', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Erreur récupération emails: ${error.message}`
        };
      }

      return {
        success: true,
        data: (data || []) as ProspectEmail[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Met à jour un email de prospect
   */
  static async updateProspectEmail(id: string, input: UpdateProspectEmailInput): Promise<ApiResponse<ProspectEmail>> {
    try {
      const { data, error } = await supabase
        .from('prospects_emails')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Erreur mise à jour email: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as ProspectEmail
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  // ===== ACTIONS BULK =====

  /**
   * Crée plusieurs prospects en une seule requête
   */
  static async createBulkProspects(inputs: CreateProspectInput[]): Promise<ApiResponse<{ created: number; errors: string[] }>> {
    try {
      const prospectsData = inputs.map(input => ({
        email: input.email,
        source: input.source,
        email_validity: input.email_validity || null,
        firstname: input.firstname || null,
        lastname: input.lastname || null,
        company_name: input.company_name || null,
        siren: input.siren || null,
        enrichment_status: 'pending' as EnrichmentStatus,
        ai_status: 'pending' as AIStatus,
        emailing_status: 'pending' as EmailingStatus,
        score_priority: 0,
        metadata: input.metadata || {}
      }));

      const { data, error } = await supabase
        .from('prospects')
        .insert(prospectsData)
        .select();

      if (error) {
        return {
          success: false,
          error: `Erreur création bulk: ${error.message}`
        };
      }

      return {
        success: true,
        data: {
          created: data?.length || 0,
          errors: []
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Met à jour le statut d'enrichissement
   */
  static async updateEnrichmentStatus(id: string, status: EnrichmentStatus): Promise<ApiResponse<Prospect>> {
    return this.updateProspect(id, { enrichment_status: status });
  }

  /**
   * Met à jour le statut IA
   */
  static async updateAIStatus(id: string, status: AIStatus, aiData?: {
    ai_summary?: string;
    ai_trigger_points?: string;
    ai_product_match?: Record<string, any>;
    ai_email_personalized?: string;
    score_priority?: number;
  }): Promise<ApiResponse<Prospect>> {
    return this.updateProspect(id, {
      ai_status: status,
      ...aiData
    });
  }

  /**
   * Met à jour le statut d'emailing
   */
  static async updateEmailingStatus(id: string, status: EmailingStatus): Promise<ApiResponse<Prospect>> {
    return this.updateProspect(id, { emailing_status: status });
  }

  // ===== SÉQUENCES D'EMAILS =====

  /**
   * Crée une séquence d'emails (template)
   */
  static async createEmailSequence(input: {
    name: string;
    description?: string;
    steps: Array<{
      step_number: number;
      delay_days: number;
      subject: string;
      body: string;
    }>;
  }): Promise<ApiResponse<{ sequence_id: string }>> {
    try {
      // Créer la séquence
      const { data: sequence, error: seqError } = await supabase
        .from('prospect_email_sequences')
        .insert({
          name: input.name,
          description: input.description || null,
          is_active: true
        })
        .select()
        .single();

      if (seqError) {
        return {
          success: false,
          error: `Erreur création séquence: ${seqError.message}`
        };
      }

      // Créer les étapes
      const stepsData = input.steps.map(step => ({
        sequence_id: sequence.id,
        step_number: step.step_number,
        delay_days: step.delay_days,
        subject: step.subject,
        body: step.body,
        is_active: true
      }));

      const { error: stepsError } = await supabase
        .from('prospect_email_sequence_steps')
        .insert(stepsData);

      if (stepsError) {
        // Nettoyer la séquence en cas d'erreur
        await supabase.from('prospect_email_sequences').delete().eq('id', sequence.id);
        return {
          success: false,
          error: `Erreur création étapes: ${stepsError.message}`
        };
      }

      return {
        success: true,
        data: { sequence_id: sequence.id }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Programme une séquence pour un prospect
   */
  static async scheduleSequenceForProspect(
    prospectId: string,
    sequenceId: string,
    startDate?: string
  ): Promise<ApiResponse<{ scheduled_count: number }>> {
    try {
      // Récupérer la séquence et ses étapes
      const { data: sequence, error: seqError } = await supabase
        .from('prospect_email_sequences')
        .select('*, prospect_email_sequence_steps(*)')
        .eq('id', sequenceId)
        .eq('is_active', true)
        .single();

      if (seqError || !sequence) {
        return {
          success: false,
          error: `Séquence non trouvée: ${seqError?.message}`
        };
      }

      const steps = sequence.prospect_email_sequence_steps || [];
      if (steps.length === 0) {
        return {
          success: false,
          error: 'La séquence ne contient aucune étape'
        };
      }

      // Trier les étapes par step_number
      const sortedSteps = steps.sort((a: any, b: any) => a.step_number - b.step_number);

      // Calculer les dates d'envoi
      const start = startDate ? new Date(startDate) : new Date();
      const scheduledEmails = [];
      let currentDate = new Date(start);

      for (const step of sortedSteps) {
        if (step.step_number > 1) {
          // Ajouter le délai depuis l'étape précédente
          currentDate = new Date(currentDate.getTime() + (step.delay_days * 24 * 60 * 60 * 1000));
        }

        scheduledEmails.push({
          prospect_id: prospectId,
          sequence_id: sequenceId,
          step_number: step.step_number,
          subject: step.subject,
          body: step.body,
          scheduled_for: currentDate.toISOString(),
          status: 'scheduled'
        });
      }

      // Insérer tous les emails programmés
      const { data, error } = await supabase
        .from('prospect_email_scheduled')
        .insert(scheduledEmails)
        .select();

      if (error) {
        return {
          success: false,
          error: `Erreur programmation séquence: ${error.message}`
        };
      }

      return {
        success: true,
        data: { scheduled_count: data?.length || 0 }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les emails programmés pour un prospect
   */
  static async getScheduledEmails(prospectId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('prospect_email_scheduled')
        .select('*, prospect_email_sequences(name)')
        .eq('prospect_id', prospectId)
        .order('scheduled_for', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Erreur récupération: ${error.message}`
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère toutes les séquences disponibles avec le nombre de prospects qui les utilisent
   */
  static async getEmailSequences(): Promise<ApiResponse<any[]>> {
    try {
      const { data: sequences, error } = await supabase
        .from('prospect_email_sequences')
        .select('*, prospect_email_sequence_steps(*)')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Erreur récupération: ${error.message}`
        };
      }

      if (!sequences || sequences.length === 0) {
        return {
          success: true,
          data: []
        };
      }

      // Pour chaque séquence, compter le nombre de prospects qui l'utilisent
      const sequencesWithCounts = await Promise.all(
        sequences.map(async (sequence) => {
          // Compter les prospects uniques avec des emails programmés pour cette séquence
          const { data: scheduledData, error: countError } = await supabase
            .from('prospect_email_scheduled')
            .select('prospect_id')
            .eq('sequence_id', sequence.id)
            .in('status', ['scheduled', 'paused']);

          // Compter les prospects uniques
          const uniqueProspects = new Set(
            (scheduledData || []).map((item: any) => item.prospect_id)
          );

          return {
            ...sequence,
            prospects_count: countError ? 0 : uniqueProspects.size
          };
        })
      );

      return {
        success: true,
        data: sequencesWithCounts
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Met à jour une séquence d'emails
   */
  static async updateEmailSequence(
    sequenceId: string,
    input: {
      name: string;
      description?: string;
      steps: Array<{
        step_number: number;
        delay_days: number;
        subject: string;
        body: string;
      }>;
    }
  ): Promise<ApiResponse<{ sequence_id: string }>> {
    try {
      // Vérifier que la séquence existe
      const { data: existingSequence, error: fetchError } = await supabase
        .from('prospect_email_sequences')
        .select('id')
        .eq('id', sequenceId)
        .single();

      if (fetchError || !existingSequence) {
        return {
          success: false,
          error: `Séquence non trouvée: ${fetchError?.message}`
        };
      }

      // Mettre à jour la séquence
      const { error: updateError } = await supabase
        .from('prospect_email_sequences')
        .update({
          name: input.name,
          description: input.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sequenceId);

      if (updateError) {
        return {
          success: false,
          error: `Erreur mise à jour séquence: ${updateError.message}`
        };
      }

      // Supprimer les anciennes étapes
      const { error: deleteStepsError } = await supabase
        .from('prospect_email_sequence_steps')
        .delete()
        .eq('sequence_id', sequenceId);

      if (deleteStepsError) {
        return {
          success: false,
          error: `Erreur suppression étapes: ${deleteStepsError.message}`
        };
      }

      // Créer les nouvelles étapes
      const stepsData = input.steps.map(step => ({
        sequence_id: sequenceId,
        step_number: step.step_number,
        delay_days: step.delay_days,
        subject: step.subject,
        body: step.body,
        is_active: true
      }));

      const { error: stepsError } = await supabase
        .from('prospect_email_sequence_steps')
        .insert(stepsData);

      if (stepsError) {
        return {
          success: false,
          error: `Erreur création étapes: ${stepsError.message}`
        };
      }

      return {
        success: true,
        data: { sequence_id: sequenceId }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Supprime une séquence d'emails
   */
  static async deleteEmailSequence(sequenceId: string): Promise<ApiResponse<void>> {
    try {
      // Vérifier que la séquence existe
      const { data: existingSequence, error: fetchError } = await supabase
        .from('prospect_email_sequences')
        .select('id')
        .eq('id', sequenceId)
        .single();

      if (fetchError || !existingSequence) {
        return {
          success: false,
          error: `Séquence non trouvée: ${fetchError?.message}`
        };
      }

      // Désactiver la séquence (soft delete)
      const { error: deleteError } = await supabase
        .from('prospect_email_sequences')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sequenceId);

      if (deleteError) {
        return {
          success: false,
          error: `Erreur suppression: ${deleteError.message}`
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Annule un email programmé
   */
  static async cancelScheduledEmail(emailId: string, reason?: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('prospect_email_scheduled')
        .update({
          status: 'cancelled',
          cancelled_reason: reason || 'Annulé manuellement',
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);

      if (error) {
        return {
          success: false,
          error: `Erreur annulation: ${error.message}`
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Met à jour le délai d'un email programmé et recalcule les dates
   */
  static async updateScheduledEmailDelay(
    emailId: string, 
    delayDays: number
  ): Promise<ApiResponse<void>> {
    try {
      // Récupérer l'email programmé pour avoir le prospect_id
      const { data: scheduledEmail, error: fetchError } = await supabase
        .from('prospect_email_scheduled')
        .select('prospect_id')
        .eq('id', emailId)
        .single();

      if (fetchError || !scheduledEmail) {
        return {
          success: false,
          error: `Email programmé non trouvé: ${fetchError?.message}`
        };
      }

      // Mettre à jour le délai
      const { error: updateError } = await supabase
        .from('prospect_email_scheduled')
        .update({
          delay_days_override: delayDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);

      if (updateError) {
        return {
          success: false,
          error: `Erreur mise à jour: ${updateError.message}`
        };
      }

      // Recalculer les dates pour ce prospect
      const { error: recalcError } = await supabase.rpc(
        'recalculate_scheduled_emails_dates',
        { prospect_uuid: scheduledEmail.prospect_id }
      );

      if (recalcError) {
        console.error('Erreur recalcul dates:', recalcError);
        // Ne pas échouer si le recalcul échoue, le délai a été mis à jour
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Met à jour le sujet et/ou la date d'envoi d'un email programmé
   */
  static async updateScheduledEmail(
    emailId: string,
    updates: {
      subject?: string;
      scheduled_for?: string;
    }
  ): Promise<ApiResponse<void>> {
    try {
      if (!updates.subject && !updates.scheduled_for) {
        return {
          success: false,
          error: 'Au moins un champ (subject ou scheduled_for) doit être fourni'
        };
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.subject) {
        updateData.subject = updates.subject;
      }

      if (updates.scheduled_for) {
        // Valider le format de date
        const date = new Date(updates.scheduled_for);
        if (isNaN(date.getTime())) {
          return {
            success: false,
            error: 'Format de date invalide'
          };
        }
        updateData.scheduled_for = date.toISOString();
      }

      const { error: updateError } = await supabase
        .from('prospect_email_scheduled')
        .update(updateData)
        .eq('id', emailId)
        .eq('status', 'scheduled'); // Ne permettre la modification que si l'email n'est pas encore envoyé

      if (updateError) {
        return {
          success: false,
          error: `Erreur mise à jour: ${updateError.message}`
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Programme une séquence personnalisée pour un prospect
   */
  static async scheduleCustomSequenceForProspect(
    prospectId: string,
    email: string,
    scheduledEmails: Array<{
      step_number: number;
      subject: string;
      body: string;
      scheduled_for: string;
      status?: string;
    }>
  ): Promise<ApiResponse<{ scheduled_count: number }>> {
    try {
      // Vérifier que le prospect existe
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('id, email')
        .eq('id', prospectId)
        .single();

      if (prospectError || !prospect) {
        return {
          success: false,
          error: `Prospect non trouvé: ${prospectError?.message}`
        };
      }

      // Mettre à jour l'email du prospect si différent
      if (email !== prospect.email) {
        const { error: updateError } = await supabase
          .from('prospects')
          .update({ email })
          .eq('id', prospectId);

        if (updateError) {
          console.error('Erreur mise à jour email:', updateError);
        }
      }

      // Préparer les emails programmés
      const emailsToInsert = scheduledEmails.map(email => ({
        prospect_id: prospectId,
        step_number: email.step_number,
        subject: email.subject,
        body: email.body,
        scheduled_for: email.scheduled_for,
        status: email.status || 'scheduled'
      }));

      // Insérer tous les emails programmés
      const { data, error } = await supabase
        .from('prospect_email_scheduled')
        .insert(emailsToInsert)
        .select();

      if (error) {
        return {
          success: false,
          error: `Erreur programmation séquence: ${error.message}`
        };
      }

      return {
        success: true,
        data: { scheduled_count: data?.length || 0 }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les prospects avec des séquences programmées (en cours)
   */
  static async getProspectsWithScheduledSequences(filters: ProspectFilters = {}): Promise<ApiResponse<ProspectListResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      const offset = (page - 1) * limit;

      // Récupérer les IDs des prospects avec des séquences programmées en cours
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('prospect_email_scheduled')
        .select('prospect_id')
        .in('status', ['scheduled', 'paused']);

      if (scheduledError) {
        return {
          success: false,
          error: `Erreur récupération séquences programmées: ${scheduledError.message}`
        };
      }

      const prospectIdsWithScheduledSequences = new Set(
        (scheduledData || []).map((d: any) => d.prospect_id)
      );

      if (prospectIdsWithScheduledSequences.size === 0) {
        return {
          success: true,
          data: {
            data: [],
            total: 0,
            page,
            limit,
            total_pages: 0
          }
        };
      }

      // Récupérer les prospects correspondants
      let query = supabase
        .from('prospects')
        .select('*', { count: 'exact' })
        .in('id', Array.from(prospectIdsWithScheduledSequences));

      // Application des filtres de base
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.enrichment_status) {
        query = query.eq('enrichment_status', filters.enrichment_status);
      }
      if (filters.ai_status) {
        query = query.eq('ai_status', filters.ai_status);
      }
      if (filters.emailing_status) {
        query = query.eq('emailing_status', filters.emailing_status);
      }
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,lastname.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      // Tri
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: `Erreur récupération prospects: ${error.message}`
        };
      }

      return {
        success: true,
        data: {
          data: (data || []) as Prospect[],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Suspend ou reprend une séquence pour un prospect
   */
  static async pauseResumeSequence(prospectId: string, pause: boolean): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      // Récupérer tous les emails programmés non envoyés pour ce prospect
      const { data: scheduledEmails, error: fetchError } = await supabase
        .from('prospect_email_scheduled')
        .select('id')
        .eq('prospect_id', prospectId)
        .in('status', pause ? ['scheduled'] : ['paused']);

      if (fetchError) {
        return {
          success: false,
          error: `Erreur récupération emails: ${fetchError.message}`
        };
      }

      if (!scheduledEmails || scheduledEmails.length === 0) {
        return {
          success: true,
          data: { updated_count: 0 }
        };
      }

      // Mettre à jour le statut
      const newStatus = pause ? 'paused' : 'scheduled';
      const { error: updateError } = await supabase
        .from('prospect_email_scheduled')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', scheduledEmails.map(e => e.id));

      if (updateError) {
        return {
          success: false,
          error: `Erreur mise à jour: ${updateError.message}`
        };
      }

      return {
        success: true,
        data: { updated_count: scheduledEmails.length }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Relance une séquence terminée pour un prospect
   */
  static async restartSequence(
    prospectId: string,
    scheduledEmails: Array<{
      step_number: number;
      subject: string;
      body: string;
      scheduled_for: string;
      status?: string;
    }>
  ): Promise<ApiResponse<{ scheduled_count: number }>> {
    try {
      // Vérifier que le prospect existe
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('id, email')
        .eq('id', prospectId)
        .single();

      if (prospectError || !prospect) {
        return {
          success: false,
          error: `Prospect non trouvé: ${prospectError?.message}`
        };
      }

      // Préparer les emails programmés
      const emailsToInsert = scheduledEmails.map(email => ({
        prospect_id: prospectId,
        step_number: email.step_number,
        subject: email.subject,
        body: email.body,
        scheduled_for: email.scheduled_for,
        status: email.status || 'scheduled'
      }));

      // Insérer tous les emails programmés
      const { data, error } = await supabase
        .from('prospect_email_scheduled')
        .insert(emailsToInsert)
        .select();

      if (error) {
        return {
          success: false,
          error: `Erreur relance séquence: ${error.message}`
        };
      }

      return {
        success: true,
        data: { scheduled_count: data?.length || 0 }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les prospects avec des séquences terminées (dernier email envoyé)
   */
  static async getProspectsWithCompletedSequences(filters: ProspectFilters = {}): Promise<ApiResponse<ProspectListResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      const offset = (page - 1) * limit;

      // Récupérer tous les prospects avec des emails programmés
      const { data: allScheduledData, error: scheduledError } = await supabase
        .from('prospect_email_scheduled')
        .select('prospect_id, step_number, status, sequence_id')
        .order('step_number', { ascending: true });

      if (scheduledError) {
        return {
          success: false,
          error: `Erreur récupération séquences: ${scheduledError.message}`
        };
      }

      // Grouper par prospect_id pour trouver ceux qui ont terminé leur séquence
      const prospectsData = new Map<string, { maxStep: number; allSent: boolean; sequenceId: string | null }>();

      for (const scheduled of allScheduledData || []) {
        const prospectId = scheduled.prospect_id;
        const current = prospectsData.get(prospectId) || { maxStep: 0, allSent: true, sequenceId: scheduled.sequence_id };

        if (scheduled.step_number > current.maxStep) {
          current.maxStep = scheduled.step_number;
        }
        if (scheduled.status !== 'sent' && scheduled.status !== 'cancelled') {
          current.allSent = false;
        }
        if (scheduled.sequence_id) {
          current.sequenceId = scheduled.sequence_id;
        }

        prospectsData.set(prospectId, current);
      }

      // Filtrer pour ne garder que ceux qui ont terminé (tous les emails envoyés)
      const completedProspectIds: string[] = [];
      for (const [prospectId, data] of prospectsData.entries()) {
        if (data.allSent && data.maxStep > 0) {
          completedProspectIds.push(prospectId);
        }
      }

      if (completedProspectIds.length === 0) {
        return {
          success: true,
          data: {
            data: [],
            total: 0,
            page,
            limit,
            total_pages: 0
          }
        };
      }

      // Récupérer les prospects correspondants
      let query = supabase
        .from('prospects')
        .select('*', { count: 'exact' })
        .in('id', completedProspectIds);

      // Application des filtres de base
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.enrichment_status) {
        query = query.eq('enrichment_status', filters.enrichment_status);
      }
      if (filters.ai_status) {
        query = query.eq('ai_status', filters.ai_status);
      }
      if (filters.emailing_status) {
        query = query.eq('emailing_status', filters.emailing_status);
      }
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,lastname.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      // Tri
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: `Erreur récupération prospects: ${error.message}`
        };
      }

      return {
        success: true,
        data: {
          data: (data || []) as Prospect[],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
}
