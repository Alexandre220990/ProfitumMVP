import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { get } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Euro, 
  Package, 
  Star, 
  BarChart3, 
  Loader2,
  Download,
  AlertCircle,
  ArrowLeft,
  Building2
} from "lucide-react";

// ============================================================================
// TYPES - Analytics Business
// ============================================================================

interface ProductPerformance {
  product: string;
  assignments: number;
  revenue: number;
  successRate: number;
  averageRating: number;
}

interface ClientPerformance {
  clientId: string;
  clientName: string;
  totalAssignments: number;
  totalRevenue: number;
  averageRating: number;
  lastAssignment: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  assignments: number;
}

interface RevenuePipeline {
  prospects: {
    count: number;
    montantTotal: number;
    montantPotentiel: number;
    probability: number;
  };
  enSignature: {
    count: number;
    montantTotal: number;
    montantPotentiel: number;
    probability: number;
  };
  signes: {
    count: number;
    montantTotal: number;
    commissionExpert: number;
  };
  totalPrevisionnel: number;
}

interface Dossier {
  id: string;
  clientName: string;
  produit: string;
  montant: number;
  taux: number;
  dateCreation: string;
  dateUpdate: string;
  statut: string;
}

// ============================================================================
// COMPOSANT - MES AFFAIRES (Analytics Business Pure)
// ============================================================================

