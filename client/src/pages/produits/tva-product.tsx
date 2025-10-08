import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Euro,
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Info,
  TrendingUp,
  Shield,
  Award,
  Calculator,
  Handshake,
  Target,
  UserCheck,
  Globe
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
  ProduitEligible?: {
    id: string;
    nom: string;
    description?: string;
    category?: string;
  };
}

const TVAProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <p className="text-gray-600">Chargement du dossier TVA...</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
                <p className="text-gray-500 mb-4">{error || 'Impossible de charger le dossier TVA'}</p>
                <Button onClick={() => navigate('/dashboard')}>Retour au dashboard</Button>
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
        
        {/* Badge "Via Apporteur" si applicable */}
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
                  <Euro className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Gestion TVA Internationale
                  </CardTitle>
                  <p className="text-gray-600">
                    Remboursement et gestion administrative TVA
                  </p>
                </div>
              </div>
              <Badge variant={clientProduit.statut === 'eligible' ? 'default' : 'secondary'} className="text-sm">
                {clientProduit.statut === 'eligible' ? 'Éligible' : 'En cours'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {clientProduit.montantFinal?.toLocaleString('fr-FR') || 'N/A'}€
                </div>
                <div className="text-sm text-gray-600">Économies estimées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {clientProduit.tauxFinal ? Math.round(clientProduit.tauxFinal * 100) : 'N/A'}%
                </div>
                <div className="text-sm text-gray-600">Taux de réussite</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {clientProduit.dureeFinale || 'N/A'} mois
                </div>
                <div className="text-sm text-gray-600">Durée estimée</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explications TVA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Qu'est-ce que la gestion TVA internationale ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Définition
              </h3>
              <p className="text-gray-700 leading-relaxed">
                La <strong>gestion TVA internationale</strong> permet d'optimiser vos remboursements de TVA 
                et de simplifier vos démarches administratives pour les opérations transfrontalières.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Qui peut bénéficier ?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Entreprises éligibles :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Import/Export</li>
                    <li>• Commerce international</li>
                    <li>• Prestataires UE</li>
                    <li>• E-commerce transfrontalier</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Avantages :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Remboursements rapides</li>
                    <li>• Conformité garantie</li>
                    <li>• Optimisation fiscale</li>
                    <li>• Support expert</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

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
                  <p className="text-sm text-gray-600">Analyse de vos flux TVA internationaux</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">2. Optimisation</h4>
                  <p className="text-sm text-gray-600">Stratégie de remboursement optimale</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Handshake className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">3. Récupération</h4>
                  <p className="text-sm text-gray-600">Obtention des remboursements TVA</p>
                </div>
              </div>
            </div>

            <Separator />

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
                      <h4 className="font-medium text-gray-800">Expertise TVA internationale</h4>
                      <p className="text-sm text-gray-600">Spécialistes des flux transfrontaliers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Conformité UE</h4>
                      <p className="text-sm text-gray-600">Respect total des réglementations européennes</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Gain de temps</h4>
                      <p className="text-sm text-gray-600">Démarches simplifiées et accélérées</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Résultats garantis</h4>
                      <p className="text-sm text-gray-600">Commission sur résultats obtenus</p>
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

export default TVAProductPage;

