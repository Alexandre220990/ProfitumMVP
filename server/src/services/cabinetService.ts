import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType, NotificationPriority } from './notification-service';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

type CabinetMemberRole = 'OWNER' | 'MANAGER' | 'EXPERT' | 'ASSISTANT';
type CabinetMemberType = 'expert' | 'apporteur' | 'assistant' | 'owner' | 'manager';
type CabinetMemberStatus = 'active' | 'invited' | 'suspended' | 'disabled';

type SupabaseCabinetMember = {
  id: string;
  cabinet_id: string;
  member_id: string;
  member_type: CabinetMemberType | string;
  team_role: CabinetMemberRole;
  status: CabinetMemberStatus;
  manager_member_id: string | null;
  permissions: Record<string, any> | null;
  products: any[] | null;
  metrics: Record<string, any> | null;
  created_at: string;
  last_refresh_at?: string | null;
};

type MemberProfile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  type: CabinetMemberType | string;
};

type CabinetMemberWithProfile = SupabaseCabinetMember & {
  profile: MemberProfile | null;
};

type CabinetTeamStatRow = {
  cabinet_member_id: string;
  cabinet_id: string;
  member_id: string | null;
  dossiers_total: number;
  dossiers_en_cours: number;
  dossiers_signes: number;
  last_activity: string | null;
};

type CabinetHierarchyNode = CabinetMemberWithProfile & {
  stats: CabinetTeamStatRow | null;
  children: CabinetHierarchyNode[];
};

type AssignCabinetMemberInput = {
  cabinetId: string;
  memberId: string;
  memberType: CabinetMemberType;
  teamRole: CabinetMemberRole;
  status?: CabinetMemberStatus;
  managerMemberId?: string | null;
  permissions?: Record<string, any>;
  products?: any[];
};

const ROLE_PRIORITY: Record<CabinetMemberRole, number> = {
  OWNER: 0,
  MANAGER: 1,
  EXPERT: 2,
  ASSISTANT: 3
};

export class CabinetService {
  // ---------------------------------------------------------------------------
  // Cabinets
  // ---------------------------------------------------------------------------

