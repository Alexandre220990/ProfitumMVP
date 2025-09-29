import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import api from '../lib/api';

// Types pour les sections de documents
export interface DocumentSection {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  id: string;
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
  status: 'uploaded' | 'validated' | 'rejected' | 'archived' | 'deleted';
  validation_status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  is_public: boolean;
  access_level: string;
  expires_at?: string;
  download_count: number;
  last_downloaded?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SectionFilesResponse {
  success: boolean;
  files?: DocumentFile[];
  total?: number;
  error?: string;
}

export interface SectionsResponse {
  success: boolean;
  sections?: DocumentSection[];
  error?: string;
}

export const useDocumentSections = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ===== RÉCUPÉRATION DES SECTIONS =====

  const {
    data: sections,
    isLoading: sectionsLoading,
    error: sectionsError,
    refetch: refetchSections
  } = useQuery({
    queryKey: ['document-sections', user?.id],
    queryFn: async (): Promise<DocumentSection[]> => {
      if (!user) throw new Error('Utilisateur non authentifié');

      const response = await api.get('/api/enhanced-client-documents/sections');
      const data: SectionsResponse = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des sections');
      }

      return data.sections || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ===== RÉCUPÉRATION DES FICHIERS D'UNE SECTION =====

  const getSectionFiles = useCallback(async (
    sectionName: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<SectionFilesResponse> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await api.get(`/api/enhanced-client-documents/sections/${sectionName}/files?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération fichiers section:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des fichiers'
      };
    }
  }, [user]);

  // ===== UPLOAD VERS UNE SECTION =====

  const uploadToSection = useMutation({
    mutationFn: async ({
      sectionName,
      file,
      description,
      tags,
      accessLevel = 'private',
      expiresAt
    }: {
      sectionName: string;
      file: File;
      description?: string;
      tags?: string[];
      accessLevel?: string;
      expiresAt?: Date;
    }): Promise<{ success: boolean; fileId?: string; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        if (description) {
          formData.append('description', description);
        }
        
        if (tags && tags.length > 0) {
          formData.append('tags', JSON.stringify(tags));
        }
        
        formData.append('accessLevel', accessLevel);
        
        if (expiresAt) {
          formData.append('expiresAt', expiresAt.toISOString());
        }

        const response = await api.post(`/api/enhanced-client-documents/sections/${sectionName}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const result = response.data;
        console.log('🔍 [DEBUG] Réponse upload:', result);

        if (!result.success) {
          console.error('❌ [DEBUG] Upload échoué:', result.message);
          return { success: false, error: result.message };
        }

        console.log('✅ [DEBUG] Upload réussi, file_id:', result.data?.file_id);
        return {
          success: true,
          fileId: result.data?.file_id
        };

      } catch (error: any) {
        console.error('Erreur upload section:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'Erreur lors de l\'upload'
        };
      }
    },
    onSuccess: (data, variables) => {
      console.log('🔍 [DEBUG] onSuccess appelé:', { data, variables });
      
      if (data.success) {
        console.log('✅ [DEBUG] Affichage toast de succès');
        toast.success('Fichier uploadé avec succès');
        
        console.log('🔄 [DEBUG] Invalidation du cache pour section:', variables.sectionName);
        // Invalider le cache pour cette section (avec et sans filtres)
        queryClient.invalidateQueries({
          queryKey: ['section-files', variables.sectionName]
        });
      } else {
        console.log('❌ [DEBUG] Affichage toast d\'erreur:', data.error);
        toast.error(data.error || 'Erreur lors de l\'upload');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'upload');
    },
  });

  // ===== HOOK POUR LES FICHIERS D'UNE SECTION =====

  const useSectionFiles = (sectionName: string, filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    return useQuery({
      queryKey: ['section-files', sectionName, filters],
      queryFn: async (): Promise<{ files: DocumentFile[]; total: number }> => {
        const response = await getSectionFiles(sectionName, filters);
        
        if (!response.success) {
          throw new Error(response.error || 'Erreur lors de la récupération des fichiers');
        }

        return {
          files: response.files || [],
          total: response.total || 0
        };
      },
      enabled: !!user && !!sectionName,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  return {
    // Sections
    sections,
    sectionsLoading,
    sectionsError,
    refetchSections,
    
    // Upload
    uploadToSection,
    
    // Fichiers d'une section
    useSectionFiles,
    getSectionFiles,
  };
};
