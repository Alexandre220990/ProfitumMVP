import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class CabinetService {
  static async listCabinets(filters: { search?: string }) {
    let query = supabase
      .from('Cabinet')
      .select(`
        *,
        members:CabinetMember(count),
        produits:CabinetProduitEligible(count)
      `);

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getCabinetDetail(id: string) {
    const { data, error } = await supabase
      .from('Cabinet')
      .select(`
        *,
        members:CabinetMember(*),
        produits:CabinetProduitEligible(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createCabinet(payload: {
    name: string;
    siret?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    const { data, error } = await supabase
      .from('Cabinet')
      .insert(payload)
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

  static async upsertCabinetProducts(cabinetId: string, products: Array<{
    produit_eligible_id: string;
    commission_rate?: number;
    fee_amount?: number;
    fee_mode?: 'fixed' | 'percent';
    is_active?: boolean;
  }>) {
    if (!Array.isArray(products)) return [];

    const payload = products.map(product => ({
      cabinet_id: cabinetId,
      produit_eligible_id: product.produit_eligible_id,
      commission_rate: product.commission_rate ?? 0,
      fee_amount: product.fee_amount ?? 0,
      fee_mode: product.fee_mode || 'fixed',
      is_active: product.is_active ?? true
    }));

    const { data, error } = await supabase
      .from('CabinetProduitEligible')
      .upsert(payload, { onConflict: 'cabinet_id,produit_eligible_id' })
      .select('*');

    if (error) throw error;
    return data;
  }

  static async addMember(payload: {
    cabinet_id: string;
    member_id: string;
    member_type: 'expert' | 'apporteur' | 'responsable_cabinet';
  }) {
    const { data, error } = await supabase
      .from('CabinetMember')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async removeMember(cabinetId: string, memberId: string) {
    const { error } = await supabase
      .from('CabinetMember')
      .delete()
      .eq('cabinet_id', cabinetId)
      .eq('member_id', memberId);

    if (error) throw error;
    return true;
  }

  static async getCabinetApporteurs(cabinetId: string) {
    const { data, error } = await supabase
      .from('CabinetMember')
      .select(`
        id,
        member_id,
        member_type,
        created_at,
        ApporteurAffaires:member_id(id, first_name, last_name, company_name, email, phone_number)
      `)
      .eq('cabinet_id', cabinetId)
      .eq('member_type', 'apporteur');

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      member_id: row.member_id,
      member_type: row.member_type,
      created_at: row.created_at,
      apporteur: row.ApporteurAffaires
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

  static async getCabinetTimeline(cabinetId: string, filters?: { days?: number; page?: number; limit?: number }) {
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
}