const ExpertMesAffaires = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [clientPerformance, setClientPerformance] = useState<ClientPerformance[]>([]);
  const [revenuePipeline, setRevenuePipeline] = useState<RevenuePipeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(true);
  
  // États pour les dossiers détaillés
  const [selectedPipelineStatus, setSelectedPipelineStatus] = useState<'prospects' | 'en_signature' | 'signes' | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loadingDossiers, setLoadingDossiers] = useState(false);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Charger les données en parallèle
        const [revenueRes, productRes, clientRes, pipelineRes] = await Promise.all([
          get<RevenueData[]>(`/api/expert/revenue-history`),
          get<ProductPerformance[]>(`/api/expert/product-performance`),
          get<ClientPerformance[]>(`/api/expert/client-performance`),
          get<RevenuePipeline>(`/api/expert/dashboard/revenue-pipeline`)
        ]);

        if (revenueRes.success && revenueRes.data) {
          setRevenueData(revenueRes.data);
        }

        if (productRes.success && productRes.data) {
          setProductPerformance(productRes.data);
        }

        if (clientRes.success && clientRes.data) {
          setClientPerformance(clientRes.data);
        }

        if (pipelineRes.success && pipelineRes.data) {
          setRevenuePipeline(pipelineRes.data);
        }

      } catch (error) {
        console.error('Erreur chargement données business:', error);
        setError('Erreur lors de la récupération des données');
        toast.error('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [user?.id]);

  // Fonction pour charger les dossiers par statut
  const handlePipelineClick = async (status: 'prospects' | 'en_signature' | 'signes') => {
    if (selectedPipelineStatus === status) {
      // Si on clique sur la même tuile, on ferme
      setSelectedPipelineStatus(null);
      setDossiers([]);
      return;
    }

    try {
      setLoadingDossiers(true);
      setSelectedPipelineStatus(status);
      
      const response = await get<Dossier[]>(`/api/expert/dashboard/dossiers-by-status/${status}`);
      
      if (response.success && response.data) {
        setDossiers(response.data);
      } else {
        setDossiers([]);
        toast.error('Erreur lors du chargement des dossiers');
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
      setDossiers([]);
      toast.error('Erreur lors du chargement des dossiers');
    } finally {
      setLoadingDossiers(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-xl mb-2">Chargement de vos analytics business...</p>
          <p className="text-gray-600">Analyse de vos performances</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate("/connexion-expert")} className="w-full">
              Se connecter
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-10 pt-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Problème de chargement des données</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard/expert')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10 pt-24">
        
        {/* En-tête de la page */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/expert')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Mes Affaires
              </h1>
            </div>
            <p className="text-gray-600">
              Analytics détaillés : Revenus, Produits, Clients
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* 💰 REVENUE PIPELINE - Montant Récupérable Potentiel */}
        {revenuePipeline && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-900">Pipeline de Revenus Prévisionnel</span>
                </CardTitle>
                <Badge className="bg-emerald-600 text-white">
                  Données en temps réel
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Prospects */}
                <div 
                  onClick={() => handlePipelineClick('prospects')}
                  className={`bg-white p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                    selectedPipelineStatus === 'prospects' 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-blue-100 hover:border-blue-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-600 mb-3">Prospects qualifiés</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {revenuePipeline.prospects.count} dossiers • {revenuePipeline.prospects.montantTotal.toLocaleString()}€
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-3xl font-bold text-blue-600">
                      {revenuePipeline.prospects.montantPotentiel.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-500">Potentiel {revenuePipeline.prospects.probability * 100}%</p>
                  </div>
                  <Progress value={revenuePipeline.prospects.probability * 100} className="h-2 mt-2" />
                  {selectedPipelineStatus === 'prospects' && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">📋 Cliquez pour masquer</p>
                  )}
                </div>

                {/* En signature */}
                <div 
                  onClick={() => handlePipelineClick('en_signature')}
                  className={`bg-white p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                    selectedPipelineStatus === 'en_signature' 
                      ? 'border-orange-500 ring-2 ring-orange-200' 
                      : 'border-orange-100 hover:border-orange-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-600 mb-3">En signature</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {revenuePipeline.enSignature.count} dossiers • {revenuePipeline.enSignature.montantTotal.toLocaleString()}€
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-3xl font-bold text-orange-600">
                      {revenuePipeline.enSignature.montantPotentiel.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-500">Potentiel {revenuePipeline.enSignature.probability * 100}%</p>
                  </div>
                  <Progress value={revenuePipeline.enSignature.probability * 100} className="h-2 mt-2" />
                  {selectedPipelineStatus === 'en_signature' && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">📋 Cliquez pour masquer</p>
                  )}
                </div>

                {/* Signés */}
                <div 
                  onClick={() => handlePipelineClick('signes')}
                  className={`bg-white p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                    selectedPipelineStatus === 'signes' 
                      ? 'border-green-500 ring-2 ring-green-200' 
                      : 'border-green-100 hover:border-green-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-600 mb-3">Signés (sécurisés)</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {revenuePipeline.signes.count} dossiers • {revenuePipeline.signes.montantTotal.toLocaleString()}€
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-3xl font-bold text-green-600">
                      {revenuePipeline.signes.commissionExpert.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-500">Votre commission</p>
                  </div>
                  {selectedPipelineStatus === 'signes' && (
                    <p className="text-xs text-green-600 mt-2 font-medium">📋 Cliquez pour masquer</p>
                  )}
                </div>
              </div>

              {/* Total prévisionnel */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8 rounded-xl text-center shadow-xl">
                <p className="text-sm font-medium text-emerald-100 mb-2 uppercase tracking-wide">Revenus Prévisionnels Totaux</p>
                <p className="text-5xl font-bold mb-2">
                  {revenuePipeline.totalPrevisionnel.toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-emerald-100 mt-2">Basé sur probabilités de conversion et dossiers en cours</p>
                <div className="mt-4 pt-4 border-t border-emerald-400/30">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-emerald-200">Prospects</p>
                      <p className="font-bold text-lg">{revenuePipeline.prospects.montantPotentiel.toLocaleString('fr-FR')}€</p>
                    </div>
                    <div>
                      <p className="text-emerald-200">En signature</p>
                      <p className="font-bold text-lg">{revenuePipeline.enSignature.montantPotentiel.toLocaleString('fr-FR')}€</p>
                    </div>
                    <div>
                      <p className="text-emerald-200">Signés</p>
                      <p className="font-bold text-lg">{revenuePipeline.signes.commissionExpert.toLocaleString('fr-FR')}€</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau des dossiers détaillés */}
              {selectedPipelineStatus && (
                <div className="mt-6">
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Détails des dossiers - {
                          selectedPipelineStatus === 'prospects' ? 'Prospects qualifiés' :
                          selectedPipelineStatus === 'en_signature' ? 'En signature' :
                          'Signés (sécurisés)'
                        }
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    {loadingDossiers ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-gray-600">Chargement des dossiers...</span>
                      </div>
                    ) : dossiers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead>Produit</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Taux</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Date création</TableHead>
                              <TableHead>Dernière màj</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dossiers.map((dossier) => (
                              <TableRow key={dossier.id}>
                                <TableCell className="font-medium">{dossier.clientName}</TableCell>
                                <TableCell>{dossier.produit}</TableCell>
                                <TableCell className="font-semibold text-blue-600">
                                  {formatCurrency(dossier.montant)}
                                </TableCell>
                                <TableCell>{dossier.taux.toFixed(2)}%</TableCell>
                                <TableCell>
                                  <Badge className={
                                    dossier.statut === 'Prospect' ? 'bg-blue-100 text-blue-800' :
                                    dossier.statut === 'En signature' ? 'bg-orange-100 text-orange-800' :
                                    'bg-green-100 text-green-800'
                                  }>
                                    {dossier.statut}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(dossier.dateCreation)}</TableCell>
                                <TableCell>{formatDate(dossier.dateUpdate)}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/expert/dossier/${dossier.id}`);
                                    }}
                                  >
                                    Voir
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Aucun dossier trouvé</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section principale avec onglets */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="revenue">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Revenus
                </TabsTrigger>
                <TabsTrigger value="products">
                  <Package className="h-4 w-4 mr-2" />
                  Produits
                </TabsTrigger>
                <TabsTrigger value="clients">
                  <Building2 className="h-4 w-4 mr-2" />
                  Clients
                </TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Historique des revenus
                      </CardTitle>
                      {revenueData.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Total: <span className="font-bold text-green-600">
                            {formatCurrency(revenueData.reduce((sum, d) => sum + d.revenue, 0))}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {revenueData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Mois</TableHead>
                                <TableHead className="text-right">Revenus</TableHead>
                                <TableHead className="text-right">Missions</TableHead>
                                <TableHead className="text-right">Moyenne par mission</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {revenueData.map((data, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="font-medium">{data.month}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {formatCurrency(data.revenue)}
                                  </TableCell>
                                  <TableCell className="text-right">{data.assignments}</TableCell>
                                  <TableCell className="text-right">
                                    {data.assignments > 0 ? formatCurrency(data.revenue / data.assignments) : '0€'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Graphique simple avec barres */}
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Évolution mensuelle</h4>
                          <div className="space-y-3">
                            {revenueData.slice().reverse().map((data, index) => {
                              const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
                              const percentage = (data.revenue / maxRevenue) * 100;
                              return (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{data.month}</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Aucune donnée de revenus disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Les données apparaîtront au fur et à mesure de vos missions terminées</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        Performance par produit
                      </CardTitle>
                      {productPerformance.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {productPerformance.length} produit{productPerformance.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {productPerformance.length > 0 ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-right">Missions</TableHead>
                                <TableHead className="text-right">Revenus</TableHead>
                                <TableHead className="text-right">Taux de réussite</TableHead>
                                <TableHead className="text-right">Note moyenne</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {productPerformance.map((product, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="font-medium">{product.product}</TableCell>
                                  <TableCell className="text-right">{product.assignments}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {formatCurrency(product.revenue)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge className={
                                      (product.successRate ?? 0) >= 80 
                                        ? "bg-green-100 text-green-800 border-green-300" 
                                        : (product.successRate ?? 0) >= 50
                                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                        : "bg-red-100 text-red-800 border-red-300"
                                    }>
                                      {product.successRate ? product.successRate.toFixed(1) : '0.0'}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                      <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                                      <span className="font-medium">{product.averageRating ? product.averageRating.toFixed(1) : '0.0'}/5</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Statistiques résumées */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total missions</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {productPerformance.reduce((sum, p) => sum + p.assignments, 0)}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total revenus</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(productPerformance.reduce((sum, p) => sum + p.revenue, 0))}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Taux de réussite moyen</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {productPerformance.length > 0
                                ? (productPerformance.reduce((sum, p) => sum + (p.successRate || 0), 0) / productPerformance.length).toFixed(1)
                                : '0.0'}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Aucune donnée produit disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Complétez vos premières missions pour voir vos performances par produit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Performance par client
                      </CardTitle>
                      {clientPerformance.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {clientPerformance.length} client{clientPerformance.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientPerformance.length > 0 ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Missions</TableHead>
                                <TableHead className="text-right">Revenus</TableHead>
                                <TableHead className="text-right">Note moyenne</TableHead>
                                <TableHead>Dernière mission</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clientPerformance.map((client, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="font-medium">{client.clientName}</TableCell>
                                  <TableCell className="text-right">{client.totalAssignments}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {formatCurrency(client.totalRevenue)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                      <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                                      <span className="font-medium">{client.averageRating ? client.averageRating.toFixed(1) : '0.0'}/5</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{formatDate(client.lastAssignment)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/expert/client/${client.clientId}`)}
                                    >
                                      Voir détails
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Statistiques résumées */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total clients</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {clientPerformance.length}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total revenus</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(clientPerformance.reduce((sum, c) => sum + c.totalRevenue, 0))}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Note moyenne globale</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {clientPerformance.length > 0
                                ? (clientPerformance.reduce((sum, c) => sum + (c.averageRating || 0), 0) / clientPerformance.length).toFixed(1)
                                : '0.0'}/5
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Aucune donnée client disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Vos statistiques clients apparaîtront ici au fur et à mesure de vos missions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpertMesAffaires; 