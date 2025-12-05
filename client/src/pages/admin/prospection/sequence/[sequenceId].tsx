import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { config } from "@/config/env";
import { getSupabaseToken } from "@/lib/auth-helpers";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Send,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Save,
  Edit2,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Reply,
  Brain,
  MapPin,
  Briefcase,
  Phone,
  Globe,
  Linkedin,
  Hash,
  Users,
  TrendingUp,
  Loader2,
  Eye,
  Pause,
  Play,
  Trash2,
  X,
  UserPlus
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import ProspectEnrichmentView from "@/components/ProspectEnrichmentView";
import SendEmailModal from "@/components/SendEmailModal";
import ScheduleSequenceModal from "@/components/ScheduleSequenceModal";
import TransferProspectModal from "@/components/admin/prospection/TransferProspectModal";
import { ProspectEnrichmentData } from "@/types/prospects";

interface Prospect {
  id: string;
  email: string;
  email_validity: 'valid' | 'risky' | 'invalid' | null;
  source: 'google_maps' | 'import_csv' | 'linkedin' | 'manuel' | 'email_reply';
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
  enrichment_data: ProspectEnrichmentData | null;
  enriched_at: string | null;
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
  status: 'scheduled' | 'sent' | 'cancelled' | 'paused';
  created_at: string;
  comment?: string | null;
  cancelled_reason?: string | null;
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
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  
  // États pour les commentaires
  const [emailComments, setEmailComments] = useState<Map<string, string>>(new Map());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  
  // États pour gérer l'expansion des snippets et corps d'emails
  const [expandedSnippets, setExpandedSnippets] = useState<Set<string>>(new Set());
  const [expandedBodies, setExpandedBodies] = useState<Set<string>>(new Set());
  
