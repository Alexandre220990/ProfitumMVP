import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Plus, ChevronsUpDown, Trash2, ChevronUp, ChevronDown, FolderOpen, Package, FileText, Users, TrendingUp } from "lucide-react";

// Types pour les ProduitEligible
interface ProduitEligible { id: string;
  nom: string;
  description: string;
  categorie?: string;
  montant_min?: number;
  montant_max?: number;
  taux_min?: number;
  taux_max?: number;
  duree_min?: number;
  duree_max?: number;
  created_at: string;
  updated_at: string }

// Types pour les ClientProduitEligible (Dossiers)
interface Dossier { id: string;
  client_id: string;
  produit_eligible_id: string;
  validation_state: string;
  expert_id?: string;
  created_at: string;
  updated_at: string;
  montant?: number;
  taux?: number;
  duree?: number;
  current_step?: number;
  progress?: number;
  Client: {
    id: string;
    email: string;
    company_name: string;
    phone_number?: string; };
  ProduitEligible: { id: string;
    nom: string;
    description: string; };
  Expert?: { id: string;
    name: string;
    email: string;
    company_name: string; };
}

// Types pour les statistiques
interface DossierStats { totalDossiers: number;
  dossiersAvecExpert: number;
  dossiersSansExpert: number;
  repartitionStatut: Record<string, number>;
  repartitionProduit: Record<string, number>;
  totalMontant: number;
  montantMoyen: number 
}

