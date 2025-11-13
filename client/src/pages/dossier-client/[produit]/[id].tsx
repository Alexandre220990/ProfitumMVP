import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DossierStepsDisplay from '@/components/DossierStepsDisplay';
import UniversalProductWorkflow from "@/components/UniversalProductWorkflow";
import { WorkflowDocumentUpload } from '@/components/documents/WorkflowDocumentUpload';
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';

import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  Euro, 
  TrendingUp, 
  CheckCircle, 
  User,
  Phone,
  Mail,
  Download,
  FileText,
  Share2,
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  Star,
  Target,
  Zap,
  Activity,
  HelpCircle,
  Info,
  Truck,
  Database,
  Flame
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { get, post } from "@/lib/api";

interface ClientProduitEligible {
  id: string;
  client_id: string;
  produit_id: string;
  statut: string;
  taux_final: number;
  montant_final: number;
  duree_finale: number;
  tauxFinal?: number;
  montantFinal?: number;
  dureeFinale?: number;
  simulationId: number;
  created_at: string;
  updated_at: string;
  produit?: {
    id: string;
    nom: string;
    description?: string;
    categorie?: string;
    type?: string;
    conditions?: any;
    avantages?: string[];
    documents_requis?: string[];
  };
  ProduitEligible?: {
    id?: string;
    nom?: string;
    description?: string;
    categorie?: string;
    type?: string;
    conditions?: any;
    avantages?: string[];
    documents_requis?: string[];
  };
  client?: {
    id: string;
    email: string;
    name: string;
    company_name: string;
    phone: string;
    city: string;
    siren: string;
  };
  Client?: {
    id?: string;
    email?: string;
    name?: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    siren?: string;
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
  metadata?: {
    source?: 'simulation' | 'apporteur';
    created_by_apporteur?: string;
    apporteur_notes?: string;
  };
  notes?: string;
  priorite?: number;
  progress?: number;
  current_step?: number;
}


type SimplifiedProductKey =
  | 'chronotachygraphes'
  | 'logiciel_solid'
  | 'optimisation_fournisseur_electricite'
  | 'optimisation_fournisseur_gaz';

interface SimplifiedProductContent {
  productKey: SimplifiedProductKey;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  amountLabel: string;
  amountColor: string;
  amountFallback: string;
  durationLabel: string;
  durationColor: string;
  durationFallback: string;
  advantages: Array<{ title: string; description: string }>;
  expertRole: string;
  documentsIntro?: string;
  workflowTitle?: string;
  workflowDuration?: string;
  workflowHighlights?: Array<{ title: string; description: string }>;
  workflowNotice?: string;
}

const SIMPLIFIED_PRODUCT_CONTENT: Record<string, SimplifiedProductContent> = {
  'chronotachygraphes-digitaux': {
    productKey: 'chronotachygraphes',
    title: 'Chronotachygraphes Digitaux',
    subtitle: 'Pilotage temps réel et démarches TICPE simplifiées',
    description: 'Les chronotachygraphes digitaux permettent un pilotage en temps réel de votre flotte et simplifient vos démarches administratives liées au remboursement TICPE.',
    icon: Truck,
    iconBackground: 'bg-orange-100',
    iconColor: 'text-orange-600',
    amountLabel: "Coût d'installation",
    amountColor: 'text-orange-600',
    amountFallback: 'N/A',
    durationLabel: "Délai d'installation",
    durationColor: 'text-indigo-600',
    durationFallback: '2 mois',
    advantages: [
      {
        title: 'Suivi temps réel',
        description: 'Monitoring complet de votre flotte et des temps de conduite.'
      },
      {
        title: 'Conformité réglementaire',
        description: 'Respect des obligations légales transport & TICPE.'
      },
      {
        title: 'Démarches TICPE simplifiées',
        description: 'Automatisation des données pour le remboursement Ticpe.'
      },
      {
        title: 'Support technique national',
        description: 'Installation, formation et support continu inclus.'
      }
    ],
    expertRole: 'Expert distributeur chronotachygraphes',
    documentsIntro: "Téléversez les documents de votre flotte pour lancer l'installation.",
    workflowTitle: 'Workflow Chronotachygraphes Digitaux',
    workflowDuration: 'Durée estimée : 1-2 mois',
    workflowHighlights: [
      {
        title: 'Vérifications initiales',
        description: 'Collecte de la carte grise et vérification des informations clés.'
      },
      {
        title: 'Questions spécifiques',
        description: 'Répondez sur votre flotte poids lourds pour préparer la proposition.'
      },
      {
        title: 'Proposition partenaire',
        description: 'Demande de devis au distributeur, validation et facturation.'
      }
    ],
    workflowNotice:
      'Important : Processus simplifié — confirmation des informations, devis partenaire, validation et facturation.'
  },
  'optimisation-fournisseur-electricite': {
    productKey: 'optimisation_fournisseur_electricite',
    title: 'Optimisation Fournisseur Électricité',
    subtitle: 'Réduisez votre facture grâce à une mise en concurrence sur-mesure',
    description:
      "Analysez vos contrats d'électricité pour identifier des économies immédiates. Téléversez une facture récente pour lancer le diagnostic et recevoir une proposition personnalisée.",
    icon: Zap,
    iconBackground: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    amountLabel: 'Économies annuelles réalisables',
    amountColor: 'text-yellow-600',
    amountFallback: 'À estimer',
    durationLabel: 'Délai moyen',
    durationColor: 'text-emerald-600',
    durationFallback: '3-4 semaines',
    advantages: [
      {
        title: 'Mise en concurrence ciblée',
        description: 'Comparatif des meilleures offres fournisseurs pour votre profil de consommation.'
      },
      {
        title: 'Suivi contractuel',
        description: 'Accompagnement dans la négociation et la signature du nouveau contrat.'
      },
      {
        title: 'Projection budgétaire',
        description: 'Simulation des économies mensuelles et annuelles attendues.'
      },
      {
        title: 'Pilotage simplifié',
        description: 'Tableau de bord pour suivre vos consommations et alertes de renouvellement.'
      }
    ],
    expertRole: 'Consultant énergie électricité',
    documentsIntro: "Téléversez votre facture d'électricité (mensuelle ou annuelle) pour démarrer l'analyse.",
    workflowTitle: 'Diagnostic optimisation électricité',
    workflowDuration: 'Durée estimée : 3-4 semaines',
    workflowHighlights: [
      {
        title: 'Collecte de vos données',
        description: 'Analyse de vos factures et identification des postes de dépenses.'
      },
      {
        title: 'Benchmark fournisseurs',
        description: 'Mise en concurrence des fournisseurs d’électricité adaptés à votre profil.'
      },
      {
        title: 'Proposition optimisée',
        description: 'Présentation du plan d’économies et accompagnement à la signature du nouveau contrat.'
      }
    ],
    workflowNotice:
      "Important : fournissez des données mensuelles (dépense et kWh) pour obtenir une simulation d'économies immédiate."
  },
  'optimisation-fournisseur-gaz': {
    productKey: 'optimisation_fournisseur_gaz',
    title: 'Optimisation Fournisseur Gaz',
    subtitle: 'Sécurisez vos approvisionnements et baissez vos coûts de gaz naturel',
    description:
      'Lancez la renégociation de vos contrats de gaz à partir d’une facture récente. Nos experts identifient les meilleures conditions tarifaires et contractuelles.',
    icon: Flame,
    iconBackground: 'bg-orange-100',
    iconColor: 'text-orange-600',
    amountLabel: 'Économies annuelles réalisables',
    amountColor: 'text-orange-600',
    amountFallback: 'À estimer',
    durationLabel: 'Délai moyen',
    durationColor: 'text-blue-600',
    durationFallback: '3-4 semaines',
    advantages: [
      {
        title: 'Analyse fine du profil',
        description: 'Étude de votre consommation mensuelle et des clauses contractuelles actuelles.'
      },
      {
        title: 'Appels d’offres rapides',
        description: 'Négociation express auprès de fournisseurs certifiés et adaptés à votre secteur.'
      },
      {
        title: 'Sécurisation des volumes',
        description: 'Recommandations sur la couverture de vos volumes et la gestion de la volatilité.'
      },
      {
        title: 'Accompagnement contractuel',
        description: 'Support jusqu’à la signature et au suivi des gains réalisés.'
      }
    ],
    expertRole: 'Consultant énergie gaz',
    documentsIntro: "Téléversez votre facture de gaz (mensuelle ou annuelle) pour initier l'analyse.",
    workflowTitle: 'Diagnostic optimisation gaz',
    workflowDuration: 'Durée estimée : 3-4 semaines',
    workflowHighlights: [
      {
        title: 'Collecte et qualification',
        description: 'Centralisation de vos données de consommation et de prix actuels.'
      },
      {
        title: 'Benchmark fournisseurs',
        description: 'Consultation d’un panel de fournisseurs de gaz naturel compétitifs.'
      },
      {
        title: 'Proposition optimisée',
        description: 'Restitution des économies réalisables et accompagnement à la bascule contractuelle.'
      }
    ],
    workflowNotice:
      'Pensez à indiquer votre dépense mensuelle et votre consommation moyenne pour accélérer la comparaison des offres.'
  },
  'logiciel-solid': {
    productKey: 'logiciel_solid',
    title: 'Logiciel Solid',
    subtitle: 'Automatisation de la gestion comptable et RH pour PME',
    description: "Logiciel Solid est une solution complète d'automatisation de la gestion comptable et RH pour les PME industrielles et de services. Intégration ERP, gestion des paies et transmission automatique des données.",
    icon: Database,
    iconBackground: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    amountLabel: "Coût d'abonnement",
    amountColor: 'text-indigo-600',
    amountFallback: 'N/A',
    durationLabel: 'Délai de déploiement',
    durationColor: 'text-indigo-600',
    durationFallback: '1 mois',
    advantages: [
      {
        title: 'Automatisation complète',
        description: 'Gestion comptable et RH intégrée de bout en bout.'
      },
      {
        title: 'Intégration ERP',
        description: 'Connexion transparente avec vos systèmes existants.'
      },
      {
        title: 'Formation incluse',
        description: 'Accompagnement et formation des équipes utilisateurs.'
      },
      {
        title: 'Support technique',
        description: 'Assistance continue et mises à jour garanties.'
      }
    ],
    expertRole: 'Expert intégrateur Logiciel Solid',
    documentsIntro: "Déposez vos documents salariaux pour démarrer l'intégration.",
    workflowTitle: 'Déploiement Logiciel Solid',
    workflowDuration: 'Durée estimée : 1 mois',
    workflowHighlights: [
      {
        title: 'Audit des flux',
        description: 'Analyse de vos processus comptables et RH existants.'
      },
      {
        title: 'Paramétrage & intégration',
        description: 'Connexion à vos outils, migration des données, paramétrage des automatisations.'
      },
      {
        title: 'Formation & mise en production',
        description: 'Formation des équipes, validation et lancement des automatisations.'
      }
    ],
    workflowNotice:
      'Notre équipe vous accompagne de bout en bout : cadrage, paramétrage, formation et support continu.'
  }
};

interface SimplifiedProductDossierViewProps {
  clientProduit: ClientProduitEligible;
  clientInfo?: ClientProduitEligible['Client'];
  clientProduitId: string;
  content: SimplifiedProductContent;
  getStatusBadge: (status: string) => JSX.Element;
  onBack: () => void;
}

const SimplifiedProductDossierView = ({
  clientProduit,
  clientInfo,
  clientProduitId,
  content,
  getStatusBadge,
  onBack
}: SimplifiedProductDossierViewProps) => {
  const montant = clientProduit.montant_final ?? clientProduit.montantFinal;
  const duree = clientProduit.duree_finale ?? clientProduit.dureeFinale;
  const progressValue = clientProduit.progress ?? clientProduit.audit?.progress ?? 0;
  const isFromApporteur = clientProduit.metadata?.source === 'apporteur';
  const isHighPriority = clientProduit.priorite === 1;

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return null;
    }
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dossier {content.title}</h1>
            <p className="text-gray-600">
              ID dossier : {clientProduit.id} • Créé le{' '}
              {clientProduit.created_at
                ? new Date(clientProduit.created_at).toLocaleDateString('fr-FR')
                : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {clientProduit.statut ? getStatusBadge(clientProduit.statut) : null}
        </div>
      </div>

      {isFromApporteur && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="bg-blue-600 text-white flex items-center gap-1">
              <User className="w-3 h-3" />
              Recommandé par votre conseiller
            </Badge>
            {isHighPriority && (
              <Badge className="bg-amber-500 text-white">⭐ Priorité haute</Badge>
            )}
          </div>
          {clientProduit.notes && (
            <p className="text-sm text-blue-800">
              💬 <strong>Note :</strong> {clientProduit.notes}
            </p>
          )}
          {clientProduit.metadata?.apporteur_notes && (
            <p className="text-sm text-blue-800 mt-1">
              📝 <strong>Conseiller :</strong> {clientProduit.metadata.apporteur_notes}
            </p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${content.iconBackground}`}>
                <content.icon className={`w-8 h-8 ${content.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {content.title}
                </CardTitle>
                <p className="text-gray-600">{content.subtitle}</p>
              </div>
            </div>
            {progressValue ? (
              <div className="text-right">
                <p className="text-sm text-gray-500">Progression</p>
                <p className="text-lg font-semibold text-gray-900">
                  {progressValue}%
                </p>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${content.amountColor}`}>
                {formatCurrency(montant) ?? content.amountFallback}
              </div>
              <div className="text-sm text-gray-600">{content.amountLabel}</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${content.durationColor}`}>
                {duree ? `${duree} mois` : content.durationFallback}
              </div>
              <div className="text-sm text-gray-600">{content.durationLabel}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            À propos du service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Présentation</h3>
            <p className="text-gray-700 leading-relaxed">{content.description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Les bénéfices
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.advantages.map((advantage, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-800">{advantage.title}</h4>
                    <p className="text-sm text-gray-600">{advantage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>{content.workflowTitle || 'Suivi du dossier'}</CardTitle>
            {content.workflowDuration && (
              <span className="text-sm text-gray-600">{content.workflowDuration}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Progression globale
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {typeof progressValue === 'number' ? `${progressValue}%` : '—'}
              </p>
            </div>
            {content.workflowHighlights?.map((highlight, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-gray-800">{highlight.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed mt-1">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>

          {content.workflowNotice && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {content.workflowNotice}
            </div>
          )}

          <UniversalProductWorkflow
            clientProduitId={clientProduitId}
            productKey={content.productKey}
            companyName={clientInfo?.company_name || clientInfo?.name}
            estimatedAmount={typeof montant === 'number' ? montant : undefined}
          />
        </CardContent>
      </Card>

    </div>
  );
};


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
        const produitRelation = dossierData.ProduitEligible || dossierData.produit;
        if (!dossierData.ProduitEligible && produitRelation) {
          dossierData.ProduitEligible = produitRelation;
        }
        
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

  const produitInfo = clientProduit.ProduitEligible || clientProduit.produit;
  const clientInfo = clientProduit.Client || clientProduit.client;
  const simplifiedContent = produitNom ? SIMPLIFIED_PRODUCT_CONTENT[produitNom] : undefined;

  if (simplifiedContent) {
    return (
      <SimplifiedProductDossierView
        clientProduit={clientProduit}
        clientInfo={clientInfo}
        clientProduitId={clientProduit.id}
        content={simplifiedContent}
        getStatusBadge={(status) => getStatusBadge(status)}
        onBack={() => navigate('/dashboard/client')}
      />
    );
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
                  Dossier {produitInfo?.nom || 'Produit'}
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
                    <h3 className="font-semibold text-lg">{produitInfo?.nom || 'Produit simplifié'}</h3>
                    {produitInfo?.description && (
                      <p className="text-gray-600">{produitInfo.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Catégorie</label>
                      <p className="text-gray-900">{produitInfo?.categorie || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-gray-900">{produitInfo?.type || '—'}</p>
                    </div>
                  </div>

                  {produitInfo?.avantages && produitInfo.avantages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Avantages</label>
                      <ul className="mt-2 space-y-1">
                        {produitInfo.avantages.map((avantage, index) => (
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
              dossierName={`${produitInfo?.nom || 'Produit'}${clientInfo?.company_name ? ` - ${clientInfo.company_name}` : ''}`}
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
                    produitId={produitInfo?.id}
                    clientId={clientInfo?.id}
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