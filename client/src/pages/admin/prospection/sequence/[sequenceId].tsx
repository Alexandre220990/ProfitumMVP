import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { config } from "@/config/env";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Save,
  Edit2
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

interface Prospect {
  id: string;
  email: string;
  email_validity: 'valid' | 'risky' | 'invalid' | null;
  source: 'google_maps' | 'import_csv' | 'linkedin' | 'manuel';
  created_at: string;
  updated_at: string;
  firstname: string | null;
  lastname: string | null;
  job_title: string | null;
  linkedin_profile: string | null;
  phone_direct: string | null;
  company_name: string | null;
  company_website: string | null;
  siren: string | null;
  adresse: string | null;
  city: string | null;
  postal_code: string | null;
  naf_code: string | null;
  naf_label: string | null;
  employee_range: string | null;
  phone_standard: string | null;
  linkedin_company: string | null;
  enrichment_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  ai_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  emailing_status: 'pending' | 'queued' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
  score_priority: number;
  ai_summary: string | null;
  ai_trigger_points: string | null;
  ai_product_match: Record<string, any> | null;
  ai_email_personalized: string | null;
  metadata: Record<string, any> | null;
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
  email_provider: 'instantly' | 'lemlist' | 'manual' | null;
  created_at: string;
  comment?: string | null;
}

interface ScheduledEmail {
  id: string;
  prospect_id: string;
  step: number;
  subject: string;
  body: string;
  scheduled_for: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  created_at: string;
  comment?: string | null;
}

