/**
 * 📁 use-documents - Hook universel pour gestion documentaire
 * 
 * Architecture modulaire réutilisable (comme use-messaging)
 * Utilisable par Client, Expert, Apporteur, Admin
 * 
 * Date: 2025-10-13
 * Version: 1.0
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { config } from '@/config';

// ============================================================================
// TYPES
// ============================================================================

export interface Document {
  id: string;
  filename: string;
  document_type: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  bucket_name: string;
  status: 'pending' | 'validated' | 'rejected';
  workflow_step?: string;
  uploaded_by?: string;
  uploaded_by_type?: string;
  validated_by?: string;
  validated_at?: string;
  validation_notes?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  
  // Relations
  client_id?: string;
  produit_id?: string;
  Client?: {
    id: string;
    name?: string;
    company_name?: string;
    email: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    categorie: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  type: 'product' | 'client' | 'category';
  count: number;
  icon: string;
  children?: Document[];
}

export interface DocumentFilters {
  produit_id?: string;
  client_id?: string;
  document_type?: string;
  status?: string;
  search?: string;
}

export interface UploadOptions {
  file: File;
  client_id?: string;
  produit_id?: string;
  document_type: string;
  metadata?: any;
}

export interface DocumentStats {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
  by_product: Record<string, number>;
  by_type: Record<string, number>;
  total_size: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useDocuments(userType: 'client' | 'expert' | 'apporteur' | 'admin') {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  /**
   * Charger les documents
   */
  const loadDocuments = useCallback(async (filters: DocumentFilters = {}) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(
        `${config.API_URL}/api/documents?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur chargement documents');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.data || []);
        return result.data;
      } else {
        throw new Error(result.message || 'Erreur');
      }
      
    } catch (error) {
      console.error('❌ Erreur loadDocuments:', error);
      toast.error('Impossible de charger les documents');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Charger l'arborescence (dossiers)
   */
  const loadFolders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/folders`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur chargement dossiers');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFolders(result.data || []);
        return result.data;
      }
      
    } catch (error) {
      console.error('❌ Erreur loadFolders:', error);
      return [];
    }
  }, []);
  
  /**
   * Charger les statistiques
   */
  const loadStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur chargement stats');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
        return result.data;
      }
      
    } catch (error) {
      console.error('❌ Erreur loadStats:', error);
      return null;
    }
  }, []);
  
  /**
   * Upload un document
   */
  const uploadDocument = useCallback(async (options: UploadOptions) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', options.file);
      if (options.client_id) formData.append('client_id', options.client_id);
      if (options.produit_id) formData.append('produit_id', options.produit_id);
      formData.append('document_type', options.document_type);
      if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur upload');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Document uploadé avec succès');
        await loadDocuments(); // Refresh
        await loadStats();
        return result.data;
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur upload:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
      throw error;
    } finally {
      setUploading(false);
    }
  }, [loadDocuments, loadStats]);
  
  /**
   * Télécharger un document (URL signée)
   */
  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur download');
      }
      
      const result = await response.json();
      
      if (result.success && result.data.download_url) {
        // Ouvrir dans nouvel onglet
        window.open(result.data.download_url, '_blank');
        toast.success('Téléchargement démarré');
        return result.data;
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur download:', error);
      toast.error(error.message || 'Erreur lors du téléchargement');
      throw error;
    }
  }, []);
  
  /**
   * Supprimer un document
   */
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur suppression');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Document supprimé');
        await loadDocuments(); // Refresh
        await loadStats();
        return true;
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur delete:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
      throw error;
    }
  }, [loadDocuments, loadStats]);
  
  /**
   * Valider un document (Expert/Admin)
   */
  const validateDocument = useCallback(async (
    documentId: string, 
    notes?: string
  ) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/validate`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ notes })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur validation');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Document validé');
        await loadDocuments();
        await loadStats();
        return true;
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur validate:', error);
      toast.error(error.message || 'Erreur lors de la validation');
      throw error;
    }
  }, [loadDocuments, loadStats]);
  
  /**
   * Rejeter un document (Expert/Admin)
   */
  const rejectDocument = useCallback(async (
    documentId: string, 
    reason: string
  ) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ reason })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur rejet');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.error('Document rejeté');
        await loadDocuments();
        await loadStats();
        return true;
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur reject:', error);
      toast.error(error.message || 'Erreur lors du rejet');
      throw error;
    }
  }, [loadDocuments, loadStats]);
  
  /**
   * Ajouter aux favoris
   */
  const toggleFavorite = useCallback(async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/favorite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur favoris');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.data.is_favorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
        await loadDocuments();
        return result.data.is_favorite;
      }
      
    } catch (error: any) {
      console.error('❌ Erreur favorite:', error);
      toast.error('Erreur favoris');
      throw error;
    }
  }, [loadDocuments]);
  
  /**
   * Partager un document
   */
  const shareDocument = useCallback(async (
    documentId: string,
    shareWith: { email: string; can_download: boolean; expires_at?: Date }
  ) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/share`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(shareWith)
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur partage');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Document partagé avec ${shareWith.email}`);
        return true;
      }
      
    } catch (error: any) {
      console.error('❌ Erreur share:', error);
      toast.error('Erreur lors du partage');
      throw error;
    }
  }, []);
  
  /**
   * Obtenir URL de preview
   */
  const getPreviewUrl = useCallback(async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/preview`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur preview');
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data.preview_url;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur preview:', error);
      return null;
    }
  }, []);
  
  /**
   * Obtenir versions d'un document
   */
  const getVersions = useCallback(async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_URL}/api/documents/${documentId}/versions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur versions');
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur versions:', error);
      return [];
    }
  }, []);
  
  /**
   * Formatter taille fichier
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);
  
  /**
   * Obtenir icône selon type fichier
   */
  const getFileIcon = useCallback((mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📎';
  }, []);
  
  /**
   * Organiser documents en arborescence
   */
  const organizeByFolder = useCallback((docs: Document[]): Folder[] => {
    if (userType === 'client') {
      // Client : Grouper par produit
      const byProduct = docs.reduce((acc, doc) => {
        const productName = doc.ProduitEligible?.nom || 'Autres';
        if (!acc[productName]) {
          acc[productName] = [];
        }
        acc[productName].push(doc);
        return acc;
      }, {} as Record<string, Document[]>);
      
      return Object.entries(byProduct).map(([name, children]) => ({
        id: name,
        name,
        type: 'product' as const,
        count: children.length,
        icon: getProductIcon(name),
        children
      }));
    }
    
    if (userType === 'expert' || userType === 'apporteur') {
      // Expert/Apporteur : Grouper par client
      const byClient = docs.reduce((acc, doc) => {
        const clientName = doc.Client?.company_name || doc.Client?.name || 'Clients';
        if (!acc[clientName]) {
          acc[clientName] = [];
        }
        acc[clientName].push(doc);
        return acc;
      }, {} as Record<string, Document[]>);
      
      return Object.entries(byClient).map(([name, children]) => ({
        id: name,
        name,
        type: 'client' as const,
        count: children.length,
        icon: '👤',
        children
      }));
    }
    
    // Admin : Grouper par type de document
    const byType = docs.reduce((acc, doc) => {
      const typeName = doc.document_type || 'Autres';
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
    
    return Object.entries(byType).map(([name, children]) => ({
      id: name,
      name,
      type: 'category' as const,
      count: children.length,
      icon: '📁',
      children
    }));
  }, [userType]);
  
  /**
   * Icône produit
   */
  const getProductIcon = (productName: string): string => {
    const icons: Record<string, string> = {
      'TICPE': '🚛',
      'URSSAF': '💼',
      'DFS': '📋',
      'FONCIER': '🏢',
      'Foncier': '🏢',
      'CEE': '⚡',
      'MSA': '🌾',
      'Recouvrement': '💰',
      'TVA': '🌍'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (productName.includes(key)) return icon;
    }
    
    return '📁';
  };
  
  // Charger au montage
  useEffect(() => {
    loadDocuments();
    loadFolders();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
    // Data
    documents,
    folders,
    stats,
    loading,
    uploading,
    
    // Actions
    loadDocuments,
    loadFolders,
    loadStats,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    validateDocument,
    rejectDocument,
    toggleFavorite,
    shareDocument,
    getPreviewUrl,
    getVersions,
    
    // Helpers
    formatFileSize,
    getFileIcon,
    organizeByFolder
  };
}

