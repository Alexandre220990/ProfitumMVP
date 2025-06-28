import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { API_URL } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import HeaderClient from "@/components/HeaderClient";

interface ClientProduitEligible {
  id: string;
  client_id: string;
  produit_id: string;
  statut: string;
  taux_final: number;
  montant_final: number;
  duree_finale: number;
  simulation_id: number;
  created_at: string;
  updated_at: string;
  produit: {
    nom: string;
    description: string;
  };
}

export default function DossierClientProduit() {
  const { produit: produitNom, id: clientProduitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);

  useEffect(() => {
    const fetchClientProduit = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Récupération du ClientProduitEligible:', clientProduitId);
        console.log('📦 Nom du produit:', produitNom);

        // Vérifier que l'utilisateur est connecté
        if (!user?.id) {
          throw new Error("Utilisateur non connecté");
        }

        // Récupérer les détails du ClientProduitEligible
        const response = await fetch(`${API_URL}/api/produits-eligibles/client/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error("Aucun produit éligible trouvé");
        }

        // Filtrer pour trouver le ClientProduitEligible spécifique
        const clientProduitData = data.data.find((item: any) => item.id === clientProduitId);
        
        if (!clientProduitData) {
          throw new Error("ClientProduitEligible non trouvé");
        }

        console.log('✅ ClientProduitEligible récupéré:', clientProduitData);

        // Vérifier que l'utilisateur est le propriétaire
        // Le client_id dans ClientProduitEligible est l'ancien ID client
        // Nous devons vérifier que l'utilisateur connecté (ID Supabase Auth) correspond au client
        // en utilisant la correspondance auth_id dans la table Client
        
        // Récupérer le client correspondant à l'utilisateur connecté
        const clientResponse = await fetch(`${API_URL}/api/client/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!clientResponse.ok) {
          throw new Error("Impossible de récupérer les informations du client");
        }

        const clientData = await clientResponse.json();
        
        if (!clientData.success || !clientData.data) {
          throw new Error("Informations client non disponibles");
        }

        // Vérifier que le client_id du produit correspond à l'ID du client connecté
        if (clientProduitData.client_id !== clientData.data.id) {
          console.error('❌ Permission refusée: client_id ne correspond pas à l\'utilisateur connecté');
          console.error('  - Utilisateur connecté (Supabase Auth):', user.id);
          console.error('  - ID client dans la base:', clientData.data.id);
          console.error('  - Propriétaire du produit:', clientProduitData.client_id);
          throw new Error("Vous n'êtes pas autorisé à accéder à ce dossier");
        }

        // Vérifier que le nom du produit correspond
        if (clientProduitData.produit?.nom !== produitNom) {
          console.error('❌ Incohérence: nom du produit ne correspond pas');
          console.error('  - Nom dans l\'URL:', produitNom);
          console.error('  - Nom dans la base:', clientProduitData.produit?.nom);
          throw new Error("Incohérence dans les données du produit");
        }

        setClientProduit(clientProduitData);

        // Rediriger vers la page statique appropriée
        const produitRoutes: { [key: string]: string } = {
          'TICPE': '/produits/ticpe',
          'Foncier': '/produits/foncier',
          'URSSAF': '/produits/urssaf',
          'DFS': '/produits/dfs',
          'Optimisation Énergie': '/produits/audit_energetique',
          'MSA': '/produits/msa',
          'CEE': '/produits/audit_energetique'
        };

        const route = produitRoutes[produitNom];
        if (route) {
          // Pour les routes qui nécessitent l'ID client, utiliser user.id
          // Pour les routes qui nécessitent l'ID produit, utiliser clientProduitId
          const routeId = route.includes('/social') ? user.id : clientProduitId;
          console.log('🔄 Redirection vers:', `${route}/${routeId}`);
          navigate(`${route}/${routeId}`, {
            state: { 
              clientProduit: clientProduitData,
              fromDossier: true 
            } 
          });
        } else {
          console.error('❌ Route non trouvée pour le produit:', produitNom);
          throw new Error(`Page non disponible pour le produit: ${produitNom}`);
        }

      } catch (err) {
        console.error('❌ Erreur lors de la récupération:', err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    if (clientProduitId && produitNom) {
      fetchClientProduit();
    }
  }, [clientProduitId, produitNom, user?.id, navigate]);

  // Page de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Chargement du dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  // Page d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mt-16"></div>
          
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Erreur d'accès au dossier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-red-700 font-medium">{error}</p>
                
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Détails techniques :</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• ID du produit : {clientProduitId}</li>
                    <li>• Nom du produit : {produitNom}</li>
                    <li>• Utilisateur connecté : {user?.id}</li>
                    <li>• Timestamp : {new Date().toLocaleString()}</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => navigate('/dashboard/client')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au tableau de bord
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Cette partie ne devrait jamais être atteinte car on redirige
  return null;
} 