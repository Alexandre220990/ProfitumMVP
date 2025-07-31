import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CharteSignatureWorkflow from '@/components/CharteSignatureWorkflow';
import { Shield, DollarSign, FileSignature, Zap, MessageSquare, FileText } from "lucide-react";
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

const AuditEnergetiquePage = () => {
  const navigate = useNavigate();
  const { clientProduitId } = useParams();
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
  }, [user, clientProduitId]);

  const loadClientProduit = async () => {
    try {
      setLoading(true);
      
      if (clientProduitId) {
        // Charger un produit spécifique
        const response = await fetch(`${config.API_URL}/api/produits-eligibles/${clientProduitId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setClientProduit(data.data);
          }
        }
      } else {
        // Charger les produits éligibles du client et trouver Audit Énergétique
        const response = await fetch(`${config.API_URL}/api/client/produits-eligibles`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            // Trouver le produit Audit Énergétique
            const auditProduit = data.data.find((produit: ClientProduitEligible) => 
              produit.ProduitEligible.nom.toLowerCase().includes('audit') && 
              produit.ProduitEligible.nom.toLowerCase().includes('energetique')
            );
            setClientProduit(auditProduit || null);
          }
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
    if (!clientProduit) return;
    
    setIsSigningCharte(true);
    try {
      const response = await fetch(`${config.API_URL}/api/produits-eligibles/${clientProduit.id}/sign-charte`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "Charte signée",
          description: "Votre charte a été signée avec succès",
        });
        setShowCharteDialog(false);
        loadClientProduit(); // Recharger les données
      } else {
        throw new Error('Erreur lors de la signature');
      }
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de signer la charte",
        variant: "destructive"
      });
    } finally {
      setIsSigningCharte(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient onLogout={() => navigate('/connexion-client')} />
        <div className="max-w-4xl mx-auto px-4 py-8 mt-16">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!clientProduit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient onLogout={() => navigate('/connexion-client')} />
        <div className="max-w-4xl mx-auto px-4 py-8 mt-16">
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Audit Énergétique non trouvé</h2>
              <p className="text-gray-600 mb-6">
                Aucun audit énergétique éligible n'a été trouvé pour votre compte.
              </p>
              <Button onClick={() => navigate('/dashboard/client')}>
                Retour au dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient onLogout={() => navigate('/connexion-client')} />
      <div className="max-w-4xl mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">Audit Énergétique</h1>
            <Badge variant={clientProduit.statut === 'en_cours' ? 'default' : 'secondary'}>
              {clientProduit.statut === 'en_cours' ? 'En cours' : 'Non démarré'}
            </Badge>
          </div>
          <p className="text-gray-600">
            Optimisez votre consommation énergétique et réduisez vos coûts d'exploitation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Économies potentielles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Économies estimées</p>
                    <p className="text-2xl font-bold text-green-600">
                      {clientProduit.montantFinal?.toLocaleString() || '0'} €/an
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Réduction consommation</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {clientProduit.tauxFinal || '0'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Avantages de l'audit énergétique
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Réduction des coûts énergétiques</p>
                      <p className="text-sm text-gray-600">Identification des postes de consommation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Amélioration de la performance</p>
                      <p className="text-sm text-gray-600">Optimisation des équipements et processus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Conformité réglementaire</p>
                      <p className="text-sm text-gray-600">Respect des obligations légales</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow du processus optimisé */}
            <CharteSignatureWorkflow
              clientProduitId={clientProduit.id}
              productName="Audit Énergétique"
              companyName={user?.company_name}
              estimatedAmount={clientProduit.montantFinal}
              onSignatureComplete={(success) => {
                if (success) {
                  loadClientProduit();
                }
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  {!clientProduit.charte_signed ? (
                    <Button 
                      onClick={() => setShowCharteDialog(true)}
                      className="w-full"
                      disabled={isSigningCharte}
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      {isSigningCharte ? 'Signature...' : 'Signer la charte'}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Charte signée
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contacter l'expert
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Voir les documents
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Informations</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Statut</p>
                    <p className="font-medium">{clientProduit.statut}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Créé le</p>
                    <p className="font-medium">
                      {new Date(clientProduit.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dernière mise à jour</p>
                    <p className="font-medium">
                      {new Date(clientProduit.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de signature de charte */}
      <Dialog open={showCharteDialog} onOpenChange={setShowCharteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signature de la charte Audit Énergétique</DialogTitle>
            <DialogDescription>
              En signant cette charte, vous acceptez de nous confier la réalisation de votre audit énergétique.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="charte-accept"
                checked={charteAccepted}
                onCheckedChange={(checked: boolean) => setCharteAccepted(checked)}
              />
              <label htmlFor="charte-accept" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                J'accepte les termes de la charte et autorise l'équipe à procéder à l'audit énergétique de mon entreprise.
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCharteDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSignCharte}
              disabled={!charteAccepted || isSigningCharte}
            >
              {isSigningCharte ? 'Signature...' : 'Signer la charte'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditEnergetiquePage; 