  // États pour les modals
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showScheduleSequenceModal, setShowScheduleSequenceModal] = useState(false);
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // États pour l'édition des informations
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isSavingField, setIsSavingField] = useState(false);

  // États pour l'édition des emails programmés
  const [editingScheduledEmail, setEditingScheduledEmail] = useState<string | null>(null);
  const [editScheduledValues, setEditScheduledValues] = useState<{subject: string; body: string; scheduled_for: string}>({
    subject: '',
    body: '',
    scheduled_for: ''
  });
  const [isSavingScheduled, setIsSavingScheduled] = useState(false);

  // États pour le rapport du prospect
  const [prospectReport, setProspectReport] = useState<any>(null);
  const [reportContent, setReportContent] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isEnrichingReport, setIsEnrichingReport] = useState(false);

  useEffect(() => {
    if (user && sequenceId) {
      fetchData();
    }
  }, [user, sequenceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getSupabaseToken();

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

      // Récupérer le rapport du prospect
      const reportResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reportResponse.ok) {
        const reportResult = await reportResponse.json();
        if (reportResult.data) {
          setProspectReport(reportResult.data);
          setReportContent(reportResult.data.report_content || '');
        }
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
      const token = await getSupabaseToken();
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

  const saveReport = async () => {
    if (!sequenceId) return;

    try {
      setIsSavingReport(true);
      const token = await getSupabaseToken();

      if (!token) {
        toast.error('Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          report_content: reportContent,
          prospect_id: sequenceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast.error('Erreur d\'authentification. Veuillez vous reconnecter.');
        } else {
          throw new Error(errorData.error || `Erreur ${response.status} lors de la sauvegarde du rapport`);
        }
        return;
      }

      const result = await response.json();
      if (result.data) {
        setProspectReport(result.data);
      }

      toast.success('Rapport sauvegardé');
    } catch (error: any) {
      console.error('Erreur sauvegarde rapport:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde du rapport');
    } finally {
      setIsSavingReport(false);
    }
  };

  const enrichReportWithAI = async () => {
    if (!sequenceId) return;

    try {
      setIsEnrichingReport(true);
      const token = await getSupabaseToken();

      // Sauvegarder d'abord le rapport utilisateur s'il a été modifié
      if (reportContent.trim()) {
        await saveReport();
      }

      // Vérifier si le prospect est enrichi, sinon l'enrichir
      if (prospect && (!prospect.enrichment_data || prospect.enrichment_status !== 'completed')) {
        toast.info('Enrichissement du prospect en cours...');
        await enrichWithAI();
        // Attendre un peu pour que l'enrichissement se termine
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchData(); // Recharger les données
      }

      const response = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/report/enrich`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'enrichissement du rapport');
      }

      await response.json();
      
      // Recharger le rapport
      const reportResponse = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reportResponse.ok) {
        const reportResult = await reportResponse.json();
        if (reportResult.data) {
          setProspectReport(reportResult.data);
          setReportContent(reportResult.data.report_content || '');
        }
      }

      toast.success('Rapport enrichi avec succès');
    } catch (error: any) {
      console.error('Erreur enrichissement rapport:', error);
      toast.error(error.message || 'Erreur lors de l\'enrichissement du rapport');
    } finally {
      setIsEnrichingReport(false);
    }
  };

  const saveEnrichedReport = async () => {
    if (!sequenceId || !prospectReport) return;

    try {
      setIsSavingReport(true);
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/${sequenceId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          report_content: reportContent,
          enriched_content: prospectReport.enriched_content,
          action_plan: prospectReport.action_plan,
          prospect_id: sequenceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      if (result.data) {
        setProspectReport(result.data);
      }

      toast.success('Rapport enrichi sauvegardé');
    } catch (error: any) {
      console.error('Erreur sauvegarde rapport enrichi:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSavingReport(false);
    }
  };

  const updateComment = (emailId: string, comment: string) => {
    setEmailComments(prev => {
      const newMap = new Map(prev);
      newMap.set(emailId, comment);
      return newMap;
    });
  };

  const toggleSnippet = (emailId: string) => {
    setExpandedSnippets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const toggleBody = (emailId: string) => {
    setExpandedBodies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const enrichWithAI = async () => {
    if (!prospect) return;

    try {
      setIsEnriching(true);
      const token = await getSupabaseToken();

      // Préparer les informations du prospect
      const prospectInfo = {
        id: prospect.id,
        company_name: prospect.company_name,
        siren: prospect.siren,
        firstname: prospect.firstname,
        lastname: prospect.lastname,
        email: prospect.email,
        naf_code: prospect.naf_code,
        naf_label: prospect.naf_label,
        enrichment_status: prospect.enrichment_status,
        enrichment_data: prospect.enrichment_data
      };

      // Appeler l'API d'enrichissement
      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-sequence-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospectInfo,
          steps: [{ stepNumber: 1, delayDays: 0 }], // Minimal pour déclencher l'enrichissement
          context: '',
          forceReenrichment: true // Force le ré-enrichissement
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'enrichissement');
      }

      toast.success('Profil enrichi avec succès !');
      await fetchData(); // Recharger les données
    } catch (error: any) {
      console.error('Erreur enrichissement IA:', error);
      toast.error(error.message || 'Erreur lors de l\'enrichissement');
    } finally {
      setIsEnriching(false);
    }
  };

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field: string, customData?: any) => {
    if (!prospect) return;

    try {
      setIsSavingField(true);
      const token = await getSupabaseToken();

      // Préparer les données à sauvegarder
      let dataToSave = customData || { [field]: editValues[field] };

      const response = await fetch(`${config.API_URL}/api/prospects/${prospect.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }

      toast.success('Modification enregistrée !');
      await fetchData(); // Recharger les données
      setEditingField(null);
      setEditValues({});
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSavingField(false);
    }
  };

  // === FONCTIONS POUR GÉRER LES EMAILS PROGRAMMÉS ===

  const startEditScheduledEmail = (email: ScheduledEmail) => {
    setEditingScheduledEmail(email.id);
    setEditScheduledValues({
      subject: email.subject,
      body: email.body,
      scheduled_for: email.scheduled_for
    });
  };

  const cancelEditScheduledEmail = () => {
    setEditingScheduledEmail(null);
    setEditScheduledValues({ subject: '', body: '', scheduled_for: '' });
  };

  const saveScheduledEmail = async (emailId: string) => {
    try {
      setIsSavingScheduled(true);
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-emails/${emailId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editScheduledValues)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification');
      }

      toast.success('Email programmé modifié avec succès !');
      await fetchData();
      cancelEditScheduledEmail();
    } catch (error: any) {
      console.error('Erreur modification email programmé:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSavingScheduled(false);
    }
  };

  const pauseScheduledEmail = async (emailId: string) => {
    try {
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-emails/${emailId}/pause`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suspension');
      }

      toast.success('Email programmé suspendu');
      await fetchData();
    } catch (error: any) {
      console.error('Erreur suspension email programmé:', error);
      toast.error(error.message || 'Erreur lors de la suspension');
    }
  };

  const resumeScheduledEmail = async (emailId: string) => {
    try {
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-emails/${emailId}/resume`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la reprise');
      }

      toast.success('Email programmé repris');
      await fetchData();
    } catch (error: any) {
      console.error('Erreur reprise email programmé:', error);
      toast.error(error.message || 'Erreur lors de la reprise');
    }
  };

  const deleteScheduledEmail = async (emailId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet email programmé ?')) {
      return;
    }

    try {
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-emails/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      toast.success('Email programmé annulé');
      await fetchData();
    } catch (error: any) {
      console.error('Erreur suppression email programmé:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
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
      {/* En-tête avec statuts */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/admin/prospection')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900">Fiche prospect</h1>
          
          {/* Ligne avec statuts et boutons d'action */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Statuts ultra-compacts sur une seule ligne */}
            {prospect && (
              <div className="flex items-center gap-1.5">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0.5 h-5 ${
                    prospect.enrichment_status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    prospect.enrichment_status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    prospect.enrichment_status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {prospect.enrichment_status === 'completed' ? '✓ Enrichi' :
                   prospect.enrichment_status === 'in_progress' ? '⏳ Enrichissement' :
                   prospect.enrichment_status === 'failed' ? '✗ Échec' :
                   '○ Non enrichi'}
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0.5 h-5 ${
                    prospect.ai_status === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    prospect.ai_status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    prospect.ai_status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {prospect.ai_status === 'completed' ? '✓ IA' :
                   prospect.ai_status === 'in_progress' ? '⏳ IA' :
                   prospect.ai_status === 'failed' ? '✗ IA' :
                   '○ IA'}
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0.5 h-5 ${
                    prospect.emailing_status === 'replied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    prospect.emailing_status === 'opened' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    prospect.emailing_status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                    prospect.emailing_status === 'clicked' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    prospect.emailing_status === 'bounced' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {prospect.emailing_status === 'replied' ? '✓ Répondu' :
                   prospect.emailing_status === 'opened' ? '👁 Ouvert' :
                   prospect.emailing_status === 'sent' ? '✓ Envoyé' :
                   prospect.emailing_status === 'clicked' ? '🔗 Cliqué' :
                   prospect.emailing_status === 'bounced' ? '✗ Rebondi' :
                   '○ Email'}
                </Badge>
              </div>
            )}
            
            {/* Boutons d'action compacts */}
            <div className="flex items-center gap-1.5">
              {/* Bouton Enrichissement - Change selon le statut */}
              {prospect.enrichment_status === 'completed' && prospect.enrichment_data ? (
                <Button
                  onClick={() => setShowEnrichmentModal(true)}
                  className="h-7 px-2 text-[11px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md"
                  size="sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Consulter l'enrichissement
                </Button>
              ) : (
                <Button
                  onClick={enrichWithAI}
                  disabled={isEnriching}
                  className="h-7 px-2 text-[11px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="sm"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Enrichissement...
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3 mr-1" />
                      Enrichir avec l'IA
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={() => setShowSendEmailModal(true)}
                className="h-7 px-2 text-[11px] bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Send className="h-3 w-3 mr-1" />
                Envoyer un email
              </Button>
              <Button
                onClick={() => setShowScheduleSequenceModal(true)}
                className="h-7 px-2 text-[11px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="sm"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Programmer une séquence
              </Button>
              <Button
                onClick={() => setShowTransferModal(true)}
                className="h-7 px-2 text-[11px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="sm"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Transférer vers expert
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rapport du prospect */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Rapport du prospect
            </CardTitle>
            <div className="flex items-center gap-2">
              {reportContent.trim() && (
                <Button
                  onClick={enrichReportWithAI}
                  disabled={isEnrichingReport}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
                >
                  {isEnrichingReport ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Amélioration en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3 mr-1.5" />
                      Améliorer avec l'IA
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={saveReport}
                disabled={isSavingReport}
                size="sm"
                className="h-8 px-3 text-xs"
              >
                {isSavingReport ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1.5" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zone de texte pour le rapport utilisateur */}
          <div>
            <Label htmlFor="report-content" className="text-sm font-medium text-gray-700 mb-2 block">
              Informations complémentaires
              <span className="text-xs text-gray-500 ml-2 font-normal">
                (Ajoutez toute information utile pour la prospection - ces notes seront prises en compte par l'IA)
              </span>
            </Label>
            <Textarea
              id="report-content"
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="Ajoutez vos notes, observations et informations complémentaires sur ce prospect...&#10;&#10;Exemples :&#10;- Contexte de la prise de contact&#10;- Besoins identifiés&#10;- Objections potentielles&#10;- Priorité et timing&#10;- Points clés à mentionner dans les prochains échanges"
              className="min-h-[120px] resize-y text-sm"
            />
          </div>

          {/* Contenu enrichi par l'IA - ÉDITABLE */}
          {prospectReport?.enriched_content && (
            <div className="border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Rapport optimisé par l'IA</h4>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    Dernière mise à jour : {prospectReport.enriched_at ? new Date(prospectReport.enriched_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Jamais'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={enrichReportWithAI}
                    disabled={isEnrichingReport}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    {isEnrichingReport ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Brain className="h-3 w-3 mr-1" />
                        Relancer l'enrichissement
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={saveEnrichedReport}
                    disabled={isSavingReport}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <Textarea
                  value={prospectReport.enriched_content}
                  onChange={(e) => {
                    // Permettre l'édition
                    setProspectReport((prev: any) => prev ? { ...prev, enriched_content: e.target.value } : null);
                  }}
                  className="min-h-[200px] resize-y text-sm bg-white/80 font-mono"
                />
                <div className="mt-2 text-xs text-gray-500">
                  💡 Vous pouvez modifier ce contenu. Relancez l'enrichissement pour mettre à jour avec les dernières informations.
                </div>
              </div>
            </div>
          )}

          {/* Plan d'action - ÉDITABLE */}
          {prospectReport?.action_plan && (
            <div className="border-t pt-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold text-gray-900">Plan d'action suggéré</h4>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <Textarea
                  value={prospectReport.action_plan}
                  onChange={(e) => {
                    setProspectReport((prev: any) => prev ? { ...prev, action_plan: e.target.value } : null);
                  }}
                  className="min-h-[150px] resize-y text-sm bg-white/80 font-mono"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Colonne principale - Conversation (emails envoyés + réponses) */}
        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          {/* Résumé de la conversation */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
            <CardContent className="py-3 lg:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-blue-600">{sentEmails.length}</div>
                    <div className="text-[10px] lg:text-xs text-gray-600">Envoyés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-emerald-600">{receivedEmails.length}</div>
                    <div className="text-[10px] lg:text-xs text-gray-600">Réponses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-orange-600">{scheduledEmails.length}</div>
                    <div className="text-[10px] lg:text-xs text-gray-600">Programmés</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bannière synthèse réponses multiples */}
          {receivedEmails.length > 1 && (
            <Card className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-2 border-emerald-200 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{receivedEmails.length}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {receivedEmails.length} réponses reçues du prospect
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Dernier échange : {new Date(receivedEmails[0].received_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                    🎯 Prospect engagé
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {receivedEmails.length === 1 && (
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-900">
                      Le prospect a répondu !
                    </p>
                    <p className="text-[10px] text-emerald-700">
                      {new Date(receivedEmails[0].received_at).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline de la conversation */}
          {conversation.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                  <span className="hidden sm:inline">Conversation</span>
                  <span className="sm:hidden">Conv.</span>
                  <Badge variant="secondary" className="text-xs">{conversation.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                {conversation.map((item, index) => (
                  <div key={item.id} className="relative">
                    {/* Ligne de connexion - cachée sur mobile */}
                    {index < conversation.length - 1 && (
                      <div className="hidden lg:block absolute left-5 top-11 bottom-0 w-0.5 bg-gray-200 -z-10" />
                    )}

                    {/* Email envoyé */}
                    {item.type === 'sent' && (
                      <div className="flex gap-3 lg:gap-4">
                        <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 border rounded-lg p-3 lg:p-4 bg-blue-50/50">
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

                          {/* Corps de l'email envoyé */}
                          {item.body && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBody(item.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                              >
                                {expandedBodies.has(item.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Masquer le message
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Voir le message complet
                                  </>
                                )}
                              </Button>
                              {expandedBodies.has(item.id) && (
                                <div className="mt-2 bg-white rounded-lg p-4 border border-blue-200 animate-in slide-in-from-top-2 duration-200">
                                  <div 
                                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: item.body }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Réponse reçue - DESIGN COMPACT & HAUTE COUTURE */}
                    {item.type === 'received' && (
                      <div className="flex gap-3 group">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md">
                          <Reply className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 border-l-4 border-emerald-500 rounded-r-lg bg-gradient-to-r from-emerald-50/80 to-green-50/30 hover:shadow-lg transition-all duration-200">
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 space-y-1">
                                {/* En-tête compact */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-[10px] px-2 py-0.5 h-auto font-medium shadow-sm">
                                    <Reply className="h-2.5 w-2.5 mr-1 inline" />
                                    Réponse
                                  </Badge>
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                                    {new Date(item.date).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                {/* Sujet */}
                                <div className="font-semibold text-sm text-gray-900 truncate" title={item.subject}>
                                  {item.subject}
                                </div>
                                
                                {/* Expéditeur */}
                                <div className="text-xs text-emerald-700 font-medium truncate">
                                  De : {item.from_name || item.from_email}
                                </div>
                              </div>
                              
                              {/* Actions compactes */}
                              <div className="flex gap-1 ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-emerald-100 rounded-full"
                                  onClick={() => toggleSnippet(item.id)}
                                  title={expandedSnippets.has(item.id) ? "Masquer l'aperçu" : "Voir l'aperçu"}
                                >
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedSnippets.has(item.id) ? 'rotate-180' : ''}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-emerald-100 rounded-full"
                                  onClick={() => window.open(`/admin/prospection/email-reply/${item.prospect_id}/${item.id}`, '_blank')}
                                  title="Ouvrir le message complet"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Snippet expansible */}
                            {item.snippet && expandedSnippets.has(item.id) && (
                              <div className="mt-3 pt-3 border-t border-emerald-200/50 animate-in slide-in-from-top-2 duration-200">
                                <div className="text-xs text-gray-700 bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 italic border border-emerald-100 leading-relaxed">
                                  "{item.snippet}"
                                </div>
                              </div>
                            )}

                            {/* Corps complet de l'email reçu */}
                            {item.body && (
                              <div className="mt-3 pt-3 border-t border-emerald-200/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleBody(item.id)}
                                  className="text-xs text-emerald-700 hover:text-emerald-800 h-6 px-2"
                                >
                                  {expandedBodies.has(item.id) ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Masquer le message complet
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      Voir le message complet
                                    </>
                                  )}
                                </Button>
                                {expandedBodies.has(item.id) && (
                                  <div className="mt-2 bg-white rounded-lg p-4 border border-emerald-200 animate-in slide-in-from-top-2 duration-200">
                                    <div 
                                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: item.body }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Email programmé */}
                    {item.type === 'scheduled' && (
                      <div className="flex gap-3 lg:gap-4">
                        <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                          <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 border-2 border-orange-300 rounded-lg p-3 lg:p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="text-xs bg-white font-semibold">
                                  Étape {item.step}
                                </Badge>
                                <Badge className={
                                  item.status === 'scheduled' ? 'bg-orange-500 text-white shadow-sm' :
                                  item.status === 'paused' ? 'bg-gray-500 text-white shadow-sm' :
                                  item.status === 'sent' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {item.status === 'scheduled' ? '📅 Programmé' :
                                   item.status === 'paused' ? '⏸️ Suspendu' :
                                   item.status === 'sent' ? '✅ Envoyé' :
                                   '❌ Annulé'}
                                </Badge>
                              </div>
                              
                              {/* Mode édition */}
                              {editingScheduledEmail === item.id ? (
                                <div className="space-y-3 mt-2">
                                  <div>
                                    <Label className="text-xs mb-1">Sujet</Label>
                                    <Input
                                      value={editScheduledValues.subject}
                                      onChange={(e) => setEditScheduledValues(prev => ({ ...prev, subject: e.target.value }))}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs mb-1">Date et heure</Label>
                                    <Input
                                      type="datetime-local"
                                      value={new Date(editScheduledValues.scheduled_for).toISOString().slice(0, 16)}
                                      onChange={(e) => setEditScheduledValues(prev => ({ ...prev, scheduled_for: new Date(e.target.value).toISOString() }))}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs mb-1">Corps du message (HTML)</Label>
                                    <Textarea
                                      value={editScheduledValues.body}
                                      onChange={(e) => setEditScheduledValues(prev => ({ ...prev, body: e.target.value }))}
                                      className="text-sm min-h-[200px] font-mono"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveScheduledEmail(item.id)}
                                      disabled={isSavingScheduled}
                                      className="h-7 text-xs"
                                    >
                                      {isSavingScheduled ? (
                                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sauvegarde...</>
                                      ) : (
                                        <><Save className="h-3 w-3 mr-1" /> Sauvegarder</>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditScheduledEmail}
                                      disabled={isSavingScheduled}
                                      className="h-7 text-xs"
                                    >
                                      <X className="h-3 w-3 mr-1" /> Annuler
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="font-semibold text-base text-gray-900 mb-1">{item.subject}</div>
                                  <div className="text-xs text-orange-700 font-medium bg-white/70 px-2 py-1 rounded inline-flex items-center">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Prévu le {new Date(item.scheduled_for!).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Boutons d'action (uniquement si pas en mode édition et status = scheduled ou paused) */}
                            {editingScheduledEmail !== item.id && (item.status === 'scheduled' || item.status === 'paused') && (
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-orange-200 rounded"
                                  onClick={() => {
                                    const email = scheduledEmails.find(e => e.id === item.id);
                                    if (email) startEditScheduledEmail(email);
                                  }}
                                  title="Modifier"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                {item.status === 'scheduled' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-gray-200 rounded"
                                    onClick={() => pauseScheduledEmail(item.id)}
                                    title="Suspendre"
                                  >
                                    <Pause className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-green-200 rounded"
                                    onClick={() => resumeScheduledEmail(item.id)}
                                    title="Reprendre"
                                  >
                                    <Play className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-red-200 rounded"
                                  onClick={() => deleteScheduledEmail(item.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Raison d'annulation si présente */}
                          {item.status === 'cancelled' && (item.raw as ScheduledEmail)?.cancelled_reason && (
                            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              <strong>Raison :</strong> {(item.raw as ScheduledEmail).cancelled_reason}
                            </div>
                          )}

                          {/* Corps de l'email programmé (uniquement si pas en mode édition) */}
                          {item.body && editingScheduledEmail !== item.id && (
                            <div className="mt-3 pt-3 border-t border-orange-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBody(item.id)}
                                className="text-xs text-orange-700 hover:text-orange-800 h-6 px-2 font-medium"
                              >
                                {expandedBodies.has(item.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Masquer le message
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Voir le message complet
                                  </>
                                )}
                              </Button>
                              {expandedBodies.has(item.id) && (
                                <div className="mt-2 bg-white rounded-lg p-4 border border-orange-200 animate-in slide-in-from-top-2 duration-200">
                                  <div 
                                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: item.body }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

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

        {/* Colonne latérale - Informations du prospect - cachée sur mobile */}
        <div className="space-y-4 lg:space-y-6 hidden xl:block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du prospect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Entreprise */}
              {prospect.company_name && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    Entreprise
                  </div>
                  <div className="font-medium text-gray-900">{prospect.company_name}</div>
                  {prospect.company_website && (
                    <a
                      href={prospect.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="h-3 w-3" />
                      {prospect.company_website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {prospect.linkedin_company && (
                    <a
                      href={prospect.linkedin_company}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Linkedin className="h-3 w-3" />
                      LinkedIn entreprise
                    </a>
                  )}
                </div>
              )}

              <Separator />

              {/* Contact */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <User className="h-3.5 w-3.5" />
                    Contact
                  </div>
                  {editingField !== 'contact' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing('contact', {
                        firstname: prospect.firstname || '',
                        lastname: prospect.lastname || ''
                      })}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingField === 'contact' ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.contact?.firstname || ''}
                      onChange={(e) => setEditValues({
                        contact: { ...editValues.contact, firstname: e.target.value }
                      })}
                      placeholder="Prénom"
                      className="text-sm h-8"
                      disabled={isSavingField}
                    />
                    <Input
                      value={editValues.contact?.lastname || ''}
                      onChange={(e) => setEditValues({
                        contact: { ...editValues.contact, lastname: e.target.value }
                      })}
                      placeholder="Nom"
                      className="text-sm h-8"
                      disabled={isSavingField}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveField('contact', {
                          firstname: editValues.contact?.firstname || null,
                          lastname: editValues.contact?.lastname || null
                        })}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        {isSavingField ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {prospect.firstname || prospect.lastname ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {prospect.firstname} {prospect.lastname}
                        </div>
                        {prospect.job_title && (
                          <div className="text-xs text-gray-600 mt-0.5">{prospect.job_title}</div>
                        )}
                        {prospect.linkedin_profile && (
                          <a
                            href={prospect.linkedin_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Linkedin className="h-3 w-3" />
                            LinkedIn personnel
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Non renseigné</div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                  {editingField !== 'email' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing('email', prospect.email)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingField === 'email' ? (
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={editValues.email || ''}
                      onChange={(e) => setEditValues({ email: e.target.value })}
                      placeholder="email@exemple.com"
                      className="text-sm h-8"
                      disabled={isSavingField}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveField('email')}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        {isSavingField ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-900 font-mono">{prospect.email}</span>
                    {prospect.email_validity && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-auto ${
                          prospect.email_validity === 'valid' ? 'bg-green-50 text-green-700 border-green-200' :
                          prospect.email_validity === 'risky' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {prospect.email_validity === 'valid' ? '✓ Valide' :
                         prospect.email_validity === 'risky' ? '⚠ Risqué' :
                         '✗ Invalide'}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Téléphone */}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Phone className="h-3.5 w-3.5" />
                    Téléphone
                  </div>
                  {editingField !== 'phones' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing('phones', {
                        phone_direct: prospect.phone_direct || '',
                        phone_standard: prospect.phone_standard || ''
                      })}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingField === 'phones' ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-600">📱 Direct</Label>
                      <Input
                        type="tel"
                        value={editValues.phones?.phone_direct || ''}
                        onChange={(e) => setEditValues({
                          phones: { ...editValues.phones, phone_direct: e.target.value }
                        })}
                        placeholder="06 12 34 56 78"
                        className="text-sm h-8 mt-1"
                        disabled={isSavingField}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">☎️ Standard</Label>
                      <Input
                        type="tel"
                        value={editValues.phones?.phone_standard || ''}
                        onChange={(e) => setEditValues({
                          phones: { ...editValues.phones, phone_standard: e.target.value }
                        })}
                        placeholder="01 23 45 67 89"
                        className="text-sm h-8 mt-1"
                        disabled={isSavingField}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveField('phones', {
                          phone_direct: editValues.phones?.phone_direct || null,
                          phone_standard: editValues.phones?.phone_standard || null
                        })}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        {isSavingField ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {prospect.phone_direct && (
                      <div className="text-sm text-gray-900 font-mono">
                        📱 {prospect.phone_direct}
                      </div>
                    )}
                    {prospect.phone_standard && (
                      <div className="text-sm text-gray-900 font-mono">
                        ☎️ {prospect.phone_standard}
                      </div>
                    )}
                    {!prospect.phone_direct && !prospect.phone_standard && (
                      <div className="text-xs text-gray-400">Non renseigné</div>
                    )}
                  </div>
                )}
              </div>

              {/* Adresse */}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <MapPin className="h-3.5 w-3.5" />
                    Adresse
                  </div>
                  {editingField !== 'address' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing('address', {
                        adresse: prospect.adresse || '',
                        postal_code: prospect.postal_code || '',
                        city: prospect.city || ''
                      })}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingField === 'address' ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.address?.adresse || ''}
                      onChange={(e) => setEditValues({
                        address: { ...editValues.address, adresse: e.target.value }
                      })}
                      placeholder="Rue, numéro..."
                      className="text-sm h-8"
                      disabled={isSavingField}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={editValues.address?.postal_code || ''}
                        onChange={(e) => setEditValues({
                          address: { ...editValues.address, postal_code: e.target.value }
                        })}
                        placeholder="75001"
                        className="text-sm h-8 col-span-1"
                        disabled={isSavingField}
                      />
                      <Input
                        value={editValues.address?.city || ''}
                        onChange={(e) => setEditValues({
                          address: { ...editValues.address, city: e.target.value }
                        })}
                        placeholder="Paris"
                        className="text-sm h-8 col-span-2"
                        disabled={isSavingField}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveField('address', {
                          adresse: editValues.address?.adresse || null,
                          postal_code: editValues.address?.postal_code || null,
                          city: editValues.address?.city || null
                        })}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        {isSavingField ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSavingField}
                        className="h-7 text-xs"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-900">
                    {prospect.adresse && <div>{prospect.adresse}</div>}
                    {(prospect.postal_code || prospect.city) && (
                      <div>
                        {prospect.postal_code} {prospect.city}
                      </div>
                    )}
                    {!prospect.adresse && !prospect.postal_code && !prospect.city && (
                      <div className="text-xs text-gray-400">Non renseignée</div>
                    )}
                  </div>
                )}
              </div>

              {/* Informations légales */}
              {(prospect.siren || prospect.naf_code) && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                      <Hash className="h-3.5 w-3.5" />
                      Informations légales
                    </div>
                    <div className="space-y-1">
                      {prospect.siren && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-16">SIREN:</span>
                          <span className="text-sm text-gray-900 font-mono">{prospect.siren}</span>
                        </div>
                      )}
                      {prospect.naf_code && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-600 w-16 shrink-0">NAF:</span>
                          <div className="flex-1">
                            <span className="text-sm text-gray-900 font-mono">{prospect.naf_code}</span>
                            {prospect.naf_label && (
                              <div className="text-xs text-gray-600 mt-0.5">{prospect.naf_label}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Effectif */}
              {prospect.employee_range && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                      <Users className="h-3.5 w-3.5" />
                      Effectif
                    </div>
                    <div className="text-sm text-gray-900">{prospect.employee_range}</div>
                  </div>
                </>
              )}

              {/* Source */}
              {prospect.source && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      Source
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {prospect.source === 'google_maps' ? '📍 Google Maps' :
                       prospect.source === 'import_csv' ? '📄 Import CSV' :
                       prospect.source === 'linkedin' ? '💼 LinkedIn' :
                       '✍️ Manuel'}
                    </Badge>
                  </div>
                </>
              )}

              {/* Score de priorité */}
              {prospect.score_priority > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Score de priorité
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(prospect.score_priority, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{prospect.score_priority}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Date de création */}
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ajouté le
                </div>
                <div className="text-sm text-gray-900">
                  {new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Bouton pour afficher l'enrichissement */}
              {prospect.enrichment_data && (
                <>
                  <Separator />
                  <Button
                    onClick={() => setShowEnrichment(!showEnrichment)}
                    variant="outline"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>
                        {showEnrichment ? 'Masquer' : 'Voir'} l'enrichissement IA
                      </span>
                    </div>
                    {showEnrichment ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Affichage de l'enrichissement */}
          {showEnrichment && prospect.enrichment_data && (
            <Card>
              <CardContent className="pt-6">
                <ProspectEnrichmentView
                  enrichmentData={prospect.enrichment_data}
                  prospectId={prospect.id}
                  onUpdate={async (updatedData) => {
                    try {
                      const token = await getSupabaseToken();
                      const response = await fetch(`${config.API_URL}/api/prospects/${prospect.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ enrichment_data: updatedData })
                      });

                      if (response.ok) {
                        toast.success('Enrichissement mis à jour !');
                        // Rafraîchir le prospect
                        const updatedProspect = { ...prospect, enrichment_data: updatedData };
                        setProspect(updatedProspect);
                      } else {
                        toast.error('Erreur lors de la mise à jour');
                      }
                    } catch (error) {
                      console.error('Erreur:', error);
                      toast.error('Erreur lors de la mise à jour');
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {prospect && (
        <>
          <SendEmailModal
            prospectId={prospect.id}
            prospectName={`${prospect.firstname || ''} ${prospect.lastname || ''}`.trim() || 'Prospect'}
            prospectEmail={prospect.email}
            companyName={prospect.company_name}
            open={showSendEmailModal}
            onClose={() => setShowSendEmailModal(false)}
            onSuccess={() => {
              fetchData(); // Recharger les données
              toast.success('Email envoyé avec succès !');
            }}
          />

          <ScheduleSequenceModal
            prospectId={prospect.id}
            prospectName={`${prospect.firstname || ''} ${prospect.lastname || ''}`.trim() || 'Prospect'}
            prospectEmail={prospect.email}
            companyName={prospect.company_name}
            siren={prospect.siren}
            nafCode={prospect.naf_code}
            nafLabel={prospect.naf_label}
            enrichmentStatus={prospect.enrichment_status}
            enrichmentData={prospect.enrichment_data}
            open={showScheduleSequenceModal}
            onClose={() => setShowScheduleSequenceModal(false)}
            onSuccess={() => {
              fetchData(); // Recharger les données
              toast.success('Séquence programmée avec succès !');
            }}
          />

          {/* Dialog pour consulter l'enrichissement */}
          <Dialog open={showEnrichmentModal} onOpenChange={setShowEnrichmentModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Brain className="h-6 w-6 text-blue-600" />
                  Enrichissement IA - {prospect.company_name || 'Prospect'}
                </DialogTitle>
              </DialogHeader>
              {prospect.enrichment_data && (
                <div className="mt-4">
                  <ProspectEnrichmentView
                    enrichmentData={prospect.enrichment_data}
                    prospectId={prospect.id}
                    onUpdate={async (updatedData) => {
                      try {
                        const token = await getSupabaseToken();
                        const response = await fetch(`${config.API_URL}/api/prospects/${prospect.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ enrichment_data: updatedData })
                        });

                        if (response.ok) {
                          toast.success('Enrichissement mis à jour !');
                          const updatedProspect = { ...prospect, enrichment_data: updatedData };
                          setProspect(updatedProspect);
                        } else {
                          toast.error('Erreur lors de la mise à jour');
                        }
                      } catch (error) {
                        console.error('Erreur:', error);
                        toast.error('Erreur lors de la mise à jour');
                      }
                    }}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Modal de transfert vers expert */}
      {prospect && (
        <TransferProspectModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          prospectId={prospect.id}
          prospectEmail={prospect.email}
          prospectCompany={prospect.company_name || undefined}
        />
      )}
    </div>
  );
}

