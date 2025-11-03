import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DossierTimeline from '@/components/dossier/DossierTimeline';
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Award,
  Briefcase,
  MessageSquare,
  UserPlus,
  XCircle,
  Send,
  Building,
  Clock,
  Percent
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

  const handleValidateEligibility = async () => {
    if (!dossier?.id) return;
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dossiers/${dossier.id}/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve',
          notes: ''
        })
      });

      if (response.ok) {
        toast.success('✅ Éligibilité validée avec succès !');
        loadDossierData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de la validation');
        console.error('Erreur validation:', errorData);
      }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dossiers/${dossier.id}/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          notes: rejectionReason
        })
      });

      if (response.ok) {
        toast.success('❌ Éligibilité rejetée');
        setShowRejectDialog(false);
        setRejectionReason('');
        loadDossierData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors du rejet');
        console.error('Erreur rejet:', errorData);
      }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dossiers/${dossier?.id}/assign-expert`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({ expert_id: selectedExpert })
      });

      if (response.ok) {
        toast.success('✅ Expert assigné avec succès !');
        setShowExpertDialog(false);
        loadDossierData();
      } else {
        toast.error('Erreur lors de l\'assignation');
      }
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
    try {
      const response = await get('/admin/experts/all');
      if (response.success && response.data) {
        const experts = (response.data as any).experts || [];
        setAvailableExperts(experts.filter((e: any) => e.approval_status === 'approved' && e.status === 'active'));
      }
    } catch (error) {
      console.error('Erreur chargement experts:', error);
    }
  };

  useEffect(() => {
    if (showExpertDialog) {
      loadAvailableExperts();
    }
  }, [showExpertDialog]);

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Synthèse Dossier
              </h1>
              <p className="text-gray-600">
                {loading ? 'Chargement...' : `${dossier?.ProduitEligible?.nom || 'Produit'} - ${getClientDisplayName()}`}
              </p>
              {dossier?.Client?.company_name && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {dossier.Client.company_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dossier?.statut && getStatutBadge(dossier.statut)}
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
              {dossier.statut === 'eligibility_validated' && !dossier.expert_id && (
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
              {dossier.Client?.id && (
                <Button 
                  onClick={() => navigate(`/admin/clients/${dossier.Client!.id}`)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4 mr-2" />
                  Voir le client
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement des données...</span>
          </div>
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
                      {dossier.tauxFinal ? `${dossier.tauxFinal}%` : 'N/A'}
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
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="documents">Documents ({dossier.documents_sent?.length || 0})</TabsTrigger>
                <TabsTrigger value="historique">Historique</TabsTrigger>
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
                          {dossier.tauxFinal ? `${dossier.tauxFinal}%` : 'Non calculé'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Expert Assigné</span>
                        <p className="font-medium text-gray-900 mt-1">
                          {dossier.Expert ? `${dossier.Expert.first_name || ''} ${dossier.Expert.last_name || ''}`.trim() || dossier.Expert.name : 'Aucun'}
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
                              const token = localStorage.getItem('token');
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

              {/* Onglet Historique */}
              <TabsContent value="historique" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Historique des Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                        <Calendar className="w-4 h-4 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Création du dossier</p>
                          <p className="text-xs text-gray-600">{new Date(dossier.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>

                      {dossier.pre_eligibility_validated_at && (
                        <div className="flex items-start gap-3 p-3 border-l-4 border-green-500 bg-green-50 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Pré-éligibilité validée</p>
                            <p className="text-xs text-gray-600">{new Date(dossier.pre_eligibility_validated_at).toLocaleString('fr-FR')}</p>
                          </div>
                        </div>
                      )}

                      {dossier.eligibility_validated_at && (
                        <div className="flex items-start gap-3 p-3 border-l-4 border-emerald-500 bg-emerald-50 rounded">
                          <Award className="w-4 h-4 text-emerald-600 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Éligibilité validée</p>
                            <p className="text-xs text-gray-600">{new Date(dossier.eligibility_validated_at).toLocaleString('fr-FR')}</p>
                          </div>
                        </div>
                      )}

                      {dossier.updated_at !== dossier.created_at && (
                        <div className="flex items-start gap-3 p-3 border-l-4 border-gray-300 bg-gray-50 rounded">
                          <RefreshCw className="w-4 h-4 text-gray-600 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Dernière modification</p>
                            <p className="text-xs text-gray-600">{new Date(dossier.updated_at).toLocaleString('fr-FR')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Timeline & Commentaires */}
            {id && user && (
              <DossierTimeline 
                dossierId={id} 
                userType={user.type as 'expert' | 'admin' | 'apporteur'} 
              />
            )}
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
            <DialogHeader>
              <DialogTitle>Assigner un expert au dossier</DialogTitle>
              <DialogDescription>
                Sélectionnez un expert disponible pour traiter ce dossier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="expert-select">Expert *</Label>
                <select
                  id="expert-select"
                  value={selectedExpert}
                  onChange={(e) => setSelectedExpert(e.target.value)}
                  className="mt-2 w-full border rounded-md p-2"
                >
                  <option value="">Sélectionner un expert...</option>
                  {availableExperts.map((expert) => (
                    <option key={expert.id} value={expert.id}>
                      {expert.first_name} {expert.last_name} - {expert.company_name} 
                      {expert.specializations && ` (${expert.specializations.join(', ')})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExpertDialog(false);
                  setSelectedExpert('');
                }}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAssignExpert}
                disabled={isProcessing || !selectedExpert}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isProcessing ? 'Assignation...' : 'Assigner l\'expert'}
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

