import { useEffect, useState } from "react";
import { useDocumentStorage } from "@/hooks/use-document-storage";
import { useAuth } from "@/hooks/use-auth";
import DocumentStorage from '@/components/documents/DocumentStorage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Clock, TrendingUp, FolderOpen, FileText, CheckCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientDocumentsData {
  files: any[];
  chartes: any[];
  audits: any[];
  simulations: any[];
  guides: any[];
  stats: {
    totalDocuments: number;
    totalChartes: number;
    chartesSignees: number;
    totalAudits: number;
    auditsEnCours: number;
    totalSimulations: number;
    simulationsCompletees: number;
    totalGuides: number;
    gainsPotentiels: number;
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number;
  };
}

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const { getClientDocuments } = useDocumentStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientDocumentsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      loadClientDocuments();
    }
  }, [user?.id]);

  const loadClientDocuments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await getClientDocuments(user.id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: response.error || 'Erreur lors du chargement des documents'
        });
      }
    } catch (error) {
      console.error('Erreur chargement documents: ', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des documents'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    toast({
      title: 'Succès',
      description: 'Document uploadé avec succès'
    });
    loadClientDocuments(); // Recharger les données
  };

  const handleFileDeleted = () => {
    toast({
      title: 'Succès',
      description: 'Document supprimé avec succès'
    });
    loadClientDocuments(); // Recharger les données
  };

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
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">Aucune donnée disponible</p>
            <p className="text-sm text-gray-400">Vos documents apparaîtront ici une fois uploadés</p>
            <button 
              onClick={loadClientDocuments}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Actualiser
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, chartes, audits, simulations } = data;

  return (
    <div className="app-professional min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gains Potentiels</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.gainsPotentiels.toLocaleString()}€
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chartes Signées</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.chartesSignees}/{stats.totalChartes}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Audits en Cours</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.auditsEnCours}/{stats.totalAudits}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="files">Fichiers</TabsTrigger>
          <TabsTrigger value="chartes">Chartes</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Composant de gestion des documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Gestion des Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentStorage 
                clientId={user?.id || ''}
                onFileUploaded={handleFileUploaded}
                onFileDeleted={handleFileDeleted}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques détaillées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Statistiques par Catégorie
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
                  Statut des Fichiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.files_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <Badge 
                        variant={status === 'validated' ? 'default' : 
                                status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progression des audits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progression des Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Audits complétés</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalAudits - stats.auditsEnCours}/{stats.totalAudits}
                  </span>
                </div>
                <Progress 
                  value={stats.totalAudits > 0 ? ((stats.totalAudits - stats.auditsEnCours) / stats.totalAudits) * 100 : 0} 
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fichiers */}
        <TabsContent value="files" className="space-y-4">
          <DocumentStorage 
            clientId={user?.id || ''}
            onFileUploaded={handleFileUploaded}
            onFileDeleted={handleFileDeleted}
          />
        </TabsContent>

        {/* Chartes */}
        <TabsContent value="chartes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chartes et Contrats</CardTitle>
            </CardHeader>
            <CardContent>
              {chartes.length > 0 ? (
                <div className="space-y-4">
                  {chartes.map((charte) => (
                    <div key={charte.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{charte.title}</h4>
                        <p className="text-sm text-gray-600">{charte.description}</p>
                      </div>
                      <Badge variant={charte.signed ? 'default' : 'secondary'}>
                        {charte.signed ? 'Signée' : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune charte disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audits */}
        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audits Énergétiques</CardTitle>
            </CardHeader>
            <CardContent>
              {audits.length > 0 ? (
                <div className="space-y-4">
                  {audits.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{audit.title}</h4>
                        <p className="text-sm text-gray-600">{audit.description}</p>
                      </div>
                      <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                        {audit.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun audit disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulations */}
        <TabsContent value="simulations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulations d'Éligibilité</CardTitle>
            </CardHeader>
            <CardContent>
              {simulations.length > 0 ? (
                <div className="space-y-4">
                  {simulations.map((simulation) => (
                    <div key={simulation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{simulation.title}</h4>
                        <p className="text-sm text-gray-600">{simulation.description}</p>
                      </div>
                      <Badge variant={simulation.completed ? 'default' : 'secondary'}>
                        {simulation.completed ? 'Terminée' : 'En cours'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune simulation disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 