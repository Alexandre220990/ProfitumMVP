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
import { motion } from 'framer-motion';
import { config } from '../../config';
import { toast } from 'sonner';

/**
 * Page Produits
 * Gestion des produits et services disponibles
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/produits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setProducts(result.data || []);
      } else {
        toast.error('Erreur lors du chargement des produits');
        setProducts([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      toast.error('Erreur de connexion');
      setProducts([]);
    }
  };

  // 🔥 Handlers pour les actions produits
  const handleViewProduct = (_productId: string, productName: string) => {
    toast.info(`Détails du produit "${productName}"`);
    // TODO: Naviguer vers page détail produit
    // navigate(`/apporteur/products/${_productId}`);
  };

  const handleEditProduct = (_productId: string, productName: string) => {
    toast.info(`Modification du produit "${productName}"`);
    // TODO: Naviguer vers page édition produit
    // navigate(`/apporteur/products/${_productId}/edit`);
  };

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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
        <motion.div 
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
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
        </motion.div>

        {/* Statistiques Optimisées */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
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
        </motion.div>

        {/* Grille des Produits Optimisée avec Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.length === 0 ? (
            <motion.div 
              className="col-span-full text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
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
            </motion.div>
          ) : (
            productsData.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.03 }}
              >
                <Card className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-0 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="p-2 bg-blue-100 rounded-lg"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <DollarSign className="h-6 w-6 text-blue-600" />
                        </motion.div>
                        <CardTitle className="text-xl font-bold text-gray-900">{product.nom || product.name}</CardTitle>
                      </div>
                      <Badge className={`${getStatusColor(product.status || 'active')} px-3 py-1 rounded-full text-sm font-semibold`}>
                        {product.status || 'actif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                          className="bg-gray-50 p-3 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-gray-700">Catégorie</span>
                          </div>
                          <p className="text-lg font-bold text-green-600">{product.categorie || 'N/A'}</p>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-gray-50 p-3 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-700">Type</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">{product.secteur || 'Général'}</p>
                        </motion.div>
                      </div>
                      
                      <motion.div 
                        className="bg-gray-50 p-3 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-semibold text-gray-700">Disponible</span>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </motion.div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-all"
                            onClick={() => handleViewProduct(product.id, product.nom || product.name)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 hover:bg-green-50 hover:border-green-300 transition-all"
                            onClick={() => handleEditProduct(product.id, product.nom || product.name)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
