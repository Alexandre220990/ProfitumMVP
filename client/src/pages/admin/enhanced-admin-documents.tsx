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
  Settings,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { EnhancedDocumentUpload } from '@/components/documents/EnhancedDocumentUpload';
import { useToast } from '@/hooks/use-toast';

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
}

export default function EnhancedAdminDocumentsPage() {
  const { user } = useAuth();
  const { getClientFiles, getExpertFiles, deleteFile, downloadFile } = useEnhancedDocumentStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDocumentStats | null>(null);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [expertFiles, setExpertFiles] = useState<any[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<'client' | 'expert'>('client');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadAdminData();
    }
  }, [user?.id, refreshKey]);

  const loadAdminData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Charger les statistiques globales
      const globalStats = await loadGlobalStats();
      setStats(globalStats);
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async (): Promise<AdminDocumentStats> => {
    try {
      // Simuler des appels API pour les statistiques globales
      // Dans un vrai système, ces appels seraient vers des endpoints dédiés
      const mockStats: AdminDocumentStats = {
        total_files: 1250,
        total_size: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
        files_by_category: {
          'charte': 150,
          'rapport': 300,
          'audit': 200,
          'simulation': 100,
          'guide': 250,
          'facture': 150,
          'contrat': 100
        },
        files_by_status: {
          'pending': 45,
          'approved': 1100,
          'rejected': 25,
          'requires_revision': 80
        },
        files_by_user_type: { 
          client: 800, 
          expert: 350, 
          admin: 100 
        },
        recent_activity: {
          uploads_today: 25,
          uploads_week: 150,
          downloads_today: 180,
          active_users: 45
        },
        system_health: {
          storage_usage: 75, // 75% utilisé
          pending_validations: 45,
          expired_documents: 12,
          system_errors: 0
        }
      };

      return mockStats;
    } catch (error) {
      console.error('Erreur chargement stats globales:', error);
      throw error;
    }
  };

  const loadUserFiles = async (userId: string, userType: 'client' | 'expert') => {
    if (!userId) return;

    try {
      let response;
      if (userType === 'client') {
        response = await getClientFiles(userId);
        if (response.success) {
          setClientFiles(response.data?.files || []);
        }
      } else {
        response = await getExpertFiles(userId);
        if (response.success) {
          setExpertFiles(response.data?.files || []);
        }
      }
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des fichiers'
      });
    }
  };

  const handleFileUploaded = () => {
    toast({
      title: 'Succès',
      description: 'Document uploadé avec succès'
    });
    setRefreshKey(prev => prev + 1); // Forcer le rechargement
  };

  const handleFileDeleted = async (fileId: string) => {
    const result = await deleteFile(fileId);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès'
      });
      setRefreshKey(prev => prev + 1); // Forcer le rechargement
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Actualisation',
      description: 'Données actualisées'
    });
  };

  const getStorageUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSystemHealthIcon = (errors: number) => {
    if (errors === 0) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (errors < 5) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👨‍💼 Administration Documents</h1>
            <p className="text-gray-600">Gestion centralisée des documents clients et experts</p>
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
          <TabsTrigger value="upload">Upload Admin</TabsTrigger>
          <TabsTrigger value="manage">Gestion Documents</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total fichiers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_files.toLocaleString()}</p>
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
                      {(stats.total_size / 1024 / 1024 / 1024).toFixed(1)} GB
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documents clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.files_by_user_type.client.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documents experts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.files_by_user_type.expert.toLocaleString()}</p>
                  </div>
                  <Settings className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activité récente et santé système */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Uploads aujourd'hui</span>
                    <Badge variant="secondary">{stats.recent_activity.uploads_today}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Uploads cette semaine</span>
                    <Badge variant="secondary">{stats.recent_activity.uploads_week}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Téléchargements aujourd'hui</span>
                    <Badge variant="secondary">{stats.recent_activity.downloads_today}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Utilisateurs actifs</span>
                    <Badge variant="secondary">{stats.recent_activity.active_users}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSystemHealthIcon(stats.system_health.system_errors)}
                  Santé du Système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Utilisation stockage</span>
                    <span className={`text-sm font-bold ${getStorageUsageColor(stats.system_health.storage_usage)}`}>
                      {stats.system_health.storage_usage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Validations en attente</span>
                    <Badge variant="secondary">{stats.system_health.pending_validations}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Documents expirés</span>
                    <Badge variant="destructive">{stats.system_health.expired_documents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Erreurs système</span>
                    <Badge variant={stats.system_health.system_errors > 0 ? "destructive" : "secondary"}>
                      {stats.system_health.system_errors}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.files_by_category).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count.toLocaleString()}</Badge>
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
                  {Object.entries(stats.files_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Documents Administratifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedDocumentUpload 
                clientId={user?.id || ''}
                onUploadComplete={handleFileUploaded}
                onUploadError={(error) => {
                  toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: error
                  });
                }}
                showAdvancedOptions={true}
                defaultCategory="guide"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sélecteur de type d'utilisateur */}
                <div className="flex items-center space-x-4">
                  <Label>Type d'utilisateur:</Label>
                  <Select value={selectedUserType} onValueChange={(value: 'client' | 'expert') => setSelectedUserType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sélecteur d'utilisateur */}
                <div className="flex items-center space-x-4">
                  <Label>Utilisateur:</Label>
                  <Input
                    placeholder="ID de l'utilisateur"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={() => loadUserFiles(selectedUserId, selectedUserType)}>
                    Charger
                  </Button>
                </div>

                {/* Recherche */}
                <div className="flex items-center space-x-4">
                  <Label>Recherche:</Label>
                  <Input
                    placeholder="Rechercher dans les fichiers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>

                {/* Liste des fichiers */}
                <div className="space-y-2">
                  {(selectedUserType === 'client' ? clientFiles : expertFiles)
                    .filter(file => 
                      file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      file.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="font-medium">{file.original_filename}</p>
                            <p className="text-sm text-gray-600">
                              {file.category} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Les permissions sont gérées automatiquement selon les politiques RLS configurées :
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li><strong>Clients :</strong> Accès à leurs propres documents</li>
                  <li><strong>Experts :</strong> Accès à leurs documents et ceux de leurs clients assignés</li>
                  <li><strong>Admins :</strong> Accès complet à tous les documents</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Les permissions sont appliquées au niveau des buckets Supabase 
                    et ne peuvent être modifiées que via les politiques RLS dans la base de données.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Avancées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Métriques de Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Temps de réponse moyen</span>
                      <span className="text-sm font-medium">78ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Disponibilité</span>
                      <span className="text-sm font-medium text-green-600">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Requêtes simultanées</span>
                      <span className="text-sm font-medium">100+</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Tendances</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Croissance documents</span>
                      <span className="text-sm font-medium text-green-600">+15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Utilisateurs actifs</span>
                      <span className="text-sm font-medium text-green-600">+8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taux de validation</span>
                      <span className="text-sm font-medium text-green-600">94%</span>
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
