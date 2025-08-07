import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import HeaderClient from "@/components/HeaderClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Info,
  TrendingUp,
  Shield,
  Award,
  Euro,
  Building2,
  Handshake,
  Target,
  BarChart3,
  Zap
} from "lucide-react";
import { get } from "@/lib/api";

interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  tauxFinal: number;
  montantFinal: number;
  dureeFinale: number;
  current_step: number;
  progress: number;
  expert_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  notes?: string;
  priorite?: number;
  dateEligibilite?: string;
  ProduitEligible?: {
    id: string;
    nom: string;
    description?: string;
    category?: string;
  };
  Client?: {
    id: string;
    name?: string;
    email: string;
    company_name?: string;
  };
}

const DFSProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du ClientProduitEligible
  useEffect(() => {
    if (id && user?.id) {
      loadClientProduit();
    }
  }, [id, user?.id]);

  const loadClientProduit = async () => {
    try {
      setLoading(true);
      const response = await get(`/api/client-produits-eligibles/${id}`);
      
      if (response.success) {
        setClientProduit(response.data as ClientProduitEligible);
      } else {
        setError(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Erreur chargement ClientProduitEligible:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
        <HeaderClient />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement du dossier DFS...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clientProduit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
        <HeaderClient />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Erreur de chargement
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {error || 'Impossible de charger le dossier DFS'}
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Retour au dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <HeaderClient />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* En-tête du produit */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calculator className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Optimisation DFS
                    </CardTitle>
                    <p className="text-gray-600">
                      Déclaration Fiscale Simplifiée et optimisations fiscales
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={clientProduit.statut === 'eligible' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {clientProduit.statut === 'eligible' ? 'Éligible' : 'En cours'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {clientProduit.montantFinal?.toLocaleString('fr-FR')}€
                  </div>
                  <div className="text-sm text-gray-600">Économies estimées</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(clientProduit.tauxFinal * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taux de réussite</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {clientProduit.dureeFinale} mois
                  </div>
                  <div className="text-sm text-gray-600">Durée estimée</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explications DFS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Qu'est-ce que l'optimisation DFS ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Définition */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Définition de l'optimisation DFS
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  L'<strong>optimisation DFS</strong> (Déclaration Fiscale Simplifiée) permet d'optimiser 
                  votre fiscalité en identifiant les réductions d'impôts, crédits d'impôts et déductions 
                  fiscales auxquels vous avez droit.
                </p>
              </div>

              <Separator />

              {/* Éligibilité */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Qui peut bénéficier de l'optimisation DFS ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Profils éligibles :</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Entreprises de toutes tailles</li>
                      <li>• Auto-entrepreneurs</li>
                      <li>• Particuliers investisseurs</li>
                      <li>• Propriétaires immobiliers</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Optimisations possibles :</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Réductions d'impôts</li>
                      <li>• Crédits d'impôts</li>
                      <li>• Déductions fiscales</li>
                      <li>• Optimisations légales</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Processus */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Comment ça marche ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calculator className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">1. Audit fiscal</h4>
                    <p className="text-sm text-gray-600">
                      Analyse complète de votre situation fiscale
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">2. Optimisation</h4>
                    <p className="text-sm text-gray-600">
                      Identification des économies fiscales possibles
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">3. Mise en œuvre</h4>
                    <p className="text-sm text-gray-600">
                      Application des optimisations identifiées
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Avantages */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Pourquoi choisir Profitum ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Expertise fiscale</h4>
                        <p className="text-sm text-gray-600">
                          Spécialistes de la fiscalité et des optimisations légales
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Audit personnalisé</h4>
                        <p className="text-sm text-gray-600">
                          Analyse adaptée à votre situation spécifique
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Suivi continu</h4>
                        <p className="text-sm text-gray-600">
                          Accompagnement sur la durée pour optimiser vos impôts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Conformité garantie</h4>
                        <p className="text-sm text-gray-600">
                          Toutes nos optimisations respectent la réglementation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/cgv', '_blank')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Voir les CGV
                </Button>
                <Button 
                  onClick={() => navigate('/messagerie-client')}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Contacter un expert
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default DFSProductPage; 