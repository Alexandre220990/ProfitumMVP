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
      const prospectData = {
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
        // Récupérer les IDs des prospects avec séquences programmées
        const { data: scheduledData } = await supabase
          .from('prospect_email_scheduled')
          .select('prospect_id')
          .in('status', ['scheduled', 'paused']);

        const prospectIdsWithSequences = new Set(
          (scheduledData || []).map((d: any) => d.prospect_id)
        );

        // Filtrer les données
        filteredData = filteredData.filter((p: Prospect) => {
          const hasSeq = prospectIdsWithSequences.has(p.id);
          return has_sequences ? hasSeq : !hasSeq;
        });

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
   * Récupère toutes les séquences disponibles
   */
  static async getEmailSequences(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
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
}
