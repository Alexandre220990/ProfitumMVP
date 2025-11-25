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
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  Handshake,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  Edit,
  RefreshCw,
  Eye,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get, put, del } from '@/lib/api';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';
import ClientTimeline from '@/components/client/ClientTimeline';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ClientData {
  id: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  statut: string;
  apporteur_id?: string;
  notes?: string;
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
  produitId?: string;
  ProduitEligible?: {
    id?: string;
    nom: string;
    categorie: string;
  };
  Expert?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    rating?: number;
    specializations?: string[];
  };
}

interface ApporteurData {
  id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone?: string;
  commission_rate?: number;
  status: string;
}

const ClientSynthese: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [dossiers, setDossiers] = useState<DossierData[]>([]);
  const [apporteur, setApporteur] = useState<ApporteurData | null>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [showDeleteNotesDialog, setShowDeleteNotesDialog] = useState(false);

  // Statistiques calculées
  const [stats, setStats] = useState({
    totalDossiers: 0,
    dossiersValides: 0,
    dossiersEnCours: 0,
    montantTotal: 0,
    montantRealise: 0,
    tauxConversion: 0
  });

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // 1. Charger les infos du client
      const clientResponse = await get(`/admin/clients/${id}`);
      if (clientResponse.success) {
        const clientData = (clientResponse.data as any)?.client;
        setClient(clientData);

        // 2. Charger l'apporteur si présent
        if (clientData?.apporteur_id) {
          const apporteurResponse = await get(`/admin/apporteurs/${clientData.apporteur_id}`);
          if (apporteurResponse.success) {
            setApporteur((apporteurResponse.data as any)?.apporteur);
          }
        }
      } else {
        toast.error('Client non trouvé');
        navigate('/admin/dashboard-optimized');
        return;
      }

      // 3. Charger tous les dossiers du client
      const dossiersResponse = await get('/admin/dossiers/all');
      if (dossiersResponse.success) {
        const allDossiers = (dossiersResponse.data as any)?.dossiers || [];
        const clientDossiers = allDossiers.filter((d: any) => d.clientId === id);
        setDossiers(clientDossiers);

        // Extraire les experts uniques
        const uniqueExperts = new Map();
        clientDossiers.forEach((d: any) => {
          if (d.Expert) {
            uniqueExperts.set(d.Expert.id, d.Expert);
          }
        });
        setExperts(Array.from(uniqueExperts.values()));

        // Calculer les stats
        const totalDossiers = clientDossiers.length;
        const dossiersValides = clientDossiers.filter((d: any) => d.statut === 'validated').length;
        const dossiersEnCours = clientDossiers.filter((d: any) => 
          d.statut === 'pending' || d.statut === 'eligible' || d.statut === 'in_progress'
        ).length;
        const montantTotal = clientDossiers.reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
        const montantRealise = clientDossiers
          .filter((d: any) => d.statut === 'validated')
          .reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
        const tauxConversion = totalDossiers > 0 ? Math.round((dossiersValides / totalDossiers) * 100) : 0;

        setStats({
          totalDossiers,
          dossiersValides,
          dossiersEnCours,
          montantTotal,
          montantRealise,
          tauxConversion
        });
      }

    } catch (error) {
      console.error('Erreur chargement données client:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'admin') {
    return <Navigate to="/login" />;
  }

  const getClientDisplayName = () => {
    if (!client) return 'N/A';
    return client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    
    try {
      const response = await put(`/admin/clients/${id}/notes`, { notes: notesValue });
      if (response.success) {
        setClient(prev => prev ? { ...prev, notes: notesValue } : null);
        setEditingNotes(false);
        toast.success('Notes mises à jour avec succès');
        // Recharger les données pour avoir la timeline à jour
        loadClientData();
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour notes:', error);
      toast.error(error?.message || 'Erreur lors de la mise à jour des notes');
    }
  };

  const handleDeleteNotes = async () => {
    if (!id) return;
    
    try {
      const response = await del(`/admin/clients/${id}/notes`);
      if (response.success) {
        setClient(prev => prev ? { ...prev, notes: undefined } : null);
        setShowDeleteNotesDialog(false);
        toast.success('Notes supprimées avec succès');
        // Recharger les données pour avoir la timeline à jour
        loadClientData();
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression notes:', error);
      toast.error(error?.message || 'Erreur lors de la suppression des notes');
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/dashboard-optimized')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Synthèse Client
            </h1>
            <p className="text-gray-600">
              {loading ? 'Chargement...' : getClientDisplayName()}
            </p>
            {client?.company_name && (
              <p className="text-sm text-gray-500">
                🏢 {client.company_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadClientData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

        {loading ? (
          <LoadingScreen />
        ) : !client ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Client non trouvé</p>
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
                  <p className="text-xs text-gray-500">{stats.tauxConversion}% de conversion</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    Montant Total
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
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    Experts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{experts.length}</p>
                  <p className="text-xs text-gray-500">experts assignés</p>
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
                  <p className="text-2xl font-bold text-indigo-600">{stats.tauxConversion}%</p>
                  <p className="text-xs text-gray-500">taux de conversion</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs : Profil | Dossiers | Experts | Apporteur | Timeline */}
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profil">Profil</TabsTrigger>
                <TabsTrigger value="dossiers">Dossiers ({stats.totalDossiers})</TabsTrigger>
                <TabsTrigger value="experts">Experts ({experts.length})</TabsTrigger>
                <TabsTrigger value="apporteur">Apporteur</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              {/* TAB PROFIL */}
              <TabsContent value="profil">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informations du Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nom / Entreprise</label>
                          <p className="text-lg font-semibold text-gray-900">{getClientDisplayName()}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </label>
                          <p className="text-gray-900">{client.email}</p>
                        </div>

                        {client.phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Téléphone
                            </label>
                            <p className="text-gray-900">{client.phone}</p>
                          </div>
                        )}

                        {client.address && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Adresse
                            </label>
                            <p className="text-gray-900">{client.address}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Statut</label>
                          <div>
                            <Badge variant={client.statut === 'active' ? 'default' : 'secondary'}>
                              {client.statut}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date de création
                          </label>
                          <p className="text-gray-900">
                            {new Date(client.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Notes internes
                            {user?.type === 'admin' && (
                              <div className="ml-auto flex gap-2">
                                {!editingNotes ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setNotesValue(client.notes || '');
                                        setEditingNotes(true);
                                      }}
                                      className="h-6 px-2"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    {client.notes && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeleteNotesDialog(true)}
                                        className="h-6 px-2 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleSaveNotes}
                                      className="h-6 px-2 text-green-600 hover:text-green-700"
                                    >
                                      <Save className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingNotes(false);
                                        setNotesValue('');
                                      }}
                                      className="h-6 px-2"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </label>
                          {editingNotes ? (
                            <div className="mt-1">
                              <Textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="Notes internes (non visibles par le client)..."
                                rows={4}
                                className="bg-white"
                              />
                              <p className="text-xs text-amber-600 mt-1">⚠️ Ces notes ne sont pas visibles par le client</p>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1">
                              {client.notes ? (
                                <>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
                                  <p className="text-xs text-amber-600 mt-2">⚠️ Ces notes ne sont pas visibles par le client</p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 italic">Aucune note interne</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600">Dernière mise à jour</label>
                          <p className="text-gray-900">
                            {new Date(client.updated_at).toLocaleDateString('fr-FR', {
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
                      Dossiers ClientProduitEligible ({dossiers.length})
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

                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
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
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>

                                {dossier.Expert && (
                                  <div className="mt-2 flex items-center gap-2 text-sm">
                                    <UserCheck className="w-4 h-4 text-blue-600" />
                                    <span className="text-gray-600">
                                      Expert: <strong>{dossier.Expert.first_name} {dossier.Expert.last_name}</strong>
                                    </span>
                                    {dossier.Expert.rating && (
                                      <span className="text-yellow-600">⭐ {dossier.Expert.rating}/5</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    navigate(`/admin/dossiers/${dossier.id}`);
                                  }}
                                  title="Ouvrir la synthèse du dossier"
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
                        <p>Aucun dossier pour ce client</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB EXPERTS */}
              <TabsContent value="experts">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Experts Assignés ({experts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experts.length > 0 ? (
                      <div className="space-y-3">
                        {experts.map((expert: any) => (
                          <div key={expert.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">
                                    {`${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name}
                                  </h4>
                                  {expert.rating && (
                                    <span className="text-sm text-yellow-600">
                                      ⭐ {expert.rating}/5
                                    </span>
                                  )}
                                </div>

                                {expert.company_name && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    🏢 {expert.company_name}
                                  </p>
                                )}

                                {expert.specializations && expert.specializations.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {expert.specializations.slice(0, 3).map((spec: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {spec}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                <p className="text-xs text-gray-500 mt-2">
                                  Dossiers gérés: {dossiers.filter(d => d.Expert?.id === expert.id).length}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun expert assigné</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB APPORTEUR */}
              <TabsContent value="apporteur">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Handshake className="w-5 h-5" />
                      Apporteur d'Affaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apporteur ? (
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">
                                {`${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim() || apporteur.company_name}
                              </h4>
                              <Badge variant={
                                apporteur.status === 'active' ? 'default' : 'secondary'
                              }>
                                {apporteur.status}
                              </Badge>
                            </div>

                            {apporteur.company_name && (
                              <p className="text-sm text-gray-600 mb-2">
                                🏢 {apporteur.company_name}
                              </p>
                            )}

                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {apporteur.email}
                              </p>
                              {apporteur.phone && (
                                <p className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {apporteur.phone}
                                </p>
                              )}
                              {apporteur.commission_rate && (
                                <p className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  Commission: <strong>{apporteur.commission_rate}%</strong>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun apporteur d'affaires associé</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB TIMELINE */}
              <TabsContent value="timeline">
                {id && (
                  <ClientTimeline 
                    clientId={id} 
                    userType={user?.type as 'expert' | 'admin' | 'apporteur'}
                    clientInfo={{
                      name: client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : undefined,
                      company_name: client?.company_name,
                      phone_number: client?.phone,
                      email: client?.email
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Dialog de confirmation suppression notes */}
        <Dialog open={showDeleteNotesDialog} onOpenChange={setShowDeleteNotesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer les notes internes</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer les notes internes de ce client ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteNotesDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteNotes}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default ClientSynthese;

