import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// HOOK DOCUMENTAIRE UNIFIÉ RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par Addy Osmani (Google) - Core Web Vitals
// Performance extrême, cache intelligent, lazy loading

// Types optimisés
interface DocumentFile {
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
  is_encrypted: boolean;
  access_level: 'public' | 'private' | 'restricted' | 'confidential';
  expires_at?: string;
  download_count: number;
  last_downloaded?: string;
  uploaded_by?: string;
  validated_by?: string;
  client_id?: string;
  expert_id?: string;
  audit_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface UploadOptions {
  category: string;
  description?: string;
  tags?: string[];
  accessLevel?: 'public' | 'private' | 'restricted' | 'confidential';
  expiresAt?: Date;
  clientId?: string;
  expertId?: string;
  auditId?: string;
}

interface ShareOptions {
  email: string;
  canDownload: boolean;
  expiresAt?: Date;
}

// Cache intelligent avec TTL
class DocumentCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes par défaut
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Instance globale du cache
const documentCache = new DocumentCache();

// Hook principal unifié
export const useUnifiedDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États optimisés
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { file: File; progress: number; status: 'uploading' | 'success' | 'error'; error?: string }>>(new Map());
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
    accessLevel: 'all'
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Références pour optimisations
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadQueueRef = useRef<Array<{ file: File; options: UploadOptions }>>([]);
  const isProcessingQueueRef = useRef(false);

  // ===== QUERIES OPTIMISÉES (React Query) =====

