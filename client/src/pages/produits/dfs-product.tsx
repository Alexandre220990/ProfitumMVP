import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import DossierStepsDisplay from '@/components/DossierStepsDisplay';
import { TrendingUp, Shield, Clock, Play, DollarSign, Calculator, FileSignature, Zap } from "lucide-react";

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

const DFSProductPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // États pour les données
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);
  const [loading, setLoading] = useState(true);
  
  // États pour la signature de charte
  const [showCharteDialog, setShowCharteDialog] = useState(false);
  const [charteAccepted, setCharteAccepted] = useState(false);
  const [isSigningCharte, setIsSigningCharte] = useState(false);

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
          // Trouver le produit DFS
          const dfsProduit = data.data.find((produit: ClientProduitEligible) => 
            produit.ProduitEligible.nom.toLowerCase().includes('dfs')
          );
          setClientProduit(dfsProduit || null);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données: ', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignCharte = async () => {
    if (!clientProduit || !charteAccepted) return;
    
    setIsSigningCharte(true);
    try {
      const response = await fetch(`${config.API_URL}/api/client/sign-charte`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ clientProduitId: clientProduit.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Succès",
            description: "Charte signée avec succès !"
          });
          setShowCharteDialog(false);
          // Recharger les données
          loadClientProduit();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la signature: ', error);
      toast({
        title: "Erreur",
        description: "Impossible de signer la charte",
        variant: "destructive"
      });
    } finally {
      setIsSigningCharte(false);
    }
  };



  const handleDemoClick = () => {
            navigate('/simulateur');
  };

  const handleExpertClick = () => {
    navigate('/experts');
  };

  // Si pas connecté ou en cours de chargement
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Process Workflow */}
      {clientProduit && (
        <div className="bg-white border-b mt-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <DossierStepsDisplay
              dossierId={clientProduit.id}
              dossierName={`DFS - ${user?.company_name || 'Votre dossier'}`}
              showGenerateButton={true}
              compact={true}
              onStepUpdate={(stepId, updates) => {
                console.log('Étape mise à jour:', stepId, updates);
                loadClientProduit();
              }}
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-teal-100 text-teal-800 hover:bg-teal-200">
              Déduction Forfaitaire Spécifique
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Récupérez votre <span className="text-teal-600">DFS</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Bénéficiez d'un accompagnement sur-mesure pour la Déduction Forfaitaire Spécifique 
              et récupérez ce qui vous revient de droit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleDemoClick}
              >
                <Play className="mr-2 h-5 w-5" />
                Voir la démo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
                onClick={handleExpertClick}
              >
                Parler à un expert
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Description du Produit Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
                  Comprendre la Déduction Forfaitaire Spécifique
                </h2>
                <p className="text-lg text-teal-700 max-w-4xl mx-auto">
                  La Déduction Forfaitaire Spécifique (DFS) est un dispositif fiscal permettant 
                  de récupérer des frais professionnels non déductibles par ailleurs, 
                  sous forme de forfait annuel.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Pourquoi récupérer votre DFS ?</strong> La DFS permet de récupérer 
                    des frais professionnels que vous ne pouvez pas déduire autrement : frais de 
                    transport, de repas, d'équipement, de formation, etc. Cette déduction peut 
                    représenter plusieurs centaines d'euros par an selon votre situation.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Notre expertise :</strong> Nous analysons votre situation fiscale, 
                    calculons votre DFS optimale et vous accompagnons dans la récupération 
                    de ce qui vous revient de droit, en respectant strictement la réglementation.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calculator className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-teal-900">Calcul Optimisé</h4>
                      <p className="text-sm text-gray-600">DFS maximale selon votre situation professionnelle</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-teal-900">Économies Réelles</h4>
                      <p className="text-sm text-gray-600">Jusqu'à 500€ à 2000€ de récupération annuelle</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-teal-900">Processus Simplifié</h4>
                      <p className="text-sm text-gray-600">Gestion complète des démarches administratives</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir notre service DFS ?
            </h2>
            <p className="text-xl text-gray-600">
              Une expertise spécialisée pour maximiser votre récupération
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Récupération Maximale</h3>
                <p className="text-gray-600">
                  Optimisation complète de votre DFS pour récupérer 
                  le maximum de ce qui vous revient de droit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Conformité Garantie</h3>
                <p className="text-gray-600">
                  Respect strict de la réglementation fiscale avec 
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

      {/* Modal de signature de charte */}
      <Dialog open={showCharteDialog} onOpenChange={setShowCharteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileSignature className="w-5 h-5 text-orange-500" />
              <span>Signature de la charte DFS</span>
            </DialogTitle>
            <DialogDescription>
              Veuillez lire et accepter les conditions d'engagement pour continuer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-teal-50 p-4 rounded-lg">
              <h4 className="font-medium text-teal-800 mb-2">Conditions d'engagement DFS</h4>
              <div className="text-sm text-teal-700 space-y-2">
                <p>• Analyse de votre situation fiscale</p>
                <p>• Calcul optimisé de votre DFS</p>
                <p>• Récupération des déductions forfaitaires</p>
                <p>• Commission uniquement sur les montants récupérés</p>
                <p>• Engagement sans frais préalables</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="charte-accept" 
                checked={charteAccepted}
                onCheckedChange={(checked: boolean) => setCharteAccepted(checked)}
              />
              <label htmlFor="charte-accept" className="text-sm text-gray-700">
                J'accepte les conditions d'engagement et autorise Profitum à procéder 
                à l'analyse de ma situation fiscale pour le calcul et la récupération 
                de ma Déduction Forfaitaire Spécifique.
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCharteDialog(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSignCharte}
              disabled={!charteAccepted || isSigningCharte}
              className="flex-1 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700"
            >
              {isSigningCharte ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signature en cours...
                </>
              ) : (
                <>
                  <FileSignature className="w-4 h-4 mr-2" />
                  Signer la charte
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DFSProductPage; 