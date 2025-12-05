import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { get, post, put } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import InfosClientEnrichies from '@/components/dossier/InfosClientEnrichies';
import ExpertDocumentRequestModal from '@/components/expert/ExpertDocumentRequestModal';
import ExpertDossierActions from '@/components/expert/ExpertDossierActions';
import ReviseAuditModal from '@/components/expert/ReviseAuditModal';
import FinaliserRapportAuditModal from '@/components/expert/FinaliserRapportAuditModal';
import SendClientEmailModal from '@/components/expert/SendClientEmailModal';
import type { ClientProduitStatut } from '@/types/statuts';
import { STATUT_COLORS, STATUT_LABELS, getProgressFromStatut } from '@/types/statuts';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Upload,
  AlertTriangle,
  Euro,
  Clock,
  MessageSquare,
  Save,
  Send,
  FileSearch,
  FileCheck
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  expert_id?: string | null;
  expert_pending_id?: string | null;
  statut: 'eligible' | 'en_cours' | 'termine' | 'annule' | 'documents_completes' | 'audit_rejected_by_client' | 'audit_completed' | string;
  metadata?: {
    validation_state?: string;
    workflow_stage?: string;
    closing_probability?: number;
    documents_uploaded?: boolean;
    expert_validation_needed?: boolean;
    eligible_validated_at?: string;
    finalized_at?: string;
    recommendation?: string;
    last_contact?: string;
    blocked?: boolean;
    blocking_reason?: string;
    client_fee_percentage?: number;
  };
  montantFinal?: number;
  tauxFinal?: number;
  created_at: string;
  updated_at: string;
  Client: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    company_name: string;
    email: string;
    phone_number: string;
    apporteur_id?: string;
    is_active?: boolean;
    qualification_score?: number;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description: string;
    type_produit?: string;
    categorie?: string;
  };
  ApporteurAffaires?: {
    id: string;
    company_name: string;
    email: string;
  };
  apporteur?: any;
  autresProduitsSimulation?: any[];
  potentielTotal?: any;
  documents?: Document[];
  notes?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

const isKnownStatut = (statut?: string): statut is ClientProduitStatut =>
  Boolean(statut && (STATUT_LABELS as Record<string, string>)[statut]);

const getStatutLabel = (statut?: string) => {
  if (!statut) return 'Statut inconnu';
  return isKnownStatut(statut) ? STATUT_LABELS[statut] : statut;
};

