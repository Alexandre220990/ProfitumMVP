import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star, 
  Search, 
  Filter, 
  Plus,
  CheckCircle,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { ApporteurRealDataService } from '../../services/apporteur-real-data-service';

/**
 * Page Produits
 * Gestion des produits et services disponibles
 */
export default function ProductsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (apporteurId && typeof apporteurId === 'string') {
      loadProducts();
    }
  }, [apporteurId]);

  const loadProducts = async () => {
    try {
      const service = new ApporteurRealDataService(apporteurId as string);
      const result = await service.getProduits();
      
      if (result.success) {
        setProducts(result.data || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      setProducts([]);
    }
  };

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder aux produits.</p>
          </div>
        </div>
      </div>
    );
  }


  const productsData = products;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Mes Produits</h1>
              <p className="text-gray-600 mt-1">Gérez vos produits et services disponibles</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, catégorie, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les catégories</option>
                    <option value="Général">Général</option>
                    <option value="Énergie">Énergie</option>
                    <option value="Social">Social</option>
                    <option value="Fiscal">Fiscal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setCategoryFilter('');
                      setStatusFilter('');
                      setSearchQuery('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Effacer les filtres
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">8</div>
                  <p className="text-sm font-semibold text-gray-600">Produits Actifs</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Produits disponibles</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">12.5%</div>
                  <p className="text-sm font-semibold text-gray-600">Commission Moyenne</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Commission moyenne</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">120</div>
                  <p className="text-sm font-semibold text-gray-600">Dossiers Totaux</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Dossiers en cours</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">90%</div>
                  <p className="text-sm font-semibold text-gray-600">Taux de Réussite</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Dossiers réussis</p>
            </CardContent>
          </Card>
        </div>

        {/* Grille des Produits Optimisée */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun produit trouvé</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Commencez par ajouter votre premier produit à votre catalogue
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un Produit
              </Button>
            </div>
          ) : (
            productsData.map((product) => (
              <Card key={product.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">{product.name}</CardTitle>
                    </div>
                    <Badge className={`${getStatusColor(product.status)} px-3 py-1 rounded-full text-sm font-semibold`}>
                      {product.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">Commission</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">{product.commission}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">Dossiers</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">{product.dossiers}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-700">Taux de Réussite</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{product.successRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${product.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 hover:bg-blue-50">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button variant="outline" className="flex-1 hover:bg-green-50">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
