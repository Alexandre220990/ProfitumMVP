export type CabinetMemberRole = 'expert' | 'apporteur' | 'responsable_cabinet';
export type CabinetMemberType = 'expert' | 'apporteur' | 'assistant';
export type CabinetTeamRole = 'OWNER' | 'MANAGER' | 'EXPERT' | 'ASSISTANT';
export type CabinetMemberStatus = 'active' | 'invited' | 'suspended' | 'disabled';

export interface CabinetKPIs {
  clients_actifs?: number;
  dossiers_en_cours?: number;
  fees_mensuels?: number;
  rdv_30j?: number;
  dossiers_total?: number;
  dossiers_signes?: number;
}

export interface CabinetTeamKPIs {
  dossiers_total: number;
  dossiers_en_cours: number;
  dossiers_signes: number;
}

export interface CabinetProduct {
  id: string;
  cabinet_id: string;
  produit_eligible_id: string;
  commission_rate: number;
  fee_amount: number;
  fee_mode: 'fixed' | 'percent';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CabinetMember {
  id: string;
  cabinet_id: string;
  member_id: string;
  member_type: CabinetMemberRole;
  created_at?: string;
}

export interface CabinetApporteur {
  id: string;
  member_id: string;
  member_type: CabinetMemberRole;
  created_at?: string;
  apporteur?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone_number?: string;
  };
}

export interface CabinetShare {
  id: string;
  client_produit_eligible_id: string;
  expert_id?: string;
  cabinet_id: string;
  permissions?: Record<string, boolean>;
  created_at?: string;
  ClientProduitEligible?: {
    id: string;
    clientId: string;
  };
  Expert?: {
    id: string;
    name?: string;
  };
}

export interface CabinetProductPayload {
  produit_eligible_id: string;
  commission_rate?: number;
  fee_amount?: number;
  fee_mode?: 'fixed' | 'percent';
  is_active?: boolean;
}

export interface Cabinet {
  id: string;
  name: string;
  siret?: string;
  siren?: string;
  phone?: string;
  email?: string;
  address?: string;
  slug?: string;
  status?: string;
  owner_expert_id?: string;
  owner?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  created_at?: string;
  updated_at?: string;
  members?: CabinetMember[];
  produits?: CabinetProduct[];
  hierarchy?: CabinetHierarchyNode[];
  teamStats?: CabinetTeamStatsRow[];
  kpis?: CabinetKPIs | CabinetTeamKPIs;
  stats_summary?: {
    members: number;
    dossiers_total: number;
    dossiers_en_cours: number;
    dossiers_signes: number;
  };
}

export interface CabinetMemberRecord {
  id: string;
  cabinet_id: string;
  member_id: string;
  member_type: CabinetMemberType;
  team_role: CabinetTeamRole;
  status: CabinetMemberStatus;
  manager_member_id?: string | null;
  permissions?: Record<string, any>;
  products?: any[];
  metrics?: Record<string, any>;
  created_at?: string;
  last_refresh_at?: string | null;
  profile?: CabinetMemberProfile | null;
}

export interface CabinetMemberProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  type?: CabinetMemberType;
}

export interface CabinetTeamStatsRow {
  cabinet_member_id: string;
  cabinet_id: string;
  member_id?: string | null;
  dossiers_total: number;
  dossiers_en_cours: number;
  dossiers_signes: number;
  last_activity?: string | null;
}

export interface CabinetHierarchyNode extends CabinetMemberRecord {
  stats: CabinetTeamStatsRow | null;
  children: CabinetHierarchyNode[];
}

export interface CabinetPermissions {
  isOwner: boolean;
  isManager: boolean;
  canManageMembers: boolean;
  managerMemberId: string | null;
}

export interface CabinetContextPayload {
  cabinet: Cabinet;
  hierarchy: CabinetHierarchyNode[];
  teamStats: CabinetTeamStatsRow[];
  kpis: CabinetTeamKPIs;
  membership?: CabinetMemberRecord | null;
  permissions: CabinetPermissions;
}

