import { useMemo, useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, RefreshCw, Users, Shield, UserCheck } from 'lucide-react';
import { useCabinetContext } from '@/hooks/useCabinetContext';
import { CabinetHierarchyNode, CabinetPermissions } from '@/types';
import { config } from '@/config/env';

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

interface ProduitEligible {
  id: string;
  nom: string;
  description?: string;
  categorie?: string;
  commission_rate?: number; // Commission du cabinet pour ce produit (en décimal)
  fee_mode?: 'fixed' | 'percent';
}

interface ExpertProduitEligible {
  produit_id: string;
  client_fee_percentage: number; // En décimal (ex: 0.30 = 30%)
}

type MemberFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string; // Optionnel
  company_name: string;
  siren: string;
  team_role: 'OWNER' | 'MANAGER' | 'EXPERT';
  manager_member_id?: string | null;
  produits_eligibles: ExpertProduitEligible[]; // Array avec produit_id + client_fee_percentage
  secteur_activite: string[];
};

const defaultForm: MemberFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company_name: '',
  siren: '',
  team_role: 'EXPERT',
  manager_member_id: null,
  produits_eligibles: [], // Array de { produit_id, client_fee_percentage }
  secteur_activite: []
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
  const { context, loading, error, refresh, mutationLoading, updateMember, removeMember, refreshStats } =
    useCabinetContext();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<MemberFormState>(defaultForm);
  const [produitsEligibles, setProduitsEligibles] = useState<ProduitEligible[]>([]);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const permissions = context?.permissions;
  
  // Secteurs d'activité disponibles
  const secteursActivite = [
    'Transport',
    'Logistique',
    'Commerce',
    'Industrie',
    'Services',
    'BTP',
    'Agriculture',
    'Santé',
    'Éducation',
    'Autre'
  ];

  const hierarchy = context?.hierarchy || [];
  const currentMembership = context?.membership;
  
  // Filtrer la hiérarchie selon le rôle :
  // - OWNER : voir toute la hiérarchie du cabinet
  // - MANAGER : voir uniquement son équipe (experts sous lui)
  const filteredHierarchy = useMemo(() => {
    if (!permissions || !currentMembership) return hierarchy;
    
    if (permissions.isOwner) {
      // OWNER : voir tout
      return hierarchy;
    } else if (permissions.isManager && currentMembership.id) {
      // MANAGER : voir uniquement son équipe (enfants directs et indirects)
      const findManagerNode = (nodes: CabinetHierarchyNode[]): CabinetHierarchyNode | null => {
        for (const node of nodes) {
          if (node.id === currentMembership.id) {
            return node;
          }
          const found = findManagerNode(node.children || []);
          if (found) return found;
        }
        return null;
      };
      
      const managerNode = findManagerNode(hierarchy);
      if (managerNode) {
        // Retourner uniquement le nœud manager avec ses enfants
        return [managerNode];
      }
      return [];
    }
    
    return [];
  }, [hierarchy, permissions, currentMembership]);
  
  const members = useMemo(() => flattenHierarchy(filteredHierarchy), [filteredHierarchy]);
  const managers = members.filter(member => member.team_role === 'MANAGER');
  const owners = members.filter(member => member.team_role === 'OWNER');
  const experts = members.filter(member => member.team_role === 'EXPERT' && member.status === 'active');
  const activeMembers = members.filter(member => member.status === 'active');
  
  // Liste des managers possibles (OWNER + MANAGER) pour le rattachement hiérarchique
  const availableManagers = useMemo(() => {
    return [...owners, ...managers].filter(m => m.status === 'active');
  }, [owners, managers]);
  
  const stats = context?.kpis;
  
  // Calculer les KPIs managériaux
  const totalMembers = activeMembers.length;
  const avgDossiersEnCours = totalMembers > 0 ? Math.round((stats?.dossiers_en_cours ?? 0) / totalMembers) : 0;
  const avgDossiersSignes = totalMembers > 0 ? Math.round((stats?.dossiers_signes ?? 0) / totalMembers) : 0;
  
  // Top performer (celui avec le plus de dossiers signés)
  const topPerformer = members
    .filter(m => m.stats && m.stats.dossiers_signes > 0)
    .sort((a, b) => (b.stats?.dossiers_signes || 0) - (a.stats?.dossiers_signes || 0))[0];
  
  // Collaborateurs sans activité récente (> 30 jours)
  const inactiveMembers = members.filter(member => {
    if (!member.stats?.last_activity) return false;
    const lastActivity = new Date(member.stats.last_activity);
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceActivity > 30;
  });

  // Charger les ProduitEligible du CABINET (pas tous les produits du catalogue)
  useEffect(() => {
    const fetchCabinetProduits = async () => {
      try {
        setLoadingProduits(true);
        // Récupérer les produits du cabinet via l'API
        const response = await fetch(`${config.API_URL}/api/expert/cabinet/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des produits du cabinet');
        }
        const data = await response.json();
        if (data.success && data.data) {
          // data.data devrait être un array de { produit_eligible_id, commission_rate, ProduitEligible: {...} }
          const produits = data.data.map((item: any) => ({
            id: item.produit_eligible_id || item.ProduitEligible?.id,
            nom: item.ProduitEligible?.nom || item.nom,
            description: item.ProduitEligible?.description,
            categorie: item.ProduitEligible?.categorie,
            commission_rate: item.commission_rate ? item.commission_rate / 100 : null, // Commission du cabinet (convertir % en décimal)
            fee_mode: item.fee_mode || 'percent'
          }));
          setProduitsEligibles(produits);
        }
      } catch (error) {
        console.error('Erreur chargement produits cabinet:', error);
        toast.error('Erreur lors du chargement des produits du cabinet');
      } finally {
        setLoadingProduits(false);
      }
    };
    
    if (isDialogOpen && context?.cabinet?.id) {
      fetchCabinetProduits();
    }
  }, [isDialogOpen, context?.cabinet?.id]);
  
  // Fonction pour formater le SIREN avec des espaces (123 456 789)
  const formatSiren = (siren: string | null | undefined): string => {
    if (!siren) return '';
    // Supprimer tous les espaces et caractères non numériques
    const cleanSiren = siren.replace(/\D/g, '');
    // Ajouter des espaces tous les 3 chiffres
    return cleanSiren.replace(/(\d{3})(?=\d)/g, '$1 ');
  };

  // Pré-remplir company_name et siren avec les infos du cabinet
  useEffect(() => {
    if (isDialogOpen && context?.cabinet) {
      const cabinetSiren = formatSiren(context.cabinet.siret);
      console.log('🔍 Pré-remplissage formulaire:', {
        cabinetName: context.cabinet.name,
        cabinetSiret: context.cabinet.siret,
        formattedSiren: cabinetSiren
      });
      
      setFormState(prev => ({
        ...prev,
        company_name: context.cabinet.name || prev.company_name,
        siren: cabinetSiren || prev.siren
      }));
    } else if (!isDialogOpen) {
      // Réinitialiser le formulaire quand le dialog se ferme
      setFormState(defaultForm);
    }
  }, [isDialogOpen, context?.cabinet]);

  const handleProduitChange = (produitId: string, checked: boolean) => {
    // Trouver le produit pour récupérer sa commission_rate du cabinet
    const produit = produitsEligibles.find(p => p.id === produitId);
    const defaultFee = produit?.commission_rate || 0.30; // Utiliser commission_rate du cabinet ou 30% par défaut
    
    setFormState(prev => ({
      ...prev,
      produits_eligibles: checked
        ? [...prev.produits_eligibles, { produit_id: produitId, client_fee_percentage: defaultFee }]
        : prev.produits_eligibles.filter(p => p.produit_id !== produitId)
    }));
  };

  const handleProduitFeeChange = (produitId: string, percentage: number) => {
    setFormState(prev => ({
      ...prev,
      produits_eligibles: prev.produits_eligibles.map(p =>
        p.produit_id === produitId
          ? { ...p, client_fee_percentage: percentage / 100 } // Convertir % en décimal
          : p
      )
    }));
  };

  const handleSecteurChange = (secteur: string, checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      secteur_activite: checked
        ? [...prev.secteur_activite, secteur]
        : prev.secteur_activite.filter(s => s !== secteur)
    }));
  };

  const openEmailClient = (emailInfo: {
    email: string;
    temporary_password: string;
    login_url: string;
  }, expertName: string) => {
    const subject = encodeURIComponent(`Bienvenue dans l'équipe - Vos identifiants de connexion`);
    const body = encodeURIComponent(`Bonjour ${expertName},

Votre compte expert a été créé avec succès. Voici vos identifiants de connexion :

📧 Email : ${emailInfo.email}
🔐 Mot de passe provisoire : ${emailInfo.temporary_password}

🔗 Lien de connexion : ${emailInfo.login_url}

IMPORTANT :
- Votre mot de passe a été généré automatiquement et est sécurisé.
- Vous pouvez le conserver tel quel, mais il est recommandé de le modifier lors de votre première connexion.
- Pour changer votre mot de passe, rendez-vous dans les paramètres de votre compte après connexion.

Votre compte est actuellement en attente de validation par nos équipes. Vous recevrez un email de confirmation dès que votre compte sera validé.

Bienvenue dans l'équipe !

Cordialement,
L'équipe Profitum`);
    
    const mailtoLink = `mailto:${emailInfo.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formState.first_name.trim() || !formState.last_name.trim() || !formState.email.trim()) {
      toast.error('Prénom, nom et email sont requis');
      return;
    }
    
    if (!formState.company_name.trim()) {
      toast.error('Nom de l\'entreprise est requis');
      return;
    }
    
    if (formState.produits_eligibles.length === 0) {
      toast.error('Au moins un produit éligible doit être sélectionné');
      return;
    }
    
    // Vérifier que tous les produits ont un client_fee_percentage défini
    const produitsInvalides = formState.produits_eligibles.filter(p => !p.client_fee_percentage || p.client_fee_percentage <= 0);
    if (produitsInvalides.length > 0) {
      toast.error('Tous les produits sélectionnés doivent avoir un pourcentage de compensation défini');
      return;
    }

    try {
      // Créer le collaborateur via l'API backend
      // Le backend créera l'expert, le CabinetMember avec status='invited' pour validation admin
      // et retournera les informations pour l'email
      const response = await fetch(`${config.API_URL}/api/expert/cabinet/members/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          first_name: formState.first_name.trim(),
          last_name: formState.last_name.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim() || null,
          company_name: formState.company_name.trim(),
          siren: formState.siren.trim() || null,
          team_role: formState.team_role,
          manager_member_id: formState.manager_member_id || null,
          produits_eligibles: formState.produits_eligibles, // Array de { produit_id, client_fee_percentage }
          secteur_activite: formState.secteur_activite
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du collaborateur');
      }

      const result = await response.json();
      
      if (result.success && result.data?.email_info) {
        const expertName = `${formState.first_name} ${formState.last_name}`;
        
        // Ouvrir le client email pré-rempli
        openEmailClient(result.data.email_info, expertName);
        
        toast.success('Collaborateur créé avec succès ! Le client email a été ouvert avec les identifiants.');
      } else {
        toast.success('Collaborateur créé. En attente de validation admin.');
      }
      
      setFormState(defaultForm);
      setDialogOpen(false);
      refresh(); // Rafraîchir la liste
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de créer le collaborateur');
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
      await updateMember(memberRecordId, { status: status as 'active' | 'invited' | 'suspended' | 'disabled' });
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
          <h2 className="text-2xl font-bold text-gray-900">
            {permissions?.isOwner ? 'Gestion du cabinet' : 'Gestion de mon équipe'}
          </h2>
          <p className="text-gray-500">
            {permissions?.isOwner 
              ? "Pilotez votre cabinet, vos managers et vos experts en un coup d'œil."
              : "Pilotez votre équipe d'experts en un coup d'œil."}
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
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau collaborateur</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Le collaborateur sera créé avec un statut "En attente" et nécessitera une validation admin.
                  </p>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
                  <div className="space-y-6 py-4">
                    {/* Informations personnelles */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Informations personnelles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Prénom *</Label>
                          <Input
                            value={formState.first_name}
                            onChange={e => setFormState(prev => ({ ...prev, first_name: e.target.value }))}
                            placeholder="Prénom"
                          />
                        </div>
                        <div>
                          <Label>Nom *</Label>
                          <Input
                            value={formState.last_name}
                            onChange={e => setFormState(prev => ({ ...prev, last_name: e.target.value }))}
                            placeholder="Nom de famille"
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={formState.email}
                            onChange={e => setFormState(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="expert@cabinet.fr"
                          />
                        </div>
                        <div>
                          <Label>Téléphone</Label>
                          <Input
                            value={formState.phone}
                            onChange={e => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informations entreprise */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Informations entreprise</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nom de l'entreprise *</Label>
                          <Input
                            value={formState.company_name}
                            onChange={e => setFormState(prev => ({ ...prev, company_name: e.target.value }))}
                            placeholder="Nom du cabinet"
                          />
                        </div>
                        <div>
                          <Label>SIREN</Label>
                          <Input
                            value={formState.siren}
                            onChange={e => setFormState(prev => ({ ...prev, siren: e.target.value }))}
                            placeholder="123 456 789"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rôle et hiérarchie */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Rôle et hiérarchie</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Rôle dans le cabinet *</Label>
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
                              <SelectItem value="OWNER">Owner (propriétaire)</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="EXPERT">Expert</SelectItem>
                            </SelectContent>
                          </Select>
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
                                <SelectValue placeholder="Aucune supervision" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucune supervision</SelectItem>
                                {availableManagers.map(manager => (
                                  <SelectItem key={manager.id} value={manager.id}>
                                    {manager.profile?.name || manager.member_id} ({manager.team_role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Produits éligibles */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Produits éligibles *</h3>
                      {loadingProduits ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-sm text-gray-500">Chargement des produits...</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                          {produitsEligibles.map((produit) => {
                            const isSelected = formState.produits_eligibles.some(p => p.produit_id === produit.id);
                            const selectedProduit = formState.produits_eligibles.find(p => p.produit_id === produit.id);
                            
                            return (
                              <div key={produit.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex items-start space-x-2">
                                  <Checkbox
                                    id={produit.id}
                                    checked={isSelected}
                                    onCheckedChange={(checked: boolean) => handleProduitChange(produit.id, checked)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <label htmlFor={produit.id} className="text-sm font-medium cursor-pointer block">
                                      {produit.nom}
                                    </label>
                                    {produit.description && (
                                      <p className="text-xs text-gray-500 mt-0.5">{produit.description}</p>
                                    )}
                                    {isSelected && (
                                      <div className="mt-2">
                                        <Label className="text-xs text-gray-600">
                                          Compensation (%)
                                          {produit.commission_rate && (
                                            <span className="text-gray-400 ml-1">
                                              (Cabinet: {Math.round(produit.commission_rate * 100)}%)
                                            </span>
                                          )}
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={selectedProduit ? (selectedProduit.client_fee_percentage * 100) : (produit.commission_rate ? produit.commission_rate * 100 : 30)}
                                          onChange={e => handleProduitFeeChange(produit.id, parseFloat(e.target.value) || 0)}
                                          className="mt-1 w-24"
                                          placeholder={produit.commission_rate ? String(Math.round(produit.commission_rate * 100)) : "30"}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                          {produit.commission_rate 
                                            ? `Pré-rempli avec la commission du cabinet (${Math.round(produit.commission_rate * 100)}%)`
                                            : 'Pourcentage pour ce produit'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Secteurs d'activité */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Secteurs d'activité</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                        {secteursActivite.map((secteur) => (
                          <div key={secteur} className="flex items-center space-x-2">
                            <Checkbox
                              id={`secteur-${secteur}`}
                              checked={formState.secteur_activite.includes(secteur)}
                              onCheckedChange={(checked: boolean) => handleSecteurChange(secteur, checked)}
                            />
                            <label htmlFor={`secteur-${secteur}`} className="text-sm cursor-pointer">
                              {secteur}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </ScrollArea>
                <DialogFooter className="gap-2 mt-4">
                  <Button variant="outline" onClick={() => {
                    setDialogOpen(false);
                    setFormState(defaultForm);
                  }}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={mutationLoading}>
                    {mutationLoading ? 'Création...' : 'Ajouter'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs Managériaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Collaborateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
              <p className="text-xs text-gray-400 mt-1">
                {experts.length} experts, {managers.length} managers
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Dossiers en cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dossiers_en_cours ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                Moyenne: {avgDossiersEnCours} par collaborateur
              </p>
            </div>
            <Shield className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Dossiers signés</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dossiers_signes ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                Moyenne: {avgDossiersSignes} par collaborateur
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Managers</p>
              <p className="text-2xl font-bold text-gray-900">{managers.length}</p>
              {inactiveMembers.length > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {inactiveMembers.length} sans activité récente
                </p>
              )}
            </div>
            <Users className="h-8 w-8 text-slate-500" />
          </CardContent>
        </Card>
      </div>
      
      {/* Top Performer */}
      {topPerformer && (
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top performer</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {topPerformer.profile?.name || 'Collaborateur'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {topPerformer.stats?.dossiers_signes || 0} dossiers signés
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">
                  {topPerformer.stats?.dossiers_signes || 0}
                </p>
                <p className="text-xs text-gray-500">dossiers signés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Structure hiérarchique</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHierarchy.length ? (
              <ScrollArea className="max-h-[460px] pr-4">
                <HierarchyList nodes={filteredHierarchy} />
              </ScrollArea>
            ) : (
              <p className="text-sm text-gray-500">
                {permissions?.isManager 
                  ? 'Aucun expert dans votre équipe pour le moment.'
                  : 'Aucun membre pour ce cabinet.'}
              </p>
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
                    <TableHead>Dernière activité</TableHead>
                    <TableHead>Statut</TableHead>
                    {canManageMembers(permissions) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => {
                    // Calculer les jours depuis la dernière activité
                    let daysSinceActivity: number | null = null;
                    let activityLabel = 'Jamais';
                    if (member.stats?.last_activity) {
                      const lastActivity = new Date(member.stats.last_activity);
                      daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
                      if (daysSinceActivity === 0) {
                        activityLabel = "Aujourd'hui";
                      } else if (daysSinceActivity === 1) {
                        activityLabel = 'Hier';
                      } else if (daysSinceActivity < 7) {
                        activityLabel = `Il y a ${daysSinceActivity} jours`;
                      } else if (daysSinceActivity < 30) {
                        activityLabel = `Il y a ${Math.floor(daysSinceActivity / 7)} semaines`;
                      } else {
                        activityLabel = `Il y a ${Math.floor(daysSinceActivity / 30)} mois`;
                      }
                    }
                    
                    const isInactive = daysSinceActivity !== null && daysSinceActivity > 30;
                    
                    return (
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
                            <p className="font-semibold text-emerald-600">{member.stats?.dossiers_signes || 0} signés</p>
                            <p className="text-xs text-gray-500">{member.stats?.dossiers_en_cours || 0} en cours</p>
                            <p className="text-xs text-gray-400">{member.stats?.dossiers_total || 0} total</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className={isInactive ? 'text-orange-600 font-medium' : 'text-gray-700'}>
                              {activityLabel}
                            </p>
                            {isInactive && (
                              <p className="text-xs text-orange-500">⚠️ Inactif</p>
                            )}
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
                    );
                  })}
                  {!members.length && (
                    <TableRow>
                      <TableCell colSpan={6}>
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

      {/* Gestion des produits du cabinet (OWNER uniquement) */}
      {permissions?.isOwner && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestion des produits du cabinet</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez les produits éligibles de votre cabinet et leurs commissions. Ces produits seront disponibles lors de l'ajout de collaborateurs.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Bientôt : ajouter un produit au cabinet')}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProduits ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Chargement des produits...</p>
              </div>
            ) : produitsEligibles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Aucun produit configuré pour ce cabinet</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.info('Bientôt : ajouter un produit')}>
                  Ajouter le premier produit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {produitsEligibles.map((produit) => (
                  <div key={produit.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{produit.nom}</p>
                      {produit.description && (
                        <p className="text-xs text-gray-500 mt-1">{produit.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-500">Commission cabinet: </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {produit.commission_rate ? `${Math.round(produit.commission_rate * 100)}%` : 'Non définie'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Mode: </span>
                          <span className="text-sm text-gray-700">{produit.fee_mode || 'percent'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info('Bientôt : modifier commission')}>
                        Modifier
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info('Bientôt : supprimer produit')}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consultation des produits (MANAGER uniquement) */}
      {permissions?.isManager && !permissions?.isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Produits du cabinet</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Consultation des produits éligibles de votre cabinet (modification réservée au Owner)
            </p>
          </CardHeader>
          <CardContent>
            {loadingProduits ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Chargement des produits...</p>
              </div>
            ) : produitsEligibles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucun produit configuré pour ce cabinet</p>
            ) : (
              <div className="space-y-3">
                {produitsEligibles.map((produit) => (
                  <div key={produit.id} className="border rounded-lg p-4">
                    <p className="font-medium text-gray-900">{produit.nom}</p>
                    {produit.description && (
                      <p className="text-xs text-gray-500 mt-1">{produit.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <span className="text-xs text-gray-500">Commission cabinet: </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {produit.commission_rate ? `${Math.round(produit.commission_rate * 100)}%` : 'Non définie'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Mode: </span>
                        <span className="text-sm text-gray-700">{produit.fee_mode || 'percent'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

