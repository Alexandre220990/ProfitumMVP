export type CabinetMemberRole = 'expert' | 'apporteur' | 'responsable_cabinet';

export interface CabinetKPIs {
  clients_actifs?: number;
  dossiers_en_cours?: number;
  fees_mensuels?: number;
  rdv_30j?: number;
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
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  members?: CabinetMember[];
  produits?: CabinetProduct[];
  kpis?: CabinetKPIs;
}

