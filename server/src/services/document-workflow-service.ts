import { createClient } from '@supabase/supabase-js';
import { DocumentStorageService } from './document-storage-service';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types pour le workflow
export enum DocumentWorkflow {
  UPLOADED = 'uploaded',
  PROFITUM_REVIEW = 'profitum_review',
  ELIGIBILITY_CONFIRMED = 'eligibility_confirmed',
  EXPERT_ASSIGNED = 'expert_assigned',
  EXPERT_REVIEW = 'expert_review',
  FINAL_REPORT = 'final_report',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum DocumentCategory {
  CHARTE_PROFITUM = 'charte_profitum',
  CHARTE_PRODUIT = 'charte_produit',
  FACTURE = 'facture',
  DOCUMENT_ADMINISTRATIF = 'document_administratif',
  DOCUMENT_ELIGIBILITE = 'document_eligibilite',
  RAPPORT_AUDIT = 'rapport_audit',
  RAPPORT_SIMULATION = 'rapport_simulation',
  DOCUMENT_COMPTABLE = 'document_comptable',
  DOCUMENT_FISCAL = 'document_fiscal',
  DOCUMENT_LEGAL = 'document_legal',
  AUTRE = 'autre'
}

export enum UserRole {
  CLIENT = 'client',
  EXPERT = 'expert',
  ADMIN = 'admin',
  PROFITUM = 'profitum'
}

export interface WorkflowStep {
  id: string;
  documentId: string;
  workflow: DocumentWorkflow;
  assignedTo: UserRole;
  assignedToId?: string;
  required: boolean;
  deadline?: Date;
  completed: boolean;
  completedAt?: Date;
  comments?: string;
  metadata?: any;
}

export interface DocumentRequest {
  clientId: string;
  category: DocumentCategory;
  description: string;
  required: boolean;
  deadline?: Date;
  expertId?: string;
  workflow: DocumentWorkflow;
}

export class DocumentWorkflowService {
  private documentStorage: DocumentStorageService;

  constructor() {
    this.documentStorage = new DocumentStorageService();
  }

  // ===== WORKFLOW PRINCIPAL =====

  /**
   * Initialiser le workflow pour un nouveau client
   */
  async initializeClientWorkflow(clientId: string): Promise<boolean> {
    try {
      // 1. Créer la charte Profitum (CGV)
      await this.createDocumentRequest({
        clientId,
        category: DocumentCategory.CHARTE_PROFITUM,
        description: 'Charte d\'engagement Profitum (CGV)',
        required: true,
        workflow: DocumentWorkflow.UPLOADED
      });

      // 2. Créer les chartes pour chaque produit éligible
      const { data: produits } = await supabase
        .from('ClientProduitEligible')
        .select('produit_id, ProduitEligible(nom)')
        .eq('client_id', clientId)
        .eq('status', 'eligible');

      for (const produit of produits || []) {
        await this.createDocumentRequest({
          clientId,
          category: DocumentCategory.CHARTE_PRODUIT,
          description: `Charte pour ${produit.ProduitEligible.nom}`,
          required: true,
          workflow: DocumentWorkflow.UPLOADED
        });
      }

      // 3. Créer le rapport de simulation initial
      await this.createDocumentRequest({
        clientId,
        category: DocumentCategory.RAPPORT_SIMULATION,
        description: 'Rapport de simulation initial',
        required: true,
        workflow: DocumentWorkflow.PROFITUM_REVIEW
      });

      return true;
    } catch (error) {
      console.error('Erreur initialisation workflow client:', error);
      return false;
    }
  }

  /**
   * Créer une demande de document
   */
  async createDocumentRequest(request: DocumentRequest): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('DocumentRequest')
        .insert({
          client_id: request.clientId,
          category: request.category,
          description: request.description,
          required: request.required,
          deadline: request.deadline?.toISOString(),
          expert_id: request.expertId,
          workflow: request.workflow,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Créer les étapes du workflow
      await this.createWorkflowSteps(data.id, request.workflow, request.expertId);

      // Envoyer notification
      await this.sendNotification(request.clientId, 'document_request_created', {
        category: request.category,
        description: request.description
      });

      return data.id;
    } catch (error) {
      console.error('Erreur création demande document:', error);
      throw error;
    }
  }

