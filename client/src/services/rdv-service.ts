/**
 * Service RDV - API Centralisée pour tous les rendez-vous
 * Remplace les anciens services ClientRDV et CalendarEvent pour les RDV
 */

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface RDV {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  timezone?: string;
  
  // Type et modalité
  meeting_type: 'physical' | 'video' | 'phone';
  location?: string;
  meeting_url?: string;
  
  // Participants
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  created_by: string;
  
  // Workflow
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  
  // Dates alternatives
  original_date?: string;
  original_time?: string;
  alternative_date?: string;
  alternative_time?: string;
  
  // Notes
  notes?: string;
  expert_notes?: string;
  internal_notes?: string;
  
  // Business context
  priority?: number;
  category?: string;
  source?: string;
  
  // Notifications
  reminder_sent?: boolean;
  confirmation_sent?: boolean;
  
  // Audit
  created_at?: string;
  updated_at?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Relations (si populated)
  Client?: any;
  Expert?: any;
  ApporteurAffaires?: any;
  RDV_Produits?: any[];
}

export interface CreateRDVData {
  title?: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  meeting_type: 'physical' | 'video' | 'phone';
  location?: string;
  meeting_url?: string;
  client_id?: string;
  expert_id: string;
  apporteur_id?: string;
  notes?: string;
  priority?: number;
  category?: string;
  products?: Array<{
    produit_eligible_id: string;
    client_produit_eligible_id?: string;
    priority?: number;
    estimated_duration_minutes?: number;
    notes?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface UpdateRDVData {
  title?: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  meeting_type?: 'physical' | 'video' | 'phone';
  location?: string;
  meeting_url?: string;
  status?: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  expert_notes?: string;
  alternative_date?: string;
  alternative_time?: string;
  metadata?: Record<string, any>;
}

export interface RDVFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  category?: string;
  format?: 'rdv' | 'calendar'; // Format de retour
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

class RDVService {
  private baseUrl = `${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/rdv`;

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // ===== RÉCUPÉRATION =====

  /**
   * Récupérer tous les RDV de l'utilisateur
   */
  async getRDVs(filters: RDVFilters = {}): Promise<RDV[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ Endpoint RDV non trouvé - retourner tableau vide');
          return [];
        }
        if (response.status === 401) {
          console.warn('⚠️ Non authentifié pour les RDV - retourner tableau vide');
          return [];
        }
        throw new Error(`Erreur RDV: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur récupération RDV:', error);
      return [];
    }
  }

  /**
   * Récupérer un RDV spécifique
   */
  async getRDV(id: string): Promise<RDV | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erreur récupération RDV: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur récupération RDV:', error);
      return null;
    }
  }

  /**
   * Récupérer les RDV en attente de validation (pour experts)
   */
  async getPendingRDVs(): Promise<RDV[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pending/validation`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur récupération RDV en attente: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur récupération RDV en attente:', error);
      return [];
    }
  }

  // ===== CRÉATION =====

  /**
   * Créer un nouveau RDV
   */
  async createRDV(rdvData: CreateRDVData): Promise<RDV> {
    try {
      console.log('🔍 Service RDV - Données envoyées:', rdvData);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(rdvData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du RDV');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur création RDV:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs RDV en une fois (pour apporteurs)
   */
  async createMultipleRDVs(rdvsData: CreateRDVData[]): Promise<RDV[]> {
    try {
      const createdRDVs = await Promise.all(
        rdvsData.map(rdvData => this.createRDV(rdvData))
      );
      return createdRDVs;
    } catch (error) {
      console.error('❌ Erreur création multiple RDV:', error);
      throw error;
    }
  }

  // ===== MISE À JOUR =====

  /**
   * Mettre à jour un RDV
   */
  async updateRDV(id: string, updates: UpdateRDVData): Promise<RDV> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du RDV');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour RDV:', error);
      throw error;
    }
  }

  /**
   * Expert valide un RDV (accepte ou propose une alternative)
   */
  async validateRDV(
    id: string, 
    action: 'accept' | 'propose_alternative',
    options?: {
      alternative_date?: string;
      alternative_time?: string;
      expert_notes?: string;
    }
  ): Promise<RDV> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/validate`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action,
          ...options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la validation du RDV');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur validation RDV:', error);
      throw error;
    }
  }

  /**
   * Confirmer un RDV
   */
  async confirmRDV(id: string): Promise<RDV> {
    return this.updateRDV(id, { status: 'confirmed' });
  }

  /**
   * Annuler un RDV
   */
  async cancelRDV(id: string, notes?: string): Promise<RDV> {
    return this.updateRDV(id, { 
      status: 'cancelled',
      notes
    });
  }

  /**
   * Marquer un RDV comme terminé
   */
  async completeRDV(id: string, expert_notes?: string): Promise<RDV> {
    return this.updateRDV(id, { 
      status: 'completed',
      expert_notes
    });
  }

  // ===== SUPPRESSION =====

  /**
   * Supprimer un RDV
   */
  async deleteRDV(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du RDV');
      }
    } catch (error) {
      console.error('❌ Erreur suppression RDV:', error);
      throw error;
    }
  }

  // ===== UTILITAIRES =====

  /**
   * Obtenir les RDV à venir (prochains 7 jours par défaut)
   */
  async getUpcomingRDVs(days: number = 7): Promise<RDV[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.getRDVs({
      start_date: today.toISOString().split('T')[0],
      end_date: futureDate.toISOString().split('T')[0]
    });
  }

  /**
   * Obtenir les RDV du jour
   */
  async getTodayRDVs(): Promise<RDV[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getRDVs({
      start_date: today,
      end_date: today
    });
  }

  /**
   * Obtenir les RDV en attente de confirmation
   */
  async getProposedRDVs(): Promise<RDV[]> {
    return this.getRDVs({ status: 'proposed' });
  }

  /**
   * Transformer un RDV en format CalendarEvent
   */
  transformToCalendarEvent(rdv: RDV): any {
    const startDateTime = `${rdv.scheduled_date}T${rdv.scheduled_time}`;
    const endDateTime = new Date(
      new Date(startDateTime).getTime() + (rdv.duration_minutes || 60) * 60000
    ).toISOString();

    return {
      id: rdv.id,
      title: rdv.title,
      description: rdv.description || rdv.notes,
      start_date: startDateTime,
      end_date: endDateTime,
      location: rdv.location,
      is_online: rdv.meeting_type === 'video',
      meeting_url: rdv.meeting_url,
      type: 'appointment',
      category: rdv.category || 'client_rdv',
      status: rdv.status,
      priority: this.getPriorityLabel(rdv.priority || 2),
      client_id: rdv.client_id,
      expert_id: rdv.expert_id,
      created_by: rdv.created_by,
      metadata: {
        source: 'RDV',
        rdv_id: rdv.id,
        meeting_type: rdv.meeting_type,
        ...rdv.metadata
      }
    };
  }

  private getPriorityLabel(priority: number): string {
    if (priority >= 4) return 'critical';
    if (priority === 3) return 'high';
    if (priority === 2) return 'medium';
    return 'low';
  }
}

// ============================================================================
// INSTANCE EXPORTÉE
// ============================================================================

export const rdvService = new RDVService();