const getStatutBadgeClass = (statut?: string) => {
  if (!statut) return 'bg-gray-100 text-gray-700 border-gray-200';
  return isKnownStatut(statut) ? STATUT_COLORS[statut] : 'bg-gray-100 text-gray-700 border-gray-200';
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ExpertDossierSynthese() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cpe, setCPE] = useState<ClientProduitEligible | null>(null);
  const [expertNotes, setExpertNotes] = useState('');
  const [recommendation, setRecommendation] = useState<'favorable' | 'defavorable' | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDocRequestForm, setShowDocRequestForm] = useState(false);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [preFilledDocuments, setPreFilledDocuments] = useState<Array<{name: string; reason: string}>>([]);
  const [documentsReloadKey, setDocumentsReloadKey] = useState(0);
  const [searchParams] = useSearchParams();
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showFinaliserRapportModal, setShowFinaliserRapportModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);

  // Vérifier si on doit ouvrir le modal de révision
  useEffect(() => {
    if (searchParams.get('action') === 'revise') {
      setShowReviseModal(true);
    }
  }, [searchParams]);

  // Charger les données du CPE
  useEffect(() => {
    const loadCPE = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await get<ClientProduitEligible>(`/api/expert/dossier/${id}`);

        if (response.success && response.data) {
          setCPE(response.data);
          setExpertNotes(response.data.notes || '');
        } else {
          toast.error('Erreur lors du chargement du dossier');
          navigate('/dashboard/expert');
        }
      } catch (error) {
        console.error('Erreur chargement CPE:', error);
        toast.error('Erreur lors du chargement du dossier');
      } finally {
        setLoading(false);
      }
    };

    loadCPE();
  }, [id, navigate]);

  // ✅ Charger le nombre de documents pour le badge
  useEffect(() => {
    const loadDocumentsCount = async () => {
      if (!id) return;

      try {
        const response = await get<Document[]>(`/api/expert/dossier/${id}/documents`);
        if (response.success && response.data) {
          setDocumentsCount(Array.isArray(response.data) ? response.data.length : 0);
        }
      } catch (error) {
        console.error('Erreur chargement documents count:', error);
        setDocumentsCount(0);
      }
    };

    loadDocumentsCount();
  }, [id]);

  // Sauvegarder les notes
  const handleSaveNotes = async () => {
    if (!id) return;

    try {
      setSaving(true);
      const response = await put(`/api/expert/dossier/${id}/notes`, {
        expert_notes: expertNotes
      });

      if (response.success) {
        toast.success('Notes sauvegardées');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Valider l'éligibilité
  const handleValidateEligibility = async (validated: boolean) => {
    if (!id) return;

    try {
      const response = await post(`/api/expert/dossier/${id}/validate-eligibility`, {
        validated,
        notes: expertNotes
      });

      if (response.success) {
        toast.success(validated ? 'Éligibilité validée' : 'Éligibilité refusée');
        navigate('/dashboard/expert');
      } else {
        toast.error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  // Demander des documents
  const handleRequestDocuments = async () => {
    if (!id) return;

    try {
      const response = await post(`/api/expert/dossier/${id}/request-documents`, {
        notes: expertNotes
      });

      if (response.success) {
        toast.success('Demande de documents envoyée au client');
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur demande documents:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  // Envoyer le rapport final
  const handleSendReport = async () => {
    if (!id || !recommendation) {
      toast.error('Veuillez sélectionner une recommandation');
      return;
    }

    try {
      const response = await post(`/api/expert/dossier/${id}/send-report`, {
        recommendation,
        notes: expertNotes
      });

      if (response.success) {
        toast.success('Rapport envoyé au client');
        navigate('/dashboard/expert');
      } else {
        toast.error('Erreur lors de l\'envoi du rapport');
      }
    } catch (error) {
      console.error('Erreur envoi rapport:', error);
      toast.error('Erreur lors de l\'envoi du rapport');
    }
  };

  // Accepter le dossier
  const handleAcceptDossier = async () => {
    if (!id) return;

    try {
      const response = await post(`/api/expert/dossier/${id}/accept`, {
        notes: expertNotes || ''
      });

      if (response.success) {
        toast.success('Dossier accepté avec succès');
        // Recharger le dossier
        const dossierResponse = await get<ClientProduitEligible>(`/api/expert/dossier/${id}`);
        if (dossierResponse.success && dossierResponse.data) {
          setCPE(dossierResponse.data);
        }
      } else {
        toast.error(response.message || 'Erreur lors de l\'acceptation');
      }
    } catch (error: any) {
      console.error('Erreur acceptation dossier:', error);
      toast.error(error.message || 'Erreur lors de l\'acceptation du dossier');
    }
  };

  // Refuser le dossier
  const handleRejectDossier = async () => {
    if (!id) return;

    const reason = prompt('Veuillez indiquer la raison du refus :');
    if (!reason || reason.trim() === '') {
      toast.error('Une raison est requise pour refuser le dossier');
      return;
    }

    try {
      const response = await post(`/api/expert/dossier/${id}/reject`, {
        reason: reason.trim()
      });

      if (response.success) {
        toast.success('Dossier refusé');
        navigate('/dashboard/expert');
      } else {
        toast.error(response.message || 'Erreur lors du refus');
      }
    } catch (error: any) {
      console.error('Erreur refus dossier:', error);
      toast.error(error.message || 'Erreur lors du refus du dossier');
    }
  };

  // Calculer le nombre de documents manquants
  const getMissingDocumentsCount = () => {
    if (!cpe?.documents) return 0;
    return cpe.documents.filter(doc => doc.status === 'pending').length;
  };

  // Calculer la progression
  const getProgress = () => {
    if (!cpe?.documents || cpe.documents.length === 0) return 0;
    const approved = cpe.documents.filter(doc => doc.status === 'approved').length;
    return Math.round((approved / cpe.documents.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (!cpe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dossier introuvable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/expert')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingDocsCount = getMissingDocumentsCount();
  const documentsComplets = missingDocsCount === 0 && cpe.documents && cpe.documents.length > 0;
  const documentsProgress = getProgress();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const normalizePercentage = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return null;
    const numeric = Number(value);
    if (numeric === 0) return 0;
    return numeric > 1 ? numeric / 100 : numeric;
  };

  const clientFeeRaw =
    (cpe as any).client_fee_percentage ??
    (cpe.metadata?.client_fee_percentage as number | undefined) ??
    null;
  const hasClientFee = clientFeeRaw !== null;
  const clientFeeRatio = normalizePercentage(clientFeeRaw) ?? 0;
  const clientFeePercentDisplay = clientFeeRatio * 100;
  const clientFeeAmount = (cpe.montantFinal || 0) * clientFeeRatio;

  const progressValue =
    typeof (cpe as any).progress === 'number'
      ? Math.round((cpe as any).progress)
      : getProgressFromStatut((cpe.statut || '') as ClientProduitStatut);

  const statutLabel = getStatutLabel(cpe.statut);
  const statutBadgeClass = getStatutBadgeClass(cpe.statut);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-16">
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {cpe.ProduitEligible?.nom || 'Produit'}
              </h1>
              <Badge className="bg-blue-100 text-blue-800 text-sm">
                {cpe.ProduitEligible?.type_produit || cpe.ProduitEligible?.categorie || 'Dossier'}
              </Badge>
            </div>
            <p className="text-gray-600">
              Client: {cpe.Client?.company_name || cpe.Client?.name || 'Client inconnu'} · Dossier #{cpe.id?.slice(0, 8) || 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`border ${statutBadgeClass} capitalize`}>
              {statutLabel}
            </Badge>
            {cpe.Client?.id && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/expert/messagerie?client=${cpe.Client.id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messagerie
                </Button>
                <Button 
                  onClick={() => setShowSendEmailModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </>
            )}
          </div>
        </div>

        {/* KPIs Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Euro className="h-4 w-4" />
                Montant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(cpe.montantFinal || 0)}
              </p>
              <p className="text-xs text-gray-500">Éligible</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(clientFeeAmount)}
              </p>
              <p className="text-xs text-gray-500">
                {hasClientFee
                  ? `${clientFeePercentDisplay.toFixed(1)}% du montant validé`
                  : 'Taux non défini'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                🎯 Progrès
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-3xl font-bold text-purple-600">{progressValue}%</p>
                <Badge className={`border ${statutBadgeClass} capitalize`}>
                  {statutLabel}
                </Badge>
              </div>
              <Progress value={progressValue} className="h-2 mt-3" />
              {cpe.metadata?.workflow_stage && (
                <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">
                  Étape : {cpe.metadata.workflow_stage}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bouton Finaliser le rapport d'audit (quand documents_completes) */}
        {id && cpe && cpe.statut === 'documents_completes' && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      📋 Finaliser le rapport d'audit
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tous les documents sont validés. Vous pouvez maintenant finaliser le rapport d'audit avec le montant final et les détails.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowFinaliserRapportModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Finaliser le rapport d'audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section Accepter/Refuser le dossier */}
        {cpe && cpe.expert_pending_id && !cpe.expert_id && user?.database_id === cpe.expert_pending_id && (
          <div className="mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="h-5 w-5" />
                  Nouveau dossier assigné
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Un nouveau dossier vous est assigné</h3>
                  <p className="text-gray-700 mb-4">
                    {cpe.Client?.company_name || cpe.Client?.name} souhaite vous confier un dossier {cpe.ProduitEligible?.nom || 'DFS'} ({formatCurrency(cpe.montantFinal || 0)}). 
                    Souhaitez-vous traiter ce dossier ?
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleAcceptDossier}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accepter
                    </Button>
                    <Button
                      onClick={handleRejectDossier}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations Client Enrichies */}
        {cpe.Client && (
          <div className="mb-8">
            <InfosClientEnrichies
              client={cpe.Client}
              apporteur={cpe.apporteur}
              autresProduitsSimulation={cpe.autresProduitsSimulation}
              potentielTotal={cpe.potentielTotal}
              produitActuel={{
                nom: cpe.ProduitEligible?.nom || 'Produit',
                montant: cpe.montantFinal || 0,
                taux: cpe.tauxFinal ?? 0
              }}
              dossierId={id}
              onRequestDocuments={() => {
                setPreFilledDocuments([]);
                setShowDocRequestForm(true);
              }}
              onRequestDocumentsWithInvalid={(invalidDocs) => {
                setPreFilledDocuments(invalidDocs);
                setShowDocRequestForm(true);
              }}
              documentsCount={documentsCount}
              documentsReloadKey={documentsReloadKey}
            />
          </div>
        )}

        {/* 🚀 ACTIONS EXPERT : Soumission & Résultat Final */}
        {id && cpe && (
          <div className="mb-8">
            <ExpertDossierActions
              dossierId={id}
              clientName={cpe.Client?.company_name || cpe.Client?.name}
              montantDemande={cpe.montantFinal || 0}
              statut={cpe.statut}
              onActionCompleted={async () => {
                // Recharger le dossier après action
                try {
                  const response = await get<ClientProduitEligible>(`/api/expert/dossier/${id}`);
                  if (response.success && response.data) {
                    setCPE(response.data);
                    toast.success('✅ Dossier mis à jour avec succès');
                  }
                } catch (error) {
                  console.error('Erreur rechargement:', error);
                }
              }}
            />
          </div>
        )}

        {/* Bouton Demander documents complémentaires (si dossier accepté) */}
        {id && cpe.statut === 'en_cours' && !showDocRequestForm && (
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Documents complémentaires
                    </h3>
                    <p className="text-sm text-gray-600">
                      Demandez au client les documents nécessaires pour l'audit
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowDocRequestForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileSearch className="h-4 w-4 mr-2" />
                    Demander des documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal demande documents complémentaires */}
        {id && showDocRequestForm && (
          <div className="mb-8">
            <ExpertDocumentRequestModal
              dossierId={id}
              preFilledDocuments={preFilledDocuments}
              onSuccess={() => {
                setShowDocRequestForm(false);
                setPreFilledDocuments([]);
                toast.success('Le client a été notifié');
                
                // Forcer rechargement de l'onglet Documents
                setDocumentsReloadKey(prev => prev + 1);
                
                // Recharger le dossier
                const loadCPE = async () => {
                  try {
                    const response = await get<ClientProduitEligible>(`/api/expert/dossier/${id}`);
                    if (response.success && response.data) {
                      setCPE(response.data);
                    }
                  } catch (error) {
                    console.error('Erreur rechargement:', error);
                  }
                };
                loadCPE();
              }}
              onCancel={() => {
                setShowDocRequestForm(false);
                setPreFilledDocuments([]);
              }}
            />
          </div>
        )}

        {/* ÉTAPE 1 : Validation Éligibilité */}
        {cpe.metadata?.validation_state === 'pending_expert_validation' && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="h-5 w-5" />
                Éligibilité à Valider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Données d'éligibilité</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Montant estimé</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(cpe.montantFinal || 0).toLocaleString()}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Produit</p>
                    <p className="font-semibold">{cpe.ProduitEligible?.nom || 'Produit inconnu'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes Expert</label>
                <Textarea
                  value={expertNotes}
                  onChange={(e) => setExpertNotes(e.target.value)}
                  placeholder="Vos observations sur l'éligibilité..."
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => handleValidateEligibility(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider l'éligibilité
                </Button>
                <Button
                  onClick={() => handleValidateEligibility(false)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 2 : Documents Manquants */}
        {cpe.statut === 'en_cours' && !documentsComplets && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-900">
                  <FileText className="h-5 w-5" />
                  Gestion des Documents
                </div>
                <Badge className="bg-yellow-600 text-white">
                  {missingDocsCount} document(s) manquant(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progression */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progression</span>
                  <span className="text-sm font-medium">{documentsProgress}%</span>
                </div>
                <Progress value={documentsProgress} className="h-2" />
              </div>

              {/* Liste des documents */}
              <div className="space-y-3">
                {cpe.documents && cpe.documents.length > 0 ? (
                  cpe.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {doc.status === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : doc.status === 'rejected' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type}</p>
                        </div>
                      </div>
                      {doc.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucun document soumis</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleRequestDocuments}
                  className="flex-1"
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Demander documents manquants
                </Button>
                <Button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  variant="outline"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="ml-2">Sauvegarder notes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 3 : Étude Approfondie */}
        {cpe.statut === 'en_cours' && documentsComplets && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                Étude Technique Approfondie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analyse */}
              <div className="bg-white p-6 rounded-lg space-y-4">
                <h3 className="font-semibold mb-4">Analyse Technique</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Documents complets</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Oui</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Montant estimé</p>
                    <p className="text-xl font-bold text-green-600 mt-1">
                      {(cpe.montantFinal || 0).toLocaleString()}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission expert (10%)</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      {((cpe.montantFinal || 0) * 0.1).toLocaleString()}€
                    </p>
                  </div>
                </div>
              </div>

              {/* Rapport Expert */}
              <div>
                <label className="block text-sm font-medium mb-2">Rapport Expert</label>
                <Textarea
                  value={expertNotes}
                  onChange={(e) => setExpertNotes(e.target.value)}
                  placeholder="Rédigez votre analyse technique détaillée..."
                  rows={8}
                  className="w-full"
                />
              </div>

              {/* Recommandation */}
              <div>
                <label className="block text-sm font-medium mb-2">Recommandation</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setRecommendation('favorable')}
                    variant={recommendation === 'favorable' ? 'default' : 'outline'}
                    className={recommendation === 'favorable' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Favorable
                  </Button>
                  <Button
                    onClick={() => setRecommendation('defavorable')}
                    variant={recommendation === 'defavorable' ? 'destructive' : 'outline'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Défavorable
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="ml-2">Sauvegarder brouillon</span>
                </Button>
                <Button
                  onClick={handleSendReport}
                  disabled={!recommendation}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer rapport au client
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 4 : Terminé */}
        {cpe.statut === 'termine' && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                Dossier Finalisé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Résumé Final</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Montant récupéré</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(cpe.montantFinal || 0).toLocaleString()}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission expert</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((cpe.montantFinal || 0) * 0.1).toLocaleString()}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durée traitement</p>
                    <p className="text-xl font-semibold">
                      {Math.floor((new Date(cpe.updated_at).getTime() - new Date(cpe.created_at).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Finalisé le</p>
                    <p className="text-xl font-semibold">
                      {new Date(cpe.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes finales */}
              {cpe.notes && (
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">Notes Expert</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{cpe.notes}</p>
                </div>
              )}

              {/* Documents */}
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Documents</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger rapport final
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger facture
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de révision d'audit */}
      {cpe && cpe.statut === 'audit_rejected_by_client' && (
        <ReviseAuditModal
          isOpen={showReviseModal}
          onClose={() => {
            setShowReviseModal(false);
            navigate(`/expert/dossier/${id}`);
          }}
          dossierId={id || ''}
          currentMontant={cpe.montantFinal || 0}
          currentNotes={(cpe.metadata as any)?.audit_result?.notes || ''}
          rejectionReason={(cpe.metadata as any)?.client_validation?.reason || ''}
          onSuccess={() => {
            // Recharger les données du dossier
            const loadCPE = async () => {
              if (!id) return;
              try {
                const response = await get<ClientProduitEligible>(`/api/expert/dossier/${id}`);
                if (response.success && response.data) {
                  setCPE(response.data);
                }
              } catch (error) {
                console.error('Erreur rechargement CPE:', error);
              }
            };
            loadCPE();
          }}
        />
      )}

      {/* Modal Finaliser le rapport d'audit */}
      {id && cpe && (
        <FinaliserRapportAuditModal
          isOpen={showFinaliserRapportModal}
          onClose={() => setShowFinaliserRapportModal(false)}
          dossierId={id}
          currentMontant={cpe.montantFinal || 0}
          onSuccess={() => {
            // Recharger les données du dossier
            const loadCPE = async () => {
              if (!id) return;
              try {
                const response = await get<ClientProduitEligible>(`/api/expert/dossier/${id}`);
                if (response.success && response.data) {
                  setCPE(response.data);
                  toast.success('✅ Rapport d\'audit finalisé avec succès');
                }
              } catch (error) {
                console.error('Erreur rechargement CPE:', error);
              }
            };
            loadCPE();
          }}
        />
      )}

      {/* Modal d'envoi d'email */}
      {cpe && (
        <SendClientEmailModal
          isOpen={showSendEmailModal}
          onClose={() => setShowSendEmailModal(false)}
          clientId={cpe.Client.id}
          clientName={cpe.Client.first_name && cpe.Client.last_name
            ? `${cpe.Client.first_name} ${cpe.Client.last_name}`
            : cpe.Client.name || cpe.Client.company_name}
          clientCompany={cpe.Client.company_name}
          clientProduitId={cpe.id}
          produitName={cpe.ProduitEligible?.nom}
          onEmailSent={() => {
            // Recharger les données si nécessaire
          }}
        />
      )}
    </div>
  );
}
