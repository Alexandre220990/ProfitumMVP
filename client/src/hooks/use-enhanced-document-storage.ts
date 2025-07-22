import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Types pour le nouveau service
export interface EnhancedUploadRequest {
  file: File;
  clientId?: string;
  expertId?: string;
  auditId?: string;
  category: 'charte' | 'rapport' | 'audit' | 'simulation' | 'guide' | 'facture' | 'contrat' | 'certificat' | 'formulaire' | 'autre';
  description?: string;
  tags?: string[];
  accessLevel?: 'public' | 'private' | 'restricted' | 'confidential';
  expiresAt?: Date;
}

export interface DocumentFile {
  id: string;
  client_id?: string;
  expert_id?: string;
  audit_id?: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  category: string;
  document_type: string;
  description?: string;
  tags: string[];
  status: string;
  validation_status: string;
  is_public: boolean;
  access_level: string;
  expires_at?: string;
  download_count: number;
  last_downloaded?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FileListResponse {
  success: boolean;
  data?: {
    files: DocumentFile[];
    total: number;
  };
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data?: {
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number;
  };
  error?: string;
}

export const useEnhancedDocumentStorage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ===== UPLOAD DE FICHIERS =====

  const uploadFile = useCallback(async (request: EnhancedUploadRequest): Promise<{ success: boolean; fileId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', request.file);
      
      if (request.clientId) {
        formData.append('clientId', request.clientId);
      }
      
      if (request.expertId) {
        formData.append('expertId', request.expertId);
      }
      
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

      const response = await fetch('/api/enhanced-client-documents/upload', {
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
        description: 'Erreur lors de l\'upload'
      });
      return { success: false, error: 'Erreur lors de l\'upload' };
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  // ===== TÉLÉCHARGEMENT DE FICHIERS =====

  const downloadFile = useCallback(async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/enhanced-client-documents/download/${fileId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Erreur lors du téléchargement' };
      }

      // Créer un blob et télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Succès', description: 'Fichier téléchargé avec succès' });

      return { success: true };

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du téléchargement'
      });
      return { success: false, error: 'Erreur lors du téléchargement' };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // ===== LISTAGE DE FICHIERS =====

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

      const response = await fetch(`/api/enhanced-client-documents/client/${clientId}?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return { success: true, data: result.data };

    } catch (error) {
      console.error('Erreur listage fichiers:', error);
      return { success: false, error: 'Erreur lors du listage des fichiers' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getExpertFiles = useCallback(async (
    expertId: string, 
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

      const response = await fetch(`/api/enhanced-client-documents/expert/${expertId}?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return { success: true, data: result.data };

    } catch (error) {
      console.error('Erreur listage fichiers expert:', error);
      return { success: false, error: 'Erreur lors du listage des fichiers' };
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
      const response = await fetch(`/api/enhanced-client-documents/validate/${fileId}`, {
        method: 'POST',
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
          description: result.message || 'Erreur lors de la validation'
        });
        return { success: false, error: result.message };
      }

      toast({ title: 'Succès', description: 'Document validé avec succès' });

      return { success: true };

    } catch (error) {
      console.error('Erreur validation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la validation'
      });
      return { success: false, error: 'Erreur lors de la validation' };
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
      const response = await fetch(`/api/enhanced-client-documents/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message || 'Erreur lors de la suppression'
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
      return { success: false, error: 'Erreur lors de la suppression' };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // ===== PARTAGE DE FICHIERS =====

  const shareFile = useCallback(async (
    fileId: string, 
    email: string, 
    permissions: { view: boolean; download: boolean }, 
    expiresAt?: Date
  ): Promise<{ success: boolean; shareToken?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/enhanced-client-documents/share/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, permissions, expiresAt })
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message || 'Erreur lors du partage'
        });
        return { success: false, error: result.message };
      }

      toast({ title: 'Succès', description: 'Fichier partagé avec succès' });

      return { success: true, shareToken: result.data?.share_token };

    } catch (error) {
      console.error('Erreur partage:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du partage'
      });
      return { success: false, error: 'Erreur lors du partage' };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // ===== STATISTIQUES =====

  const getClientFileStats = useCallback(async (clientId: string): Promise<StatsResponse> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/enhanced-client-documents/stats/${clientId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return { success: true, data: result.data };

    } catch (error) {
      console.error('Erreur statistiques:', error);
      return { success: false, error: 'Erreur lors du calcul des statistiques' };
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
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📎';
  }, []);

  const getCategoryColor = useCallback((category: string): string => {
    const colors: { [key: string]: string } = {
      'charte': 'bg-blue-100 text-blue-800',
      'rapport': 'bg-green-100 text-green-800',
      'audit': 'bg-purple-100 text-purple-800',
      'simulation': 'bg-yellow-100 text-yellow-800',
      'guide': 'bg-indigo-100 text-indigo-800',
      'facture': 'bg-red-100 text-red-800',
      'contrat': 'bg-orange-100 text-orange-800',
      'certificat': 'bg-teal-100 text-teal-800',
      'formulaire': 'bg-pink-100 text-pink-800',
      'autre': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['autre'];
  }, []);

  return {
    // États
    loading,
    uploading,
    
    // Actions
    uploadFile,
    downloadFile,
    getClientFiles,
    getExpertFiles,
    validateFile,
    deleteFile,
    shareFile,
    getClientFileStats,
    
    // Utilitaires
    formatFileSize,
    getFileIcon,
    getCategoryColor
  };
}; 