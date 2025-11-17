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
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { STATUT_LABELS, type ClientProduitStatut } from '@/types/statuts';

const getStatutLabel = (statut: string) => {
  return STATUT_LABELS[statut as ClientProduitStatut] || statut;
};

// ============================================================================
// TYPES
// ============================================================================

interface ProduitSyntheseData {
  produit: {
    id: string;
    nom: string;
    description?: string;
    categorie?: string;
    commission_rate: number;
    client_fee_percentage_min?: number;
    fee_mode: string;
  };
  kpis: {
    total: number;
    enCours: number;
    signes: number;
    enAttente: number;
  };
  montants: {
    montantTotalSignes: number;
    commissionGeneree: number;
    commissionMoyenne: number;
  };
  statutsRepartition: Record<string, number>;
  expertsRelies: Array<{
    expert: {
      id: string;
      name: string;
      email: string;
    };
    dossiersTotal: number;
    dossiersEnCours: number;
    dossiersSignes: number;
    dossiersTermines: number;
    montantTotal: number;
    tauxReussite: number;
    daysSinceActivity: number | null;
  }>;
  evolution: Array<{
    date: string;
    dossiersCreated: number;
    dossiersSigned: number;
  }>;
  dossiers: {
    items: Array<{
      id: string;
      statut: string;
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
      Expert?: {
        id: string;
        name: string;
        email: string;
      };
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  alertes: {
    blockedDossiers: {
      count: number;
      items: Array<any>;
    };
    inactiveExperts: {
      count: number;
      items: Array<any>;
    };
  };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function CabinetProduitSynthese() {
  const { produitId } = useParams<{ produitId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProduitSyntheseData | null>(null);
  const [filters, setFilters] = useState({
    statut: searchParams.get('statut') || 'all',
    expertId: searchParams.get('expertId') || 'all',
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
      if (!produitId) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          ...(filters.statut !== 'all' && { statut: filters.statut }),
          ...(filters.expertId !== 'all' && { expertId: filters.expertId }),
          ...(filters.search && { search: filters.search })
        });

        const response = await get<ProduitSyntheseData>(
          `/api/expert/cabinet/products/${produitId}/synthese?${params.toString()}`
        );

        if (response.success && response.data) {
          setData(response.data);
        } else {
          toast.error('Erreur lors du chargement des données');
          navigate('/dashboard/expert');
        }
      } catch (error) {
        console.error('Erreur chargement synthèse produit:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [produitId, currentPage, filters]);

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
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
              Synthèse Produit : {data.produit.nom}
            </h1>
            {data.produit.description && (
              <p className="text-sm text-gray-500 mt-1">{data.produit.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.produit.categorie && (
            <Badge variant="outline">{data.produit.categorie}</Badge>
          )}
          <Badge className="bg-green-100 text-green-800">Actif</Badge>
        </div>
      </div>

      {/* Configuration du produit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚙️ Configuration du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Commission cabinet (max)</p>
              <p className="text-lg font-semibold">
                {data.produit.commission_rate ? `${(data.produit.commission_rate * 100).toFixed(1)}%` : 'Non définie'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Minimum négociation</p>
              <p className="text-lg font-semibold">
                {data.produit.client_fee_percentage_min
                  ? `${(data.produit.client_fee_percentage_min * 100).toFixed(1)}%`
                  : 'Non défini'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Mode</p>
              <p className="text-lg font-semibold">{data.produit.fee_mode || 'percent'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  {data.kpis.total > 0 ? Math.round((data.kpis.signes / data.kpis.total) * 100) : 0}% taux
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
                <p className="text-sm text-gray-500">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{data.kpis.enAttente}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
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
                  {formatCurrency(data.montants.commissionMoyenne)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experts reliés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            👥 Experts associés à ce produit ({data.expertsRelies.length} experts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.expertsRelies.map((expertData) => (
              <div
                key={expertData.expert.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/cabinet/expert/${expertData.expert.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{expertData.expert.name}</p>
                        <p className="text-xs text-gray-500">{expertData.expert.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Dossiers</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {expertData.dossiersTotal} ({Math.round((expertData.dossiersTotal / data.kpis.total) * 100)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">En cours</p>
                        <p className="text-sm font-semibold text-amber-600">{expertData.dossiersEnCours}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Signés</p>
                        <p className="text-sm font-semibold text-green-600">{expertData.dossiersSignes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Taux de réussite</p>
                        <p className="text-sm font-semibold text-blue-600">{expertData.tauxReussite}%</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Montant total : {formatCurrency(expertData.montantTotal)} • 
                        Dernière activité : {expertData.daysSinceActivity !== null 
                          ? `Il y a ${expertData.daysSinceActivity} jour(s)`
                          : 'Jamais'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Voir synthèse →
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
                    <div className="w-32 text-sm text-gray-600 truncate">{statut}</div>
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
                placeholder="Rechercher par client..."
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
              <Select value={filters.expertId} onValueChange={(value) => handleFilterChange('expertId', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Expert" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les experts</SelectItem>
                  {data.expertsRelies.map((exp) => (
                    <SelectItem key={exp.expert.id} value={exp.expert.id}>
                      {exp.expert.name}
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
                <TableHead>Expert</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dossiers.items.map((dossier, index) => (
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
                    {dossier.Expert ? (
                      <div>
                        <p className="text-sm text-gray-900">{dossier.Expert.name}</p>
                        <p className="text-xs text-gray-500">{dossier.Expert.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Non assigné</span>
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
              ))}
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

      {/* Alertes */}
      {(data.alertes.blockedDossiers.count > 0 || data.alertes.inactiveExperts.count > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              ⚠️ Alertes et actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.alertes.blockedDossiers.count > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-900 mb-2">
                  🟡 {data.alertes.blockedDossiers.count} dossiers sans mise à jour depuis plus de 7 jours
                </p>
                <div className="space-y-2">
                  {data.alertes.blockedDossiers.items.map((dossier: any) => (
                    <div key={dossier.id} className="text-xs text-orange-800 bg-white p-2 rounded">
                      {dossier.Client?.name || 
                        (dossier.Client?.first_name && dossier.Client?.last_name 
                          ? `${dossier.Client.first_name} ${dossier.Client.last_name}` 
                          : dossier.Client?.first_name || dossier.Client?.last_name) ||
                        dossier.Client?.company_name || 'N/A'} • {dossier.Expert?.name || 'N/A'} • 
                      Statut: {dossier.statut} • {dossier.daysSinceUpdate} jours
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.alertes.inactiveExperts.count > 0 && (
              <div>
                <p className="text-sm font-medium text-red-900 mb-2">
                  🔴 {data.alertes.inactiveExperts.count} experts inactifs avec dossiers en cours
                </p>
                <div className="space-y-2">
                  {data.alertes.inactiveExperts.items.map((expertData: any) => (
                    <div key={expertData.expertId} className="text-xs text-red-800 bg-white p-2 rounded">
                      {expertData.expert?.name || 'N/A'} • {expertData.activeDossiers} dossiers actifs • 
                      Dernière activité: Il y a {expertData.daysSinceActivity} jours
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

