import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, MoreHorizontal, Eye, Edit, CheckCircle, XCircle, AlertCircle, Mail, MapPin, Phone, Star, Users, FolderOpen, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { KPISection } from '@/components/admin/KPISection';

// Configuration Supabase - Utilise l'instance importée depuis @/lib/supabase

interface Expert {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  company_name: string;
  specializations: string[];
  secteur_activite?: string[];
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
  documents?: {name: string, url: string, type: string}[] | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const GestionExperts = () => {
  const { user, isLoading: authLoading } = useAuth();

  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    approval_status: 'all',
    sortBy: 'created_at'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [expertStats, setExpertStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Charger les stats
  useEffect(() => {
    fetchExpertStats();
  }, []);

  const fetchExpertStats = async () => {
    try {
      setLoadingStats(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/experts/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setExpertStats(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats experts:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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

  // Charger les experts
  const fetchExperts = async () => {
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
        ...filters
      });
      if (filters.status && filters.status !== "all") params.append('status', filters.status);
      if (filters.approval_status && filters.approval_status !== "all") params.append('approval_status', filters.approval_status);
      const response = await fetch(`/api/admin/experts?${params}`, {
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
      console.error('Erreur experts: ', err);
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
      const response = await fetch(`/api/admin/experts/${expertId}/approve`, {
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
      console.error('Erreur approbation: ', err);
      toast.error('Erreur lors de la validation');
    }
  };

  // Rejeter un expert
  const rejectExpert = async (expertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`/api/admin/experts/${expertId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: "Rejeté par l'administrateur" })
      });
      if (response.ok) {
        fetchExperts(); // Recharger la liste
      }
    } catch (err) {
      console.error('Erreur rejet: ', err);
      toast.error('Erreur lors du rejet');
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
                onClick={() => navigate('/admin/formulaire-expert')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un expert
              </Button>
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
              label: 'Experts Approuvés',
              value: `${expertStats?.experts_approuves || 0}`,
              subtext: `sur ${expertStats?.total_experts || 0} total`,
              icon: Users,
              color: 'text-blue-600'
            },
            {
              label: 'Note Moyenne',
              value: expertStats?.note_moyenne ? `${expertStats.note_moyenne} ⭐` : '0 ⭐',
              subtext: 'satisfaction clients',
              icon: Star,
              color: 'text-yellow-500'
            },
            {
              label: 'Dossiers Actifs',
              value: expertStats?.dossiers_actifs || 0,
              subtext: 'en cours de traitement',
              icon: FolderOpen,
              color: 'text-green-600'
            },
            {
              label: 'En Attente Validation',
              value: expertStats?.en_attente_validation || 0,
              subtext: 'à approuver',
              icon: Clock,
              color: 'text-orange-600'
            }
          ]}
        />
        
        {/* ⚠️ SECTION EXPERTS À VALIDER */}
        {experts.filter(e => e.approval_status === 'pending').length > 0 && (
          <Card className="mb-6 border-orange-300 bg-orange-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-5 h-5" />
                ⚠️ Experts en attente de validation ({experts.filter(e => e.approval_status === 'pending').length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {experts
                .filter(e => e.approval_status === 'pending')
                .map(expert => (
                  <div key={expert.id} className="bg-white border-2 border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{expert.name}</h4>
                            <p className="text-sm text-gray-600">{expert.company_name}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            {expert.email}
                          </div>
                          {expert.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              {expert.phone}
                            </div>
                          )}
                          {expert.city && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {expert.city}
                            </div>
                          )}
                          {expert.experience && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Star className="w-4 h-4" />
                              {expert.experience}
                            </div>
                          )}
                        </div>
                        {expert.specializations && expert.specializations.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Spécialisations :</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.specializations.map((spec, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {expert.secteur_activite && expert.secteur_activite.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Secteurs d'activité :</p>
                            <div className="flex flex-wrap gap-2">
                              {expert.secteur_activite.map((secteur, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                  {secteur}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {expert.documents && expert.documents.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Documents justificatifs :</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                📎 {expert.documents.length} document(s)
                              </Badge>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Demande soumise le {new Date(expert.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          onClick={() => {
                            if (window.confirm(`Valider l'expert ${expert.name} ?`)) {
                              approveExpert(expert.id);
                            }
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="whitespace-nowrap"
                          onClick={() => {
                            const reason = window.prompt(`Rejeter l'expert ${expert.name}\n\nRaison du refus :`);
                            if (reason) {
                              rejectExpert(expert.id);
                            }
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/expert-details/${expert.id}`)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Détails
                        </Button>
                        {expert.documents && expert.documents.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 border-blue-300 hover:bg-blue-100"
                            onClick={() => {
                              const docList = expert.documents!.map((doc, idx) => 
                                `${idx + 1}. ${doc.name}`
                              ).join('\n');
                              if (window.confirm(`Documents uploadés (${expert.documents!.length}) :\n\n${docList}\n\nVoulez-vous ouvrir les documents ?`)) {
                                expert.documents!.forEach(doc => window.open(doc.url, '_blank'));
                              }
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Documents ({expert.documents.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        )}

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
                <Select value={filters.status} onValueChange={(value: string) => setFilters({ ...filters, status: value })}>
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
                <Select value={filters.approval_status} onValueChange={(value: string) => setFilters({ ...filters, approval_status: value })}>
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
                <Select value={filters.sortBy} onValueChange={(value: string) => setFilters({ ...filters, sortBy: value })}>
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