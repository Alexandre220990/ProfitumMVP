// Types pour l'intégration
export interface MessageAttachment { id: string;
  name: string;
  type: string;
  size: number;
  documentId?: string; // Référence au document dans le système documentaire
  url?: string;
  uploadedAt: string; }

export interface IntegratedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'client' | 'expert' | 'system';
  content: string;
  timestamp: string;
  read: boolean;
  attachments: MessageAttachment[];
  documentReferences?: string[]; // IDs des documents liés
}

export interface DocumentNotification {
  type: 'document_uploaded' | 'document_shared' | 'document_approved' | 'document_rejected';
  documentId: string;
  clientId: string;
  expertId?: string;
  message: string;
  actionUrl?: string;
  timestamp?: string;
  read?: boolean;
}

/**
 * Service d'intégration entre messagerie et système documentaire
 */
export class MessagingDocumentIntegration { /**
   * Upload un fichier via messagerie et le lier au système documentaire
   */
  static async uploadMessageAttachment(
    file: File, 
    clientId: string, 
    description?: string
  ): Promise<{ success: boolean; attachment?: MessageAttachment; error?: string }> { try {
      // 1. Upload dans le système documentaire via API directe
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('category', 'message_attachment');
      formData.append('description', description || `Pièce jointe de conversation`);
      formData.append('tags', JSON.stringify(['messagerie']));

      const response = await fetch('/api/client-documents/upload', { method: 'POST', body: formData, credentials: 'include' });

      const result = await response.json();

      if (!result.success) { return { success: false, error: result.message };
      }

      // 2. Créer l'attachment avec référence au document
      const attachment: MessageAttachment = { id: `att_${Date.now() }`,
        name: file.name,
        type: file.type,
        size: file.size,
        documentId: result.data?.id,
        url: URL.createObjectURL(file), // URL temporaire pour prévisualisation
        uploadedAt: new Date().toISOString()
      };

      // 3. Créer une notification automatique
      await this.createDocumentNotification({ type: 'document_uploaded', documentId: result.data?.id, clientId, message: `Document "${file.name }" uploadé via messagerie`
      });

      return { success: true, attachment };

    } catch (error) { console.error('Erreur upload message attachment: ', error);
      return { success: false, error: 'Erreur lors de l\'upload' };
    }
  }

  /**
   * Partager un document existant via messagerie
   */
  static async shareDocumentInMessage(
    documentId: string,
    _conversationId: string,
    sharedBy: string,
    sharedWith: string
  ): Promise<{ success: boolean; error?: string }> { try {
      // 1. Partager le document via API directe
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/share/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ sharedWithEmail: sharedWith, permissions: { view: true, download: true } })
      });

      const result = await response.json();

      if (!result.success) { return { success: false, error: result.message };
      }

      // 2. Créer une notification
      await this.createDocumentNotification({ type: 'document_shared', documentId, clientId: sharedBy, expertId: sharedWith, message: 'Document partagé via messagerie' });

      return { success: true };

    } catch (error) { console.error('Erreur partage document via messagerie: ', error);
      return { success: false, error: 'Erreur lors du partage' };
    }
  }

  /**
   * Créer une notification croisée entre messagerie et documents
   */
  static async createDocumentNotification(notification: DocumentNotification): Promise<void> { try {
      // 1. Notification dans la messagerie
      await this.createSystemMessage(notification);

      // 2. Notification push (si configurée)
      if (notification.expertId) {
        await this.sendPushNotification(notification); }

      // 3. Notification email (si configurée)
      await this.sendEmailNotification(notification);

    } catch (error) { console.error('Erreur création notification: ', error); }
  }

  /**
   * Créer un message système automatique
   */
  private static async createSystemMessage(notification: DocumentNotification): Promise<void> { try {
      const message: IntegratedMessage = {
        id: `sys_${Date.now() }`,
        conversationId: `conv_${ notification.clientId }_${ notification.expertId || 'system' }`,
        senderId: 'system',
        senderType: 'system',
        content: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
        attachments: [],
        documentReferences: [notification.documentId]
      };

      // TODO: Sauvegarder le message dans la base de données
      console.log('Message système créé:', message);

    } catch (error) { console.error('Erreur création message système: ', error); }
  }

  /**
   * Envoyer une notification push
   */
  private static async sendPushNotification(notification: DocumentNotification): Promise<void> { try {
      // TODO: Implémenter les notifications push
      console.log('Notification push envoyée:', notification); } catch (error) { console.error('Erreur notification push: ', error); }
  }

  /**
   * Envoyer une notification email
   */
  private static async sendEmailNotification(notification: DocumentNotification): Promise<void> { try {
      // TODO: Implémenter les notifications email
      console.log('Notification email envoyée:', notification); } catch (error) { console.error('Erreur notification email: ', error); }
  }

  /**
   * Récupérer tous les documents d'une conversation
   */
  static async getConversationDocuments(conversationId: string): Promise<string[]> { try {
      // TODO: Implémenter la récupération depuis la base de données
      console.log('Récupération documents pour conversation:', conversationId);
      return []; } catch (error) { console.error('Erreur récupération documents conversation: ', error);
      return []; }
  }

  /**
   * Récupérer toutes les conversations liées à un document
   */
  static async getDocumentConversations(documentId: string): Promise<string[]> { try {
      // TODO: Implémenter la récupération depuis la base de données
      console.log('Récupération conversations pour document:', documentId);
      return []; } catch (error) { console.error('Erreur récupération conversations document: ', error);
      return []; }
  }
}

/**
 * Hook React pour utiliser l'intégration messagerie-documents
 */
export const useMessagingDocumentIntegration = () => { 
  const uploadAttachment = async (
    file: File, 
    clientId: string, 
    description?: string
  ) => {
    return MessagingDocumentIntegration.uploadMessageAttachment(
      file, clientId, description
    ); };

  const shareDocument = async (
    documentId: string,
    _conversationId: string,
    sharedBy: string,
    sharedWith: string
  ) => { return MessagingDocumentIntegration.shareDocumentInMessage(
      documentId, _conversationId, sharedBy, sharedWith
    ); };

  const createNotification = async (notification: DocumentNotification) => { return MessagingDocumentIntegration.createDocumentNotification(notification); };

  const getConversationDocuments = async (conversationId: string) => { return MessagingDocumentIntegration.getConversationDocuments(conversationId); };

  const getDocumentConversations = async (documentId: string) => { return MessagingDocumentIntegration.getDocumentConversations(documentId); };

  return { uploadAttachment, shareDocument, createNotification, getConversationDocuments, getDocumentConversations };
}; 