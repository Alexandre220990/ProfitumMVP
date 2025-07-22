import { useState, useEffect } from 'react';
import { UnifiedDocumentSystem } from '@/components/documents/UnifiedDocumentSystem';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  BarChart3, 
  Settings, 
  Shield, 
  Users, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// PAGE DOCUMENTAIRE UNIFIÉE RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par Don Norman - Human-Centered Design
// Expérience utilisateur intuitive et accessible

export default function UnifiedDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('documents');
  const [stats, setStats] = useState<any>(null);

  // Charger les statistiques au montage
  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/unified-documents/stats/${user?.id}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les statistiques'
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

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Shield className="h-4 w-4" />;
      case 'restricted':
        return <AlertCircle className="h-4 w-4" />;
      case 'confidential':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connexion requise
          </h3>
          <p className="text-gray-500">
            Veuillez vous connecter pour accéder à vos documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec informations utilisateur */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Espace Documentaire Unifié
            </h1>
            <p className="text-blue-100">
              Gérez tous vos documents en un seul endroit
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {user.type === 'client' ? 'Client' : user.type === 'expert' ? 'Expert' : 'Administrateur'}
              </Badge>
              <span className="text-sm text-blue-100">
                {user.email}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {stats?.total_files || 0}
            </div>
            <div className="text-blue-100">Documents</div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taille totale</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatFileSize(stats.total_size)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uploads récents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.recent_uploads}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Catégories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.files_by_category).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Validés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.files_by_status?.validated || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interface principale avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mes Documents
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Onglet Documents */}
        <TabsContent value="documents" className="space-y-6">
          <UnifiedDocumentSystem 
            userId={user.id}
            userType={user.type as 'client' | 'expert' | 'admin'}
          />
        </TabsContent>

        {/* Onglet Upload */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UnifiedDocumentSystem 
                userId={user.id}
                userType={user.type as 'client' | 'expert' | 'admin'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Répartition par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.files_by_category ? (
                  <div className="space-y-4">
                    {Object.entries(stats.files_by_category).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <Badge variant="secondary">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Répartition par statut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Répartition par Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.files_by_status ? (
                  <div className="space-y-4">
                    {Object.entries(stats.files_by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status)}>
                            {status === 'uploaded' ? 'Uploadé' :
                             status === 'validated' ? 'Validé' :
                             status === 'rejected' ? 'Rejeté' :
                             status === 'archived' ? 'Archivé' :
                             status === 'deleted' ? 'Supprimé' : status}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {count as number}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Répartition par niveau d'accès */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Répartition par Niveau d'Accès
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.files_by_access_level ? (
                  <div className="space-y-4">
                    {Object.entries(stats.files_by_access_level).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getAccessLevelIcon(level)}
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {level === 'public' ? 'Public' :
                             level === 'private' ? 'Privé' :
                             level === 'restricted' ? 'Restreint' :
                             level === 'confidential' ? 'Confidentiel' : level}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {count as number}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uploads (24h)</span>
                    <Badge variant="outline">{stats?.recent_uploads || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taille moyenne</span>
                    <span className="text-sm font-medium">
                      {stats?.total_files ? formatFileSize(stats.total_size / stats.total_files) : '0 Bytes'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de validation</span>
                    <span className="text-sm font-medium">
                      {stats?.total_files && stats?.files_by_status?.validated 
                        ? Math.round((stats.files_by_status.validated / stats.total_files) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Documentaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Préférences d'Upload</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Taille maximale par fichier</span>
                      <Badge variant="outline">10 MB</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nombre max de fichiers</span>
                      <Badge variant="outline">5 fichiers</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Types autorisés</span>
                      <Badge variant="outline">PDF, Images, Documents</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Sécurité</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Chiffrement automatique</span>
                      <Badge className="bg-green-100 text-green-800">Activé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Audit trail</span>
                      <Badge className="bg-green-100 text-green-800">Activé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expiration automatique</span>
                      <Badge variant="outline">Configurable</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Uploads réussis</span>
                      <Badge className="bg-green-100 text-green-800">Activé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Erreurs d'upload</span>
                      <Badge className="bg-green-100 text-green-800">Activé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Partages de fichiers</span>
                      <Badge className="bg-green-100 text-green-800">Activé</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer informatif */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Système Documentaire Unifié
            </h3>
            <p className="text-sm text-gray-600">
              Tous vos documents centralisés avec sécurité maximale et performance optimale.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Sécurisé
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Performant
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Conforme
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 