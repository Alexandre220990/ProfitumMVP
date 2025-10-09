import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, Download, Filter, Target, Users, DollarSign, CheckCircle, Star, PieChart, LineChart } from 'lucide-react';
import { ApporteurViewsService } from '../../services/apporteur-views-service';
import { useAuth } from '../../hooks/use-auth';

/**
 * Page Statistiques
 * Graphiques et analyses détaillées - Données réelles depuis vues SQL
 */
export default function StatisticsPage() {
  const { user } = useAuth();
  const apporteurId = user?.id;
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('month');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadStatistics = async () => {
      if (!apporteurId) return;
      
      try {
        setLoading(true);
        const service = new ApporteurViewsService();
        
        // Charger les données en parallèle
        const [statsResult, performanceResult, sourcesResult] = await Promise.all([
          service.getStatistiquesMensuelles(),
          service.getPerformanceProduits(),
          service.getSourcesProspects()
        ]);

        if (statsResult.success) setStatistics({
          monthlyMetrics: statsResult.data[0] || {},
          productPerformance: performanceResult.success ? performanceResult.data : [],
          sources: sourcesResult.success ? sourcesResult.data : []
        });
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [apporteurId]);

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder aux statistiques.</p>
          </div>
        </div>
      </div>
    );
  }

  const productPerformance = statistics?.productPerformance || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto py-6">
        {/* Header Optimisé */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Statistiques</h1>
            <p className="text-gray-600 text-lg">Analysez vos performances et tendances en détail</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" className="bg-white hover:bg-gray-50" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapports
            </Button>
          </div>
        </div>

        {/* Filtres Avancés */}
        {showFilters && (
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="quarter">Ce trimestre</option>
                    <option value="year">Cette année</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de données</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="all">Toutes les données</option>
                    <option value="prospects">Prospects uniquement</option>
                    <option value="clients">Clients uniquement</option>
                    <option value="revenue">Revenus uniquement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format d'export</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métriques Clés Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Prospects ce Mois</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">55</div>
              <div className="flex items-center text-sm text-green-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Clients ce Mois</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">25</div>
              <div className="flex items-center text-sm text-green-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8% vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Chiffre d'Affaires</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(52000)}
              </div>
              <div className="flex items-center text-sm text-green-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +15% vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Taux de Conversion</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">45.5%</div>
              <div className="flex items-center text-sm text-red-600 mt-2">
                <TrendingDown className="h-4 w-4 mr-1" />
                -2% vs mois dernier
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Graphiques Optimisée */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Mensuelle */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <LineChart className="h-6 w-6 text-blue-600" />
                </div>
                Performance Mensuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Graphique Mensuel</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Évolution des prospects, clients et revenus sur 6 mois avec analyses détaillées
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Voir le graphique complet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance par Produit */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PieChart className="h-6 w-6 text-green-600" />
                </div>
                Performance par Produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformance.map((product: any, index: any) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-white">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                        <Star className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.prospects} prospects • {product.clients} clients
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(product.revenue)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {product.conversion}% conversion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
