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
import { 
  TrendingUp, 
  Euro, 
  Package, 
  Star, 
  BarChart3, 
  PieChart,
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

// ============================================================================
// COMPOSANT - MES AFFAIRES (Analytics Business Pure)
// ============================================================================

const ExpertMesAffaires = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [clientPerformance, setClientPerformance] = useState<ClientPerformance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Charger les données en parallèle
        const [revenueRes, productRes, clientRes] = await Promise.all([
          get<RevenueData[]>(`/api/expert/revenue-history`),
          get<ProductPerformance[]>(`/api/expert/product-performance`),
          get<ClientPerformance[]>(`/api/expert/client-performance`)
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
                    <CardTitle>Historique des revenus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueData.length > 0 ? (
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
                    ) : (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Aucune donnée de revenus disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Les données apparaîtront au fur et à mesure de vos missions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance par produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {productPerformance.length > 0 ? (
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
                                <Badge className={(product.successRate ?? 0) >= 80 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                  {product.successRate ? product.successRate.toFixed(1) : '0.0'}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span>{product.averageRating ? product.averageRating.toFixed(1) : '0.0'}/5</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Aucune donnée produit disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Complétez vos premières missions pour voir vos performances par produit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance par client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientPerformance.length > 0 ? (
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
                                  <span>{client.averageRating ? client.averageRating.toFixed(1) : '0.0'}/5</span>
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
                    ) : (
                      <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Aucune donnée client disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Vos statistiques clients apparaîtront ici</p>
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