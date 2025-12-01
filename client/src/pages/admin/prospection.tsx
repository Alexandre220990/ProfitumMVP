import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { config } from "@/config/env";
import { toast } from "sonner";
import { 
  Mail, 
  User, 
  Building2, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw,
  Search,
  TrendingUp,
  ArrowUpDown,
  Upload,
  List,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Save,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Mail as MailIcon,
  Edit2,
  Pause,
  RotateCcw,
  Sparkles
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import ImportProspects from "./import-prospects";

// Types
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
}

interface ProspectStats {
  total_prospects: number;
  enriched_count: number;
  ai_processed_count: number;
  emails_sent_count: number;
  emails_opened_count: number;
  emails_replied_count: number;
  open_rate: number;
  reply_rate: number;
}

type SortField = 'created_at' | 'score_priority' | 'email' | 'company_name' | 'firstname' | 'lastname' | 'enrichment_status' | 'ai_status' | 'emailing_status';
type SortOrder = 'asc' | 'desc';

export default function ProspectionAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'list';
  
  // États
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [prospectEmails, setProspectEmails] = useState<ProspectEmail[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [editingDelayId, setEditingDelayId] = useState<string | null>(null);
  const [delayValue, setDelayValue] = useState<number>(0);
  
  // Filtres
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterEnrichment, setFilterEnrichment] = useState<string>('all');
  const [filterAI, setFilterAI] = useState<string>('all');
  const [filterEmailing, setFilterEmailing] = useState<string>('all');
  
  // Sélection
  const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(new Set());
  
  // Modal envoi email
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [checkingGmail, setCheckingGmail] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Tri
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // États pour la programmation de séquences
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [sequenceConfigs, setSequenceConfigs] = useState<Map<string, {
    email: string;
    steps: Array<{
      id: string;
      stepNumber: number;
      delayDays: number;
      subject: string;
      body: string;
    }>;
    ready: boolean;
  }>>(new Map());
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0);
  const [schedulingDate, setSchedulingDate] = useState<string>('');
  const [schedulingTime, setSchedulingTime] = useState<string>('');

  // États pour la gestion des séquences
  const [savedSequences, setSavedSequences] = useState<any[]>([]);
  const [showSequenceForm, setShowSequenceForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState<any | null>(null);
  const [sequenceForm, setSequenceForm] = useState({
    name: '',
    description: '',
    steps: [
      { stepNumber: 1, delayDays: 0, subject: '', body: '' },
      { stepNumber: 2, delayDays: 3, subject: '', body: '' },
      { stepNumber: 3, delayDays: 7, subject: '', body: '' }
    ]
  });
  const [loadingSequences, setLoadingSequences] = useState(false);

  // États pour la gestion des séquences (suspendre/modifier/relancer)
  const [showEditSequenceModal, setShowEditSequenceModal] = useState(false);
  const [editingProspectSequence, setEditingProspectSequence] = useState<Prospect | null>(null);
  const [prospectSequenceEmails, setProspectSequenceEmails] = useState<any[]>([]);
  const [isPausingSequence, setIsPausingSequence] = useState(false);
  const [isRestartingSequence, setIsRestartingSequence] = useState(false);

  // États pour la création manuelle de prospect
  const [showCreateProspectModal, setShowCreateProspectModal] = useState(false);
  const [creatingProspect, setCreatingProspect] = useState(false);
  const [newProspect, setNewProspect] = useState({
    email: '',
    firstname: '',
    lastname: '',
    company_name: '',
    siren: ''
  });

  // États pour la génération IA
  const [showAIContextModal, setShowAIContextModal] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Charger les données
  useEffect(() => {
    if (user && activeTab === 'list') {
      fetchProspects();
      fetchStats();
    }
    if (user && activeTab === 'sequences') {
      fetchSavedSequences();
    }
    if (user && activeTab === 'scheduled-sequences') {
      fetchScheduledSequencesProspects();
    }
    if (user && activeTab === 'completed-sequences') {
      fetchCompletedSequencesProspects();
    }
  }, [user, page, sortBy, sortOrder, search, filterSource, filterEnrichment, filterAI, filterEmailing, activeTab]);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(search && { search }),
        ...(filterSource !== 'all' && { source: filterSource }),
        ...(filterEnrichment !== 'all' && { enrichment_status: filterEnrichment }),
        ...(filterAI !== 'all' && { ai_status: filterAI }),
        ...(filterEmailing !== 'all' && { emailing_status: filterEmailing }),
        // Dans l'onglet "list", filtrer automatiquement pour n'afficher que les prospects sans email
        ...(activeTab === 'list' && { has_sequences: 'false' }),
      });

      const response = await fetch(`${config.API_URL}/api/prospects?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setProspects(result.data.data || []);
        setTotal(result.data.total || 0);
        setTotalPages(result.data.total_pages || 0);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des prospects');
      }
    } catch (error: any) {
      console.error('Erreur chargement prospects:', error);
      toast.error('Erreur lors du chargement des prospects');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledSequencesProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(search && { search }),
        ...(filterSource !== 'all' && { source: filterSource }),
        ...(filterEnrichment !== 'all' && { enrichment_status: filterEnrichment }),
        ...(filterAI !== 'all' && { ai_status: filterAI }),
        ...(filterEmailing !== 'all' && { emailing_status: filterEmailing }),
      });

      const response = await fetch(`${config.API_URL}/api/prospects/scheduled-sequences?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setProspects(result.data.data || []);
        setTotal(result.data.total || 0);
        setTotalPages(result.data.total_pages || 0);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des prospects');
      }
    } catch (error: any) {
      console.error('Erreur chargement prospects avec séquences programmées:', error);
      toast.error('Erreur lors du chargement des prospects');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedSequencesProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(search && { search }),
        ...(filterSource !== 'all' && { source: filterSource }),
        ...(filterEnrichment !== 'all' && { enrichment_status: filterEnrichment }),
        ...(filterAI !== 'all' && { ai_status: filterAI }),
        ...(filterEmailing !== 'all' && { emailing_status: filterEmailing }),
      });

      const response = await fetch(`${config.API_URL}/api/prospects/completed-sequences?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setProspects(result.data.data || []);
        setTotal(result.data.total || 0);
        setTotalPages(result.data.total_pages || 0);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des prospects');
      }
    } catch (error: any) {
      console.error('Erreur chargement prospects avec séquences terminées:', error);
      toast.error('Erreur lors du chargement des prospects');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const response = await fetch(`${config.API_URL}/api/prospects/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const fetchProspectEmails = async (prospectId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
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
      console.error('Erreur chargement emails:', error);
    }
  };

  const fetchScheduledEmails = async (prospectId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
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

  const updateEmailDelay = async (emailId: string, delayDays: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
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
        if (selectedProspect) {
          await fetchScheduledEmails(selectedProspect.id);
        }
        setEditingDelayId(null);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour délai:', error);
      toast.error('Erreur lors de la mise à jour du délai');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleCreateProspect = async () => {
    if (!newProspect.email.trim()) {
      toast.error('L\'email est requis');
      return;
    }

    setCreatingProspect(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const response = await fetch(`${config.API_URL}/api/prospects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newProspect.email.trim(),
          source: 'manuel' as const,
          firstname: newProspect.firstname.trim() || undefined,
          lastname: newProspect.lastname.trim() || undefined,
          company_name: newProspect.company_name.trim() || undefined,
          siren: newProspect.siren.trim() || undefined,
          skip_enrichment: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Prospect créé avec succès');
        setShowCreateProspectModal(false);
        setNewProspect({
          email: '',
          firstname: '',
          lastname: '',
          company_name: '',
          siren: ''
        });
        await fetchProspects();
        await fetchStats();
      } else {
        toast.error(result.error || 'Erreur lors de la création du prospect');
      }
    } catch (error: any) {
      console.error('Erreur création prospect:', error);
      toast.error('Erreur lors de la création du prospect');
    } finally {
      setCreatingProspect(false);
    }
  };

  const handleProspectClick = async (prospect: Prospect) => {
    // Rediriger vers la synthèse de la séquence
    if (activeTab === 'scheduled-sequences' || activeTab === 'completed-sequences') {
      navigate(`/admin/prospection/sequence/${prospect.id}`);
    } else {
      setSelectedProspect(prospect);
      setShowDetails(true);
      await fetchProspectEmails(prospect.id);
      await fetchScheduledEmails(prospect.id);
    }
  };

  // Fonctions pour la programmation de séquences
  const fetchEmailTemplates = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      // Pour l'instant, on récupère les séquences existantes comme templates
      const response = await fetch(`${config.API_URL}/api/prospects/sequences/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Extraire les templates depuis les séquences
        const templates: any[] = [];
        result.data.forEach((seq: any) => {
          if (seq.prospect_email_sequence_steps) {
            seq.prospect_email_sequence_steps.forEach((step: any) => {
              templates.push({
                id: `${seq.id}-${step.id}`,
                name: `${seq.name} - Étape ${step.step_number}`,
                subject: step.subject,
                body: step.body
              });
            });
          }
        });
        setEmailTemplates(templates);
      }
    } catch (error: any) {
      console.error('Erreur chargement templates:', error);
    }
  };

  const getDefaultSequence = () => {
    return [
      {
        id: `step-1-${Date.now()}`,
        stepNumber: 1,
        delayDays: 0,
        subject: 'Premier contact',
        body: 'Bonjour,\n\nNous souhaiterions vous présenter nos services...'
      },
      {
        id: `step-2-${Date.now()}`,
        stepNumber: 2,
        delayDays: 3,
        subject: 'Relance - Premier contact',
        body: 'Bonjour,\n\nJe me permets de relancer concernant notre précédent échange...'
      },
      {
        id: `step-3-${Date.now()}`,
        stepNumber: 3,
        delayDays: 7,
        subject: 'Dernière relance',
        body: 'Bonjour,\n\nDernière tentative de contact...'
      }
    ];
  };

  const handleOpenSequenceModal = async () => {
    if (selectedProspectIds.size === 0) {
      toast.error('Veuillez sélectionner au moins un prospect');
      return;
    }
    
    await fetchEmailTemplates();
    await fetchSavedSequences();
    
    // Initialiser les configurations avec séquence par défaut
    const newConfigs = new Map();
    Array.from(selectedProspectIds).forEach((id) => {
      const prospect = prospects.find(p => p.id === id);
      newConfigs.set(id, {
        email: prospect?.email || '',
        steps: getDefaultSequence(),
        ready: false
      });
    });
    setSequenceConfigs(newConfigs);
    setCurrentProspectIndex(0);
    setShowSequenceModal(true);
  };

  const getCurrentProspect = () => {
    const selectedIds = Array.from(selectedProspectIds);
    if (selectedIds.length === 0 || currentProspectIndex >= selectedIds.length) return null;
    
    const prospectId = selectedIds[currentProspectIndex];
    return prospects.find(p => p.id === prospectId) || null;
  };

  const updateProspectEmail = (prospectId: string, newEmail: string) => {
    const updatedConfigs = new Map(sequenceConfigs);
    const config = updatedConfigs.get(prospectId);
    if (config) {
      updatedConfigs.set(prospectId, {
        ...config,
        email: newEmail
      });
      setSequenceConfigs(updatedConfigs);
    }
  };

  const addStepToSequence = (prospectId: string) => {
    const updatedConfigs = new Map(sequenceConfigs);
    const config = updatedConfigs.get(prospectId);
    if (config) {
      const maxStepNumber = config.steps.length > 0 
        ? Math.max(...config.steps.map(s => s.stepNumber))
        : 0;
      const lastDelay = config.steps.length > 0
        ? config.steps[config.steps.length - 1].delayDays
        : 0;
      
      config.steps.push({
        id: `step-${Date.now()}`,
        stepNumber: maxStepNumber + 1,
        delayDays: lastDelay + 3,
        subject: 'Nouvel email',
        body: 'Corps de l\'email...'
      });
      
      updatedConfigs.set(prospectId, config);
      setSequenceConfigs(updatedConfigs);
    }
  };

  const removeStepFromSequence = (prospectId: string, stepId: string) => {
    const updatedConfigs = new Map(sequenceConfigs);
    const config = updatedConfigs.get(prospectId);
    if (config && config.steps.length > 1) {
      config.steps = config.steps.filter(s => s.id !== stepId);
      // Réorganiser les numéros d'étapes
      config.steps.forEach((step, index) => {
        step.stepNumber = index + 1;
      });
      updatedConfigs.set(prospectId, config);
      setSequenceConfigs(updatedConfigs);
    } else {
      toast.error('Une séquence doit contenir au moins un email');
    }
  };

  const updateStep = (prospectId: string, stepId: string, field: string, value: any) => {
    const updatedConfigs = new Map(sequenceConfigs);
    const config = updatedConfigs.get(prospectId);
    if (config) {
      const stepIndex = config.steps.findIndex(s => s.id === stepId);
      if (stepIndex !== -1) {
        (config.steps[stepIndex] as any)[field] = value;
        updatedConfigs.set(prospectId, config);
        setSequenceConfigs(updatedConfigs);
      }
    }
  };

  const applyTemplateToStep = (prospectId: string, stepId: string, template: any) => {
    updateStep(prospectId, stepId, 'subject', template.subject);
    updateStep(prospectId, stepId, 'body', template.body);
    toast.success('Template appliqué');
  };

  const openAIContextModal = () => {
    const currentProspect = getCurrentProspect();
    if (!currentProspect) {
      toast.error('Aucun prospect sélectionné');
      return;
    }

    const config = sequenceConfigs.get(currentProspect.id);
    if (!config || config.steps.length === 0) {
      toast.error('Veuillez d\'abord ajouter au moins un email à la séquence');
      return;
    }

    // Réinitialiser le contexte et ouvrir le modal
    setAiContext('');
    setShowAIContextModal(true);
  };

  const generateAISequence = async () => {
    const currentProspect = getCurrentProspect();
    if (!currentProspect) {
      toast.error('Aucun prospect sélectionné');
      return;
    }

    const seqConfig = sequenceConfigs.get(currentProspect.id);
    if (!seqConfig || seqConfig.steps.length === 0) {
      toast.error('Veuillez d\'abord ajouter au moins un email à la séquence');
      return;
    }

    try {
      setGeneratingAI(true);
      setShowAIContextModal(false);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');

      // Préparer les informations du prospect
      const prospectInfo = {
        company_name: currentProspect.company_name,
        siren: currentProspect.siren,
        firstname: currentProspect.firstname,
        lastname: currentProspect.lastname,
        email: seqConfig.email || currentProspect.email
      };

      // Préparer les étapes avec leurs délais
      const steps = seqConfig.steps.map(step => ({
        stepNumber: step.stepNumber,
        delayDays: step.delayDays
      }));

      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-sequence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospectInfo,
          steps,
          context: aiContext.trim() || undefined // Envoyer undefined si vide
        })
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la génération par IA');
        return;
      }

      // Mettre à jour tous les sujets et corps des emails
      const updatedConfigs = new Map(sequenceConfigs);
      const updatedConfig = { ...seqConfig };

      result.data.steps.forEach((generatedStep: any) => {
        const stepIndex = updatedConfig.steps.findIndex(
          s => s.stepNumber === generatedStep.stepNumber
        );
        if (stepIndex !== -1) {
          updatedConfig.steps[stepIndex].subject = generatedStep.subject;
          updatedConfig.steps[stepIndex].body = generatedStep.body;
        }
      });

      updatedConfigs.set(currentProspect.id, updatedConfig);
      setSequenceConfigs(updatedConfigs);

      toast.success('Séquence générée par IA avec succès !');
      setAiContext(''); // Réinitialiser le contexte après génération
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error('Erreur lors de la génération par IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  const saveCurrentProspectSequence = () => {
    const currentProspect = getCurrentProspect();
    if (!currentProspect) return;

    const config = sequenceConfigs.get(currentProspect.id);
    if (!config || config.steps.length === 0) {
      toast.error('Veuillez configurer au moins un email dans la séquence');
      return;
    }

    if (!config.email || !config.email.includes('@')) {
      toast.error('Veuillez saisir un email valide');
      return;
    }

    const updatedConfigs = new Map(sequenceConfigs);
    updatedConfigs.set(currentProspect.id, {
      ...config,
      ready: true
    });
    setSequenceConfigs(updatedConfigs);
    toast.success('Séquence enregistrée pour ce prospect');
  };

  const scheduleAllSequences = async (startNow: boolean = false) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      const readyConfigs = Array.from(sequenceConfigs.entries()).filter(([_, config]) => config.ready);
      
      if (readyConfigs.length === 0) {
        toast.error('Aucune séquence configurée');
        return;
      }

      let globalStartDate: string | undefined;
      if (!startNow) {
        if (!schedulingDate || !schedulingTime) {
          toast.error('Veuillez sélectionner une date et une heure');
          return;
        }
        globalStartDate = new Date(`${schedulingDate}T${schedulingTime}`).toISOString();
      } else {
        globalStartDate = new Date().toISOString();
      }

      setSendingEmails(true);
      let successCount = 0;
      let errorCount = 0;

      for (const [prospectId, seqConfig] of readyConfigs) {
        try {
          // Utiliser toujours la date globale (startDate retiré)
          const startDate = globalStartDate!;

          // Calculer les dates d'envoi
          const scheduledEmails: any[] = [];
          let currentDate = new Date(startDate);

          for (const step of seqConfig.steps.sort((a, b) => a.stepNumber - b.stepNumber)) {
            if (step.stepNumber > 1) {
              currentDate = new Date(currentDate.getTime() + (step.delayDays * 24 * 60 * 60 * 1000));
            }

            scheduledEmails.push({
              prospect_id: prospectId,
              step_number: step.stepNumber,
              subject: step.subject,
              body: step.body,
              scheduled_for: currentDate.toISOString(),
              status: 'scheduled'
            });
          }

          // Insérer directement dans la table prospect_email_scheduled
          const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/schedule-custom-sequence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: seqConfig.email,
              scheduled_emails: scheduledEmails
            })
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Erreur pour prospect ${prospectId}:`, result.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`Erreur pour prospect ${prospectId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} séquence(s) programmée(s) avec succès`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} erreur(s) lors de la programmation`);
      }

      setShowSequenceModal(false);
      setSequenceConfigs(new Map());
      await fetchProspects();
    } catch (error: any) {
      console.error('Erreur programmation séquences:', error);
      toast.error('Erreur lors de la programmation des séquences');
    } finally {
      setSendingEmails(false);
    }
  };

  // Fonctions pour la gestion des séquences sauvegardées
  const fetchSavedSequences = async () => {
    try {
      setLoadingSequences(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const response = await fetch(`${config.API_URL}/api/prospects/sequences/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setSavedSequences(result.data || []);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des séquences');
      }
    } catch (error: any) {
      console.error('Erreur chargement séquences:', error);
      toast.error('Erreur lors du chargement des séquences');
    } finally {
      setLoadingSequences(false);
    }
  };

  const handleCreateSequence = () => {
    setEditingSequence(null);
    setSequenceForm({
      name: '',
      description: '',
      steps: [
        { stepNumber: 1, delayDays: 0, subject: '', body: '' },
        { stepNumber: 2, delayDays: 3, subject: '', body: '' },
        { stepNumber: 3, delayDays: 7, subject: '', body: '' }
      ]
    });
    setShowSequenceForm(true);
  };

  const handleEditSequence = (sequence: any) => {
    setEditingSequence(sequence);
    setSequenceForm({
      name: sequence.name,
      description: sequence.description || '',
      steps: (sequence.prospect_email_sequence_steps || [])
        .sort((a: any, b: any) => a.step_number - b.step_number)
        .map((step: any) => ({
          stepNumber: step.step_number,
          delayDays: step.delay_days,
          subject: step.subject,
          body: step.body
        }))
    });
    setShowSequenceForm(true);
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séquence ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const response = await fetch(`${config.API_URL}/api/prospects/sequences/${sequenceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Séquence supprimée avec succès');
        await fetchSavedSequences();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression séquence:', error);
      toast.error('Erreur lors de la suppression de la séquence');
    }
  };

  // Fonctions pour gérer les séquences en cours/terminées
  const handlePauseSequence = async (prospectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Rediriger vers la synthèse où l'utilisateur pourra suspendre
    navigate(`/admin/prospection/sequence/${prospectId}`);
  };

  const handleResumeSequence = async (prospectId: string) => {
    try {
      setIsPausingSequence(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
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
        if (activeTab === 'scheduled-sequences') {
          await fetchScheduledSequencesProspects();
        }
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

  const handleOpenEditSequenceModal = async (prospect: Prospect, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Rediriger vers la synthèse où l'utilisateur pourra modifier
    navigate(`/admin/prospection/sequence/${prospect.id}`);
  };

  const handleRestartSequence = async (prospect: Prospect, scheduledEmails?: any[]) => {
    try {
      setIsRestartingSequence(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      // Si des emails modifiés sont fournis, les utiliser, sinon récupérer les emails existants
      let emailsToSchedule = scheduledEmails;
      if (!emailsToSchedule) {
        const response = await fetch(`${config.API_URL}/api/prospects/${prospect.id}/scheduled-emails`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        if (result.success) {
          // Utiliser les emails envoyés comme base pour la relance
          const sentEmails = (result.data || []).filter((email: any) => email.status === 'sent');
          emailsToSchedule = sentEmails.map((email: any) => ({
            step_number: email.step_number,
            subject: email.subject,
            body: email.body,
            scheduled_for: new Date(Date.now() + (email.step_number * 3 * 24 * 60 * 60 * 1000)).toISOString(),
            status: 'scheduled'
          }));
        }
      }

      if (!emailsToSchedule || emailsToSchedule.length === 0) {
        toast.error('Aucun email à relancer');
        return;
      }

      const restartResponse = await fetch(`${config.API_URL}/api/prospects/${prospect.id}/restart-sequence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_emails: emailsToSchedule
        })
      });

      const restartResult = await restartResponse.json();
      
      if (restartResult.success) {
        toast.success(`Séquence relancée (${restartResult.data.scheduled_count} email(s) programmé(s))`);
        setShowEditSequenceModal(false);
        if (activeTab === 'completed-sequences') {
          await fetchCompletedSequencesProspects();
        }
      } else {
        toast.error(restartResult.error || 'Erreur lors de la relance');
      }
    } catch (error: any) {
      console.error('Erreur relance séquence:', error);
      toast.error('Erreur lors de la relance de la séquence');
    } finally {
      setIsRestartingSequence(false);
    }
  };

  const addStepToForm = () => {
    const maxStepNumber = sequenceForm.steps.length > 0 
      ? Math.max(...sequenceForm.steps.map(s => s.stepNumber))
      : 0;
    const lastDelay = sequenceForm.steps.length > 0
      ? sequenceForm.steps[sequenceForm.steps.length - 1].delayDays
      : 0;
    
    setSequenceForm({
      ...sequenceForm,
      steps: [
        ...sequenceForm.steps,
        {
          stepNumber: maxStepNumber + 1,
          delayDays: lastDelay + 3,
          subject: '',
          body: ''
        }
      ]
    });
  };

  const removeStepFromForm = (stepNumber: number) => {
    if (sequenceForm.steps.length <= 1) {
      toast.error('Une séquence doit contenir au moins un email');
      return;
    }
    
    setSequenceForm({
      ...sequenceForm,
      steps: sequenceForm.steps
        .filter(s => s.stepNumber !== stepNumber)
        .map((step, index) => ({
          ...step,
          stepNumber: index + 1
        }))
    });
  };

  const updateStepInForm = (stepNumber: number, field: string, value: any) => {
    setSequenceForm({
      ...sequenceForm,
      steps: sequenceForm.steps.map(step =>
        step.stepNumber === stepNumber
          ? { ...step, [field]: value }
          : step
      )
    });
  };

  const saveSequence = async () => {
    if (!sequenceForm.name || sequenceForm.name.trim() === '') {
      toast.error('Veuillez saisir un nom pour la séquence');
      return;
    }

    if (sequenceForm.steps.length === 0) {
      toast.error('Veuillez ajouter au moins un email à la séquence');
      return;
    }

    for (const step of sequenceForm.steps) {
      if (!step.subject || !step.body) {
        toast.error('Veuillez remplir le sujet et le corps de tous les emails');
        return;
      }
    }

    try {
      setLoadingSequences(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      const payload = {
        name: sequenceForm.name,
        description: sequenceForm.description,
        steps: sequenceForm.steps.map(step => ({
          step_number: step.stepNumber,
          delay_days: step.delayDays,
          subject: step.subject,
          body: step.body
        }))
      };

      let response;
      if (editingSequence) {
        response = await fetch(`${config.API_URL}/api/prospects/sequences/${editingSequence.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${config.API_URL}/api/prospects/sequences`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(editingSequence ? 'Séquence mise à jour avec succès' : 'Séquence créée avec succès');
        setShowSequenceForm(false);
        await fetchSavedSequences();
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde séquence:', error);
      toast.error('Erreur lors de la sauvegarde de la séquence');
    } finally {
      setLoadingSequences(false);
    }
  };

  const applySequenceToProspect = (sequence: any) => {
    const currentProspect = getCurrentProspect();
    if (!currentProspect) {
      toast.error('Aucun prospect sélectionné');
      return;
    }

    const steps = (sequence.prospect_email_sequence_steps || [])
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((step: any) => ({
        id: `step-${step.id}-${Date.now()}`,
        stepNumber: step.step_number,
        delayDays: step.delay_days,
        subject: step.subject,
        body: step.body
      }));

    const updatedConfigs = new Map(sequenceConfigs);
    updatedConfigs.set(currentProspect.id, {
      email: currentProspect.email,
      steps: steps,
      ready: true
    });
    
    setSequenceConfigs(updatedConfigs);
    toast.success(`Séquence "${sequence.name}" appliquée au prospect`);
  };

  const getStatusBadge = (status: string, type: 'enrichment' | 'ai' | 'emailing') => {
    const colors = {
      enrichment: {
        pending: 'bg-gray-100 text-gray-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800'
      },
      ai: {
        pending: 'bg-gray-100 text-gray-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800'
      },
      emailing: {
        pending: 'bg-gray-100 text-gray-800',
        queued: 'bg-yellow-100 text-yellow-800',
        sent: 'bg-blue-100 text-blue-800',
        opened: 'bg-purple-100 text-purple-800',
        clicked: 'bg-indigo-100 text-indigo-800',
        replied: 'bg-green-100 text-green-800',
        bounced: 'bg-red-100 text-red-800',
        unsubscribed: 'bg-red-100 text-red-800'
      }
    };

    const labels = {
      enrichment: {
        pending: '⏳ En attente',
        in_progress: '🔄 En cours',
        completed: '✅ Complété',
        failed: '❌ Échec'
      },
      ai: {
        pending: '⏳ En attente',
        in_progress: '🔄 En cours',
        completed: '✅ Complété',
        failed: '❌ Échec'
      },
      emailing: {
        pending: '⏳ En attente',
        queued: '📬 En file',
        sent: '📧 Envoyé',
        opened: '👁️ Ouvert',
        clicked: '👆 Cliqué',
        replied: '💬 Répondu',
        bounced: '📉 Bounced',
        unsubscribed: '🚫 Désabonné'
      }
    };

    return (
      <Badge className={cn("text-xs", colors[type][status as keyof typeof colors[typeof type]] || 'bg-gray-100 text-gray-800')}>
        {labels[type][status as keyof typeof labels[typeof type]] || status}
      </Badge>
    );
  };

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={cn("cursor-pointer hover:bg-gray-50 select-none", className)} onClick={() => handleSort(field)}>
      <div className="flex items-center gap-2">
        {children}
        {sortBy === field ? (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </TableHead>
  );

  if (loading && prospects.length === 0 && activeTab === 'list') {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospection</h1>
          <p className="text-gray-500 mt-1">Gestion des prospects et suivi des emailings</p>
        </div>
        {activeTab === 'list' && (
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                setCheckingGmail(true);
                try {
                  const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
                  
                  const response = await fetch(`${config.API_URL}/api/gmail/check-replies`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      since_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                    })
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success(
                      `${result.data.updated} réponse(s) détectée(s) et mise(s) à jour sur ${result.data.processed} email(s) traité(s)`
                    );
                    if (result.data.errors && result.data.errors.length > 0) {
                      toast.warning(`${result.data.errors.length} erreur(s) lors du traitement`);
                    }
                    // Actualiser les données
                    await fetchProspects();
                    if (selectedProspect) {
                      await fetchProspectEmails(selectedProspect.id);
                    }
                  } else {
                    toast.error(result.error || 'Erreur lors de la vérification Gmail');
                  }
                } catch (error: any) {
                  console.error('Erreur vérification Gmail:', error);
                  toast.error('Erreur lors de la vérification des réponses Gmail');
                } finally {
                  setCheckingGmail(false);
                }
              }}
              variant="outline"
              size="sm"
              disabled={checkingGmail}
            >
              {checkingGmail ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Vérifier réponses Gmail
                </>
              )}
            </Button>
            <Button onClick={fetchProspects} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSearchParams({ tab: 'list' })}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'list'
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Liste des Prospects
            </div>
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'import' })}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'import'
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Prospects
            </div>
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'scheduled-sequences' })}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'scheduled-sequences'
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Séquences programmées
            </div>
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'completed-sequences' })}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'completed-sequences'
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Séquences terminées
            </div>
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'sequences' })}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'sequences'
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-2">
              <MailIcon className="h-4 w-4" />
              Options séquences
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'import' ? (
        <ImportProspects />
      ) : activeTab === 'scheduled-sequences' || activeTab === 'completed-sequences' ? (
        <>
          {/* Statistiques */}
          {stats && activeTab === 'scheduled-sequences' && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">
                  Prospects avec des séquences programmées à venir ou en cours d'envoi
                </p>
              </CardContent>
            </Card>
          )}
          {stats && activeTab === 'completed-sequences' && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">
                  Prospects qui ont envoyé le dernier mail de leur séquence
                </p>
              </CardContent>
            </Card>
          )}

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSource} onValueChange={(value) => { setFilterSource(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sources</SelectItem>
                    <SelectItem value="google_maps">Google Maps</SelectItem>
                    <SelectItem value="import_csv">Import CSV</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="manuel">Manuel</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterEnrichment} onValueChange={(value) => { setFilterEnrichment(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Enrichissement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="failed">Échec</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAI} onValueChange={(value) => { setFilterAI(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="failed">Échec</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterEmailing} onValueChange={(value) => { setFilterEmailing(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Emailing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="queued">En file</SelectItem>
                    <SelectItem value="sent">Envoyé</SelectItem>
                    <SelectItem value="opened">Ouvert</SelectItem>
                    <SelectItem value="clicked">Cliqué</SelectItem>
                    <SelectItem value="replied">Répondu</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                    <SelectItem value="unsubscribed">Désabonné</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tableau */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {activeTab === 'scheduled-sequences' 
                  ? 'Séquences programmées' 
                  : 'Séquences terminées'} ({total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={prospects.length > 0 && prospects.every(p => selectedProspectIds.has(p.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProspectIds(new Set(prospects.map(p => p.id)));
                            } else {
                              setSelectedProspectIds(new Set());
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <SortableHeader field="email" className="min-w-[200px]">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email
                      </SortableHeader>
                      <SortableHeader field="firstname" className="min-w-[150px]">
                        <User className="h-4 w-4 inline mr-2" />
                        Contact
                      </SortableHeader>
                      <SortableHeader field="company_name" className="min-w-[180px]">
                        <Building2 className="h-4 w-4 inline mr-2" />
                        Entreprise
                      </SortableHeader>
                      <SortableHeader field="enrichment_status" className="w-[120px]">
                        Enrichissement
                      </SortableHeader>
                      <SortableHeader field="ai_status" className="w-[100px]">
                        IA
                      </SortableHeader>
                      <SortableHeader field="emailing_status" className="w-[120px]">
                        Emailing
                      </SortableHeader>
                      <SortableHeader field="score_priority" className="w-[120px]">
                        <TrendingUp className="h-4 w-4 inline mr-2" />
                        Priorité
                      </SortableHeader>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          {loading ? 'Chargement...' : 'Aucun prospect trouvé'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      prospects.map((prospect) => (
                        <TableRow key={prospect.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleProspectClick(prospect)}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedProspectIds.has(prospect.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newSet = new Set(selectedProspectIds);
                                if (e.target.checked) {
                                  newSet.add(prospect.id);
                                } else {
                                  newSet.delete(prospect.id);
                                }
                                setSelectedProspectIds(newSet);
                              }}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{prospect.email}</span>
                              {prospect.email_validity === 'valid' && (
                                <Badge className="bg-green-100 text-green-800 text-xs">✓ Valid</Badge>
                              )}
                              {prospect.email_validity === 'risky' && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠ Risky</Badge>
                              )}
                              {prospect.email_validity === 'invalid' && (
                                <Badge className="bg-red-100 text-red-800 text-xs">✗ Invalid</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {prospect.firstname || prospect.lastname ? (
                              <div>
                                <div className="font-medium">
                                  {prospect.firstname} {prospect.lastname}
                                </div>
                                {prospect.job_title && (
                                  <div className="text-sm text-gray-500">{prospect.job_title}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {prospect.company_name ? (
                              <div>
                                <div className="font-medium">{prospect.company_name}</div>
                                {prospect.siren && (
                                  <div className="text-sm text-gray-500">SIREN: {prospect.siren}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(prospect.enrichment_status, 'enrichment')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(prospect.ai_status, 'ai')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(prospect.emailing_status, 'emailing')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{prospect.score_priority}</span>
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
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {activeTab === 'scheduled-sequences' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handlePauseSequence(prospect.id, e)}
                                    disabled={isPausingSequence}
                                    title="Suspendre la séquence"
                                  >
                                    <Pause className="h-4 w-4 text-yellow-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleOpenEditSequenceModal(prospect, e)}
                                    title="Modifier la séquence"
                                  >
                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </>
                              )}
                              {activeTab === 'completed-sequences' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleOpenEditSequenceModal(prospect, e)}
                                    title="Modifier et relancer"
                                  >
                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestartSequence(prospect);
                                    }}
                                    disabled={isRestartingSequence}
                                    title="Relancer la séquence"
                                  >
                                    <RotateCcw className="h-4 w-4 text-green-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {totalPages} ({total} prospects)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : activeTab === 'sequences' ? (
        <div className="space-y-6">
          {/* En-tête avec bouton créer */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Séquences d'emails</h2>
              <p className="text-gray-500 mt-1">Gérez vos séquences d'emails réutilisables</p>
            </div>
            <Button onClick={handleCreateSequence}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une séquence
            </Button>
          </div>

          {/* Liste des séquences */}
          {loadingSequences ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Chargement des séquences...</span>
            </div>
          ) : savedSequences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MailIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune séquence enregistrée</p>
                <Button onClick={handleCreateSequence}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre première séquence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSequences.map((sequence) => (
                <Card key={sequence.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{sequence.name}</CardTitle>
                        {sequence.description && (
                          <p className="text-sm text-gray-500 mt-1">{sequence.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSequence(sequence)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSequence(sequence.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">
                          {sequence.prospect_email_sequence_steps?.length || 0} email{sequence.prospect_email_sequence_steps?.length > 1 ? 's' : ''}
                        </div>
                        {sequence.prospects_count !== undefined && sequence.prospects_count > 0 && (
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {sequence.prospects_count} prospect{sequence.prospects_count > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {sequence.prospect_email_sequence_steps
                          ?.sort((a: any, b: any) => a.step_number - b.step_number)
                          .map((step: any) => (
                            <div key={step.id} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="font-medium">Étape {step.step_number}</div>
                              <div className="text-gray-600 truncate">{step.subject}</div>
                              <div className="text-gray-500">
                                Délai: {step.delay_days} jour{step.delay_days > 1 ? 's' : ''}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Prospects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_prospects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Enrichis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enriched_count}</div>
              <div className="text-xs text-gray-500">
                {stats.total_prospects > 0 ? Math.round((stats.enriched_count / stats.total_prospects) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">IA Traités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ai_processed_count}</div>
              <div className="text-xs text-gray-500">
                {stats.enriched_count > 0 ? Math.round((stats.ai_processed_count / stats.enriched_count) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Emails Envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emails_sent_count}</div>
              <div className="text-xs text-gray-500">
                Taux réponse: {stats.reply_rate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={filterSource} onValueChange={(value) => { setFilterSource(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="google_maps">Google Maps</SelectItem>
                <SelectItem value="import_csv">Import CSV</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="manuel">Manuel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEnrichment} onValueChange={(value) => { setFilterEnrichment(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Enrichissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAI} onValueChange={(value) => { setFilterAI(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="IA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEmailing} onValueChange={(value) => { setFilterEmailing(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Emailing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="queued">En file</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="opened">Ouvert</SelectItem>
                <SelectItem value="clicked">Cliqué</SelectItem>
                <SelectItem value="replied">Répondu</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="unsubscribed">Désabonné</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'actions pour sélection */}
      {selectedProspectIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium text-blue-900">
                  {selectedProspectIds.size} prospect{selectedProspectIds.size > 1 ? 's' : ''} sélectionné{selectedProspectIds.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProspectIds(new Set())}
                >
                  Tout désélectionner
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenSequenceModal}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer la séquence ({selectedProspectIds.size})
                </Button>
                <Button
                  onClick={() => setShowSendEmailModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email ({selectedProspectIds.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Liste des Prospects ({total})</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Les prospects qui n'ont reçu aucun mail</p>
            </div>
            <Button
              onClick={() => setShowCreateProspectModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium px-6 py-2.5 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un prospect
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={prospects.length > 0 && prospects.every(p => selectedProspectIds.has(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProspectIds(new Set(prospects.map(p => p.id)));
                        } else {
                          setSelectedProspectIds(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <SortableHeader field="email" className="min-w-[200px]">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </SortableHeader>
                  <SortableHeader field="firstname" className="min-w-[150px]">
                    <User className="h-4 w-4 inline mr-2" />
                    Contact
                  </SortableHeader>
                  <SortableHeader field="company_name" className="min-w-[180px]">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Entreprise
                  </SortableHeader>
                  <SortableHeader field="enrichment_status" className="w-[120px]">
                    Enrichissement
                  </SortableHeader>
                  <SortableHeader field="ai_status" className="w-[100px]">
                    IA
                  </SortableHeader>
                  <SortableHeader field="emailing_status" className="w-[120px]">
                    Emailing
                  </SortableHeader>
                  <SortableHeader field="score_priority" className="w-[120px]">
                    <TrendingUp className="h-4 w-4 inline mr-2" />
                    Priorité
                  </SortableHeader>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Aucun prospect trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  prospects.map((prospect) => (
                    <TableRow key={prospect.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleProspectClick(prospect)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedProspectIds.has(prospect.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newSet = new Set(selectedProspectIds);
                            if (e.target.checked) {
                              newSet.add(prospect.id);
                            } else {
                              newSet.delete(prospect.id);
                            }
                            setSelectedProspectIds(newSet);
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{prospect.email}</span>
                          {prospect.email_validity === 'valid' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓ Valid</Badge>
                          )}
                          {prospect.email_validity === 'risky' && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠ Risky</Badge>
                          )}
                          {prospect.email_validity === 'invalid' && (
                            <Badge className="bg-red-100 text-red-800 text-xs">✗ Invalid</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {prospect.firstname || prospect.lastname ? (
                          <div>
                            <div className="font-medium">
                              {prospect.firstname} {prospect.lastname}
                            </div>
                            {prospect.job_title && (
                              <div className="text-sm text-gray-500">{prospect.job_title}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {prospect.company_name ? (
                          <div>
                            <div className="font-medium">{prospect.company_name}</div>
                            {prospect.siren && (
                              <div className="text-sm text-gray-500">SIREN: {prospect.siren}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(prospect.enrichment_status, 'enrichment')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(prospect.ai_status, 'ai')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(prospect.emailing_status, 'emailing')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prospect.score_priority}</span>
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
                      </TableCell>
                      <TableCell>
                        {/* Le clic sur la ligne gère déjà l'ouverture des détails */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} sur {totalPages} ({total} prospects)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Prospect</DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <div className="space-y-6">
              {/* Informations Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📧 Informations Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Email:</strong> {selectedProspect.email}</div>
                  <div><strong>Validité:</strong> {selectedProspect.email_validity || 'Non vérifiée'}</div>
                  <div><strong>Prénom:</strong> {selectedProspect.firstname || '-'}</div>
                  <div><strong>Nom:</strong> {selectedProspect.lastname || '-'}</div>
                  <div><strong>Poste:</strong> {selectedProspect.job_title || '-'}</div>
                  <div><strong>LinkedIn:</strong> {selectedProspect.linkedin_profile || '-'}</div>
                  <div><strong>Téléphone:</strong> {selectedProspect.phone_direct || '-'}</div>
                </CardContent>
              </Card>

              {/* Informations Entreprise */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏢 Informations Entreprise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Nom:</strong> {selectedProspect.company_name || '-'}</div>
                  <div><strong>Site web:</strong> {selectedProspect.company_website || '-'}</div>
                  <div><strong>SIREN:</strong> {selectedProspect.siren || '-'}</div>
                  <div><strong>Adresse:</strong> {selectedProspect.adresse || '-'}</div>
                  <div><strong>Ville:</strong> {selectedProspect.city || '-'}</div>
                  <div><strong>Code postal:</strong> {selectedProspect.postal_code || '-'}</div>
                  <div><strong>NAF:</strong> {selectedProspect.naf_code} - {selectedProspect.naf_label || '-'}</div>
                  <div><strong>Effectif:</strong> {selectedProspect.employee_range || '-'}</div>
                </CardContent>
              </Card>

              {/* Statuts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Statuts & Workflow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Enrichissement:</strong> {getStatusBadge(selectedProspect.enrichment_status, 'enrichment')}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>IA:</strong> {getStatusBadge(selectedProspect.ai_status, 'ai')}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Emailing:</strong> {getStatusBadge(selectedProspect.emailing_status, 'emailing')}
                  </div>
                  <div><strong>Score priorité:</strong> {selectedProspect.score_priority}/100</div>
                </CardContent>
              </Card>

              {/* Analyse IA */}
              {selectedProspect.ai_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🤖 Analyse IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <strong>Résumé:</strong>
                      <p className="mt-2 text-sm text-gray-700">{selectedProspect.ai_summary}</p>
                    </div>
                    {selectedProspect.ai_trigger_points && (
                      <div>
                        <strong>Points d'accroche:</strong>
                        <p className="mt-2 text-sm text-gray-700">{selectedProspect.ai_trigger_points}</p>
                      </div>
                    )}
                    {selectedProspect.ai_product_match && (
                      <div>
                        <strong>Produits correspondants:</strong>
                        <div className="mt-2 space-y-1">
                          {Object.entries(selectedProspect.ai_product_match).map(([product, score]: [string, any]) => (
                            <div key={product} className="text-sm">
                              • {product}: {Math.round(score * 100)}%
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Email personnalisé */}
              {selectedProspect.ai_email_personalized && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📧 Email Personnalisé (IA)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedProspect.ai_email_personalized}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Emails Programmés */}
              {scheduledEmails.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📅 Emails Programmés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scheduledEmails.map((scheduled) => (
                        <div key={scheduled.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Étape #{scheduled.step_number}</div>
                            <Badge className={
                              scheduled.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              scheduled.status === 'sent' ? 'bg-green-100 text-green-800' :
                              scheduled.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {scheduled.status === 'scheduled' ? '📅 Programmé' :
                               scheduled.status === 'sent' ? '✅ Envoyé' :
                               scheduled.status === 'cancelled' ? '❌ Annulé' :
                               scheduled.status}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium mb-1">{scheduled.subject}</div>
                          <div className="text-xs text-gray-500 mb-2">
                            Programmé pour le {new Date(scheduled.scheduled_for).toLocaleString('fr-FR')}
                          </div>
                          {scheduled.status === 'scheduled' && (
                            <div className="flex items-center gap-2 mt-2">
                              <Label className="text-xs">Délai (jours):</Label>
                              {editingDelayId === scheduled.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={delayValue}
                                    onChange={(e) => setDelayValue(parseInt(e.target.value) || 0)}
                                    className="w-20 h-8 text-sm"
                                    min="0"
                                  />
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
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {scheduled.delay_days_override !== null && scheduled.delay_days_override !== undefined
                                      ? scheduled.delay_days_override
                                      : 'Par défaut'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingDelayId(scheduled.id);
                                      setDelayValue(scheduled.delay_days_override || 0);
                                    }}
                                    className="h-8 text-xs"
                                  >
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
                  </CardContent>
                </Card>
              )}

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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Envoi Email */}
      <Dialog open={showSendEmailModal} onOpenChange={setShowSendEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer un email à {selectedProspectIds.size} prospect{selectedProspectIds.size > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Sujet *</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Sujet de l'email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email-body">Corps de l'email *</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Corps de l'email (HTML supporté)"
                className="mt-1 min-h-[200px]"
              />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                L'email sera envoyé à {selectedProspectIds.size} prospect{selectedProspectIds.size > 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSendEmailModal(false);
                    setEmailSubject('');
                    setEmailBody('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    if (!emailSubject || !emailBody) {
                      toast.error('Veuillez remplir le sujet et le corps de l\'email');
                      return;
                    }

                    setSendingEmails(true);
                    try {
                      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
                      
                      const response = await fetch(`${config.API_URL}/api/prospects/send-bulk`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          prospect_ids: Array.from(selectedProspectIds),
                          subject: emailSubject,
                          body: emailBody
                        })
                      });

                      const result = await response.json();
                      
                      if (result.success) {
                        toast.success(`${result.sent} email(s) envoyé(s) avec succès`);
                        if (result.failed > 0) {
                          toast.warning(`${result.failed} email(s) ont échoué`);
                        }
                        setShowSendEmailModal(false);
                        setEmailSubject('');
                        setEmailBody('');
                        setSelectedProspectIds(new Set());
                        await fetchProspects();
                      } else {
                        toast.error(result.error || 'Erreur lors de l\'envoi');
                      }
                    } catch (error: any) {
                      console.error('Erreur envoi emails:', error);
                      toast.error('Erreur lors de l\'envoi des emails');
                    } finally {
                      setSendingEmails(false);
                    }
                  }}
                  disabled={sendingEmails || !emailSubject || !emailBody}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendingEmails ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Programmation de Séquence */}
      <Dialog open={showSequenceModal} onOpenChange={setShowSequenceModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programmer les séquences d'emails</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Navigation et prospect actuel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Prospect {currentProspectIndex + 1} sur {selectedProspectIds.size}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentProspectIndex(Math.max(0, currentProspectIndex - 1))}
                      disabled={currentProspectIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentProspectIndex(Math.min(selectedProspectIds.size - 1, currentProspectIndex + 1))}
                      disabled={currentProspectIndex >= selectedProspectIds.size - 1}
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {getCurrentProspect() && (() => {
                  const prospect = getCurrentProspect()!;
                  const config = sequenceConfigs.get(prospect.id) || {
                    email: prospect.email,
                    steps: getDefaultSequence(),
                    ready: false
                  };
                  
                  return (
                    <div className="space-y-4">
                      {/* Info prospect avec édition email */}
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div>
                          <Label htmlFor="prospect-email">Email du prospect *</Label>
                          <Input
                            id="prospect-email"
                            type="email"
                            value={config.email}
                            onChange={(e) => updateProspectEmail(prospect.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        {(prospect.firstname || prospect.lastname) && (
                          <div className="text-sm text-gray-600">
                            {prospect.firstname} {prospect.lastname}
                          </div>
                        )}
                        {prospect.company_name && (
                          <div className="text-sm text-gray-600">{prospect.company_name}</div>
                        )}
                      </div>

                      {/* Charger une séquence sauvegardée */}
                      {savedSequences.length > 0 && (
                        <div>
                          <Label>Charger une séquence sauvegardée</Label>
                          <div className="mt-2 space-y-2">
                            {savedSequences.map((sequence) => (
                              <Button
                                key={sequence.id}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => applySequenceToProspect(sequence)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                <div className="flex-1 text-left">
                                  <div className="font-medium">{sequence.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {sequence.prospect_email_sequence_steps?.length || 0} email{sequence.prospect_email_sequence_steps?.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Liste des emails de la séquence */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">Emails de la séquence</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={openAIContextModal}
                              disabled={generatingAI || config.steps.length === 0}
                              className="bg-purple-50 hover:bg-purple-100 border-purple-300"
                            >
                              {generatingAI ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  Génération...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  Générer par IA
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addStepToSequence(prospect.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter un email
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {config.steps.sort((a, b) => a.stepNumber - b.stepNumber).map((step, index) => (
                            <Card key={step.id} className="border-2">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">Étape {step.stepNumber}</Badge>
                                    {index === 0 ? (
                                      <span className="text-xs text-gray-500">Envoi initial</span>
                                    ) : (
                                      <span className="text-xs text-gray-500">
                                        Relance après {step.delayDays} jour{step.delayDays > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  {config.steps.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeStepFromSequence(prospect.id, step.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {/* Délai */}
                                {index > 0 && (
                                  <div>
                                    <Label>Délai depuis l'email précédent (jours) *</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={step.delayDays}
                                      onChange={(e) => updateStep(prospect.id, step.id, 'delayDays', parseInt(e.target.value) || 0)}
                                      className="mt-1"
                                    />
                                  </div>
                                )}

                                {/* Templates */}
                                {emailTemplates.length > 0 && (
                                  <div>
                                    <Label>Appliquer un template</Label>
                                    <Select
                                      onValueChange={(value) => {
                                        const template = emailTemplates.find(t => t.id === value);
                                        if (template) {
                                          applyTemplateToStep(prospect.id, step.id, template);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Sélectionner un template" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {emailTemplates.map((template) => (
                                          <SelectItem key={template.id} value={template.id}>
                                            <FileText className="h-3 w-3 inline mr-2" />
                                            {template.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {/* Sujet */}
                                <div>
                                  <Label>Sujet de l'email *</Label>
                                  <Input
                                    value={step.subject}
                                    onChange={(e) => updateStep(prospect.id, step.id, 'subject', e.target.value)}
                                    placeholder="Sujet de l'email"
                                    className="mt-1"
                                  />
                                </div>

                                {/* Corps */}
                                <div>
                                  <Label>Corps de l'email *</Label>
                                  <Textarea
                                    value={step.body}
                                    onChange={(e) => updateStep(prospect.id, step.id, 'body', e.target.value)}
                                    placeholder="Corps de l'email"
                                    className="mt-1 min-h-[150px]"
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Bouton enregistrer */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {config.ready ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Prêt</span>
                            </>
                          ) : (
                            <>
                              <Circle className="h-5 w-5 text-gray-400" />
                              <span className="text-sm text-gray-500">Non configuré</span>
                            </>
                          )}
                        </div>
                        <Button
                          onClick={saveCurrentProspectSequence}
                          disabled={config.steps.length === 0}
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer cette séquence
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Liste récapitulative */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Récapitulatif ({Array.from(sequenceConfigs.values()).filter(c => c.ready).length} / {selectedProspectIds.size} prêts)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Array.from(selectedProspectIds).map((id, index) => {
                    const prospect = prospects.find(p => p.id === id);
                    const config = sequenceConfigs.get(id);
                    if (!prospect) return null;
                    
                    return (
                      <div
                        key={id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded border cursor-pointer",
                          index === currentProspectIndex ? "bg-blue-50 border-blue-300" : "bg-gray-50",
                          config?.ready ? "border-green-300" : ""
                        )}
                        onClick={() => setCurrentProspectIndex(index)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {config?.ready ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">{config?.email || prospect.email}</span>
                          {config && (
                            <span className="text-xs text-gray-500">
                              - {config.steps.length} email{config.steps.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions finales */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {Array.from(sequenceConfigs.values()).filter(c => c.ready).length} prospect{Array.from(sequenceConfigs.values()).filter(c => c.ready).length > 1 ? 's' : ''} prêt{Array.from(sequenceConfigs.values()).filter(c => c.ready).length > 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSequenceModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => scheduleAllSequences(true)}
                  disabled={Array.from(sequenceConfigs.values()).filter(c => c.ready).length === 0 || sendingEmails}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer le mailing maintenant
                </Button>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={schedulingDate}
                    onChange={(e) => setSchedulingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-40"
                    placeholder="jj/mm/aaaa"
                  />
                  <Input
                    type="time"
                    value={schedulingTime}
                    onChange={(e) => setSchedulingTime(e.target.value)}
                    className="w-32"
                    placeholder="--:--"
                  />
                  <Button
                    onClick={() => scheduleAllSequences(false)}
                    disabled={Array.from(sequenceConfigs.values()).filter(c => c.ready).length === 0 || sendingEmails || !schedulingDate || !schedulingTime}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Envoyer plus tard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Contexte pour Génération IA */}
      <Dialog open={showAIContextModal} onOpenChange={setShowAIContextModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Générer par IA - Contexte du mailing</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-context">
                Contexte du mailing (optionnel)
              </Label>
              <Textarea
                id="ai-context"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Précisez des éléments spécifiques, s'il s'agit d'une relance particulière, d'une demande particulière, etc. Ce contexte sera ajouté au prompt système pour personnaliser davantage les emails générés."
                className="mt-2 min-h-[150px]"
              />
              <div className="text-xs text-gray-500 mt-1">
                Si ce champ reste vide, les emails seront générés avec le prompt système standard.
              </div>
            </div>

            {getCurrentProspect() && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <div className="text-sm font-medium text-gray-700">Prospect cible :</div>
                {getCurrentProspect()!.company_name && (
                  <div className="text-sm text-gray-600">
                    Entreprise: {getCurrentProspect()!.company_name}
                  </div>
                )}
                {getCurrentProspect()!.siren && (
                  <div className="text-sm text-gray-600">
                    SIREN: {getCurrentProspect()!.siren}
                  </div>
                )}
                {(getCurrentProspect()!.firstname || getCurrentProspect()!.lastname) && (
                  <div className="text-sm text-gray-600">
                    Décisionnaire: {getCurrentProspect()!.firstname} {getCurrentProspect()!.lastname}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAIContextModal(false);
                  setAiContext('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={generateAISequence}
                disabled={generatingAI}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingAI ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer la séquence
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Création/Édition de Séquence */}
      <Dialog open={showSequenceForm} onOpenChange={setShowSequenceForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSequence ? 'Modifier la séquence' : 'Créer une nouvelle séquence'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Nom et description */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="sequence-name">Nom de la séquence *</Label>
                <Input
                  id="sequence-name"
                  value={sequenceForm.name}
                  onChange={(e) => setSequenceForm({ ...sequenceForm, name: e.target.value })}
                  placeholder="Ex: Séquence de relance standard"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sequence-description">Description</Label>
                <Textarea
                  id="sequence-description"
                  value={sequenceForm.description}
                  onChange={(e) => setSequenceForm({ ...sequenceForm, description: e.target.value })}
                  placeholder="Description de la séquence (optionnel)"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            {/* Liste des emails */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Emails de la séquence</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStepToForm}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un email
                </Button>
              </div>
              <div className="space-y-4">
                {sequenceForm.steps.map((step, index) => (
                  <Card key={step.stepNumber} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Étape {step.stepNumber}</Badge>
                          {index === 0 ? (
                            <span className="text-xs text-gray-500">Envoi initial</span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Relance après {step.delayDays} jour{step.delayDays > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {sequenceForm.steps.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStepFromForm(step.stepNumber)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Délai */}
                      {index > 0 && (
                        <div>
                          <Label>Délai depuis l'email précédent (jours) *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delayDays}
                            onChange={(e) => updateStepInForm(step.stepNumber, 'delayDays', parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      )}

                      {/* Sujet */}
                      <div>
                        <Label>Sujet de l'email *</Label>
                        <Input
                          value={step.subject}
                          onChange={(e) => updateStepInForm(step.stepNumber, 'subject', e.target.value)}
                          placeholder="Sujet de l'email"
                          className="mt-1"
                        />
                      </div>

                      {/* Corps */}
                      <div>
                        <Label>Corps de l'email *</Label>
                        <Textarea
                          value={step.body}
                          onChange={(e) => updateStepInForm(step.stepNumber, 'body', e.target.value)}
                          placeholder="Corps de l'email"
                          className="mt-1 min-h-[150px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSequenceForm(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={saveSequence}
                disabled={loadingSequences}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loadingSequences ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingSequence ? 'Mettre à jour' : 'Créer la séquence'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Modification/Relance Séquence */}
      <Dialog open={showEditSequenceModal} onOpenChange={setShowEditSequenceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProspectSequence && activeTab === 'completed-sequences' 
                ? 'Modifier et relancer la séquence' 
                : 'Modifier la séquence'}
            </DialogTitle>
          </DialogHeader>
          
          {editingProspectSequence && (
            <div className="space-y-6">
              {/* Informations prospect */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prospect</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{editingProspectSequence.email}</span>
                    </div>
                    {editingProspectSequence.company_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{editingProspectSequence.company_name}</span>
                      </div>
                    )}
                    {(editingProspectSequence.firstname || editingProspectSequence.lastname) && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>
                          {[editingProspectSequence.firstname, editingProspectSequence.lastname]
                            .filter(Boolean)
                            .join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Liste des emails de la séquence */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">
                    {activeTab === 'completed-sequences' 
                      ? 'Emails de la séquence (seront relancés)' 
                      : 'Emails programmés'}
                  </Label>
                </div>
                <div className="space-y-4">
                  {prospectSequenceEmails.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-gray-500">
                        {activeTab === 'completed-sequences' 
                          ? 'Aucun email envoyé trouvé pour cette séquence'
                          : 'Aucun email programmé trouvé'}
                      </CardContent>
                    </Card>
                  ) : (
                    prospectSequenceEmails
                      .sort((a, b) => a.step_number - b.step_number)
                      .map((email: any, index: number) => (
                        <Card key={email.id} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Étape {email.step_number}</Badge>
                                <Badge 
                                  variant={email.status === 'sent' ? 'default' : email.status === 'paused' ? 'secondary' : 'outline'}
                                >
                                  {email.status === 'sent' ? 'Envoyé' : email.status === 'paused' ? 'En pause' : 'Programmé'}
                                </Badge>
                                {email.scheduled_for && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(email.scheduled_for).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label>Sujet de l'email</Label>
                              <Input
                                value={email.subject}
                                onChange={(e) => {
                                  const updated = [...prospectSequenceEmails];
                                  updated[index].subject = e.target.value;
                                  setProspectSequenceEmails(updated);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Corps de l'email</Label>
                              <Textarea
                                value={email.body}
                                onChange={(e) => {
                                  const updated = [...prospectSequenceEmails];
                                  updated[index].body = e.target.value;
                                  setProspectSequenceEmails(updated);
                                }}
                                className="mt-1"
                                rows={6}
                              />
                            </div>
                            {activeTab === 'completed-sequences' && (
                              <div>
                                <Label>Date d'envoi programmée</Label>
                                <Input
                                  type="datetime-local"
                                  value={email.scheduled_for ? new Date(email.scheduled_for).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => {
                                    const updated = [...prospectSequenceEmails];
                                    updated[index].scheduled_for = new Date(e.target.value).toISOString();
                                    setProspectSequenceEmails(updated);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditSequenceModal(false);
                    setEditingProspectSequence(null);
                    setProspectSequenceEmails([]);
                  }}
                >
                  Annuler
                </Button>
                {activeTab === 'scheduled-sequences' && (
                  <>
                    {editingProspectSequence && prospectSequenceEmails.some((e: any) => e.status === 'paused') && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!editingProspectSequence) return;
                          await handleResumeSequence(editingProspectSequence.id);
                          // Recharger les emails après reprise
                          const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
                          const response = await fetch(`${config.API_URL}/api/prospects/${editingProspectSequence.id}/scheduled-emails`, {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          const result = await response.json();
                          if (result.success) {
                            const unsentEmails = (result.data || []).filter((email: any) => email.status !== 'sent');
                            setProspectSequenceEmails(unsentEmails);
                          }
                        }}
                        disabled={isPausingSequence}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reprendre la séquence
                      </Button>
                    )}
                    <Button
                      onClick={async () => {
                        // Pour les séquences en cours, on peut juste mettre à jour les emails
                        // ou suspendre/reprendre via les boutons du tableau
                        toast.info('Utilisez les boutons Suspendre/Reprendre pour gérer la séquence');
                        setShowEditSequenceModal(false);
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </Button>
                  </>
                )}
                {activeTab === 'completed-sequences' && (
                  <Button
                    onClick={() => {
                      if (!editingProspectSequence) return;
                      const emailsToSchedule = prospectSequenceEmails.map((email: any) => ({
                        step_number: email.step_number,
                        subject: email.subject,
                        body: email.body,
                        scheduled_for: email.scheduled_for || new Date(Date.now() + (email.step_number * 3 * 24 * 60 * 60 * 1000)).toISOString(),
                        status: 'scheduled'
                      }));
                      handleRestartSequence(editingProspectSequence, emailsToSchedule);
                    }}
                    disabled={isRestartingSequence}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isRestartingSequence ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Relance en cours...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Modifier et relancer
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Création de Prospect */}
      <Dialog open={showCreateProspectModal} onOpenChange={setShowCreateProspectModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Ajouter un nouveau prospect</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Créez un prospect manuellement sans passer par l'upload</p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="prospect-email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prospect-email"
                type="email"
                value={newProspect.email}
                onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                placeholder="exemple@entreprise.fr"
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prospect-firstname" className="text-sm font-medium">
                  Prénom
                </Label>
                <Input
                  id="prospect-firstname"
                  value={newProspect.firstname}
                  onChange={(e) => setNewProspect({ ...newProspect, firstname: e.target.value })}
                  placeholder="Prénom"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="prospect-lastname" className="text-sm font-medium">
                  Nom
                </Label>
                <Input
                  id="prospect-lastname"
                  value={newProspect.lastname}
                  onChange={(e) => setNewProspect({ ...newProspect, lastname: e.target.value })}
                  placeholder="Nom"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prospect-company" className="text-sm font-medium">
                Nom de l'entreprise
              </Label>
              <Input
                id="prospect-company"
                value={newProspect.company_name}
                onChange={(e) => setNewProspect({ ...newProspect, company_name: e.target.value })}
                placeholder="Nom de l'entreprise"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="prospect-siren" className="text-sm font-medium">
                SIREN
              </Label>
              <Input
                id="prospect-siren"
                value={newProspect.siren}
                onChange={(e) => setNewProspect({ ...newProspect, siren: e.target.value })}
                placeholder="123456789"
                className="mt-1.5"
                maxLength={9}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateProspectModal(false);
                  setNewProspect({
                    email: '',
                    firstname: '',
                    lastname: '',
                    company_name: '',
                    siren: ''
                  });
                }}
                disabled={creatingProspect}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateProspect}
                disabled={creatingProspect || !newProspect.email.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {creatingProspect ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le prospect
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}