  /**
   * Créer les étapes du workflow
   */
  private async createWorkflowSteps(
    documentRequestId: string, 
    workflow: DocumentWorkflow, 
    expertId?: string
  ): Promise<void> {
    const steps: Partial<WorkflowStep>[] = [];

    switch (workflow) {
      case DocumentWorkflow.UPLOADED:
        steps.push({
          documentRequestId,
          workflow: DocumentWorkflow.UPLOADED,
          assignedTo: UserRole.CLIENT,
          required: true
        });
        break;

      case DocumentWorkflow.PROFITUM_REVIEW:
        steps.push(
          {
            documentRequestId,
            workflow: DocumentWorkflow.UPLOADED,
            assignedTo: UserRole.CLIENT,
            required: true
          },
          {
            documentRequestId,
            workflow: DocumentWorkflow.PROFITUM_REVIEW,
            assignedTo: UserRole.PROFITUM,
            required: true
          }
        );
        break;

      case DocumentWorkflow.EXPERT_REVIEW:
        steps.push(
          {
            documentRequestId,
            workflow: DocumentWorkflow.UPLOADED,
            assignedTo: UserRole.CLIENT,
            required: true
          },
          {
            documentRequestId,
            workflow: DocumentWorkflow.PROFITUM_REVIEW,
            assignedTo: UserRole.PROFITUM,
            required: true
          },
          {
            documentRequestId,
            workflow: DocumentWorkflow.EXPERT_REVIEW,
            assignedTo: UserRole.EXPERT,
            assignedToId: expertId,
            required: true
          }
        );
        break;

      case DocumentWorkflow.FINAL_REPORT:
        steps.push(
          {
            documentRequestId,
            workflow: DocumentWorkflow.UPLOADED,
            assignedTo: UserRole.CLIENT,
            required: true
          },
          {
            documentRequestId,
            workflow: DocumentWorkflow.PROFITUM_REVIEW,
            assignedTo: UserRole.PROFITUM,
            required: true
          },
          {
            documentRequestId,
            workflow: DocumentWorkflow.EXPERT_REVIEW,
            assignedTo: UserRole.EXPERT,
            assignedToId: expertId,
            required: true
          },
          {
            documentRequestId,
            workflow: DocumentWorkflow.FINAL_REPORT,
            assignedTo: UserRole.EXPERT,
            assignedToId: expertId,
            required: true
          }
        );
        break;
    }

    // Insérer les étapes
    for (const step of steps) {
      await supabase
        .from('WorkflowStep')
        .insert({
          ...step,
          completed: false,
          created_at: new Date().toISOString()
        });
    }
  }

  // ===== GESTION DES DOCUMENTS =====

  /**
   * Upload de document avec workflow
   */
  async uploadDocumentWithWorkflow(
    file: File | Buffer,
    clientId: string,
    category: DocumentCategory,
    description: string,
    workflow: DocumentWorkflow,
    expertId?: string
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      // 1. Upload du fichier
      const uploadResult = await this.documentStorage.uploadFile({
        file,
        client_id: clientId,
        category: this.mapCategoryToStorage(category),
        description,
        uploaded_by: clientId // À adapter selon l'utilisateur connecté
      });

      if (!uploadResult.success) {
        return uploadResult;
      }

      // 2. Créer la demande de document
      const requestId = await this.createDocumentRequest({
        clientId,
        category,
        description,
        required: true,
        workflow,
        expertId
      });

      // 3. Lier le fichier à la demande
      await supabase
        .from('DocumentFile')
        .update({
          document_request_id: requestId
        })
        .eq('id', uploadResult.fileId);

      // 4. Marquer l'étape comme complétée
      await this.completeWorkflowStep(requestId, DocumentWorkflow.UPLOADED);

      return { success: true, fileId: uploadResult.fileId };

    } catch (error) {
      console.error('Erreur upload avec workflow:', error);
      return { success: false, error: 'Erreur lors de l\'upload' };
    }
  }

  /**
   * Valider une étape du workflow
   */
  async completeWorkflowStep(
    documentRequestId: string, 
    workflow: DocumentWorkflow,
    userId: string,
    comments?: string
  ): Promise<boolean> {
    try {
      // Marquer l'étape comme complétée
      const { error } = await supabase
        .from('WorkflowStep')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          comments
        })
        .eq('document_request_id', documentRequestId)
        .eq('workflow', workflow);

      if (error) throw error;

