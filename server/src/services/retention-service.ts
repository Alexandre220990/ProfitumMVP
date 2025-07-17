import { createClient } from '@supabase/supabase-js';
import { SensitiveDocumentType } from './encryption-service';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types de rétention
export enum RetentionPolicy {
  IMMEDIATE = 'immediate',           // Suppression immédiate
  ONE_YEAR = '1_year',              // 1 an
  FIVE_YEARS = '5_years',           // 5 ans
  TEN_YEARS = '10_years',           // 10 ans
  THIRTY_YEARS = '30_years',        // 30 ans
  PERMANENT = 'permanent'           // Conservation permanente
}

export enum RetentionReason {
  LEGAL_REQUIREMENT = 'legal_requirement',
  BUSINESS_NEED = 'business_need',
  CONSENT = 'consent',
  CONTRACT = 'contract',
  VITAL_INTEREST = 'vital_interest',
  PUBLIC_INTEREST = 'public_interest'
}

export interface RetentionRule {
  id: string;
  documentType: string;
  sensitiveType: SensitiveDocumentType;
  retentionPeriod: number; // en années
  retentionPolicy: RetentionPolicy;
  retentionReason: RetentionReason;
  legalBasis: string[];
  autoArchive: boolean;
  autoDelete: boolean;
  archiveAfter: number; // en mois
  deleteAfter: number; // en années
  exceptions: string[];
  created_at: string;
  updated_at: string;
}

export interface RetentionAudit {
  id: string;
  document_id: string;
  action: 'archive' | 'delete' | 'extend' | 'exempt';
  reason: string;
  performed_by: string;
  performed_at: string;
  metadata: any;
}

