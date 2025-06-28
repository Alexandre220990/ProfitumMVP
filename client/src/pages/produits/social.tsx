import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Building2, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SocialProduct {
  id: string;
  name: string;
  description: string;
  category: 'URSSAF' | 'MSA' | 'Retraite' | 'Santé';
  estimatedGain: number;
  duration: string;
  requirements: string[];
  status: 'eligible' | 'ineligible' | 'pending';
}

const SocialProductsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientProduitEligible, setClientProduitEligible] = useState<any>(null);

  // Vérifier que l'utilisateur connecté peut accéder au produit éligible
  useEffect(() => {
    if (!user?.id || !productId) return;

    const checkAccess = async () => {
      try {
        // Récupérer le ClientProduitEligible pour vérifier l'autorisation
        const response = await fetch(`/api/produits-eligibles/${productId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Vérifier que l'utilisateur connecté est le propriétaire du produit
            const clientResponse = await fetch(`/api/client/profile`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              if (clientData.success && clientData.data) {
                if (data.data.client_id !== clientData.data.id) {
                  console.warn('⚠️ Accès non autorisé, redirection vers le dashboard');
                  navigate(`/dashboard/client/${user.id}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification d\'accès:', error);
        navigate(`/dashboard/client/${user.id}`);
      }
    };

    checkAccess();
  }, [user, productId, navigate]);

  useEffect(() => {
    const fetchSocialProducts = async () => {
      try {
        setLoading(true);
        
        // Si productId est en fait un ID de ClientProduitEligible, récupérer ses détails
        if (productId && productId.length > 20) { // Probablement un UUID de produit
          console.log('🔍 Récupération du ClientProduitEligible:', productId);
          
          const response = await fetch(`/api/produits-eligibles/${productId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setClientProduitEligible(data.data);
              console.log('✅ ClientProduitEligible récupéré:', data.data);
            }
          }
        }
        
        // Simuler un appel API pour récupérer les produits sociaux
        const mockProducts: SocialProduct[] = [
          {
            id: '1',
            name: 'Optimisation Charges URSSAF',
            description: 'Réduction des charges sociales via des dispositifs légaux d\'optimisation',
            category: 'URSSAF',
            estimatedGain: 15000,
            duration: '3-6 mois',
            requirements: ['Entreprise de moins de 50 salariés', 'CA < 10M€'],
            status: 'eligible'
          },
          {
            id: '2',
            name: 'Optimisation MSA Agricole',
            description: 'Optimisation des cotisations MSA pour les exploitants agricoles',
            category: 'MSA',
            estimatedGain: 8000,
            duration: '2-4 mois',
            requirements: ['Exploitant agricole', 'Surface > 5ha'],
            status: 'eligible'
          },
          {
            id: '3',
            name: 'Complémentaire Santé Collective',
            description: 'Mise en place d\'une complémentaire santé avantageuse',
            category: 'Santé',
            estimatedGain: 5000,
            duration: '1-2 mois',
            requirements: ['Plus de 10 salariés', 'Accord d\'entreprise'],
            status: 'pending'
          },
          {
            id: '4',
            name: 'Retraite Complémentaire',
            description: 'Optimisation des cotisations retraite complémentaire',
            category: 'Retraite',
            estimatedGain: 12000,
            duration: '4-8 mois',
            requirements: ['Entreprise de plus de 20 salariés'],
            status: 'ineligible'
          }
        ];

        setProducts(mockProducts);
      } catch (error) {
        console.error('Erreur lors du chargement des produits sociaux:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchSocialProducts();
    }
  }, [productId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'URSSAF':
        return <Building2 className="h-4 w-4" />;
      case 'MSA':
        return <Users className="h-4 w-4" />;
      case 'Retraite':
        return <TrendingUp className="h-4 w-4" />;
      case 'Santé':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'eligible':
        return <Badge className="bg-green-100 text-green-800">Éligible</Badge>;
      case 'ineligible':
        return <Badge variant="secondary">Non éligible</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const handleProductClick = (product: SocialProduct) => {
    navigate(`/produits/social/${product.id}`, { 
      state: { 
        product, 
        productId 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/client/${user?.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produits Sociaux</h1>
            <p className="text-gray-600">Optimisez vos charges sociales et votre protection sociale</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Produits éligibles</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.status === 'eligible').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Gain potentiel</p>
                  <p className="text-2xl font-bold">
                    {products
                      .filter(p => p.status === 'eligible')
                      .reduce((sum, p) => sum + p.estimatedGain, 0)
                      .toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Total produits</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProductClick(product)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(product.category)}
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  {getStatusBadge(product.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Gain estimé :</span>
                    <span className="font-semibold text-green-600">
                      {product.estimatedGain.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Durée :</span>
                    <span className="font-medium">{product.duration}</span>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-500 mb-2">Prérequis :</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {product.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">
                Besoin d'aide pour optimiser vos charges sociales ?
              </h3>
              <p className="text-gray-600 mb-6">
                Nos experts vous accompagnent dans la mise en place de ces optimisations
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => navigate(`/chatbot?client_id=${productId}`)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Discuter avec un expert
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/dashboard/client/${user?.id}`)}
                >
                  Retour au dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SocialProductsPage;
