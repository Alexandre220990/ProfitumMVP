import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DossierStepsDisplay from '@/components/DossierStepsDisplay';
import { WorkflowDocumentUpload } from '@/components/documents/WorkflowDocumentUpload';
import { toast } from 'sonner';

import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  Calendar, 
  Euro, 
  TrendingUp, 
  CheckCircle, 
  User,
  Phone,
  Mail,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Star,
  Target,
  Zap,
  Activity,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { get, post } from "@/lib/api";

interface ClientProduitEligible {
  id: string;
  client_id: string;
  produit_id: string;
  statut: string;
  taux_final: number;
  montant_final: number;
  duree_finale: number;
  simulationId: number;
  created_at: string;
  updated_at: string;
  produit: {
    id: string;
    nom: string;
    description: string;
    categorie: string;
    type: string;
    conditions: any;
    avantages: string[];
    documents_requis: string[];
  };
  client: {
    id: string;
    email: string;
    name: string;
    company_name: string;
    phone: string;
    city: string;
    siren: string;
  };
  audit?: {
    id: string;
    status: string;
    current_step: number;
    total_steps: number;
    progress: number;
    potential_gain: number;
    obtained_gain: number;
    created_at: string;
    updated_at: string;
  };
  documents?: Array<{
    id: string;
    nom: string;
    type: string;
    statut: string;
    url?: string;
    uploaded_at: string;
  }>;
  expert_assignment?: {
    id: string;
    expert_id: string;
    statut: string;
    assigned_at: string;
    expert: {
      id: string;
      name: string;
      company_name: string;
      specializations: string[];
      rating: number;
      email: string;
      phone: string;
    };
  };
}


