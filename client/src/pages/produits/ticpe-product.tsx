import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductProcessWorkflow from '@/components/ProductProcessWorkflow';
import { Fuel, TrendingUp, Shield, Clock, Calculator, Award, Truck, Building2, CheckCircle } from "lucide-react";
import { config } from "@/config/env";
import HeaderClient from "@/components/HeaderClient";

interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  tauxFinal: number;
  montantFinal: number;
  dureeFinale: number;
  created_at: string;
  updated_at: string;
  simulationId: number;
  metadata: any;
  notes: string;
  priorite: number;
  dateEligibilite: string;
  current_step: number;
  progress: number;
  expert_id?: string;
  charte_signed: boolean;
  charte_signed_at?: string;
  ProduitEligible: {
    id: string;
    nom: string;
    description: string;
    category: string;
  };
}

export default function TICPEProductPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // États pour les données
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);
  const [loading, setLoading] = useState(true);
  


  // Vérification de sécurité
  useEffect(() => {
    if (!user || user.type !== 'client') {
      navigate('/connexion-client');
      return;
    }
  }, [user, navigate]);

  // Chargement des données
  useEffect(() => {
    if (user?.id) {
      loadClientProduit();
    }
  }, [user]);

  const loadClientProduit = async () => {
    try {
      setLoading(true);
      
      // Charger les produits éligibles du client
      const response = await fetch(`${config.API_URL}/api/client/produits-eligibles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Trouver le produit TICPE
          const ticpeProduit = data.data.find((produit: ClientProduitEligible) => 
            produit.ProduitEligible.nom.toLowerCase().includes('ticpe')
          );
          setClientProduit(ticpeProduit || null);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };





  // Si pas connecté ou en cours de chargement
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Process Workflow */}
      {clientProduit && clientProduit.id && (
        <div className="bg-white border-b mt-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <ProductProcessWorkflow
              dossierId={clientProduit.id}
              productType="ticpe"
              currentStep={(clientProduit.current_step || 1).toString()}
              onStepAction={(stepId: string, action: string) => console.log('Action sur étape:', stepId, action)}
              onMessageSend={(message: string) => console.log('Message envoyé:', message)}
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Fuel className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
            Récupérez le trop perçu de l'état sur votre consommation en carburant
          </h1>
          <p className="text-xl text-blue-700 mb-4 max-w-4xl mx-auto">
            TICPE - Taxe Intérieure de Consommation sur les Produits Énergétiques
          </p>
          <p className="text-lg text-blue-600 mb-8 max-w-3xl mx-auto">
            Chefs d'entreprises des Travaux Publics et du bâtiment, avez-vous pensé à récupérer 
            le trop perçu de l'état sur votre consommation en carburant ? Profitum vous accompagne 
            pour maximiser vos remboursements TICPE en toute légalité.
          </p>
        </div>
      </section>

      {/* Section Éligibilité */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-6">
                Êtes-vous éligible au remboursement TICPE ?
              </h2>
              <div className="space-y-4 text-blue-800">
                <p className="text-lg leading-relaxed">
                  <strong>Votre entreprise est concernée si :</strong>
                </p>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    Vos véhicules sont équipés d'un chronotachygraphe
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    Le poids de vos véhicules dépasse 7,5 tonnes
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    Vous utilisez ces véhicules à des fins professionnelles
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-2">Types d'entreprises éligibles :</p>
                  <p className="text-blue-700">Sociétés de TP, BTP, Transport, Terrassement, Assainissement, Artisans, TPE, PME...</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Véhicules Lourds</h3>
                  <p className="text-sm text-blue-700">+7,5 tonnes</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Calculator className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Chronotachygraphe</h3>
                  <p className="text-sm text-blue-700">Équipement obligatoire</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Usage Professionnel</h3>
                  <p className="text-sm text-blue-700">Activité commerciale</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Award className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Mandataire Officiel</h3>
                  <p className="text-sm text-blue-700">13+ années d'expertise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Pourquoi faire appel à un cabinet */}
      <section className="py-16 px-6 bg-blue-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            Pourquoi faire appel à un cabinet ?
          </h2>
          <p className="text-xl text-center text-blue-700 mb-12 max-w-3xl mx-auto">
            Gagner du temps et de l'argent. Rejoignez les centaines d'entreprises qui optimisent déjà 
            leurs coûts énergétiques grâce à nos conseils et notre expertise.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-blue-900">Vous manquez de temps</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-700 mb-4">
                  C'est incroyablement long et compliqué de réclamer, vous ne trouvez pas ? 
                  Vous avez probablement déjà essayé des logiciels ou délégué à des assistants, 
                  mais sans les bons outils, c'est souvent source d'erreurs et d'inefficacités.
                </p>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">+100</div>
                  <div className="text-blue-700 font-semibold">Dossiers traités par an</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-blue-900">Compréhension des Lois</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-700 mb-4">
                  Les réglementations sur l'énergie sont vraiment compliquées, n'est-ce pas ? 
                  Vous essayez peut-être de suivre les changements avec des formations, 
                  mais c'est un vrai casse-tête de rester à jour.
                </p>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">13</div>
                  <div className="text-blue-700 font-semibold">Années d'expertise</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-blue-900">Maximiser vos gains</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-700 mb-4">
                  Vous voulez optimiser vos coûts énergétiques, mais vous ne savez pas par où commencer ? 
                  Nos experts vous accompagnent pour identifier toutes les opportunités d'économies.
                </p>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">+50%</div>
                  <div className="text-blue-700 font-semibold">Gains moyens</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


    </div>
  );
} 