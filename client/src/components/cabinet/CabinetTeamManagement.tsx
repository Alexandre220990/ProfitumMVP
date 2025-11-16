import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Plus, RefreshCw, Users, Shield, UserCheck, Check, ChevronsUpDown } from 'lucide-react';
import { useCabinetContext } from '@/hooks/useCabinetContext';
import { CabinetHierarchyNode, CabinetPermissions } from '@/types';
import { expertCabinetService } from '@/services/cabinet-service';

const ROLE_BADGES: Record<string, string> = {
  OWNER: 'bg-blue-600 text-white',
  MANAGER: 'bg-amber-500 text-white',
  EXPERT: 'bg-slate-600 text-white',
  ASSISTANT: 'bg-emerald-600 text-white'
};

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  invited: 'bg-blue-100 text-blue-800',
  suspended: 'bg-amber-100 text-amber-800',
  disabled: 'bg-gray-200 text-gray-700'
};

type MemberFormState = {
  member_id: string;
  member_type: 'expert' | 'apporteur' | 'assistant' | 'responsable_cabinet';
  team_role: 'MANAGER' | 'EXPERT' | 'ASSISTANT';
  manager_member_id?: string | null;
  status: 'active' | 'invited' | 'suspended';
  products: string;
};

const defaultForm: MemberFormState = {
  member_id: '',
  member_type: 'expert',
  team_role: 'EXPERT',
  manager_member_id: null,
  status: 'active',
  products: ''
};

const flattenHierarchy = (nodes: CabinetHierarchyNode[]): CabinetHierarchyNode[] => {
  const list: CabinetHierarchyNode[] = [];
  const walk = (items: CabinetHierarchyNode[]) => {
    items.forEach(item => {
      list.push(item);
      if (item.children?.length) {
        walk(item.children);
      }
    });
  };
  walk(nodes);
  return list;
};

