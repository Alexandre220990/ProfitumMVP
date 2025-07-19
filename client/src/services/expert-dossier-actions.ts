import { supabase } from '@/lib/supabase';
// import { useToast } from '@/components/ui/toast-notifications';

export interface DossierActionParams {
  dossierId: string;
  stepId: number;
  action: string;
  data?: any;
}

export interface DocumentActionParams {
  dossierId: string;
  documentName: string;
  action: string;
  file?: File;
  metadata?: any;
}

export class ExpertDossierActions {
  private addToast: any;

  constructor(addToast: any) {
    this.addToast = addToast;
  }

  /**
   * Gère les actions d'étape du workflow
   */
  async handleStepAction(params: DossierActionParams): Promise<boolean> {
    const { dossierId, stepId, action, data } = params;

    try {
      switch (action) {
        case 'sign_charte':
          return await this.signCharte(dossierId, data);
          
        case 'select_expert':
          return await this.selectExpert(dossierId, data);
          
        case 'analyze_dossier':
          return await this.analyzeDossier(dossierId, data);
          
        case 'request_documents':
          return await this.requestDocuments(dossierId, data);
          
        case 'complete_dossier':
          return await this.completeDossier(dossierId, data);
          
        case 'contact_client':
          return await this.contactClient(dossierId, data);
          
        case 'schedule_meeting':
          return await this.scheduleMeeting(dossierId, data);
          
        case 'generate_report':
          return await this.generateReport(dossierId, data);
          
        case 'preview_report':
          return await this.previewReport(dossierId, data);
          
        case 'submit_to_admin':
          return await this.submitToAdmin(dossierId, data);
          
        case 'track_reimbursement':
          return await this.trackReimbursement(dossierId, data);
          
        case 'close_dossier':
          return await this.closeDossier(dossierId, data);
          
        default:
          this.addToast({
            type: 'error',
            title: 'Action non reconnue',
            message: `L'action "${action}" n'est pas implémentée`,
            duration: 5000
          });
          return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'action d\'étape:', error);
      this.addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de l\'exécution de l\'action',
        duration: 5000
      });
      return false;
    }
  }

  /**
   * Gère les actions sur les documents
   */
  async handleDocumentAction(params: DocumentActionParams): Promise<boolean> {
    const { dossierId, documentName, action, file, metadata } = params;

    try {
      switch (action) {
        case 'upload':
          return await this.uploadDocument(dossierId, documentName, file!, metadata);
          
        case 'view':
          return await this.viewDocument(dossierId, documentName);
          
        case 'download':
          return await this.downloadDocument(dossierId, documentName);
          
        case 'validate':
          return await this.validateDocument(dossierId, documentName, metadata);
          
        case 'reject':
          return await this.rejectDocument(dossierId, documentName, metadata);
          
        default:
          this.addToast({
            type: 'error',
            title: 'Action document non reconnue',
            message: `L'action "${action}" n'est pas implémentée`,
            duration: 5000
          });
          return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'action document:', error);
      this.addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de l\'action sur le document',
        duration: 5000
      });
      return false;
    }
  }

  // ============================================================================
  // ACTIONS D'ÉTAPES
  // ============================================================================

  /**
   * Signature de la charte
   */
  private async signCharte(dossierId: string, signatureData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          charte_signed: true,
          charte_signed_at: new Date().toISOString(),
          current_step: 2,
          progress: 20,
          updated_at: new Date().toISOString(),
          metadata: {
            signature_data: signatureData,
            signed_by: 'expert',
            signed_at: new Date().toISOString()
          }
        })
        .eq('id', dossierId);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Charte signée',
        message: 'La charte a été signée avec succès',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur signature charte:', error);
      return false;
    }
  }

  /**
   * Sélection d'un expert
   */
  private async selectExpert(dossierId: string, expertData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          expert_id: expertData.expertId,
          current_step: 3,
          progress: 30,
          updated_at: new Date().toISOString(),
          metadata: {
            expert_selection: expertData,
            selected_at: new Date().toISOString()
          }
        })
        .eq('id', dossierId);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Expert sélectionné',
        message: 'L\'expert a été assigné au dossier',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur sélection expert:', error);
      return false;
    }
  }

  /**
   * Analyse du dossier
   */
  private async analyzeDossier(dossierId: string, analysisData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: 4,
          progress: 50,
          updated_at: new Date().toISOString(),
          metadata: {
            analysis: analysisData,
            analyzed_at: new Date().toISOString()
          }
        })
        .eq('id', dossierId);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Analyse terminée',
        message: 'L\'analyse du dossier a été complétée',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur analyse dossier:', error);
      return false;
    }
  }

  /**
   * Demande de documents
   */
  private async requestDocuments(dossierId: string, documentRequest: any): Promise<boolean> {
    try {
      // Créer une demande de documents
      const { error } = await supabase
        .from('DocumentRequest')
        .insert({
          client_id: documentRequest.clientId,
          expert_id: documentRequest.expertId,
          category: 'document_eligibilite',
          description: `Demande de documents pour le dossier ${dossierId}`,
          workflow: 'expert_review',
          metadata: {
            requested_documents: documentRequest.documents,
            requested_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Demande envoyée',
        message: 'La demande de documents a été envoyée au client',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur demande documents:', error);
      return false;
    }
  }

  /**
   * Complétion du dossier
   */
  private async completeDossier(dossierId: string, completionData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: 5,
          progress: 70,
          updated_at: new Date().toISOString(),
          metadata: {
            completion: completionData,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', dossierId);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Dossier complété',
        message: 'Le dossier a été complété avec succès',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur complétion dossier:', error);
      return false;
    }
  }

  /**
   * Contact client
   */
  private async contactClient(dossierId: string, contactData: any): Promise<boolean> {
    try {
      // Créer un message dans la messagerie
      const { error } = await supabase
        .from('Message')
        .insert({
          sender_id: contactData.expertId,
          recipient_id: contactData.clientId,
          subject: `Contact concernant le dossier ${dossierId}`,
          content: contactData.message,
          dossier_id: dossierId,
          metadata: {
            contact_type: contactData.type,
            contact_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Message envoyé',
        message: 'Le message a été envoyé au client',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur contact client:', error);
      return false;
    }
  }

  /**
   * Planification de rendez-vous
   */
  private async scheduleMeeting(dossierId: string, meetingData: any): Promise<boolean> {
    try {
      // Créer un événement dans l'agenda
      const { error } = await supabase
        .from('AgendaEvent')
        .insert({
          title: `Rendez-vous dossier ${dossierId}`,
          description: meetingData.description,
          start_date: meetingData.startDate,
          end_date: meetingData.endDate,
          dossier_id: dossierId,
          expert_id: meetingData.expertId,
          client_id: meetingData.clientId,
          metadata: {
            meeting_type: meetingData.type,
            scheduled_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Rendez-vous planifié',
        message: 'Le rendez-vous a été planifié avec succès',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur planification rendez-vous:', error);
      return false;
    }
  }

  /**
   * Génération de rapport
   */
  private async generateReport(dossierId: string, reportData: any): Promise<boolean> {
    try {
      // Créer un document de rapport
      const { error } = await supabase
        .from('DocumentFile')
        .insert({
          name: `Rapport d'expert - Dossier ${dossierId}`,
          type: 'rapport_expert',
          dossier_id: dossierId,
          metadata: {
            report_data: reportData,
            generated_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Mettre à jour le statut du dossier
      await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: 7,
          progress: 80,
          updated_at: new Date().toISOString()
        })
        .eq('id', dossierId);

      this.addToast({
        type: 'success',
        title: 'Rapport généré',
        message: 'Le rapport d\'expert a été généré avec succès',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      return false;
    }
  }

  /**
   * Prévisualisation de rapport
   */
  private async previewReport(dossierId: string, previewData: any): Promise<boolean> {
    try {
      // Logique de prévisualisation (peut ouvrir un modal, etc.)
      this.addToast({
        type: 'info',
        title: 'Prévisualisation',
        message: 'Ouverture de la prévisualisation du rapport',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur prévisualisation rapport:', error);
      return false;
    }
  }

  /**
   * Soumission à l'administration
   */
  private async submitToAdmin(dossierId: string, submissionData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: 8,
          progress: 90,
          updated_at: new Date().toISOString(),
          metadata: {
            admin_submission: submissionData,
            submitted_at: new Date().toISOString()
          }
        })
        .eq('id', dossierId);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Soumis à l\'administration',
        message: 'Le dossier a été soumis à l\'administration',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur soumission admin:', error);
      return false;
    }
  }

  /**
   * Suivi du remboursement
   */
  private async trackReimbursement(dossierId: string, trackingData: any): Promise<boolean> {
    try {
      this.addToast({
        type: 'info',
        title: 'Suivi remboursement',
        message: 'Ouverture du suivi du remboursement',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur suivi remboursement:', error);
      return false;
    }
  }

  /**
   * Clôture du dossier
   */
  private async closeDossier(dossierId: string, closureData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: 10,
          progress: 100,
          statut: 'termine',
          updated_at: new Date().toISOString(),
          metadata: {
            closure: closureData,
            closed_at: new Date().toISOString()
          }
        })
        .eq('id', dossierId);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Dossier clôturé',
        message: 'Le dossier a été clôturé avec succès',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur clôture dossier:', error);
      return false;
    }
  }

  // ============================================================================
  // ACTIONS DOCUMENTS
  // ============================================================================

  /**
   * Upload de document
   */
  private async uploadDocument(dossierId: string, documentName: string, file: File, metadata?: any): Promise<boolean> {
    try {
      // Upload du fichier vers Supabase Storage
      const fileName = `${dossierId}/${documentName}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Créer l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('DocumentFile')
        .insert({
          name: documentName,
          filename: fileName,
          type: 'document_eligibilite',
          dossier_id: dossierId,
          status: 'uploaded',
          metadata: {
            uploaded_at: new Date().toISOString(),
            file_size: file.size,
            file_type: file.type,
            ...metadata
          }
        });

      if (dbError) throw dbError;

      this.addToast({
        type: 'success',
        title: 'Document uploadé',
        message: `Le document "${documentName}" a été uploadé avec succès`,
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur upload document:', error);
      return false;
    }
  }

  /**
   * Visualisation de document
   */
  private async viewDocument(dossierId: string, documentName: string): Promise<boolean> {
    try {
      // Récupérer l'URL du document
      const { data: document, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('name', documentName)
        .single();

      if (error || !document) throw error;

      // Générer l'URL de téléchargement
      const { data: urlData } = supabase.storage
        .from('documents')
        .createSignedUrl(document.filename, 3600);

      if (urlData?.signedUrl) {
        // Ouvrir le document dans un nouvel onglet
        window.open(urlData.signedUrl, '_blank');
      }

      this.addToast({
        type: 'info',
        title: 'Document ouvert',
        message: `Le document "${documentName}" a été ouvert`,
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur visualisation document:', error);
      return false;
    }
  }

  /**
   * Téléchargement de document
   */
  private async downloadDocument(dossierId: string, documentName: string): Promise<boolean> {
    try {
      // Logique similaire à viewDocument mais avec téléchargement forcé
      const { data: document, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('name', documentName)
        .single();

      if (error || !document) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .createSignedUrl(document.filename, 3600);

      if (urlData?.signedUrl) {
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = urlData.signedUrl;
        link.download = documentName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      this.addToast({
        type: 'success',
        title: 'Document téléchargé',
        message: `Le document "${documentName}" a été téléchargé`,
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur téléchargement document:', error);
      return false;
    }
  }

  /**
   * Validation de document
   */
  private async validateDocument(dossierId: string, documentName: string, metadata?: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('DocumentFile')
        .update({
          status: 'validated',
          metadata: {
            validated_at: new Date().toISOString(),
            validated_by: 'expert',
            ...metadata
          }
        })
        .eq('dossier_id', dossierId)
        .eq('name', documentName);

      if (error) throw error;

      this.addToast({
        type: 'success',
        title: 'Document validé',
        message: `Le document "${documentName}" a été validé`,
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur validation document:', error);
      return false;
    }
  }

  /**
   * Rejet de document
   */
  private async rejectDocument(dossierId: string, documentName: string, metadata?: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('DocumentFile')
        .update({
          status: 'rejected',
          metadata: {
            rejected_at: new Date().toISOString(),
            rejected_by: 'expert',
            rejection_reason: metadata?.reason,
            ...metadata
          }
        })
        .eq('dossier_id', dossierId)
        .eq('name', documentName);

      if (error) throw error;

      this.addToast({
        type: 'warning',
        title: 'Document rejeté',
        message: `Le document "${documentName}" a été rejeté`,
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur rejet document:', error);
      return false;
    }
  }
} 