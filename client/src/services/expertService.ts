import { get, post, put, del } from '@/lib/api';
import type { 
  Expert
} from '@/types/expert';
import type { ExpertAnalytics } from '@/types/analytics';
import type {
  ExpertBusiness,
  RevenueData,
  ProductPerformance,
  ClientPerformance
} from '@/types/business';
import type { Assignment } from '@/types/assignment';
import type { AgendaEvent } from '@/types/agenda';
import type { ExpertNotification } from '@/types/notification';
import type { ExpertPreferences } from '@/types/preferences';

class ExpertService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // Profil expert
  async getProfile(): Promise<Expert | null> {
    const cacheKey = 'expert_profile';
    const cached = this.getCachedData<Expert>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<Expert>('/api/expert/profile');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération profil expert:', error);
      throw new Error('Impossible de récupérer le profil expert');
    }
  }

  async updateProfile(profileData: Partial<Expert>): Promise<Expert | null> {
    try {
      const response = await put<Expert>('/api/expert/profile', profileData);
      if (response.success && response.data) {
        this.clearCache(); // Invalider le cache
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur mise à jour profil expert:', error);
      throw new Error('Impossible de mettre à jour le profil expert');
    }
  }

  // Assignations
  async getAssignments(): Promise<Assignment[]> {
    const cacheKey = 'expert_assignments';
    const cached = this.getCachedData<Assignment[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<Assignment[]>('/api/expert/assignments');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération assignations:', error);
      throw new Error('Impossible de récupérer les assignations');
    }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      const response = await get<Assignment>(`/api/expert/assignments/${assignmentId}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération assignation:', error);
      throw new Error('Impossible de récupérer l\'assignation');
    }
  }

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<boolean> {
    try {
      const response = await put(`/api/expert/assignments/${assignmentId}/status`, { status });
      if (response.success) {
        this.clearCache(); // Invalider le cache des assignations
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur mise à jour statut assignation:', error);
      throw new Error('Impossible de mettre à jour le statut de l\'assignation');
    }
  }

  // Analytics
  async getAnalytics(): Promise<ExpertAnalytics | null> {
    const cacheKey = 'expert_analytics';
    const cached = this.getCachedData<ExpertAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<ExpertAnalytics>('/api/expert/analytics');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération analytics:', error);
      throw new Error('Impossible de récupérer les analytics');
    }
  }

  // Données business
  async getBusinessData(): Promise<ExpertBusiness | null> {
    const cacheKey = 'expert_business';
    const cached = this.getCachedData<ExpertBusiness>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<ExpertBusiness>('/api/expert/business');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération données business:', error);
      throw new Error('Impossible de récupérer les données business');
    }
  }

  async getRevenueHistory(): Promise<RevenueData[]> {
    const cacheKey = 'expert_revenue_history';
    const cached = this.getCachedData<RevenueData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<RevenueData[]>('/api/expert/revenue-history');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération historique revenus:', error);
      throw new Error('Impossible de récupérer l\'historique des revenus');
    }
  }

  async getProductPerformance(): Promise<ProductPerformance[]> {
    const cacheKey = 'expert_product_performance';
    const cached = this.getCachedData<ProductPerformance[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<ProductPerformance[]>('/api/expert/product-performance');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération performance produits:', error);
      throw new Error('Impossible de récupérer les performances par produit');
    }
  }

  async getClientPerformance(): Promise<ClientPerformance[]> {
    const cacheKey = 'expert_client_performance';
    const cached = this.getCachedData<ClientPerformance[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<ClientPerformance[]>('/api/expert/client-performance');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération performance clients:', error);
      throw new Error('Impossible de récupérer les performances par client');
    }
  }

  // Agenda
  async getAgendaEvents(): Promise<AgendaEvent[]> {
    const cacheKey = 'expert_agenda_events';
    const cached = this.getCachedData<AgendaEvent[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await get<AgendaEvent[]>('/api/expert/agenda');
      if (response.success && response.data) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération événements agenda:', error);
      throw new Error('Impossible de récupérer les événements agenda');
    }
  }

  async createAgendaEvent(eventData: Omit<AgendaEvent, 'id'>): Promise<AgendaEvent | null> {
    try {
      const response = await post<AgendaEvent>('/api/expert/agenda', eventData);
      if (response.success && response.data) {
        this.clearCache(); // Invalider le cache agenda
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur création événement agenda:', error);
      throw new Error('Impossible de créer l\'événement agenda');
    }
  }

  async updateAgendaEvent(eventId: string, eventData: Partial<AgendaEvent>): Promise<boolean> {
    try {
      const response = await put(`/api/expert/agenda/${eventId}`, eventData);
      if (response.success) {
        this.clearCache(); // Invalider le cache agenda
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur mise à jour événement agenda:', error);
      throw new Error('Impossible de mettre à jour l\'événement agenda');
    }
  }

  async deleteAgendaEvent(eventId: string): Promise<boolean> {
    try {
      const response = await del(`/api/expert/agenda/${eventId}`);
      if (response.success) {
        this.clearCache(); // Invalider le cache agenda
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur suppression événement agenda:', error);
      throw new Error('Impossible de supprimer l\'événement agenda');
    }
  }

  // Notifications
  async getNotifications(): Promise<ExpertNotification[]> {
    try {
      const response = await get<ExpertNotification[]>('/api/expert/notifications');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw new Error('Impossible de récupérer les notifications');
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await put(`/api/expert/notifications/${notificationId}/read`);
      return response.success;
    } catch (error) {
      console.error('Erreur marquage notification comme lue:', error);
      throw new Error('Impossible de marquer la notification comme lue');
    }
  }

  // Préférences
  async getPreferences(): Promise<ExpertPreferences | null> {
    try {
      const response = await get<ExpertPreferences>('/api/expert/preferences');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération préférences:', error);
      throw new Error('Impossible de récupérer les préférences');
    }
  }

  async updatePreferences(preferences: Partial<ExpertPreferences>): Promise<boolean> {
    try {
      const response = await put('/api/expert/preferences', preferences);
      return response.success;
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      throw new Error('Impossible de mettre à jour les préférences');
    }
  }

  // Méthodes utilitaires
  refreshCache(): void {
    this.clearCache();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
export const expertService = new ExpertService(); 