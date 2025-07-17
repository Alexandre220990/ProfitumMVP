import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class DatabaseOptimizer {
  /**
   * Optimiser les requêtes de la marketplace
   */
  static async getOptimizedExperts(filters: any = {}) {
    const startTime = Date.now();
    
    try {
      // Utiliser la vue optimisée si elle existe
      let query = supabase
        .from('ExpertMarketplaceView')
        .select('*');

      // Appliquer les filtres
      if (filters.specialization) {
        query = query.contains('specializations', [filters.specialization]);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.rating) {
        query = query.gte('rating', parseFloat(filters.rating));
      }

      // Tri optimisé
      if (filters.sortBy === 'rating') {
        query = query.order('avg_rating', { ascending: filters.sortOrder === 'asc' });
      } else if (filters.sortBy === 'experience') {
        query = query.order('completed_assignments', { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('avg_rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête experts optimisée: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête optimisée:', error);
      throw error;
    }
  }

  /**
   * Optimiser les requêtes de messages
   */
  static async getOptimizedMessages(assignmentId: string, limit: number = 50) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('message')
        .select(`
          id,
          content,
          sender_id,
          sender_type,
          timestamp,
          read_at,
          assignment_id
        `)
        .eq('assignment_id', assignmentId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête messages optimisée: ${endTime - startTime}ms`);

      return data?.reverse() || []; // Remettre dans l'ordre chronologique
    } catch (error) {
      console.error('❌ Erreur requête messages:', error);
      throw error;
    }
  }

  /**
   * Optimiser les requêtes d'assignations
   */
  static async getOptimizedAssignments(userId: string, userType: 'client' | 'expert') {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('AssignmentStatsView')
        .select('*')
        .eq(userType === 'client' ? 'client_id' : 'expert_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête assignations optimisée: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête assignations:', error);
      throw error;
    }
  }

  /**
   * Optimiser les requêtes de notifications
   */
  static async getOptimizedNotifications(expertId: string, limit: number = 20) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('ExpertNotifications')
        .select('*')
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête notifications optimisée: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête notifications:', error);
      throw error;
    }
  }

  /**
   * Requête optimisée pour les statistiques expert
   */
  static async getExpertStats(expertId: string) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .rpc('get_expert_stats', { p_expert_id: expertId });

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête stats expert optimisée: ${endTime - startTime}ms`);

      return data?.[0] || null;
    } catch (error) {
      console.error('❌ Erreur requête stats expert:', error);
      throw error;
    }
  }

  /**
   * Requête optimisée pour les notifications expert
   */
  static async getExpertNotifications(expertId: string) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .rpc('get_expert_notifications', { p_expert_id: expertId });

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête notifications expert optimisée: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête notifications expert:', error);
      throw error;
    }
  }

  /**
   * Requête optimisée pour les produits éligibles avec correspondances expert
   */
  static async getProductsWithExpertMatches(clientId: string) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          produit_id,
          statut,
          charte_signed,
          charte_signed_at,
          ProduitEligible!inner(
            id,
            nom,
            description,
            category
          )
        `)
        .eq('client_id', clientId)
        .eq('charte_signed', true);

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête produits avec correspondances: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête produits:', error);
      throw error;
    }
  }

  /**
   * Requête optimisée pour les experts par spécialisation
   */
  static async getExpertsBySpecialization(specialization: string) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('Expert')
        .select(`
          id,
          name,
          company_name,
          specializations,
          experience,
          location,
          rating,
          description,
          status,
          compensation
        `)
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .contains('specializations', [specialization])
        .order('rating', { ascending: false });

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête experts par spécialisation: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête experts par spécialisation:', error);
      throw error;
    }
  }

  /**
   * Requête optimisée pour les messages non lus
   */
  static async getUnreadMessages(userId: string, userType: 'client' | 'expert') {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('message')
        .select(`
          id,
          content,
          sender_id,
          sender_type,
          timestamp,
          assignment_id
        `)
        .neq('sender_type', userType)
        .is('read_at', null)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const endTime = Date.now();
      console.log(`⚡ Requête messages non lus: ${endTime - startTime}ms`);

      return data;
    } catch (error) {
      console.error('❌ Erreur requête messages non lus:', error);
      throw error;
    }
  }

  /**
   * Requête optimisée pour les statistiques globales
   */
  static async getGlobalStats() {
    const startTime = Date.now();
    
    try {
      // Requêtes parallèles pour les statistiques
      const [expertsCount, clientsCount, assignmentsCount, messagesCount] = await Promise.all([
        supabase.from('Expert').select('count', { count: 'exact', head: true }),
        supabase.from('Client').select('count', { count: 'exact', head: true }),
        supabase.from('ExpertAssignment').select('count', { count: 'exact', head: true }),
        supabase.from('message').select('count', { count: 'exact', head: true })
      ]);

      const endTime = Date.now();
      console.log(`⚡ Requête stats globales: ${endTime - startTime}ms`);

      return {
        experts: expertsCount.count || 0,
        clients: clientsCount.count || 0,
        assignments: assignmentsCount.count || 0,
        messages: messagesCount.count || 0
      };
    } catch (error) {
      console.error('❌ Erreur requête stats globales:', error);
      throw error;
    }
  }
} 