      // Vérifier si toutes les étapes sont complétées
      await this.checkWorkflowCompletion(documentRequestId);

      // Envoyer notification
      await this.sendNotification(userId, 'workflow_step_completed', {
        workflow,
        documentRequestId
      });

      return true;
    } catch (error) {
      console.error('Erreur complétion étape workflow:', error);
      return false;
    }
  }

  /**
   * Vérifier la complétion du workflow
   */
  private async checkWorkflowCompletion(documentRequestId: string): Promise<void> {
    const { data: steps } = await supabase
      .from('WorkflowStep')
      .select('*')
      .eq('document_request_id', documentRequestId);

    if (!steps) return;

    const allCompleted = steps.every(step => step.completed);

    if (allCompleted) {
      // Marquer la demande comme complétée
      await supabase
        .from('DocumentRequest')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', documentRequestId);

      // Envoyer notification de complétion
      const { data: request } = await supabase
        .from('DocumentRequest')
        .select('client_id, expert_id')
        .eq('id', documentRequestId)
        .single();

      if (request) {
        await this.sendNotification(request.client_id, 'workflow_completed', {
          documentRequestId
        });

        if (request.expert_id) {
          await this.sendNotification(request.expert_id, 'workflow_completed', {
            documentRequestId
          });
        }
      }
    }
  }

  // ===== NOTIFICATIONS =====

  /**
   * Envoyer une notification
   */
  private async sendNotification(
    userId: string, 
    type: string, 
    data: any
  ): Promise<void> {
    try {
      await supabase
        .from('notification')
        .insert({
          recipient_id: userId,
          type_notification: type,
          message: this.generateNotificationMessage(type, data),
          data: data,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  }

  /**
   * Générer le message de notification
   */
  private generateNotificationMessage(type: string, data: any): string {
    switch (type) {
      case 'document_request_created':
        return `Nouvelle demande de document : ${data.description}`;
      case 'workflow_step_completed':
        return `Étape du workflow complétée : ${data.workflow}`;
      case 'workflow_completed':
        return 'Workflow de document complété';
      default:
        return 'Nouvelle notification';
    }
  }

  // ===== UTILITAIRES =====

  /**
   * Mapper la catégorie vers le stockage
   */
  private mapCategoryToStorage(category: DocumentCategory): string {
    const mapping: { [key in DocumentCategory]: string } = {
      [DocumentCategory.CHARTE_PROFITUM]: 'charte',
      [DocumentCategory.CHARTE_PRODUIT]: 'charte',
      [DocumentCategory.FACTURE]: 'facture',
      [DocumentCategory.DOCUMENT_ADMINISTRATIF]: 'document_administratif',
      [DocumentCategory.DOCUMENT_ELIGIBILITE]: 'document_eligibilite',
      [DocumentCategory.RAPPORT_AUDIT]: 'rapport_audit',
      [DocumentCategory.RAPPORT_SIMULATION]: 'rapport_simulation',
      [DocumentCategory.DOCUMENT_COMPTABLE]: 'document_comptable',
      [DocumentCategory.DOCUMENT_FISCAL]: 'document_fiscal',
      [DocumentCategory.DOCUMENT_LEGAL]: 'document_legal',
      [DocumentCategory.AUTRE]: 'autre'
    };

    return mapping[category] || 'autre';
  }

  /**
   * Obtenir le workflow d'un client
   */
  async getClientWorkflow(clientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('DocumentRequest')
        .select(`
          *,
          WorkflowStep(*),
          DocumentFile(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération workflow client:', error);
      return [];
    }
  }

  /**
   * Obtenir les documents en attente
   */
  async getPendingDocuments(userId: string, userRole: UserRole): Promise<any[]> {
    try {
      let query = supabase
        .from('WorkflowStep')
        .select(`
          *,
          DocumentRequest(
            *,
            DocumentFile(*)
          )
        `)
        .eq('completed', false);

      if (userRole === UserRole.CLIENT) {
        query = query.eq('assigned_to', UserRole.CLIENT);
      } else if (userRole === UserRole.EXPERT) {
        query = query.eq('assigned_to', UserRole.EXPERT)
                    .eq('assigned_to_id', userId);
      } else if (userRole === UserRole.PROFITUM) {
        query = query.eq('assigned_to', UserRole.PROFITUM);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération documents en attente:', error);
      return [];
    }
  }
}

export default DocumentWorkflowService; 