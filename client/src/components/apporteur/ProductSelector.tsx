import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  Target
} from 'lucide-react';

interface ProductEligible {
  id: string;
  nom: string;
  description: string;
  categorie: string;
  montant_min: number;
  montant_max: number;
  taux_min: number;
  taux_max: number;
  duree_min: number;
  duree_max: number;
  conditions: string[];
  avantages: string[];
}

interface SelectedProduct {
  id: string;
  selected: boolean;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_amount?: number;
  success_probability?: number;
}

interface ProductSelectorProps {
  onSelectionChange?: (selectedProducts: SelectedProduct[]) => void;
  initialSelection?: SelectedProduct[];
}

export default function ProductSelector({ 
  onSelectionChange, 
  initialSelection = [] 
}: ProductSelectorProps) {
  const [products, setProducts] = useState<ProductEligible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(initialSelection);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedProducts);
    }
  }, [selectedProducts, onSelectionChange]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Récupération des produits depuis l\'API...');
      
      // Appel à l'API pour récupérer les produits réels
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/apporteur/produits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Réponse API produits:', response.status);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }

      const result = await response.json();
      
      console.log('✅ Résultat API:', result.success, 'Nombre de produits:', result.data?.length);
      
      if (result.success && result.data) {
        setProducts(result.data);
        setError(null);
      } else {
        console.warn('⚠️ API retourné sans succès, utilisation des données mock');
        // Fallback sur données mock si l'API échoue
        const mockProducts: ProductEligible[] = [
        {
          id: '1',
          nom: 'CIR - Crédit Impôt Recherche',
          description: 'Réduction d\'impôt pour les dépenses de R&D',
          categorie: 'Fiscal',
          montant_min: 10000,
          montant_max: 1000000,
          taux_min: 30,
          taux_max: 50,
          duree_min: 1,
          duree_max: 3,
          conditions: ['Activité de R&D', 'Personnel qualifié'],
          avantages: ['Réduction d\'impôt', 'Financement R&D']
        },
        {
          id: '2',
          nom: 'TICPE - Taxe Intérieure de Consommation',
          description: 'Remboursement de la TICPE sur les carburants',
          categorie: 'Environnemental',
          montant_min: 5000,
          montant_max: 500000,
          taux_min: 20,
          taux_max: 40,
          duree_min: 1,
          duree_max: 2,
          conditions: ['Transport routier', 'Flotte de véhicules'],
          avantages: ['Remboursement TICPE', 'Économies carburant']
        },
        {
          id: '3',
          nom: 'URSSAF - Réduction Charges Sociales',
          description: 'Réduction des charges sociales pour l\'embauche',
          categorie: 'Social',
          montant_min: 2000,
          montant_max: 200000,
          taux_min: 25,
          taux_max: 50,
          duree_min: 1,
          duree_max: 2,
          conditions: ['Embauche CDI', 'Première embauche'],
          avantages: ['Réduction charges', 'Aide embauche']
        }
      ];
      
        setProducts(mockProducts);
      }
    } catch (err) {
      console.error('Erreur fetchProducts:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // En cas d'erreur, utiliser les données mock
      const fallbackProducts: ProductEligible[] = [
        {
          id: '1',
          nom: 'CIR - Crédit Impôt Recherche',
          description: 'Réduction d\'impôt pour les dépenses de R&D',
          categorie: 'Fiscal',
          montant_min: 10000,
          montant_max: 1000000,
          taux_min: 30,
          taux_max: 50,
          duree_min: 1,
          duree_max: 3,
          conditions: ['Activité de R&D', 'Personnel qualifié'],
          avantages: ['Réduction d\'impôt', 'Financement R&D']
        },
        {
          id: '2',
          nom: 'TICPE - Taxe Intérieure de Consommation',
          description: 'Remboursement de la TICPE sur les carburants',
          categorie: 'Environnemental',
          montant_min: 5000,
          montant_max: 500000,
          taux_min: 20,
          taux_max: 40,
          duree_min: 1,
          duree_max: 2,
          conditions: ['Transport routier', 'Flotte de véhicules'],
          avantages: ['Remboursement TICPE', 'Économies carburant']
        },
        {
          id: '3',
          nom: 'URSSAF - Réduction Charges Sociales',
          description: 'Réduction des charges sociales pour l\'embauche',
          categorie: 'Social',
          montant_min: 2000,
          montant_max: 200000,
          taux_min: 25,
          taux_max: 50,
          duree_min: 1,
          duree_max: 2,
          conditions: ['Embauche CDI', 'Première embauche'],
          avantages: ['Réduction charges', 'Aide embauche']
        }
      ];
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === productId);
      if (existing) {
        return prev.map(p => 
          p.id === productId ? { ...p, selected } : p
        );
      } else {
        return [...prev, { id: productId, selected, priority: 'medium' }];
      }
    });
  };

  const handleProductUpdate = (productId: string, updates: Partial<SelectedProduct>) => {
    setSelectedProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      )
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchProducts} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sélection Produits</h1>
          <p className="text-gray-600">Choisissez les produits éligibles pour ce prospect</p>
        </div>
        <div className="text-sm text-gray-500">
          {selectedProducts.filter(p => p.selected).length} produit(s) sélectionné(s)
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les catégories</option>
                <option value="Fiscal">Fiscal</option>
                <option value="Environnemental">Environnemental</option>
                <option value="Social">Social</option>
                <option value="Énergétique">Énergétique</option>
              </select>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <div className="grid gap-4">
        {filteredProducts.map((product) => {
          const selected = selectedProducts.find(p => p.id === product.id);
          const isSelected = selected?.selected || false;
          
          return (
            <Card key={product.id} className={`hover:shadow-md transition-shadow ${
              isSelected ? 'border-blue-500 bg-blue-50' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{product.nom}</h3>
                      <Badge variant="outline">{product.categorie}</Badge>
                      {isSelected && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sélectionné
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {(product.montant_min !== null || product.montant_max !== null) && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {product.montant_min !== null ? product.montant_min.toLocaleString() : 'N/A'}€ - {product.montant_max !== null ? product.montant_max.toLocaleString() : 'N/A'}€
                          </span>
                        </div>
                      )}
                      {(product.taux_min !== null || product.taux_max !== null) && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {product.taux_min !== null ? product.taux_min : 'N/A'}% - {product.taux_max !== null ? product.taux_max : 'N/A'}%
                          </span>
                        </div>
                      )}
                      {(product.duree_min !== null || product.duree_max !== null) && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-gray-600">
                            {product.duree_min !== null ? product.duree_min : 'N/A'}-{product.duree_max !== null ? product.duree_max : 'N/A'} mois
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="border-t pt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`priority-${product.id}`}>Priorité</Label>
                            <select
                              id={`priority-${product.id}`}
                              value={selected?.priority || 'medium'}
                              onChange={(e) => handleProductUpdate(product.id, { 
                                priority: e.target.value as 'high' | 'medium' | 'low' 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="high">Haute</option>
                              <option value="medium">Moyenne</option>
                              <option value="low">Basse</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`amount-${product.id}`}>Montant estimé (€)</Label>
                            <Input
                              id={`amount-${product.id}`}
                              type="number"
                              value={selected?.estimated_amount || ''}
                              onChange={(e) => handleProductUpdate(product.id, { 
                                estimated_amount: Number(e.target.value) 
                              })}
                              placeholder="Montant estimé"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`probability-${product.id}`}>Probabilité de succès (%)</Label>
                            <Input
                              id={`probability-${product.id}`}
                              type="number"
                              min="0"
                              max="100"
                              value={selected?.success_probability || ''}
                              onChange={(e) => handleProductUpdate(product.id, { 
                                success_probability: Number(e.target.value) 
                              })}
                              placeholder="0-100"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`notes-${product.id}`}>Notes</Label>
                          <Input
                            id={`notes-${product.id}`}
                            value={selected?.notes || ''}
                            onChange={(e) => handleProductUpdate(product.id, { 
                              notes: e.target.value 
                            })}
                            placeholder="Notes sur ce produit..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter 
                ? 'Aucun produit ne correspond à vos critères de recherche.'
                : 'Aucun produit disponible pour le moment.'
              }
            </p>
            {(searchTerm || categoryFilter) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
