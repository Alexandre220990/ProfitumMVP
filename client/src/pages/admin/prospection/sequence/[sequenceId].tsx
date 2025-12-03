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

interface ReceivedEmail {
  id: string;
  prospect_id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  snippet: string | null;
  received_at: string;
  is_read: boolean;
  is_replied: boolean;
  replied_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface ConversationItem {
  id: string;
  type: 'sent' | 'received' | 'scheduled';
  date: string;
  subject: string;
  body?: string;
  snippet?: string;
  step?: number;
  status?: string;
  opened?: boolean;
  opened_at?: string | null;
  replied?: boolean;
  replied_at?: string | null;
  clicked?: boolean;
  bounced?: boolean;
  unsubscribed?: boolean;
  from_email?: string;
  from_name?: string | null;
  scheduled_for?: string;
  comment?: string | null;
  prospect_id?: string;
  raw?: ProspectEmail | ReceivedEmail | ScheduledEmail;
}

export default function ProspectSequencePage() {
  const { sequenceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [sentEmails, setSentEmails] = useState<ProspectEmail[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  
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

      // Variables pour stocker les résultats
      let emailsData: ProspectEmail[] = [];
      let scheduledData: ScheduledEmail[] = [];
      let receivedData: ReceivedEmail[] = [];

      // Récupérer les emails envoyés
      const emailsResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (emailsResponse.ok) {
        const emailsResult = await emailsResponse.json();
        emailsData = emailsResult.data || [];
        setSentEmails(emailsData);
        
        // Initialiser les commentaires depuis les emails
        const comments = new Map<string, string>();
        emailsData.forEach((email: ProspectEmail) => {
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
        scheduledData = scheduledResult.data || [];
        setScheduledEmails(scheduledData);
        
        // Initialiser les commentaires depuis les emails programmés
        scheduledData.forEach((email: ScheduledEmail) => {
          if (email.comment) {
            setEmailComments(prev => new Map(prev).set(email.id, email.comment!));
          }
        });
      }

      // Récupérer les emails reçus (réponses du prospect)
      const receivedResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/emails-received`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (receivedResponse.ok) {
        const receivedResult = await receivedResponse.json();
        receivedData = receivedResult.data || [];
        setReceivedEmails(receivedData);
      }

      // Construire la conversation (emails envoyés + réponses reçues)
      buildConversation(emailsData, receivedData, scheduledData);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const buildConversation = (
    sent: ProspectEmail[],
    received: ReceivedEmail[],
    scheduled: ScheduledEmail[]
  ) => {
    const items: ConversationItem[] = [];

    // Ajouter les emails envoyés
    sent.forEach(email => {
      items.push({
        id: email.id,
        type: 'sent',
        date: email.sent_at!,
        subject: email.subject,
        body: email.body,
        step: email.step,
        opened: email.opened,
        opened_at: email.opened_at,
        replied: email.replied,
        replied_at: email.replied_at,
        clicked: email.clicked,
        bounced: email.bounced,
        unsubscribed: email.unsubscribed,
        comment: email.comment,
        prospect_id: email.prospect_id,
        raw: email
      });
    });

    // Ajouter les emails reçus (réponses)
    received.forEach(email => {
      items.push({
        id: email.id,
        type: 'received',
        date: email.received_at,
        subject: email.subject,
        snippet: email.snippet || undefined,
        body: email.body_text || email.body_html || undefined,
        from_email: email.from_email,
        from_name: email.from_name || undefined,
        prospect_id: email.prospect_id,
        raw: email
      });
    });

    // Ajouter les emails programmés
    scheduled.forEach(email => {
      items.push({
        id: email.id,
        type: 'scheduled',
        date: email.scheduled_for,
        subject: email.subject,
        body: email.body,
        step: email.step,
        status: email.status,
        scheduled_for: email.scheduled_for,
        comment: email.comment,
        prospect_id: email.prospect_id,
        raw: email
      });
    });

    // Trier par date (plus récent en dernier pour affichage chronologique)
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setConversation(items);
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
        {/* Colonne principale - Conversation (emails envoyés + réponses) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Résumé de la conversation */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{sentEmails.length}</div>
                    <div className="text-xs text-gray-600">Envoyés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{receivedEmails.length}</div>
                    <div className="text-xs text-gray-600">Réponses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{scheduledEmails.length}</div>
                    <div className="text-xs text-gray-600">Programmés</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de la conversation */}
          {conversation.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Conversation ({conversation.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversation.map((item, index) => (
                  <div key={item.id} className="relative">
                    {/* Ligne de connexion */}
                    {index < conversation.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 -z-10" />
                    )}

                    {/* Email envoyé */}
                    {item.type === 'sent' && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 border rounded-lg p-4 bg-blue-50/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs bg-white">
                                  Étape {item.step}
                                </Badge>
                                {getEmailStatusBadge(
                                  item.replied ? 'replied' :
                                  item.bounced ? 'bounced' :
                                  item.unsubscribed ? 'unsubscribed' :
                                  item.clicked ? 'clicked' :
                                  item.opened ? 'opened' :
                                  'sent'
                                )}
                              </div>
                              <div className="font-medium text-sm">{item.subject}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(item.date).toLocaleString('fr-FR', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </div>
                              {item.opened_at && (
                                <div className="text-xs text-purple-600 mt-1">
                                  👁️ Ouvert le {new Date(item.opened_at).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Commentaire */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium flex items-center gap-1 text-gray-600">
                                <MessageSquare className="h-3 w-3" />
                                Note de pilotage
                              </Label>
                              {editingCommentId !== item.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCommentId(item.id)}
                                  className="h-6 text-xs"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  {emailComments.get(item.id) ? 'Modifier' : 'Ajouter'}
                                </Button>
                              )}
                            </div>
                            
                            {editingCommentId === item.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={emailComments.get(item.id) || ''}
                                  onChange={(e) => updateComment(item.id, e.target.value)}
                                  placeholder="Ajoutez une note de pilotage..."
                                  className="text-sm min-h-[60px] bg-white"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveComment(item.id, false)}
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
                              <div className="text-sm text-gray-600 bg-white rounded p-2 min-h-[40px]">
                                {emailComments.get(item.id) || <span className="text-gray-400 italic">Aucune note</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Réponse reçue */}
                    {item.type === 'received' && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 border-2 border-green-200 rounded-lg p-4 bg-green-50/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-green-600 text-white text-xs">
                                  ✉️ Réponse du prospect
                                </Badge>
                              </div>
                              <div className="font-medium text-sm">{item.subject}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                De: {item.from_name || item.from_email}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(item.date).toLocaleString('fr-FR', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Aperçu du contenu */}
                          {item.snippet && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="text-sm text-gray-700 bg-white rounded p-3 italic">
                                "{item.snippet}"
                              </div>
                              <Button
                                variant="link"
                                size="sm"
                                className="mt-2 h-6 text-xs text-green-700"
                                onClick={() => {
                                  // TODO: Ouvrir modal avec le contenu complet
                                  window.open(`/admin/prospection/email-reply/${item.prospect_id}/${item.id}`, '_blank');
                                }}
                              >
                                Voir le message complet →
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email programmé */}
                    {item.type === 'scheduled' && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 border border-dashed border-orange-300 rounded-lg p-4 bg-orange-50/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs bg-white">
                                  Étape {item.step}
                                </Badge>
                                <Badge className={
                                  item.status === 'scheduled' ? 'bg-orange-100 text-orange-800' :
                                  item.status === 'sent' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {item.status === 'scheduled' ? '📅 Programmé' :
                                   item.status === 'sent' ? '✅ Envoyé' :
                                   '❌ Annulé'}
                                </Badge>
                              </div>
                              <div className="font-medium text-sm">{item.subject}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Prévu le {new Date(item.scheduled_for!).toLocaleString('fr-FR', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Commentaire */}
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium flex items-center gap-1 text-gray-600">
                                <MessageSquare className="h-3 w-3" />
                                Note de pilotage
                              </Label>
                              {editingCommentId !== item.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCommentId(item.id)}
                                  className="h-6 text-xs"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  {emailComments.get(item.id) ? 'Modifier' : 'Ajouter'}
                                </Button>
                              )}
                            </div>
                            
                            {editingCommentId === item.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={emailComments.get(item.id) || ''}
                                  onChange={(e) => updateComment(item.id, e.target.value)}
                                  placeholder="Ajoutez une note de pilotage..."
                                  className="text-sm min-h-[60px] bg-white"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveComment(item.id, true)}
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
                              <div className="text-sm text-gray-600 bg-white rounded p-2 min-h-[40px]">
                                {emailComments.get(item.id) || <span className="text-gray-400 italic">Aucune note</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">Aucune conversation</p>
                <p className="text-sm text-gray-400">
                  Ce prospect n'a pas encore d'emails envoyés ou programmés
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

