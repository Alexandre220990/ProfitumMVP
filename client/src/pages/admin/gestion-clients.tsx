import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/env';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Eye, MoreHorizontal, Building, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Users, Plus, TrendingUp, FolderOpen, UserPlus } from 'lucide-react';
import { KPISection } from '@/components/admin/KPISection';

// Configuration Supabase - Utilise l'instance importée depuis @/lib/supabase

interface Client {
  id: string;
  email: string;
  company_name: string;
  city: string;
  phone: string;
  statut: string;
  created_at: string;
  derniereConnexion?: string;
  siren?: string;
  description?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  search: string;
  status: string;
  sortBy: string;
}

const GestionClients = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ search: '', status: '', sortBy: 'created_at' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientStats, setClientStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [newClient, setNewClient] = useState({
    email: '',
    company_name: '',
    phone_number: '',
    city: '',
    siren: '',
    description: '',
    statut: 'actif'
  });

  // Vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    return <Navigate to="/connect-admin" replace />;
  }

  // Charger les stats
  useEffect(() => {
    fetchClientStats();
  }, []);

  // Charger les clients
  useEffect(() => {
    fetchClients();
  }, [currentPage, filters]);

  const fetchClientStats = async () => {
    try {
      setLoadingStats(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/clients/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setClientStats(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats clients:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Session expirée, redirection vers connect-admin');
        navigate('/connect-admin');
        return;
      }

      const params = new URLSearchParams({ 
        page: currentPage.toString(), 
        limit: '10', 
        sortBy: filters.sortBy, 
        sortOrder: 'desc' 
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== "all") params.append('status', filters.status);

      console.log('📡 Récupération des clients avec params:', params.toString());

      const response = await fetch(`/api/admin/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Réponse API clients:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Données reçues:', data);
        
        if (data.success) {
          // L'API retourne data.data.clients et data.data.pagination
          const clientsData = Array.isArray(data.data?.clients) ? data.data.clients : [];
          const paginationData = data.data?.pagination || null;
          
          console.log('✅ Clients reçus:', clientsData.length, 'clients');
          console.log('📄 Pagination:', paginationData);
          
          setClients(clientsData);
          setPagination(paginationData);
        } else {
          console.error('❌ Erreur récupération clients:', data.message);
          setClients([]);
          setPagination(null);
        }
      } else {
        console.error('❌ Erreur récupération clients:', response.status);
        setClients([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('❌ Erreur récupération clients:', error);
      setClients([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${clientId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Statut mis à jour avec succès");
          fetchClients();
        } else {
          toast.error(data.message || "Erreur lors de la mise à jour");
        }
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Client supprimé avec succès");
          fetchClients();
        } else {
          toast.error(data.message || "Erreur lors de la suppression");
        }
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error('Erreur suppression client:', error);
        toast.error("Erreur lors de la suppression");
    }
  };

  const handleCreateClient = async () => {
    try {
      setCreatingClient(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${config.API_URL}/api/admin/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Client créé avec succès");
          setShowCreateModal(false);
          setNewClient({
            email: '',
            company_name: '',
            phone_number: '',
            city: '',
            siren: '',
            description: '',
            statut: 'actif'
          });
          fetchClients(); // Recharger la liste
        } else {
          toast.error(data.message || "Erreur lors de la création");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error('Erreur création client:', error);
      toast.error("Erreur lors de la création");
    } finally {
      setCreatingClient(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                <div className="w-6 h-4 bg-red-600 rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau client</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          placeholder="client@entreprise.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_name">Entreprise *</Label>
                        <Input
                          id="company_name"
                          value={newClient.company_name}
                          onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone_number">Téléphone</Label>
                        <Input
                          id="phone_number"
                          value={newClient.phone_number}
                          onChange={(e) => setNewClient({...newClient, phone_number: e.target.value})}
                          placeholder="01 23 45 67 89"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={newClient.city}
                          onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                          placeholder="Paris"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="siren">SIREN</Label>
                        <Input
                          id="siren"
                          value={newClient.siren}
                          onChange={(e) => setNewClient({...newClient, siren: e.target.value})}
                          placeholder="123456789"
                        />
                      </div>
                      <div>
                        <Label htmlFor="statut">Statut</Label>
                        <Select value={newClient.statut} onValueChange={(value: string) => setNewClient({...newClient, statut: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="actif">Actif</SelectItem>
                            <SelectItem value="inactif">Inactif</SelectItem>
                            <SelectItem value="en_attente">En attente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newClient.description}
                        onChange={(e) => setNewClient({...newClient, description: e.target.value})}
                        placeholder="Description du client..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleCreateClient} 
                      disabled={creatingClient || !newClient.email || !newClient.company_name}
                    >
                      {creatingClient ? 'Création...' : 'Créer le client'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/dashboard-optimized')}
              >
                ← Retour au Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* KPI Section */}
        <KPISection
          loading={loadingStats}
          kpis={[
            {
              label: 'Clients Actifs',
              value: `${clientStats?.clients_actifs || 0}`,
              subtext: `sur ${clientStats?.total_clients || 0} total`,
              icon: Users,
              color: 'text-blue-600'
            },
            {
              label: "Taux d'Engagement",
              value: `${clientStats?.taux_engagement || 0}%`,
              subtext: 'clients avec dossiers',
              icon: TrendingUp,
              color: 'text-green-600'
            },
            {
              label: 'Dossiers en Cours',
              value: clientStats?.dossiers_en_cours || 0,
              subtext: 'dossiers actifs',
              icon: FolderOpen,
              color: 'text-purple-600'
            },
            {
              label: 'Nouveaux ce Mois',
              value: clientStats?.nouveaux_ce_mois || 0,
              subtext: '30 derniers jours',
              icon: UserPlus,
              color: 'text-orange-600'
            }
          ]}
        />

        {/* Filtres */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Recherche</label>
                <Input
                  placeholder="Email, entreprise, ville..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Statut</label>
                <Select value={filters.status} onValueChange={(value: string) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tri</label>
                <Select value={filters.sortBy} onValueChange={(value: string) => setFilters({ ...filters, sortBy: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date de création</SelectItem>
                    <SelectItem value="company_name">Entreprise</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="derniereConnexion">Dernière connexion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des clients */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Liste des Clients ({pagination?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(clients) && clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.email}</div>
                          {client.siren && (
                            <div className="text-sm text-gray-500">SIREN: {client.siren}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{client.company_name || 'Non renseigné'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 text-gray-400 mr-1" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 text-gray-400 mr-1" />
                              {client.phone}
                            </div>
                          )}
                          {client.city && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              {client.city}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(client.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.derniereConnexion ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {formatDate(client.derniereConnexion)}
                          </div>
                        ) : (
                          <span className="text-gray-400">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/client/${client.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            {client.statut === 'inactif' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'actif')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activer
                              </DropdownMenuItem>
                            )}
                            {client.statut === 'actif' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'inactif')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Désactiver
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => navigate(`/admin/client/${client.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Chargement...
                          </div>
                        ) : (
                          <div>
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg font-medium">Aucun client trouvé ou erreur d'authentification</p>
                            <p className="text-sm">Aucun client ne correspond à vos critères de recherche ou vous n'êtes pas authentifié.</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} clients)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setCurrentPage(pagination.page - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setCurrentPage(pagination.page + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestionClients; 