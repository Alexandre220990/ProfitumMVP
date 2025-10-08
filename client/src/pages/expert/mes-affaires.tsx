import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { get } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  Euro, 
  Users, 
  Target, 
  Star, 
  BarChart3, 
  PieChart,
  CheckCircle,
  Loader2,
  Download,
  AlertCircle
} from "lucide-react";
import type { ExpertBusiness, RevenueData, ProductPerformance, ClientPerformance } from "@/types/business";

const ExpertMesAffaires = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [businessData, setBusinessData] = useState<ExpertBusiness | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [clientPerformance, setClientPerformance] = useState<ClientPerformance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const fetchBusinessData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données business
      const businessResponse = await get<ExpertBusiness>(`/api/expert/business`);
      if (businessResponse.success && businessResponse.data) {
        setBusinessData(businessResponse.data);
      }

      // Charger les données de revenus
      const revenueResponse = await get<RevenueData[]>(`/api/expert/revenue-history`);
      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data);
      }

      // Charger les performances par produit
      const productResponse = await get<ProductPerformance[]>(`/api/expert/product-performance`);
      if (productResponse.success && productResponse.data) {
        setProductPerformance(productResponse.data);
      }

      // Charger les performances par client
      const clientResponse = await get<ClientPerformance[]>(`/api/expert/client-performance`);
      if (clientResponse.success && clientResponse.data) {
        setClientPerformance(clientResponse.data);
      }

      toast.success('Vos données business ont été récupérées avec succès');

    } catch (error) {
      console.error('Erreur chargement données business:', error);
      setError('Erreur lors de la récupération des données');
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

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

  const handleExportData = (type: string) => {
    // Logique d'export des données
    console.log(`Export ${type} data`);
    toast.success(`Export des données ${type} en cours de préparation`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Chargement de vos données business...</CardTitle>
            <p className="text-gray-600">Nous préparons vos métriques et analyses</p>
          </CardContent>
        </Card>
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
      <div className="max-w-7xl mx-auto px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Problème de chargement des données</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* En-tête de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Affaires
          </h1>
          <p className="text-gray-600">
            Analysez vos performances, revenus et relations clients
          </p>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Revenus totaux</p>
                  <p className="text-2xl font-bold">
                    {businessData?.totalEarnings ? formatCurrency(businessData.totalEarnings) : '0€'}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Missions terminées</p>
                  <p className="text-2xl font-bold">{businessData?.completedAssignments || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Taux de conversion</p>
                  <p className="text-2xl font-bold">
                    {businessData?.conversionRate ? `${businessData.conversionRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Note moyenne</p>
                  <p className="text-2xl font-bold">
                    {businessData?.averageRating ? `${businessData.averageRating.toFixed(1)}/5` : '0/5'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section principale avec onglets */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Analyse détaillée</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportData('revenue')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="revenue">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Revenus
                </TabsTrigger>
                <TabsTrigger value="products">
                  <PieChart className="h-4 w-4 mr-2" />
                  Produits
                </TabsTrigger>
                <TabsTrigger value="clients">
                  <Users className="h-4 w-4 mr-2" />
                  Clients
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Métriques détaillées */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Métriques de performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Missions totales</span>
                        <span className="font-semibold">{businessData?.totalAssignments || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Taux de réussite</span>
                        <span className="font-semibold text-green-600">
                          {businessData?.completedAssignments && businessData?.totalAssignments 
                            ? `${((businessData.completedAssignments / businessData.totalAssignments) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Clients actifs</span>
                        <span className="font-semibold">{businessData?.activeClients || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Revenus du mois</span>
                        <span className="font-semibold text-blue-600">
                          {businessData?.monthlyEarnings ? formatCurrency(businessData.monthlyEarnings) : '0€'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Graphique de revenus (simplifié) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Évolution des revenus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {revenueData.slice(-6).map((data, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{data.month}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{formatCurrency(data.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="revenue" className="mt-6">
                <div className="space-y-6">
                  {/* Tableau des revenus */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Historique des revenus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mois</TableHead>
                            <TableHead>Revenus</TableHead>
                            <TableHead>Missions</TableHead>
                            <TableHead>Moyenne par mission</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData.map((data, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{data.month}</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(data.revenue)}
                              </TableCell>
                              <TableCell>{data.assignments}</TableCell>
                              <TableCell>
                                {data.assignments > 0 ? formatCurrency(data.revenue / data.assignments) : '0€'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance par produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Missions</TableHead>
                          <TableHead>Revenus</TableHead>
                          <TableHead>Taux de réussite</TableHead>
                          <TableHead>Note moyenne</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productPerformance.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.product}</TableCell>
                            <TableCell>{product.assignments}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatCurrency(product.revenue)}
                            </TableCell>
                            <TableCell>
                              <Badge className={product.successRate >= 80 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                {product.successRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>{product.averageRating.toFixed(1)}/5</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance par client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Missions</TableHead>
                          <TableHead>Revenus</TableHead>
                          <TableHead>Note moyenne</TableHead>
                          <TableHead>Dernière mission</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientPerformance.map((client, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{client.clientName}</TableCell>
                            <TableCell>{client.totalAssignments}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatCurrency(client.totalRevenue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>{client.averageRating.toFixed(1)}/5</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(client.lastAssignment)}</TableCell>
                            <TableCell>
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
                  </CardContent>
                </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </div>
  );
};

export default ExpertMesAffaires; 