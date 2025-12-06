/**
 * Service pour vérifier l'état des documents et déterminer le type de notification à créer
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DocumentStatusResult {
  hasUploadedDocuments: boolean;
  pendingDocumentsCount: number;
  validatedDocumentsCount: number;
  allDocumentsValidated: boolean;
  daysWaitingDocuments: number | null;
  daysWaitingValidation: number | null;
  clientName: string;
  productName: string;
}

export class DocumentStatusChecker {
  /**
   * Vérifier l'état des documents pour un dossier
   */
  static async checkDocumentStatus(
    clientProduitId: string
  ): Promise<DocumentStatusResult | null> {
    try {
      // Récupérer les informations du dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          admin_eligibility_status,
          expert_validation_status,
          created_at,
          updated_at
        `)
        .eq('id', clientProduitId)
        .single();

      if (dossierError || !dossier) {
        console.error('❌ Erreur récupération dossier:', dossierError);
        return null;
      }

      // Récupérer les informations du client séparément
      let clientName = 'Client';
      if (dossier.clientId) {
        const { data: client, error: clientError } = await supabase
          .from('Client')
          .select('id, company_name, name')
          .eq('id', dossier.clientId)
          .single();
        
        if (!clientError && client) {
          clientName = client.company_name || client.name || 'Client';
        } else {
          console.warn('⚠️ Impossible de récupérer le client:', clientError);
        }
      }

      // Récupérer les informations du produit séparément
      let productName = 'Dossier';
      if (dossier.produitId) {
        const { data: produit, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('id, nom')
          .eq('id', dossier.produitId)
          .single();
        
        if (!produitError && produit) {
          productName = produit.nom || 'Dossier';
        } else {
          console.warn('⚠️ Impossible de récupérer le produit:', produitError);
        }
      }

      // Récupérer tous les documents du dossier
      const { data: documents, error: docsError } = await supabase
        .from('ClientProcessDocument')
        .select('id, validation_status, validated_by, validated_at, created_at, client_produit_id')
        .eq('client_produit_id', clientProduitId);

      if (docsError) {
        console.error('❌ Erreur récupération documents:', docsError);
        return null;
      }

      const allDocuments = documents || [];
      const hasUploadedDocuments = allDocuments.length > 0;
      
      // Compter les documents en attente de validation (non validés par admin ou expert)
      const pendingDocuments = allDocuments.filter((doc: any) => {
        const validationStatus = doc.validation_status;
        // Un document est en attente s'il n'est pas validé par l'admin ou l'expert
        return validationStatus !== 'validated' && validationStatus !== 'rejected';
      });

      // Compter les documents validés
      const validatedDocuments = allDocuments.filter((doc: any) => {
        return doc.validation_status === 'validated';
      });

      const pendingDocumentsCount = pendingDocuments.length;
      const validatedDocumentsCount = validatedDocuments.length;
      const allDocumentsValidated = hasUploadedDocuments && pendingDocumentsCount === 0 && validatedDocumentsCount > 0;

      // Calculer les jours d'attente
      const now = new Date();
      const dossierCreatedAt = new Date(dossier.created_at);
      const daysWaitingDocuments = hasUploadedDocuments 
        ? null 
        : Math.floor((now.getTime() - dossierCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculer les jours d'attente de validation (depuis le premier upload de document)
      let daysWaitingValidation: number | null = null;
      if (hasUploadedDocuments && pendingDocumentsCount > 0) {
        const firstDocumentDate = allDocuments
          .map((doc: any) => new Date(doc.created_at))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
        
        if (firstDocumentDate) {
          daysWaitingValidation = Math.floor((now.getTime() - firstDocumentDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        hasUploadedDocuments,
        pendingDocumentsCount,
        validatedDocumentsCount,
        allDocumentsValidated,
        daysWaitingDocuments,
        daysWaitingValidation,
        clientName,
        productName
      };
    } catch (error) {
      console.error('❌ Erreur checkDocumentStatus:', error);
      return null;
    }
  }

  /**
   * Déterminer le type de notification à créer selon l'état des documents
   */
  static async getNotificationTypeForDossier(
    clientProduitId: string
  ): Promise<{
    notificationType: 'waiting_documents' | 'documents_to_validate' | 'dossier_complete';
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
    metadata: any;
  } | null> {
    const status = await this.checkDocumentStatus(clientProduitId);
    
    if (!status) {
      return null;
    }

    // Cas 1 : Aucun document uploadé
    if (!status.hasUploadedDocuments) {
      const days = status.daysWaitingDocuments || 0;
      return {
        notificationType: 'waiting_documents',
        title: `📋 En attente de documents - ${status.productName}`,
        message: `Dossier ${status.productName} - Client ${status.clientName} - Depuis ${days} jour${days > 1 ? 's' : ''}`,
        priority: days >= 5 ? 'high' : days >= 2 ? 'medium' : 'normal',
        metadata: {
          client_produit_id: clientProduitId,
          client_name: status.clientName,
          product_name: status.productName,
          days_waiting: days,
          status: 'waiting_documents'
        }
      };
    }

    // Cas 2 : Documents uploadés mais pas tous validés
    if (status.pendingDocumentsCount > 0) {
      // Vérifier que les documents ne sont pas déjà validés par l'admin ou l'expert
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select('admin_eligibility_status, expert_validation_status')
        .eq('id', clientProduitId)
        .single();

      const isAdminValidated = dossier?.admin_eligibility_status === 'validated';
      const isExpertValidated = dossier?.expert_validation_status === 'validated';

      // Si déjà validé par admin ou expert, ne pas créer de notification
      if (isAdminValidated || isExpertValidated) {
        return null;
      }

      const days = status.daysWaitingValidation || 0;
      return {
        notificationType: 'documents_to_validate',
        title: `📋 Documents à valider - ${status.productName}`,
        message: `Dossier ${status.productName} - Client ${status.clientName} - ${status.pendingDocumentsCount} document${status.pendingDocumentsCount > 1 ? 's' : ''} en attente depuis ${days} jour${days > 1 ? 's' : ''}`,
        priority: days >= 5 ? 'urgent' : days >= 2 ? 'high' : 'medium',
        metadata: {
          client_produit_id: clientProduitId,
          client_name: status.clientName,
          product_name: status.productName,
          pending_documents_count: status.pendingDocumentsCount,
          days_waiting: days,
          status: 'documents_to_validate'
        }
      };
    }

    // Cas 3 : Tous les documents sont validés
    if (status.allDocumentsValidated) {
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select('admin_eligibility_status, statut')
        .eq('id', clientProduitId)
        .single();

      // Vérifier que l'admin a bien validé l'éligibilité
      if (dossier?.admin_eligibility_status === 'validated') {
        return {
          notificationType: 'dossier_complete',
          title: `✅ Dossier de pré-éligibilité complet - ${status.productName}`,
          message: `Client ${status.clientName} - Dossier de pré-éligibilité complet - Aider le client à trouver le bon expert`,
          priority: 'medium',
          metadata: {
            client_produit_id: clientProduitId,
            client_name: status.clientName,
            product_name: status.productName,
            status: 'dossier_complete',
            action_required: 'select_expert'
          }
        };
      }
    }

    return null;
  }
}
