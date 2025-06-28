import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Search, Filter, Eye, CheckCircle, XCircle, Edit, MoreHorizontal, UserPlus } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Expert {
  id: string;
  name: string;
  email: string;
  company_name: string;
  specializations: string[];
  rating: number;
  compensation: number;
  status: string;
  approval_status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  experience?: string;
  city?: string;
  phone?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const GestionExperts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    approval_status: '',
    specialization: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Rediriger si l'utilisateur n'est pas un admin
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/connect-admin');
    }
  }, [user, navigate]);

  // Charger les experts
  const fetchExperts = async () => {
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
        ...filters
      });

      if (filters.status && filters.status !== "all") params.append('status', filters.status);
      if (filters.approval_status && filters.approval_status !== "all") params.append('approval_status', filters.approval_status);

      const response = await fetch(`http://localhost:5001/api/admin/experts?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des experts');
      }

      const data = await response.json();
      setExperts(data.data.experts);
      setPagination(data.data.pagination);
    } catch (err) {
      setError('Erreur lors du chargement des experts');
      console.error('Erreur experts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, [currentPage, filters]);

  // Approuver un expert
  const approveExpert = async (expertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:5001/api/admin/experts/${expertId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchExperts(); // Recharger la liste
      }
    } catch (err) {
      console.error('Erreur approbation:', err);
    }
  };

  // Rejeter un expert
  const rejectExpert = async (expertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:5001/api/admin/experts/${expertId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rejeté par l\'administrateur' })
      });

      if (response.ok) {
        fetchExperts(); // Recharger la liste
      }
    } catch (err) {
      console.error('Erreur rejet:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des experts...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Experts</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => navigate('/admin/expert/nouveau')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un expert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/dashboard')}
              >
                ← Retour au Dashboard
              </Button>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Recherche</label>
                <Input
                  placeholder="Nom, email, entreprise..."
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
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Approbation</label>
                <Select value={filters.approval_status} onValueChange={(value) => setFilters({ ...filters, approval_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
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
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                    <SelectItem value="compensation">Compensation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des experts */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Liste des Experts ({pagination?.total || 0})
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
                  <TableHead>Expert</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Spécialisations</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Compensation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Approbation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experts.map((expert) => (
                  <TableRow key={expert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expert.name}</div>
                        <div className="text-sm text-gray-500">{expert.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{expert.company_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {expert.specializations?.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {expert.specializations?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{expert.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{expert.rating}</span>
                        <span className="text-yellow-500 ml-1">★</span>
                      </div>
                    </TableCell>
                    <TableCell>{expert.compensation}%</TableCell>
                    <TableCell>{getStatusBadge(expert.status)}</TableCell>
                    <TableCell>{getApprovalBadge(expert.approval_status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/expert/${expert.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          {expert.approval_status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => approveExpert(expert.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => rejectExpert(expert.id)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/admin/expert/${expert.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
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
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} experts)
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

export default GestionExperts; 