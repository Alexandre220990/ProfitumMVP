import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { adminCabinetService } from '@/services/admin-cabinet-service';
import { Cabinet, CabinetApporteur, CabinetProductPayload, CabinetShare } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const AdminCabinetDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    member_id: '',
    member_type: 'expert'
  });
  const [memberLoading, setMemberLoading] = useState(false);
  const [productsForm, setProductsForm] = useState<CabinetProductPayload[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [apporteurs, setApporteurs] = useState<CabinetApporteur[]>([]);
  const [apporteursLoading, setApporteursLoading] = useState(false);
  const [shares, setShares] = useState<CabinetShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [shareForm, setShareForm] = useState({
    client_produit_eligible_id: '',
    expert_id: ''
  });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'30j' | '90j' | 'all'>('30j');
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineHasMore, setTimelineHasMore] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<{ status?: string; type?: string }>({});
  const [availableApporteurs, setAvailableApporteurs] = useState<
    Array<{ id: string; name: string; company_name?: string; email?: string; phone_number?: string }>
  >([]);
  const [apporteurSearch, setApporteurSearch] = useState('');
  const [apporteurInviteForm, setApporteurInviteForm] = useState({ apporteur_id: '', member_type: 'apporteur' as const });
  const [apporteurInviteLoading, setApporteurInviteLoading] = useState(false);

  const loadCabinet = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setLoading(true);
      const response = await adminCabinetService.getCabinetDetail(id);
      setCabinet(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Erreur cabinet detail:', err);
      setError('Impossible de charger le cabinet');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setClientsLoading(true);
      const response = await adminCabinetService.getCabinetClients(id);
      setClients(response.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const loadApporteurs = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setApporteursLoading(true);
      const response = await adminCabinetService.getCabinetApporteurs(id);
      setApporteurs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement apporteurs:', error);
    } finally {
      setApporteursLoading(false);
    }
  };

  const loadShares = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setSharesLoading(true);
      const response = await adminCabinetService.getCabinetShares(id);
      setShares(response.data || []);
    } catch (error) {
      console.error('Erreur chargement partages:', error);
    } finally {
      setSharesLoading(false);
    }
  };

  const loadTimeline = async ({ reset = false, pageOverride }: { reset?: boolean; pageOverride?: number } = {}) => {
    if (!id || typeof id !== 'string') return;
    try {
      setTimelineLoading(true);
      const days = timelineFilter === '30j' ? 30 : timelineFilter === '90j' ? 90 : undefined;
      const page = reset ? 1 : pageOverride ?? timelinePage;
      const response = await adminCabinetService.getCabinetTimeline(id, { days, page, limit: 10 });
      const newEvents = response.data || [];
      if (reset) {
        setTimeline(newEvents);
        setTimelinePage(1);
      } else {
        setTimelinePage(page);
        setTimeline((prev) => [...prev, ...newEvents]);
      }
      setTimelineHasMore(newEvents.length === 10);
    } catch (error) {
      console.error('Erreur chargement timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setTasksLoading(true);
      const response = await adminCabinetService.getCabinetTasks(id, tasksFilter);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadAvailableApporteurs = async (search: string) => {
    try {
      const response = await adminCabinetService.getAvailableApporteurs(search || undefined);
      setAvailableApporteurs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement apporteurs disponibles:', error);
    }
  };

  const handleInviteApporteur = async () => {
    if (!id || typeof id !== 'string') return;
    if (!apporteurInviteForm.apporteur_id) {
      toast.error('Veuillez sélectionner un apporteur');
      return;
    }

    try {
      setApporteurInviteLoading(true);
      await adminCabinetService.addCabinetMember(id, {
        member_id: apporteurInviteForm.apporteur_id,
        member_type: apporteurInviteForm.member_type
      });
      toast.success('Apporteur invité avec succès');
      setApporteurInviteForm({ apporteur_id: '', member_type: 'apporteur' });
      setApporteurSearch('');
      loadApporteurs();
      loadAvailableApporteurs(apporteurSearch);
    } catch (err) {
      console.error('Erreur invitation apporteur:', err);
      toast.error('Impossible d\'inviter l\'apporteur');
    } finally {
      setApporteurInviteLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!id || typeof id !== 'string') return;
    if (!memberForm.member_id.trim()) {
      toast.error('Identifiant membre requis');
      return;
    }

    try {
      setMemberLoading(true);
      await adminCabinetService.addCabinetMember(id, {
        member_id: memberForm.member_id.trim(),
        member_type: memberForm.member_type as any
      });
      toast.success('Membre ajouté');
      setMemberForm({ member_id: '', member_type: memberForm.member_type });
      loadCabinet();
    } catch (err) {
      console.error('Erreur ajout membre:', err);
      toast.error('Impossible d\'ajouter le membre');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || typeof id !== 'string') return;
    try {
      await adminCabinetService.removeCabinetMember(id, memberId);
      toast.success('Membre retiré');
      loadCabinet();
    } catch (err) {
      console.error('Erreur suppression membre:', err);
      toast.error('Impossible de retirer le membre');
    }
  };

  useEffect(() => {
    loadCabinet();
    loadClients();
    loadApporteurs();
    loadShares();
  }, [id]);

  useEffect(() => {
    loadTimeline({ reset: true });
  }, [id, timelineFilter]);

  useEffect(() => {
    loadTasks();
  }, [id, tasksFilter.status, tasksFilter.type]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadAvailableApporteurs(apporteurSearch);
    }, 250);
    return () => clearTimeout(handler);
  }, [apporteurSearch]);

  if (!id || typeof id !== 'string' || (loading && !cabinet)) {
    return <div>Chargement...</div>;
  }

  const members = cabinet?.members || [];
  const produits = cabinet?.produits || [];
  const produitsEditable = produits.map((prod) => {
    const draft = productsForm.find((p) => p.produit_eligible_id === prod.produit_eligible_id);
    return draft ? { ...prod, ...draft } : prod;
  });
  const selectedApporteur = availableApporteurs.find((aa) => aa.id === apporteurInviteForm.apporteur_id);

  const handleProductFieldChange = (
    produitId: string,
    field: keyof CabinetProductPayload,
    value: string | number | boolean
  ) => {
    setProductsForm((prev) => {
      const existing = prev.find((p) => p.produit_eligible_id === produitId);
      if (existing) {
        return prev.map((p) =>
          p.produit_eligible_id === produitId ? { ...p, [field]: value } : p
        );
      }
      return [
        ...prev,
        {
          produit_eligible_id: produitId,
          [field]: value
        } as CabinetProductPayload
      ];
    });
  };

  const handleSyncProducts = async () => {
    if (!id || typeof id !== 'string') return;
    const payload = productsForm.length
      ? productsForm
      : produits.map((p) => ({
          produit_eligible_id: p.produit_eligible_id,
          commission_rate: p.commission_rate,
          fee_amount: p.fee_amount,
          fee_mode: p.fee_mode,
          is_active: p.is_active
        }));

    if (!payload.length) {
      toast.error('Aucun produit à synchroniser');
      return;
    }

    try {
      setProductsLoading(true);
      await adminCabinetService.updateCabinetProducts(id, payload);
      toast.success('Produits synchronisés');
      setProductsForm([]);
      loadCabinet();
    } catch (error) {
      console.error('Erreur synchronisation produits:', error);
      toast.error('Impossible de synchroniser les produits');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCreateShare = async () => {
    if (!id || typeof id !== 'string') return;
    if (!shareForm.client_produit_eligible_id.trim()) {
      toast.error('client_produit_eligible_id requis');
      return;
    }
    try {
      await adminCabinetService.createCabinetShare(id, {
        client_produit_eligible_id: shareForm.client_produit_eligible_id.trim(),
        expert_id: shareForm.expert_id.trim() || undefined
      });
      toast.success('Partage créé');
      setShareForm({ client_produit_eligible_id: '', expert_id: '' });
      loadShares();
    } catch (error) {
      console.error('Erreur création partage:', error);
      toast.error('Impossible de créer le partage');
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!id || typeof id !== 'string') return;
    try {
      await adminCabinetService.deleteCabinetShare(id, shareId);
      toast.success('Partage supprimé');
      loadShares();
    } catch (error) {
      console.error('Erreur suppression partage:', error);
      toast.error('Impossible de supprimer le partage');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Cabinet partenaire</p>
          <h1 className="text-3xl font-semibold text-gray-900">
            {cabinet?.name || '...'}
          </h1>
          <div className="text-gray-600 mt-1">
            {cabinet?.siret && <span>SIRET : {cabinet.siret}</span>}
            {cabinet?.address && <span className="ml-4">{cabinet.address}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/cabinets')}>
            Retour
          </Button>
          <Button onClick={() => router.push(`/admin/cabinets/${id}/edit`)}>
            Modifier
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <Tabs defaultValue="synthese" className="space-y-6">
        <TabsList>
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="equipe">Équipe</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="clients">Clients / Dossiers</TabsTrigger>
          <TabsTrigger value="apporteurs">Apporteurs</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Clients actifs</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-gray-900">
                {cabinet?.kpis?.clients_actifs ?? '—'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Dossiers en cours</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-gray-900">
                {cabinet?.kpis?.dossiers_en_cours ?? '—'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fees mensuels</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-gray-900">
                {cabinet?.kpis?.fees_mensuels ? `${cabinet.kpis.fees_mensuels} €` : '—'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>RDV 30 derniers jours</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-gray-900">
                {cabinet?.kpis?.rdv_30j ?? '—'}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Activité récente</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={timelineFilter}
                  onValueChange={(value: '30j' | '90j' | 'all') => {
                    setTimelineFilter(value);
                    setTimelinePage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30j">30 jours</SelectItem>
                    <SelectItem value="90j">90 jours</SelectItem>
                    <SelectItem value="all">Tout</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => loadTimeline({ reset: true })}>
                  Rafraîchir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineLoading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
              ) : timeline.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Aucune activité récente pour ce cabinet.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {timeline.map((event) => (
                      <li key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge variant="outline" className="mt-0.5 capitalize">
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                        <div className="flex-1 text-sm">
                          <p className="font-medium">
                            {event.RDV?.title || `RDV ${event.rdv_id || ''}`}
                          </p>
                          <p className="text-gray-500 mt-1">
                            {event.metadata?.summary_preview ||
                              event.metadata?.title ||
                              'Mise à jour'}
                          </p>
                          {event.metadata?.participants && (
                            <p className="text-xs text-gray-400 mt-1">
                              Participants: {Array.isArray(event.metadata.participants) 
                                ? event.metadata.participants.join(', ')
                                : event.metadata.participants}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(event.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {timelineHasMore && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const nextPage = timelinePage + 1;
                        setTimelinePage(nextPage);
                        loadTimeline({ pageOverride: nextPage });
                      }}
                      disabled={timelineLoading}
                    >
                      Voir plus
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Tâches en cours</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={tasksFilter.status || 'all'}
                  onValueChange={(value) => {
                    setTasksFilter((prev) => ({ ...prev, status: value === 'all' ? undefined : value }));
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={tasksFilter.type || 'all'}
                  onValueChange={(value) => {
                    setTasksFilter((prev) => ({ ...prev, type: value === 'all' ? undefined : value }));
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="deadline">Échéance</SelectItem>
                    <SelectItem value="task">Tâche</SelectItem>
                    <SelectItem value="reminder">Rappel</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={loadTasks}>
                  Rafraîchir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Aucune tâche.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {task.RDV?.title || `RDV ${task.rdv_id}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString('fr-FR')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.status === 'done' ? 'default' : 'outline'}>
                            {task.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Équipe</CardTitle>
                  <p className="text-sm text-gray-500">
                    {members.length} membre(s)
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <Input
                    placeholder="Identifiant user (UUID)"
                    value={memberForm.member_id}
                    onChange={(e) =>
                      setMemberForm((prev) => ({ ...prev, member_id: e.target.value }))
                    }
                  />
                  <Select
                    defaultValue={memberForm.member_type}
                    onValueChange={(value) =>
                      setMemberForm((prev) => ({ ...prev, member_type: value }))
                    }
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="apporteur">Apporteur</SelectItem>
                      <SelectItem value="responsable_cabinet">Responsable cabinet</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="flex items-center gap-2"
                    onClick={handleAddMember}
                    disabled={memberLoading}
                  >
                    <Plus className="w-4 h-4" />
                    {memberLoading ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Produits autorisés</TableHead>
                    <TableHead>Date d'ajout</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Aucun membre pour l'instant.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>{member.member_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.member_type}</Badge>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{member.created_at ? new Date(member.created_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.member_id)}
                          >
                            Retirer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produits">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Produits éligibles</CardTitle>
                <p className="text-sm text-gray-500">
                  {produitsEditable.length} produit(s) configuré(s) pour ce cabinet.
                </p>
              </div>
              <Button variant="outline" onClick={handleSyncProducts} disabled={productsLoading}>
                {productsLoading ? 'Synchronisation...' : 'Synchroniser'}
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Commission (%)</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produitsEditable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Aucun produit configuré pour l'instant.
                      </TableCell>
                    </TableRow>
                  ) : (
                    produitsEditable.map((prod) => (
                      <TableRow key={prod.produit_eligible_id}>
                        <TableCell>{prod.produit_eligible_id}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={prod.commission_rate ?? 0}
                            onChange={(e) =>
                              handleProductFieldChange(
                                prod.produit_eligible_id,
                                'commission_rate',
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={prod.fee_amount ?? 0}
                            onChange={(e) =>
                              handleProductFieldChange(
                                prod.produit_eligible_id,
                                'fee_amount',
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={prod.fee_mode || 'fixed'}
                            onValueChange={(value) =>
                              handleProductFieldChange(
                                prod.produit_eligible_id,
                                'fee_mode',
                                value
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Montant fixe</SelectItem>
                              <SelectItem value="percent">Pourcentage</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={prod.is_active}
                              onCheckedChange={(checked) =>
                                handleProductFieldChange(
                                  prod.produit_eligible_id,
                                  'is_active',
                                  Boolean(checked)
                                )
                              }
                            />
                            <span>{prod.is_active ? 'Actif' : 'Inactif'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clients & dossiers</CardTitle>
              <p className="text-sm text-gray-500">
                Liste des dossiers liés à ce cabinet.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Aucun dossier pour ce cabinet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client: any) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.client_name || client.client_id}</TableCell>
                        <TableCell>{client.dossier_id || '—'}</TableCell>
                        <TableCell>{client.produit_nom || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={client.status === 'actif' ? 'default' : 'outline'}>
                            {client.status || '—'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apporteurs">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Apporteurs rattachés</CardTitle>
                <p className="text-sm text-gray-500">
                  {apporteurs.length} apporteur(s)
                </p>
              </div>
              <Button variant="outline" onClick={loadApporteurs} disabled={apporteursLoading}>
                Rafraîchir
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date d'ajout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apporteursLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : apporteurs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          Aucun apporteur lié pour l'instant.
                        </TableCell>
                      </TableRow>
                    ) : (
                      apporteurs.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.apporteur?.first_name || item.apporteur?.last_name
                              ? `${item.apporteur?.first_name || ''} ${item.apporteur?.last_name || ''}`.trim()
                              : item.apporteur?.company_name || item.member_id}
                          </TableCell>
                          <TableCell>{item.apporteur?.company_name || '—'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              {item.apporteur?.email && <span>{item.apporteur.email}</span>}
                              {item.apporteur?.phone_number && (
                                <span className="text-gray-500">{item.apporteur.phone_number}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString('fr-FR')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4">
                <CardTitle>Inviter un apporteur existant</CardTitle>
                <p className="text-sm text-gray-500">
                  Recherche auto-complétée sur tous les apporteurs référencés (50 premiers résultats).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apporteur-search">Recherche</Label>
                    <Input
                      id="apporteur-search"
                      placeholder="Nom, entreprise ou email"
                      value={apporteurSearch}
                      onChange={(e) => setApporteurSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apporteur-select">Sélection</Label>
                    <Select
                      value={apporteurInviteForm.apporteur_id}
                      onValueChange={(value) =>
                        setApporteurInviteForm((prev) => ({
                          ...prev,
                          apporteur_id: value
                        }))
                      }
                      disabled={availableApporteurs.length === 0 && !apporteurInviteForm.apporteur_id}
                    >
                      <SelectTrigger id="apporteur-select">
                        <SelectValue placeholder="Choisir un apporteur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— Aucun —</SelectItem>
                        {availableApporteurs.map((apporteur) => (
                          <SelectItem key={apporteur.id} value={apporteur.id}>
                            {apporteur.name || apporteur.email || 'Apporteur'}{' '}
                            {apporteur.company_name ? `· ${apporteur.company_name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedApporteur && (
                  <div className="text-xs text-gray-500">
                    <p>Contact : {selectedApporteur.email || '—'}</p>
                    {selectedApporteur.phone_number && <p>Téléphone : {selectedApporteur.phone_number}</p>}
                  </div>
                )}
                <Button
                  onClick={handleInviteApporteur}
                  disabled={!apporteurInviteForm.apporteur_id || apporteurInviteLoading}
                >
                  {apporteurInviteLoading ? 'Invitation...' : 'Inviter'}
                </Button>
              </div>

              <div className="space-y-4">
                <CardTitle>Partager un dossier avec le cabinet</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="share-dossier">ClientProduitEligible ID</Label>
                    <Input
                      id="share-dossier"
                      placeholder="UUID du dossier"
                      value={shareForm.client_produit_eligible_id}
                      onChange={(e) =>
                        setShareForm((prev) => ({ ...prev, client_produit_eligible_id: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="share-expert">Expert ID (optionnel)</Label>
                    <Input
                      id="share-expert"
                      placeholder="UUID expert secondaire"
                      value={shareForm.expert_id}
                      onChange={(e) =>
                        setShareForm((prev) => ({ ...prev, expert_id: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleCreateShare}>Partager le dossier</Button>
              </div>

              <div className="space-y-4">
                <CardTitle>Partages existants</CardTitle>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dossier</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Expert (optionnel)</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sharesLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            Chargement...
                          </TableCell>
                        </TableRow>
                      ) : shares.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500">
                            Aucun partage enregistré.
                          </TableCell>
                        </TableRow>
                      ) : (
                        shares.map((share) => (
                          <TableRow key={share.id}>
                            <TableCell>{share.client_produit_eligible_id}</TableCell>
                            <TableCell>{share.ClientProduitEligible?.clientId || '—'}</TableCell>
                            <TableCell>{share.Expert?.name || share.expert_id || '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteShare(share.id)}
                              >
                                Retirer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCabinetDetailPage;