export default function ProspectSequencePage() {
  const { sequenceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [sentEmails, setSentEmails] = useState<ProspectEmail[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  
  // États pour les commentaires
  const [emailComments, setEmailComments] = useState<Map<string, string>>(new Map());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (user && sequenceId) {
      fetchData();
    }
  }, [user, sequenceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');

      // Récupérer le prospect
      const prospectResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!prospectResponse.ok) {
        throw new Error('Erreur lors du chargement du prospect');
      }

      const prospectResult = await prospectResponse.json();
      setProspect(prospectResult.data);

      // Récupérer les emails envoyés
      const emailsResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (emailsResponse.ok) {
        const emailsResult = await emailsResponse.json();
        setSentEmails(emailsResult.data || []);
        
        // Initialiser les commentaires depuis les emails
        const comments = new Map<string, string>();
        (emailsResult.data || []).forEach((email: ProspectEmail) => {
          if (email.comment) {
            comments.set(email.id, email.comment);
          }
        });
        setEmailComments(comments);
      }

      // Récupérer les emails programmés
      const scheduledResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/scheduled-emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (scheduledResponse.ok) {
        const scheduledResult = await scheduledResponse.json();
        setScheduledEmails(scheduledResult.data || []);
        
        // Initialiser les commentaires depuis les emails programmés
        (scheduledResult.data || []).forEach((email: ScheduledEmail) => {
          if (email.comment) {
            setEmailComments(prev => new Map(prev).set(email.id, email.comment!));
          }
        });
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const saveComment = async (emailId: string, isScheduled: boolean) => {
    try {
      setSavingComment(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      const comment = emailComments.get(emailId) || '';

      const endpoint = isScheduled 
        ? `${config.API_URL}/api/prospects/scheduled-emails/${emailId}/comment`
        : `${config.API_URL}/api/prospects/emails/${emailId}/comment`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde du commentaire');
      }

      toast.success('Commentaire sauvegardé');
      setEditingCommentId(null);
    } catch (error) {
      console.error('Erreur sauvegarde commentaire:', error);
      toast.error('Erreur lors de la sauvegarde du commentaire');
    } finally {
      setSavingComment(false);
    }
  };

  const updateComment = (emailId: string, comment: string) => {
    setEmailComments(prev => {
      const newMap = new Map(prev);
      newMap.set(emailId, comment);
      return newMap;
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!prospect) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Prospect introuvable</p>
            <Button
              onClick={() => navigate('/admin/prospection')}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEmailStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending': { label: 'En attente', className: 'bg-gray-100 text-gray-800' },
      'queued': { label: 'En file', className: 'bg-blue-100 text-blue-800' },
      'sent': { label: 'Envoyé', className: 'bg-green-100 text-green-800' },
      'opened': { label: 'Ouvert', className: 'bg-purple-100 text-purple-800' },
      'clicked': { label: 'Cliqué', className: 'bg-indigo-100 text-indigo-800' },
      'replied': { label: 'Répondu', className: 'bg-emerald-100 text-emerald-800' },
      'bounced': { label: 'Rebondi', className: 'bg-red-100 text-red-800' },
      'unsubscribed': { label: 'Désabonné', className: 'bg-orange-100 text-orange-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/admin/prospection')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Synthèse de la séquence</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Séquence d'emails */}
        <div className="lg:col-span-2 space-y-6">
          {/* Emails envoyés */}
          {sentEmails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Emails envoyés ({sentEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sentEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Étape {email.step}
                          </Badge>
                          {getEmailStatusBadge(
                            email.replied ? 'replied' :
                            email.bounced ? 'bounced' :
                            email.unsubscribed ? 'unsubscribed' :
                            email.clicked ? 'clicked' :
                            email.opened ? 'opened' :
                            'sent'
                          )}
                        </div>
                        <div className="font-medium mb-1">{email.subject}</div>
                        <div className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Envoyé le {new Date(email.sent_at!).toLocaleString('fr-FR', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                        {email.opened_at && (
                          <div className="text-xs text-purple-600 mt-1">
                            👁️ Ouvert le {new Date(email.opened_at).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </div>
                        )}
                        {email.replied_at && (
                          <div className="text-xs text-green-600 mt-1">
                            ✅ Répondu le {new Date(email.replied_at).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section commentaire */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Commentaire
                        </Label>
                        {editingCommentId !== email.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCommentId(email.id)}
                            className="h-6 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            {emailComments.get(email.id) ? 'Modifier' : 'Ajouter'}
                          </Button>
                        )}
                      </div>
                      
                      {editingCommentId === email.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={emailComments.get(email.id) || ''}
                            onChange={(e) => updateComment(email.id, e.target.value)}
                            placeholder="Ajoutez un commentaire sur cet email..."
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveComment(email.id, false)}
                              disabled={savingComment}
                              className="h-7 text-xs"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Sauvegarder
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCommentId(null)}
                              className="h-7 text-xs"
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 min-h-[40px]">
                          {emailComments.get(email.id) || <span className="text-gray-400 italic">Aucun commentaire</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Emails programmés */}
          {scheduledEmails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Emails programmés ({scheduledEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduledEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Étape {email.step}
                          </Badge>
                          <Badge className={
                            email.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            email.status === 'sent' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {email.status === 'scheduled' ? '📅 Programmé' :
                             email.status === 'sent' ? '✅ Envoyé' :
                             '❌ Annulé'}
                          </Badge>
                        </div>
                        <div className="font-medium mb-1">{email.subject}</div>
                        <div className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Programmé pour le {new Date(email.scheduled_for).toLocaleString('fr-FR', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Section commentaire */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Commentaire
                        </Label>
                        {editingCommentId !== email.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCommentId(email.id)}
                            className="h-6 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            {emailComments.get(email.id) ? 'Modifier' : 'Ajouter'}
                          </Button>
                        )}
                      </div>
                      
                      {editingCommentId === email.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={emailComments.get(email.id) || ''}
                            onChange={(e) => updateComment(email.id, e.target.value)}
                            placeholder="Ajoutez un commentaire sur cet email..."
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveComment(email.id, true)}
                              disabled={savingComment}
                              className="h-7 text-xs"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Sauvegarder
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCommentId(null)}
                              className="h-7 text-xs"
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 min-h-[40px]">
                          {emailComments.get(email.id) || <span className="text-gray-400 italic">Aucun commentaire</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Message si aucune séquence */}
          {sentEmails.length === 0 && scheduledEmails.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">Aucune séquence programmée</p>
                <p className="text-sm text-gray-400">
                  Ce prospect n'a pas encore de séquence d'emails programmée
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale - Informations du prospect */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du prospect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Entreprise */}
              {prospect.company_name && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="h-4 w-4" />
                    Entreprise
                  </div>
                  <div className="font-medium">{prospect.company_name}</div>
                  {prospect.company_website && (
                    <a
                      href={prospect.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {prospect.company_website}
                    </a>
                  )}
                </div>
              )}

              <Separator />

              {/* Contact */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4" />
                  Contact
                </div>
                <div>
                  {prospect.firstname || prospect.lastname ? (
                    <div className="font-medium">
                      {prospect.firstname} {prospect.lastname}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Non renseigné</div>
                  )}
                  {prospect.job_title && (
                    <div className="text-sm text-gray-600">{prospect.job_title}</div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Email */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{prospect.email}</span>
                  {prospect.email_validity && (
                    <Badge
                      variant="outline"
                      className={
                        prospect.email_validity === 'valid' ? 'bg-green-50 text-green-700 border-green-200' :
                        prospect.email_validity === 'risky' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {prospect.email_validity === 'valid' ? '✓ Valide' :
                       prospect.email_validity === 'risky' ? '⚠ Risqué' :
                       '✗ Invalide'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Téléphone */}
              {(prospect.phone_direct || prospect.phone_standard) && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Téléphone</div>
                    <div className="text-sm">
                      {prospect.phone_direct || prospect.phone_standard}
                    </div>
                  </div>
                </>
              )}

              {/* Statuts */}
              <Separator />
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Statuts</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Enrichissement:</span>
                    {getEmailStatusBadge(prospect.enrichment_status)}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">IA:</span>
                    {getEmailStatusBadge(prospect.ai_status)}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Emailing:</span>
                    {getEmailStatusBadge(prospect.emailing_status)}
                  </div>
                </div>
              </div>

              {/* Score de priorité */}
              {prospect.score_priority > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Score de priorité</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(prospect.score_priority, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{prospect.score_priority}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

