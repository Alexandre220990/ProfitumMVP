import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  DollarSign,
  Eye,
  FileText,
  Mail,
  Package,
  Phone,
  TrendingUp,
  Users
} from 'lucide-react';

interface ApporteurData {
  id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_type?: string;
  email?: string;
  phone?: string;
  status?: string;
  commission_rate?: number;
  created_at?: string;
  updated_at?: string;
}

interface DossierData {
  id: string;
  statut: string;
  montantFinal?: number;
  tauxFinal?: number;
  progress?: number;
  created_at: string;
  clientId?: string;
  produitId?: string;
  Client?: {
    id: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    apporteur_id?: string;
  } | null;
  ProduitEligible?: {
    id: string;
    nom?: string;
    categorie?: string;
  } | null;
}

interface ClientData {
  id: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  dossiersCount: number;
}

interface Stats {
  totalDossiers: number;
  dossiersValides: number;
  dossiersEnCours: number;
  dossiersRejetes: number;
  montantTotal: number;
  montantMoyen: number;
  tauxSucces: number;
}

interface TopProduit {
  produitId?: string;
  nom: string;
  compteur: number;
  montant: number;
}

const initialStats: Stats = {
  totalDossiers: 0,
  dossiersValides: 0,
  dossiersEnCours: 0,
  dossiersRejetes: 0,
  montantTotal: 0,
  montantMoyen: 0,
  tauxSucces: 0
};