const HierarchyList = ({
  nodes,
  depth = 0
}: {
  nodes: CabinetHierarchyNode[];
  depth?: number;
}) => {
  return (
    <div className={`space-y-2 ${depth === 0 ? '' : 'pl-4 border-l border-gray-100'}`}>
      {nodes.map(node => (
        <div key={node.id}>
          <div className="flex items-center gap-3 rounded-xl border px-3 py-2 bg-white shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">
                  {node.profile?.name || 'Collaborateur'}
                </p>
                <Badge className={ROLE_BADGES[node.team_role] || 'bg-slate-600 text-white'}>
                  {node.team_role}
                </Badge>
                <Badge className={STATUS_BADGES[node.status] || 'bg-gray-200 text-gray-700'}>
                  {node.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {node.profile?.email || node.member_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {node.stats?.dossiers_signes || 0} résultats
              </p>
              <p className="text-xs text-gray-500">
                {node.stats?.dossiers_en_cours || 0} actifs
              </p>
            </div>
          </div>
          {node.children?.length ? (
            <div className="ml-4 mt-2">
              <HierarchyList nodes={node.children} depth={depth + 1} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const canAssignManager = (permissions: CabinetPermissions | undefined) => permissions?.isOwner;
const canManageMembers = (permissions: CabinetPermissions | undefined) => permissions?.canManageMembers;

export const CabinetTeamManagement = () => {
  const { context, loading, error, refresh, mutationLoading, addMember, updateMember, removeMember, refreshStats } =
    useCabinetContext();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<MemberFormState>(defaultForm);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const permissions = context?.permissions;

  const hierarchy = context?.hierarchy || [];
  const members = useMemo(() => flattenHierarchy(hierarchy), [hierarchy]);
  const managers = members.filter(member => member.team_role === 'MANAGER');
  const stats = context?.kpis;

  const searchUsers = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setAvailableUsers([]);
      return;
    }
    
    setUserSearchLoading(true);
    try {
      const type = formState.member_type === 'apporteur' ? 'apporteur' : 'expert';
      const users = await expertCabinetService.getAvailableUsers(term, type);
      setAvailableUsers(users);
    } catch (err) {
      console.error('Erreur recherche utilisateurs:', err);
      toast.error('Impossible de rechercher les utilisateurs');
    } finally {
      setUserSearchLoading(false);
    }
  }, [formState.member_type]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm) {
        searchUsers(userSearchTerm);
      } else {
        setAvailableUsers([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchTerm, searchUsers]);

  useEffect(() => {
    // Reset user search when member_type changes
    setFormState(prev => ({ ...prev, member_id: '' }));
    setUserSearchTerm('');
    setAvailableUsers([]);
  }, [formState.member_type]);

  const handleSubmit = async () => {
    if (!formState.member_id.trim()) {
      toast.error('Identifiant membre requis');
      return;
    }

    try {
      await addMember({
        member_id: formState.member_id.trim(),
        member_type: formState.member_type,
        team_role: formState.team_role,
        manager_member_id: formState.manager_member_id || null,
        status: formState.status,
        products: formState.products
          ? formState.products.split(',').map(p => p.trim()).filter(Boolean)
          : []
      });
      toast.success('Collaborateur ajouté');
      setFormState(defaultForm);
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible d’ajouter le collaborateur');
    }
  };

  const handleDisableMember = async (memberRecordId: string) => {
    try {
      await removeMember(memberRecordId);
      toast.success('Collaborateur désactivé');
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de désactiver le collaborateur');
    }
  };

  const handleStatusChange = async (memberRecordId: string, status: string) => {
    try {
      await updateMember(memberRecordId, { status: status as MemberFormState['status'] });
      toast.success('Statut mis à jour');
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de mettre à jour le statut');
    }
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-gray-500">
          Chargement des informations cabinet...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center text-red-700">
          {error}
          <div className="mt-4">
            <Button variant="outline" onClick={refresh}>
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion d’équipe</h2>
          <p className="text-gray-500">
            Pilotez votre cabinet, vos managers et vos experts en un coup d’œil.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => refreshStats()} disabled={mutationLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser KPIs
          </Button>
          {canManageMembers(permissions) && (
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un collaborateur
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajouter un membre</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Rechercher un utilisateur</Label>
                      <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                            disabled={userSearchLoading}
                          >
                            {formState.member_id
                              ? availableUsers.find(u => u.id === formState.member_id)?.name || formState.member_id
                              : 'Rechercher un expert ou apporteur...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Tapez pour rechercher..."
                              value={userSearchTerm}
                              onValueChange={setUserSearchTerm}
                            />
                            <CommandList>
                              {userSearchLoading ? (
                                <div className="p-4 text-center text-sm text-gray-500">Recherche en cours...</div>
                              ) : availableUsers.length === 0 ? (
                                <CommandEmpty>
                                  {userSearchTerm.length >= 2 ? 'Aucun utilisateur trouvé' : 'Tapez au moins 2 caractères pour rechercher'}
                                </CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {availableUsers.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.id}
                                      onSelect={() => {
                                        setFormState(prev => ({ ...prev, member_id: user.id }));
                                        setUserSearchOpen(false);
                                        setUserSearchTerm('');
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${formState.member_id === user.id ? 'opacity-100' : 'opacity-0'}`}
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium">{user.name}</p>
                                        {user.email && (
                                          <p className="text-xs text-gray-500">{user.email}</p>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {formState.member_id && (
                        <p className="mt-1 text-xs text-gray-500">
                          ID sélectionné : {formState.member_id}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={formState.member_type}
                          onValueChange={value =>
                            setFormState(prev => ({ ...prev, member_type: value as MemberFormState['member_type'] }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expert">Expert</SelectItem>
                            <SelectItem value="apporteur">Apporteur</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Rôle</Label>
                        <Select
                          value={formState.team_role}
                          onValueChange={value =>
                            setFormState(prev => ({ ...prev, team_role: value as MemberFormState['team_role'] }))
                          }
                          disabled={!permissions?.isOwner}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="EXPERT">Expert</SelectItem>
                            <SelectItem value="ASSISTANT">Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {canAssignManager(permissions) && (
                      <div>
                        <Label>Manager rattaché</Label>
                        <Select
                          value={formState.manager_member_id || 'none'}
                          onValueChange={value =>
                            setFormState(prev => ({
                              ...prev,
                              manager_member_id: value === 'none' ? null : value
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Aucun manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune supervision</SelectItem>
                            {managers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.profile?.name || manager.member_id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Statut initial</Label>
                      <Select
                        value={formState.status}
                        onValueChange={value =>
                          setFormState(prev => ({ ...prev, status: value as MemberFormState['status'] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="invited">Invité</SelectItem>
                          <SelectItem value="suspended">Suspendu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Produits autorisés (IDs séparés par des virgules)</Label>
                      <Input
                        value={formState.products}
                        onChange={e => setFormState(prev => ({ ...prev, products: e.target.value }))}
                        placeholder="prod-elig-1, prod-elig-2"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={mutationLoading}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Total dossiers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dossiers_total ?? 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dossiers_en_cours ?? 0}</p>
            </div>
            <Shield className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Signés</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dossiers_signes ?? 0}</p>
            </div>
            <UserCheck className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Managers actifs</p>
              <p className="text-2xl font-bold text-gray-900">{managers.length}</p>
            </div>
            <Users className="h-8 w-8 text-slate-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Structure hiérarchique</CardTitle>
          </CardHeader>
          <CardContent>
            {hierarchy.length ? (
              <ScrollArea className="max-h-[460px] pr-4">
                <HierarchyList nodes={hierarchy} />
              </ScrollArea>
            ) : (
              <p className="text-sm text-gray-500">Aucun membre pour ce cabinet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaborateurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[460px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Résultats</TableHead>
                    <TableHead>Statut</TableHead>
                    {canManageMembers(permissions) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.profile?.name || 'Collaborateur'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.profile?.email || member.member_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_BADGES[member.team_role] || 'bg-slate-600 text-white'}>
                          {member.team_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-semibold">{member.stats?.dossiers_signes || 0} signés</p>
                          <p className="text-xs text-gray-500">{member.stats?.dossiers_en_cours || 0} en cours</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.status}
                          onValueChange={value => handleStatusChange(member.id, value)}
                          disabled={!canManageMembers(permissions)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="invited">Invité</SelectItem>
                            <SelectItem value="suspended">Suspendu</SelectItem>
                            <SelectItem value="disabled">Désactivé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {canManageMembers(permissions) && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisableMember(member.id)}
                          >
                            Désactiver
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {!members.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="py-8 text-center text-sm text-gray-500">
                          Aucun collaborateur enregistré.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Gestion des droits basée sur vos rôles. Owner &gt; Managers &gt; Experts.
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="ghost" onClick={refresh}>
            Actualiser les données
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Bientôt : exports détaillés')}>
            Exporter la hiérarchie
          </Button>
        </div>
      </div>
    </div>
  );
};

