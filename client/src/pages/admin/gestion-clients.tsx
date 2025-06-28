import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    sortBy: 'created_at'
  });

  // Rediriger si l'utilisateur n'est pas un admin
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/connect-admin');
    }
  }, [user, navigate]);

  // Charger les clients
  useEffect(() => {
    fetchClients();
  }, [currentPage, filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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

      const response = await fetch(`http://localhost:5001/api/admin/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des clients');
      }

      const data = await response.json();
      setClients(data.data.clients);
      setPagination(data.data.pagination);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modifier le statut d'un client
  const updateClientStatus = async (clientId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:5001/api/admin/clients/${clientId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchClients(); // Recharger la liste
      }
    } catch (err) {
      console.error('Erreur modification statut:', err);
    }
  };

  // Supprimer un client
  const deleteClient = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:5001/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchClients(); // Recharger la liste
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
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
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/dashboard')}
            >
              ← Retour au Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
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
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
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
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
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
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

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
                {clients.map((client) => (
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
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, 'actif')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activer
                            </DropdownMenuItem>
                          )}
                          {client.statut === 'actif' && (
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, 'inactif')}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Désactiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/admin/client/${client.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteClient(client.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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