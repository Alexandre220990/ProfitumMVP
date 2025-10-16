import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  Edit,
  RefreshCw,
  Eye,
  Award,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';

interface ExpertData {
  id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone?: string;
  approval_status: string;
  rating?: number;
  specializations?: string[];
  status?: string;
  created_at: string;
  updated_at: string;
}

interface DossierData {
  id: string;
  statut: string;
  montantFinal?: number;
  tauxFinal?: number;
  progress?: number;
  created_at: string;
  clientId: string;
  Client?: {
    id: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
  };
  ProduitEligible?: {
    nom: string;
    categorie: string;
  };
}

interface ClientData {
  id: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  dossiersCount: number;
}

const ExpertSynthese: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [dossiers, setDossiers] = useState<DossierData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);

  // Statistiques calculées
  const [stats, setStats] = useState({
    totalDossiers: 0,
    dossiersValides: 0,
    dossiersEnCours: 0,
    montantTotal: 0,
    montantRealise: 0,
    tauxSucces: 0,
    clientsUniques: 0
  });

  useEffect(() => {
    if (id) {
      loadExpertData();
    }
  }, [id]);

  const loadExpertData = async () => {
    setLoading(true);
    try {
      // 1. Charger les infos de l'expert
      const expertResponse = await get(`/admin/experts/${id}`);
      if (expertResponse.success) {
        const expertData = (expertResponse.data as any)?.expert;
        setExpert(expertData);
      } else {
        toast.error('Expert non trouvé');
        navigate('/admin/dashboard');
        return;
      }

      // 2. Charger tous les dossiers assignés à cet expert
      const dossiersResponse = await get('/admin/dossiers/all');
      if (dossiersResponse.success) {
        const allDossiers = (dossiersResponse.data as any)?.dossiers || [];
        const expertDossiers = allDossiers.filter((d: any) => d.expert_id === id);
        setDossiers(expertDossiers);

        // Extraire les clients uniques
        const uniqueClients = new Map();
        expertDossiers.forEach((d: any) => {
          if (d.Client) {
            const clientId = d.Client.id;
            if (!uniqueClients.has(clientId)) {
              uniqueClients.set(clientId, {
                ...d.Client,
                dossiersCount: 0
              });
            }
            const client = uniqueClients.get(clientId);
            client.dossiersCount += 1;
          }
        });
        setClients(Array.from(uniqueClients.values()));

        // Calculer les stats
        const totalDossiers = expertDossiers.length;
        const dossiersValides = expertDossiers.filter((d: any) => d.statut === 'validated').length;
        const dossiersEnCours = expertDossiers.filter((d: any) => 
          d.statut === 'pending' || d.statut === 'eligible' || d.statut === 'in_progress'
        ).length;
        const montantTotal = expertDossiers.reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
        const montantRealise = expertDossiers
          .filter((d: any) => d.statut === 'validated')
          .reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
        const tauxSucces = totalDossiers > 0 ? Math.round((dossiersValides / totalDossiers) * 100) : 0;

        setStats({
          totalDossiers,
          dossiersValides,
          dossiersEnCours,
          montantTotal,
          montantRealise,
          tauxSucces,
          clientsUniques: uniqueClients.size
        });
      }

    } catch (error) {
      console.error('Erreur chargement données expert:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'admin') {
    return <Navigate to="/login" />;
  }

  const getExpertDisplayName = () => {
    if (!expert) return 'N/A';
    return `${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name || expert.email;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Synthèse Expert
              </h1>
              <p className="text-gray-600">
                {loading ? 'Chargement...' : getExpertDisplayName()}
              </p>
              {expert?.company_name && (
                <p className="text-sm text-gray-500">
                  🏢 {expert.company_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {expert?.rating && (
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-lg">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">{expert.rating}/5</span>
                </div>
              )}
              <Button variant="outline" onClick={loadExpertData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement des données...</span>
          </div>
        ) : !expert ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Expert non trouvé</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Dossiers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDossiers}</p>
                  <p className="text-xs text-gray-500">{stats.dossiersEnCours} en cours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Validés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.dossiersValides}</p>
                  <p className="text-xs text-gray-500">{stats.tauxSucces}% de succès</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    Montant Géré
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.montantTotal.toLocaleString('fr-FR')}€
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.montantRealise.toLocaleString('fr-FR')}€ réalisé
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{stats.clientsUniques}</p>
                  <p className="text-xs text-gray-500">clients gérés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-indigo-600">{stats.tauxSucces}%</p>
                  <p className="text-xs text-gray-500">taux de succès</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs : Profil | Dossiers | Clients | Performance */}
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profil">Profil</TabsTrigger>
                <TabsTrigger value="dossiers">Dossiers ({stats.totalDossiers})</TabsTrigger>
                <TabsTrigger value="clients">Clients ({stats.clientsUniques})</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* TAB PROFIL */}
              <TabsContent value="profil">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informations de l'Expert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nom Complet</label>
                          <p className="text-lg font-semibold text-gray-900">{getExpertDisplayName()}</p>
                        </div>

                        {expert.company_name && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              Entreprise
                            </label>
                            <p className="text-gray-900">{expert.company_name}</p>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </label>
                          <p className="text-gray-900">{expert.email}</p>
                        </div>

                        {expert.phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Téléphone
                            </label>
                            <p className="text-gray-900">{expert.phone}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Statut d'approbation</label>
                          <div>
                            <Badge variant={
                              expert.approval_status === 'approved' ? 'default' :
                              expert.approval_status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {expert.approval_status}
                            </Badge>
                          </div>
                        </div>

                        {expert.rating && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Évaluation
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-yellow-600">
                                {expert.rating}/5
                              </span>
                              <span className="text-yellow-500">{'⭐'.repeat(Math.round(expert.rating))}</span>
                            </div>
                          </div>
                        )}

                        {expert.specializations && expert.specializations.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Spécialisations</label>
                            <div className="flex flex-wrap gap-2">
                              {expert.specializations.map((spec: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date d'inscription
                          </label>
                          <p className="text-gray-900">
                            {new Date(expert.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier le profil
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB DOSSIERS */}
              <TabsContent value="dossiers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Dossiers Assignés ({dossiers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossiers.length > 0 ? (
                      <div className="space-y-3">
                        {dossiers.map((dossier: DossierData) => (
                          <div key={dossier.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={
                                    dossier.statut === 'eligible' ? 'default' :
                                    dossier.statut === 'validated' ? 'default' :
                                    dossier.statut === 'pending' ? 'secondary' : 'outline'
                                  }>
                                    {dossier.statut}
                                  </Badge>
                                  <h4 className="font-semibold text-gray-800">
                                    {dossier.ProduitEligible?.nom || 'N/A'}
                                  </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-green-600" />
                                    <span>
                                      {dossier.Client?.company_name || 
                                       `${dossier.Client?.first_name || ''} ${dossier.Client?.last_name || ''}`.trim() || 
                                       'N/A'}
                                    </span>
                                  </div>
                                  {dossier.montantFinal && (
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-green-600" />
                                      <span className="font-medium text-green-600">
                                        {dossier.montantFinal.toLocaleString('fr-FR')}€
                                      </span>
                                    </div>
                                  )}
                                  {dossier.tauxFinal && (
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-blue-600" />
                                      <span className="font-medium text-blue-600">
                                        {dossier.tauxFinal}%
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Progress: {dossier.progress || 0}%
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/admin/clients/${dossier.Client?.id}`)}
                                  title="Voir le client"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun dossier assigné à cet expert</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB CLIENTS */}
              <TabsContent value="clients">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Clients Gérés ({clients.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clients.length > 0 ? (
                      <div className="space-y-3">
                        {clients.map((client: ClientData) => (
                          <div key={client.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  {client.company_name || 
                                   `${client.first_name || ''} ${client.last_name || ''}`.trim() || 
                                   'N/A'}
                                </h4>

                                <div className="space-y-1 text-sm text-gray-600">
                                  <p className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {client.email}
                                  </p>
                                  {client.phone && (
                                    <p className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      {client.phone}
                                    </p>
                                  )}
                                  <p className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <strong>{client.dossiersCount}</strong> dossier{client.dossiersCount > 1 ? 's' : ''} géré{client.dossiersCount > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>

                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/admin/clients/${client.id}`)}
                                title="Voir le client"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun client géré</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB PERFORMANCE */}
              <TabsContent value="performance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Statistiques détaillées */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Statistiques Détaillées
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-gray-700">Dossiers total</span>
                          <span className="text-lg font-bold text-blue-600">{stats.totalDossiers}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-gray-700">Dossiers validés</span>
                          <span className="text-lg font-bold text-green-600">{stats.dossiersValides}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm text-gray-700">Dossiers en cours</span>
                          <span className="text-lg font-bold text-yellow-600">{stats.dossiersEnCours}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm text-gray-700">Montant total géré</span>
                          <span className="text-lg font-bold text-purple-600">
                            {stats.montantTotal.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                          <span className="text-sm text-gray-700">Montant réalisé</span>
                          <span className="text-lg font-bold text-indigo-600">
                            {stats.montantRealise.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                          <span className="text-sm text-gray-700">Taux de succès</span>
                          <span className="text-lg font-bold text-emerald-600">{stats.tauxSucces}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Répartition par statut */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        Répartition des Dossiers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { statut: 'validated', label: 'Validés', color: 'green' },
                          { statut: 'eligible', label: 'Éligibles', color: 'blue' },
                          { statut: 'pending', label: 'En attente', color: 'yellow' },
                          { statut: 'in_progress', label: 'En cours', color: 'indigo' },
                          { statut: 'rejected', label: 'Rejetés', color: 'red' }
                        ].map(({ statut, label, color }) => {
                          const count = dossiers.filter(d => d.statut === statut).length;
                          const percentage = stats.totalDossiers > 0 
                            ? Math.round((count / stats.totalDossiers) * 100) 
                            : 0;
                          
                          return count > 0 ? (
                            <div key={statut}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-700">{label}</span>
                                <span className="text-sm font-semibold">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`bg-${color}-600 h-2 rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : null;
                        })}
                        
                        {dossiers.length === 0 && (
                          <p className="text-center text-gray-500 py-8">
                            Aucun dossier pour calculer les statistiques
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExpertSynthese;

