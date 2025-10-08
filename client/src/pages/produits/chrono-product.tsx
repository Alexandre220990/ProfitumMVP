import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Truck,
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
  UserCheck,
  Gauge,
  TrendingUp
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

const ChronoProductPage = () => {
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du dossier Chronotachygraphes...</p>
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
                <p className="text-gray-500 mb-4">{error || 'Impossible de charger le dossier'}</p>
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

        {/* En-tête */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Chronotachygraphes Digitaux
                  </CardTitle>
                  <p className="text-gray-600">
                    Pilotage temps réel et démarches TICPE simplifiées
                  </p>
                </div>
              </div>
              <Badge variant={clientProduit.statut === 'eligible' ? 'default' : 'secondary'} className="text-sm">
                {clientProduit.statut === 'eligible' ? 'Éligible' : 'En cours'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {clientProduit.montantFinal?.toLocaleString('fr-FR') || 'N/A'}€
                </div>
                <div className="text-sm text-gray-600">Coût d'installation</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {clientProduit.dureeFinale || '2'} mois
                </div>
                <div className="text-sm text-gray-600">Délai installation</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Service Chronotachygraphes Digitaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Qu'est-ce que c'est ?</h3>
              <p className="text-gray-700 leading-relaxed">
                Les <strong>chronotachygraphes digitaux</strong> permettent un pilotage en temps réel 
                de votre flotte et simplifient vos démarches administratives liées au remboursement TICPE.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Avantages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Suivi temps réel</h4>
                      <p className="text-sm text-gray-600">Monitoring complet de votre flotte</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Conformité réglementaire</h4>
                      <p className="text-sm text-gray-600">Respect obligations légales</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Démarches TICPE simplifiées</h4>
                      <p className="text-sm text-gray-600">Données automatisées pour remboursement</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800">Support technique</h4>
                      <p className="text-sm text-gray-600">Installation et formation incluses</p>
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

export default ChronoProductPage;

