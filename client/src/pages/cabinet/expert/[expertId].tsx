import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  BarChart3,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { STATUT_LABELS, type ClientProduitStatut } from '@/types/statuts';
import LoadingScreen from '@/components/LoadingScreen';

const getStatutLabel = (statut: string) => {
  return STATUT_LABELS[statut as ClientProduitStatut] || statut;
};

// ============================================================================
// TYPES
// ============================================================================

interface ExpertSyntheseData {
  expert: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    team_role: string;
  };
  kpis: {
    total: number;
    enCours: number;
    signes: number;
    termines: number;
    tauxReussite: number;
  };
  montants: {
    montantTotalSignes: number;
    commissionGeneree: number;
    commissionMoyenneExpert: number;
  };
  statutsRepartition: Record<string, number>;
  dossiersParProduit: Array<{
    produit: {
      id: string;
      nom: string;
      description?: string;
      categorie?: string;
    };
    dossiersTotal: number;
    dossiersEnCours: number;
    dossiersSignes: number;
    dossiersTermines: number;
    montantTotal: number;
    tauxReussite: number;
  }>;
  evolution: Array<{
    date: string;
    dossiersCreated: number;
    dossiersSigned: number;
  }>;
  lastActivity: string | null;
  daysSinceActivity: number | null;
  dossiers: {
    items: Array<{
      id: string;
      statut: string;
      produitId: string;
      montantFinal?: number;
      created_at: string;
      updated_at: string;
      Client?: {
        id: string;
        name?: string;
        email: string;
        company_name?: string;
        first_name?: string;
        last_name?: string;
      };
      ProduitEligible?: {
        id: string;
        nom: string;
        description?: string;
        categorie?: string;
      };
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function CabinetExpertSynthese() {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpertSyntheseData | null>(null);
  const [filters, setFilters] = useState({
    statut: searchParams.get('statut') || 'all',
    produitId: searchParams.get('produitId') || 'all',
    search: searchParams.get('search') || ''
  });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Synchroniser currentPage avec les query params de l'URL
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '1');
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      if (!expertId) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          ...(filters.statut !== 'all' && { statut: filters.statut }),
          ...(filters.produitId !== 'all' && { produitId: filters.produitId }),
          ...(filters.search && { search: filters.search })
        });

        const response = await get<ExpertSyntheseData>(
          `/api/expert/cabinet/experts/${expertId}/synthese?${params.toString()}`
        );

        if (response.success && response.data) {
          setData(response.data);
        } else {
          toast.error('Erreur lors du chargement des données');
          navigate('/dashboard/expert');
        }
      } catch (error) {
        console.error('Erreur chargement synthèse expert:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [expertId, currentPage, filters, navigate]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value === 'all' || !value) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
      newParams.set('page', '1');
      return newParams;
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-center text-red-500">Erreur : Données introuvables</p>
        <Button onClick={() => navigate('/dashboard/expert')} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/expert')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Synthèse Expert : {data.expert.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                {data.expert.email}
              </div>
              {data.expert.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="h-4 w-4" />
                  {data.expert.phone}
                </div>
              )}
              {data.expert.company_name && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building className="h-4 w-4" />
                  {data.expert.company_name}
                </div>
              )}
            </div>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800">{data.expert.team_role}</Badge>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total dossiers</p>
                <p className="text-2xl font-bold text-gray-900">{data.kpis.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{data.kpis.enCours}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Signés</p>
                <p className="text-2xl font-bold text-gray-900">{data.kpis.signes}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Taux: {data.kpis.tauxReussite}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Terminés</p>
                <p className="text-2xl font-bold text-gray-900">{data.kpis.termines}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Montants et commissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Montant total signés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.montants.montantTotalSignes)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Commission générée</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.montants.commissionGeneree)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Commission moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(data.montants.commissionMoyenneExpert * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Dernière activité : {data.daysSinceActivity !== null
                    ? `Il y a ${data.daysSinceActivity} jour(s)`
                    : 'Jamais'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dossiers par produit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📦 Dossiers par produit ({data.dossiersParProduit.length} produits)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.dossiersParProduit.map((produitData) => (
              <div
                key={produitData.produit.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/cabinet/produit/${produitData.produit.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{produitData.produit.nom}</p>
                        {produitData.produit.description && (
                          <p className="text-xs text-gray-500">{produitData.produit.description}</p>
                        )}
                      </div>
                      {produitData.produit.categorie && (
                        <Badge variant="outline">{produitData.produit.categorie}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Total dossiers</p>
                        <p className="text-sm font-semibold text-gray-900">{produitData.dossiersTotal}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">En cours</p>
                        <p className="text-sm font-semibold text-amber-600">{produitData.dossiersEnCours}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Signés</p>
                        <p className="text-sm font-semibold text-green-600">{produitData.dossiersSignes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Taux de réussite</p>
                        <p className="text-sm font-semibold text-blue-600">{produitData.tauxReussite}%</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Montant total : {formatCurrency(produitData.montantTotal)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Voir synthèse produit →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Répartition par statut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Répartition des dossiers par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(data.statutsRepartition)
              .sort(([, a], [, b]) => b - a)
              .map(([statut, count]) => {
                const percentage = data.kpis.total > 0 ? Math.round((count / data.kpis.total) * 100) : 0;
                const barWidth = data.kpis.total > 0 ? (count / data.kpis.total) * 100 : 0;
                return (
                  <div key={statut} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600 truncate">{getStatutLabel(statut)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-16 text-right">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Liste des dossiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📋 Liste des dossiers ({data.dossiers.total} au total)</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher par client ou produit..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-64"
              />
              <Select value={filters.statut} onValueChange={(value) => handleFilterChange('statut', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="signes">Signés</SelectItem>
                  <SelectItem value="termines">Terminés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.produitId} onValueChange={(value) => handleFilterChange('produitId', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {data.dossiersParProduit.map((prod) => (
                    <SelectItem key={prod.produit.id} value={prod.produit.id}>
                      {prod.produit.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dossiers.items.map((dossier, index) => {
                const produit = dossier.ProduitEligible as any;
                const produitData = Array.isArray(produit) ? produit[0] : produit;
                return (
                  <TableRow key={dossier.id}>
                    <TableCell>{(currentPage - 1) * 20 + index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {dossier.Client?.name || 
                            (dossier.Client?.first_name && dossier.Client?.last_name 
                              ? `${dossier.Client.first_name} ${dossier.Client.last_name}` 
                              : dossier.Client?.first_name || dossier.Client?.last_name) ||
                            dossier.Client?.company_name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{dossier.Client?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {produitData ? (
                        <div
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/cabinet/produit/${produitData.id}`)}
                        >
                          <p className="text-sm text-gray-900">{produitData.nom}</p>
                          {produitData.categorie && (
                            <p className="text-xs text-gray-500">{produitData.categorie}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getStatutLabel(dossier.statut)}</Badge>
                    </TableCell>
                    <TableCell>
                      {dossier.montantFinal ? formatCurrency(dossier.montantFinal) : 'N/A'}
                    </TableCell>
                    <TableCell>{formatDate(dossier.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {data.dossiers.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {data.dossiers.page} sur {data.dossiers.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('page', newPage.toString());
                      return newParams;
                    });
                  }}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(data.dossiers.totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('page', newPage.toString());
                      return newParams;
                    });
                  }}
                  disabled={currentPage === data.dossiers.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

