import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FolderOpen, 
  TrendingUp, 
  FileText, 
  Calendar,
  Download,
  Trash2,
  Eye,
  Users,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { EnhancedDocumentUpload } from '@/components/documents/EnhancedDocumentUpload';
import { useToast } from '@/hooks/use-toast';
import HeaderExpert from '@/components/HeaderExpert';
import { Label } from '@/components/ui/label';

interface ExpertDocumentsData {
  files: any[];
  stats: {
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number;
    total_clients: number;
    active_assignments: number;
  };
}

export default function DocumentsExpert() {
  const { user } = useAuth();
  const { getExpertFiles, getClientFiles, deleteFile, downloadFile } = useEnhancedDocumentStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpertDocumentsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      loadExpertDocuments();
    }
  }, [user?.id]);

  const loadExpertDocuments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Charger les fichiers de l'expert
      const expertFilesResponse = await getExpertFiles(user.id);
      
      // Charger les fichiers des clients assignés
      const clientFilesResponse = await getClientFiles(user.id);
      
      if (expertFilesResponse.success && clientFilesResponse.success) {
        const allFiles = [
          ...(expertFilesResponse.data?.files || []),
          ...(clientFilesResponse.data?.files || [])
        ];

        // Calculer les statistiques
        const stats = calculateStats(allFiles);
        
        setData({
          files: allFiles,
          stats
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Erreur lors du chargement des documents'
        });
      }
    } catch (error) {
      console.error('Erreur chargement documents expert: ', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des documents'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (files: any[]) => {
    const stats = {
      total_files: files.length,
      total_size: files.reduce((sum, file) => sum + (file.file_size || 0), 0),
      files_by_category: {} as { [key: string]: number },
      files_by_status: {} as { [key: string]: number },
      recent_uploads: files.filter(f => {
        const uploadDate = new Date(f.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length,
      total_clients: new Set(files.map(f => f.client_id)).size,
      active_assignments: 5 // À adapter selon votre logique
    };

    // Calculer les répartitions
    files.forEach(file => {
      stats.files_by_category[file.category] = (stats.files_by_category[file.category] || 0) + 1;
      stats.files_by_status[file.validation_status] = (stats.files_by_status[file.validation_status] || 0) + 1;
    });

    return stats;
  };

  const handleFileUploaded = () => {
    toast({
      title: 'Succès',
      description: 'Document uploadé avec succès'
    });
    loadExpertDocuments();
  };

  const handleFileDeleted = async (fileId: string) => {
    const result = await deleteFile(fileId);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès'
      });
      loadExpertDocuments();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Erreur lors de la suppression'
      });
    }
  };

  const handleFileDownload = async (fileId: string) => {
    await downloadFile(fileId);
  };

  const filteredFiles = data?.files.filter(file => {
    const matchesSearch = file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || file.validation_status === statusFilter;
    const matchesClient = !selectedClientId || file.client_id === selectedClientId;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesClient;
  }) || [];

  const uniqueClients = Array.from(new Set(data?.files.map(f => f.client_id) || []));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderExpert />
        <div className="container mx-auto p-4 pt-24">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderExpert />
        <div className="container mx-auto p-4 pt-24">
          <Card>
            <CardContent className="p-6">
              <p>Erreur lors du chargement des données.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { files, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderExpert />
      <div className="container mx-auto p-4 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📁 Mes Documents</h1>
          <p className="text-gray-600">Gestion de vos documents et de ceux de vos clients</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="files">Mes fichiers</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="clients">Documents clients</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total fichiers</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_files}</p>
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
                        {(stats.total_size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clients actifs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_clients}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assignations actives</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active_assignments}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Composant de gestion des documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDocumentUpload 
                  expertId={user?.id || ''}
                  onUploadComplete={handleFileUploaded}
                  onUploadError={(error) => {
                    toast({
                      variant: 'destructive',
                      title: 'Erreur',
                      description: error
                    });
                  }}
                  showAdvancedOptions={true}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistiques par catégorie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Documents par Catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.files_by_category).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Statut des fichiers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Statut des Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.files_by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fichiers */}
          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mes Fichiers ({filteredFiles.length})</CardTitle>
                  <Button onClick={loadExpertDocuments} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtres */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Rechercher dans les fichiers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        <SelectItem value="charte">Charte</SelectItem>
                        <SelectItem value="rapport">Rapport</SelectItem>
                        <SelectItem value="audit">Audit</SelectItem>
                        <SelectItem value="simulation">Simulation</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="facture">Facture</SelectItem>
                        <SelectItem value="contrat">Contrat</SelectItem>
                        <SelectItem value="certificat">Certificat</SelectItem>
                        <SelectItem value="formulaire">Formulaire</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                        <SelectItem value="requires_revision">Révision requise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredFiles.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">{file.original_filename}</p>
                            <p className="text-sm text-gray-600">
                              {file.category} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {file.description && (
                              <p className="text-xs text-gray-500 mt-1">{file.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={file.validation_status === 'approved' ? 'default' : 'secondary'}>
                            {file.validation_status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(file.created_at).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDownload(file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDeleted(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun fichier trouvé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDocumentUpload 
                  expertId={user?.id || ''}
                  onUploadComplete={handleFileUploaded}
                  onUploadError={(error) => {
                    toast({
                      variant: 'destructive',
                      title: 'Erreur',
                      description: error
                    });
                  }}
                  showAdvancedOptions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents clients */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents de Mes Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Label>Client :</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les clients</SelectItem>
                        {uniqueClients.map(clientId => (
                          <SelectItem key={clientId} value={clientId}>
                            Client {clientId.slice(0, 8)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {filteredFiles
                      .filter(file => file.client_id) // Seulement les fichiers clients
                      .map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="font-medium">{file.original_filename}</p>
                              <p className="text-sm text-gray-600">
                                Client {file.client_id.slice(0, 8)}... • {file.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={file.validation_status === 'approved' ? 'default' : 'secondary'}>
                              {file.validation_status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileDownload(file.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 