  static async listCabinets(filters: { search?: string }) {
    let query = supabase
      .from('Cabinet')
      .select(`
        id,
        name,
        slug,
        status,
        siret,
        siren,
        phone,
        email,
        address,
        owner_expert_id,
        metadata,
        active_from,
        active_until,
        created_at,
        updated_at,
        owner:owner_expert_id(id, name, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const cabinetIds = (data || []).map(cab => cab.id);
    
    // Récupérer les stats agrégées et les counts de membres/produits
    const [statsByCabinet, membersCounts, produitsCounts, clientsActifsCounts, prospectsCounts] = await Promise.all([
      this.getAggregatedTeamStats(cabinetIds),
      this.getMembersCounts(cabinetIds),
      this.getProduitsCounts(cabinetIds),
      this.getClientsActifsCounts(cabinetIds),
      this.getProspectsCounts(cabinetIds)
    ]);

    return (data || []).map(cabinet => ({
      ...cabinet,
      stats_summary: {
        members: membersCounts[cabinet.id] || 0,
        dossiers_total: statsByCabinet[cabinet.id]?.dossiers_total || 0,
        dossiers_en_cours: statsByCabinet[cabinet.id]?.dossiers_en_cours || 0,
        dossiers_signes: statsByCabinet[cabinet.id]?.dossiers_signes || 0,
        clients_actifs: clientsActifsCounts[cabinet.id] || 0,
        prospects_count: prospectsCounts[cabinet.id] || 0
      },
      produits_count: produitsCounts[cabinet.id] || 0
    }));
  }

  static async getCabinetDetail(id: string) {
    const { data, error } = await supabase
      .from('Cabinet')
      .select(`
        id,
        name,
        slug,
        status,
        siret,
        siren,
        phone,
        email,
        address,
        owner_expert_id,
        metadata,
        active_from,
        active_until,
        created_at,
        updated_at,
        owner:owner_expert_id(id, name, first_name, last_name, email),
        members:CabinetMember(*),
        produits:CabinetProduitEligible(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const [members, stats] = await Promise.all([
      this.getCabinetMembersWithProfiles(id),
      this.getCabinetTeamStats(id)
    ]);

    const hierarchy = this.buildHierarchy(members, stats);
    const kpis = this.computeCabinetKpis(stats);

    return {
      ...data,
      hierarchy,
      teamStats: stats,
      kpis
    };
  }

  static async createCabinet(payload: {
    name: string;
    siret?: string;
    siren?: string;
    phone?: string;
    email?: string;
    address?: string;
    owner_expert_id?: string;
    metadata?: Record<string, any>;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('Cabinet')
      .insert({
        ...payload,
        status: payload.status || 'draft',
        metadata: payload.metadata || {}
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCabinet(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('Cabinet')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async setCabinetOwner(cabinetId: string, expertId: string) {
    const { data, error } = await supabase
      .from('Cabinet')
      .update({ owner_expert_id: expertId, status: 'active' })
      .eq('id', cabinetId)
      .select('*')
      .single();

    if (error) throw error;
    await this.assignCabinetMember({
      cabinetId,
      memberId: expertId,
      memberType: 'expert',
      teamRole: 'OWNER',
      status: 'active',
      permissions: { superUser: true }
    });
    return data;
  }

  // ---------------------------------------------------------------------------
  // Produits
  // ---------------------------------------------------------------------------

  static async upsertCabinetProducts(
    cabinetId: string,
    products: Array<{
      produit_eligible_id: string;
      commission_rate?: number;
      fee_amount?: number;
      fee_mode?: 'fixed' | 'percent';
      is_active?: boolean;
      metadata?: Record<string, any>;
    }>
  ) {
    if (!Array.isArray(products)) return [];

    const payload = products.map(product => ({
      cabinet_id: cabinetId,
      produit_eligible_id: product.produit_eligible_id,
      commission_rate: product.commission_rate ?? 0,
      fee_amount: product.fee_amount ?? 0,
      fee_mode: product.fee_mode || 'fixed',
      is_active: product.is_active ?? true,
      metadata: product.metadata || {}
    }));

    const { data, error } = await supabase
      .from('CabinetProduitEligible')
      .upsert(payload, { onConflict: 'cabinet_id,produit_eligible_id' })
      .select('*');

    if (error) throw error;
    return data;
  }

  // ---------------------------------------------------------------------------
  // Membres & hiérarchie
  // ---------------------------------------------------------------------------

  static async assignCabinetMember(input: AssignCabinetMemberInput) {
    const { data, error } = await supabase.rpc('assign_cabinet_member', {
      _cabinet_id: input.cabinetId,
      _member_id: input.memberId,
      _member_type: input.memberType,
      _team_role: input.teamRole,
      _manager_member_id: input.managerMemberId ?? null,
      _status: input.status || 'active',
      _permissions: input.permissions || {},
      _products: input.products || []
    });

    if (error) throw error;

    // Notification automatique pour le nouveau membre
    try {
      const cabinet = await this.getCabinetDetail(input.cabinetId);
      if (cabinet) {
        await new NotificationService().sendNotification(
          input.memberId,
          'expert',
          NotificationType.EXPERT_NEW_ASSIGNMENT,
          {
            title: `Vous avez été ajouté au cabinet ${cabinet.name}`,
            message: `Vous avez été assigné comme ${input.teamRole} au cabinet ${cabinet.name}`,
            cabinet_id: input.cabinetId,
            cabinet_name: cabinet.name,
            team_role: input.teamRole,
            member_id: input.memberId
          },
          NotificationPriority.MEDIUM
        );
      }
    } catch (notifError) {
      console.error('Erreur notification ajout membre:', notifError);
      // Ne pas bloquer l'opération en cas d'erreur de notification
    }

    return data;
  }

  static async addMember(payload: {
    cabinet_id: string;
    member_id: string;
    member_type: CabinetMemberType;
    team_role?: CabinetMemberRole;
    manager_member_id?: string | null;
    status?: CabinetMemberStatus;
    permissions?: Record<string, any>;
    products?: any[];
  }) {
    return this.assignCabinetMember({
      cabinetId: payload.cabinet_id,
      memberId: payload.member_id,
      memberType: payload.member_type,
      teamRole: payload.team_role || (payload.member_type === 'apporteur' ? 'ASSISTANT' : 'EXPERT'),
      managerMemberId: payload.manager_member_id ?? null,
      status: payload.status,
      permissions: payload.permissions,
      products: payload.products
    });
  }

  static async assignManager(cabinetId: string, expertId: string) {
    const { data, error } = await supabase.rpc('assign_manager', {
      _cabinet_id: cabinetId,
      _expert_id: expertId
    });

    if (error) throw error;
    return data;
  }

  static async assignExpertToManager(cabinetId: string, expertId: string, managerMemberId: string) {
    const { data, error } = await supabase.rpc('assign_expert_to_manager', {
      _cabinet_id: cabinetId,
      _expert_id: expertId,
      _manager_member_id: managerMemberId
    });

    if (error) throw error;
    return data;
  }

  static async updateCabinetMember(memberId: string, updates: Partial<Pick<SupabaseCabinetMember, 'status' | 'permissions' | 'products' | 'manager_member_id' | 'team_role'>>) {
    const memberBefore = await supabase
      .from('CabinetMember')
      .select('*')
      .eq('id', memberId)
      .single();

    const { data, error } = await supabase
      .from('CabinetMember')
      .update({
        ...updates,
        last_refresh_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select('*')
      .single();

    if (error) throw error;
    await supabase.rpc('refresh_cabinet_team_stat');

    // Notification automatique si statut changé
    if (updates.status && memberBefore.data?.status !== updates.status) {
      try {
        const cabinet = await this.getCabinetDetail(memberBefore.data?.cabinet_id);
        if (cabinet && memberBefore.data) {
          const notificationType = updates.status === 'active' || updates.status === 'invited'
            ? NotificationType.EXPERT_ACCOUNT_REACTIVATED
            : NotificationType.EXPERT_ACCOUNT_SUSPENDED;
          
          await new NotificationService().sendNotification(
            memberBefore.data.member_id,
            'expert',
            notificationType,
            {
              title: `Votre statut dans le cabinet ${cabinet.name} a changé`,
              message: `Votre statut est maintenant : ${updates.status}`,
              cabinet_id: memberBefore.data.cabinet_id,
              cabinet_name: cabinet.name,
              old_status: memberBefore.data.status,
              new_status: updates.status
            },
            NotificationPriority.MEDIUM
          );
        }
      } catch (notifError) {
        console.error('Erreur notification update membre:', notifError);
      }
    }

    return data;
  }

  static async removeMember(cabinetId: string, memberId: string) {
    const { error } = await supabase
      .from('CabinetMember')
      .update({
        status: 'disabled',
        manager_member_id: null,
        permissions: {},
        products: []
      })
      .eq('cabinet_id', cabinetId)
      .eq('member_id', memberId);

    if (error) throw error;
    await supabase.rpc('refresh_cabinet_team_stat');
    return true;
  }

  static async getCabinetMembersWithProfiles(cabinetId: string) {
    const members = await this.fetchCabinetMembers(cabinetId);
    const profiles = await this.fetchMemberProfiles(members);

    return members.map(member => ({
      ...member,
      profile: profiles.get(member.member_id) || null
    }));
  }

  static async getCabinetHierarchy(cabinetId: string): Promise<CabinetHierarchyNode[]> {
    const [members, stats] = await Promise.all([
      this.getCabinetMembersWithProfiles(cabinetId),
      this.getCabinetTeamStats(cabinetId)
    ]);
    return this.buildHierarchy(members, stats);
  }

  // ---------------------------------------------------------------------------
  // Lecture métier (apporteurs, clients, shares, timeline, tasks)
  // ---------------------------------------------------------------------------

  static async getCabinetApporteurs(cabinetId: string) {
    const members = await this.getCabinetMembersWithProfiles(cabinetId);
    return members
      .filter(member => member.member_type === 'apporteur')
      .map(member => ({
        id: member.id,
        member_id: member.member_id,
        member_type: member.member_type,
        created_at: member.created_at,
        status: member.status,
        apporteur: member.profile || null
      }));
  }

  static async getCabinetClients(cabinetId: string) {
    const { data, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        status,
        produit_eligible_id,
        clientId,
        Client:clientId(id, name, company_name),
        ProduitEligible:produit_eligible_id(nom),
        Expert:expert_id(id, cabinet_id)
      `)
      .eq('Expert.cabinet_id', cabinetId);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      dossier_id: row.id,
      status: row.status,
      client_id: row.clientId,
      client_name: row.Client?.name || row.Client?.company_name || row.clientId,
      produit_eligible_id: row.produit_eligible_id,
      produit_nom: row.ProduitEligible?.nom,
      expert_id: row.Expert?.id
    }));
  }

  static async listCabinetShares(cabinetId: string) {
    const { data, error } = await supabase
      .from('ClientProduitEligibleShare')
      .select(`
        id,
        client_produit_eligible_id,
        expert_id,
        cabinet_id,
        permissions,
        created_at,
        ClientProduitEligible:client_produit_eligible_id(id, clientId),
        Expert:expert_id(id, name)
      `)
      .eq('cabinet_id', cabinetId);

    if (error) throw error;
    return data || [];
  }

  static async createCabinetShare(payload: {
    cabinet_id: string;
    client_produit_eligible_id: string;
    expert_id?: string;
    permissions?: Record<string, boolean>;
  }) {
    const { data, error } = await supabase
      .from('ClientProduitEligibleShare')
      .insert({
        cabinet_id: payload.cabinet_id,
        client_produit_eligible_id: payload.client_produit_eligible_id,
        expert_id: payload.expert_id || null,
        permissions: payload.permissions || { read: true, write: false }
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteCabinetShare(shareId: string) {
    const { error } = await supabase
      .from('ClientProduitEligibleShare')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
    return true;
  }

  static async getCabinetTimeline(
    cabinetId: string,
    filters?: { days?: number; page?: number; limit?: number }
  ) {
    let query = supabase
      .from('RDV_Timeline')
      .select(`
        id,
        rdv_id,
        client_id,
        event_type,
        metadata,
        created_at,
        RDV:rdv_id(title, scheduled_date, scheduled_time)
      `)
      .eq('cabinet_id', cabinetId);

    if (filters?.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.days);
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    const limit = filters?.limit || 50;
    const page = filters?.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getCabinetTasks(cabinetId: string, filters?: { status?: string; type?: string }) {
    let query = supabase
      .from('RDV_Task')
      .select(`
        id,
        type,
        title,
        due_date,
        status,
        priority,
        rdv_id,
        created_at,
        RDV:rdv_id(title, scheduled_date, scheduled_time)
      `)
      .eq('cabinet_id', cabinetId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    query = query.order('due_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private static async fetchCabinetMembers(cabinetId: string): Promise<SupabaseCabinetMember[]> {
    const { data, error } = await supabase
      .from('CabinetMember')
      .select('id, cabinet_id, member_id, member_type, team_role, status, manager_member_id, permissions, products, metrics, created_at, last_refresh_at')
      .eq('cabinet_id', cabinetId)
      .order('team_role', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getMemberRecord(cabinetId: string, memberId: string) {
    const { data, error } = await supabase
      .from('CabinetMember')
      .select('id, cabinet_id, member_id, team_role, status, manager_member_id, permissions, products')
      .eq('cabinet_id', cabinetId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getMemberByRecordId(memberRecordId: string) {
    const { data, error } = await supabase
      .from('CabinetMember')
      .select('id, cabinet_id, member_id, team_role, status, manager_member_id, permissions, products')
      .eq('id', memberRecordId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  private static async fetchMemberProfiles(members: SupabaseCabinetMember[]) {
    const expertIds = members.filter(m => m.member_type === 'expert').map(m => m.member_id);
    const apporteurIds = members.filter(m => m.member_type === 'apporteur').map(m => m.member_id);

    const [experts, apporteurs] = await Promise.all([
      expertIds.length
        ? supabase
            .from('Expert')
            .select('id, first_name, last_name, name, email, phone, company_name')
            .in('id', expertIds)
        : Promise.resolve({ data: [], error: null }),
      apporteurIds.length
        ? supabase
            .from('ApporteurAffaires')
            .select('id, first_name, last_name, company_name, email, phone')
            .in('id', apporteurIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (experts.error) throw experts.error;
    if (apporteurs.error) throw apporteurs.error;

    const map = new Map<string, MemberProfile>();

    (experts.data || []).forEach(expert => {
      map.set(expert.id, {
        id: expert.id,
        first_name: expert.first_name,
        last_name: expert.last_name,
        name: expert.name,
        email: expert.email,
        phone: expert.phone,
        company_name: expert.company_name,
        type: 'expert'
      });
    });

    (apporteurs.data || []).forEach(apporteur => {
      map.set(apporteur.id, {
        id: apporteur.id,
        first_name: apporteur.first_name,
        last_name: apporteur.last_name,
        name: `${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim() || apporteur.company_name,
        email: apporteur.email,
        phone: apporteur.phone,
        company_name: apporteur.company_name,
        type: 'apporteur'
      });
    });

    return map;
  }

  private static buildHierarchy(members: CabinetMemberWithProfile[], stats: CabinetTeamStatRow[]): CabinetHierarchyNode[] {
    const nodes = new Map<string, CabinetHierarchyNode>();
    const statsMap = new Map(stats.map(stat => [stat.cabinet_member_id, stat]));

    members.forEach(member => {
      nodes.set(member.id, {
        ...member,
        stats: statsMap.get(member.id) || null,
        children: []
      });
    });

    const roots: CabinetHierarchyNode[] = [];

    nodes.forEach(node => {
      if (node.manager_member_id && nodes.has(node.manager_member_id)) {
        nodes.get(node.manager_member_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortFn = (a: CabinetHierarchyNode, b: CabinetHierarchyNode) => {
      const diff = ROLE_PRIORITY[a.team_role] - ROLE_PRIORITY[b.team_role];
      if (diff !== 0) return diff;
      const nameA = a.profile?.name || '';
      const nameB = b.profile?.name || '';
      return nameA.localeCompare(nameB);
    };

    roots.sort(sortFn);
    roots.forEach(root => root.children.sort(sortFn));

    return roots;
  }

  static async getCabinetTeamStats(cabinetId: string): Promise<CabinetTeamStatRow[]> {
    const { data, error } = await supabase
      .from('CabinetTeamStat')
      .select('*')
      .eq('cabinet_id', cabinetId);

    if (error) throw error;
    return data || [];
  }

  static async refreshTeamStats() {
    const { error } = await supabase.rpc('refresh_cabinet_team_stat');
    if (error) throw error;
    return true;
  }

  private static async getAggregatedTeamStats(cabinetIds: string[]) {
    if (!cabinetIds.length) return {};

    const { data, error } = await supabase
      .from('CabinetTeamStat')
      .select('cabinet_id, dossiers_total, dossiers_en_cours, dossiers_signes')
      .in('cabinet_id', cabinetIds);

    if (error) throw error;

    return (data || []).reduce<Record<string, { dossiers_total: number; dossiers_en_cours: number; dossiers_signes: number }>>(
      (acc, row) => {
        const cabId = row.cabinet_id;
        if (!cabinetIds.includes(cabId)) {
          return acc;
        }
        if (!acc[cabId]) {
          acc[cabId] = {
            dossiers_total: 0,
            dossiers_en_cours: 0,
            dossiers_signes: 0
          };
        }
        acc[cabId].dossiers_total += row.dossiers_total;
        acc[cabId].dossiers_en_cours += row.dossiers_en_cours;
        acc[cabId].dossiers_signes += row.dossiers_signes;
        return acc;
      },
      {}
    );
  }

  private static async getMembersCounts(cabinetIds: string[]): Promise<Record<string, number>> {
    if (!cabinetIds.length) return {};

    const { data, error } = await supabase
      .from('CabinetMember')
      .select('cabinet_id')
      .in('cabinet_id', cabinetIds)
      .in('status', ['active', 'invited']);

    if (error) throw error;

    return (data || []).reduce<Record<string, number>>((acc, row) => {
      const cabId = row.cabinet_id;
      acc[cabId] = (acc[cabId] || 0) + 1;
      return acc;
    }, {});
  }

  private static async getProduitsCounts(cabinetIds: string[]): Promise<Record<string, number>> {
    if (!cabinetIds.length) return {};

    const { data, error } = await supabase
      .from('CabinetProduitEligible')
      .select('cabinet_id')
      .in('cabinet_id', cabinetIds)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).reduce<Record<string, number>>((acc, row) => {
      const cabId = row.cabinet_id;
      acc[cabId] = (acc[cabId] || 0) + 1;
      return acc;
    }, {});
  }

  private static async getClientsActifsCounts(cabinetIds: string[]): Promise<Record<string, number>> {
    if (!cabinetIds.length) return {};

    // Récupérer tous les experts des cabinets
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, cabinet_id')
      .in('cabinet_id', cabinetIds);

    if (expertsError) throw expertsError;
    if (!experts || experts.length === 0) {
      return cabinetIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
    }

    const expertIds = experts.map(e => e.id);
    const expertToCabinet = experts.reduce<Record<string, string>>((acc, expert) => {
      if (expert.cabinet_id) {
        acc[expert.id] = expert.cabinet_id;
      }
      return acc;
    }, {});

    // Compter les clients distincts qui ont au moins un ClientProduitEligible avec un expert du cabinet
    const { data: cpeData, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, expert_id')
      .in('expert_id', expertIds)
      .not('expert_id', 'is', null);

    if (cpeError) throw cpeError;

    // Compter les clients distincts par cabinet
    const clientCounts: Record<string, Set<string>> = {};
    (cpeData || []).forEach(cpe => {
      if (cpe.expert_id && expertToCabinet[cpe.expert_id]) {
        const cabId = expertToCabinet[cpe.expert_id];
        if (!clientCounts[cabId]) {
          clientCounts[cabId] = new Set();
        }
        clientCounts[cabId].add(cpe.clientId);
      }
    });

    return cabinetIds.reduce<Record<string, number>>((acc, cabId) => {
      acc[cabId] = clientCounts[cabId]?.size || 0;
      return acc;
    }, {});
  }

  private static async getProspectsCounts(cabinetIds: string[]): Promise<Record<string, number>> {
    if (!cabinetIds.length) return {};

    // Récupérer tous les experts des cabinets
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, cabinet_id')
      .in('cabinet_id', cabinetIds);

    if (expertsError) throw expertsError;
    if (!experts || experts.length === 0) {
      return cabinetIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
    }

    const expertIds = experts.map(e => e.id);
    const expertToCabinet = experts.reduce<Record<string, string>>((acc, expert) => {
      if (expert.cabinet_id) {
        acc[expert.id] = expert.cabinet_id;
      }
      return acc;
    }, {});

    // Récupérer les prospects (clients avec status='prospect') qui ont un ClientProduitEligible avec un expert du cabinet
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, status')
      .eq('status', 'prospect');

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) {
      return cabinetIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
    }

    const prospectClientIds = clients.map(c => c.id);

    // Récupérer les ClientProduitEligible des prospects avec experts du cabinet
    const { data: cpeData, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, expert_id')
      .in('clientId', prospectClientIds)
      .in('expert_id', expertIds)
      .not('expert_id', 'is', null);

    if (cpeError) throw cpeError;

    // Compter les prospects distincts par cabinet
    const prospectCounts: Record<string, Set<string>> = {};
    (cpeData || []).forEach(cpe => {
      if (cpe.expert_id && expertToCabinet[cpe.expert_id]) {
        const cabId = expertToCabinet[cpe.expert_id];
        if (!prospectCounts[cabId]) {
          prospectCounts[cabId] = new Set();
        }
        prospectCounts[cabId].add(cpe.clientId);
      }
    });

    return cabinetIds.reduce<Record<string, number>>((acc, cabId) => {
      acc[cabId] = prospectCounts[cabId]?.size || 0;
      return acc;
    }, {});
  }

  private static computeCabinetKpis(stats: CabinetTeamStatRow[]) {
    return stats.reduce(
      (acc, stat) => {
        acc.dossiers_total += stat.dossiers_total;
        acc.dossiers_en_cours += stat.dossiers_en_cours;
        acc.dossiers_signes += stat.dossiers_signes;
        return acc;
      },
      {
        dossiers_total: 0,
        dossiers_en_cours: 0,
        dossiers_signes: 0
      }
    );
  }

  static getCabinetKpisFromStats(stats: CabinetTeamStatRow[]) {
    return this.computeCabinetKpis(stats);
  }

  static async getExpertCabinetInfo(expertId: string) {
    // Récupérer le cabinet_id de l'expert
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('id, cabinet_id')
      .eq('id', expertId)
      .single();

    if (expertError || !expert?.cabinet_id) {
      return null;
    }

    // Récupérer le membership dans le cabinet
    const membership = await this.getMemberRecord(expert.cabinet_id, expertId);
    
    if (!membership) {
      return null;
    }

    // Construire les permissions
    const isOwner = membership.team_role === 'OWNER';
    const isManager = membership.team_role === 'MANAGER';
    const canManageMembers = isOwner || isManager;

    return {
      cabinet_id: expert.cabinet_id,
      membership: {
        id: membership.id,
        team_role: membership.team_role,
        status: membership.status
      },
      permissions: {
        isOwner,
        isManager,
        canManageMembers,
        managerMemberId: membership.manager_member_id || null
      }
    };
  }
}


