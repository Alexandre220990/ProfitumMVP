import { config } from '@/config';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApporteurApiService {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = config.API_URL;
    this.token = localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Erreur ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('Erreur API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // ===== DASHBOARD =====
  async getDashboardData() {
    return this.request('/api/apporteur/dashboard');
  }

  async getStats() {
    return this.request('/api/apporteur/stats');
  }

  // ===== PROSPECTS/CLIENTS =====
  async getClients(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/apporteur/clients?${queryString}` : '/api/apporteur/clients';
    
    return this.request(endpoint);
  }

  async getClient(clientId: string) {
    return this.request(`/api/apporteur/clients/${clientId}`);
  }

  async createClient(clientData: any) {
    return this.request('/api/apporteur/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(clientId: string, updateData: any) {
    return this.request(`/api/apporteur/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteClient(clientId: string) {
    return this.request(`/api/apporteur/clients/${clientId}`, {
      method: 'DELETE',
    });
  }

  // ===== EXPERTS =====
  async getExperts(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/apporteur/experts?${queryString}` : '/api/apporteur/experts';
    
    return this.request(endpoint);
  }

  async assignExpertToClient(clientId: string, expertId: string) {
    return this.request(`/api/apporteur/clients/${clientId}/assign-expert`, {
      method: 'POST',
      body: JSON.stringify({ expertId }),
    });
  }

  // ===== RDV =====
  async createRDV(clientId: string, rdvData: any) {
    return this.request(`/api/apporteur/clients/${clientId}/rdv`, {
      method: 'POST',
      body: JSON.stringify(rdvData),
    });
  }

  async updateRDV(clientId: string, rdvId: string, updateData: any) {
    return this.request(`/api/apporteur/clients/${clientId}/rdv/${rdvId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // ===== STATUTS =====
  async updateClientStatus(clientId: string, newStatus: string, notes?: string) {
    return this.request(`/api/apporteur/clients/${clientId}/status`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, notes }),
    });
  }

  async getClientStatusHistory(clientId: string) {
    return this.request(`/api/apporteur/clients/${clientId}/status-history`);
  }

  // ===== COMMISSIONS =====
  async getCommissions(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/apporteur/commissions?${queryString}` : '/api/apporteur/commissions';
    
    return this.request(endpoint);
  }

  // ===== NOTIFICATIONS =====
  async getNotifications() {
    return this.request('/api/apporteur/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/apporteur/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // ===== PROFILE =====
  async getProfile() {
    return this.request('/api/apporteur/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/api/apporteur/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ===== UTILITAIRES =====
  updateToken(newToken: string) {
    this.token = newToken;
    localStorage.setItem('token', newToken);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
  }
}

// Instance singleton
export const apporteurApi = new ApporteurApiService();
export default apporteurApi;
