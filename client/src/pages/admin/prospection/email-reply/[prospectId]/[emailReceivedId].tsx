import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { config } from "@/config/env";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  User,
  Building2,
  Calendar,
  Reply,
  Clock,
  CheckCircle2
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import ReplyEmailModal from "@/components/admin/ReplyEmailModal";

interface Prospect {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  company_name: string | null;
  emailing_status: string;
  created_at: string;
}

interface EmailReceived {
  id: string;
  prospect_id: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  snippet: string;
  received_at: string;
  is_read: boolean;
  is_replied: boolean;
}

interface ProspectEmail {
  id: string;
  step: number;
  subject: string;
  body: string;
  sent_at: string;
  replied: boolean;
}

export default function EmailReplyPage() {
  const { prospectId, emailReceivedId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [emailReceived, setEmailReceived] = useState<EmailReceived | null>(null);
  const [sentEmails, setSentEmails] = useState<ProspectEmail[]>([]);
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    if (user && prospectId && emailReceivedId) {
      fetchData();
      markAsRead();
    }
  }, [user, prospectId, emailReceivedId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');

      // Récupérer le prospect
      const prospectResponse = await fetch(`${config.API_URL}/api/prospects/${prospectId}`, {
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

      // Récupérer l'email reçu
      const emailResponse = await fetch(
        `${config.API_URL}/api/prospects/${prospectId}/emails-received/${emailReceivedId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!emailResponse.ok) {
        throw new Error('Erreur lors du chargement de l\'email');
      }

      const emailResult = await emailResponse.json();
      setEmailReceived(emailResult.data);

      // Récupérer l'historique des emails envoyés
      const sentResponse = await fetch(`${config.API_URL}/api/prospects/${prospectId}/emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (sentResponse.ok) {
        const sentResult = await sentResponse.json();
        setSentEmails(sentResult.data || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      await fetch(
        `${config.API_URL}/api/prospects/${prospectId}/emails-received/${emailReceivedId}/mark-read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Erreur marquage lecture:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!prospect || !emailReceived) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Email ou prospect introuvable</p>
            <Button
              className="w-full mt-4"
              onClick={() => navigate('/admin/prospection')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la prospection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const prospectName = prospect.firstname && prospect.lastname
    ? `${prospect.firstname} ${prospect.lastname}`
    : prospect.company_name || prospect.email;

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/prospection')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Synthèse Email Reçu</h1>
            <p className="text-sm text-gray-600">
              Conversation avec {prospectName}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowReplyModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Reply className="h-4 w-4 mr-2" />
          Répondre
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Email reçu */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email reçu */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <CardTitle>Email reçu</CardTitle>
                    <Badge variant="default" className="bg-green-600">
                      Nouveau
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    De: <strong>{emailReceived.from_name || emailReceived.from_email}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Sujet: <strong>{emailReceived.subject}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(emailReceived.received_at).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {emailReceived.body_html ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: emailReceived.body_html }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-700">
                  {emailReceived.body_text}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique des emails envoyés */}
          {sentEmails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Historique de la séquence envoyée ({sentEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">Étape {email.step}</Badge>
                            {email.replied && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Répondu
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm">{email.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Envoyé le{' '}
                            {new Date(email.sent_at).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          Voir le contenu
                        </summary>
                        <div
                          className="mt-2 text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: email.body }}
                        />
                      </details>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale - Infos prospect */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Prospect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4" />
                  <span>Nom</span>
                </div>
                <p className="font-medium">{prospectName}</p>
              </div>

              {prospect.company_name && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span>Entreprise</span>
                  </div>
                  <p className="font-medium">{prospect.company_name}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="font-medium text-sm break-all">{prospect.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Créé le</span>
                </div>
                <p className="font-medium text-sm">
                  {new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                    dateStyle: 'medium'
                  })}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span>Statut</span>
                </div>
                <Badge>{prospect.emailing_status}</Badge>
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/admin/prospection?prospect_id=${prospectId}`)}
              >
                Voir la fiche complète
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de réponse */}
      {showReplyModal && emailReceived && (
        <ReplyEmailModal
          prospectId={prospectId!}
          prospectName={prospectName}
          prospectEmail={prospect.email}
          emailReceivedId={emailReceivedId!}
          emailReceivedContent={emailReceived.body_text || emailReceived.body_html || ''}
          sentEmailsHistory={sentEmails.map(e => ({
            subject: e.subject,
            body: e.body,
            sent_at: e.sent_at
          }))}
          onClose={() => setShowReplyModal(false)}
          onSuccess={() => {
            fetchData();
            toast.success('Réponse envoyée !');
          }}
        />
      )}
    </div>
  );
}

