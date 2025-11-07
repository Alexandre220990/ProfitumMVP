/**
 * 📦 PAGE SYNTHÈSE PRODUIT
 * Vue complète d'un produit éligible avec statistiques commerciales
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { get } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Package, TrendingUp, Users, FileText,
  DollarSign, Calendar, Edit, Activity, Target,
  CheckCircle, XCircle, Clock
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ProduitEligible {
  id: string;
  nom: string;
  description: string;
  categorie?: string;
  montant_min?: number;
  montant_max?: number;
  taux_min?: number;
  taux_max?: number;
  duree_min?: number;
  duree_max?: number;
  active?: boolean;
  type_produit?: string;
  created_at: string;
  updated_at: string;
}

interface ProduitStats {
  total_dossiers: number;
  dossiers_valides: number;
  dossiers_en_cours: number;
  dossiers_rejetes: number;
  montant_total: number;
  montant_moyen: number;
  montant_min_reel: number;
  montant_max_reel: number;
  taux_moyen: number;
  taux_min_reel: number;
  taux_max_reel: number;
}

interface TopClient {
  company_name: string;
  email: string;
  nombre_dossiers: number;
  montant_total: number;
  montant_moyen: number;
}

interface EvolutionData {
  mois: string;
  nombre_dossiers: number;
  montant_total: number;
  montant_moyen: number;
}

interface TimelineEvent {
  id: string;
  date?: string;
  statut: string;
  montant: number;
  client: string;
  dossierLink: string;
  clientLink?: string | null;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ProduitSynthese() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [produit, setProduit] = useState<ProduitEligible | null>(null);
  const [stats, setStats] = useState<ProduitStats | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [evolution, setEvolution] = useState<EvolutionData[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    description: '',
    categorie: '',
    type_produit: 'financier',
    montant_min: '',
    montant_max: '',
    taux_min: '',
    taux_max: '',
    duree_min: '',
    duree_max: '',
    active: true
  });

  // ============================================================================
  // CHARGEMENT DONNÉES
  // ============================================================================

  useEffect(() => {
    if (id) {
      loadProduitData();
    }
  }, [id]);

  const loadProduitData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement produit:', id);

      // Charger les infos du produit
      const produitResponse = await get(`/admin/produits/${id}`) as any;
      if (produitResponse.success && produitResponse.data) {
        const produitData = produitResponse.data.produit || produitResponse.data;
        setProduit(produitData);
        setEditForm({
          nom: produitData.nom || '',
          description: produitData.description || '',
          categorie: produitData.categorie || '',
          type_produit: produitData.type_produit || 'financier',
          montant_min: produitData.montant_min !== null && produitData.montant_min !== undefined ? produitData.montant_min.toString() : '',
          montant_max: produitData.montant_max !== null && produitData.montant_max !== undefined ? produitData.montant_max.toString() : '',
          taux_min: produitData.taux_min !== null && produitData.taux_min !== undefined ? produitData.taux_min.toString() : '',
          taux_max: produitData.taux_max !== null && produitData.taux_max !== undefined ? produitData.taux_max.toString() : '',
          duree_min: produitData.duree_min !== null && produitData.duree_min !== undefined ? produitData.duree_min.toString() : '',
          duree_max: produitData.duree_max !== null && produitData.duree_max !== undefined ? produitData.duree_max.toString() : '',
          active: produitData.active !== false
        });
      }

      // Charger les statistiques
      const statsResponse = await get(`/admin/produits/${id}/stats`) as any;
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.stats);
      }

      // Charger les top clients
      const topClientsResponse = await get(`/admin/produits/${id}/top-clients`) as any;
      if (topClientsResponse.success && topClientsResponse.data) {
        setTopClients(topClientsResponse.data.topClients || []);
      }

      // Charger l'évolution
      const evolutionResponse = await get(`/admin/produits/${id}/evolution`) as any;
      if (evolutionResponse.success && evolutionResponse.data) {
        setEvolution(evolutionResponse.data.evolution || []);
      }

      // Charger les dossiers liés
      const dossiersResponse = await get(`/admin/produits/${id}/dossiers`) as any;
      if (dossiersResponse.success && dossiersResponse.data) {
        setDossiers(dossiersResponse.data.dossiers || []);
      }

    } catch (error) {
      console.error('❌ Erreur chargement produit:', error);
      toast.error('Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!dossiers || dossiers.length === 0) return [];

    return [...dossiers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((dossier: any) => ({
        id: dossier.id,
        date: dossier.created_at,
        statut: dossier.statut,
        montant: dossier.montantFinal || 0,
        client:
          dossier.Client?.company_name ||
          `${dossier.Client?.first_name || ''} ${dossier.Client?.last_name || ''}`.trim() ||
          dossier.Client?.email ||
          'Client inconnu',
        dossierLink: `/admin/dossiers/${dossier.id}`,
        clientLink: dossier.Client?.id ? `/admin/clients/${dossier.Client.id}` : null
      }));
  }, [dossiers]);

  // ============================================================================
  // AUTHENTIFICATION
  // ============================================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.type !== 'admin') {
    return <Navigate to="/connect-admin" replace />;
  }

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/dashboard-optimized')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Dashboard
        </Button>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du produit...</p>
          </div>
        ) : !produit ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Produit non trouvé</p>
          </div>
        ) : (
          <>
            {/* En-tête Produit */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{produit.nom}</h1>
                      <Badge variant={produit.active ? 'default' : 'secondary'} className={produit.active ? 'bg-green-100 text-green-800' : ''}>
                        {produit.active ? 'Actif' : 'Inactif'}
                      </Badge>
                      {produit.type_produit && (
                        <Badge variant="outline">{produit.type_produit}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{produit.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📦 Catégorie: {produit.categorie || 'N/A'}</span>
                      <span>📅 Créé le {formatDate(produit.created_at)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>

            {/* Onglets */}
            <Tabs defaultValue="informations" className="space-y-6">
              <TabsList className="bg-white p-1 rounded-lg shadow-sm">
                <TabsTrigger value="informations" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Informations
                </TabsTrigger>
                <TabsTrigger value="commercial" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Commercial
                </TabsTrigger>
                <TabsTrigger value="dossiers" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dossiers ({stats?.total_dossiers || 0})
                </TabsTrigger>
              </TabsList>

              {/* ONGLET INFORMATIONS */}
              <TabsContent value="informations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Caractéristiques</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Montants</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {produit.montant_min && produit.montant_max
                            ? `${formatCurrency(produit.montant_min)} - ${formatCurrency(produit.montant_max)}`
                            : 'Non défini'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Taux</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {produit.taux_min !== null && produit.taux_min !== undefined && produit.taux_max !== null && produit.taux_max !== undefined
                            ? `${(produit.taux_min * 100).toFixed(1)}% - ${(produit.taux_max * 100).toFixed(1)}%`
                            : 'Non défini'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Durée</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {produit.duree_min && produit.duree_max
                            ? `${produit.duree_min} - ${produit.duree_max} mois`
                            : 'Non définie'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Métadonnées</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date de création</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(produit.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Dernière modification</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(produit.updated_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Type</p>
                        <Badge variant="outline">{produit.type_produit || 'Non défini'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ONGLET COMMERCIAL */}
              <TabsContent value="commercial">
                {/* KPIs Commerciaux */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Dossiers</p>
                          <p className="text-2xl font-bold text-blue-600">{stats?.total_dossiers || 0}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Validés</p>
                          <p className="text-2xl font-bold text-green-600">{stats?.dossiers_valides || 0}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">En cours</p>
                          <p className="text-2xl font-bold text-orange-600">{stats?.dossiers_en_cours || 0}</p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-600 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Rejetés</p>
                          <p className="text-2xl font-bold text-red-600">{stats?.dossiers_rejetes || 0}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Montants */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Montant Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(stats?.montant_total || 0)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Montant cumulé de tous les dossiers</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Montant Moyen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(stats?.montant_moyen || 0)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Par dossier</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Taux Moyen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">
                        {((stats?.taux_moyen || 0) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Taux appliqué moyen</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Évolution temporelle */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Évolution sur 12 derniers mois
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {evolution.length > 0 ? (
                      <div className="space-y-2">
                        {evolution.map((item) => (
                          <div key={item.mois} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.mois}</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <p className="text-gray-500">Dossiers</p>
                                <p className="font-bold text-blue-600">{item.nombre_dossiers}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Montant total</p>
                                <p className="font-bold text-green-600">{formatCurrency(item.montant_total)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Montant moyen</p>
                                <p className="font-bold text-purple-600">{formatCurrency(item.montant_moyen)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Aucune donnée d'évolution</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Clients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Top 5 Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topClients.length > 0 ? (
                      <div className="space-y-3">
                        {topClients.map((client, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{client.company_name}</p>
                              <p className="text-sm text-gray-500">{client.email}</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-right">
                                <p className="text-gray-500">Dossiers</p>
                                <p className="font-bold text-blue-600">{client.nombre_dossiers}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500">Montant total</p>
                                <p className="font-bold text-green-600">{formatCurrency(client.montant_total)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500">Montant moyen</p>
                                <p className="font-bold text-purple-600">{formatCurrency(client.montant_moyen)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Aucun client pour ce produit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ONGLET DOSSIERS */}
              <TabsContent value="dossiers">
                <Card>
                  <CardHeader>
                    <CardTitle>Dossiers ClientProduitEligible</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossiers.length > 0 ? (
                      <div className="space-y-2">
                        {dossiers.map((dossier) => (
                          <div key={dossier.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">
                                    {dossier.Client?.company_name || `Client #${dossier.clientId}`}
                                  </p>
                                  <Badge variant={dossier.statut === 'validated' ? 'default' : 'secondary'}>
                                    {dossier.statut}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  📅 {formatDate(dossier.created_at)} • 💰 {dossier.montantFinal ? formatCurrency(dossier.montantFinal) : 'N/A'}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/clients/${dossier.clientId}`)}
                              >
                                Voir client
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Aucun dossier pour ce produit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <div className="container mx-auto px-6 pb-10">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Historique des dossiers ({timelineEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                Aucune activité enregistrée pour ce produit.
              </div>
            ) : (
              <div className="relative pl-5 space-y-5">
                <div className="absolute left-2 top-1 bottom-2 w-0.5 bg-gradient-to-b from-orange-200 via-purple-200 to-blue-200" />
                {timelineEvents.map((event: TimelineEvent) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-6 top-2 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-orange-200 bg-orange-500" />
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 hover:border-orange-200 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-500">{formatDateTime(event.date)}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            Dossier {event.id.slice(0, 8)} • {event.statut}
                          </p>
                          <p className="text-sm text-gray-600">
                            Client : <span className="font-medium text-gray-900">{event.client}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Montant : <span className="font-medium text-gray-900">{formatCurrency(event.montant)}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(event.dossierLink)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Voir dossier
                          </Button>
                          {event.clientLink && (
                            <Button variant="ghost" size="sm" onClick={() => navigate(event.clientLink!)}>
                              <Users className="w-4 h-4 mr-2" />
                              Fiche client
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="col-span-1 md:col-span-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={editForm.nom}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nom: e.target.value }))}
                placeholder="Nom du produit"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="categorie">Catégorie</Label>
              <Input
                id="categorie"
                value={editForm.categorie}
                onChange={(e) => setEditForm((prev) => ({ ...prev, categorie: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="type_produit">Type de produit</Label>
              <Input
                id="type_produit"
                value={editForm.type_produit}
                onChange={(e) => setEditForm((prev) => ({ ...prev, type_produit: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="montant_min">Montant minimum (€)</Label>
              <Input
                id="montant_min"
                type="number"
                value={editForm.montant_min}
                onChange={(e) => setEditForm((prev) => ({ ...prev, montant_min: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="montant_max">Montant maximum (€)</Label>
              <Input
                id="montant_max"
                type="number"
                value={editForm.montant_max}
                onChange={(e) => setEditForm((prev) => ({ ...prev, montant_max: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="taux_min">Taux minimum (%)</Label>
              <Input
                id="taux_min"
                type="number"
                step="0.01"
                value={editForm.taux_min}
                onChange={(e) => setEditForm((prev) => ({ ...prev, taux_min: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="taux_max">Taux maximum (%)</Label>
              <Input
                id="taux_max"
                type="number"
                step="0.01"
                value={editForm.taux_max}
                onChange={(e) => setEditForm((prev) => ({ ...prev, taux_max: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="duree_min">Durée minimum (mois)</Label>
              <Input
                id="duree_min"
                type="number"
                value={editForm.duree_min}
                onChange={(e) => setEditForm((prev) => ({ ...prev, duree_min: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="duree_max">Durée maximum (mois)</Label>
              <Input
                id="duree_max"
                type="number"
                value={editForm.duree_max}
                onChange={(e) => setEditForm((prev) => ({ ...prev, duree_max: e.target.value }))}
              />
            </div>
            <div className="col-span-1 md:col-span-2 flex items-center gap-2">
              <Checkbox
                id="active"
                checked={editForm.active}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, active: Boolean(checked) }))}
              />
              <Label htmlFor="active">Produit actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              onClick={async () => {
                if (!produit?.id) return;
                setIsSaving(true);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    toast.error('Session expirée, veuillez vous reconnecter');
                    return;
                  }

                  const payload = {
                    nom: editForm.nom,
                    description: editForm.description,
                    categorie: editForm.categorie || null,
                    type_produit: editForm.type_produit || null,
                    active: editForm.active,
                    montant_min: editForm.montant_min ? parseFloat(editForm.montant_min) : null,
                    montant_max: editForm.montant_max ? parseFloat(editForm.montant_max) : null,
                    taux_min: editForm.taux_min ? parseFloat(editForm.taux_min) : null,
                    taux_max: editForm.taux_max ? parseFloat(editForm.taux_max) : null,
                    duree_min: editForm.duree_min ? parseInt(editForm.duree_min) : null,
                    duree_max: editForm.duree_max ? parseInt(editForm.duree_max) : null
                  };

                  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/produits/${produit.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                  });

                  if (response.ok) {
                    toast.success('Produit mis à jour');
                    setShowEditModal(false);
                    loadProduitData();
                  } else {
                    const error = await response.json().catch(() => null);
                    toast.error(error?.message || 'Erreur lors de la mise à jour');
                  }
                } catch (error) {
                  console.error('Erreur mise à jour produit:', error);
                  toast.error('Erreur lors de la mise à jour du produit');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

