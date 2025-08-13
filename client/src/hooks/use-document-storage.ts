import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { config } from "@/config/env";

// Types pour le stockage de documents
export interface DocumentFile {
  id: string;
  document_id?: string;
  client_id: string;
  audit_id?: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  category: 'charte' | 'rapport' | 'audit' | 'simulation' | 'guide' | 'facture' | 'contrat' | 'certificat' | 'formulaire' | 'autre';
  document_type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'txt' | 'csv' | 'zip' | 'rar';
  description?: string;
  tags: string[];
  status: 'uploaded' | 'validated' | 'rejected' | 'archived' | 'deleted';
  validation_status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  is_public: boolean;
  is_encrypted: boolean;
  access_level: 'public' | 'private' | 'restricted' | 'confidential';
  expires_at?: string;
  download_count: number;
  last_downloaded?: string;
  uploaded_by?: string;
  validated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UploadFileRequest {
  file: File;
  clientId: string;
  auditId?: string;
  category: DocumentFile['category'];
  description?: string;
  tags?: string[];
  accessLevel?: DocumentFile['access_level'];
  expiresAt?: Date;
}

export interface FileListResponse {
  success: boolean;
  files?: DocumentFile[];
  total?: number;
  error?: string;
}

export interface FileStats {
  total_files: number;
  total_size: number;
  files_by_category: { [key: string]: number };
  files_by_status: { [key: string]: number };
  recent_uploads: number;
}

export interface ClientDocumentsResponse {
  success: boolean;
  data?: {
    files: DocumentFile[];
    chartes: any[];
    audits: any[];
    simulations: any[];
    guides: any[];
    stats: {
      totalDocuments: number;
      totalChartes: number;
      chartesSignees: number;
      totalAudits: number;
      auditsEnCours: number;
      totalSimulations: number;
      simulationsCompletees: number;
      totalGuides: number;
      gainsPotentiels: number;
      total_files: number;
      total_size: number;
      files_by_category: { [key: string]: number };
      files_by_status: { [key: string]: number };
      recent_uploads: number;
    };
  };
  error?: string;
}

export const useDocumentStorage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ===== UPLOAD DE FICHIERS =====

  const uploadFile = useCallback(async (request: UploadFileRequest): Promise<{ success: boolean; fileId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('clientId', request.clientId);
      
      if (request.auditId) {
        formData.append('auditId', request.auditId);
      }
      
      formData.append('category', request.category);
      
      if (request.description) {
        formData.append('description', request.description);
      }
      
      if (request.tags && request.tags.length > 0) {
        formData.append('tags', JSON.stringify(request.tags));
      }
      
      if (request.accessLevel) {
        formData.append('accessLevel', request.accessLevel);
      }
      
      if (request.expiresAt) {
        formData.append('expiresAt', request.expiresAt.toISOString());
      }

      const response = await fetch(`${config.API_URL}/api/client-documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message || 'Erreur lors de l\'upload'
        });
        return { success: false, error: result.message };
      }

      toast({ title: 'Succès', description: 'Fichier uploadé avec succès' });

      return { success: true, fileId: result.data?.id };

    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de l\'upload du fichier'
      });
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  // ===== TÉLÉCHARGEMENT DE FICHIERS =====

  const downloadFile = useCallback(async (fileId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/download/${fileId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Erreur lors du téléchargement' };
      }

      // Pour les fichiers, on redirige vers l'URL signée
      const downloadUrl = response.url;
      
      // Ouvrir dans un nouvel onglet
      window.open(downloadUrl, '_blank');

      return { success: true, url: downloadUrl };

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ===== LISTE DES FICHIERS =====

  const getClientFiles = useCallback(async (
    clientId: string,
    filters?: {
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<FileListResponse> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('token');

      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/client/${clientId}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return { success: true, files: result.data.files, total: result.data.files?.length || 0 };

    } catch (error) {
      console.error('Erreur récupération fichiers:', error);
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ===== DOCUMENTS COMPLETS DU CLIENT =====

  const getClientDocuments = useCallback(async (clientId: string): Promise<ClientDocumentsResponse> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('token');
      
      // Utiliser l'URL relative correcte au lieu de l'URL hardcodée
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/client/${clientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return { success: true, data: result.data };

    } catch (error) {
      console.error('Erreur récupération documents:', error);
      
      // Gestion spécifique des erreurs
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: 'Erreur de connexion au serveur' };
      }
      
      return { success: false, error: 'Erreur lors de la récupération des documents' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ===== VALIDATION DE FICHIERS =====

  const validateFile = useCallback(async (
    fileId: string,
    status: 'approved' | 'rejected' | 'requires_revision',
    comment?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/validate/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status, comment })
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message
        });
        return { success: false, error: result.message };
      }

      toast({ title: 'Succès', description: 'Fichier validé avec succès' });

      return { success: true };

    } catch (error) {
      console.error('Erreur validation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la validation'
      });
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // ===== SUPPRESSION DE FICHIERS =====

  const deleteFile = useCallback(async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message
        });
        return { success: false, error: result.message };
      }

      toast({ title: 'Succès', description: 'Fichier supprimé avec succès' });

      return { success: true };

    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression'
      });
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // ===== PARTAGE DE FICHIERS =====

  const shareFile = useCallback(async (
    fileId: string,
    sharedWithEmail: string,
    permissions: { view: boolean; download: boolean },
    expiresAt?: Date
  ): Promise<{ success: boolean; shareToken?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/share/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ sharedWithEmail, permissions, expiresAt: expiresAt?.toISOString() })
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message
        });
        return { success: false, error: result.message };
      }

      toast({ title: 'Succès', description: 'Fichier partagé avec succès' });

      return { success: true, shareToken: result.data.shareToken };

    } catch (error) {
      console.error('Erreur partage:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du partage'
      });
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // ===== STATISTIQUES =====

  const getFileStats = useCallback(async (clientId: string): Promise<{ success: boolean; stats?: FileStats; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/client-documents/stats/${clientId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return { success: true, stats: result.data };

    } catch (error) {
      console.error('Erreur statistiques:', error);
      return { success: false, error: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ===== UTILITAIRES =====

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('text')) return '📄';
    return '📎';
  }, []);

  const getCategoryColor = useCallback((category: string): string => {
    const colors: { [key: string]: string } = {
      charte: 'bg-blue-100 text-blue-800',
      rapport: 'bg-green-100 text-green-800',
      audit: 'bg-purple-100 text-purple-800',
      simulation: 'bg-yellow-100 text-yellow-800',
      guide: 'bg-indigo-100 text-indigo-800',
      facture: 'bg-red-100 text-red-800',
      contrat: 'bg-orange-100 text-orange-800',
      certificat: 'bg-teal-100 text-teal-800',
      formulaire: 'bg-pink-100 text-pink-800',
      autre: 'bg-gray-100 text-gray-800'
    };
    
    return colors[category] || colors.autre;
  }, []);

  return {
    // États
    loading,
    uploading,
    // Actions
    uploadFile,
    downloadFile,
    getClientFiles,
    getClientDocuments,
    validateFile,
    deleteFile,
    shareFile,
    getFileStats,
    // Utilitaires
    formatFileSize,
    getFileIcon,
    getCategoryColor
  };
}; 