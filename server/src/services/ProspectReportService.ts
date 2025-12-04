/**
 * Service de gestion des rapports prospects
 * Permet de créer, modifier, enrichir et versionner les rapports
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ProspectReport,
  ProspectReportHistory,
  CreateReportInput,
  UpdateReportInput,
  EnrichReportInput,
  ReportEnrichmentResult,
  ReportAttachment,
  ApiResponse
} from '../types/prospects';
import { AIEnrichmentService } from './AIEnrichmentService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ProspectReportService {
  
  // ===== CRUD REPORTS =====
  
  /**
   * Récupérer le rapport d'un prospect
   */
  static async getReport(prospectId: string): Promise<ApiResponse<ProspectReport>> {
    try {
      const { data, error } = await supabase
        .from('prospect_reports')
        .select('*')
        .eq('prospect_id', prospectId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = pas de résultat
        console.error('Erreur récupération rapport:', error);
        return {
          success: false,
          error: `Erreur récupération rapport: ${error.message}`
        };
      }

      // Pas de rapport trouvé = pas d'erreur
      if (!data) {
        return {
          success: true,
          data: undefined
        };
      }

      return {
        success: true,
        data: data as ProspectReport
      };
    } catch (error: any) {
      console.error('Exception getReport:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Créer un nouveau rapport
   */
  static async createReport(
    input: CreateReportInput,
    userId: string
  ): Promise<ApiResponse<ProspectReport>> {
    try {
      const { data, error } = await supabase
        .from('prospect_reports')
        .insert({
          prospect_id: input.prospect_id,
          report_content: input.report_content,
          report_html: input.report_html || null,
          tags: input.tags || [],
          attachments: [],
          created_by: userId,
          last_modified_by: userId,
          version: 1
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création rapport:', error);
        return {
          success: false,
          error: `Erreur création rapport: ${error.message}`
        };
      }

      console.log(`✅ Rapport créé pour prospect ${input.prospect_id}`);

      return {
        success: true,
        data: data as ProspectReport
      };
    } catch (error: any) {
      console.error('Exception createReport:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Mettre à jour un rapport existant
   */
  static async updateReport(
    prospectId: string,
    input: UpdateReportInput,
    userId: string
  ): Promise<ApiResponse<ProspectReport>> {
    try {
      // Construire l'objet de mise à jour
      const updateData: any = {
        last_modified_by: userId,
        updated_at: new Date().toISOString()
      };

      if (input.report_content !== undefined) {
        updateData.report_content = input.report_content;
      }
      if (input.report_html !== undefined) {
        updateData.report_html = input.report_html;
      }
      if (input.tags !== undefined) {
        updateData.tags = input.tags;
      }
      if (input.attachments !== undefined) {
        updateData.attachments = input.attachments;
      }

      const { data, error } = await supabase
        .from('prospect_reports')
        .update(updateData)
        .eq('prospect_id', prospectId)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour rapport:', error);
        return {
          success: false,
          error: `Erreur mise à jour rapport: ${error.message}`
        };
      }

      console.log(`✅ Rapport mis à jour pour prospect ${prospectId}`);

      return {
        success: true,
        data: data as ProspectReport
      };
    } catch (error: any) {
      console.error('Exception updateReport:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Créer ou mettre à jour un rapport (upsert)
   */
  static async createOrUpdateReport(
    prospectId: string,
    input: CreateReportInput | UpdateReportInput,
    userId: string
  ): Promise<ApiResponse<ProspectReport>> {
    // Vérifier si un rapport existe
    const existing = await this.getReport(prospectId);
    
    if (existing.data) {
      // Mettre à jour
      return this.updateReport(prospectId, input as UpdateReportInput, userId);
    } else {
      // Créer
      return this.createReport(
        { ...input, prospect_id: prospectId } as CreateReportInput,
        userId
      );
    }
  }
  
  /**
   * Supprimer un rapport
   */
  static async deleteReport(prospectId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('prospect_reports')
        .delete()
        .eq('prospect_id', prospectId);

      if (error) {
        console.error('Erreur suppression rapport:', error);
        return {
          success: false,
          error: `Erreur suppression rapport: ${error.message}`
        };
      }

      console.log(`✅ Rapport supprimé pour prospect ${prospectId}`);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      console.error('Exception deleteReport:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  // ===== HISTORIQUE =====
  
  /**
   * Récupérer l'historique des versions
   */
  static async getReportHistory(
    prospectId: string
  ): Promise<ApiResponse<ProspectReportHistory[]>> {
    try {
      // Récupérer l'ID du rapport
      const { data: report } = await supabase
        .from('prospect_reports')
        .select('id')
        .eq('prospect_id', prospectId)
        .single();

      if (!report) {
        return {
          success: true,
          data: []
        };
      }

      const { data, error } = await supabase
        .from('prospect_report_history')
        .select('*')
        .eq('report_id', report.id)
        .order('version', { ascending: false });

      if (error) {
        console.error('Erreur récupération historique:', error);
        return {
          success: false,
          error: `Erreur récupération historique: ${error.message}`
        };
      }

      return {
        success: true,
        data: data as ProspectReportHistory[]
      };
    } catch (error: any) {
      console.error('Exception getReportHistory:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Restaurer une version précédente
   */
  static async restoreVersion(
    prospectId: string,
    version: number,
    userId: string
  ): Promise<ApiResponse<ProspectReport>> {
    try {
      // Récupérer le rapport et la version à restaurer
      const { data: report } = await supabase
        .from('prospect_reports')
        .select('id')
        .eq('prospect_id', prospectId)
        .single();

      if (!report) {
        return {
          success: false,
          error: 'Rapport non trouvé'
        };
      }

      const { data: historyEntry } = await supabase
        .from('prospect_report_history')
        .select('*')
        .eq('report_id', report.id)
        .eq('version', version)
        .single();

      if (!historyEntry) {
        return {
          success: false,
          error: `Version ${version} non trouvée`
        };
      }

      // Restaurer cette version
      return this.updateReport(
        prospectId,
        {
          report_content: historyEntry.report_content,
          report_html: historyEntry.report_html || undefined,
          tags: historyEntry.tags || undefined
        },
        userId
      );
    } catch (error: any) {
      console.error('Exception restoreVersion:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  // ===== PIÈCES JOINTES =====
  
  /**
   * Ajouter une pièce jointe
   */
  static async addAttachment(
    prospectId: string,
    file: any, // Express.Multer.File
    userId: string
  ): Promise<ApiResponse<ReportAttachment>> {
    try {
      // Upload vers Supabase Storage
      const fileName = `${prospectId}/${Date.now()}_${file.originalname}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prospect-attachments')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur upload fichier:', uploadError);
        return {
          success: false,
          error: `Erreur upload fichier: ${uploadError.message}`
        };
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('prospect-attachments')
        .getPublicUrl(fileName);

      const attachment: ReportAttachment = {
        name: file.originalname,
        url: urlData.publicUrl,
        size: file.size,
        type: file.mimetype,
        uploaded_at: new Date().toISOString()
      };

      // Ajouter à la liste des attachments du rapport
      const { data: report } = await supabase
        .from('prospect_reports')
        .select('attachments')
        .eq('prospect_id', prospectId)
        .single();

      if (!report) {
        return {
          success: false,
          error: 'Rapport non trouvé'
        };
      }

      const attachments = [...(report.attachments || []), attachment];

      await this.updateReport(prospectId, { attachments }, userId);

      console.log(`✅ Pièce jointe ajoutée pour prospect ${prospectId}`);

      return {
        success: true,
        data: attachment
      };
    } catch (error: any) {
      console.error('Exception addAttachment:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Supprimer une pièce jointe
   */
  static async removeAttachment(
    prospectId: string,
    attachmentUrl: string
  ): Promise<ApiResponse<void>> {
    try {
      const { data: report } = await supabase
        .from('prospect_reports')
        .select('attachments, last_modified_by')
        .eq('prospect_id', prospectId)
        .single();

      if (!report) {
        return {
          success: false,
          error: 'Rapport non trouvé'
        };
      }

      const attachments = (report.attachments || []).filter(
        (att: ReportAttachment) => att.url !== attachmentUrl
      );

      // Supprimer du storage
      // Extraire le path du fichier depuis l'URL
      const urlParts = attachmentUrl.split('/prospect-attachments/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('prospect-attachments')
          .remove([filePath]);
      }

      await this.updateReport(
        prospectId,
        { attachments },
        report.last_modified_by || 'system'
      );

      console.log(`✅ Pièce jointe supprimée pour prospect ${prospectId}`);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      console.error('Exception removeAttachment:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  // ===== ENRICHISSEMENT IA =====
  
  /**
   * Enrichir le rapport avec l'IA
   * - Reformule le contenu original
   * - Ajoute infos enrichissement prospect
   * - Génère plan d'action
   * - Analyse SWOT
   */
  static async enrichReport(input: EnrichReportInput): Promise<ApiResponse<ReportEnrichmentResult>> {
    try {
      // 1. Récupérer le rapport existant
      const reportResult = await this.getReport(input.prospect_id);
      
      if (!reportResult.success || !reportResult.data) {
        return {
          success: false,
          error: 'Aucun rapport trouvé pour ce prospect'
        };
      }

      const report = reportResult.data;

      // 2. Récupérer toutes les données du prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', input.prospect_id)
        .single();

      if (prospectError || !prospect) {
        return {
          success: false,
          error: 'Prospect non trouvé'
        };
      }

      // 3. Récupérer l'historique d'emails
      const { data: emails } = await supabase
        .from('prospects_emails')
        .select('*')
        .eq('prospect_id', input.prospect_id)
        .order('sent_at', { ascending: false });

      // 4. Récupérer les réponses
      const { data: replies } = await supabase
        .from('prospect_email_received')
        .select('*')
        .eq('prospect_id', input.prospect_id)
        .order('received_at', { ascending: false });

      // 5. Construire le contexte complet pour l'IA
      const context = {
        original_report: report.report_content,
        prospect_info: {
          name: `${prospect.firstname || ''} ${prospect.lastname || ''}`.trim() || prospect.email,
          company: prospect.company_name,
          email: prospect.email,
          phone: prospect.phone_direct,
          job_title: prospect.job_title,
          linkedin: prospect.linkedin_profile
        },
        enrichment: prospect.enrichment_data || {},
        email_history: (emails || []).map(e => ({
          sent_at: e.sent_at,
          subject: e.subject,
          opened: e.opened,
          clicked: e.clicked,
          replied: e.replied
        })),
        replies: (replies || []).map(r => ({
          received_at: r.received_at,
          subject: r.subject,
          snippet: r.snippet
        }))
      };

      console.log(`🤖 Enrichissement IA pour prospect ${input.prospect_id}...`);

      // 6. Appeler l'IA pour enrichissement
      const enrichmentResult = await AIEnrichmentService.enrichProspectReport(context);

      // 7. Sauvegarder le résultat enrichi
      const { error: updateError } = await supabase
        .from('prospect_reports')
        .update({
          enriched_content: enrichmentResult.enriched_content,
          enriched_html: enrichmentResult.enriched_html,
          action_plan: enrichmentResult.action_plan,
          enriched_at: new Date().toISOString(),
          enriched_by: input.user_id
        })
        .eq('prospect_id', input.prospect_id);

      if (updateError) {
        console.error('Erreur sauvegarde enrichissement:', updateError);
        return {
          success: false,
          error: `Erreur sauvegarde enrichissement: ${updateError.message}`
        };
      }

      console.log(`✅ Rapport enrichi pour prospect ${input.prospect_id}`);

      return {
        success: true,
        data: enrichmentResult
      };
    } catch (error: any) {
      console.error('Exception enrichReport:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
  
  // ===== STATS =====
  
  /**
   * Statistiques sur les rapports
   */
  static async getReportStats(): Promise<ApiResponse<{
    total_reports: number;
    reports_with_enrichment: number;
    avg_report_length: number;
    most_used_tags: Array<{tag: string; count: number}>;
  }>> {
    try {
      // Compter les rapports
      const { count: totalReports } = await supabase
        .from('prospect_reports')
        .select('*', { count: 'exact', head: true });

      // Compter les rapports enrichis
      const { count: enrichedReports } = await supabase
        .from('prospect_reports')
        .select('*', { count: 'exact', head: true })
        .not('enriched_content', 'is', null);

      // Récupérer les tags
      const { data: reports } = await supabase
        .from('prospect_reports')
        .select('tags, report_content');

      // Calculer moyenne longueur
      let totalLength = 0;
      const tagCounts: Record<string, number> = {};

      if (reports) {
        reports.forEach(report => {
          totalLength += report.report_content?.length || 0;
          
          if (report.tags) {
            report.tags.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
      }

      const avgLength = reports && reports.length > 0 
        ? Math.round(totalLength / reports.length)
        : 0;

      // Trier les tags
      const mostUsedTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        success: true,
        data: {
          total_reports: totalReports || 0,
          reports_with_enrichment: enrichedReports || 0,
          avg_report_length: avgLength,
          most_used_tags: mostUsedTags
        }
      };
    } catch (error: any) {
      console.error('Exception getReportStats:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
}

