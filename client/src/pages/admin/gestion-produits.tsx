/**
 * 📦 GESTION PRODUITS ÉLIGIBLES
 * Page dédiée au pilotage de l'offre de service Profitum
 * CRUD complet + Stats + Performance par produit
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { 
  Package, Plus, Eye, Edit, Trash2, 
  ChevronUp, ChevronDown, ChevronsUpDown,
  TrendingUp, FileText
} from "lucide-react";

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
  created_at: string;
  updated_at: string;
}

interface ProduitStats {
  total: number;
  actifs: number;
  categories: { [key: string]: number };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function GestionProduits() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // États
  const [produits, setProduits] = useState<ProduitEligible[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProduitStats | null>(null);
  
  // États tri
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // États modales
  const [selectedProduit, setSelectedProduit] = useState<ProduitEligible | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Formulaires
  const [newProduit, setNewProduit] = useState({
    nom: '',
    description: '',
    categorie: '',
    montant_min: '',
    montant_max: '',
    taux_min: '',
    taux_max: '',
    duree_min: '',
    duree_max: ''
  });
  
  const [editForm, setEditForm] = useState({
    nom: '',
    description: '',
    categorie: '',
    montant_min: '',
    montant_max: '',
    taux_min: '',
    taux_max: '',
    duree_min: '',
    duree_max: ''
  });

  // ============================================================================
  // AUTHENTIFICATION
  // ============================================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
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
  // CHARGEMENT DONNÉES
  // ============================================================================

  useEffect(() => {
    fetchProduits();
    fetchStats();
  }, []);

  const fetchProduits = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des produits éligibles...');
      
      const response = await api.get('/api/admin/produits');
      
      console.log('📦 Réponse API produits:', response.status, response.statusText);
      console.log('📦 Données reçues:', response.data);
      
      // Vérifier le format de la réponse
      // Le backend retourne: { success: true, data: { produits: [...] } }
      let produitsList: ProduitEligible[] = [];
      
      if (response.data.success && response.data.data?.produits) {
        produitsList = response.data.data.produits;
      } else if (Array.isArray(response.data.data?.produits)) {
        produitsList = response.data.data.produits;
      } else if (Array.isArray(response.data.produits)) {
        // Format legacy
        produitsList = response.data.produits;
      } else if (Array.isArray(response.data)) {
        // Format direct array
        produitsList = response.data;
      } else {
        console.warn('⚠️ Format de réponse invalide:', response.data);
        produitsList = [];
      }
      
      if (Array.isArray(produitsList) && produitsList.length > 0) {
        const produitsTries = sortProduits(produitsList);
        setProduits(produitsTries);
        console.log('✅ Produits chargés:', produitsTries.length);
      } else {
        console.log('ℹ️ Aucun produit trouvé dans la réponse');
        setProduits([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement produits:', error);
      const message = error.response?.data?.message || error.message || "Erreur de chargement des produits";
      toast.error(message);
      setProduits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/produits/stats');
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Erreur stats produits:', error);
    }
  };

  // ============================================================================
  // TRI
  // ============================================================================

  const sortProduits = (produitsList: ProduitEligible[]) => {
    return produitsList.sort((a, b) => {
      let aVal: any = a[sortBy as keyof ProduitEligible];
      let bVal: any = b[sortBy as keyof ProduitEligible];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };

  useEffect(() => {
    if (produits.length > 0) {
      const produitsTries = sortProduits([...produits]);
      setProduits(produitsTries);
    }
  }, [sortBy, sortOrder]);

  // ============================================================================
  // CRUD OPÉRATIONS
  // ============================================================================

  const addProduit = async () => {
    try {
      const response = await api.post('/api/admin/produits', newProduit);
      
      if (response.data.success) {
        toast.success("Produit créé avec succès");
        setShowAddModal(false);
        setNewProduit({
          nom: '',
          description: '',
          categorie: '',
          montant_min: '',
          montant_max: '',
          taux_min: '',
          taux_max: '',
          duree_min: '',
          duree_max: ''
        });
        fetchProduits();
        fetchStats();
      } else {
        toast.error("Erreur lors de la création");
      }
    } catch (error: any) {
      console.error('❌ Erreur création produit:', error);
      const message = error.response?.data?.error || "Erreur lors de la création";
      toast.error(message);
    }
  };

  const updateProduit = async () => {
    if (!selectedProduit) return;
    
    try {
      const response = await api.put(`/api/admin/produits/${selectedProduit.id}`, editForm);
      
      if (response.data.success) {
        toast.success("Produit modifié avec succès");
        setShowEditModal(false);
        fetchProduits();
        fetchStats();
      } else {
        toast.error("Erreur lors de la modification");
      }
    } catch (error: any) {
      console.error('❌ Erreur modification produit:', error);
      const message = error.response?.data?.error || "Erreur lors de la modification";
      toast.error(message);
    }
  };

  const deleteProduit = async () => {
    if (!selectedProduit) return;
    
    try {
      const response = await api.delete(`/api/admin/produits/${selectedProduit.id}`);
      
      if (response.data.success) {
        toast.success("Produit supprimé avec succès");
        setShowDeleteModal(false);
        setSelectedProduit(null);
        fetchProduits();
        fetchStats();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression produit:', error);
      const message = error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(message);
    }
  };

  const openEditModal = (produit: ProduitEligible) => {
    setSelectedProduit(produit);
    setEditForm({
      nom: produit.nom,
      description: produit.description,
      categorie: produit.categorie || '',
      montant_min: produit.montant_min?.toString() || '',
      montant_max: produit.montant_max?.toString() || '',
      taux_min: produit.taux_min?.toString() || '',
      taux_max: produit.taux_max?.toString() || '',
      duree_min: produit.duree_min?.toString() || '',
      duree_max: produit.duree_max?.toString() || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (produit: ProduitEligible) => {
    setSelectedProduit(produit);
    setShowDeleteModal(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête */}
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Gestion Produits Éligibles</h1>
          <p className="text-gray-600 mt-1">Pilotez votre offre de service globale</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard-optimized')}>
          ← Retour au Dashboard
        </Button>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        
        {/* Stats rapides */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.actifs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Catégories</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.categories || {}).length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tableau des produits */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Produits Éligibles</CardTitle>
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau Produit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nom">Nom du produit *</Label>
                      <Input
                        id="nom"
                        value={newProduit.nom}
                        onChange={(e) => setNewProduit(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: TICPE, URSSAF, Foncier..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={newProduit.description}
                        onChange={(e) => setNewProduit(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description détaillée du produit"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="categorie">Catégorie</Label>
                      <Input
                        id="categorie"
                        value={newProduit.categorie}
                        onChange={(e) => setNewProduit(prev => ({ ...prev, categorie: e.target.value }))}
                        placeholder="Ex: Taxe, Social, Immobilier..."
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Montants (€)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="montant_min">Montant minimum</Label>
                          <Input
                            id="montant_min"
                            type="number"
                            value={newProduit.montant_min}
                            onChange={(e) => setNewProduit(prev => ({ ...prev, montant_min: e.target.value }))}
                            placeholder="Ex: 5000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="montant_max">Montant maximum</Label>
                          <Input
                            id="montant_max"
                            type="number"
                            value={newProduit.montant_max}
                            onChange={(e) => setNewProduit(prev => ({ ...prev, montant_max: e.target.value }))}
                            placeholder="Ex: 50000"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Taux (%)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taux_min">Taux minimum</Label>
                          <Input
                            id="taux_min"
                            type="number"
                            step="0.01"
                            value={newProduit.taux_min}
                            onChange={(e) => setNewProduit(prev => ({ ...prev, taux_min: e.target.value }))}
                            placeholder="Ex: 0.05"
                          />
                        </div>
                        <div>
                          <Label htmlFor="taux_max">Taux maximum</Label>
                          <Input
                            id="taux_max"
                            type="number"
                            step="0.01"
                            value={newProduit.taux_max}
                            onChange={(e) => setNewProduit(prev => ({ ...prev, taux_max: e.target.value }))}
                            placeholder="Ex: 0.15"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Durée (mois)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="duree_min">Durée minimum</Label>
                          <Input
                            id="duree_min"
                            type="number"
                            value={newProduit.duree_min}
                            onChange={(e) => setNewProduit(prev => ({ ...prev, duree_min: e.target.value }))}
                            placeholder="Ex: 12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="duree_max">Durée maximum</Label>
                          <Input
                            id="duree_max"
                            type="number"
                            value={newProduit.duree_max}
                            onChange={(e) => setNewProduit(prev => ({ ...prev, duree_max: e.target.value }))}
                            placeholder="Ex: 36"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button onClick={addProduit} className="w-full">
                      Ajouter le produit
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : produits.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun produit éligible</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier produit
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('nom')}
                      >
                        <div className="flex items-center gap-2">
                          Nom
                          {getSortIcon('nom')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center gap-2">
                          Description
                          {getSortIcon('description')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('categorie')}
                      >
                        <div className="flex items-center gap-2">
                          Catégorie
                          {getSortIcon('categorie')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('montant_min')}
                      >
                        <div className="flex items-center gap-2">
                          Montant
                          {getSortIcon('montant_min')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('taux_min')}
                      >
                        <div className="flex items-center gap-2">
                          Taux
                          {getSortIcon('taux_min')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('duree_min')}
                      >
                        <div className="flex items-center gap-2">
                          Durée
                          {getSortIcon('duree_min')}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produits.map((produit) => (
                      <TableRow key={produit.id}>
                        <TableCell className="font-medium">{produit.nom}</TableCell>
                        <TableCell className="max-w-xs truncate">{produit.description}</TableCell>
                        <TableCell>
                          {produit.categorie ? (
                            <Badge variant="outline">{produit.categorie}</Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {produit.montant_min && produit.montant_max 
                            ? `${formatCurrency(produit.montant_min)} - ${formatCurrency(produit.montant_max)}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {produit.taux_min && produit.taux_max 
                            ? `${produit.taux_min.toFixed(1)}% - ${produit.taux_max.toFixed(1)}%`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {produit.duree_min && produit.duree_max 
                            ? `${produit.duree_min} - ${produit.duree_max} mois`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduit(produit);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(produit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(produit)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modale Détails Produit */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Produit</DialogTitle>
            </DialogHeader>
            {selectedProduit && (
              <div className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <div className="text-sm font-medium">{selectedProduit.nom}</div>
                </div>
                <div>
                  <Label>Description</Label>
                  <div className="text-sm">{selectedProduit.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Catégorie</Label>
                    <div className="text-sm">{selectedProduit.categorie || 'N/A'}</div>
                  </div>
                  <div>
                    <Label>Date de création</Label>
                    <div className="text-sm">{formatDate(selectedProduit.created_at)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Montant</Label>
                    <div className="text-sm">
                      {selectedProduit.montant_min && selectedProduit.montant_max 
                        ? `${formatCurrency(selectedProduit.montant_min)} - ${formatCurrency(selectedProduit.montant_max)}`
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <Label>Taux</Label>
                    <div className="text-sm">
                      {selectedProduit.taux_min && selectedProduit.taux_max 
                        ? `${selectedProduit.taux_min.toFixed(1)}% - ${selectedProduit.taux_max.toFixed(1)}%`
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Durée</Label>
                  <div className="text-sm">
                    {selectedProduit.duree_min && selectedProduit.duree_max 
                      ? `${selectedProduit.duree_min} - ${selectedProduit.duree_max} mois`
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modale Édition Produit */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nom">Nom du produit</Label>
                <Input
                  id="edit-nom"
                  value={editForm.nom}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-categorie">Catégorie</Label>
                <Input
                  id="edit-categorie"
                  value={editForm.categorie}
                  onChange={(e) => setEditForm(prev => ({ ...prev, categorie: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-montant_min">Montant min</Label>
                  <Input
                    id="edit-montant_min"
                    type="number"
                    value={editForm.montant_min}
                    onChange={(e) => setEditForm(prev => ({ ...prev, montant_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-montant_max">Montant max</Label>
                  <Input
                    id="edit-montant_max"
                    type="number"
                    value={editForm.montant_max}
                    onChange={(e) => setEditForm(prev => ({ ...prev, montant_max: e.target.value }))}
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
                    value={editForm.taux_min}
                    onChange={(e) => setEditForm(prev => ({ ...prev, taux_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-taux_max">Taux max</Label>
                  <Input
                    id="edit-taux_max"
                    type="number"
                    step="0.01"
                    value={editForm.taux_max}
                    onChange={(e) => setEditForm(prev => ({ ...prev, taux_max: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duree_min">Durée min</Label>
                  <Input
                    id="edit-duree_min"
                    type="number"
                    value={editForm.duree_min}
                    onChange={(e) => setEditForm(prev => ({ ...prev, duree_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duree_max">Durée max</Label>
                  <Input
                    id="edit-duree_max"
                    type="number"
                    value={editForm.duree_max}
                    onChange={(e) => setEditForm(prev => ({ ...prev, duree_max: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Annuler
                </Button>
                <Button onClick={updateProduit}>
                  Modifier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modale Suppression Produit */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer le produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer le produit <strong>{selectedProduit?.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={deleteProduit}>
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

