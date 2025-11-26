import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  Handshake,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  Edit,
  RefreshCw,
  Eye,
  Trash2,
  Save,
  X,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get, put, del, post } from '@/lib/api';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';
import ClientTimeline from '@/components/client/ClientTimeline';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface ClientData {
  id: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  statut: string;
  apporteur_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DossierData {
  id: string;
  statut: string;
  montantFinal?: number;
  tauxFinal?: number;
  progress?: number;
  created_at: string;
  produitId?: string;
  ProduitEligible?: {
    id?: string;
    nom: string;
    categorie: string;
  };
  Expert?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    rating?: number;
    specializations?: string[];
  };
}

interface ApporteurData {
  id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone?: string;
  commission_rate?: number;
  status: string;
}

const ClientSynthese: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [dossiers, setDossiers] = useState<DossierData[]>([]);
  const [apporteur, setApporteur] = useState<ApporteurData | null>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [showDeleteNotesDialog, setShowDeleteNotesDialog] = useState(false);
  const [showAddDossierDialog, setShowAddDossierDialog] = useState(false);
  const [produitsEligibles, setProduitsEligibles] = useState<any[]>([]);
  const [selectedProduit, setSelectedProduit] = useState<string>('');
  const [produitQuestions, setProduitQuestions] = useState<any[]>([]);
  const [formAnswers, setFormAnswers] = useState<Record<string, number | string>>({});
  const [formData, setFormData] = useState({
    montantFinal: '',
    tauxFinal: '',
    dureeFinale: '',
    clientFeePercentage: '30',
    profitumFeePercentage: '30',
    notes: ''
  });
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [creatingDossier, setCreatingDossier] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);

  // Statistiques calculées
  const [stats, setStats] = useState({
    totalDossiers: 0,
    dossiersValides: 0,
    dossiersEnCours: 0,
    montantTotal: 0,
    montantRealise: 0,
    tauxConversion: 0
  });

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // 1. Charger les infos du client
      const clientResponse = await get(`/admin/clients/${id}`);
      if (clientResponse.success) {
        const clientData = (clientResponse.data as any)?.client;
        setClient(clientData);

        // 2. Charger l'apporteur si présent
        if (clientData?.apporteur_id) {
          const apporteurResponse = await get(`/admin/apporteurs/${clientData.apporteur_id}`);
          if (apporteurResponse.success) {
            setApporteur((apporteurResponse.data as any)?.apporteur);
          }
        }
      } else {
        toast.error('Client non trouvé');
        navigate('/admin/dashboard-optimized');
        return;
      }

      // 3. Charger tous les dossiers du client
      const dossiersResponse = await get('/admin/dossiers/all');
      if (dossiersResponse.success) {
        const allDossiers = (dossiersResponse.data as any)?.dossiers || [];
        const clientDossiers = allDossiers.filter((d: any) => d.clientId === id);
        setDossiers(clientDossiers);

        // Extraire les experts uniques
        const uniqueExperts = new Map();
        clientDossiers.forEach((d: any) => {
          if (d.Expert) {
            uniqueExperts.set(d.Expert.id, d.Expert);
          }
        });
        setExperts(Array.from(uniqueExperts.values()));

        // Calculer les stats
        const totalDossiers = clientDossiers.length;
        const dossiersValides = clientDossiers.filter((d: any) => d.statut === 'validated').length;
        const dossiersEnCours = clientDossiers.filter((d: any) => 
          d.statut === 'pending' || d.statut === 'eligible' || d.statut === 'in_progress'
        ).length;
        const montantTotal = clientDossiers.reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
        const montantRealise = clientDossiers
          .filter((d: any) => d.statut === 'validated')
          .reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
        const tauxConversion = totalDossiers > 0 ? Math.round((dossiersValides / totalDossiers) * 100) : 0;

        setStats({
          totalDossiers,
          dossiersValides,
          dossiersEnCours,
          montantTotal,
          montantRealise,
          tauxConversion
        });
      }

    } catch (error) {
      console.error('Erreur chargement données client:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'admin') {
    return <Navigate to="/login" />;
  }

  const getClientDisplayName = () => {
    if (!client) return 'N/A';
    return client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    
    try {
      const response = await put(`/admin/clients/${id}/notes`, { notes: notesValue });
      if (response.success) {
        setClient(prev => prev ? { ...prev, notes: notesValue } : null);
        setEditingNotes(false);
        toast.success('Notes mises à jour avec succès');
        // Recharger les données pour avoir la timeline à jour
        loadClientData();
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour notes:', error);
      toast.error(error?.message || 'Erreur lors de la mise à jour des notes');
    }
  };

  const handleDeleteNotes = async () => {
    if (!id) return;
    
    try {
      const response = await del(`/admin/clients/${id}/notes`);
      if (response.success) {
        setClient(prev => prev ? { ...prev, notes: undefined } : null);
        setShowDeleteNotesDialog(false);
        toast.success('Notes supprimées avec succès');
        // Recharger les données pour avoir la timeline à jour
        loadClientData();
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression notes:', error);
      toast.error(error?.message || 'Erreur lors de la suppression des notes');
    }
  };

  const loadProduitsEligibles = async () => {
    setLoadingProduits(true);
    try {
      const response = await get('/admin/produits');
      if (response.success && response.data) {
        const produits = (response.data as any)?.produits || [];
        setProduitsEligibles(produits);
      } else {
        toast.error('Erreur lors du chargement des produits');
      }
    } catch (error: any) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoadingProduits(false);
    }
  };

  const groupProduitsByCategory = () => {
    const grouped: Record<string, any[]> = {};
    produitsEligibles.forEach((produit: any) => {
      const categorie = produit.categorie || 'Non catégorisé';
      if (!grouped[categorie]) {
        grouped[categorie] = [];
      }
      grouped[categorie].push(produit);
    });
    
    // Trier les catégories
    const ordreCategories = [
      'Optimisation Fiscale',
      'Optimisation Sociale',
      'Optimisation Énergétique',
      'Services Juridiques et Recouvrement',
      'Logiciels et Outils Numériques',
      'Non catégorisé'
    ];
    
    const sorted: Record<string, any[]> = {};
    ordreCategories.forEach(cat => {
      if (grouped[cat]) {
        sorted[cat] = grouped[cat].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      }
    });
    
    // Ajouter les autres catégories
    Object.keys(grouped).forEach(cat => {
      if (!sorted[cat]) {
        sorted[cat] = grouped[cat].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      }
    });
    
    return sorted;
  };

  const handleProduitChange = async (produitId: string) => {
    setSelectedProduit(produitId);
    setFormAnswers({});
    setFormData(prev => ({
      ...prev,
      montantFinal: '',
      tauxFinal: '',
      dureeFinale: ''
    }));
    
    // Récupérer le produit sélectionné
    const produit = produitsEligibles.find((p: any) => p.id === produitId);
    if (!produit) return;

    // Récupérer les questions nécessaires basées sur parametres_requis
    if (produit.parametres_requis && Array.isArray(produit.parametres_requis)) {
      try {
        // Charger toutes les questions du questionnaire
        const questionsResponse = await get('/simulator/questions');
        if (questionsResponse.success && questionsResponse.data) {
          // L'API peut retourner { questions: [...] } ou directement un tableau
          const allQuestions = (questionsResponse.data as any)?.questions || 
                              (Array.isArray(questionsResponse.data) ? questionsResponse.data : []);
          
          // Mapping amélioré des paramètres requis vers les codes de questions
          const paramToQuestionCodeMap: Record<string, string[]> = {
            'secteur': ['GENERAL_001'],
            'ca': ['GENERAL_002', 'CALCUL_CA'],
            'ca_tranche': ['GENERAL_002'],
            'nb_employes': ['GENERAL_003', 'CALCUL_EMPLOYES'],
            'nb_employes_tranche': ['GENERAL_003'],
            'proprietaire_locaux': ['GENERAL_004'],
            'contrats_energie': ['GENERAL_005'],
            'possede_vehicules': ['TICPE_001'],
            'types_vehicules': ['TICPE_003'],
            'litres_carburant_mois': ['TICPE_002', 'CALCUL_TICPE_LITRES'],
            'nb_chauffeurs': ['DFS_001', 'CALCUL_DFS_CHAUFFEURS'],
            'montant_taxe_fonciere': ['FONCIER_001', 'CALCUL_FONCIER_MONTANT'],
            'montant_factures_energie_mois': ['ENERGIE_001', 'CALCUL_ENERGIE_FACTURES'],
            'niveau_impayes': ['RECOUVR_001']
          };
          
          // Filtrer les questions qui correspondent aux paramètres requis
          const requiredQuestions = allQuestions.filter((q: any) => {
            const questionCode = q.question_id || q.code || q.id;
            const questionText = (q.question_text || q.texte || '').toLowerCase();
            
            return produit.parametres_requis.some((param: string) => {
              // D'abord essayer avec le mapping direct
              const possibleCodes = paramToQuestionCodeMap[param];
              if (possibleCodes) {
                return possibleCodes.some(code => 
                  questionCode?.toLowerCase() === code.toLowerCase()
                );
              }
              
              // Fallback : recherche dans le texte
              const paramLower = param.toLowerCase();
              return questionCode?.toLowerCase().includes(paramLower) ||
                     questionText.includes(paramLower);
            });
          });
          
          setProduitQuestions(requiredQuestions);
        }
      } catch (error: any) {
        console.error('Erreur chargement questions:', error);
        // Si erreur, on continue sans questions
        setProduitQuestions([]);
      }
    } else {
      setProduitQuestions([]);
    }
  };

  // Fonction pour calculer automatiquement les valeurs à partir des réponses
  const calculateValues = async () => {
    if (!selectedProduit || !id) return;
    
    // Vérifier que toutes les questions requises sont remplies
    const produit = produitsEligibles.find((p: any) => p.id === selectedProduit);
    if (!produit) return;
    
    const allRequiredFilled = produitQuestions.every((q: any) => {
      const questionId = q.question_id || q.code || q.id;
      const answer = formAnswers[questionId];
      return answer !== undefined && answer !== '' && answer !== null && (typeof answer === 'number' ? !isNaN(answer) : true);
    });
    
    if (!allRequiredFilled) {
      // Réinitialiser les valeurs si toutes les questions ne sont pas remplies
      setFormData(prev => ({
        ...prev,
        montantFinal: '',
        tauxFinal: '',
        dureeFinale: ''
      }));
      return;
    }
    
    try {
      // Préparer les réponses au format attendu par l'API
      const answersForAPI: Record<string, any> = {};
      produitQuestions.forEach((q: any) => {
        const questionId = q.question_id || q.code || q.id;
        const value = formAnswers[questionId];
        if (value !== undefined && value !== '') {
          answersForAPI[questionId] = value;
        }
      });
      
      // Appeler l'endpoint de calcul
      const response = await post(`/admin/clients/${id}/client-produit-eligible/calculate`, {
        produitId: selectedProduit,
        answers: answersForAPI
      });
      
      if (response.success && response.data) {
        const data = response.data as {
          montantFinal?: number;
          tauxFinal?: number;
          dureeFinale?: number;
        };
        
        // Mettre à jour les champs avec les valeurs calculées
        setFormData(prev => ({
          ...prev,
          montantFinal: data.montantFinal?.toString() || '',
          tauxFinal: data.tauxFinal ? (data.tauxFinal * 100).toString() : '', // Convertir en pourcentage pour l'affichage
          dureeFinale: data.dureeFinale?.toString() || ''
        }));
        
        toast.success('Valeurs calculées automatiquement');
      }
    } catch (error: any) {
      console.error('Erreur calcul automatique:', error);
      // Ne pas afficher d'erreur si c'est juste que les questions ne sont pas toutes remplies
      if (error?.message && !error.message.includes('obligatoire')) {
        toast.error('Erreur lors du calcul automatique');
      }
    }
  };

  // Recalculer quand les réponses changent
  useEffect(() => {
    if (selectedProduit && produitQuestions.length > 0) {
      const timer = setTimeout(() => {
        calculateValues();
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timer);
    }
  }, [formAnswers, selectedProduit, produitQuestions]);

  const resetForm = () => {
    setSelectedProduit('');
    setProduitQuestions([]);
    setFormAnswers({});
    setFormData({
      montantFinal: '',
      tauxFinal: '',
      dureeFinale: '',
      clientFeePercentage: '30',
      profitumFeePercentage: '30',
      notes: ''
    });
  };

  const handleCreateDossier = async () => {
    if (!id || !selectedProduit) return;
    
    setCreatingDossier(true);
    try {
      const produit = produitsEligibles.find((p: any) => p.id === selectedProduit);
      if (!produit) {
        toast.error('Produit non trouvé');
        return;
      }

      // Préparer les réponses au format attendu
      const answersForAPI: Record<string, any> = {};
      produitQuestions.forEach((q: any) => {
        const questionId = q.question_id || q.code || q.id;
        const value = formAnswers[questionId];
        if (value !== undefined && value !== '') {
          answersForAPI[questionId] = value;
        }
      });

      const response = await post(`/admin/clients/${id}/client-produit-eligible`, {
        produitId: selectedProduit,
        montantFinal: parseFloat(formData.montantFinal),
        tauxFinal: parseFloat(formData.tauxFinal), // Le backend convertira en décimal si nécessaire
        dureeFinale: parseInt(formData.dureeFinale),
        clientFeePercentage: parseFloat(formData.clientFeePercentage) / 100,
        profitumFeePercentage: parseFloat(formData.profitumFeePercentage) / 100,
        notes: formData.notes || undefined,
        calcul_details: {
          answers: answersForAPI,
          parametres_requis: produit.parametres_requis || []
        }
      });

      if (response.success) {
        toast.success('Dossier créé avec succès');
        setShowAddDossierDialog(false);
        resetForm();
        // Recharger les données
        loadClientData();
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('Erreur création dossier:', error);
      toast.error(error?.message || 'Erreur lors de la création du dossier');
    } finally {
      setCreatingDossier(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!id) return;
    
    setDeletingClient(true);
    try {
      const response = await del(`/admin/clients/${id}`);
      if (response.success) {
        toast.success('Client supprimé définitivement');
        setShowDeleteDialog(false);
        // Rediriger vers le dashboard optimisé après suppression
        setTimeout(() => {
          navigate('/admin/dashboard-optimized');
        }, 1000);
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression client:', error);
      toast.error(error?.message || 'Erreur lors de la suppression du client');
      setDeletingClient(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/dashboard-optimized')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Synthèse Client
            </h1>
            <p className="text-gray-600">
              {loading ? 'Chargement...' : getClientDisplayName()}
            </p>
            {client?.company_name && (
              <p className="text-sm text-gray-500">
                🏢 {client.company_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadClientData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Supprimer définitivement
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    Suppression définitive du client
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base space-y-3 pt-2">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <p className="font-semibold text-red-900 mb-2">
                        ⚠️ Cette action est IRREVERSIBLE et supprimera définitivement :
                      </p>
                      <ul className="list-disc list-inside text-red-800 space-y-1 ml-2">
                        <li>Le client et toutes ses informations</li>
                        <li>Tous les dossiers associés ({stats.totalDossiers} dossier{stats.totalDossiers > 1 ? 's' : ''})</li>
                        <li>Tous les documents et fichiers</li>
                        <li>Toutes les simulations</li>
                        <li>Tous les rendez-vous et événements</li>
                        <li>Toutes les notifications</li>
                        <li>L'historique complet du client</li>
                      </ul>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3">
                      <p className="text-sm text-yellow-900">
                        <strong>Client :</strong> {getClientDisplayName()}
                      </p>
                      <p className="text-sm text-yellow-900">
                        <strong>Email :</strong> {client?.email}
                      </p>
                    </div>
                    <p className="text-red-600 font-semibold mt-3">
                      Cette action ne peut pas être annulée. Êtes-vous absolument certain de vouloir continuer ?
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel disabled={deletingClient}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteClient}
                    disabled={deletingClient}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deletingClient ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Suppression en cours...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Oui, supprimer définitivement
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

        {loading ? (
          <LoadingScreen />
        ) : !client ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Client non trouvé</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Dossiers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDossiers}</p>
                  <p className="text-xs text-gray-500">{stats.dossiersEnCours} en cours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Validés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.dossiersValides}</p>
                  <p className="text-xs text-gray-500">{stats.tauxConversion}% de conversion</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    Montant Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.montantTotal.toLocaleString('fr-FR')}€
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.montantRealise.toLocaleString('fr-FR')}€ réalisé
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    Experts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{experts.length}</p>
                  <p className="text-xs text-gray-500">experts assignés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-indigo-600">{stats.tauxConversion}%</p>
                  <p className="text-xs text-gray-500">taux de conversion</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs : Profil | Timeline | Dossiers | Experts | Apporteur */}
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profil">Profil</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="dossiers">Dossiers ({stats.totalDossiers})</TabsTrigger>
                <TabsTrigger value="experts">Experts ({experts.length})</TabsTrigger>
                <TabsTrigger value="apporteur">Apporteur</TabsTrigger>
              </TabsList>

              {/* TAB PROFIL */}
              <TabsContent value="profil">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-900 font-semibold">Informations du Client</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Informations principales en grid 3 colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                          Nom / Entreprise
                        </label>
                        <p className="text-base font-bold text-gray-900 leading-tight">{getClientDisplayName()}</p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          Email
                        </label>
                        <a 
                          href={`mailto:${client.email}`}
                          className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-medium block"
                        >
                          {client.email}
                        </a>
                      </div>

                      {client.phone && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            Téléphone
                          </label>
                          <a 
                            href={`tel:${client.phone}`}
                            className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-medium block"
                          >
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Adresse et statut en grid 2 colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {client.address && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            Adresse
                          </label>
                          <p className="text-sm text-gray-900 font-medium leading-relaxed">{client.address}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                          Statut
                        </label>
                        <div>
                          <Badge 
                            variant={client.statut === 'actif' || client.statut === 'active' ? 'default' : 'secondary'}
                            className="text-xs px-2 py-0.5 font-medium"
                          >
                            {client.statut}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Dates en grid 2 colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Date de création
                        </label>
                        <p className="text-sm text-gray-900 font-medium">
                          {new Date(client.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                          Dernière mise à jour
                        </label>
                        <p className="text-sm text-gray-900 font-medium">
                          {new Date(client.updated_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Notes internes en pleine largeur */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3 h-3" />
                          Notes internes
                        </label>
                        {user?.type === 'admin' && (
                          <div className="flex gap-1">
                            {!editingNotes ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNotesValue(client.notes || '');
                                    setEditingNotes(true);
                                  }}
                                  className="h-6 px-2 hover:bg-gray-100"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                {client.notes && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowDeleteNotesDialog(true)}
                                    className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveNotes}
                                  className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingNotes(false);
                                    setNotesValue('');
                                  }}
                                  className="h-6 px-2 hover:bg-gray-100"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {editingNotes ? (
                        <div>
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Notes internes (non visibles par le client)..."
                            rows={6}
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
                          />
                          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Ces notes ne sont pas visibles par le client
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-lg p-3 shadow-sm min-h-[80px] max-h-[300px] overflow-y-auto">
                          {client.notes ? (
                            <>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{client.notes}</p>
                              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Ces notes ne sont pas visibles par le client
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Aucune note interne</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bouton modifier */}
                    <div className="pt-2 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="font-medium">
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Modifier le profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB TIMELINE */}
              <TabsContent value="timeline">
                {id && (
                  <ClientTimeline 
                    clientId={id} 
                    userType={user?.type as 'expert' | 'admin' | 'apporteur'}
                    clientInfo={{
                      name: client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : undefined,
                      company_name: client?.company_name,
                      phone_number: client?.phone,
                      email: client?.email
                    }}
                  />
                )}
              </TabsContent>

              {/* TAB DOSSIERS */}
              <TabsContent value="dossiers">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Dossiers ClientProduitEligible ({dossiers.length})
                      </CardTitle>
                      <Button 
                        onClick={() => {
                          setShowAddDossierDialog(true);
                          loadProduitsEligibles();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un dossier
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dossiers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dossiers.map((dossier: DossierData) => (
                          <div
                            key={dossier.id}
                            onClick={() => navigate(`/admin/dossiers/${dossier.id}`)}
                            className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden"
                          >
                            {/* Effet de brillance au survol */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            
                            {/* Header avec nom du produit en valeur */}
                            <div className="mb-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {dossier.ProduitEligible?.nom || 'N/A'}
                                  </h3>
                                  <Badge 
                                    variant={
                                      dossier.statut === 'eligible' ? 'default' :
                                      dossier.statut === 'validated' ? 'default' :
                                      dossier.statut === 'pending' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {dossier.statut}
                                  </Badge>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                  <Briefcase className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                            </div>

                            {/* Métriques principales */}
                            <div className="space-y-3 mb-4">
                              {dossier.montantFinal && (
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-gray-600">Montant</span>
                                  </div>
                                  <span className="text-lg font-bold text-green-600">
                                    {dossier.montantFinal.toLocaleString('fr-FR')}€
                                  </span>
                                </div>
                              )}
                              {dossier.tauxFinal && (
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs text-gray-600">Taux</span>
                                  </div>
                                  <span className="text-lg font-bold text-blue-600">
                                    {(dossier.tauxFinal * 100).toFixed(2)}%
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-purple-600" />
                                  <span className="text-xs text-gray-600">Progression</span>
                                </div>
                                <span className="text-lg font-bold text-purple-600">
                                  {dossier.progress || 0}%
                                </span>
                              </div>
                            </div>

                            {/* Footer avec date et expert */}
                            <div className="pt-4 border-t border-gray-200 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {dossier.Expert && (
                                <div className="flex items-center gap-2 text-xs">
                                  <UserCheck className="w-3 h-3 text-blue-600" />
                                  <span className="text-gray-600">
                                    <strong>{dossier.Expert.first_name} {dossier.Expert.last_name}</strong>
                                  </span>
                                  {dossier.Expert.rating && (
                                    <span className="text-yellow-600">⭐ {dossier.Expert.rating}/5</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Indicateur de clic */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun dossier pour ce client</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB EXPERTS */}
              <TabsContent value="experts">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Experts Assignés ({experts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experts.length > 0 ? (
                      <div className="space-y-3">
                        {experts.map((expert: any) => (
                          <div key={expert.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">
                                    {`${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name}
                                  </h4>
                                  {expert.rating && (
                                    <span className="text-sm text-yellow-600">
                                      ⭐ {expert.rating}/5
                                    </span>
                                  )}
                                </div>

                                {expert.company_name && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    🏢 {expert.company_name}
                                  </p>
                                )}

                                {expert.specializations && expert.specializations.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {expert.specializations.slice(0, 3).map((spec: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {spec}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                <p className="text-xs text-gray-500 mt-2">
                                  Dossiers gérés: {dossiers.filter(d => d.Expert?.id === expert.id).length}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun expert assigné</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB APPORTEUR */}
              <TabsContent value="apporteur">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Handshake className="w-5 h-5" />
                      Apporteur d'Affaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apporteur ? (
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">
                                {`${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim() || apporteur.company_name}
                              </h4>
                              <Badge variant={
                                apporteur.status === 'active' ? 'default' : 'secondary'
                              }>
                                {apporteur.status}
                              </Badge>
                            </div>

                            {apporteur.company_name && (
                              <p className="text-sm text-gray-600 mb-2">
                                🏢 {apporteur.company_name}
                              </p>
                            )}

                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {apporteur.email}
                              </p>
                              {apporteur.phone && (
                                <p className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {apporteur.phone}
                                </p>
                              )}
                              {apporteur.commission_rate && (
                                <p className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  Commission: <strong>{apporteur.commission_rate}%</strong>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>Aucun apporteur d'affaires associé</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Dialog de confirmation suppression notes */}
        <Dialog open={showDeleteNotesDialog} onOpenChange={setShowDeleteNotesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer les notes internes</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer les notes internes de ce client ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteNotesDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteNotes}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog pour ajouter un dossier */}
        <Dialog open={showAddDossierDialog} onOpenChange={setShowAddDossierDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un ClientProduitEligible</DialogTitle>
              <DialogDescription>
                Créez un nouveau dossier pour ce client en sélectionnant un produit et en renseignant les informations nécessaires.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Sélection du produit */}
              <div className="space-y-2">
                <Label htmlFor="produit">Produit *</Label>
                {loadingProduits ? (
                  <p className="text-sm text-gray-500">Chargement des produits...</p>
                ) : (
                  <Select value={selectedProduit} onValueChange={handleProduitChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupProduitsByCategory()).map(([categorie, produits]) => (
                        <div key={categorie}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                            {categorie || 'Non catégorisé'}
                          </div>
                          {produits.map((produit: any) => (
                            <SelectItem key={produit.id} value={produit.id}>
                              {produit.nom}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Questions nécessaires pour le produit sélectionné */}
              {selectedProduit && produitQuestions.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Règles de calcul et données nécessaires au calcul</h3>
                    <Badge variant="outline" className="text-xs">
                      Calcul automatique activé
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Remplissez les champs ci-dessous pour que le montant, le taux et la durée soient calculés automatiquement.
                  </p>
                  {produitQuestions.map((question: any) => {
                    const questionId = question.question_id || question.code || question.id;
                    const questionType = question.question_type || question.type || 'text';
                    const isNumber = questionType === 'nombre' || questionType === 'number';
                    
                    return (
                      <div key={question.id || questionId} className="space-y-2">
                        <Label htmlFor={`question-${questionId}`}>
                          {question.question_text || question.texte}
                          {question.description && (
                            <span className="text-xs text-gray-500 ml-2">({question.description})</span>
                          )}
                        </Label>
                        {isNumber ? (
                          <Input
                            id={`question-${questionId}`}
                            type="number"
                            step="0.01"
                            placeholder="Entrez un nombre"
                            value={formAnswers[questionId] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormAnswers(prev => ({ 
                                ...prev, 
                                [questionId]: value ? parseFloat(value) : undefined 
                              }));
                            }}
                            required
                          />
                        ) : (
                          <Input
                            id={`question-${questionId}`}
                            type="text"
                            placeholder="Entrez votre réponse"
                            value={formAnswers[questionId] || ''}
                            onChange={(e) => {
                              setFormAnswers(prev => ({ 
                                ...prev, 
                                [questionId]: e.target.value 
                              }));
                            }}
                            required
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Champs de calcul */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Informations du dossier</h3>
                  {selectedProduit && produitQuestions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={calculateValues}
                      disabled={!produitQuestions.every((q: any) => {
                        const questionId = q.question_id || q.code || q.id;
                        const answer = formAnswers[questionId];
                        return answer !== undefined && answer !== '' && answer !== null;
                      })}
                    >
                      Recalculer
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="montantFinal">Montant Final (€) *</Label>
                    <Input
                      id="montantFinal"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.montantFinal}
                      onChange={(e) => setFormData(prev => ({ ...prev, montantFinal: e.target.value }))}
                      required
                    />
                    {selectedProduit && produitQuestions.length > 0 && (
                      <p className="text-xs text-gray-500">Calculé automatiquement</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tauxFinal">Taux Final (%) *</Label>
                    <Input
                      id="tauxFinal"
                      type="number"
                      step="0.01"
                      placeholder="35.00"
                      value={formData.tauxFinal}
                      onChange={(e) => setFormData(prev => ({ ...prev, tauxFinal: e.target.value }))}
                      required
                    />
                    {selectedProduit && produitQuestions.length > 0 && (
                      <p className="text-xs text-gray-500">Calculé automatiquement</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dureeFinale">Durée Finale (mois) *</Label>
                    <Input
                      id="dureeFinale"
                      type="number"
                      placeholder="12"
                      value={formData.dureeFinale}
                      onChange={(e) => setFormData(prev => ({ ...prev, dureeFinale: e.target.value }))}
                      required
                    />
                    {selectedProduit && produitQuestions.length > 0 && (
                      <p className="text-xs text-gray-500">Calculé automatiquement</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Commissionnement Waterfall */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Structure de commissionnement Waterfall</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientFeePercentage">% Fee Client → Expert *</Label>
                    <Input
                      id="clientFeePercentage"
                      type="number"
                      step="0.01"
                      placeholder="30"
                      value={formData.clientFeePercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientFeePercentage: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-gray-500">Pourcentage que le client paie à l'expert</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitumFeePercentage">% Fee Expert → Profitum *</Label>
                    <Input
                      id="profitumFeePercentage"
                      type="number"
                      step="0.01"
                      placeholder="30"
                      value={formData.profitumFeePercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, profitumFeePercentage: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-gray-500">Pourcentage que l'expert paie à Profitum</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes optionnelles..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDossierDialog(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateDossier}
                disabled={creatingDossier || !selectedProduit || !formData.montantFinal || !formData.tauxFinal || !formData.dureeFinale}
              >
                {creatingDossier ? 'Création...' : 'Créer le dossier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default ClientSynthese;

