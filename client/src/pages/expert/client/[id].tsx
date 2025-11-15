import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { get, post, put } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import InfosClientEnrichies from '@/components/dossier/InfosClientEnrichies';
import {
  Loader2,
  ArrowLeft,
  Briefcase,
  Euro,
  TrendingUp,
  CheckCircle,
  Clock,
  Target,
  FileText,
  Download,
  Eye,
  Upload,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { config } from '@/config';

// ============================================================================
// TYPES
// ============================================================================

interface ClientData {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone_number?: string;
  siren?: string;
  chiffreAffaires?: number;
  revenuAnnuel?: number;
  secteurActivite?: string;
  nombreEmployes?: number;
  ancienneteEntreprise?: number;
  typeProjet?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  website?: string;
  decision_maker_position?: string;
  qualification_score?: number;
  interest_level?: string;
  budget_range?: string;
  timeline?: string;
  source?: string;
  statut?: string;
  is_active?: boolean;
  dateCreation?: string;
  derniereConnexion?: string;
  first_simulation_at?: string;
  first_login?: boolean;
  expert_contacted_at?: string;
  converted_at?: string;
  last_activity_at?: string;
  notes?: string;
  admin_notes?: string;
  last_admin_contact?: string;
  simulationId?: number;
  apporteur_id?: string;
}

interface Dossier {
  id: string;
  produitId: string;
  statut: string;
  metadata?: any;
  montantFinal?: number;
  tauxFinal?: number;
  priorite?: number;
  current_step?: number;
  progress?: number;
  created_at: string;
  updated_at: string;
  ProduitEligible?: {
    id: string;
    nom: string;
    description: string;
    categorie: string;
  };
}

interface ApporteurData {
  id: string;
  company_name: string;
  name?: string;
  email: string;
  phone_number?: string;
  commission_rate?: number;
}

interface ClientStats {
  totalDossiers: number;
  dossiersEligibles: number;
  dossiersEnCours: number;
  dossiersTermines: number;
  montantTotal: number;
  montantTermine: number;
  commissionPotentielle: number;
}

interface ClientSyntheseData {
  client: ClientData;
  apporteur?: ApporteurData | null;
  dossiers: Dossier[];
  stats: ClientStats;
}

interface ClientDocumentHistoryEntry {
  action?: string;
  by?: string;
  at?: string;
  comment?: string;
  details?: string;
}

interface ClientDocumentItem {
  id: string;
  dossierId: string;
  clientId: string;
  produitId?: string;
  filename: string;
  documentType?: string | null;
  size?: number | null;
  mimeType?: string | null;
  uploadedAt: string;
  updatedAt?: string;
  validationStatus: string;
  status: string;
  rejectionReason?: string | null;
  workflowStep?: string | null;
  uploadedBy?: string;
  history: ClientDocumentHistoryEntry[];
  actions: {
    view: string;
    validate: string;
    reject: string;
  };
  canValidate: boolean;
  canReject: boolean;
}

interface ClientDossierDocumentsGroup {
  dossierId: string;
  clientId: string;
  produitId: string;
  productName: string;
  productCategory?: string;
  clientName?: string | null;
  statut: string;
  normalizedStatut: string;
  updatedAt: string;
  metrics: {
    total: number;
    validated: number;
    pending: number;
    rejected: number;
  };
  documents: ClientDocumentItem[];
  actions: {
    canAccept: boolean;
    canReject: boolean;
    canUpload: boolean;
    acceptEndpoint: string;
    rejectEndpoint: string;
    requestDocumentsEndpoint: string;
    uploadEndpoint: string;
    bulkDownloadUrl: string;
    dossierUrl: string;
  };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ExpertClientSynthese() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientSyntheseData | null>(null);
  const [documentsOverview, setDocumentsOverview] = useState<ClientDossierDocumentsGroup[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentActionId, setDocumentActionId] = useState<string | null>(null);
  const [dossierActionId, setDossierActionId] = useState<string | null>(null);
  const [uploadingDossierId, setUploadingDossierId] = useState<string | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchClientData = useCallback(async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const response = await get<ClientSyntheseData>(`/api/expert/client/${id}`);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error('Erreur lors du chargement des données client');
      }
    } catch (error) {
      console.error('Erreur récupération client:', error);
      toast.error('Erreur lors du chargement du client');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const fetchClientDocuments = useCallback(async () => {
    if (!id) return;

    try {
      setDocumentsLoading(true);
      const response = await get<ClientDossierDocumentsGroup[]>(`/api/expert/client/${id}/documents`);

      if (response.success && Array.isArray(response.data)) {
        setDocumentsOverview(response.data);
      } else {
        setDocumentsOverview([]);
      }
    } catch (error) {
      console.error('Erreur récupération documents client:', error);
      toast.error('Impossible de charger les documents du client');
      setDocumentsOverview([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClientDocuments();
  }, [fetchClientDocuments]);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '0 o';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  };

  const getDocumentBadgeVariant = (status: string) => {
    switch (status) {
      case 'validated':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  };

  const buildAuthorizedRequest = async (url: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
    if (!token) {
      throw new Error('Session expirée, veuillez vous reconnecter');
    }

    const response = await fetch(`${config.API_URL}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const { status } = response;
      throw new Error(`Erreur HTTP ${status}`);
    }

    return response.blob();
  };

  const handleViewDocument = async (doc: ClientDocumentItem) => {
    try {
      setDocumentActionId(doc.id);
      toast.info('Ouverture du document...');
      const blob = await buildAuthorizedRequest(doc.actions.view);
      const blobUrl = URL.createObjectURL(blob);
      const previewWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!previewWindow) {
        toast.error('Popup bloquée. Veuillez autoriser les popups pour visualiser le document.');
        URL.revokeObjectURL(blobUrl);
        return;
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      toast.success('Document ouvert dans un nouvel onglet');
    } catch (error: any) {
      console.error('Erreur ouverture document:', error);
      toast.error(error?.message || 'Impossible d\'ouvrir le document');
    } finally {
      setDocumentActionId(null);
    }
  };

  const handleDownloadDocument = async (doc: ClientDocumentItem) => {
    try {
      setDocumentActionId(doc.id);
      toast.info('Téléchargement en cours...');
      const blob = await buildAuthorizedRequest(doc.actions.view);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success('Document téléchargé');
    } catch (error: any) {
      console.error('Erreur téléchargement document:', error);
      toast.error(error?.message || 'Téléchargement impossible');
    } finally {
      setDocumentActionId(null);
    }
  };

  const handleValidateDocument = async (doc: ClientDocumentItem) => {
    try {
      setDocumentActionId(doc.id);
      const response = await put(doc.actions.validate, {});
      if (response.success) {
        toast.success('Document validé');
        await fetchClientDocuments();
        await fetchClientData();
      } else {
        toast.error(response.message || 'Validation impossible');
      }
    } catch (error) {
      console.error('Erreur validation document:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setDocumentActionId(null);
    }
  };

  const handleRejectDocument = async (doc: ClientDocumentItem) => {
    const reason = window.prompt('Motif du rejet du document ?', doc.rejectionReason || '');
    if (!reason) {
      toast.info('Rejet annulé');
      return;
    }
    try {
      setDocumentActionId(doc.id);
      const response = await put(doc.actions.reject, { reason });
      if (response.success) {
        toast.success('Document rejeté');
        await fetchClientDocuments();
        await fetchClientData();
      } else {
        toast.error(response.message || 'Rejet impossible');
      }
    } catch (error) {
      console.error('Erreur rejet document:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setDocumentActionId(null);
    }
  };

  const handleApproveDossier = async (group: ClientDossierDocumentsGroup) => {
    try {
      setDossierActionId(group.dossierId);
      const response = await post(group.actions.acceptEndpoint, {
        validated: true,
        notes: ''
      });
      if (response.success) {
        toast.success('Dossier validé');
        await fetchClientDocuments();
        await fetchClientData();
      } else {
        toast.error(response.message || 'Validation impossible');
      }
    } catch (error) {
      console.error('Erreur validation dossier:', error);
      toast.error('Erreur lors de la validation du dossier');
    } finally {
      setDossierActionId(null);
    }
  };

  const handleRejectDossier = async (group: ClientDossierDocumentsGroup) => {
    const reason = window.prompt('Motif du refus du dossier ?', '');
    if (!reason) {
      toast.info('Refus annulé');
      return;
    }
    try {
      setDossierActionId(group.dossierId);
      const response = await post(group.actions.rejectEndpoint, {
        validated: false,
        notes: reason
      });
      if (response.success) {
        toast.success('Dossier refusé');
        await fetchClientDocuments();
        await fetchClientData();
      } else {
        toast.error(response.message || 'Refus impossible');
      }
    } catch (error) {
      console.error('Erreur refus dossier:', error);
      toast.error('Erreur lors du refus du dossier');
    } finally {
      setDossierActionId(null);
    }
  };

  const handleUploadDocument = async (
    group: ClientDossierDocumentsGroup,
    file: File | null
  ) => {
    if (!file) return;
    try {
      setUploadingDossierId(group.dossierId);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      if (!token) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('client_id', group.clientId);
      formData.append('dossier_id', group.dossierId);
      formData.append('produit_id', group.produitId);
      formData.append('document_type', 'document_expert');
      formData.append('category', 'expert_documents');
      formData.append('description', `Upload expert - ${file.name}`);
      formData.append('user_type', 'expert');
      formData.append(
        'metadata',
        JSON.stringify({
          uploaded_by_label: 'Expert',
          source: 'expert_client_view'
        })
      );

      const response = await fetch(`${config.API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Upload impossible');
      }

      toast.success('Document téléversé');
      if (fileInputsRef.current[group.dossierId]) {
        fileInputsRef.current[group.dossierId]!.value = '';
      }
      await fetchClientDocuments();
      await fetchClientData();
    } catch (error: any) {
      console.error('Erreur upload document:', error);
      toast.error(error?.message || 'Upload impossible');
    } finally {
      setUploadingDossierId(null);
    }
  };

  const triggerUploadPicker = (dossierId: string) => {
    const input = fileInputsRef.current[dossierId];
    if (input) {
      input.click();
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la synthèse client...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Client introuvable</CardTitle>
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

  const { client, apporteur, dossiers, stats } = data;
  const clientName = client.company_name || 
                    (client.first_name && client.last_name ? `${client.first_name} ${client.last_name}` : client.name) || 
                    'Client inconnu';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/expert')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {clientName}
              </h1>
              <p className="text-gray-600">Client #{client.id?.slice(0, 8) || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={client.is_active ? 'bg-green-500' : 'bg-gray-500'}>
              {client.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge variant="outline">
              {client.statut || 'prospect'}
            </Badge>
          </div>
        </div>

        {/* KPIs Statistiques Client */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Total Dossiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalDossiers}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.dossiersEligibles} prospects • {stats.dossiersEnCours} en cours • {stats.dossiersTermines} terminés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.montantTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pipeline complet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Montant Sécurisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(stats.montantTermine)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Dossiers terminés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(stats.commissionPotentielle)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Potentiel 10%</p>
            </CardContent>
          </Card>
        </div>

        {/* Informations Client Enrichies */}
        <div className="mb-8">
          <InfosClientEnrichies
            client={client}
            apporteur={apporteur}
            autresProduitsSimulation={[]}
            potentielTotal={{
              montantTotal: stats.montantTotal,
              commissionExpert: stats.commissionPotentielle,
              nombreProduits: stats.totalDossiers
            }}
            produitActuel={{
              nom: `${stats.totalDossiers} produit(s)`,
              montant: stats.montantTotal,
              taux: 0
            }}
          />
        </div>

        {/* Liste des Dossiers du Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Dossiers du client ({dossiers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dossiers.length > 0 ? (
              <div className="space-y-3">
                {dossiers.map((dossier) => (
                  <div 
                    key={dossier.id}
                    className="p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900">
                            {dossier.ProduitEligible?.nom || 'Produit'}
                          </h4>
                          <Badge className={
                            dossier.statut === 'eligible' ? 'bg-yellow-100 text-yellow-800' :
                            dossier.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                            dossier.statut === 'termine' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {dossier.statut}
                          </Badge>
                          {dossier.priorite && (
                            <Badge variant="outline">
                              Priorité: {dossier.priorite}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {dossier.ProduitEligible?.description || 'Description non disponible'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Créé le {formatDate(dossier.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Màj le {formatDate(dossier.updated_at)}
                          </span>
                          {dossier.progress !== undefined && (
                            <span>Progression: {dossier.progress}%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dossier.montantFinal || 0)}
                        </p>
                        {dossier.tauxFinal && (
                          <p className="text-sm text-gray-600">
                            Taux: {(dossier.tauxFinal * 100).toFixed(2)}%
                          </p>
                        )}
                        <Button size="sm" className="mt-2" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/expert/dossier/${dossier.id}`);
                        }}>
                          Voir dossier
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun dossier pour ce client</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents globaux du client */}
        {(documentsLoading || documentsOverview.length > 0) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Documents du client
                {documentsOverview.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {documentsOverview.reduce((sum, group) => sum + group.metrics.total, 0)} document(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                  Chargement des documents...
                </div>
              ) : documentsOverview.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl bg-slate-50">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>
                    Aucun document trouvé pour ce client. Rendez-vous dans un dossier pour en téléverser.
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {documentsOverview.map(group => (
                    <AccordionItem key={group.dossierId} value={group.dossierId} className="border rounded-xl px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 text-left">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {group.productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Dossier #{group.dossierId.slice(0, 8)} • {group.clientName || clientName}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge className="bg-slate-100 text-slate-800 capitalize">
                              {group.statut}
                            </Badge>
                            <Badge variant="outline">
                              {group.metrics.validated}/{group.metrics.total} validés
                            </Badge>
                            {group.metrics.pending > 0 && (
                              <Badge className="bg-amber-100 text-amber-800">
                                {group.metrics.pending} en attente
                              </Badge>
                            )}
                            {group.metrics.rejected > 0 && (
                              <Badge className="bg-rose-100 text-rose-700">
                                {group.metrics.rejected} rejetés
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-5">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-semibold text-gray-900">{group.metrics.total}</p>
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                <p className="text-xs text-emerald-700">Validés</p>
                                <p className="text-xl font-semibold text-emerald-700">{group.metrics.validated}</p>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <p className="text-xs text-amber-700">En attente</p>
                                <p className="text-xl font-semibold text-amber-700">{group.metrics.pending}</p>
                              </div>
                              <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                <p className="text-xs text-rose-700">Rejetés</p>
                                <p className="text-xl font-semibold text-rose-700">{group.metrics.rejected}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => triggerUploadPicker(group.dossierId)}
                                disabled={!group.actions.canUpload || uploadingDossierId === group.dossierId}
                              >
                                {uploadingDossierId === group.dossierId ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                Ajouter un document
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`${config.API_URL}${group.actions.bulkDownloadUrl}`, '_blank')}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger tout
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={!group.actions.canAccept || dossierActionId === group.dossierId}
                                onClick={() => handleApproveDossier(group)}
                              >
                                {dossierActionId === group.dossierId ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Valider le dossier
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={!group.actions.canReject || dossierActionId === group.dossierId}
                                onClick={() => handleRejectDossier(group)}
                              >
                                {dossierActionId === group.dossierId ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Refuser
                              </Button>
                            </div>
                          </div>

                          <input
                            type="file"
                            className="hidden"
                            ref={el => {
                              fileInputsRef.current[group.dossierId] = el;
                            }}
                            onChange={event => handleUploadDocument(group, event.target.files?.[0] || null)}
                          />

                          {group.documents.length === 0 ? (
                            <div className="text-center text-sm text-gray-500 border rounded-lg py-6 bg-slate-50">
                              Aucun document n'est encore associé à ce dossier.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {group.documents.map(doc => (
                                <div
                                  key={doc.id}
                                  className="border rounded-xl p-3 bg-white shadow-sm flex flex-col gap-2"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="font-semibold text-gray-900 leading-tight">
                                        {doc.filename}
                                      </p>
                                      {doc.documentType &&
                                        doc.documentType.trim().toLowerCase() !== doc.filename.trim().toLowerCase() && (
                                          <p className="text-xs text-gray-500">
                                            {doc.documentType}
                                          </p>
                                      )}
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-1 ${getDocumentBadgeVariant(doc.validationStatus)}`}
                                      >
                                        {doc.validationStatus === 'validated'
                                          ? 'Validé'
                                          : doc.validationStatus === 'rejected'
                                          ? 'Rejeté'
                                          : 'En attente'}
                                      </span>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                      Ajouté {formatRelativeDate(doc.uploadedAt)}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                                    <span>{formatFileSize(doc.size)}</span>
                                    <span>•</span>
                                    <span>{doc.uploadedBy || 'Client'}</span>
                                    {doc.workflowStep && (
                                      <>
                                        <span>•</span>
                                        <span>Étape: {doc.workflowStep}</span>
                                      </>
                                    )}
                                  </div>

                                  {doc.rejectionReason && (
                                    <div className="text-xs text-rose-600 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {doc.rejectionReason}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewDocument(doc)}
                                      disabled={documentActionId === doc.id}
                                    >
                                      {documentActionId === doc.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Eye className="h-4 w-4 mr-2" />
                                      )}
                                      Voir
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadDocument(doc)}
                                      disabled={documentActionId === doc.id}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Télécharger
                                    </Button>
                                    {doc.canValidate && (
                                      <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        disabled={documentActionId === doc.id}
                                        onClick={() => handleValidateDocument(doc)}
                                      >
                                        Valider
                                      </Button>
                                    )}
                                    {doc.canReject && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={documentActionId === doc.id}
                                        onClick={() => handleRejectDocument(doc)}
                                      >
                                        Refuser
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

