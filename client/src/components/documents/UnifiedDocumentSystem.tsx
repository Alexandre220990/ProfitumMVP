import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Image, FileText, CheckCircle, AlertCircle, X, Loader2, Download, Trash2, Share2, Settings, Grid, List, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { config } from '@/config/env';

// ============================================================================
// SYSTÈME DOCUMENTAIRE UNIFIÉ RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par Evan You (Vue.js) - Composition API
// Architecture composable et performante

// Types unifiés
interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  category: string;
  description?: string;
  tags: string[];
  status: 'uploaded' | 'validated' | 'rejected' | 'archived' | 'deleted';
  validation_status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  access_level: 'public' | 'private' | 'restricted' | 'confidential';
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  download_count: number;
  last_downloaded?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface DocumentStats {
  total_files: number;
  total_size: number;
  recent_uploads: number;
  files_by_category: Record<string, number>;
  files_by_status: Record<string, number>;
}

// Composables (inspirés de Vue.js Composition API)
const useDocumentUpload = () => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File, options: any) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    setUploadingFiles(prev => [...prev, {
      id: fileId,
      file,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      const response = await fetch(`${config.API_URL}/api/unified-documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'success', progress: 100 } : f
      ));

      toast({ title: 'Succès', description: 'Fichier uploadé avec succès' });
      return result.data;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', error: errorMessage } : f
      ));
      
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMessage
      });
      throw error;
    }
  }, [toast]);

  const removeUploadingFile = useCallback((fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  return {
    uploadingFiles,
    isDragOver,
    setIsDragOver,
    uploadFile,
    removeUploadingFile
  };
};

const useDocumentList = () => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
    accessLevel: 'all'
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadDocuments = useCallback(async (userId: string, userType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/unified-documents/list?userId=${userId}&userType=${userType}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error: unknown) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = filters.category === 'all' || doc.category === filters.category;
      const matchesStatus = filters.status === 'all' || doc.status === filters.status;
      const matchesSearch = !filters.search || 
        doc.original_filename.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesAccessLevel = filters.accessLevel === 'all' || doc.access_level === filters.accessLevel;
      
      return matchesCategory && matchesStatus && matchesSearch && matchesAccessLevel;
    }).sort((a, b) => {
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

  return {
    documents: filteredDocuments,
    loading,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    loadDocuments
  };
};

const useDocumentActions = () => {
  const { toast } = useToast();

  const downloadFile = useCallback(async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/unified-documents/download/${fileId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erreur téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'Succès', description: 'Fichier téléchargé' });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du téléchargement'
      });
    }
  }, [toast]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    
    try {
      const response = await fetch(`/api/unified-documents/delete/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ title: 'Succès', description: 'Fichier supprimé' });
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression'
      });
      return false;
    }
  }, [toast]);

  const shareFile = useCallback(async (fileId: string, shareOptions: any) => {
    try {
      const response = await fetch(`/api/unified-documents/share/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareOptions),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ title: 'Succès', description: 'Fichier partagé' });
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du partage'
      });
    }
  }, [toast]);

  return {
    downloadFile,
    deleteFile,
    shareFile
  };
};

// Composant principal unifié
export const UnifiedDocumentSystem: React.FC<{
  userId?: string;
  userType?: 'client' | 'expert' | 'admin';
  className?: string;
}> = ({ userId, userType, className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [stats, setStats] = useState<DocumentStats | null>(null);

  // Utilisation des composables
  const upload = useDocumentUpload();
  const list = useDocumentList();
  const actions = useDocumentActions();

  const currentUserId = userId || user?.id;
  const currentUserType = userType || user?.type;

  // Charger les données au montage
  React.useEffect(() => {
    if (currentUserId && currentUserType) {
      list.loadDocuments(currentUserId, currentUserType);
      loadStats();
    }
  }, [currentUserId, currentUserType]);

  const loadStats = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`/api/unified-documents/stats/${currentUserId}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error: unknown) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      charte: 'bg-blue-100 text-blue-800',
      rapport: 'bg-green-100 text-green-800',
      audit: 'bg-purple-100 text-purple-800',
      simulation: 'bg-orange-100 text-orange-800',
      guide: 'bg-indigo-100 text-indigo-800',
      facture: 'bg-red-100 text-red-800',
      autre: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.autre;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total fichiers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_files.toLocaleString() || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taille totale</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatFileSize(stats.total_size) : '0 Bytes'}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uploads récents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.recent_uploads || 0}
                </p>
              </div>
              <Upload className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Catégories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? Object.keys(stats.files_by_category).length : 0}
                </p>
              </div>
              <Tag className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Gestion</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mes Documents</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => list.setViewMode(list.viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {list.viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres et recherche */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher des documents..."
                    value={list.filters.search}
                    onChange={(e) => list.setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={list.filters.category} onValueChange={(value) => list.setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      <SelectItem value="charte">Chartes</SelectItem>
                      <SelectItem value="rapport">Rapports</SelectItem>
                      <SelectItem value="audit">Audits</SelectItem>
                      <SelectItem value="simulation">Simulations</SelectItem>
                      <SelectItem value="guide">Guides</SelectItem>
                      <SelectItem value="facture">Factures</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={list.filters.status} onValueChange={(value) => list.setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="uploaded">Uploadé</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Liste des documents */}
              {list.loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : list.documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun document trouvé
                  </h3>
                  <p className="text-gray-500">
                    Commencez par uploader votre premier document.
                  </p>
                </div>
              ) : list.viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.documents.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {getFileIcon(doc.mime_type)}
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold line-clamp-2">
                                {doc.original_filename}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className={getCategoryColor(doc.category)}>
                              {doc.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)}
                            </span>
                          </div>
                          
                          {doc.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {doc.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.downloadFile(doc.id, doc.original_filename)}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFile(doc);
                                setShowShareDialog(true);
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.deleteFile(doc.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {list.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getFileIcon(doc.mime_type)}
                        </div>
                        <div>
                          <h3 className="font-medium">{doc.original_filename}</h3>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge className={getCategoryColor(doc.category)}>
                              {doc.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => actions.downloadFile(doc.id, doc.original_filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(doc);
                            setShowShareDialog(true);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => actions.deleteFile(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Zone de drop */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  upload.isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  upload.setIsDragOver(true);
                }}
                onDragLeave={() => upload.setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  upload.setIsDragOver(false);
                  const files = Array.from(e.dataTransfer.files);
                  files.forEach(file => {
                    upload.uploadFile(file, {
                      userId: currentUserId,
                      userType: currentUserType,
                      category: 'autre'
                    });
                  });
                }}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Glissez-déposez vos fichiers ici
                </p>
                <p className="text-gray-500 mb-4">
                  ou cliquez pour sélectionner des fichiers
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  Sélectionner des fichiers
                </Button>
              </div>

              {/* Fichiers en cours d'upload */}
              {upload.uploadingFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium">Fichiers en cours d'upload</h3>
                  {upload.uploadingFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{file.file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => upload.removeUploadingFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Progress value={file.progress} className="mb-2" />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {file.status === 'uploading' && (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Upload en cours...</span>
                            </>
                          )}
                          {file.status === 'success' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Upload terminé</span>
                            </>
                          )}
                          {file.status === 'error' && (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span>{file.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion Avancée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Fonctionnalités de gestion avancée à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Analytics et métriques à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog d'upload */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    upload.uploadFile(file, {
                      userId: currentUserId,
                      userType: currentUserType,
                      category: 'autre'
                    });
                    setShowUploadDialog(false);
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv,.zip,.rar"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de partage */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partager le Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Partagez "{selectedFile?.original_filename}" avec d'autres utilisateurs.
            </p>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemple.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="can-download" />
              <Label htmlFor="can-download">Autoriser le téléchargement</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                // Logique de partage
                setShowShareDialog(false);
              }}>
                Partager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 