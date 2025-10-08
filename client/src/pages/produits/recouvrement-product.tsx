import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Scale,
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
  Gavel,
  Shield
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

const RecouvrementProductPage = () => {
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du dossier Recouvrement...</p>
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
                <div className="p-3 bg-red-100 rounded-lg">
                  <Scale className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Recouvrement d'Impayés
                  </CardTitle>
                  <p className="text-gray-600">
                    Avocat spécialisé en recouvrement de créances
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
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {clientProduit.montantFinal?.toLocaleString('fr-FR') || 'N/A'}€
                </div>
                <div className="text-sm text-gray-600">Créances à recouvrer</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {clientProduit.tauxFinal ? Math.round(clientProduit.tauxFinal * 100) : 'N/A'}%
                </div>
                <div className="text-sm text-gray-600">Taux de succès</div>
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

        {/* Explications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Service de recouvrement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Définition</h3>
              <p className="text-gray-700 leading-relaxed">
                Le <strong>recouvrement d'impayés</strong> par avocat spécialisé permet de récupérer 
                vos créances avec un taux de succès élevé grâce à une approche juridique adaptée.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Situations concernées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Types de créances :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Factures impayées</li>
                    <li>• Loyers commerciaux</li>
                    <li>• Prestations de services</li>
                    <li>• Ventes B2B</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Avantages :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Avocat dédié</li>
                    <li>• Procédures rapides</li>
                    <li>• Négociation amiable</li>
                    <li>• Action judiciaire si nécessaire</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Processus
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">1. Analyse dossier</h4>
                  <p className="text-sm text-gray-600">Étude de vos créances et preuves</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Handshake className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">2. Négociation</h4>
                  <p className="text-sm text-gray-600">Tentative de règlement amiable</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gavel className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">3. Action juridique</h4>
                  <p className="text-sm text-gray-600">Procédure si nécessaire</p>
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
                Contacter un avocat
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default RecouvrementProductPage;