  // Query pour les documents avec cache intelligent
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['unified-documents', user?.id, user?.type, filters, sortBy, sortOrder],
    queryFn: async () => {
      const cacheKey = `documents-${user?.id}-${JSON.stringify(filters)}-${sortBy}-${sortOrder}`;
      const cached = documentCache.get(cacheKey);
      if (cached) return cached;

      const params = new URLSearchParams({
        ...filters,
        sortBy,
        sortOrder
      });

              const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/unified-documents/list?${params}`, {
        credentials: 'include',
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des documents');
      }

      const result = await response.json();
      
      // Cache avec TTL adaptatif selon la fréquence d'accès
      const ttl = documents.length > 0 ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2-5 minutes
      documentCache.set(cacheKey, result.data, ttl);
      
      return result.data;
    },
    enabled: !!user?.id && !!user?.type,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Query pour les statistiques avec cache long
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['unified-documents-stats', user?.id],
    queryFn: async () => {
      const cacheKey = `stats-${user?.id}`;
      const cached = documentCache.get(cacheKey);
      if (cached) return cached;

      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/unified-documents/stats/${user?.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }

      const result = await response.json();
      
      // Cache plus long pour les stats (10 minutes)
      documentCache.set(cacheKey, result.data, 10 * 60 * 1000);
      
      return result.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  // ===== MUTATIONS OPTIMISÉES =====

  // Mutation pour l'upload avec queue intelligente
  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options: UploadOptions }) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      
      // Mise à jour optimiste
      setUploadingFiles(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'uploading'
      }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user!.id);
        formData.append('userType', user!.type);
        formData.append('category', options.category);
        
        if (options.description) {
          formData.append('description', options.description);
        }
        if (options.tags) {
          formData.append('tags', JSON.stringify(options.tags));
        }
        if (options.accessLevel) {
          formData.append('accessLevel', options.accessLevel);
        }
        if (options.expiresAt) {
          formData.append('expiresAt', options.expiresAt.toISOString());
        }
        if (options.clientId) {
          formData.append('clientId', options.clientId);
        }
        if (options.expertId) {
          formData.append('expertId', options.expertId);
        }
        if (options.auditId) {
          formData.append('auditId', options.auditId);
        }

        const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
        const response = await fetch(`${baseUrl}/api/unified-documents/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        // Mise à jour optimiste du cache
        queryClient.setQueryData(['unified-documents', user?.id, user?.type, filters, sortBy, sortOrder], 
          (old: DocumentFile[] | undefined) => {
            if (!old) return [result.data];
            return [result.data, ...old];
          }
        );

        // Invalider le cache des stats
        queryClient.invalidateQueries({ queryKey: ['unified-documents-stats', user?.id] });

        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(fileId, {
            file,
            progress: 100,
            status: 'success'
          });
          return newMap;
        });

        toast({ title: 'Succès', description: 'Fichier uploadé avec succès' });
        return result.data;

      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(fileId, {
            file,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
          return newMap;
        });

        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Erreur lors de l\'upload'
        });
        throw error;
      }
    },
    onSettled: () => {
      // Nettoyer les fichiers uploadés après un délai
      setTimeout(() => {
        setUploadingFiles(new Map());
      }, 3000);
    }
  });

  // Mutation pour la suppression
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/unified-documents/delete/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return fileId;
    },
    onSuccess: (fileId) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['unified-documents', user?.id, user?.type, filters, sortBy, sortOrder], 
        (old: DocumentFile[] | undefined) => {
          if (!old) return old;
          return old.filter(doc => doc.id !== fileId);
        }
      );

      // Invalider le cache des stats
      queryClient.invalidateQueries({ queryKey: ['unified-documents-stats', user?.id] });

      toast({ title: 'Succès', description: 'Fichier supprimé avec succès' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      });
    }
  });

  // Mutation pour le partage
  const shareMutation = useMutation({
    mutationFn: async ({ fileId, options }: { fileId: string; options: ShareOptions }) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/unified-documents/share/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Fichier partagé avec succès' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du partage'
      });
    }
  });

  // ===== FONCTIONS OPTIMISÉES =====

  // Upload avec queue intelligente
  const uploadFile = useCallback(async (file: File, options: UploadOptions) => {
    // Ajouter à la queue
    uploadQueueRef.current.push({ file, options });
    
    // Traiter la queue si pas déjà en cours
    if (!isProcessingQueueRef.current) {
      processUploadQueue();
    }
  }, []);

  // Traitement de la queue d'upload
  const processUploadQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || uploadQueueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    
    while (uploadQueueRef.current.length > 0) {
      const { file, options } = uploadQueueRef.current.shift()!;
      
      try {
        await uploadMutation.mutateAsync({ file, options });
        
        // Délai entre les uploads pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Erreur upload file:', error);
      }
    }
    
    isProcessingQueueRef.current = false;
  }, [uploadMutation]);

  // Téléchargement optimisé
  const downloadFile = useCallback(async (fileId: string, filename: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/unified-documents/download/${fileId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      // Téléchargement avec progress
      const link = document.createElement('a');
      link.href = result.url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: 'Succès', description: 'Téléchargement démarré' });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du téléchargement'
      });
    }
  }, [toast]);

  // Suppression optimisée
  const deleteFile = useCallback(async (fileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    
    await deleteMutation.mutateAsync(fileId);
  }, [deleteMutation]);

  // Partage optimisé
  const shareFile = useCallback(async (fileId: string, options: ShareOptions) => {
    await shareMutation.mutateAsync({ fileId, options });
  }, [shareMutation]);

  // ===== UTILITAIRES MÉMOISÉS =====

  // Documents filtrés et triés
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc: DocumentFile) => {
      const matchesCategory = filters.category === 'all' || doc.category === filters.category;
      const matchesStatus = filters.status === 'all' || doc.status === filters.status;
      const matchesSearch = !filters.search || 
        doc.original_filename.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesAccessLevel = filters.accessLevel === 'all' || doc.access_level === filters.accessLevel;
      
      return matchesCategory && matchesStatus && matchesSearch && matchesAccessLevel;
    }).sort((a: DocumentFile, b: DocumentFile) => {
      const aValue = a[sortBy as keyof DocumentFile];
      const bValue = b[sortBy as keyof DocumentFile];
      
      // Gestion des valeurs undefined
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [documents, filters, sortBy, sortOrder]);

  // Statistiques calculées
  const computedStats = useMemo(() => {
    if (!stats) return null;

    return {
      ...stats,
      averageFileSize: stats.total_files > 0 ? stats.total_size / stats.total_files : 0,
      validationRate: stats.total_files > 0 ? (stats.files_by_status?.validated || 0) / stats.total_files : 0,
      mostUsedCategory: (() => {
        const entries = Object.entries(stats.files_by_category || {});
        if (entries.length === 0) return '';
        
        // Filtrer pour ne garder que les entrées avec des valeurs numériques
        const numericEntries = entries.filter((entry): entry is [string, number] => 
          typeof entry[1] === 'number'
        );
        
        if (numericEntries.length === 0) return '';
        
        return numericEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      })()
    };
  }, [stats]);

  // ===== NETTOYAGE ET OPTIMISATIONS =====

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      documentCache.clear();
    };
  }, []);

  // Annulation des requêtes en cours lors du changement de filtres
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  }, [filters, sortBy, sortOrder]);

  // ===== EXPOSITION DES FONCTIONS =====

  return {
    // Données
    documents: filteredDocuments,
    stats: computedStats,
    uploadingFiles: Array.from(uploadingFiles.values()),
    
    // États de chargement
    loading: documentsLoading || statsLoading,
    uploading: uploadMutation.isPending,
    deleting: deleteMutation.isPending,
    sharing: shareMutation.isPending,
    
    // Erreurs
    error: documentsError || statsError,
    
    // Filtres et tri
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    
    // Actions
    uploadFile,
    downloadFile,
    deleteFile,
    shareFile,
    
    // Utilitaires
    refetchDocuments,
    refetchStats,
    
    // Cache
    cacheSize: documentCache.size(),
    clearCache: documentCache.clear.bind(documentCache)
  };
}; 