export class RetentionService {
  // Règles de rétention par défaut selon la législation française
  private defaultRetentionRules: RetentionRule[] = [
    {
      id: 'fiscal_documents',
      documentType: 'document_fiscal',
      sensitiveType: SensitiveDocumentType.FISCAL,
      retentionPeriod: 10,
      retentionPolicy: RetentionPolicy.TEN_YEARS,
      retentionReason: RetentionReason.LEGAL_REQUIREMENT,
      legalBasis: ['Code général des impôts', 'Article L102B du CGI'],
      autoArchive: true,
      autoDelete: false, // Suppression manuelle après vérification
      archiveAfter: 12, // 1 an
      deleteAfter: 10, // 10 ans
      exceptions: ['litige_en_cours', 'controle_fiscal'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'comptable_documents',
      documentType: 'document_comptable',
      sensitiveType: SensitiveDocumentType.COMPTABLE,
      retentionPeriod: 10,
      retentionPolicy: RetentionPolicy.TEN_YEARS,
      retentionReason: RetentionReason.LEGAL_REQUIREMENT,
      legalBasis: ['Code de commerce', 'Article L123-22'],
      autoArchive: true,
      autoDelete: false,
      archiveAfter: 12,
      deleteAfter: 10,
      exceptions: ['litige_en_cours', 'audit_en_cours'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'juridique_documents',
      documentType: 'document_juridique',
      sensitiveType: SensitiveDocumentType.JURIDIQUE,
      retentionPeriod: 30,
      retentionPolicy: RetentionPolicy.THIRTY_YEARS,
      retentionReason: RetentionReason.LEGAL_REQUIREMENT,
      legalBasis: ['Code civil', 'Article 2224'],
      autoArchive: true,
      autoDelete: false,
      archiveAfter: 24, // 2 ans
      deleteAfter: 30,
      exceptions: ['litige_en_cours', 'contrat_actif'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rh_documents',
      documentType: 'document_rh',
      sensitiveType: SensitiveDocumentType.RH,
      retentionPeriod: 5,
      retentionPolicy: RetentionPolicy.FIVE_YEARS,
      retentionReason: RetentionReason.LEGAL_REQUIREMENT,
      legalBasis: ['Code du travail', 'Article L3243-2'],
      autoArchive: true,
      autoDelete: true,
      archiveAfter: 6, // 6 mois
      deleteAfter: 5,
      exceptions: ['litige_prud_hommes', 'enquete_en_cours'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'bancaire_documents',
      documentType: 'document_bancaire',
      sensitiveType: SensitiveDocumentType.BANCAIRE,
      retentionPeriod: 5,
      retentionPolicy: RetentionPolicy.FIVE_YEARS,
      retentionReason: RetentionReason.LEGAL_REQUIREMENT,
      legalBasis: ['Code monétaire et financier', 'Article L561-12'],
      autoArchive: true,
      autoDelete: true,
      archiveAfter: 12,
      deleteAfter: 5,
      exceptions: ['litige_bancaire', 'enquete_en_cours'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'assurance_documents',
      documentType: 'document_assurance',
      sensitiveType: SensitiveDocumentType.ASSURANCE,
      retentionPeriod: 10,
      retentionPolicy: RetentionPolicy.TEN_YEARS,
      retentionReason: RetentionReason.LEGAL_REQUIREMENT,
      legalBasis: ['Code des assurances', 'Article L112-2'],
      autoArchive: true,
      autoDelete: false,
      archiveAfter: 12,
      deleteAfter: 10,
      exceptions: ['sinistre_en_cours', 'police_active'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  constructor() {
    this.initializeRetentionRules();
  }

  /**
   * Initialiser les règles de rétention
   */
  private async initializeRetentionRules(): Promise<void> {
    try {
      for (const rule of this.defaultRetentionRules) {
        const { error } = await supabase
          .from('RetentionRules')
          .upsert(rule, { onConflict: 'id' });
        
        if (error) {
          console.error('Erreur initialisation règle rétention:', error);
        }
      }
    } catch (error) {
      console.error('Erreur initialisation règles rétention:', error);
    }
  }

  /**
   * Appliquer la rétention à un document
   */
  async applyRetentionPolicy(
    documentId: string,
    documentType: string,
    sensitiveType: SensitiveDocumentType
  ): Promise<void> {
    try {
      // Obtenir la règle de rétention
      const rule = await this.getRetentionRule(documentType, sensitiveType);
      if (!rule) {
        console.warn(`Aucune règle de rétention trouvée pour ${documentType}`);
        return;
      }

      // Calculer les dates
      const now = new Date();
      const archiveDate = new Date();
      archiveDate.setMonth(archiveDate.getMonth() + rule.archiveAfter);
      
      const deleteDate = new Date();
      deleteDate.setFullYear(deleteDate.getFullYear() + rule.deleteAfter);

      // Mettre à jour le document
      await supabase
        .from('DocumentFile')
        .update({
          retention_rule_id: rule.id,
          archive_date: archiveDate.toISOString(),
          delete_date: deleteDate.toISOString(),
          retention_policy: rule.retentionPolicy,
          retention_reason: rule.retentionReason,
          updated_at: now.toISOString()
        })
        .eq('id', documentId);

      // Logger l'application de la rétention
      await this.logRetentionAction(documentId, 'apply', {
        rule_id: rule.id,
        archive_date: archiveDate.toISOString(),
        delete_date: deleteDate.toISOString(),
        retention_policy: rule.retentionPolicy
      });

    } catch (error) {
      console.error('Erreur application rétention:', error);
      throw error;
    }
  }

  /**
   * Obtenir la règle de rétention
   */
  private async getRetentionRule(
    documentType: string,
    sensitiveType: SensitiveDocumentType
  ): Promise<RetentionRule | null> {
    const { data, error } = await supabase
      .from('RetentionRules')
      .select('*')
      .eq('document_type', documentType)
      .eq('sensitive_type', sensitiveType)
      .single();

    if (error) {
      console.error('Erreur récupération règle rétention:', error);
      return null;
    }

    return data;
  }

  /**
   * Archivage automatique des documents
   */
  async autoArchiveDocuments(): Promise<void> {
    try {
      const now = new Date();
      
      // Trouver les documents à archiver
      const { data: documentsToArchive, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .lt('archive_date', now.toISOString())
        .eq('archived', false)
        .not('retention_rule_id', 'is', null);

      if (error) {
        console.error('Erreur recherche documents à archiver:', error);
        return;
      }

      for (const document of documentsToArchive || []) {
        await this.archiveDocument(document.id);
      }

      console.log(`${documentsToArchive?.length || 0} documents archivés automatiquement`);

    } catch (error) {
      console.error('Erreur archivage automatique:', error);
    }
  }

  /**
   * Suppression automatique des documents
   */
  async autoDeleteDocuments(): Promise<void> {
    try {
      const now = new Date();
      
      // Trouver les documents à supprimer
      const { data: documentsToDelete, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .lt('delete_date', now.toISOString())
        .eq('archived', true)
        .not('retention_rule_id', 'is', null);

      if (error) {
        console.error('Erreur recherche documents à supprimer:', error);
        return;
      }

      for (const document of documentsToDelete || []) {
        await this.deleteDocument(document.id);
      }

      console.log(`${documentsToDelete?.length || 0} documents supprimés automatiquement`);

    } catch (error) {
      console.error('Erreur suppression automatique:', error);
    }
  }

  /**
   * Archiver un document
   */
  async archiveDocument(documentId: string): Promise<void> {
    try {
      // Marquer comme archivé
      await supabase
        .from('DocumentFile')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      // Déplacer vers le stockage d'archivage
      await this.moveToArchiveStorage(documentId);

      // Logger l'action
      await this.logRetentionAction(documentId, 'archive', {
        archived_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur archivage document:', error);
      throw error;
    }
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Vérifier les exceptions
      const { data: document } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document && await this.hasRetentionException(document)) {
        console.log(`Document ${documentId} a une exception de rétention, suppression annulée`);
        return;
      }

      // Supprimer physiquement le fichier
      await this.deletePhysicalFile(documentId);

      // Supprimer de la base de données
      await supabase
        .from('DocumentFile')
        .delete()
        .eq('id', documentId);

      // Logger l'action
      await this.logRetentionAction(documentId, 'delete', {
        deleted_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur suppression document:', error);
      throw error;
    }
  }

  /**
   * Vérifier les exceptions de rétention
   */
  private async hasRetentionException(document: any): Promise<boolean> {
    // Vérifier les litiges en cours
    const { data: litiges } = await supabase
      .from('Litige')
      .select('*')
      .eq('client_id', document.client_id)
      .eq('status', 'en_cours');

    if (litiges && litiges.length > 0) {
      return true;
    }

    // Vérifier les contrôles fiscaux
    const { data: controles } = await supabase
      .from('ControleFiscal')
      .select('*')
      .eq('client_id', document.client_id)
      .eq('status', 'en_cours');

    if (controles && controles.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Déplacer vers le stockage d'archivage
   */
  private async moveToArchiveStorage(documentId: string): Promise<void> {
    // Logique de déplacement vers le stockage d'archivage
    // À implémenter selon l'infrastructure de stockage
  }

  /**
   * Supprimer le fichier physique
   */
  private async deletePhysicalFile(documentId: string): Promise<void> {
    // Logique de suppression physique du fichier
    // À implémenter selon l'infrastructure de stockage
  }

  /**
   * Logger les actions de rétention
   */
  private async logRetentionAction(
    documentId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    await supabase
      .from('RetentionAudit')
      .insert({
        document_id: documentId,
        action,
        reason: 'automatic_retention',
        performed_by: 'system',
        performed_at: new Date().toISOString(),
        metadata
      });
  }

  /**
   * Obtenir le rapport de rétention
   */
  async getRetentionReport(): Promise<any> {
    try {
      const { data: documents, error } = await supabase
        .from('DocumentFile')
        .select(`
          *,
          RetentionRules(*)
        `)
        .not('retention_rule_id', 'is', null);

      if (error) {
        console.error('Erreur récupération rapport rétention:', error);
        return null;
      }

      const report = {
        total: documents?.length || 0,
        byPolicy: {} as any,
        byStatus: {
          active: 0,
          archived: 0,
          toArchive: 0,
          toDelete: 0
        },
        upcomingActions: [] as any[]
      };

      const now = new Date();

      for (const doc of documents || []) {
        // Compter par politique
        const policy = doc.RetentionRules?.retention_policy;
        report.byPolicy[policy] = (report.byPolicy[policy] || 0) + 1;

        // Compter par statut
        if (doc.archived) {
          report.byStatus.archived++;
        } else {
          report.byStatus.active++;
        }

        // Vérifier les actions à venir
        if (doc.archive_date && new Date(doc.archive_date) <= now) {
          report.byStatus.toArchive++;
          report.upcomingActions.push({
            document_id: doc.id,
            action: 'archive',
            date: doc.archive_date
          });
        }

        if (doc.delete_date && new Date(doc.delete_date) <= now) {
          report.byStatus.toDelete++;
          report.upcomingActions.push({
            document_id: doc.id,
            action: 'delete',
            date: doc.delete_date
          });
        }
      }

      return report;

    } catch (error) {
      console.error('Erreur génération rapport rétention:', error);
      return null;
    }
  }

  /**
   * Étendre la rétention d'un document
   */
  async extendRetention(
    documentId: string,
    newRetentionDate: Date,
    reason: string,
    userId: string
  ): Promise<void> {
    try {
      await supabase
        .from('DocumentFile')
        .update({
          delete_date: newRetentionDate.toISOString(),
          retention_extended: true,
          retention_extension_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      await this.logRetentionAction(documentId, 'extend', {
        new_date: newRetentionDate.toISOString(),
        reason,
        extended_by: userId
      });

    } catch (error) {
      console.error('Erreur extension rétention:', error);
      throw error;
    }
  }
}

export default RetentionService; 