export default function GestionDossiers() { const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dossiers');
  
  // États pour les dossiers
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [stats, setStats] = useState<DossierStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // États pour les produits
  const [produits, setProduits] = useState<ProduitEligible[]>([]);
  const [loadingProduits, setLoadingProduits] = useState(true);
  
  // Filtres et pagination pour dossiers
  const [filters, setFilters] = useState({ search: '', status: 'all', client: 'all', produit: 'all', expert: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // États de tri pour les produits
  const [sortByProduit, setSortByProduit] = useState('nom');
  const [sortOrderProduit, setSortOrderProduit] = useState<'asc' | 'desc'>('asc');

  // États pour les modales
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [selectedProduit, setSelectedProduit] = useState<ProduitEligible | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showProduitDetails, setShowProduitDetails] = useState(false);
  const [showAddProduit, setShowAddProduit] = useState(false);
  const [showEditProduit, setShowEditProduit] = useState(false);
  const [showDeleteProduit, setShowDeleteProduit] = useState(false);
  const [showAddDossier, setShowAddDossier] = useState(false);

  // États pour les formulaires
  const [newProduit, setNewProduit] = useState({ nom: '', description: '', categorie: '', montant_min: '', montant_max: '', taux_min: '', taux_max: '', duree_min: '', duree_max: '' });

  const [editProduit, setEditProduit] = useState({ nom: '', description: '', categorie: '', montant_min: '', montant_max: '', taux_min: '', taux_max: '', duree_min: '', duree_max: '' });

  const [newDossier, setNewDossier] = useState({ client_id: '', produit_id: '', expert_id: '', montant: '', taux: '', duree: '' });

  useEffect(() => { if (user) {
      if (activeTab === 'dossiers') {
        fetchDossiers();
        fetchStats(); } else { fetchProduits(); }
    }
  }, [user, activeTab, filters, pagination.page, sortBy, sortOrder, sortByProduit, sortOrderProduit]);

  // useEffect séparé pour retrier les produits quand les paramètres de tri changent
  useEffect(() => { if (activeTab === 'produits' && produits.length > 0) {
      const produitsTries = sortProduits([...produits]);
      setProduits(produitsTries); }
  }, [sortByProduit, sortOrderProduit]);

  // ===== FONCTIONS POUR LES DOSSIERS =====
  const fetchDossiers = async () => { try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) { throw new Error('Token d\'authentification manquant'); }

      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString(), sortBy, sortOrder });

      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.client && filters.client !== 'all') params.append('client', filters.client);
      if (filters.produit && filters.produit !== 'all') params.append('produit', filters.produit);
      if (filters.expert && filters.expert !== 'all') params.append('expert', filters.expert);

      const response = await fetch(`/api/admin/dossiers?${params.toString()}`, { headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) { throw new Error('Erreur lors de la récupération des dossiers'); }

      const data = await response.json();
      setDossiers(data.dossiers || []);
      setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));

    } catch (error) { console.error('Erreur chargement dossiers: ', error);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => { try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/dossiers/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) { const data = await response.json();
        setStats(data); }
    } catch (error) { console.error('Erreur chargement stats: ', error); }
  };

  // ===== FONCTIONS POUR LES PRODUITS =====
  const fetchProduits = async () => { try {
      setLoadingProduits(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) { throw new Error('Token d\'authentification manquant'); }

      const response = await fetch('/api/admin/produits', { headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) { throw new Error('Erreur lors de la récupération des produits'); }

      const data = await response.json();
      const produitsTries = sortProduits(data.produits || []);
      setProduits(produitsTries);

    } catch (error) { console.error('Erreur chargement produits: ', error);
      setLoadingProduits(false); }
  };

  // Fonction de tri côté client pour les produits
  const sortProduits = (produitsList: ProduitEligible[]) => { return produitsList.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortByProduit) {
        case 'nom':
          aValue = a.nom?.toLowerCase() || '';
          bValue = b.nom?.toLowerCase() || '';
          break;
        case 'description':
          aValue = a.description?.toLowerCase() || '';
          bValue = b.description?.toLowerCase() || '';
          break;
        case 'categorie':
          aValue = a.categorie?.toLowerCase() || '';
          bValue = b.categorie?.toLowerCase() || '';
          break;
        case 'montant_min':
          aValue = a.montant_min || 0;
          bValue = b.montant_min || 0;
          break;
        case 'taux_min':
          aValue = a.taux_min || 0;
          bValue = b.taux_min || 0;
          break;
        case 'duree_min':
          aValue = a.duree_min || 0;
          bValue = b.duree_min || 0;
          break;
        default:
          aValue = a.nom?.toLowerCase() || '';
          bValue = b.nom?.toLowerCase() || ''; }

      if (sortOrderProduit === 'asc') { return aValue < bValue ? -1 : aValue > bValue ? 1 : 0; } else { return aValue > bValue ? -1 : aValue < bValue ? 1 : 0; }
    });
  };

  const addProduit = async () => { try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/produits', { method: 'POST', headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduit)
      });

      if (response.ok) { setShowAddProduit(false);
        setNewProduit({
          nom: '', description: '', categorie: '', montant_min: '', montant_max: '', taux_min: '', taux_max: '', duree_min: '', duree_max: '' });
        fetchProduits();
      }
    } catch (error) { console.error('Erreur ajout produit: ', error); }
  };

  const addDossier = async () => { try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/dossiers', { method: 'POST', headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDossier)
      });

      if (response.ok) { setShowAddDossier(false);
        setNewDossier({
          client_id: '', produit_id: '', expert_id: '', montant: '', taux: '', duree: '' });
        fetchDossiers();
      }
    } catch (error) { console.error('Erreur ajout dossier: ', error); }
  };

  // ===== FONCTIONS UTILITAIRES =====
  const getStatusBadge = (status: string) => { const statusConfig = {
      'non_démarré': { label: 'Non démarré', color: 'bg-gray-100 text-gray-800' },
      'en_cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      'terminé': { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      'annulé': { label: 'Annulé', color: 'bg-red-100 text-red-800' },
      'eligible': { label: 'Éligible', color: 'bg-green-100 text-green-800' },
      'non_eligible': { label: 'Non éligible', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={ config.color }>
        { config.label }
      </Badge>
    );
  };

  const formatDate = (dateString: string) => { return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => { return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Fonction pour gérer le tri des colonnes
  const handleSort = (column: string) => { if (sortBy === column) {
      // Si on clique sur la même colonn, e, on inverse l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); } else { // Si on clique sur une nouvelle colonne, on la définit comme colonne de tri
      setSortBy(column);
      setSortOrder('asc'); }
    // Reset à la première page lors du tri
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Fonction pour afficher l'icône de tri
  const getSortIcon = (column: string) => { if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4" />; }
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Fonction pour gérer le tri des colonnes pour les produits
  const handleSortProduit = (column: string) => { if (sortByProduit === column) {
      // Si on clique sur la même colonn, e, on inverse l'ordre
      setSortOrderProduit(sortOrderProduit === 'asc' ? 'desc' : 'asc'); } else { // Si on clique sur une nouvelle colonne, on la définit comme colonne de tri
      setSortByProduit(column);
      setSortOrderProduit('asc'); }
  };

  // Fonction pour afficher l'icône de tri pour les produits
  const getSortIconProduit = (column: string) => { if (sortByProduit !== column) {
      return <ChevronsUpDown className="h-4 w-4" />; }
    return sortOrderProduit === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // ===== FONCTIONS POUR LES PRODUITS =====
  const openEditProduit = (produit: ProduitEligible) => { setSelectedProduit(produit);
    setEditProduit({
      nom: produit.nom || '', description: produit.description || '', categorie: produit.categorie || '', montant_min: produit.montant_min?.toString() || '', montant_max: produit.montant_max?.toString() || '', taux_min: produit.taux_min?.toString() || '', taux_max: produit.taux_max?.toString() || '', duree_min: produit.duree_min?.toString() || '', duree_max: produit.duree_max?.toString() || '' });
    setShowEditProduit(true);
  };

  const openDeleteProduit = (produit: ProduitEligible) => { setSelectedProduit(produit);
    setShowDeleteProduit(true); };

  const updateProduit = async () => { try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !selectedProduit) return;
      const response = await fetch(`/api/admin/produits/${ selectedProduit.id }`, { method: 'PUT', headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editProduit)
      });
      if (response.ok) { setShowEditProduit(false);
        setSelectedProduit(null);
        setEditProduit({
          nom: '', description: '', categorie: '', montant_min: '', montant_max: '', taux_min: '', taux_max: '', duree_min: '', duree_max: '' });
        fetchProduits();
        alert('Produit modifié avec succès');
      } else { alert('Erreur lors de la modification du produit'); }
    } catch (error) { console.error('Erreur modification produit: ', error);
      alert('Erreur lors de la modification du produit'); }
  };

  const deleteProduit = async () => { try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !selectedProduit) return;
      const response = await fetch(`/api/admin/produits/${ selectedProduit.id }`, { method: 'DELETE', headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) { setShowDeleteProduit(false);
        setSelectedProduit(null);
        fetchProduits();
        alert('Produit supprimé avec succès'); } else { alert('Erreur lors de la suppression du produit'); }
    } catch (error) { console.error('Erreur suppression produit: ', error);
      alert('Erreur lors de la suppression du produit'); }
  };

  if (loading && dossiers.length === 0 && activeTab === 'dossiers') { return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des dossiers...</p>
        </div>
      </div>
    ); }

  if (loadingProduits && produits.length === 0 && activeTab === 'produits') { return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    ); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Dossiers</h1>
        <Button variant="outline" size="sm" onClick={ () => navigate('/admin/dashboard-optimized') }>
          ← Retour au Dashboard
        </Button>
      </div>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 mt-2">
              Gérez les produits éligibles et les dossiers clients
            </p>
          </div>
        </div>

        <Tabs value={ activeTab } onValueChange={ setActiveTab } className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dossiers" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Dossiers Clients
            </TabsTrigger>
            <TabsTrigger value="produits" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produits Éligibles
            </TabsTrigger>
          </TabsList>

          { /* Onglet Dossiers Clients */ }
          <TabsContent value="dossiers" className="space-y-6">
            { /* Statistiques */ }
            { stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Dossiers</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalDossiers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avec Expert</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ stats.dossiersAvecExpert }</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ formatCurrency(stats.totalMontant) }</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Montant Moyen</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ formatCurrency(stats.montantMoyen) }</div>
                  </CardContent>
                </Card>
              </div>
            )}

            { /* Filtres et Actions */ }
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Dossiers Clients</CardTitle>
                  <Dialog open={ showAddDossier } onOpenChange={ setShowAddDossier }>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nouveau Dossier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Ajouter un nouveau dossier</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="client_id">Client ID</Label>
                          <Input
                            id="client_id"
                            value={ newDossier.client_id }
                            onChange={ (e) => setNewDossier(prev => ({ ...prev, client_id: e.target.value }))}
                            placeholder="ID du client"
                          />
                        </div>
                        <div>
                          <Label htmlFor="produit_id">Produit ID</Label>
                          <Input
                            id="produit_id"
                            value={ newDossier.produit_id }
                            onChange={ (e) => setNewDossier(prev => ({ ...prev, produit_id: e.target.value }))}
                            placeholder="ID du produit"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expert_id">Expert ID (optionnel)</Label>
                          <Input
                            id="expert_id"
                            value={ newDossier.expert_id }
                            onChange={ (e) => setNewDossier(prev => ({ ...prev, expert_id: e.target.value }))}
                            placeholder="ID de l'expert"
                          />
                        </div>
                        <div>
                          <Label htmlFor="montant">Montant</Label>
                          <Input
                            id="montant"
                            type="number"
                            value={ newDossier.montant }
                            onChange={ (e) => setNewDossier(prev => ({ ...prev, montant: e.target.value }))}
                            placeholder="Montant"
                          />
                        </div>
                        <div>
                          <Label htmlFor="taux">Taux</Label>
                          <Input
                            id="taux"
                            type="number"
                            step="0.01"
                            value={ newDossier.taux }
                            onChange={ (e) => setNewDossier(prev => ({ ...prev, taux: e.target.value }))}
                            placeholder="Taux"
                          />
                        </div>
                        <div>
                          <Label htmlFor="duree">Durée (mois)</Label>
                          <Input
                            id="duree"
                            type="number"
                            value={ newDossier.duree }
                            onChange={ (e) => setNewDossier(prev => ({ ...prev, duree: e.target.value }))}
                            placeholder="Durée en mois"
                          />
                        </div>
                        <Button onClick={ addDossier } className="w-full">
                          Ajouter le dossier
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                { /* Filtres */ }
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Rechercher..."
                      value={ filters.search }
                      onChange={ (e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <Select value={ filters.status } onValueChange={ (value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="eligible">Éligible</SelectItem>
                      <SelectItem value="non_eligible">Non éligible</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                { /* Tableau des dossiers */ }
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSort('Client.company_name') }
                        >
                          <div className="flex items-center gap-2">
                            Client
                            { getSortIcon('Client.company_name') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSort('ProduitEligible.nom') }
                        >
                          <div className="flex items-center gap-2">
                            Produit
                            { getSortIcon('ProduitEligible.nom') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSort('validation_state') }
                        >
                          <div className="flex items-center gap-2">
                            Statut
                            { getSortIcon('validation_state') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSort('montant') }
                        >
                          <div className="flex items-center gap-2">
                            Montant
                            { getSortIcon('montant') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSort('Expert.company_name') }
                        >
                          <div className="flex items-center gap-2">
                            Expert
                            { getSortIcon('Expert.company_name') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSort('created_at') }
                        >
                          <div className="flex items-center gap-2">
                            Date
                            { getSortIcon('created_at') }
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      { dossiers.map((dossier) => (
                        <TableRow 
                          key={dossier.id }
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => {
                            setSelectedDossier(dossier);
                            setShowDetails(true); }}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{ dossier.Client?.company_name || 'N/A' }</div>
                              <div className="text-sm text-gray-500">{ dossier.Client?.email }</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ dossier.ProduitEligible?.nom }</div>
                              <div className="text-sm text-gray-500">{ dossier.ProduitEligible?.description }</div>
                            </div>
                          </TableCell>
                          <TableCell>{ getStatusBadge(dossier.validation_state) }</TableCell>
                          <TableCell>
                            { dossier.montant ? formatCurrency(dossier.montant) : 'N/A' }
                          </TableCell>
                          <TableCell>
                            { dossier.Expert ? (
                              <div>
                                <div className="font-medium">{dossier.Expert.company_name }</div>
                                <div className="text-sm text-gray-500">{ dossier.Expert.email }</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Non assigné</span>
                            )}
                          </TableCell>
                          <TableCell>{ formatDate(dossier.created_at) }</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                { /* Pagination */ }
                { pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Page {pagination.page } sur { pagination.totalPages }
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ pagination.page === 1 }
                        onClick={ () => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ pagination.page === pagination.totalPages }
                        onClick={ () => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          { /* Onglet Produits Éligibles */ }
          <TabsContent value="produits" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Produits Éligibles</CardTitle>
                  <Dialog open={ showAddProduit } onOpenChange={ setShowAddProduit }>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nouveau Produit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nom">Nom du produit</Label>
                          <Input
                            id="nom"
                            value={ newProduit.nom }
                            onChange={ (e) => setNewProduit(prev => ({ ...prev, nom: e.target.value }))}
                            placeholder="Nom du produit"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={ newProduit.description }
                            onChange={ (e) => setNewProduit(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description du produit"
                          />
                        </div>
                        <div>
                          <Label htmlFor="categorie">Catégorie</Label>
                          <Input
                            id="categorie"
                            value={ newProduit.categorie }
                            onChange={ (e) => setNewProduit(prev => ({ ...prev, categorie: e.target.value }))}
                            placeholder="Catégorie"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="montant_min">Montant min</Label>
                            <Input
                              id="montant_min"
                              type="number"
                              value={ newProduit.montant_min }
                              onChange={ (e) => setNewProduit(prev => ({ ...prev, montant_min: e.target.value }))}
                              placeholder="Montant min"
                            />
                          </div>
                          <div>
                            <Label htmlFor="montant_max">Montant max</Label>
                            <Input
                              id="montant_max"
                              type="number"
                              value={ newProduit.montant_max }
                              onChange={ (e) => setNewProduit(prev => ({ ...prev, montant_max: e.target.value }))}
                              placeholder="Montant max"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="taux_min">Taux min</Label>
                            <Input
                              id="taux_min"
                              type="number"
                              step="0.01"
                              value={ newProduit.taux_min }
                              onChange={ (e) => setNewProduit(prev => ({ ...prev, taux_min: e.target.value }))}
                              placeholder="Taux min"
                            />
                          </div>
                          <div>
                            <Label htmlFor="taux_max">Taux max</Label>
                            <Input
                              id="taux_max"
                              type="number"
                              step="0.01"
                              value={ newProduit.taux_max }
                              onChange={ (e) => setNewProduit(prev => ({ ...prev, taux_max: e.target.value }))}
                              placeholder="Taux max"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="duree_min">Durée min (mois)</Label>
                            <Input
                              id="duree_min"
                              type="number"
                              value={ newProduit.duree_min }
                              onChange={ (e) => setNewProduit(prev => ({ ...prev, duree_min: e.target.value }))}
                              placeholder="Durée min"
                            />
                          </div>
                          <div>
                            <Label htmlFor="duree_max">Durée max (mois)</Label>
                            <Input
                              id="duree_max"
                              type="number"
                              value={ newProduit.duree_max }
                              onChange={ (e) => setNewProduit(prev => ({ ...prev, duree_max: e.target.value }))}
                              placeholder="Durée max"
                            />
                          </div>
                        </div>
                        <Button onClick={ addProduit } className="w-full">
                          Ajouter le produit
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSortProduit('nom') }
                        >
                          <div className="flex items-center gap-2">
                            Nom
                            { getSortIconProduit('nom') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSortProduit('description') }
                        >
                          <div className="flex items-center gap-2">
                            Description
                            { getSortIconProduit('description') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSortProduit('categorie') }
                        >
                          <div className="flex items-center gap-2">
                            Catégorie
                            { getSortIconProduit('categorie') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSortProduit('montant_min') }
                        >
                          <div className="flex items-center gap-2">
                            Montant
                            { getSortIconProduit('montant_min') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSortProduit('taux_min') }
                        >
                          <div className="flex items-center gap-2">
                            Taux
                            { getSortIconProduit('taux_min') }
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover: bg-gray-50"
                          onClick={ () => handleSortProduit('duree_min') }
                        >
                          <div className="flex items-center gap-2">
                            Durée
                            { getSortIconProduit('duree_min') }
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      { produits.map((produit) => (
                        <TableRow key={produit.id }>
                          <TableCell className="font-medium">{ produit.nom }</TableCell>
                          <TableCell className="max-w-xs truncate">{ produit.description }</TableCell>
                          <TableCell>{ produit.categorie || 'N/A' }</TableCell>
                          <TableCell>
                            { produit.montant_min && produit.montant_max 
                              ? `${formatCurrency(produit.montant_min) } - ${ formatCurrency(produit.montant_max) }`
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            { produit.taux_min && produit.taux_max 
                              ? `${(produit.taux_min * 100).toFixed(1) }% - ${ (produit.taux_max * 100).toFixed(1) }%`
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            { produit.duree_min && produit.duree_max 
                              ? `${produit.duree_min } - ${ produit.duree_max } mois`
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={ (e) => {
                                  e.stopPropagation();
                                  setSelectedProduit(produit);
                                  setShowProduitDetails(true); }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={ (e) => {
                                  e.stopPropagation();
                                  openEditProduit(produit); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={ (e) => {
                                  e.stopPropagation();
                                  openDeleteProduit(produit); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        { /* Modale Détails Dossier */ }
        <Dialog open={ showDetails } onOpenChange={ setShowDetails }>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Dossier</DialogTitle>
            </DialogHeader>
            { selectedDossier && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <div className="text-sm font-medium">{selectedDossier.Client?.company_name || 'N/A' }</div>
                    <div className="text-sm text-gray-500">{ selectedDossier.Client?.email }</div>
                  </div>
                  <div>
                    <Label>Produit</Label>
                    <div className="text-sm font-medium">{ selectedDossier.ProduitEligible?.nom }</div>
                    <div className="text-sm text-gray-500">{ selectedDossier.ProduitEligible?.description }</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <div>{ getStatusBadge(selectedDossier.validation_state) }</div>
                  </div>
                  <div>
                    <Label>Expert</Label>
                    <div className="text-sm">
                      { selectedDossier.Expert ? (
                        <>
                          <div className="font-medium">{selectedDossier.Expert.company_name }</div>
                          <div className="text-gray-500">{ selectedDossier.Expert.email }</div>
                        </>
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Montant</Label>
                    <div className="text-sm font-medium">
                      { selectedDossier.montant ? formatCurrency(selectedDossier.montant) : 'N/A' }
                    </div>
                  </div>
                  <div>
                    <Label>Taux</Label>
                    <div className="text-sm font-medium">
                      { selectedDossier.taux ? `${(selectedDossier.taux * 100).toFixed(1) }%` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <Label>Durée</Label>
                    <div className="text-sm font-medium">
                      { selectedDossier.duree ? `${selectedDossier.duree } mois` : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Étape actuelle</Label>
                    <div className="text-sm font-medium">{ selectedDossier.current_step || 0 }</div>
                  </div>
                  <div>
                    <Label>Progression</Label>
                    <div className="text-sm font-medium">{ selectedDossier.progress || 0 }%</div>
                  </div>
                </div>
                <div>
                  <Label>Date de création</Label>
                  <div className="text-sm">{ formatDate(selectedDossier.created_at) }</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        { /* Modale Détails Produit */ }
        <Dialog open={ showProduitDetails } onOpenChange={ setShowProduitDetails }>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Produit</DialogTitle>
            </DialogHeader>
            { selectedProduit && (
              <div className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <div className="text-sm font-medium">{selectedProduit.nom }</div>
                </div>
                <div>
                  <Label>Description</Label>
                  <div className="text-sm">{ selectedProduit.description }</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Catégorie</Label>
                    <div className="text-sm">{ selectedProduit.categorie || 'N/A' }</div>
                  </div>
                  <div>
                    <Label>Date de création</Label>
                    <div className="text-sm">{ formatDate(selectedProduit.created_at) }</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Montant</Label>
                    <div className="text-sm">
                      { selectedProduit.montant_min && selectedProduit.montant_max 
                        ? `${formatCurrency(selectedProduit.montant_min) } - ${ formatCurrency(selectedProduit.montant_max) }`
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <Label>Taux</Label>
                    <div className="text-sm">
                      { selectedProduit.taux_min && selectedProduit.taux_max 
                        ? `${(selectedProduit.taux_min * 100).toFixed(1) }% - ${ (selectedProduit.taux_max * 100).toFixed(1) }%`
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Durée</Label>
                  <div className="text-sm">
                    { selectedProduit.duree_min && selectedProduit.duree_max 
                      ? `${selectedProduit.duree_min } - ${ selectedProduit.duree_max } mois`
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        { /* Modale Édition Produit */ }
        <Dialog open={ showEditProduit } onOpenChange={ setShowEditProduit }>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nom">Nom du produit</Label>
                <Input
                  id="edit-nom"
                  value={ editProduit.nom }
                  onChange={ (e) => setEditProduit(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Nom du produit"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={ editProduit.description }
                  onChange={ (e) => setEditProduit(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du produit"
                />
              </div>
              <div>
                <Label htmlFor="edit-categorie">Catégorie</Label>
                <Input
                  id="edit-categorie"
                  value={ editProduit.categorie }
                  onChange={ (e) => setEditProduit(prev => ({ ...prev, categorie: e.target.value }))}
                  placeholder="Catégorie"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-montant_min">Montant min</Label>
                  <Input
                    id="edit-montant_min"
                    type="number"
                    value={ editProduit.montant_min }
                    onChange={ (e) => setEditProduit(prev => ({ ...prev, montant_min: e.target.value }))}
                    placeholder="Montant min"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-montant_max">Montant max</Label>
                  <Input
                    id="edit-montant_max"
                    type="number"
                    value={ editProduit.montant_max }
                    onChange={ (e) => setEditProduit(prev => ({ ...prev, montant_max: e.target.value }))}
                    placeholder="Montant max"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-taux_min">Taux min</Label>
                  <Input
                    id="edit-taux_min"
                    type="number"
                    step="0.01"
                    value={ editProduit.taux_min }
                    onChange={ (e) => setEditProduit(prev => ({ ...prev, taux_min: e.target.value }))}
                    placeholder="Taux min"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-taux_max">Taux max</Label>
                  <Input
                    id="edit-taux_max"
                    type="number"
                    step="0.01"
                    value={ editProduit.taux_max }
                    onChange={ (e) => setEditProduit(prev => ({ ...prev, taux_max: e.target.value }))}
                    placeholder="Taux max"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duree_min">Durée min</Label>
                  <Input
                    id="edit-duree_min"
                    type="number"
                    value={ editProduit.duree_min }
                    onChange={ (e) => setEditProduit(prev => ({ ...prev, duree_min: e.target.value }))}
                    placeholder="Durée min"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duree_max">Durée max</Label>
                  <Input
                    id="edit-duree_max"
                    type="number"
                    value={ editProduit.duree_max }
                    onChange={ (e) => setEditProduit(prev => ({ ...prev, duree_max: e.target.value }))}
                    placeholder="Durée max"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={ () => setShowEditProduit(false) }>
                  Annuler
                </Button>
                <Button onClick={ updateProduit }>
                  Modifier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        { /* Modale Suppression Produit */ }
        <Dialog open={ showDeleteProduit } onOpenChange={ setShowDeleteProduit }>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer le produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer le produit <strong>{ selectedProduit?.nom }</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={ () => setShowDeleteProduit(false) }>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={ deleteProduit }>
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
