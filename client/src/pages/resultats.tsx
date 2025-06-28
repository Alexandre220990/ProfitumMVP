import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { Building, Truck, DollarSign, BarChart3, Users, FileText, Home, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { get } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string;
  score: number;
  economie_estimee: number;
  taux_interet: number;
}

const getIconForProduct = (productId: string) => {
  switch (productId) {
    case 'msa':
      return Building;
    case 'ticpe':
      return Truck;
    case 'urssaf':
      return Users;
    case 'dfs':
      return DollarSign;
    case 'foncier':
      return Home;
    case 'fiscal':
      return FileText;
    case 'audit_energetique':
      return Lightbulb;
    default:
      return BarChart3;
  }
};

const ResultatsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const simulationId = urlParams.get('simulationId');

        if (!simulationId) {
          throw new Error('ID de simulation manquant');
        }

        const response = await get<any>(`/simulations/${simulationId}/results`);
        
        if (response.success && response.data?.products) {
          setResults(response.data.products);
        } else {
          throw new Error(response.message || 'Erreur lors de la récupération des résultats');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Impossible de charger les résultats. Veuillez réessayer.');
        toast({
          title: "Erreur",
          description: "Impossible de charger les résultats. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Accès non autorisé. Veuillez vous connecter.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Chargement des résultats...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderClient />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">
          🎯 Résultats de votre simulation
        </h1>

        {error ? (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Produits recommandés pour votre entreprise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((product) => {
                const Icon = getIconForProduct(product.id);
                return (
                  <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="space-y-1 text-center bg-blue-50 p-6">
                      <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <CardDescription className="text-gray-600 text-sm mb-6">
                        {product.description}
                      </CardDescription>
                      <div className="mt-4 space-y-2">
                        <p className="text-green-600 font-semibold">
                          Score de compatibilité : {product.score}%
                        </p>
                        <p className="text-blue-600">
                          Économie estimée : {product.economie_estimee.toLocaleString('fr-FR')} €
                        </p>
                        {product.taux_interet > 0 && (
                          <p className="text-purple-600">
                            Taux d'intérêt : {product.taux_interet}%
                          </p>
                        )}
                      </div>
                      <div className="mt-auto pt-4">
                        <Link to={`/produits/${product.id}`} className="block">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            En savoir plus
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                className="mx-auto"
                asChild
              >
                <Link to="/dashboard/client">Retour au tableau de bord</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultatsPage; 