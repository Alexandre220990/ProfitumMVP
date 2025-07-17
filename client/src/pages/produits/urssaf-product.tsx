import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductProcessWorkflow from '@/components/ProductProcessWorkflow';
import { TrendingUp, Shield, Clock, Play, DollarSign, AlertTriangle, Zap } from "lucide-react";
import { config } from "@/config/env";
import HeaderClient from "@/components/HeaderClient";

interface ClientProduitEligible { id: string;
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
    category: string; };
}

const URSSAFProductPage = () => { const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { id: clientProduitId } = useParams(); // Récupérer l'ID depuis l'URL
  
  // États pour les données
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);
  const [loading, setLoading] = useState(true);
  


  // Vérification de sécurité
  useEffect(() => { if (!user || user.type !== 'client') {
      navigate('/connexion-client');
      return; }
  }, [user, navigate]);

  // Chargement des données
  useEffect(() => { if (user?.id) {
      loadClientProduit(); }
  }, [user, clientProduitId]);

  const loadClientProduit = async () => { try {
      setLoading(true);
      
      // Si on a un ID spécifique, charger ce ClientProduitEligible
      if (clientProduitId) {
        console.log('🔍 Chargement du ClientProduitEligible spécifique: ', clientProduitId);
        
        // Charger tous les produits éligibles du client
        const response = await fetch(`${config.API_URL }/api/client/produits-eligibles`, { headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') }`
          }
        });
        
        if (response.ok) { const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            // Trouver le produit spécifique par ID
            const specificProduit = data.data.find((produit: ClientProduitEligible) => 
              produit.id === clientProduitId
            );
            
            if (specificProduit) {
              console.log('✅ ClientProduitEligible trouvé:, ', specificProduit);
              setClientProduit(specificProduit); } else { console.error('❌ ClientProduitEligible non trouvé pour l\'ID: ', clientProduitId);
              toast({
                title: "Erreur, ", description: "Produit non trouvé, ", variant: "destructive" });
            }
          }
        }
      } else { // Chargement par défaut (comportement original)
        console.log('🔍 Chargement par défaut - recherche produit URSSAF');
        
        const response = await fetch(`${config.API_URL }/api/client/produits-eligibles`, { headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') }`
          }
        });
        
        if (response.ok) { const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            // Trouver le produit URSSAF
            const urssafProduit = data.data.find((produit: ClientProduitEligible) => 
              produit.ProduitEligible.nom.toLowerCase().includes('urssaf')
            );
            setClientProduit(urssafProduit || null); }
        }
      }
    } catch (error) { console.error('Erreur lors du chargement des données: ', error);
      toast({
        title: "Erreur, ", description: "Impossible de charger vos données, ", variant: "destructive" });
    } finally { setLoading(false); }
  };



  const handleDemoClick = () => { navigate('/simulateur'); };

  const handleExpertClick = () => { navigate('/experts'); };

  // Si pas connecté ou en cours de chargement
  if (!user || loading) { return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    ); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      { /* Header Client */ }
      <HeaderClient />

      { /* Process Workflow */ }
      { clientProduit && clientProduit.id && (
        <div className="bg-white border-b mt-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <ProductProcessWorkflow
              dossierId={clientProduit.id}
              productType="urssaf"
              currentStep={(clientProduit.current_step || 1).toString()}
              onStepAction={(stepId: string, action: string) => console.log('Action sur étape:', stepId, action)}
              onMessageSend={(message: string) => console.log('Message envoyé:', message)}
            />
          </div>
        </div>
      )}

      { /* Hero Section */ }
      <section className="relative py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-red-100 text-red-800 hover:bg-red-200">
              Union de Recouvrement des Cotisations de Sécurité Sociale
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sécurisez vos <span className="text-red-600">Cotisations URSSAF</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sécurisez vos cotisations et détectez les trop-perçus URSSAF avec l'expertise Profitu,m, 
              pour des économies immédiates et une conformité totale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={ handleDemoClick }
              >
                <Play className="mr-2 h-5 w-5" />
                Voir la démo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-red-600 text-red-600 hover: bg-red-50"
                onClick={ handleExpertClick }
              >
                Parler à un expert
              </Button>
            </div>
          </div>
        </div>
      </section>

      { /* Description du Produit Section */ }
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-red-900 mb-4">
                  Comprendre les Trop-Perçus URSSAF
                </h2>
                <p className="text-lg text-red-700 max-w-4xl mx-auto">
                  Les trop-perçus URSSAF représentent des sommes payées en excès sur vos cotisations sociales. 
                  Ces erreurs de calcul peuvent survenir pour diverses raisons et représentent souvent 
                  des montants significatifs pour votre entreprise.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Pourquoi auditer vos cotisations URSSAF ?</strong> Les erreurs de calcu,l, 
                    les changements de réglementation, les modifications d'activité ou les ajustements 
                    de salaires peuvent générer des trop-perçus. Sans audit régulier, ces montants 
                    restent indûment versés à l'URSSAF.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Notre expertise :</strong> Nous analysons systématiquement vos déclarations 
                    URSSAF, identifions les anomalies et les erreurs de calcul, puis gérons l'ensemble 
                    des démarches pour récupérer vos trop-perçus.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900">Erreurs Fréquentes</h4>
                      <p className="text-sm text-gray-600">Calculs incorrects, bases erronées, exonérations oubliées</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900">Économies Réelles</h4>
                      <p className="text-sm text-gray-600">Moyenne de 5 000€ à 25 000€ de trop-perçus détectés</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900">Processus Sécurisé</h4>
                      <p className="text-sm text-gray-600">Audit complet, conformité garantie, récupération sécurisée</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      { /* Avantages Section */ }
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir notre service URSSAF ?
            </h2>
            <p className="text-xl text-gray-600">
              Une expertise spécialisée pour sécuriser vos cotisations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Détection Maximale</h3>
                <p className="text-gray-600">
                  Audit systématique de vos cotisations pour identifier 
                  tous les trop-perçus et erreurs de calcul.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Conformité Totale</h3>
                <p className="text-gray-600">
                  Respect strict de la réglementation sociale avec 
                  un accompagnement juridique sécurisé.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Gestion Simplifiée</h3>
                <p className="text-gray-600">
                  Prise en charge complète des démarches administratives 
                  pour vous faire gagner du temps.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


    </div>
  );
};

export default URSSAFProductPage; 