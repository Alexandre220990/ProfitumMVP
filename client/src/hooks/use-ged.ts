import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';

export interface GEDDocument { 
  id: string;
  title: string;
  description?: string;
  content: string;
  category: 'business' | 'technical';
  file_path?: string;
  last_modified: string;
  created_at: string;
  created_by?: string;
  is_active: boolean;
  read_time: number;
  version: number;
  labels?: GEDLabel[] 
}

export interface GEDLabel { 
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string 
}

export interface DocumentFilters { 
  category?: 'business' | 'technical';
  search?: string;
  labels?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'created_at' | 'last_modified' | 'read_time';
  sortOrder?: 'asc' | 'desc'; 
}

export interface DocumentListResponse { 
  documents: GEDDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number; 
  };
}

export interface CreateDocumentRequest { 
  title: string;
  description?: string;
  content: string;
  category: 'business' | 'technical';
  labels?: string[];
  read_time?: number 
}

export interface UpdateDocumentRequest { 
  title?: string;
  description?: string;
  content?: string;
  category?: 'business' | 'technical';
  labels?: string[];
  read_time?: number 
}

export interface CreateLabelRequest { 
  name: string;
  color?: string;
  description?: string 
}

export function useGED() { 
  const [documents, setDocuments] = useState<GEDDocument[]>([]);
  const [labels, setLabels] = useState<GEDLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les documents
  const loadDocuments = useCallback(async (filters: DocumentFilters = {}) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/documents', { params: filters });
      
      if (response.data.success) { 
        setDocuments(response.data.data.documents);
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors du chargement des documents'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  // Charger les labels
  const loadLabels = useCallback(async () => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/documents/labels');
      
      if (response.data.success) {
        setLabels(response.data.data);
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors du chargement des labels'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  // Créer un document
  const createDocument = useCallback(async (data: CreateDocumentRequest) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/documents', data);
      
      if (response.data.success) {
        // Recharger les documents
        await loadDocuments();
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la création du document'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, [loadDocuments]);

  // Modifier un document
  const updateDocument = useCallback(async (id: string, data: UpdateDocumentRequest) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/documents/${id}`, data);
      
      if (response.data.success) { 
        // Recharger les documents
        await loadDocuments();
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la modification du document'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, [loadDocuments]);

  // Supprimer un document
  const deleteDocument = useCallback(async (id: string) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/documents/${id}`);
      
      if (response.data.success) { 
        // Recharger les documents
        await loadDocuments();
        return true; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la suppression du document'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, [loadDocuments]);

  // Récupérer un document spécifique
  const getDocument = useCallback(async (id: string) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/documents/${id}`);
      
      if (response.data.success) { 
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la récupération du document'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  // Créer un label
  const createLabel = useCallback(async (data: CreateLabelRequest) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/documents/labels', data);
      
      if (response.data.success) {
        // Recharger les labels
        await loadLabels();
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la création du label'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, [loadLabels]);

  // Modifier un label
  const updateLabel = useCallback(async (id: string, data: Partial<GEDLabel>) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/documents/labels/${id}`, data);
      
      if (response.data.success) { 
        // Recharger les labels
        await loadLabels();
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la modification du label'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, [loadLabels]);

  // Supprimer un label
  const deleteLabel = useCallback(async (id: string) => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/documents/labels/${id}`);
      
      if (response.data.success) { 
        // Recharger les labels
        await loadLabels();
        return true; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la suppression du label'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, [loadLabels]);

  // Ajouter aux favoris
  const addToFavorites = useCallback(async (documentId: string) => { 
    try {
      setError(null);
      
      const response = await api.post(`/documents/${documentId}/favorite`);
      
      if (response.data.success) { 
        return true; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de l\'ajout aux favoris'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    }
  }, []);

  // Retirer des favoris
  const removeFromFavorites = useCallback(async (documentId: string) => { 
    try {
      setError(null);
      
      const response = await api.delete(`/documents/${documentId}/favorite`);
      
      if (response.data.success) { 
        return true; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la suppression des favoris'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    }
  }, []);

  // Récupérer les favoris
  const getFavorites = useCallback(async () => { 
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/documents/favorites');
      
      if (response.data.success) {
        return response.data.data; 
      } else { 
        throw new Error(response.data.error || 'Erreur lors de la récupération des favoris'); 
      }
    } catch (err: any) { 
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
      throw new Error(errorMessage); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  // Charger les données initiales
  useEffect(() => { 
    loadDocuments();
    loadLabels(); 
  }, [loadDocuments, loadLabels]);

  return { 
    // État
    documents, 
    labels, 
    loading, 
    error, 
    // Actions
    loadDocuments, 
    loadLabels, 
    createDocument, 
    updateDocument, 
    deleteDocument, 
    getDocument, 
    createLabel,
    updateLabel,
    deleteLabel,
    addToFavorites, 
    removeFromFavorites, 
    getFavorites, 
    // Utilitaires
    clearError: () => setError(null) 
  };
} 