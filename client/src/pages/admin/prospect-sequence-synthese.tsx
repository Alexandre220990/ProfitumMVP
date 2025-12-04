import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { config } from "@/config/env";
import { getSupabaseToken } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { 
  Mail, 
  User, 
  Building2, 
  ArrowLeft,
  Edit2,
  Pause,
  Plus,
  RefreshCw
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import ProspectReportSection from "@/components/admin/prospection/ProspectReportSection";

interface Prospect {
  id: string;
  email: string;
  email_validity: 'valid' | 'risky' | 'invalid' | null;
  firstname: string | null;
  lastname: string | null;
  company_name: string | null;
  siren: string | null;
  enrichment_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  ai_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  emailing_status: 'pending' | 'queued' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
  score_priority: number;
}

interface ScheduledEmail {
  id: string;
  prospect_id: string;
  sequence_id: string | null;
  step_number: number;
  subject: string;
  body: string;
  scheduled_for: string;
  status: 'scheduled' | 'sent' | 'cancelled' | 'paused';
  cancelled_reason: string | null;
  delay_days_override: number | null;
  sent_at: string | null;
  prospect_email_id: string | null;
}

interface ProspectEmail {
  id: string;
  prospect_id: string;
  step: number;
  subject: string;
  body: string;
  sent_at: string | null;
  opened: boolean;
  opened_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  replied: boolean;
  replied_at: string | null;
  bounced: boolean;
  unsubscribed: boolean;
}

export default function ProspectSequenceSynthese() {
  const { prospectId } = useParams<{ prospectId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [prospectEmails, setProspectEmails] = useState<ProspectEmail[]>([]);
  const [isPausingSequence, setIsPausingSequence] = useState(false);
  const [showEditSequenceModal, setShowEditSequenceModal] = useState(false);
  const [editingDelayId, setEditingDelayId] = useState<string | null>(null);
  const [delayValue, setDelayValue] = useState<number>(0);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [subjectValue, setSubjectValue] = useState<string>("");
  const [dateValue, setDateValue] = useState<string>("");

  useEffect(() => {
    if (prospectId) {
      loadProspectData();
    }
  }, [prospectId]);

  const loadProspectData = async () => {
    if (!prospectId) return;
    
    setLoading(true);
    try {
      const token = await getSupabaseToken();
      
      // Charger le prospect
      const prospectResponse = await fetch(`${config.API_URL}/api/prospects/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const prospectResult = await prospectResponse.json();
      
      if (prospectResult.success && prospectResult.data) {
        setProspect(prospectResult.data);
      } else {
        toast.error('Prospect non trouvé');
        navigate('/admin/prospection?tab=scheduled-sequences');
        return;
      }

      // Charger les emails programmés
      await fetchScheduledEmails();
      
      // Charger l'historique des emails
      await fetchProspectEmails();
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledEmails = async () => {
    if (!prospectId) return;
    
    try {
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/scheduled-emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setScheduledEmails(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement emails programmés:', error);
    }
  };

  const fetchProspectEmails = async () => {
    if (!prospectId) return;
    
    try {
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setProspectEmails(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement historique emails:', error);
    }
  };

  const handlePauseSequence = async () => {
    if (!prospectId) return;
    
    if (!confirm('Voulez-vous suspendre cette séquence ? Les emails programmés seront mis en pause.')) {
      return;
    }

    try {
      setIsPausingSequence(true);
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/pause-sequence`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Séquence suspendue (${result.data.updated_count} email(s) mis en pause)`);
        await fetchScheduledEmails();
      } else {
        toast.error(result.error || 'Erreur lors de la suspension');
      }
    } catch (error: any) {
      console.error('Erreur suspension séquence:', error);
      toast.error('Erreur lors de la suspension de la séquence');
    } finally {
      setIsPausingSequence(false);
    }
  };

  const handleResumeSequence = async () => {
    if (!prospectId) return;
    
    try {
      setIsPausingSequence(true);
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/resume-sequence`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Séquence reprise (${result.data.updated_count} email(s) réactivé(s))`);
        await fetchScheduledEmails();
      } else {
        toast.error(result.error || 'Erreur lors de la reprise');
      }
    } catch (error: any) {
      console.error('Erreur reprise séquence:', error);
      toast.error('Erreur lors de la reprise de la séquence');
    } finally {
      setIsPausingSequence(false);
    }
  };

  const handleOpenEditSequenceModal = async () => {
    if (!prospectId) return;
    
    try {
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/scheduled-emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        const unsentEmails = (result.data || []).filter((email: ScheduledEmail) => email.status !== 'sent');
        if (unsentEmails.length === 0) {
          toast.info('Tous les emails de cette séquence ont déjà été envoyés');
          return;
        }
        setShowEditSequenceModal(true);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des emails');
      }
    } catch (error: any) {
      console.error('Erreur chargement emails:', error);
      toast.error('Erreur lors du chargement des emails');
    }
  };

  const updateEmailDelay = async (emailId: string, delayDays: number) => {
    try {
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-emails/${emailId}/delay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ delay_days: delayDays })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Délai mis à jour avec succès');
        await fetchScheduledEmails();
        setEditingDelayId(null);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour délai:', error);
      toast.error('Erreur lors de la mise à jour du délai');
    }
  };

  const updateEmailSubjectAndDate = async (emailId: string, subject?: string, scheduledFor?: string) => {
    try {
      const token = await getSupabaseToken();
      
      const body: any = {};
      if (subject !== undefined) body.subject = subject;
      if (scheduledFor !== undefined) {
        // Convertir la date datetime-local (format "YYYY-MM-DDTHH:mm") en ISO
        // new Date() interprète la chaîne comme étant dans le fuseau horaire local
        body.scheduled_for = new Date(scheduledFor).toISOString();
      }

      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-emails/${emailId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Email mis à jour avec succès');
        await fetchScheduledEmails();
        setEditingSubjectId(null);
        setEditingDateId(null);
        setSubjectValue("");
        setDateValue("");
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour email:', error);
      toast.error('Erreur lors de la mise à jour de l\'email');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      'pending': { label: '⏳ En attente', className: 'bg-yellow-100 text-yellow-800' },
      'in_progress': { label: '🔄 En cours', className: 'bg-blue-100 text-blue-800' },
      'completed': { label: '✅ Complété', className: 'bg-green-100 text-green-800' },
      'failed': { label: '❌ Échec', className: 'bg-red-100 text-red-800' },
      'queued': { label: '📬 En file', className: 'bg-purple-100 text-purple-800' },
      'sent': { label: '📧 Envoyé', className: 'bg-green-100 text-green-800' },
      'opened': { label: '👁️ Ouvert', className: 'bg-indigo-100 text-indigo-800' },
      'clicked': { label: '👆 Cliqué', className: 'bg-teal-100 text-teal-800' },
      'replied': { label: '💬 Répondu', className: 'bg-emerald-100 text-emerald-800' },
      'bounced': { label: '📉 Bounced', className: 'bg-red-100 text-red-800' },
      'unsubscribed': { label: '🚫 Désabonné', className: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const hasPausedEmails = scheduledEmails.some(email => email.status === 'paused');
  const hasScheduledEmails = scheduledEmails.some(email => email.status === 'scheduled');

  if (loading) {
    return <LoadingScreen />;
  }

  if (!prospect) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/prospection?tab=scheduled-sequences')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Synthèse de la séquence</h1>
            <p className="text-gray-500 mt-1">
              {prospect.firstname} {prospect.lastname} - {prospect.company_name || 'Sans entreprise'}
            </p>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/prospection?tab=scheduled-sequences&action=add-sequence&prospectId=${prospectId}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une séquence
          </Button>
          {hasScheduledEmails && (
            <Button
              variant="outline"
              onClick={handleOpenEditSequenceModal}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier la séquence
            </Button>
          )}
          {hasPausedEmails ? (
            <Button
              variant="outline"
              onClick={handleResumeSequence}
              disabled={isPausingSequence}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reprendre
            </Button>
          ) : hasScheduledEmails ? (
            <Button
              variant="outline"
              onClick={handlePauseSequence}
              disabled={isPausingSequence}
            >
              <Pause className="h-4 w-4 mr-2" />
              Suspendre
            </Button>
          ) : null}
        </div>
      </div>

      {/* Informations du prospect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations du prospect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Email:</span>
                <span>{prospect.email}</span>
                {prospect.email_validity === 'valid' && (
                  <Badge className="bg-green-100 text-green-800 text-xs">✓ Valid</Badge>
                )}
              </div>
              {(prospect.firstname || prospect.lastname) && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Contact:</span>
                  <span>{prospect.firstname} {prospect.lastname}</span>
                </div>
              )}
            </div>
            <div>
              {prospect.company_name && (
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Entreprise:</span>
                  <span>{prospect.company_name}</span>
                </div>
              )}
              {prospect.siren && (
                <div className="text-sm text-gray-500">SIREN: {prospect.siren}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Enrichissement:</span>
              {getStatusBadge(prospect.enrichment_status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">IA:</span>
              {getStatusBadge(prospect.ai_status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Emailing:</span>
              {getStatusBadge(prospect.emailing_status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Priorité:</span>
              <span>{prospect.score_priority}/100</span>
              {prospect.score_priority >= 80 && (
                <Badge className="bg-red-100 text-red-800">Haute</Badge>
              )}
              {prospect.score_priority >= 50 && prospect.score_priority < 80 && (
                <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>
              )}
              {prospect.score_priority < 50 && (
                <Badge className="bg-gray-100 text-gray-800">Basse</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emails Programmés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📅 Emails Programmés</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledEmails.length === 0 ? (
            <p className="text-gray-500">Aucun email programmé</p>
          ) : (
            <div className="space-y-3">
              {scheduledEmails.map((scheduled) => (
                <div key={scheduled.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Étape #{scheduled.step_number}</div>
                    <Badge className={
                      scheduled.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      scheduled.status === 'sent' ? 'bg-green-100 text-green-800' :
                      scheduled.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      scheduled.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {scheduled.status === 'scheduled' ? '📅 Programmé' :
                       scheduled.status === 'sent' ? '✅ Envoyé' :
                       scheduled.status === 'cancelled' ? '❌ Annulé' :
                       scheduled.status === 'paused' ? '⏸️ En pause' :
                       scheduled.status}
                    </Badge>
                  </div>

                  {/* Objet du mail */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Objet de l'email</Label>
                    {editingSubjectId === scheduled.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={subjectValue}
                          onChange={(e) => setSubjectValue(e.target.value)}
                          className="flex-1 h-8 text-sm"
                          placeholder="Objet de l'email"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateEmailSubjectAndDate(scheduled.id, subjectValue)}
                          className="h-8"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSubjectId(null);
                            setSubjectValue("");
                          }}
                          className="h-8"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{scheduled.subject}</div>
                        {scheduled.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSubjectId(scheduled.id);
                              setSubjectValue(scheduled.subject);
                            }}
                            className="h-7 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date d'envoi */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Date d'envoi programmée</Label>
                    {editingDateId === scheduled.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="datetime-local"
                          value={dateValue}
                          onChange={(e) => setDateValue(e.target.value)}
                          className="flex-1 h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateEmailSubjectAndDate(scheduled.id, undefined, dateValue)}
                          className="h-8"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDateId(null);
                            setDateValue("");
                          }}
                          className="h-8"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(scheduled.scheduled_for).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {scheduled.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDateId(scheduled.id);
                              // Convertir la date ISO en format datetime-local
                              const date = new Date(scheduled.scheduled_for);
                              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              setDateValue(localDate.toISOString().slice(0, 16));
                            }}
                            className="h-7 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Délai avant envoi */}
                  {scheduled.status === 'scheduled' && (
                    <div className="space-y-1 pt-2 border-t">
                      <Label className="text-xs font-medium text-gray-600">
                        Délai avant envoi (par rapport à l'étape précédente)
                      </Label>
                      {editingDelayId === scheduled.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={delayValue}
                            onChange={(e) => setDelayValue(parseInt(e.target.value) || 0)}
                            className="w-24 h-8 text-sm"
                            min="0"
                            placeholder="Jours"
                          />
                          <span className="text-xs text-gray-500">jour(s)</span>
                          <Button
                            size="sm"
                            onClick={() => updateEmailDelay(scheduled.id, delayValue)}
                            className="h-8"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDelayId(null);
                              setDelayValue(0);
                            }}
                            className="h-8"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {scheduled.delay_days_override !== null && scheduled.delay_days_override !== undefined
                              ? `${scheduled.delay_days_override} jour(s)`
                              : 'Délai par défaut de la séquence'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDelayId(scheduled.id);
                              setDelayValue(scheduled.delay_days_override || 0);
                            }}
                            className="h-7 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {scheduled.cancelled_reason && (
                    <div className="text-xs text-red-600 mt-2">
                      Raison: {scheduled.cancelled_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📬 Historique Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {prospectEmails.length === 0 ? (
            <p className="text-gray-500">Aucun email envoyé</p>
          ) : (
            <div className="space-y-4">
              {prospectEmails.map((email) => (
                <div key={email.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Email #{email.step}</div>
                    {email.sent_at && (
                      <div className="text-sm text-gray-500">
                        Envoyé le {new Date(email.sent_at).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium mb-1">{email.subject}</div>
                  <div className="flex gap-2 mt-2">
                    {email.opened && (
                      <Badge className="bg-purple-100 text-purple-800">
                        👁️ Ouvert {email.opened_at && `(${new Date(email.opened_at).toLocaleDateString('fr-FR')})`}
                      </Badge>
                    )}
                    {email.clicked && (
                      <Badge className="bg-indigo-100 text-indigo-800">
                        👆 Cliqué {email.clicked_at && `(${new Date(email.clicked_at).toLocaleDateString('fr-FR')})`}
                      </Badge>
                    )}
                    {email.replied && (
                      <Badge className="bg-green-100 text-green-800">
                        💬 Répondu {email.replied_at && `(${new Date(email.replied_at).toLocaleDateString('fr-FR')})`}
                      </Badge>
                    )}
                    {email.bounced && (
                      <Badge className="bg-red-100 text-red-800">📉 Bounced</Badge>
                    )}
                    {email.unsubscribed && (
                      <Badge className="bg-red-100 text-red-800">🚫 Désabonné</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Rapport Prospect */}
      {prospect && <ProspectReportSection prospectId={prospect.id} />}

      {/* Modal Modifier Séquence */}
      <Dialog open={showEditSequenceModal} onOpenChange={setShowEditSequenceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la séquence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Pour modifier la séquence, veuillez retourner à la liste et utiliser le bouton "Modifier" depuis le tableau.
            </p>
            <Button
              onClick={() => {
                setShowEditSequenceModal(false);
                navigate('/admin/prospection?tab=scheduled-sequences');
              }}
            >
              Retour à la liste
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