export default function DossierClientProduit() {
  const { produit: produitNom, id: clientProduitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientProduit, setClientProduit] = useState<ClientProduitEligible | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fonction pour charger les données du dossier (accessible partout)
  const fetchDossierData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Récupération du dossier:', { clientProduitId, produitNom });

        if (!user?.id) {
          throw new Error("Utilisateur non connecté");
        }

        // Récupérer les détails du ClientProduitEligible avec toutes les relations
        // ✅ CORRECTION: Utiliser la bonne route API
        const response = await get(`/api/client/produits-eligibles/${clientProduitId}`);
        
        if (!response.success || !response.data) {
          throw new Error("Dossier non trouvé ou accès refusé");
        }

        const dossierData = response.data as ClientProduitEligible;
        
        // La vérification des permissions est déjà faite côté serveur
        // Le middleware auth garantit que seul le client propriétaire peut accéder

        setClientProduit(dossierData);

        // Récupérer les détails du produit (optionnel)
        try {
          const productResponse = await get(`/produits/${dossierData.produit_id}`);
          if (productResponse.success) {
            console.log('✅ Détails produit récupérés:', productResponse.data);
            // Les détails du produit sont disponibles dans productResponse.data
          }
        } catch (productError) {
          console.warn('⚠️ Impossible de récupérer les détails du produit:', productError);
          // Ce n'est pas critique, on continue sans les détails du produit
        }

        console.log('✅ Dossier récupéré:', dossierData);

      } catch (err) {
        console.error('❌ Erreur lors de la récupération:', err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (clientProduitId && produitNom && user?.id) {
      fetchDossierData();
    }
  }, [clientProduitId, produitNom, user?.id]);

  const handleStartAudit = async () => {
    try {
      const response = await post('/audits/start', {
        client_produit_id: clientProduitId,
        produit_id: clientProduit?.produit_id
      });

      if (response.success) {
        console.log("✅ Audit démarré avec succès");
        // Recharger les données
        window.location.reload();
      }
    } catch (error) {
      console.error("❌ Impossible de lancer l'audit:", error);
    }
  };

  const handleContactExpert = async () => {
    if (clientProduit?.expert_assignment?.expert) {
      navigate(`/messagerie-client/conversation/${clientProduit.expert_assignment.expert.id}`, {
        state: { 
          expert: clientProduit.expert_assignment.expert,
          dossier: clientProduit
        }
      });
    }
  };

  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    try {
      const response = await get(`/documents/${documentId}/download`);
      if (response.success) {
        // Créer un lien de téléchargement
        const downloadData = response.data as { url: string };
        const link = document.createElement('a');
        link.href = downloadData.url;
        link.download = documentName;
        link.click();
      }
    } catch (error) {
      console.error("❌ Impossible de télécharger le document:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'eligible':
        return <Badge className="bg-green-100 text-green-800">Éligible</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'termine':
        return <Badge className="bg-purple-100 text-purple-800">Terminé</Badge>;
      case 'rejete':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Page de chargement
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center min-h-64">
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
      <div>
        <div className="max-w-2xl mx-auto px-4 py-12">
          
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

  if (!clientProduit) {
    return null;
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/client')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dossier {clientProduit.produit.nom}
                </h1>
                <p className="text-gray-600">
                  ID: {clientProduit.id} • Créé le {formatDate(clientProduit.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(clientProduit.statut)}
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Euro className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gain potentiel</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(clientProduit.montant_final)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux final</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clientProduit.taux_final}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Durée</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clientProduit.duree_finale} mois
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Progression</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clientProduit.audit ? `${clientProduit.audit.progress}%` : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="expert">Expert</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations du produit */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Informations du produit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{clientProduit.produit.nom}</h3>
                    <p className="text-gray-600">{clientProduit.produit.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Catégorie</label>
                      <p className="text-gray-900">{clientProduit.produit.categorie}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-gray-900">{clientProduit.produit.type}</p>
                    </div>
                  </div>

                  {clientProduit.produit.avantages && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Avantages</label>
                      <ul className="mt-2 space-y-1">
                        {clientProduit.produit.avantages.map((avantage, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {avantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!clientProduit.audit && (
                    <Button 
                      onClick={handleStartAudit}
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Démarrer l'audit
                    </Button>
                  )}
                  
                  {clientProduit.expert_assignment && (
                    <Button 
                      variant="outline"
                      onClick={handleContactExpert}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contacter l'expert
                    </Button>
                  )}

                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter le dossier
                  </Button>

                  <Button variant="outline" className="w-full">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Aide et support
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Progression de l'audit */}
            <DossierStepsDisplay
              dossierId={clientProduit.id}
              dossierName={`${clientProduit.produit.nom} - ${clientProduit.client.company_name}`}
              showGenerateButton={true}
              compact={false}
              onStepUpdate={(stepId, updates) => {
                console.log('Étape mise à jour:', stepId, updates);
                // Optionnel : rafraîchir les données du dossier
                // fetchDossierData(); // Fonction non définie
              }}
            />
          </TabsContent>

          {/* Audit */}
          <TabsContent value="audit" className="space-y-6">
            {clientProduit.audit ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de l'audit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Statut</label>
                          <p className="text-gray-900">{clientProduit.audit.status}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gain potentiel</label>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(clientProduit.audit.potential_gain)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gain obtenu</label>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(clientProduit.audit.obtained_gain)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Démarré le</label>
                          <p className="text-gray-900">{formatDate(clientProduit.audit.created_at)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Dernière mise à jour</label>
                          <p className="text-gray-900">{formatDate(clientProduit.audit.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun audit en cours</h3>
                  <p className="text-gray-600 mb-4">
                    Lancez un audit pour commencer le processus d'optimisation.
                  </p>
                  <Button onClick={handleStartAudit}>
                    <Zap className="w-4 h-4 mr-2" />
                    Démarrer l'audit
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Documents</span>
                  
                  {/* ✅ Composant d'upload intégré GED unifiée */}
                  <WorkflowDocumentUpload
                    clientProduitId={clientProduitId as string}
                    produitId={clientProduit.produit?.id}
                    clientId={clientProduit.client?.id}
                    onUploadSuccess={() => {
                      toast.success('Document ajouté au dossier');
                      fetchDossierData();
                    }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientProduit.documents && clientProduit.documents.length > 0 ? (
                  <div className="space-y-3">
                    {clientProduit.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{doc.nom}</p>
                            <p className="text-sm text-gray-500">
                              {doc.type} • {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={doc.statut === 'valide' ? 'default' : 'secondary'}>
                            {doc.statut}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.id, doc.nom)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun document disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expert */}
          <TabsContent value="expert" className="space-y-6">
            {clientProduit.expert_assignment ? (
              <Card>
                <CardHeader>
                  <CardTitle>Expert assigné</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{clientProduit.expert_assignment.expert.name}</h3>
                        <p className="text-gray-600">{clientProduit.expert_assignment.expert.company_name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm">{clientProduit.expert_assignment.expert.rating}/5</span>
                          </div>
                          <Badge variant="outline">
                            {clientProduit.expert_assignment.statut}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Spécialisations</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {clientProduit.expert_assignment.expert.specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact</label>
                        <div className="space-y-1 mt-1">
                          <p className="text-sm flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {clientProduit.expert_assignment.expert.email}
                          </p>
                          <p className="text-sm flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {clientProduit.expert_assignment.expert.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={handleContactExpert} className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contacter l'expert
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir le profil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun expert assigné</h3>
                  <p className="text-gray-600">
                    Un expert sera automatiquement assigné lors du démarrage de l'audit.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du dossier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notifications</label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email</span>
                        <Button variant="outline" size="sm">Activer</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SMS</span>
                        <Button variant="outline" size="sm">Activer</Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Actions</label>
                    <div className="space-y-2 mt-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier le dossier
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer le dossier
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 