import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CreateRDVInput {
  // Participants (au moins expert_id OU apporteur_id requis)
  client_id: string;
  expert_id?: string | null;
  apporteur_id?: string | null;
  
  // Détails du RDV
  meeting_type: 'physical' | 'video' | 'phone';
  scheduled_date: string; // Format: YYYY-MM-DD
  scheduled_time: string; // Format: HH:MM ou HH:MM:SS
  duration_minutes?: number;
  
  // Lieu (adapté selon meeting_type)
  location?: string;      // Si physical : adresse
  meeting_url?: string;   // Si video : lien Zoom/Meet/Teams
  // Note: Si phone, le numéro est déjà dans les infos du client
  
  // Informations
  title?: string;
  notes?: string;
  
  // Métadonnées
  source?: string;
  category?: string;
  priority?: number;
  created_by: string;
  
  // Business context
  product_ids?: string[]; // IDs des ClientProduitEligible liés
  metadata?: Record<string, any>;
}

export interface RDVResult {
  id: string;
  client_id: string;
  expert_id: string | null;
  apporteur_id: string | null;
  meeting_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  title: string;
  [key: string]: any;
}

// ============================================================================
// SERVICE RDV
// ============================================================================

export class RDVService {
  
  /**
   * Créer un RDV
   * 
   * Règles métier :
   * - client_id OBLIGATOIRE (le prospect)
   * - Au moins expert_id OU apporteur_id requis
   * - Possible d'avoir les deux (RDV à 3)
   */
  static async createRDV(data: CreateRDVInput): Promise<RDVResult> {
    console.log('📅 Création RDV...', {
      client_id: data.client_id,
      expert_id: data.expert_id || 'non',
      apporteur_id: data.apporteur_id || 'non',
      meeting_type: data.meeting_type
    });
    
    // Validation 1 : client_id obligatoire
    if (!data.client_id) {
      throw new Error('client_id est obligatoire pour créer un RDV');
    }
    
    // Validation 2 : Au moins expert_id OU apporteur_id
    if (!data.expert_id && !data.apporteur_id) {
      throw new Error('Au moins expert_id ou apporteur_id est requis');
    }
    
    // Générer le titre si absent
    const title = data.title || this.generateTitle(data);
    
    // Préparer les données pour l'insertion
    const rdvData = {
      // Participants
      client_id: data.client_id,
      expert_id: data.expert_id || null,
      apporteur_id: data.apporteur_id || null,
      
      // Détails
      meeting_type: data.meeting_type,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes || 60,
      
      // Lieu
      location: data.location || null,
      meeting_url: data.meeting_url || null,
      
      // Informations
      title: title,
      notes: data.notes || null,
      
      // Statut
      status: 'scheduled',
      
      // Métadonnées
      source: data.source || 'apporteur',
      category: data.category || 'client_rdv',
      priority: data.priority || 1,
      created_by: data.created_by,
      
      // Metadata JSON
      metadata: {
        ...data.metadata,
        product_ids: data.product_ids || [],
        created_via: 'RDVService'
      },
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📊 Données RDV à insérer:', {
      ...rdvData,
      metadata: JSON.stringify(rdvData.metadata)
    });
    
    // Insérer le RDV
    const { data: rdv, error } = await supabase
      .from('RDV')
      .insert(rdvData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur insertion RDV:', error);
      throw new Error(`Échec création RDV: ${error.message}`);
    }
    
    console.log('✅ RDV créé avec succès:', rdv.id);
    
    // Créer les liaisons RDV_Produits si produits fournis
    if (data.product_ids && data.product_ids.length > 0) {
      await this.linkRDVToProduits(rdv.id, data.product_ids);
    }
    
    return rdv as RDVResult;
  }
  
  /**
   * Créer plusieurs RDV en une seule transaction
   * Utile pour le wizard formulaire prospect
   */
  static async createMultipleRDV(rdvList: CreateRDVInput[]) {
    console.log(`📦 Création de ${rdvList.length} RDV...`);
    
    const results = {
      success: [] as RDVResult[],
      failed: [] as Array<{ data: CreateRDVInput; error: string }>
    };
    
    for (const rdvData of rdvList) {
      try {
        const rdv = await this.createRDV(rdvData);
        results.success.push(rdv);
      } catch (error) {
        console.error('❌ Échec création RDV:', error);
        results.failed.push({
          data: rdvData,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }
    
    console.log(`✅ ${results.success.length}/${rdvList.length} RDV créés avec succès`);
    
    if (results.failed.length > 0) {
      console.warn(`⚠️ ${results.failed.length} RDV en échec:`, results.failed);
    }
    
    return results;
  }
  
  /**
   * Générer un titre automatique pour le RDV
   */
  private static generateTitle(data: CreateRDVInput): string {
    const hasExpert = !!data.expert_id;
    const hasApporteur = !!data.apporteur_id;
    
    if (hasExpert && hasApporteur) {
      return 'RDV Expert + Apporteur';
    } else if (hasExpert) {
      return 'RDV avec Expert';
    } else if (hasApporteur) {
      return 'RDV Qualification Apporteur';
    }
    
    return 'Rendez-vous';
  }
  
  /**
   * Lier un RDV à des produits (ClientProduitEligible)
   */
  private static async linkRDVToProduits(rdv_id: string, product_ids: string[]) {
    console.log(`🔗 Liaison de ${product_ids.length} produit(s) au RDV ${rdv_id}...`);
    
    const links = product_ids.map(product_id => ({
      rdv_id: rdv_id,
      client_produit_eligible_id: product_id,
      created_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('RDV_Produits')
      .insert(links);
    
    if (error) {
      console.error('⚠️ Erreur liaison RDV_Produits:', error);
      throw new Error(`Échec liaison produits: ${error.message}`);
    }
    
    console.log(`✅ ${links.length} produit(s) liés au RDV ${rdv_id}`);
  }
  
  /**
   * Récupérer les RDV d'un client
   */
  static async getRDVByClient(client_id: string) {
    const { data, error } = await supabase
      .from('RDV')
      .select(`
        *,
        Expert:expert_id(id, name, email, company_name),
        ApporteurAffaires:apporteur_id(id, first_name, last_name, company_name),
        RDV_Produits(
          id,
          client_produit_eligible_id,
          ClientProduitEligible:client_produit_eligible_id(
            id,
            ProduitEligible:produitId(id, nom, categorie)
          )
        )
      `)
      .eq('client_id', client_id)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    
    if (error) {
      console.error('❌ Erreur récupération RDV:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Mettre à jour le statut d'un RDV
   */
  static async updateRDVStatus(
    rdv_id: string, 
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled',
    notes?: string
  ) {
    console.log(`📝 Mise à jour statut RDV ${rdv_id} → ${status}`);
    
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('RDV')
      .update(updateData)
      .eq('id', rdv_id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      throw error;
    }
    
    console.log(`✅ Statut RDV mis à jour: ${status}`);
    return data;
  }
  
  /**
   * Annuler un RDV
   */
  static async cancelRDV(rdv_id: string, reason?: string) {
    return this.updateRDVStatus(rdv_id, 'cancelled', reason);
  }
}

