import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./use-auth";

// Types pour le workflow de documents
enum DocumentWorkflow {
  UPLOADED = 'uploaded',
  PROFITUM_REVIEW = 'profitum_review',
  ELIGIBILITY_CONFIRMED = 'eligibility_confirmed',
  EXPERT_ASSIGNED = 'expert_assigned',
  EXPERT_REVIEW = 'expert_review',
  FINAL_REPORT = 'final_report',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

enum DocumentCategory {
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

interface WorkflowData { 
  workflow?: any[];
  pendingDocuments?: any[];
  stats?: any; 
}

interface RefreshOptions { 
  clientId?: string;
  expertId?: string;
  pendingOnly?: boolean; 
}

export const useDocumentWorkflow = () => { 
  const { user } = useAuth();
  const [data, setData] = useState<WorkflowData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour faire des appels API
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => { 
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/documents/workflow${endpoint}`, { 
        ...options, 
        headers: {
          'Content-Type': 'application/json', 
          ...options.headers 
        },
      });

      if (!response.ok) { 
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (err) { 
      console.error('Erreur API workflow: ', err);
      throw err; 
    }
  }, []);

  // Rafraîchir les données
  const refreshData = useCallback(async (options: RefreshOptions = {}) => { 
    setLoading(true);
    setError(null);

    try {
      if (options.clientId) {
        // Charger le workflow d'un client spécifique
        const result = await apiCall(`/client/${options.clientId}`);
        setData({ workflow: result.workflow });
      } else if (options.pendingOnly) { 
        // Charger les documents en attente
        const result = await apiCall('/pending');
        setData({ pendingDocuments: result.pendingDocuments });
      } else { 
        // Charger les statistiques générales
        const result = await apiCall('/stats');
        setData({ stats: result.stats });
      }
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Erreur inconnue'); 
    } finally { 
      setLoading(false); 
    }
  }, [apiCall]);

  // Initialiser le workflow pour un nouveau client
  const initializeClientWorkflow = useCallback(async (clientId: string): Promise<boolean> => { 
    try {
      const result = await apiCall('/initialize-client', {
        method: 'POST', 
        body: JSON.stringify({ clientId }),
      });
      return result.success;
    } catch (err) { 
      console.error('Erreur initialisation workflow: ', err);
      return false; 
    }
  }, [apiCall]);

  // Créer une demande de document
  const createDocumentRequest = useCallback(async (requestData: { 
    clientId: string;
    category: DocumentCategory;
    description: string;
    required?: boolean;
    deadline?: string;
    expertId?: string;
    workflow: DocumentWorkflow; 
  }): Promise<string | null> => { 
    try {
      const result = await apiCall('/request', {
        method: 'POST', 
        body: JSON.stringify(requestData) 
      });
      return result.success ? result.requestId : null;
    } catch (err) { 
      console.error('Erreur création demande: ', err);
      return null; 
    }
  }, [apiCall]);

  // Upload de document avec workflow
  const uploadDocumentWithWorkflow = useCallback(async (
    file: File,
    requestId: string,
    category: DocumentCategory,
    description: string,
    workflow: DocumentWorkflow,
    expertId?: string
  ): Promise<boolean> => { 
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', requestId);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('workflow', workflow);
      if (expertId) formData.append('expertId', expertId);

      const response = await fetch('/api/documents/workflow/upload', {
        method: 'POST', 
        body: formData 
      });

      if (!response.ok) { 
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (err) { 
      console.error('Erreur upload document: ', err);
      return false; 
    }
  }, []);

  // Compléter une étape du workflow
  const completeWorkflowStep = useCallback(async (
    documentRequestId: string,
    workflow: DocumentWorkflow,
    comments?: string
  ): Promise<boolean> => { 
    try {
      const result = await apiCall('/complete-step', {
        method: 'POST', 
        body: JSON.stringify({
          documentRequestId, 
          workflow, 
          comments 
        }),
      });
      return result.success;
    } catch (err) { 
      console.error('Erreur complétion étape: ', err);
      return false; 
    }
  }, [apiCall]);

  // Valider un document
  const validateDocument = useCallback(async (
    documentFileId: string,
    validationType: string,
    status: string,
    comments?: string
  ): Promise<boolean> => { 
    try {
      const result = await apiCall('/validate', {
        method: 'POST', 
        body: JSON.stringify({
          documentFileId, 
          validationType, 
          status, 
          comments 
        }),
      });
      return result.success;
    } catch (err) { 
      console.error('Erreur validation document: ', err);
      return false; 
    }
  }, [apiCall]);

  // Partager un document
  const shareDocument = useCallback(async (
    documentFileId: string,
    sharedWith: string,
    shareType: string,
    expiresAt?: string
  ): Promise<boolean> => { 
    try {
      const result = await apiCall('/share', {
        method: 'POST', 
        body: JSON.stringify({
          documentFileId, 
          sharedWith, 
          shareType, 
          expiresAt 
        }),
      });
      return result.success;
    } catch (err) { 
      console.error('Erreur partage document: ', err);
      return false; 
    }
  }, [apiCall]);

  // Obtenir les validations d'un document
  const getDocumentValidations = useCallback(async (documentFileId: string) => { 
    try {
      const result = await apiCall(`/validations/${documentFileId}`);
      return result.success ? result.validations : [];
    } catch (err) { 
      console.error('Erreur récupération validations: ', err);
      return []; 
    }
  }, [apiCall]);

  // Obtenir les partages d'un document
  const getDocumentShares = useCallback(async (documentFileId: string) => { 
    try {
      const result = await apiCall(`/shares/${documentFileId}`);
      return result.success ? result.shares : [];
    } catch (err) { 
      console.error('Erreur récupération partages: ', err);
      return []; 
    }
  }, [apiCall]);

  // Charger les données initiales
  useEffect(() => { 
    if (user) {
      refreshData({ pendingOnly: true });
    }
  }, [user, refreshData]);

  return { 
    // Données
    workflow: data.workflow, 
    pendingDocuments: data.pendingDocuments, 
    stats: data.stats, 
    loading, 
    error, 
    // Actions
    refreshData, 
    initializeClientWorkflow, 
    createDocumentRequest, 
    uploadDocumentWithWorkflow, 
    completeWorkflowStep, 
    validateDocument, 
    shareDocument, 
    getDocumentValidations, 
    getDocumentShares 
  };
}; 