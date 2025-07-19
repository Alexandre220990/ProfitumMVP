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
  documentRequestId?: string; // Ajouté pour compatibilité
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
        const produitNom = (produit.ProduitEligible as any)?.nom || 'Produit';
        await this.createDocumentRequest({
          clientId,
          category: DocumentCategory.CHARTE_PRODUIT,
          description: `Charte pour ${produitNom}`,
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
   * Créer une demande de document (utilise WorkflowStep existant)
   */
  async createDocumentRequest(request: DocumentRequest): Promise<string> {
    try {
      // Créer directement les étapes du workflow dans WorkflowStep
      const workflowSteps = this.createWorkflowStepsData(request.workflow, request.expertId);
      
      const stepIds: string[] = [];
      
      for (const step of workflowSteps) {
        const { data, error } = await supabase
          .from('WorkflowStep')
          .insert({
            workflow_type: request.category,
            description: request.description,
            assigned_to: step.assignedTo,
            assigned_to_id: step.assignedToId,
            required: step.required,
            deadline: request.deadline?.toISOString(),
            status: 'pending',
            client_id: request.clientId,
            expert_id: request.expertId,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) throw error;
        stepIds.push(data.id);
      }

      // Envoyer notification
      await this.sendNotification(request.clientId, 'document_request_created', {
        category: request.category,
        description: request.description
      });

      return stepIds[0]; // Retourner l'ID de la première étape
    } catch (error) {
      console.error('Erreur création demande document:', error);
      throw error;
    }
  }

  /**
   * Créer les données des étapes du workflow (pour WorkflowStep existant)
   */
  private createWorkflowStepsData(
    workflow: DocumentWorkflow, 
    expertId?: string
  ): Array<{assignedTo: UserRole; assignedToId?: string; required: boolean}> {
    const steps: Array<{assignedTo: UserRole; assignedToId?: string; required: boolean}> = [];

    switch (workflow) {
      case DocumentWorkflow.UPLOADED:
        steps.push({
          assignedTo: UserRole.CLIENT,
          required: true
        });
        break;

      case DocumentWorkflow.PROFITUM_REVIEW:
        steps.push(
          {
            assignedTo: UserRole.CLIENT,
            required: true
          },
          {
            assignedTo: UserRole.PROFITUM,
            required: true
          }
        );
        break;

      case DocumentWorkflow.EXPERT_REVIEW:
        steps.push(
          {
            assignedTo: UserRole.CLIENT,
            required: true
          },
          {
            assignedTo: UserRole.PROFITUM,
            required: true
          },
          {
            assignedTo: UserRole.EXPERT,
            assignedToId: expertId,
            required: true
          }
        );
        break;

      case DocumentWorkflow.FINAL_REPORT:
        steps.push(
          {
            assignedTo: UserRole.CLIENT,
            required: true
          },
          {
            assignedTo: UserRole.PROFITUM,
            required: true
          },
          {
            assignedTo: UserRole.EXPERT,
            assignedToId: expertId,
            required: true
          },
          {
            assignedTo: UserRole.EXPERT,
            assignedToId: expertId,
            required: true
          }
        );
        break;
    }

    return steps;
  }

  /**
   * Créer les étapes du workflow (ancienne méthode - gardée pour compatibilité)
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

      // 3. Lier le fichier à l'étape de workflow (pas de document_request_id dans DocumentFile)
      // On utilise le workflow_id dans WorkflowStep à la place

      // 4. Marquer l'étape comme complétée
      await this.completeWorkflowStep(requestId, DocumentWorkflow.UPLOADED, clientId);

      return { success: true, fileId: uploadResult.file_id };

    } catch (error) {
      console.error('Erreur upload avec workflow:', error);
      return { success: false, error: 'Erreur lors de l\'upload' };
    }
  }

  /**
   * Valider une étape du workflow
   */
  async completeWorkflowStep(
    workflowStepId: string, 
    workflow: DocumentWorkflow,
    userId: string,
    comments?: string
  ): Promise<boolean> {
    try {
      // Marquer l'étape comme complétée
      const { error } = await supabase
        .from('WorkflowStep')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          comments
        })
        .eq('id', workflowStepId);

      if (error) throw error;

      // Vérifier si toutes les étapes sont complétées
      await this.checkWorkflowCompletion(workflowStepId);

      // Envoyer notification
      await this.sendNotification(userId, 'workflow_step_completed', {
        workflow,
        workflowStepId
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
  private async checkWorkflowCompletion(workflowStepId: string): Promise<void> {
    // Récupérer l'étape pour obtenir le client_id et expert_id
    const { data: currentStep } = await supabase
      .from('WorkflowStep')
      .select('client_id, expert_id, workflow_type')
      .eq('id', workflowStepId)
      .single();

    if (!currentStep) return;

    // Vérifier toutes les étapes du même workflow pour ce client
    const { data: steps } = await supabase
      .from('WorkflowStep')
      .select('*')
      .eq('client_id', currentStep.client_id)
      .eq('workflow_type', currentStep.workflow_type);

    if (!steps) return;

    const allCompleted = steps.every(step => step.status === 'completed');

    if (allCompleted) {
      // Envoyer notification de complétion
      await this.sendNotification(currentStep.client_id, 'workflow_completed', {
        workflowType: currentStep.workflow_type
      });

      if (currentStep.expert_id) {
        await this.sendNotification(currentStep.expert_id, 'workflow_completed', {
          workflowType: currentStep.workflow_type
        });
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
  private mapCategoryToStorage(category: DocumentCategory): 'charte' | 'rapport' | 'audit' | 'simulation' | 'guide' | 'facture' | 'contrat' | 'certificat' | 'formulaire' | 'autre' {
    const mapping: { [key in DocumentCategory]: 'charte' | 'rapport' | 'audit' | 'simulation' | 'guide' | 'facture' | 'contrat' | 'certificat' | 'formulaire' | 'autre' } = {
      [DocumentCategory.CHARTE_PROFITUM]: 'charte',
      [DocumentCategory.CHARTE_PRODUIT]: 'charte',
      [DocumentCategory.FACTURE]: 'facture',
      [DocumentCategory.DOCUMENT_ADMINISTRATIF]: 'autre',
      [DocumentCategory.DOCUMENT_ELIGIBILITE]: 'autre',
      [DocumentCategory.RAPPORT_AUDIT]: 'rapport',
      [DocumentCategory.RAPPORT_SIMULATION]: 'rapport',
      [DocumentCategory.DOCUMENT_COMPTABLE]: 'autre',
      [DocumentCategory.DOCUMENT_FISCAL]: 'autre',
      [DocumentCategory.DOCUMENT_LEGAL]: 'contrat',
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