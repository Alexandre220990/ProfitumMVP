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
import { getSupabaseToken } from "@/lib/auth-helpers";
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
  Sparkles,
  Eye
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import ImportProspects from "./import-prospects";
import ScheduleSequenceModal from "@/components/ScheduleSequenceModal";

// Types
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
  enrichment_data?: any | null;
  enriched_at?: string | null;
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
  
  // États pour les listes d'import
  const [importBatches, setImportBatches] = useState<any[]>([]);
  const [expandedBatchIds, setExpandedBatchIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list'); // 'list' ou 'grouped'
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingBatchName, setEditingBatchName] = useState<string>('');
  const [batchProspects, setBatchProspects] = useState<Map<string, Prospect[]>>(new Map());
  const [loadingBatchIds, setLoadingBatchIds] = useState<Set<string>>(new Set());
  
  // Sélection
  const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(new Set());
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  
  // Modal envoi email
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [checkingGmail, setCheckingGmail] = useState(false);
  const [generatingBulkEmail, setGeneratingBulkEmail] = useState(false);
  const [aiContextBulkEmail, setAiContextBulkEmail] = useState('');
  
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
  const [sequenceForProspect, setSequenceForProspect] = useState<Prospect | null>(null); // Prospect pour lequel on crée la séquence depuis l'onglet list

  // États pour la gestion des séquences (suspendre/modifier/relancer)
  const [showEditSequenceModal, setShowEditSequenceModal] = useState(false);
  const [editingProspectSequence, setEditingProspectSequence] = useState<Prospect | null>(null);
  const [prospectSequenceEmails, setProspectSequenceEmails] = useState<any[]>([]);
  const [isPausingSequence, setIsPausingSequence] = useState(false);
  const [isRestartingSequence, setIsRestartingSequence] = useState(false);

  // États pour le modal de programmation de séquence d'email (accessible depuis tous les onglets)
  const [showScheduleSequenceModal, setShowScheduleSequenceModal] = useState(false);
  const [selectedProspectForSequence, setSelectedProspectForSequence] = useState<Prospect | null>(null);

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
  
  // États pour la génération IA des séquences génériques
  const [showAIContextModalGeneric, setShowAIContextModalGeneric] = useState(false);
  const [aiContextGeneric, setAiContextGeneric] = useState('');
  const [generatingAIGeneric, setGeneratingAIGeneric] = useState(false);

  // États pour la génération IA en batch (pour toute la sélection)
  const [showAIContextModalBatch, setShowAIContextModalBatch] = useState(false);
  const [aiContextBatch, setAiContextBatch] = useState('');
  const [generatingAIBatch, setGeneratingAIBatch] = useState(false);
  const [batchGenerationProgress, setBatchGenerationProgress] = useState({ current: 0, total: 0 });

  // Charger les données
  useEffect(() => {
    if (user && activeTab === 'list') {
      fetchProspects();
      fetchStats();
      fetchImportBatches();
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

  // Fermer le popup de création de séquence générique si on change d'onglet vers autre chose que list ou sequences
  useEffect(() => {
    if (activeTab !== 'sequences' && activeTab !== 'list' && showSequenceForm && !sequenceForProspect) {
      setShowSequenceForm(false);
    }
    // Réinitialiser le prospect si on change d'onglet vers sequences
    if (activeTab === 'sequences' && sequenceForProspect) {
      setSequenceForProspect(null);
    }
  }, [activeTab]);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const token = await getSupabaseToken();
      
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

  const fetchImportBatches = async () => {
    try {
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/import-batches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setImportBatches(result.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement batches:', error);
    }
  };

  const updateImportBatchName = async (batchId: string | null, newName: string) => {
    try {
      // Vérifier que le batchId est valide
      if (!batchId || batchId === 'null' || batchId === 'manual') {
        toast.error('Impossible de modifier le nom de cette liste');
        setEditingBatchId(null);
        setEditingBatchName('');
        return;
      }

      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/import-batches/${batchId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_name: newName })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Nom de la liste modifié avec succès');
        fetchImportBatches(); // Recharger les listes
        setEditingBatchId(null);
        setEditingBatchName('');
      } else {
        toast.error(result.error || 'Erreur lors de la modification du nom');
      }
    } catch (error: any) {
      console.error('Erreur modification nom:', error);
      toast.error('Erreur lors de la modification du nom');
    }
  };

  const fetchBatchProspects = async (batchId: string) => {
    // Vérifier si on a déjà chargé ces prospects
    if (batchProspects.has(batchId)) {
      return;
    }

    try {
      setLoadingBatchIds(prev => new Set(prev).add(batchId));
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/prospects/import-batches/${batchId}/prospects?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setBatchProspects(prev => {
          const newMap = new Map(prev);
          newMap.set(batchId, result.data.data || []);
          return newMap;
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement prospects du batch:', error);
      toast.error('Erreur lors du chargement des prospects');
    } finally {
      setLoadingBatchIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(batchId);
        return newSet;
      });
    }
  };

  const fetchScheduledSequencesProspects = async () => {
    try {
      setLoading(true);
      const token = await getSupabaseToken();
      
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
      const token = await getSupabaseToken();
      
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
      const token = await getSupabaseToken();
      
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
      console.error('Erreur chargement emails:', error);
    }
  };

  const fetchScheduledEmails = async (prospectId: string) => {
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
      const token = await getSupabaseToken();
      
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
    // Toujours rediriger vers la synthèse de la séquence
    navigate(`/admin/prospection/sequence/${prospect.id}`);
  };

  const handleShowDetails = async (prospect: Prospect, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProspect(prospect);
    setShowDetails(true);
  };

  const handleCloseDetails = (open: boolean) => {
    setShowDetails(open);
    if (!open) {
      setSelectedProspect(null);
    }
  };

  // Fonctions pour la programmation de séquences
  const fetchEmailTemplates = async () => {
    try {
      const token = await getSupabaseToken();
      
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
      const token = await getSupabaseToken();

      // Préparer les informations du prospect (avec toutes les données pour l'enrichissement)
      const prospectInfo = {
        id: currentProspect.id,
        company_name: currentProspect.company_name,
        siren: currentProspect.siren,
        firstname: currentProspect.firstname,
        lastname: currentProspect.lastname,
        email: seqConfig.email || currentProspect.email,
        naf_code: currentProspect.naf_code,
        naf_label: currentProspect.naf_label,
        enrichment_status: currentProspect.enrichment_status,
        enrichment_data: currentProspect.enrichment_data
      };

      // Préparer les étapes avec leurs délais
      const steps = seqConfig.steps.map(step => ({
        stepNumber: step.stepNumber,
        delayDays: step.delayDays
      }));

      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-sequence-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospectInfo,
          steps,
          context: aiContext.trim() || undefined, // Envoyer undefined si vide
          forceReenrichment: false // Peut être modifié pour forcer un nouvel enrichissement
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

      // Rafraîchir les prospects pour obtenir le nouveau statut d'enrichissement
      await fetchProspects();

      toast.success('✅ Séquence générée avec enrichissement !');
      setAiContext(''); // Réinitialiser le contexte après génération
      
      // Log de l'enrichissement pour debug (optionnel)
      if (result.data.enrichment) {
        console.log('Enrichissement du prospect:', result.data.enrichment);
      }
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error('Erreur lors de la génération par IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Fonctions pour la génération IA des séquences génériques
  const openAIContextModalGeneric = () => {
    if (sequenceForm.steps.length === 0) {
      toast.error('Veuillez d\'abord ajouter au moins un email à la séquence');
      return;
    }
    setShowAIContextModalGeneric(true);
  };

  const generateAIGenericSequence = async () => {
    if (sequenceForm.steps.length === 0) {
      toast.error('Veuillez d\'abord ajouter au moins un email à la séquence');
      return;
    }

    try {
      setGeneratingAIGeneric(true);
      setShowAIContextModalGeneric(false);
      const token = await getSupabaseToken();

      // Pour une séquence générique, on n'a pas de prospect spécifique
      // On utilise des informations génériques
      const prospectInfo = {
        company_name: 'entreprise cible',
        firstname: 'décisionnaire',
        lastname: '',
        email: 'email@entreprise.com'
      };

      // Préparer les étapes avec leurs délais
      const steps = sequenceForm.steps.map(step => ({
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
          context: aiContextGeneric.trim() || undefined
        })
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la génération par IA');
        return;
      }

      // Mettre à jour tous les sujets et corps des emails
      const updatedSteps = sequenceForm.steps.map(step => {
        const generatedStep = result.data.steps.find((gs: any) => gs.stepNumber === step.stepNumber);
        if (generatedStep) {
          return {
            ...step,
            subject: generatedStep.subject,
            body: generatedStep.body
          };
        }
        return step;
      });

      setSequenceForm({
        ...sequenceForm,
        steps: updatedSteps
      });

      toast.success('Séquence générée par IA avec succès !');
      setAiContextGeneric(''); // Réinitialiser le contexte après génération
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error('Erreur lors de la génération par IA');
    } finally {
      setGeneratingAIGeneric(false);
    }
  };

  // Fonctions pour la génération IA en batch (pour toute la sélection)
  const openAIContextModalBatch = () => {
    const selectedIds = Array.from(selectedProspectIds);
    if (selectedIds.length === 0) {
      toast.error('Aucun prospect sélectionné');
      return;
    }

    // Vérifier que tous les prospects ont au moins un email dans leur séquence
    const prospectsWithoutSteps = selectedIds.filter(id => {
      const config = sequenceConfigs.get(id);
      return !config || config.steps.length === 0;
    });

    if (prospectsWithoutSteps.length > 0) {
      toast.error('Tous les prospects doivent avoir au moins un email dans leur séquence avant de générer');
      return;
    }

    // Réinitialiser le contexte et ouvrir le modal
    setAiContextBatch('');
    setShowAIContextModalBatch(true);
  };

  const generateAISequenceBatch = async () => {
    const selectedIds = Array.from(selectedProspectIds);
    if (selectedIds.length === 0) {
      toast.error('Aucun prospect sélectionné');
      return;
    }

    try {
      setGeneratingAIBatch(true);
      setShowAIContextModalBatch(false);
      setBatchGenerationProgress({ current: 0, total: selectedIds.length });

      const token = await getSupabaseToken();

      // Préparer les informations de tous les prospects
      const prospectsInfo = selectedIds.map(id => {
        const prospect = prospects.find(p => p.id === id);
        const seqConfig = sequenceConfigs.get(id);
        
        return {
          id: prospect?.id || id,
          company_name: prospect?.company_name,
          siren: prospect?.siren,
          firstname: prospect?.firstname,
          lastname: prospect?.lastname,
          email: seqConfig?.email || prospect?.email,
          naf_code: prospect?.naf_code,
          naf_label: prospect?.naf_label
        };
      });

      // Obtenir les étapes de la première configuration (on suppose qu'elles sont toutes identiques en structure)
      const firstConfig = sequenceConfigs.get(selectedIds[0]);
      if (!firstConfig) {
        toast.error('Configuration de séquence introuvable');
        return;
      }

      const steps = firstConfig.steps.map(step => ({
        stepNumber: step.stepNumber,
        delayDays: step.delayDays
      }));

      // Appeler l'API batch
      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-sequence-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospects: prospectsInfo,
          steps,
          context: aiContextBatch.trim() || undefined
        })
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la génération par IA');
        return;
      }

      // Mettre à jour toutes les configurations avec les résultats
      const updatedConfigs = new Map(sequenceConfigs);
      let successCount = 0;
      let errorCount = 0;

      result.results.forEach((prospectResult: any) => {
        if (prospectResult.success) {
          const seqConfig = updatedConfigs.get(prospectResult.prospect_id);
          if (seqConfig) {
            const updatedSteps = [...seqConfig.steps];
            
            prospectResult.data.steps.forEach((generatedStep: any) => {
              const stepIndex = updatedSteps.findIndex(
                s => s.stepNumber === generatedStep.stepNumber
              );
              if (stepIndex !== -1) {
                updatedSteps[stepIndex].subject = generatedStep.subject;
                updatedSteps[stepIndex].body = generatedStep.body;
              }
            });

            updatedConfigs.set(prospectResult.prospect_id, {
              ...seqConfig,
              steps: updatedSteps
            });
            successCount++;
          }
        } else {
          errorCount++;
          console.error(`Erreur pour prospect ${prospectResult.prospect_id}:`, prospectResult.error);
        }
      });

      setSequenceConfigs(updatedConfigs);

      if (errorCount === 0) {
        toast.success(`✅ Séquences générées avec succès pour ${successCount} prospect${successCount > 1 ? 's' : ''} !`);
      } else if (successCount > 0) {
        toast.warning(`⚠️ ${successCount} séquence${successCount > 1 ? 's' : ''} générée${successCount > 1 ? 's' : ''}, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`);
      } else {
        toast.error(`❌ Échec de la génération pour tous les prospects`);
      }

      setAiContextBatch(''); // Réinitialiser le contexte après génération
      setBatchGenerationProgress({ current: 0, total: 0 });
    } catch (error: any) {
      console.error('Erreur génération IA batch:', error);
      toast.error('Erreur lors de la génération par IA');
      setBatchGenerationProgress({ current: 0, total: 0 });
    } finally {
      setGeneratingAIBatch(false);
    }
  };

  // Fonction pour générer un email simple par IA
  const generateBulkEmailAI = async () => {
    if (!aiContextBulkEmail.trim()) {
      toast.error('Veuillez fournir des instructions pour la génération');
      return;
    }

    try {
      setGeneratingBulkEmail(true);

      const token = await getSupabaseToken();

      // Préparer les informations des prospects sélectionnés avec enrichissement complet
      const selectedIds = Array.from(selectedProspectIds);
      const prospectsInfo = selectedIds.map(id => {
        const prospect = prospects.find(p => p.id === id);
        return {
          id: prospect?.id || id,
          company_name: prospect?.company_name,
          siren: prospect?.siren,
          firstname: prospect?.firstname,
          lastname: prospect?.lastname,
          email: prospect?.email,
          job_title: prospect?.job_title,
          naf_code: prospect?.naf_code,
          naf_label: prospect?.naf_label,
          linkedin_company_url: prospect?.linkedin_company,
          linkedin_profile_url: prospect?.linkedin_profile,
          website: prospect?.company_website,
          phone: prospect?.phone_direct || prospect?.phone_standard,
          address: prospect?.adresse,
          city: prospect?.city,
          postal_code: prospect?.postal_code
        };
      });

      // Appeler l'API de génération d'email enrichi V4 (avec LinkedIn, secteur, etc.)
      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-email-v4`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospects: prospectsInfo,
          context: aiContextBulkEmail.trim(),
          forceReenrichment: false // Utiliser le cache si disponible
        })
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la génération par IA');
        return;
      }

      // Utiliser le résultat enrichi (personnalisé avec LinkedIn, secteur, etc.)
      if (result.data && result.data.subject && result.data.body) {
        setEmailSubject(result.data.subject);
        setEmailBody(result.data.body);
        
        // Afficher les insights enrichis si disponibles
        if (result.data.prospect_insights) {
          const insights = result.data.prospect_insights;
          console.log('📊 Insights enrichis V4:', insights);
          toast.success(
            `✨ Email enrichi V4 généré ! Score perso: ${result.data.meta?.score_personnalisation || '?'}/10 | ` +
            `Potentiel: ${insights.potentiel_economies || '?'} | ` +
            `${insights.ice_breakers_disponibles || 0} ice breakers LinkedIn`
          );
        } else {
          toast.success('✨ Email enrichi V4 généré avec succès !');
        }
      } else {
        toast.error('Aucun contenu généré');
      }
    } catch (error: any) {
      console.error('Erreur génération email IA:', error);
      toast.error('Erreur lors de la génération par IA');
    } finally {
      setGeneratingBulkEmail(false);
    }
  };

  const loadTemplateSequence = (sequence: any) => {
    const steps = (sequence.prospect_email_sequence_steps || [])
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((step: any, index: number) => ({
        stepNumber: index + 1,
        delayDays: step.delay_days,
        subject: step.subject,
        body: step.body
      }));

    setSequenceForm({
      name: sequence.name,
      description: sequence.description || '',
      steps: steps
    });
    
    toast.success(`Séquence "${sequence.name}" chargée dans le formulaire`);
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

  const saveCurrentSequenceForAll = () => {
    const currentProspect = getCurrentProspect();
    if (!currentProspect) return;

    const currentConfig = sequenceConfigs.get(currentProspect.id);
    if (!currentConfig || currentConfig.steps.length === 0) {
      toast.error('Veuillez configurer au moins un email dans la séquence actuelle');
      return;
    }

    const updatedConfigs = new Map(sequenceConfigs);
    let count = 0;

    Array.from(selectedProspectIds).forEach((prospectId) => {
      const prospect = prospects.find(p => p.id === prospectId);
      if (!prospect || !prospect.email || !prospect.email.includes('@')) return;

      updatedConfigs.set(prospectId, {
        email: prospect.email,
        steps: currentConfig.steps.map(step => ({
          ...step,
          id: `${prospectId}-${step.stepNumber}`
        })),
        ready: true
      });
      count++;
    });

    setSequenceConfigs(updatedConfigs);
    toast.success(`Séquence appliquée et enregistrée pour ${count} prospect${count > 1 ? 's' : ''}`);
  };

  const scheduleAllSequences = async (startNow: boolean = false) => {
    try {
      const token = await getSupabaseToken();
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
      const token = await getSupabaseToken();
      
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

  const handleCreateSequence = async () => {
    // Si on est dans l'onglet "list", on ne change pas d'onglet, on reste dans list
    // Si on est ailleurs, on bascule vers "sequences" pour créer une séquence générique
    if (activeTab !== 'sequences' && activeTab !== 'list') {
      setSearchParams({ tab: 'sequences' });
      // Attendre un peu pour que l'onglet change avant d'ouvrir le popup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setEditingSequence(null);
    setSequenceForProspect(null); // Pas de prospect spécifique pour les séquences génériques
    setSequenceForm({
      name: '',
      description: '',
      steps: [
        { stepNumber: 1, delayDays: 0, subject: '', body: '' },
        { stepNumber: 2, delayDays: 3, subject: '', body: '' },
        { stepNumber: 3, delayDays: 7, subject: '', body: '' }
      ]
    });
    // Charger les séquences sauvegardées pour les templates
    await fetchSavedSequences();
    setShowSequenceForm(true);
  };

  // Créer une séquence pour un prospect spécifique depuis l'onglet list
  const handleCreateSequenceForProspect = async (prospect: Prospect) => {
    setEditingSequence(null);
    setSequenceForProspect(prospect); // Mémoriser le prospect pour préremplissage
    await fetchSavedSequences();
    
    // Préremplir le formulaire avec les infos du prospect
    const prospectName = `${prospect.firstname || ''} ${prospect.lastname || ''}`.trim() || prospect.email;
    setSequenceForm({
      name: `Séquence pour ${prospectName}`,
      description: `Séquence personnalisée pour ${prospectName}${prospect.company_name ? ` - ${prospect.company_name}` : ''}`,
      steps: [
        { 
          stepNumber: 1, 
          delayDays: 0, 
          subject: `Contact avec ${prospectName}`,
          body: `Bonjour ${prospect.firstname || prospectName},\n\n...`
        },
        { 
          stepNumber: 2, 
          delayDays: 3, 
          subject: `Relance - ${prospect.company_name || 'Notre échange'}`,
          body: `Bonjour ${prospect.firstname || prospectName},\n\n...`
        },
        { 
          stepNumber: 3, 
          delayDays: 7, 
          subject: `Dernière relance`,
          body: `Bonjour ${prospect.firstname || prospectName},\n\n...`
        }
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
      const token = await getSupabaseToken();
      
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
      const token = await getSupabaseToken();
      
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
      const token = await getSupabaseToken();
      
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
                  const token = await getSupabaseToken();
                  
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
              {/* Vue Mobile - Cartes empilables (< md) */}
              <div className="md:hidden space-y-3">
                {prospects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? 'Chargement...' : 'Aucun prospect trouvé'}
                  </div>
                ) : (
                  prospects.map((prospect) => (
                    <Card key={prospect.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProspectClick(prospect)}>
                      <CardContent className="p-4 space-y-3">
                        {/* Header avec checkbox et priorité */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
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
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300"
                            />
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {prospect.created_at ? (
                                  new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                ) : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleShowDetails(prospect, e)}
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                            {activeTab === 'scheduled-sequences' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handlePauseSequence(prospect.id, e)}
                                  disabled={isPausingSequence}
                                  title="Suspendre"
                                >
                                  <Pause className="h-4 w-4 text-yellow-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleOpenEditSequenceModal(prospect, e)}
                                  title="Modifier"
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
                                  title="Modifier"
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
                                  title="Relancer"
                                >
                                  <RotateCcw className="h-4 w-4 text-green-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-sm break-all">{prospect.email}</span>
                          {prospect.email_validity === 'valid' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                          )}
                          {prospect.email_validity === 'risky' && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠</Badge>
                          )}
                          {prospect.email_validity === 'invalid' && (
                            <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
                          )}
                        </div>

                        {/* Contact */}
                        {(prospect.firstname || prospect.lastname) && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">
                                {prospect.firstname} {prospect.lastname}
                              </div>
                              {prospect.job_title && (
                                <div className="text-xs text-gray-500 truncate">{prospect.job_title}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Entreprise */}
                        {prospect.company_name && (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{prospect.company_name}</div>
                              {prospect.siren && (
                                <div className="text-xs text-gray-500">SIREN: {prospect.siren}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Statuts */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">Enrichissement</span>
                            {getStatusBadge(prospect.enrichment_status, 'enrichment')}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">IA</span>
                            {getStatusBadge(prospect.ai_status, 'ai')}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">Emailing</span>
                            {getStatusBadge(prospect.emailing_status, 'emailing')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Vue Desktop - Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
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
                      <SortableHeader field="email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email
                      </SortableHeader>
                      <SortableHeader field="firstname">
                        <User className="h-4 w-4 inline mr-2" />
                        Contact
                      </SortableHeader>
                      <SortableHeader field="company_name">
                        <Building2 className="h-4 w-4 inline mr-2" />
                        Entreprise
                      </SortableHeader>
                      <SortableHeader field="enrichment_status">
                        Enrichissement
                      </SortableHeader>
                      <SortableHeader field="ai_status">
                        Séquence
                      </SortableHeader>
                      <SortableHeader field="emailing_status">
                        Emailing
                      </SortableHeader>
                      <SortableHeader field="created_at">
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Date de création
                      </SortableHeader>
                      <TableHead>Actions</TableHead>
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
                              <span className="font-medium break-all">{prospect.email}</span>
                              {prospect.email_validity === 'valid' && (
                                <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                              )}
                              {prospect.email_validity === 'risky' && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠</Badge>
                              )}
                              {prospect.email_validity === 'invalid' && (
                                <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
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
                            <div className="text-sm">
                              {prospect.created_at ? (
                                new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleShowDetails(prospect, e)}
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                              </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <Card className="p-3">
            <CardHeader className="pb-1 px-0 pt-0">
              <CardTitle className="text-xs font-medium text-gray-600">Total Prospects</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-lg font-bold">{stats.total_prospects}</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="pb-1 px-0 pt-0">
              <CardTitle className="text-xs font-medium text-gray-600">Enrichis</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-lg font-bold">{stats.enriched_count}</div>
              <div className="text-xs text-gray-500">
                {stats.total_prospects > 0 ? ((stats.enriched_count / stats.total_prospects) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="pb-1 px-0 pt-0">
              <CardTitle className="text-xs font-medium text-gray-600">SEQUENCES ENRICHIES</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-lg font-bold">{stats.ai_processed_count}</div>
              <div className="text-xs text-gray-500">
                {stats.total_prospects > 0 ? ((stats.ai_processed_count / stats.total_prospects) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="pb-1 px-0 pt-0">
              <CardTitle className="text-xs font-medium text-gray-600">Emails Envoyés</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-lg font-bold">{stats.emails_sent_count}</div>
              <div className="text-xs text-gray-500">
                Taux réponse: {stats.reply_rate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Barre d'actions pour sélection */}
      {selectedProspectIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
                <span className="font-medium text-blue-900 text-sm sm:text-base">
                  {selectedProspectIds.size} prospect{selectedProspectIds.size > 1 ? 's' : ''} sélectionné{selectedProspectIds.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProspectIds(new Set())}
                  className="w-full sm:w-auto"
                >
                  Tout désélectionner
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  onClick={handleOpenSequenceModal}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto text-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Programmer la séquence</span>
                  <span className="sm:hidden">Séquence</span>
                  <span className="ml-1">({selectedProspectIds.size})</span>
                </Button>
                <Button
                  onClick={() => setShowSendEmailModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Envoyer un email</span>
                  <span className="sm:hidden">Email</span>
                  <span className="ml-1">({selectedProspectIds.size})</span>
                </Button>
                <Button
                  onClick={async () => {
                    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProspectIds.size} prospect${selectedProspectIds.size > 1 ? 's' : ''} ?\n\nCette action est irréversible.`)) {
                      try {
                        const token = await getSupabaseToken();
                        
                        const response = await fetch(`${config.API_URL}/api/prospects/bulk-delete`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            prospect_ids: Array.from(selectedProspectIds)
                          })
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                          toast.success(`${result.deleted} prospect${result.deleted > 1 ? 's supprimés' : ' supprimé'} avec succès`);
                          setSelectedProspectIds(new Set());
                          await fetchProspects();
                        } else {
                          toast.error(result.error || 'Erreur lors de la suppression');
                        }
                      } catch (error: any) {
                        console.error('Erreur suppression prospects:', error);
                        toast.error('Erreur lors de la suppression des prospects');
                      }
                    }
                  }}
                  variant="destructive"
                  className="w-full sm:w-auto text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Supprimer la sélection</span>
                  <span className="sm:hidden">Supprimer</span>
                  <span className="ml-1">({selectedProspectIds.size})</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue Groupée par Import */}
      {viewMode === 'grouped' ? (
        <div className="space-y-4">
          {importBatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Aucune liste d'import trouvée
              </CardContent>
            </Card>
          ) : (
            importBatches.map((batch) => (
              <Card key={batch.id || 'manual'} className="overflow-hidden">
                <button
                  onClick={() => {
                    const batchKey = batch.id || 'manual';
                    const newExpanded = new Set(expandedBatchIds);
                    if (expandedBatchIds.has(batchKey)) {
                      newExpanded.delete(batchKey);
                    } else {
                      newExpanded.add(batchKey);
                      // Charger les prospects du batch s'ils ne sont pas déjà chargés
                      fetchBatchProspects(batchKey);
                    }
                    setExpandedBatchIds(newExpanded);
                  }}
                  className="w-full"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {expandedBatchIds.has(batch.id || 'manual') ? (
                          <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1">
                          {editingBatchId === batch.id && batch.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingBatchName}
                                onChange={(e) => setEditingBatchName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateImportBatchName(batch.id, editingBatchName);
                                  } else if (e.key === 'Escape') {
                                    setEditingBatchId(null);
                                    setEditingBatchName('');
                                  }
                                }}
                                className="text-lg font-semibold"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => updateImportBatchName(batch.id, editingBatchName)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingBatchId(null);
                                  setEditingBatchName('');
                                }}
                                className="px-3"
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg font-semibold">
                                {batch.file_name}
                              </CardTitle>
                              {batch.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBatchId(batch.id);
                                    setEditingBatchName(batch.file_name);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-blue-200"
                                >
                                  <Edit2 className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          )}
                          {batch.created_at && (
                            <p className="text-sm text-gray-600 mt-1">
                              Ajoutée le {new Date(batch.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 px-3 py-1">
                          {batch.prospects_count} prospect{batch.prospects_count > 1 ? 's' : ''}
                        </Badge>
                        {batch.success_count !== undefined && batch.success_count !== null && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 px-3 py-1">
                            ✓ {batch.success_count} importé{batch.success_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {batch.error_count !== undefined && batch.error_count !== null && batch.error_count > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 px-3 py-1">
                            ✗ {batch.error_count} erreur{batch.error_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {batch.status && (
                          <Badge 
                            className={
                              batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                              batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {batch.status === 'completed' ? 'Terminé' :
                             batch.status === 'failed' ? 'Échoué' :
                             'En cours'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {expandedBatchIds.has(batch.id || 'manual') && (
                  <CardContent className="pt-6">
                    {loadingBatchIds.has(batch.id || 'manual') ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-600">Chargement des prospects...</span>
                      </div>
                    ) : (
                      (() => {
                        const batchKey = batch.id || 'manual';
                        const prospectsInBatch = batchProspects.get(batchKey) || [];
                        
                        if (prospectsInBatch.length === 0) {
                          return (
                            <p className="text-center py-8 text-gray-500">
                              Aucun prospect dans cette liste
                            </p>
                          );
                        }

                        // Calculer les statistiques des prospects
                        const stats = {
                          total: prospectsInBatch.length,
                          enriched: prospectsInBatch.filter(p => p.enrichment_status === 'completed').length,
                          aiProcessed: prospectsInBatch.filter(p => p.ai_status === 'completed').length,
                          readyForEmail: prospectsInBatch.filter(p => p.emailing_status === 'pending' && p.enrichment_status === 'completed').length,
                          emailSent: prospectsInBatch.filter(p => ['sent', 'opened', 'clicked', 'replied'].includes(p.emailing_status)).length,
                          highPriority: prospectsInBatch.filter(p => p.score_priority >= 80).length,
                        };

                        return (
                          <div className="space-y-4">
                            {/* Statistiques détaillées */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                                <p className="text-xs text-gray-600">Total</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.enriched}</p>
                                <p className="text-xs text-gray-600">Enrichis</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{stats.aiProcessed}</p>
                                <p className="text-xs text-gray-600">IA complété</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{stats.readyForEmail}</p>
                                <p className="text-xs text-gray-600">Prêts email</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{stats.emailSent}</p>
                                <p className="text-xs text-gray-600">Emails envoyés</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
                                <p className="text-xs text-gray-600">Priorité haute</p>
                              </div>
                            </div>
                            {/* Vue Mobile - Cartes */}
                            <div className="md:hidden space-y-3">
                              {prospectsInBatch.map((prospect) => (
                                <Card key={prospect.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProspectClick(prospect)}>
                                  <CardContent className="p-4 space-y-3">
                                    {/* Header avec checkbox et priorité */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2">
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
                                          onClick={(e) => e.stopPropagation()}
                                          className="rounded border-gray-300"
                                        />
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3 text-gray-400" />
                                          <span className="text-sm font-semibold">{prospect.score_priority}</span>
                                          {prospect.score_priority >= 80 && (
                                            <Badge className="bg-red-100 text-red-800 text-xs">Haute</Badge>
                                          )}
                                          {prospect.score_priority >= 50 && prospect.score_priority < 80 && (
                                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Moyenne</Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Entreprise et Contact */}
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-gray-900 truncate">
                                            {prospect.company_name || 'N/A'}
                                          </p>
                                          {prospect.naf_label && (
                                            <p className="text-xs text-gray-500 truncate">{prospect.naf_label}</p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 truncate">
                                          {prospect.firstname || prospect.lastname
                                            ? `${prospect.firstname || ''} ${prospect.lastname || ''}`.trim()
                                            : 'N/A'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 truncate">{prospect.email}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>

                            {/* Vue Desktop - Table */}
                            <div className="hidden md:block overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">
                                      <input
                                        type="checkbox"
                                        checked={
                                          prospectsInBatch.length > 0 &&
                                          prospectsInBatch.every((p) => selectedProspectIds.has(p.id))
                                        }
                                        onChange={(e) => {
                                          const newSet = new Set(selectedProspectIds);
                                          if (e.target.checked) {
                                            prospectsInBatch.forEach((p) => newSet.add(p.id));
                                          } else {
                                            prospectsInBatch.forEach((p) => newSet.delete(p.id));
                                          }
                                          setSelectedProspectIds(newSet);
                                        }}
                                        className="rounded border-gray-300"
                                      />
                                    </TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Entreprise</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {prospectsInBatch.map((prospect) => (
                                    <TableRow 
                                      key={prospect.id} 
                                      className="cursor-pointer hover:bg-gray-50"
                                      onClick={() => handleProspectClick(prospect)}
                                    >
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={selectedProspectIds.has(prospect.id)}
                                          onChange={(e) => {
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
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3 text-gray-400" />
                                          <span className="font-semibold">{prospect.score_priority}</span>
                                          {prospect.score_priority >= 80 && (
                                            <Badge className="bg-red-100 text-red-800 text-xs ml-1">Haute</Badge>
                                          )}
                                          {prospect.score_priority >= 50 && prospect.score_priority < 80 && (
                                            <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-1">Moyenne</Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium">{prospect.company_name || 'N/A'}</p>
                                          {prospect.naf_label && (
                                            <p className="text-xs text-gray-500">{prospect.naf_label}</p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {prospect.firstname || prospect.lastname
                                          ? `${prospect.firstname || ''} ${prospect.lastname || ''}`.trim()
                                          : 'N/A'}
                                      </TableCell>
                                      <TableCell>{prospect.email}</TableCell>
                                      <TableCell>{prospect.phone_direct || prospect.phone_standard || 'N/A'}</TableCell>
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleShowDetails(prospect, e)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        // Vue Liste Normale
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-lg">Liste des Prospects ({total})</CardTitle>
                  <span className="text-sm text-gray-500">• Les prospects qui n'ont reçu aucun mail</span>
                </div>
                <Button
                  onClick={() => setShowCreateProspectModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium px-6 py-2.5 rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un prospect
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
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
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Liste complète
                  </Button>
                  <Button
                    variant={viewMode === 'grouped' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grouped')}
                    className={viewMode === 'grouped' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Par liste d'import
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          {/* Vue Mobile - Cartes empilables (< md) */}
          <div className="md:hidden space-y-3">
            {prospects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun prospect trouvé
              </div>
            ) : (
              prospects.map((prospect) => (
                <Card key={prospect.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProspectClick(prospect)}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header avec checkbox et priorité */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
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
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-semibold">{prospect.score_priority}</span>
                          {prospect.score_priority >= 80 && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Haute</Badge>
                          )}
                          {prospect.score_priority >= 50 && prospect.score_priority < 80 && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Moyenne</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleShowDetails(prospect, e)}
                          title="Détails"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateSequenceForProspect(prospect);
                          }}
                          title="Créer séquence"
                        >
                          <Mail className="h-4 w-4 text-purple-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Entreprise */}
                    {prospect.company_name && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{prospect.company_name}</div>
                          {prospect.siren && (
                            <div className="text-xs text-gray-500">SIREN: {prospect.siren}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    {(prospect.firstname || prospect.lastname) && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            {prospect.firstname} {prospect.lastname}
                          </div>
                          {prospect.job_title && (
                            <div className="text-xs text-gray-500 truncate">{prospect.job_title}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm break-all">{prospect.email}</span>
                      {prospect.email_validity === 'valid' && (
                        <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                      )}
                      {prospect.email_validity === 'risky' && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠</Badge>
                      )}
                      {prospect.email_validity === 'invalid' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
                      )}
                    </div>

                    {/* Téléphone */}
                    {(prospect.phone_direct || prospect.phone_standard) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">📞</span>
                        <span className="font-medium text-sm">{prospect.phone_direct || prospect.phone_standard}</span>
                      </div>
                    )}

                    {/* Statuts */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Enrichissement</span>
                        {getStatusBadge(prospect.enrichment_status, 'enrichment')}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">IA</span>
                        {getStatusBadge(prospect.ai_status, 'ai')}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Emailing</span>
                        {getStatusBadge(prospect.emailing_status, 'emailing')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Vue Desktop - Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
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
                  <SortableHeader field="company_name">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Entreprise
                  </SortableHeader>
                  <SortableHeader field="firstname">
                    <User className="h-4 w-4 inline mr-2" />
                    Contact
                  </SortableHeader>
                  <TableHead>
                    Téléphone
                  </TableHead>
                  <SortableHeader field="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </SortableHeader>
                  <SortableHeader field="enrichment_status">
                    Enrichissement
                  </SortableHeader>
                  <SortableHeader field="ai_status">
                    IA
                  </SortableHeader>
                  <SortableHeader field="emailing_status">
                    Emailing
                  </SortableHeader>
                  <SortableHeader field="score_priority">
                    <TrendingUp className="h-4 w-4 inline mr-2" />
                    Priorité
                  </SortableHeader>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
                        {prospect.company_name ? (
                          <div className="font-medium">{prospect.company_name}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
                        {prospect.phone_direct || prospect.phone_standard ? (
                          <span className="font-medium">{prospect.phone_direct || prospect.phone_standard}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium break-all">{prospect.email}</span>
                          {prospect.email_validity === 'valid' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                          )}
                          {prospect.email_validity === 'risky' && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠</Badge>
                          )}
                          {prospect.email_validity === 'invalid' && (
                            <Badge className="bg-red-100 text-red-800 text-xs">✗</Badge>
                          )}
                        </div>
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
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleShowDetails(prospect, e)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateSequenceForProspect(prospect);
                            }}
                            title="Créer une séquence personnalisée pour ce prospect"
                          >
                            <Mail className="h-4 w-4 text-purple-600" />
                          </Button>
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
      )}

      {/* Modal Détails */}
      <Dialog open={showDetails} onOpenChange={handleCloseDetails}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer un email à {selectedProspectIds.size} prospect{selectedProspectIds.size > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Section Génération IA */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Génération automatique par IA</h3>
              </div>
              <p className="text-sm text-purple-700">
                Fournissez des instructions et l'IA générera automatiquement un email personnalisé.
              </p>
              <div>
                <Label htmlFor="ai-context-bulk">Instructions pour l'IA</Label>
                <Textarea
                  id="ai-context-bulk"
                  value={aiContextBulkEmail}
                  onChange={(e) => setAiContextBulkEmail(e.target.value)}
                  placeholder="Ex: Présentez notre offre de financement professionnel, mettez en avant les taux compétitifs et la rapidité du process..."
                  className="mt-1 min-h-[100px] bg-white"
                />
              </div>
              <Button
                onClick={generateBulkEmailAI}
                disabled={generatingBulkEmail || !aiContextBulkEmail.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
              >
                {generatingBulkEmail ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer avec l'IA
                  </>
                )}
              </Button>
            </div>

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">ou personnalisez manuellement</span>
              </div>
            </div>

            {/* Champs d'email */}
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
                className="mt-1 min-h-[250px]"
              />
            </div>

            {/* Footer avec actions */}
            <div className="flex items-center justify-between pt-4 border-t">
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
                    setAiContextBulkEmail('');
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
                      const token = await getSupabaseToken();
                      
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
                        setAiContextBulkEmail('');
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
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programmer les séquences d'emails</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Bouton génération batch en haut */}
            <div className="flex items-center justify-between bg-purple-50 border-2 border-purple-300 p-4 rounded-lg">
              <div>
                <h3 className="font-semibold text-purple-900">Génération automatique par IA</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Générez automatiquement toutes les séquences pour les {selectedProspectIds.size} prospects sélectionnés
                </p>
              </div>
              <Button
                onClick={openAIContextModalBatch}
                disabled={generatingAIBatch}
                className="bg-purple-600 hover:bg-purple-700 shadow-lg"
                size="lg"
              >
                {generatingAIBatch ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Génération {batchGenerationProgress.current}/{batchGenerationProgress.total}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Générer par IA pour toute la sélection
                  </>
                )}
              </Button>
            </div>

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
                                  <p className="text-xs text-gray-500 mt-1">
                                    💡 Les sauts de ligne sont automatiquement préservés dans l'email envoyé
                                  </p>
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
                        <div className="flex gap-2">
                          <Button
                            onClick={saveCurrentProspectSequence}
                            disabled={config.steps.length === 0}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer cette séquence
                          </Button>
                          <Button
                            onClick={saveCurrentSequenceForAll}
                            disabled={config.steps.length === 0}
                            size="sm"
                            variant="outline"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer pour tous
                          </Button>
                        </div>
                      </div>
                      
                      {/* Navigation en bas */}
                      <div className="flex items-center justify-center gap-2 pt-4 border-t mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentProspectIndex(Math.max(0, currentProspectIndex - 1))}
                          disabled={currentProspectIndex === 0}
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm text-gray-600 px-4">
                          Prospect {currentProspectIndex + 1} sur {selectedProspectIds.size}
                        </span>
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
        <DialogContent className="w-[95vw] max-w-2xl">
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
                placeholder="Décris ce que tu souhaites pour cette séquence d'emails : le style, le ton, les angles d'approche, les bénéfices à mettre en avant, le type de relance, etc. Ces instructions seront la base de génération, optimisées par le prompt système pour créer des emails professionnels et efficaces."
                className="mt-2 min-h-[150px]"
              />
              <div className="text-xs text-gray-500 mt-1">
                Ces instructions sont prioritaires. Le prompt système servira à optimiser et enrichir ton souhait pour créer des emails de qualité professionnelle.
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

      {/* Modal Contexte pour Génération IA - Séquences Génériques */}
      <Dialog open={showAIContextModalGeneric} onOpenChange={setShowAIContextModalGeneric}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Générer par IA - Contexte du mailing</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-context-generic">
                Contexte du mailing (optionnel)
              </Label>
              <Textarea
                id="ai-context-generic"
                value={aiContextGeneric}
                onChange={(e) => setAiContextGeneric(e.target.value)}
                placeholder="Décris ce que tu souhaites pour cette séquence d'emails générique : le style, le ton, les angles d'approche, les bénéfices à mettre en avant, le type de relance, etc. Ces instructions seront la base de génération, optimisées par le prompt système pour créer des emails professionnels et efficaces."
                className="mt-2 min-h-[150px]"
              />
              <div className="text-xs text-gray-500 mt-1">
                Ces instructions sont prioritaires. Le prompt système servira à optimiser et enrichir ton souhait pour créer des emails de qualité professionnelle utilisables comme template.
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <div className="text-sm font-medium text-gray-700">Séquence générique :</div>
              <div className="text-sm text-gray-600">
                Cette séquence sera utilisable comme template pour tous les prospects. Les emails seront générés de manière générique mais professionnelle.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAIContextModalGeneric(false);
                  setAiContextGeneric('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={generateAIGenericSequence}
                disabled={generatingAIGeneric}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingAIGeneric ? (
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

      {/* Modal Contexte pour Génération IA en Batch (toute la sélection) */}
      <Dialog open={showAIContextModalBatch} onOpenChange={setShowAIContextModalBatch}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Générer par IA pour toute la sélection</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Génération automatique pour {selectedProspectIds.size} prospects
                  </h4>
                  <p className="text-sm text-blue-700">
                    Entrez un contexte global qui sera appliqué à tous les prospects sélectionnés. 
                    L'IA personnalisera automatiquement chaque séquence en fonction des informations 
                    spécifiques de chaque entreprise (secteur, NAF, SIREN, etc.).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="ai-context-batch">
                Contexte du mailing pour l'ensemble (optionnel)
              </Label>
              <Textarea
                id="ai-context-batch"
                value={aiContextBatch}
                onChange={(e) => setAiContextBatch(e.target.value)}
                placeholder="Décris ce que tu souhaites pour ces séquences d'emails : le style, le ton, les angles d'approche, les bénéfices à mettre en avant, le type de relance, etc.

Exemple : 'Ton professionnel mais chaleureux, mettre l'accent sur la rapidité de traitement et l'optimisation des conditions de financement, première relance douce, dernière relance courtoise.'

Ces instructions seront la base de génération. L'IA les adaptera automatiquement à chaque prospect en fonction de son profil spécifique."
                className="mt-2 min-h-[180px]"
              />
              <div className="text-xs text-gray-500 mt-1">
                Ces instructions sont prioritaires. Le prompt système servira à optimiser et personnaliser automatiquement chaque séquence selon le profil de l'entreprise.
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                  <strong>Temps de génération estimé :</strong> ~{Math.ceil(selectedProspectIds.size * 5 / 60)} minute{Math.ceil(selectedProspectIds.size * 5 / 60) > 1 ? 's' : ''} 
                  ({selectedProspectIds.size} prospects × ~5 secondes/prospect)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAIContextModalBatch(false);
                  setAiContextBatch('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={generateAISequenceBatch}
                disabled={generatingAIBatch}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingAIBatch ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer pour tous ({selectedProspectIds.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Création/Édition de Séquence */}
      <Dialog 
        open={showSequenceForm && (activeTab === 'sequences' || activeTab === 'list')} 
        onOpenChange={(open) => {
          setShowSequenceForm(open);
          if (!open) {
            // Réinitialiser le prospect quand on ferme
            setSequenceForProspect(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSequence 
                ? 'Modifier la séquence' 
                : sequenceForProspect 
                  ? `Créer une séquence personnalisée pour ${sequenceForProspect.firstname || ''} ${sequenceForProspect.lastname || ''}`.trim() || sequenceForProspect.email
                  : 'Créer une nouvelle séquence'}
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
                <div className="flex gap-2">
                  {savedSequences.length > 0 && (
                    <Select
                      onValueChange={(value) => {
                        const sequence = savedSequences.find(s => s.id === value);
                        if (sequence) {
                          loadTemplateSequence(sequence);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Utiliser template existant" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedSequences.map((sequence) => (
                          <SelectItem key={sequence.id} value={sequence.id}>
                            <FileText className="h-3 w-3 inline mr-2" />
                            {sequence.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openAIContextModalGeneric}
                    disabled={generatingAIGeneric || sequenceForm.steps.length === 0}
                    className="bg-purple-50 hover:bg-purple-100 border-purple-300"
                  >
                    {generatingAIGeneric ? (
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
                    onClick={addStepToForm}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un email
                  </Button>
                </div>
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
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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
                          const token = await getSupabaseToken();
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
        <DialogContent className="w-[95vw] max-w-2xl">
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

      {/* Modal de programmation de séquence d'email - accessible depuis tous les onglets */}
      {selectedProspectForSequence && (
        <ScheduleSequenceModal
          prospectId={selectedProspectForSequence.id}
          prospectName={`${selectedProspectForSequence.firstname || ''} ${selectedProspectForSequence.lastname || ''}`.trim() || selectedProspectForSequence.email || 'Prospect'}
          prospectEmail={selectedProspectForSequence.email}
          companyName={selectedProspectForSequence.company_name}
          siren={selectedProspectForSequence.siren}
          nafCode={selectedProspectForSequence.naf_code}
          nafLabel={selectedProspectForSequence.naf_label}
          enrichmentStatus={selectedProspectForSequence.enrichment_status || 'pending'}
          enrichmentData={selectedProspectForSequence.enrichment_data}
          open={showScheduleSequenceModal}
          onClose={() => {
            setShowScheduleSequenceModal(false);
            setSelectedProspectForSequence(null);
          }}
          onSuccess={() => {
            setShowScheduleSequenceModal(false);
            setSelectedProspectForSequence(null);
            fetchProspects();
            toast.success('Séquence programmée avec succès !');
          }}
        />
      )}
        </>
      )}
    </div>
  );
}

