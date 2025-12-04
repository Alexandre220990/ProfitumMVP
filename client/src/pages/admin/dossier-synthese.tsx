import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DossierTimeline from '@/components/dossier/DossierTimeline';
import LoadingScreen from '@/components/LoadingScreen';
import {
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Briefcase,
  MessageSquare,
  UserPlus,
  XCircle,
  Send,
  Building,
  Percent,
  UserCheck,
  Edit
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface DossierData {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  progress: number;
  montantFinal?: number;
  tauxFinal?: number;
  documents_sent?: string[];
  expert_id?: string;
  eligibility_validated_at?: string;
  pre_eligibility_validated_at?: string;
  expert_report_status?: string;
  validation_admin_notes?: string;
  created_at: string;
  updated_at: string;
  Client?: {
    id: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description: string;
    categorie?: string;
  };
  Expert?: {
    id: string;
    first_name?: string;
    last_name?: string;
    name: string;
    company_name?: string;
    email: string;
    cabinet_id?: string;
    Cabinet?: {
      id: string;
      name: string;
      siret?: string;
    };
  };
}

const DossierSynthese: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<DossierData | null>(null);

  // Actions rapides
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [availableExperts, setAvailableExperts] = useState<any[]>([]);
  const [selectedExpert, setSelectedExpert] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExpertSelectionDialog, setShowExpertSelectionDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadDossierData();
    }
  }, [id]);

  const loadDossierData = async () => {
    setLoading(true);
    try {
      // Charger les infos du dossier
      const response = await get(`/admin/dossiers/${id}`);
      if (response.success && response.data) {
        setDossier(response.data as DossierData);
      } else {
        toast.error('Dossier non trouvé');
        navigate('/admin/dashboard-optimized');
        return;
      }
    } catch (error) {
      console.error('Erreur chargement dossier:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // ACTIONS RAPIDES
  // ========================================

  const getAuthToken = useCallback(async () => {
    return await getSupabaseToken();
  }, []);

  const handleValidateEligibility = async () => {
    if (!dossier?.id) return;
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/connexion-admin');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dossiers/${dossier.id}/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve',
          notes: ''
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expirée, veuillez vous reconnecter');
          navigate('/connexion-admin');
          return;
        }

        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Erreur lors de la validation');
        console.error('Erreur validation:', errorData || response.statusText);
        return;
      }

      toast.success('✅ Éligibilité validée avec succès !');
      loadDossierData();
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectEligibility = async () => {
    if (!dossier?.id || !rejectionReason.trim()) {
      toast.error('Veuillez indiquer une raison de refus');
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/connexion-admin');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dossiers/${dossier.id}/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          notes: rejectionReason
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expirée, veuillez vous reconnecter');
          navigate('/connexion-admin');
          return;
        }

        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Erreur lors du rejet');
        console.error('Erreur rejet:', errorData || response.statusText);
        return;
      }

      toast.success('❌ Éligibilité rejetée');
      setShowRejectDialog(false);
      setRejectionReason('');
      loadDossierData();
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setIsProcessing(false);
      setRejectionReason('');
    }
  };

  const handleAssignExpert = async () => {
    if (!selectedExpert) {
      toast.error('Veuillez sélectionner un expert');
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/connexion-admin');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dossiers/${dossier?.id}/assign-expert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ expert_id: selectedExpert })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expirée, veuillez vous reconnecter');
          navigate('/connexion-admin');
          return;
        }

        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Erreur lors de l\'assignation');
        console.error('Erreur assignation:', errorData || response.statusText);
        return;
      }

      toast.success('✅ Expert assigné avec succès !');
      setShowExpertDialog(false);
      loadDossierData();
    } catch (error) {
      console.error('Erreur assignation:', error);
      toast.error('Erreur lors de l\'assignation');
    } finally {
      setIsProcessing(false);
      setSelectedExpert('');
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }
    
    setIsProcessing(true);
    try {
      // TODO: Implémenter l'envoi de message via unified-messaging
      toast.success('Message envoyé au client');
      setShowMessageDialog(false);
      setMessageContent('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAvailableExperts = async () => {
    if (!id || !dossier?.produitId) {
      console.error('Impossible de charger les experts : dossier ou produitId manquant');
      return;
    }
    
    try {
      const response = await get(`/admin/dossiers/${id}/available-experts`);
      if (response.success && response.data) {
        const experts = (response.data as any).experts || [];
        setAvailableExperts(experts);
      } else {
        toast.error('Erreur lors du chargement des experts disponibles');
        setAvailableExperts([]);
      }
    } catch (error) {
      console.error('Erreur chargement experts:', error);
      toast.error('Erreur lors du chargement des experts disponibles');
      setAvailableExperts([]);
    }
  };

  useEffect(() => {
    if (showExpertDialog && dossier?.produitId) {
      loadAvailableExperts();
    }
  }, [showExpertDialog, dossier?.produitId]);

  if (!user || user.type !== 'admin') {
    return <Navigate to="/login" />;
  }

  const getClientDisplayName = () => {
    if (!dossier?.Client) return 'N/A';
    return dossier.Client.company_name || 
           `${dossier.Client.first_name || ''} ${dossier.Client.last_name || ''}`.trim() || 
           dossier.Client.email;
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      'pending': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      'documents_uploaded': { label: 'Documents uploadés', className: 'bg-blue-100 text-blue-800' },
      'eligible_confirmed': { label: 'Éligibilité confirmée', className: 'bg-purple-100 text-purple-800' },
      'eligibility_validated': { label: 'Validé', className: 'bg-green-100 text-green-800' },
      'eligibility_rejected': { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
      'in_progress': { label: 'En cours', className: 'bg-indigo-100 text-indigo-800' },
      'validated': { label: 'Finalisé', className: 'bg-emerald-100 text-emerald-800' }
    };
    
    const badge = badges[statut] || { label: statut, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline gap-3 mb-3">
                <h1 className="text-2xl font-semibold text-gray-700">
                  Synthèse Dossier
                </h1>
                {!loading && dossier && (
                  <span className="text-2xl font-bold text-gray-900">
                    {dossier.ProduitEligible?.nom || 'Produit'} - {getClientDisplayName()}
                  </span>
                )}
              </div>
              {dossier?.Client?.company_name && (
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-600" />
                  <p className="text-lg font-semibold text-gray-900">
                    {dossier.Client.company_name}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dossier?.statut && getStatutBadge(dossier.statut)}
              {dossier?.Client?.id && (
                <Button 
                  onClick={() => navigate(`/admin/clients/${dossier.Client!.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Accès rapide au client
                </Button>
              )}
              <Button variant="outline" onClick={loadDossierData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Actions rapides */}
          {dossier && (
            <div className="mt-4 flex flex-wrap gap-3">
              {(dossier.statut === 'documents_uploaded' || dossier.statut === 'eligible_confirmed') && (
                <>
                  <Button 
                    onClick={handleValidateEligibility}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider l'éligibilité
                  </Button>
                  <Button 
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter l'éligibilité
                  </Button>
                </>
              )}
              {!dossier.expert_id && (
                <Button 
                  onClick={() => setShowExpertDialog(true)}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assigner un expert
                </Button>
              )}
              <Button 
                onClick={() => setShowMessageDialog(true)}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message au client
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <LoadingScreen />
        ) : !dossier ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Dossier non trouvé</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900">{dossier.ProduitEligible?.nom || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{dossier.ProduitEligible?.categorie || ''}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Montant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-green-600">
                      {dossier.montantFinal ? `${dossier.montantFinal.toLocaleString('fr-FR')} €` : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    Taux
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-blue-600">
                      {dossier.tauxFinal ? `${(dossier.tauxFinal * 100).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Progression
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-purple-600">{dossier.progress || 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-orange-600">
                      {dossier.documents_sent?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Onglets */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="historique">Timeline</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="documents">Documents ({dossier.documents_sent?.length || 0})</TabsTrigger>
                <TabsTrigger value="expert">Expert assigné</TabsTrigger>
              </TabsList>

              {/* Onglet Détails */}
              <TabsContent value="details" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Informations du Dossier
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ID Dossier</span>
                        <p className="font-medium text-gray-900 mt-1">{dossier.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Produit</span>
                        <p className="font-medium text-gray-900 mt-1">{dossier.ProduitEligible?.nom || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Statut</span>
                        <p className="font-medium mt-1">{getStatutBadge(dossier.statut)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Progression</span>
                        <p className="font-medium text-gray-900 mt-1">{dossier.progress || 0}%</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Montant Final</span>
                        <p className="font-medium text-green-600 mt-1">
                          {dossier.montantFinal ? `${dossier.montantFinal.toLocaleString('fr-FR')} €` : 'Non calculé'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Taux Final</span>
                        <p className="font-medium text-blue-600 mt-1">
                          {dossier.tauxFinal ? `${(dossier.tauxFinal * 100).toFixed(2)}%` : 'Non calculé'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Date de création</span>
                        <p className="font-medium text-gray-900 mt-1">
                          {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {dossier.validation_admin_notes && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Notes admin :</p>
                        <p className="text-sm text-blue-700">{dossier.validation_admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Timeline */}
              <TabsContent value="historique" className="space-y-4 mt-6">
                {id && user && (
                  <DossierTimeline 
                    dossierId={id} 
                    userType={user.type as 'expert' | 'admin' | 'apporteur'}
                    dossierInfo={{
                      client_id: dossier.Client?.id,
                      client_name: getClientDisplayName(),
                      client_company_name: dossier.Client?.company_name,
                      client_phone: (dossier.Client as any)?.phone_number || dossier.Client?.phone,
                      client_email: dossier.Client?.email,
                      produit_name: dossier.ProduitEligible?.nom
                    }}
                  />
                )}
              </TabsContent>

              {/* Onglet Client */}
              <TabsContent value="client" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      Informations Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossier.Client ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nom / Entreprise</span>
                          <p className="font-medium text-gray-900 mt-1">{getClientDisplayName()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Email
                          </span>
                          <p className="font-medium text-gray-900 mt-1">{dossier.Client.email}</p>
                        </div>
                        {dossier.Client.phone && (
                          <div>
                            <span className="text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Téléphone
                            </span>
                            <p className="font-medium text-gray-900 mt-1">{dossier.Client.phone}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">ID Client</span>
                          <p className="font-medium text-gray-900 mt-1">{dossier.Client.id}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucune information client disponible</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Documents */}
              <TabsContent value="documents" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Documents Uploadés ({dossier.documents_sent?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossier.documents_sent && dossier.documents_sent.length > 0 ? (
                      <div className="space-y-2">
                        {dossier.documents_sent.map((doc: any, idx: number) => {
                          const handleViewDocument = async () => {
                            try {
                              const token = await getSupabaseToken();
                              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents-secure/download/${doc.id}`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (!response.ok) {
                                throw new Error('Erreur lors du chargement du document');
                              }
                              
                              const data = await response.json();
                              if (data.success && data.data.signedUrl) {
                                window.open(data.data.signedUrl, '_blank');
                              } else {
                                alert('Impossible d\'accéder au document');
                              }
                            } catch (error) {
                              console.error('Erreur:', error);
                              alert('Erreur lors du chargement du document');
                            }
                          };
                          
                          return (
                          <div key={doc.id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{doc.filename || `Document ${idx + 1}`}</span>
                                <span className="text-xs text-gray-500">{doc.document_type} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleViewDocument}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                          </div>
                        );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Aucun document uploadé</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Expert assigné */}
              <TabsContent value="expert" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                      Expert Assigné
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossier.Expert ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Nom</span>
                            <div className="mt-1">
                              <button
                                onClick={() => navigate(`/admin/experts/${dossier.Expert!.id}`)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {`${dossier.Expert.first_name || ''} ${dossier.Expert.last_name || ''}`.trim() || dossier.Expert.name}
                              </button>
                            </div>
                          </div>
                          {dossier.Expert.email && (
                            <div>
                              <span className="text-gray-600 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Email
                              </span>
                              <p className="font-medium text-gray-900 mt-1">{dossier.Expert.email}</p>
                            </div>
                          )}
                          {dossier.Expert.company_name && (
                            <div>
                              <span className="text-gray-600 flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                Entreprise
                              </span>
                              <p className="font-medium text-gray-900 mt-1">{dossier.Expert.company_name}</p>
                            </div>
                          )}
                          {dossier.Expert.Cabinet && (
                            <div>
                              <span className="text-gray-600">Cabinet</span>
                              <div className="mt-1">
                                <button
                                  onClick={() => navigate(`/admin/cabinets/${dossier.Expert!.Cabinet!.id}`)}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  {dossier.Expert.Cabinet.name}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <Button
                            onClick={() => navigate(`/admin/experts/${dossier.Expert!.id}`)}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir le profil de l'expert
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Aucun expert assigné à ce dossier</p>
                        <Button
                          onClick={() => setShowExpertDialog(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assigner un expert
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Dialog de rejet */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter l'éligibilité</DialogTitle>
              <DialogDescription>
                Veuillez indiquer la raison du refus. Le client sera notifié.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rejection-reason">Raison du refus *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous rejetez l'éligibilité..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectEligibility}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isProcessing ? 'Traitement...' : 'Confirmer le refus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog d'assignation expert */}
        <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Assigner un expert au dossier</DialogTitle>
                  <DialogDescription className="mt-1">
                    Sélectionnez un expert disponible pour traiter ce dossier. Seuls les experts ayant le produit éligible du dossier dans leur catalogue sont affichés.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5 py-4">
              {dossier && dossier.statut !== 'eligibility_validated' && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Avertissement
                      </p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Le dossier n'a pas encore été validé par l'admin (statut actuel: <strong className="font-semibold">{dossier.statut}</strong>). 
                        L'expert sera assigné, mais le client devra toujours compléter les étapes de validation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Expert <span className="text-red-500">*</span>
                </Label>
                
                {/* Bouton pour ouvrir la sélection */}
                {!selectedExpert ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowExpertSelectionDialog(true)}
                    className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sélectionner un expert...
                  </Button>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {(() => {
                              const expert = availableExperts.find(e => e.id === selectedExpert);
                              return expert?.first_name && expert?.last_name 
                                ? `${expert.first_name} ${expert.last_name}` 
                                : expert?.name || expert?.email || 'Expert sélectionné';
                            })()}
                          </h4>
                          {(() => {
                            const expert = availableExperts.find(e => e.id === selectedExpert);
                            return expert?.rating && (
                              <Badge variant="outline" className="text-xs">
                                ⭐ {expert.rating.toFixed(1)}
                              </Badge>
                            );
                          })()}
                        </div>
                        {(() => {
                          const expert = availableExperts.find(e => e.id === selectedExpert);
                          return expert?.company_name && (
                            <p className="text-sm text-gray-700 mb-2">{expert.company_name}</p>
                          );
                        })()}
                        {(() => {
                          const expert = availableExperts.find(e => e.id === selectedExpert);
                          return expert?.specializations && expert.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {expert.specializations.map((spec: string, idx: number) => (
                                <Badge 
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExpertSelectionDialog(true)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {availableExperts.length > 0 && !selectedExpert && (
                  <p className="text-xs text-gray-500">
                    {availableExperts.length} expert{availableExperts.length > 1 ? 's' : ''} disponible{availableExperts.length > 1 ? 's' : ''} pour ce produit
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExpertDialog(false);
                  setSelectedExpert('');
                }}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAssignExpert}
                disabled={isProcessing || !selectedExpert}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-initial"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Assignation...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assigner l'expert
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de sélection d'expert */}
        <Dialog open={showExpertSelectionDialog} onOpenChange={setShowExpertSelectionDialog}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-purple-600" />
                Sélectionner un expert
              </DialogTitle>
              <DialogDescription className="text-base">
                {availableExperts.length} expert{availableExperts.length > 1 ? 's' : ''} disponible{availableExperts.length > 1 ? 's' : ''} pour ce produit
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto py-4 pr-2 -mr-2">
              {availableExperts.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun expert disponible pour ce produit</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableExperts.map((expert) => {
                    const isSelected = selectedExpert === expert.id;
                    const expertName = expert.first_name && expert.last_name 
                      ? `${expert.first_name} ${expert.last_name}` 
                      : expert.name || expert.email;
                    
                    return (
                      <div
                        key={expert.id}
                        onClick={() => {
                          setSelectedExpert(expert.id);
                          setShowExpertSelectionDialog(false);
                        }}
                        className={`group relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg ring-2 ring-purple-200'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        {/* Indicateur de sélection */}
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                              <UserCheck className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {expertName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            {expert.rating && (
                              <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-md">
                                <span className="text-xs font-bold text-yellow-900">⭐ {expert.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Informations */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                                  {expertName}
                                </h3>
                                {expert.company_name && (
                                  <p className="text-sm font-medium text-gray-600 mb-3">
                                    {expert.company_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Spécialisations */}
                            {expert.specializations && expert.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {expert.specializations.map((spec: string, idx: number) => (
                                  <Badge 
                                    key={idx}
                                    variant="secondary"
                                    className={`text-xs px-3 py-1 ${
                                      isSelected
                                        ? 'bg-purple-200 text-purple-800 border-purple-300'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}
                                  >
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Effet hover */}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowExpertSelectionDialog(false)}
                className="w-full sm:w-auto"
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog d'envoi de message */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message au client {getClientDisplayName()}</DialogTitle>
              <DialogDescription>
                Composez votre message. Le client le recevra dans sa messagerie.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="message-content">Message *</Label>
                <Textarea
                  id="message-content"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="mt-2"
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMessageDialog(false);
                  setMessageContent('');
                }}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={isProcessing || !messageContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isProcessing ? 'Envoi...' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default DossierSynthese;

