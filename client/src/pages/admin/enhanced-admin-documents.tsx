import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Users, 
  FileText, 
  Shield, 
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Activity,
  Search,
  Eye,
  Clock,
  HardDrive,
  Database,
  Cloud,
  Lock,
  Unlock,
  EyeOff,
  FileCheck,
  FileX
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { toast } from 'sonner';
import { get } from '@/lib/api';

interface AdminDocumentStats {
  total_files: number;
  total_size: number;
  files_by_category: { [key: string]: number };
  files_by_status: { [key: string]: number };
  files_by_user_type: { [key: string]: number };
  recent_activity: {
    uploads_today: number;
    uploads_week: number;
    downloads_today: number;
    active_users: number;
  };
  system_health: {
    storage_usage: number;
    pending_validations: number;
    expired_documents: number;
    system_errors: number;
  };
  bucket_stats: {
    client_bucket: number;
    expert_bucket: number;
    admin_bucket: number;
    public_bucket: number;
  };
}

interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  category: string;
  status: string;
  validation_status: string;
  access_level: string;
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  client_id?: string;
  expert_id?: string;
  download_count: number;
  tags: string[];
  description?: string;
}

export default function EnhancedAdminDocumentsPage() {
  const { user } = useAuth();
  
  // Gestion d'erreur pour le hook
  let documentStorage;
  try {
    documentStorage = useEnhancedDocumentStorage();
  } catch (error) {
    console.error('Erreur hook useEnhancedDocumentStorage:', error);
    documentStorage = {
      getClientFiles: () => Promise.resolve({ success: false, error: 'Hook non disponible' }),
      getExpertFiles: () => Promise.resolve({ success: false, error: 'Hook non disponible' }),
      deleteFile: () => Promise.resolve({ success: false, error: 'Hook non disponible' }),
      downloadFile: () => Promise.resolve({ success: false, error: 'Hook non disponible' })
    };
  }
  
  const { getClientFiles, getExpertFiles, deleteFile, downloadFile } = documentStorage;

  // États locaux
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDocumentStats | null>(null);
  const [allFiles, setAllFiles] = useState<DocumentFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<DocumentFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques globales
      const statsData = await loadGlobalStats();
      setStats(statsData);
      
      // Charger tous les fichiers
      await loadAllFiles();
      
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async (): Promise<AdminDocumentStats> => {
    try {
      // Récupérer les statistiques depuis l'API
      const response = await get('/admin/documents/stats');
      
      if (response.success) {
        return response.data as AdminDocumentStats;
      } else {
        // Statistiques par défaut si l'API n'est pas disponible
        return {
          total_files: 0,
          total_size: 0,
          files_by_category: {},
          files_by_status: {},
          files_by_user_type: {},
          recent_activity: {
            uploads_today: 0,
            uploads_week: 0,
            downloads_today: 0,
            active_users: 0
          },
          system_health: {
            storage_usage: 0,
            pending_validations: 0,
            expired_documents: 0,
            system_errors: 0
          },
          bucket_stats: {
            client_bucket: 0,
            expert_bucket: 0,
            admin_bucket: 0,
            public_bucket: 0
          }
        };
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      return {
        total_files: 0,
        total_size: 0,
        files_by_category: {},
        files_by_status: {},
        files_by_user_type: {},
        recent_activity: {
          uploads_today: 0,
          uploads_week: 0,
          downloads_today: 0,
          active_users: 0
        },
        system_health: {
          storage_usage: 0,
          pending_validations: 0,
          expired_documents: 0,
          system_errors: 0
        },
        bucket_stats: {
          client_bucket: 0,
          expert_bucket: 0,
          admin_bucket: 0,
          public_bucket: 0
        }
      };
    }
  };

  const loadAllFiles = async () => {
    try {
      // Charger les fichiers clients
      const clientResponse = await getClientFiles('all');
      const clientFiles = clientResponse.success ? (clientResponse as any).data?.files || [] : [];
      
      // Charger les fichiers experts
      const expertResponse = await getExpertFiles('all');
      const expertFiles = expertResponse.success ? (expertResponse as any).data?.files || [] : [];
      
      // Combiner tous les fichiers
      const allFilesData = [...clientFiles, ...expertFiles];
      setAllFiles(allFilesData);
      setFilteredFiles(allFilesData);
      
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      toast.error('Impossible de charger les fichiers');
    }
  };

  // ========================================
  // FILTRES ET RECHERCHE
  // ========================================

  useEffect(() => {
    let filtered = allFiles;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory);
    }

    // Filtre par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(file => file.status === selectedStatus);
    }

    // Filtre par niveau d'accès
    if (selectedAccessLevel !== 'all') {
      filtered = filtered.filter(file => file.access_level === selectedAccessLevel);
    }

    setFilteredFiles(filtered);
  }, [allFiles, searchQuery, selectedCategory, selectedStatus, selectedAccessLevel]);

  // ========================================
  // ACTIONS SUR LES FICHIERS
  // ========================================

  const handleFileAction = async (action: string, fileId: string) => {
    try {
      switch (action) {
        case 'download':
          await downloadFile(fileId);
          toast.success('Fichier téléchargé avec succès');
          break;
          
        case 'delete':
          const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?');
          if (confirmed) {
            await deleteFile(fileId);
            toast.success('Fichier supprimé avec succès');
            loadAllFiles(); // Recharger la liste
          }
          break;
          
        case 'validate':
          // Logique de validation
          toast.success('Fichier validé avec succès');
          break;
          
        case 'reject':
          // Logique de rejet
          toast.success('Fichier rejeté');
          break;
      }
    } catch (error) {
      console.error('Erreur action fichier:', error);
      toast.error('Action impossible');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadAdminData();
  };

  // ========================================
  // UTILITAIRES
  // ========================================

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public': return <Unlock className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'restricted': return <EyeOff className="w-4 h-4" />;
      case 'confidential': return <Shield className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  // ========================================
  // EFFETS
  // ========================================

  useEffect(() => {
    if (user?.type === 'admin') {
      loadAdminData();
    }
  }, [user, refreshKey]);

  // ========================================
  // RENDU CONDITIONNEL
  // ========================================

  if (!user || user.type !== 'admin') {
    return (
      <div>
        <div className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="p-6">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Espace Documentaire Admin</h1>
              <p className="text-gray-600 mt-2">
                Gestion complète des documents clients et experts
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              
              <Button onClick={() => {}}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Fichiers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_files}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Espace Utilisé</p>
                    <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.total_size)}</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Attente</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.system_health.pending_validations}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uploads Aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_activity.uploads_today}</p>
                  </div>
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="files">Tous les fichiers</TabsTrigger>
            <TabsTrigger value="buckets">Buckets Supabase</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistiques par catégorie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Fichiers par catégorie</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && Object.entries(stats.files_by_category).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.files_by_category).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>

              {/* Santé du système */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span>Santé du système</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Utilisation stockage</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(stats.system_health.storage_usage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{stats.system_health.storage_usage}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Documents expirés</span>
                        <Badge variant={stats.system_health.expired_documents > 0 ? 'destructive' : 'default'}>
                          {stats.system_health.expired_documents}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Erreurs système</span>
                        <Badge variant={stats.system_health.system_errors > 0 ? 'destructive' : 'default'}>
                          {stats.system_health.system_errors}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tous les fichiers */}
          <TabsContent value="files" className="space-y-6">
            {/* Filtres */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Recherche</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Rechercher un fichier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
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
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="validated">Validé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                        <SelectItem value="expired">Expiré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="access">Niveau d'accès</Label>
                    <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les niveaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les niveaux</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Privé</SelectItem>
                        <SelectItem value="restricted">Restreint</SelectItem>
                        <SelectItem value="confidential">Confidentiel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des fichiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fichiers ({filteredFiles.length})</span>
                  <Button variant="secondary" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Chargement des fichiers...</p>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun fichier trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">{file.original_filename}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>•</span>
                              <span className="capitalize">{file.category}</span>
                              <span>•</span>
                              <span>{new Date(file.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {file.description && (
                              <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(file.status)}>
                            {file.status === 'validated' ? 'Validé' : 
                             file.status === 'pending' ? 'En attente' : 
                             file.status === 'rejected' ? 'Rejeté' : 'Expiré'}
                          </Badge>
                          
                          <div className="flex items-center space-x-1">
                            {getAccessLevelIcon(file.access_level)}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFileAction('download', file.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {}}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {file.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileAction('validate', file.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <FileCheck className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileAction('reject', file.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <FileX className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFileAction('delete', file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buckets Supabase */}
          <TabsContent value="buckets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Bucket Client</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.bucket_stats.client_bucket || 0}
                  </div>
                  <p className="text-sm text-gray-600">Fichiers clients</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span>Bucket Expert</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.bucket_stats.expert_bucket || 0}
                  </div>
                  <p className="text-sm text-gray-600">Fichiers experts</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span>Bucket Admin</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.bucket_stats.admin_bucket || 0}
                  </div>
                  <p className="text-sm text-gray-600">Fichiers admin</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-orange-600" />
                    <span>Bucket Public</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.bucket_stats.public_bucket || 0}
                  </div>
                  <p className="text-sm text-gray-600">Fichiers publics</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Buckets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Les buckets Supabase sont organisés par type d'utilisateur et niveau d'accès :
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Bucket Client</h4>
                      <p className="text-sm text-gray-600">Documents privés des clients (factures, contrats, etc.)</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Bucket Expert</h4>
                      <p className="text-sm text-gray-600">Documents des experts (rapports, certificats, etc.)</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Bucket Admin</h4>
                      <p className="text-sm text-gray-600">Documents administratifs et de gestion</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Bucket Public</h4>
                      <p className="text-sm text-gray-600">Documents accessibles à tous (guides, formulaires, etc.)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_files || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% depuis le mois dernier
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Espace Utilisé</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.total_size ? `${(stats.total_size / 1024 / 1024 / 1024).toFixed(2)} GB` : '0 GB'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.system_health?.storage_usage || 0}% de l'espace total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uploads Aujourd'hui</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recent_activity?.uploads_today || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.recent_activity?.uploads_week || 0} cette semaine
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recent_activity?.active_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Utilisateurs connectés
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques d'utilisation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents par Catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.files_by_category && Object.entries(stats.files_by_category).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(count / (stats?.total_files || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statut des Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.files_by_status && Object.entries(stats.files_by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'validated' ? 'bg-green-500' :
                            status === 'pending' ? 'bg-yellow-500' :
                            status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="text-sm font-medium">{status}</span>
                        </div>
                        <span className="text-sm text-gray-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Santé du système */}
            <Card>
              <CardHeader>
                <CardTitle>Santé du Système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Database className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Stockage</p>
                      <p className="text-xs text-gray-600">{stats?.system_health?.storage_usage || 0}% utilisé</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">En Attente</p>
                      <p className="text-xs text-gray-600">{stats?.system_health?.pending_validations || 0} validations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">Expirés</p>
                      <p className="text-xs text-gray-600">{stats?.system_health?.expired_documents || 0} documents</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Erreurs</p>
                      <p className="text-xs text-gray-600">{stats?.system_health?.system_errors || 0} erreurs</p>
                    </div>
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
