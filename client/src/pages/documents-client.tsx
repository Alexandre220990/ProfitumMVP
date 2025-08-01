import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Share2, 
  Eye,
  FolderOpen,
  Calendar,
  Tag,
  BarChart3,
  RefreshCw,
  Plus,
  Archive,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Building2,
  Shield,
  Info,
  X
} from 'lucide-react';
import HeaderClient from '@/components/HeaderClient';
import DocumentUpload from '@/components/DocumentUpload';
import { UnifiedDocumentSystem } from '@/components/documents/UnifiedDocumentSystem';
import DocumentStats from '@/components/documents/DocumentStats';
import DocumentSearch from '@/components/documents/DocumentSearch';
import DocumentGrid from '@/components/documents/DocumentGrid';

// ============================================================================
// ESPACE DOCUMENTAIRE CLIENT UNIFIÉ ET OPTIMISÉ
// ============================================================================
// Architecture modulaire et évolutive
// Réutilisation optimale des composants existants

interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  category: string;
  document_type: string;
  description?: string;
  status: 'uploaded' | 'validated' | 'rejected' | 'archived' | 'deleted';
  validation_status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  access_level: 'public' | 'private' | 'restricted' | 'confidential';
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  download_count: number;
  last_downloaded?: string;
  dossier_id?: string;
  product_type?: string;
  bucket_name?: string;
  file_path?: string;
}

interface DocumentStats {
  total_files: number;
  total_size: number;
  recent_uploads: number;
  files_by_category: Record<string, number>;
  files_by_status: Record<string, number>;
  files_by_product: Record<string, number>;
  storage_usage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface DossierInfo {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  documents_count: number;
}

export default function DocumentsClientPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // États principaux
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentFile[]>([]);
  const [dossiers, setDossiers] = useState<DossierInfo[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États de filtrage
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // États d'upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<string>('');

  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  // Filtrer les documents
  useEffect(() => {
    let filtered = documents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.original_filename.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.document_type.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }

    if (productFilter) {
      filtered = filtered.filter(doc => doc.product_type === productFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.created_at);
        return docDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, statusFilter, categoryFilter, productFilter, dateFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDocuments(),
        loadDossiers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/client/${user?.id}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.data.documents || []);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    }
  };

  const loadDossiers = async () => {
    try {
      const response = await fetch(`/api/dossiers/client/${user?.id}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setDossiers(result.data.dossiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/documents/stats/${user?.id}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({
      title: "Actualisé",
      description: "Les données ont été actualisées"
    });
  };

  const handleDocumentUpload = async (success: boolean) => {
    if (success) {
      await loadDocuments();
      await loadStats();
      setShowUploadModal(false);
      toast({
        title: "Succès",
        description: "Document uploadé avec succès"
      });
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadDocuments();
        await loadStats();
        toast({
          title: "Supprimé",
          description: "Document supprimé avec succès"
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erreur suppression document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const handleDocumentDownload = async (document: DocumentFile) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Téléchargé",
          description: "Document téléchargé avec succès"
        });
      } else {
        throw new Error('Erreur téléchargement');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      uploaded: 'bg-blue-100 text-blue-800',
      validated: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
      deleted: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.uploaded;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      case 'uploaded':
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('word')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('excel')) return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connexion requise
            </h3>
            <p className="text-gray-500">
              Veuillez vous connecter pour accéder à vos documents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Espace Documentaire
              </h1>
              <p className="text-gray-600">
                Gérez tous vos documents et suivez vos dossiers
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Document
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_files}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Espace Utilisé</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFileSize(stats.total_size)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Récemment Ajoutés</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_uploads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dossiers Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{dossiers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="documents">Mes Documents</TabsTrigger>
            <TabsTrigger value="dossiers">Mes Dossiers</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Documents récents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documents Récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {documents.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(doc.mime_type)}
                            <div>
                              <p className="font-medium text-sm">{doc.original_filename}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1">{doc.status}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun document récent</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dossiers actifs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderOpen className="h-5 w-5 mr-2" />
                    Dossiers Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dossiers.length > 0 ? (
                    <div className="space-y-3">
                      {dossiers.map((dossier) => (
                        <div key={dossier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">{dossier.product_name}</p>
                              <p className="text-xs text-gray-500">
                                {dossier.documents_count} documents • {new Date(dossier.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{dossier.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun dossier actif</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mes Documents */}
          <TabsContent value="documents" className="space-y-6">
            {/* Filtres et recherche */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Rechercher un document..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les statuts</SelectItem>
                      <SelectItem value="uploaded">Uploadé</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      <SelectItem value="identity">Identité</SelectItem>
                      <SelectItem value="financial">Financier</SelectItem>
                      <SelectItem value="legal">Juridique</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={productFilter} onValueChange={setProductFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Produit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les produits</SelectItem>
                      <SelectItem value="TICPE">TICPE</SelectItem>
                      <SelectItem value="URSSAF">URSSAF</SelectItem>
                      <SelectItem value="FONCIER">FONCIER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contrôles d'affichage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Liste des documents */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des documents...</p>
                </div>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(doc.mime_type)}
                          <div>
                            <h3 className="font-medium text-sm truncate max-w-48">
                              {doc.original_filename}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {getStatusIcon(doc.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-xs text-gray-500">
                          <Tag className="h-3 w-3 mr-1" />
                          {doc.category}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.product_type && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Building2 className="h-3 w-3 mr-1" />
                            {doc.product_type}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDocumentDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentDelete(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun document trouvé
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || statusFilter || categoryFilter || productFilter
                        ? "Aucun document ne correspond à vos critères de recherche"
                        : "Vous n'avez pas encore uploadé de documents"
                      }
                    </p>
                    <Button onClick={() => setShowUploadModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Uploader un document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Mes Dossiers */}
          <TabsContent value="dossiers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Mes Dossiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dossiers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dossiers.map((dossier) => (
                      <Card key={dossier.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Building2 className="h-8 w-8 text-blue-600" />
                              <div>
                                <h3 className="font-medium">{dossier.product_name}</h3>
                                <p className="text-sm text-gray-500">
                                  {dossier.documents_count} documents
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{dossier.status}</Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              Créé le {new Date(dossier.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/client/${user.id}?dossier=${dossier.id}`)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDossier(dossier.id);
                                setShowUploadModal(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun dossier
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Vous n'avez pas encore de dossiers actifs
                    </p>
                    <Button onClick={() => navigate('/simulateur-eligibilite')}>
                      Créer un dossier
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistiques */}
          <TabsContent value="stats" className="space-y-6">
            {stats && <DocumentStats userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Uploader un document</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <DocumentUpload
              clientProduitId={selectedDossier || ''}
              onUploadComplete={handleDocumentUpload}
              showDossierSelector={!selectedDossier}
              dossiers={dossiers}
              onDossierSelect={setSelectedDossier}
            />
          </div>
        </div>
      )}
    </div>
  );
} 