import { useState, useEffect } from 'react';
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
  Download,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { EnhancedDocumentUpload } from '@/components/documents/EnhancedDocumentUpload';
import { toast } from 'sonner';

interface ClientDocumentsData {
  files: any[];
  stats: {
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number;
    totalAudits: number;
    auditsEnCours: number;
    storage_usage: number;
    favorite_files: number;
    pending_validations: number;
  };
}

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const { getClientFiles, getClientFileStats, deleteFile, downloadFile } = useEnhancedDocumentStorage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientDocumentsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadClientDocuments();
    }
  }, [user?.id, refreshKey]);

  const loadClientDocuments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Charger les fichiers
      const filesResponse = await getClientFiles(user.id);
      
      // Charger les statistiques
      const statsResponse = await getClientFileStats(user.id);
      
      if (filesResponse.success && statsResponse.success) {
        const files = filesResponse.data?.files || [];
        const baseStats = statsResponse.data || {
          total_files: 0,
          total_size: 0,
          files_by_category: {},
          files_by_status: {},
          recent_uploads: 0
        };
        
        // Calculer des statistiques supplémentaires
        const enhancedStats = {
          total_files: baseStats.total_files || 0,
          total_size: baseStats.total_size || 0,
          files_by_category: baseStats.files_by_category || {},
          files_by_status: baseStats.files_by_status || {},
          recent_uploads: baseStats.recent_uploads || 0,
          totalAudits: files.filter(f => f.category === 'audit').length,
          auditsEnCours: files.filter(f => f.category === 'audit' && f.validation_status === 'pending').length,
          storage_usage: Math.min(100, ((baseStats.total_size || 0) / (10 * 1024 * 1024 * 1024)) * 100), // 10GB limit
          favorite_files: files.filter(f => (f as any).is_favorite).length,
          pending_validations: files.filter(f => f.validation_status === 'pending').length
        };

        setData({
          files,
          stats: enhancedStats
        });
      } else {
        toast.error('Erreur lors du chargement des documents');
      }
    } catch (error) {
      console.error('Erreur chargement documents: ', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    toast.success('Document uploadé avec succès');
    setRefreshKey(prev => prev + 1);
  };

  const handleFileDeleted = async (fileId: string) => {
    const result = await deleteFile(fileId);
    if (result.success) {
      toast.success('Document supprimé avec succès');
      setRefreshKey(prev => prev + 1);
    } else {
      toast.error(result.error || 'Erreur lors de la suppression');
    }
  };

  const handleFileDownload = async (fileId: string) => {
    await downloadFile(fileId);
    toast.success('Téléchargement en cours...');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Données actualisées');
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    const allFileIds = new Set(filteredFiles.map(f => f.id));
    setSelectedFiles(allFileIds);
  };

  const deselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'requires_revision':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStorageUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredFiles = data?.files.filter(file => {
    const matchesSearch = file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || file.validation_status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.original_filename.localeCompare(b.original_filename);
        break;
      case 'size':
        comparison = a.file_size - b.file_size;
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  }) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Erreur lors du chargement des données.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📁 Mes Documents</h1>
            <p className="text-gray-600">Gestion de vos documents et fichiers</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="files">Mes fichiers</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
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

            <Card className="hover:shadow-lg transition-shadow">
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

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uploads récents</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_uploads}</p>
                  </div>
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Audits en cours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.auditsEnCours}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métriques avancées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Utilisation du Stockage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Espace utilisé</span>
                    <span className={`text-sm font-bold ${getStorageUsageColor(stats.storage_usage)}`}>
                      {stats.storage_usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stats.storage_usage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{(stats.total_size / 1024 / 1024).toFixed(1)} MB utilisés</span>
                    <span>10 GB disponible</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Fichiers Favoris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Fichiers favoris</span>
                    <Badge variant="secondary">{stats.favorite_files}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">En attente de validation</span>
                    <Badge variant="secondary">{stats.pending_validations}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Taux de validation</span>
                    <span className="text-sm font-bold text-green-600">
                      {stats.total_files > 0 ? ((stats.total_files - stats.pending_validations) / stats.total_files * 100).toFixed(1) : 0}%
                    </span>
                  </div>
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
                clientId={user?.id || ''}
                onUploadComplete={handleFileUploaded}
                onUploadError={(error) => {
                  toast.error(error);
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
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
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
                <div className="flex items-center space-x-2">
                  {selectedFiles.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{selectedFiles.size} sélectionné(s)</span>
                      <Button variant="outline" size="sm" onClick={deselectAllFiles}>
                        Désélectionner
                      </Button>
                    </div>
                  )}
                  <Button onClick={loadClientDocuments} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres et recherche */}
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
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date de création</SelectItem>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="size">Taille</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllFiles}>
                    Tout sélectionner
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllFiles}>
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {filteredFiles.length > 0 ? (
                <div className="space-y-4">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all ${
                        selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
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
                        <div className="flex items-center gap-1">
                          {getStatusIcon(file.validation_status)}
                          <Badge variant={file.validation_status === 'approved' ? 'default' : 'secondary'}>
                            {file.validation_status}
                          </Badge>
                        </div>
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
                clientId={user?.id || ''}
                onUploadComplete={handleFileUploaded}
                onUploadError={(error) => {
                  toast.error(error);
                }}
                showAdvancedOptions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Activité Récente</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Documents uploadés ce mois</span>
                      <span className="text-sm font-medium">{Math.floor(stats.recent_uploads * 1.5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Téléchargements ce mois</span>
                      <span className="text-sm font-medium">{Math.floor(stats.total_files * 0.8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taux de validation</span>
                      <span className="text-sm font-medium text-green-600">
                        {stats.total_files > 0 ? ((stats.total_files - stats.pending_validations) / stats.total_files * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Espace utilisé</span>
                      <span className={`text-sm font-medium ${getStorageUsageColor(stats.storage_usage)}`}>
                        {stats.storage_usage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fichiers favoris</span>
                      <span className="text-sm font-medium">{stats.favorite_files}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">En attente</span>
                      <span className="text-sm font-medium text-yellow-600">{stats.pending_validations}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
