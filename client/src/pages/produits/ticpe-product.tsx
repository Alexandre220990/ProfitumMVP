import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Fuel, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Info,
  Award,
  UserCheck,
  TrendingUp,
  Shield,
  Euro
} from "lucide-react";
import UniversalProductWorkflow from "@/components/UniversalProductWorkflow";
import { get } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";

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
  expert_pending_id?: string;
  admin_eligibility_status?: 'pending' | 'validated' | 'rejected';
  admin_validated_by?: string;
  eligibility_validated_at?: string;
  validation_admin_notes?: string;
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

const TICPEProductPage = () => {
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

  const eligibilityValidated = clientProduit?.admin_eligibility_status === 'validated' ||
    ['eligibility_validated', 'admin_validated', 'expert_selection', 'expert_pending_acceptance', 'documents_manquants'].includes(clientProduit?.statut || '');

  const eligibilityRejected = clientProduit?.admin_eligibility_status === 'rejected' ||
    ['eligibility_rejected', 'admin_rejected'].includes(clientProduit?.statut || '');

  const badgeVariant = eligibilityRejected ? 'outline' : eligibilityValidated ? 'default' : 'secondary';
  const badgeLabel = eligibilityRejected ? 'Non éligible' : eligibilityValidated ? 'Éligible' : 'En cours';

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !clientProduit) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  {error || 'Impossible de charger le dossier TICPE'}
                </p>
                <Button onClick={() => navigate('/dashboard')} className="text-sm sm:text-base">
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Badge "Via Apporteur" */}
        {isFromApporteur && (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Badge className="bg-blue-600 text-white flex items-center gap-1 text-[10px] sm:text-xs">
                <UserCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Fuel className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Récupération TICPE
                    </CardTitle>
                    <p className="text-gray-600">
                      Taxe Intérieure de Consommation sur les Produits Énergétiques
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={badgeVariant}
                  className="text-sm"
                >
                  {badgeLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {clientProduit.montantFinal?.toLocaleString('fr-FR')}€
                  </div>
                  <div className="text-sm text-gray-600">Montant estimé</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(clientProduit.tauxFinal * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taux de réussite</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {clientProduit.dureeFinale} mois
                  </div>
                  <div className="text-sm text-gray-600">Durée estimée</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processus de suivi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Suivi de votre dossier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UniversalProductWorkflow
                clientProduitId={clientProduit.id}
                productKey="ticpe"
                companyName={clientProduit.Client?.company_name || 'Votre entreprise'}
                estimatedAmount={clientProduit.montantFinal || 0}
                onWorkflowComplete={() => {
                  loadClientProduit();
                }}
              />
            </CardContent>
          </Card>

          {/* Explications TICPE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Qu'est-ce que la TICPE ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Définition */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Définition de la TICPE
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  La <strong>Taxe Intérieure de Consommation sur les Produits Énergétiques (TICPE)</strong> 
                  est une taxe française qui s'applique à la consommation de produits énergétiques 
                  comme l'essence, le diesel, le fioul domestique, etc.
                </p>
              </div>

              <Separator />

              {/* Éligibilité */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Qui peut récupérer la TICPE ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Secteurs éligibles :</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Transport routier de marchandises</li>
                      <li>• Transport routier de voyageurs</li>
                      <li>• Taxi / VTC</li>
                      <li>• BTP / Travaux publics</li>
                      <li>• Secteur agricole</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Conditions :</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Véhicules professionnels</li>
                      <li>• Consommation {'>'} 1000L/an</li>
                      <li>• Activité commerciale</li>
                      <li>• Documents justificatifs</li>
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
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">1. Analyse</h4>
                    <p className="text-sm text-gray-600">
                      Étude de votre éligibilité et calcul du montant récupérable
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">2. Préparation</h4>
                    <p className="text-sm text-gray-600">
                      Rassemblement et vérification des documents nécessaires
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Euro className="w-6 h-6 text-red-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">3. Récupération</h4>
                    <p className="text-sm text-gray-600">
                      Soumission de la demande et obtention du remboursement
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
                        <h4 className="font-medium text-gray-800">Expertise spécialisée</h4>
                        <p className="text-sm text-gray-600">
                          Équipe d'experts dédiés à la récupération TICPE
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Suivi personnalisé</h4>
                        <p className="text-sm text-gray-600">
                          Accompagnement complet jusqu'au remboursement
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Taux de réussite élevé</h4>
                        <p className="text-sm text-gray-600">
                          Plus de 95% de dossiers acceptés
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">Pas de frais cachés</h4>
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
  );
};

export default TICPEProductPage; 