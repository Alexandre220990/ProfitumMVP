import { useEffect, useState } from "react";
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
  Eye, 
  RefreshCw,
  Search,
  TrendingUp,
  ArrowUpDown
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";

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
  const [filterSequences, setFilterSequences] = useState<string>('all'); // 'all' | 'with_sequences' | 'without_sequences'
  
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

  // Charger les données
  useEffect(() => {
    if (user) {
      fetchProspects();
      fetchStats();
    }
  }, [user, page, sortBy, sortOrder, search, filterSource, filterEnrichment, filterAI, filterEmailing, filterSequences]);

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
        ...(filterSequences === 'with_sequences' && { has_sequences: 'true' }),
        ...(filterSequences === 'without_sequences' && { has_sequences: 'false' }),
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

  const handleProspectClick = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setShowDetails(true);
    await fetchProspectEmails(prospect.id);
    await fetchScheduledEmails(prospect.id);
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

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort(field)}>
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

  if (loading && prospects.length === 0) {
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
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            <Select value={filterSequences} onValueChange={(value) => { setFilterSequences(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Séquences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="with_sequences">Avec séquences</SelectItem>
                <SelectItem value="without_sequences">Sans séquences</SelectItem>
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
              <Button
                onClick={() => setShowSendEmailModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer un email ({selectedProspectIds.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des Prospects ({total})</CardTitle>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProspectClick(prospect);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}