export default function AdminApporteurSynthese() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [apporteur, setApporteur] = useState<ApporteurData | null>(null);
  const [dossiers, setDossiers] = useState<DossierData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [topProduits, setTopProduits] = useState<TopProduit[]>([]);

  useEffect(() => {
    if (id) {
      loadApporteurData(id);
    }
  }, [id]);

  const loadApporteurData = async (apporteurId: string) => {
    setLoading(true);
    try {
      const apporteurResponse = await get(`/admin/apporteurs/${apporteurId}`);
      if (!apporteurResponse.success) {
        toast.error(apporteurResponse.message || 'Apporteur introuvable');
        navigate('/admin/dashboard-optimized?section=apporteurs');
        return;
      }

      const apporteurData = (apporteurResponse.data as any)?.apporteur || apporteurResponse.data;
      setApporteur(apporteurData);

      const dossiersResponse = await get('/admin/dossiers/all');
      if (dossiersResponse.success) {
        const allDossiers: DossierData[] = (dossiersResponse.data as any)?.dossiers || [];
        const apporteurDossiers = allDossiers.filter((dossier) => {
          if (!dossier) return false;
          if ((dossier as any).apporteur_id && (dossier as any).apporteur_id === apporteurId) {
            return true;
          }
          return dossier.Client?.apporteur_id === apporteurId;
        });

        setDossiers(apporteurDossiers);

        const clientsMap = new Map<string, ClientData>();
        apporteurDossiers.forEach((dossier) => {
          if (dossier.Client) {
            const client = dossier.Client;
            const displayId = client.id;
            if (!clientsMap.has(displayId)) {
              clientsMap.set(displayId, {
                id: client.id,
                company_name: client.company_name,
                first_name: client.first_name,
                last_name: client.last_name,
                email: client.email,
                dossiersCount: 0
              });
            }
            const entry = clientsMap.get(displayId)!;
            entry.dossiersCount += 1;
          }
        });
        setClients(Array.from(clientsMap.values()));

        calculateStats(apporteurDossiers);
        calculateTopProduits(apporteurDossiers);
      }
    } catch (error) {
      console.error('Erreur chargement synthèse apporteur:', error);
      toast.error('Erreur lors du chargement des données apporteur');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apporteurDossiers: DossierData[]) => {
    const totalDossiers = apporteurDossiers.length;
    const dossiersValides = apporteurDossiers.filter((d) => d.statut === 'validated').length;
    const dossiersEnCours = apporteurDossiers.filter((d) =>
      ['pending', 'eligible', 'in_progress', 'documents_uploaded', 'eligible_confirmed'].includes(d.statut)
    ).length;
    const dossiersRejetes = apporteurDossiers.filter((d) => d.statut === 'rejected').length;

    const montants = apporteurDossiers.map((d) => d.montantFinal || 0).filter((m) => m > 0);
    const montantTotal = montants.reduce((sum, montant) => sum + montant, 0);
    const montantMoyen = montants.length > 0 ? montantTotal / montants.length : 0;
    const tauxSucces = totalDossiers > 0 ? Math.round((dossiersValides / totalDossiers) * 100) : 0;

    setStats({
      totalDossiers,
      dossiersValides,
      dossiersEnCours,
      dossiersRejetes,
      montantTotal,
      montantMoyen,
      tauxSucces
    });
  };

  const calculateTopProduits = (apporteurDossiers: DossierData[]) => {
    const produitsMap = new Map<string, TopProduit>();
    apporteurDossiers.forEach((dossier) => {
      const produitId = dossier.ProduitEligible?.id || dossier.produitId || 'unknown';
      const nom = dossier.ProduitEligible?.nom || 'Produit non renseigné';
      if (!produitsMap.has(produitId)) {
        produitsMap.set(produitId, {
          produitId: produitId !== 'unknown' ? produitId : undefined,
          nom,
          compteur: 0,
          montant: 0
        });
      }

      const entry = produitsMap.get(produitId)!;
      entry.compteur += 1;
      entry.montant += dossier.montantFinal || 0;
    });

    const ordered = Array.from(produitsMap.values())
      .sort((a, b) => b.compteur - a.compteur || b.montant - a.montant)
      .slice(0, 5);

    setTopProduits(ordered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const apporteurDisplayName = useMemo(() => {
    if (!apporteur) return 'Apporteur';
    const fullName = `${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim();
    return fullName || apporteur.company_name || apporteur.email || 'Apporteur';
  }, [apporteur]);

  const renderStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">Non défini</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Actif</Badge>;
      case 'candidature':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Candidature</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Suspendu</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!authLoading && (!user || user.type !== 'admin')) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-6 py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/dashboard-optimized?section=apporteurs')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au dashboard
        </Button>

        {loading || authLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des données apporteur...</p>
          </div>
        ) : !apporteur ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Apporteur introuvable</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-semibold">
                    {apporteurDisplayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{apporteurDisplayName}</h1>
                      {renderStatusBadge(apporteur.status)}
                      {apporteur.commission_rate !== undefined && (
                        <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                          Commission: {apporteur.commission_rate}%
                        </Badge>
                      )}
                    </div>
                    {apporteur.company_name && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        {apporteur.company_name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                      {apporteur.email && (
                        <span className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {apporteur.email}
                        </span>
                      )}
                      {apporteur.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {apporteur.phone}
                        </span>
                      )}
                      {apporteur.created_at && (
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Créé le {formatDate(apporteur.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/messagerie-admin?user=${apporteur.id}`)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contacter
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total dossiers</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDossiers}</p>
                      <p className="text-xs text-gray-500 mt-1">{stats.dossiersEnCours} en cours</p>
                    </div>
                    <FileText className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Montant total</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.montantTotal)}</p>
                      <p className="text-xs text-gray-500 mt-1">Moyenne {formatCurrency(stats.montantMoyen)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Taux de succès</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.tauxSucces}%</p>
                      <p className="text-xs text-gray-500 mt-1">{stats.dossiersValides} dossiers validés</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="profil" className="space-y-5">
              <TabsList className="bg-white shadow-sm rounded-lg">
                <TabsTrigger value="profil" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="dossiers" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dossiers ({stats.totalDossiers})
                </TabsTrigger>
                <TabsTrigger value="clients" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Clients ({clients.length})
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profil">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de l'apporteur</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="text-lg font-semibold text-gray-900">{apporteurDisplayName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{apporteur.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="text-gray-900">{apporteur.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Entreprise</p>
                        <p className="text-gray-900">{apporteur.company_name || '—'}</p>
                        {apporteur.company_type && (
                          <p className="text-sm text-gray-500 capitalize">Type: {apporteur.company_type.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Commission</p>
                        <p className="text-gray-900">{apporteur.commission_rate !== undefined ? `${apporteur.commission_rate}%` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dernière mise à jour</p>
                        <p className="text-gray-900">{formatDate(apporteur.updated_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dossiers">
                <Card>
                  <CardHeader>
                    <CardTitle>Dossiers ClientProduitEligible</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossiers.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Aucun dossier associé à cet apporteur
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dossiers.map((dossier) => (
                          <div key={dossier.id} className="p-4 border rounded-lg hover:bg-purple-50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-lg font-semibold text-gray-900">
                                    {dossier.ProduitEligible?.nom || 'Produit non renseigné'}
                                  </p>
                                  <Badge variant={dossier.statut === 'validated' ? 'default' : 'secondary'}>
                                    {dossier.statut}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Créé le {formatDate(dossier.created_at)} • Montant {formatCurrency(dossier.montantFinal || 0)}
                                </p>
                                {dossier.Client && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Client: {dossier.Client.company_name || `${dossier.Client.first_name || ''} ${dossier.Client.last_name || ''}`.trim() || dossier.Client.email}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/dossiers/${dossier.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir dossier
                                </Button>
                                {dossier.Client?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/clients/${dossier.Client!.id}`)}
                                  >
                                    <Users className="w-4 h-4 mr-2" />
                                    Client
                                  </Button>
                                )}
                                {(dossier.ProduitEligible?.id || dossier.produitId) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/produits/${dossier.ProduitEligible?.id || dossier.produitId}`)}
                                  >
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    Produit
                                  </Button>
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

              <TabsContent value="clients">
                <Card>
                  <CardHeader>
                    <CardTitle>Clients suivis ({clients.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clients.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Aucun client rattaché
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clients.map((client) => (
                          <div key={client.id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                {client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email || 'Client'}
                              </p>
                              <p className="text-sm text-gray-500">{client.dossiersCount} dossier(s)</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir fiche client
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topProduits.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Aucune donnée produit pour l'instant
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topProduits.map((produit) => (
                          <div key={produit.produitId || produit.nom} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-gray-900">{produit.nom}</p>
                              <p className="text-sm text-gray-500">{produit.compteur} dossier(s)</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Montant total</p>
                              <p className="text-lg font-semibold text-gray-900">{formatCurrency(produit.montant)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

