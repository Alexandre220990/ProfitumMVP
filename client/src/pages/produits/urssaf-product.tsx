import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Info,
  Award,
  Calculator,
  Handshake,
  Target,
  UserCheck
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
  metadata?: {
    source?: 'simulation' | 'apporteur';
    created_by_apporteur?: string;
    apporteur_notes?: string;
  };
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

const URSSAFProductPage = () => {
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
      const response = await get(`/api/client/produits-eligibles/${id}`);
      
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

  const isFromApporteur = clientProduit?.metadata?.source === 'apporteur';
  const isHighPriority = clientProduit?.priorite === 1;

  if (loading) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du dossier URSSAF...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clientProduit) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-gray-500 mb-4">
                  {error || 'Impossible de charger le dossier URSSAF'}
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Retour au dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Badge "Via Apporteur" */}
        {isFromApporteur && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600 text-white flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Recommandé par votre conseiller
              </Badge>
              {isHighPriority && (
                <Badge className="bg-amber-500 text-white">⭐ Priorité haute</Badge>
              )}
            </div>
            {clientProduit.notes && (
              <p className="text-sm text-blue-800">💬 <strong>Note:</strong> {clientProduit.notes}</p>
            )}
          </div>
        )}

        {/* En-tête du produit */}
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Optimisation URSSAF
                    </CardTitle>
                    <p className="text-gray-600">
                      Récupération des cotisations sociales et réductions de charges
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
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {clientProduit.montantFinal?.toLocaleString('fr-FR')}€
                  </div>
                  <div className="text-sm text-gray-600">Économies estimées</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(clientProduit.tauxFinal * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taux de réussite</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {clientProduit.dureeFinale} mois
                  </div>
                  <div className="text-sm text-gray-600">Durée estimée</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explications URSSAF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Qu'est-ce que l'optimisation URSSAF ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Définition */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Définition de l'optimisation URSSAF
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  L'<strong>optimisation URSSAF</strong> permet de récupérer des cotisations sociales 
                  payées en trop et d'obtenir des réductions de charges sur les cotisations futures. 
                  Elle s'applique aux entreprises de toutes tailles.
                </p>
              </div>

              <Separator />

              {/* Éligibilité */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Qui peut bénéficier de l'optimisation URSSAF ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Entreprises éligibles :</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Toutes les entreprises</li>
                      <li>• PME et grandes entreprises</li>
                      <li>• Secteurs d'activité variés</li>
                      <li>• Salariés et dirigeants</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Situations courantes :</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Erreurs de calcul URSSAF</li>
                      <li>• Changements de statut</li>
                      <li>• Nouveaux dispositifs</li>
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
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calculator className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">1. Audit</h4>
                    <p className="text-sm text-gray-600">
                      Analyse complète de vos cotisations et charges sociales
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">2. Optimisation</h4>
                    <p className="text-sm text-gray-600">
                      Identification des économies possibles et plan d'action
                    </p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Handshake className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">3. Récupération</h4>
                    <p className="text-sm text-gray-600">
                      Accompagnement pour obtenir vos remboursements
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
                        <h4 className="font-medium text-gray-800">Expertise URSSAF</h4>
                        <p className="text-sm text-gray-600">
                          Spécialistes des cotisations sociales et de l'URSSAF
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Audit complet</h4>
                        <p className="text-sm text-gray-600">
                          Analyse détaillée de tous vos documents sociaux
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Suivi personnalisé</h4>
                        <p className="text-sm text-gray-600">
                          Accompagnement jusqu'à la récupération effective
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Résultats garantis</h4>
                        <p className="text-sm text-gray-600">
                          Commission uniquement sur les montants récupérés
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
                onClick={() => navigate('/messagerie')}
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
  );
};

export default URSSAFProductPage; 