import { CabinetMemberRole } from '@/types/cabinets';

export interface CabinetPayload {
  name: string;
  siret?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CabinetProductPayload {
  produit_eligible_id: string;
  commission_rate?: number;
  fee_amount?: number;
  fee_mode?: 'fixed' | 'percent';
  is_active?: boolean;
}

export interface CabinetMemberPayload {
  member_id: string;
  member_type: CabinetMemberRole;
}

class AdminCabinetService {
  private baseUrl = `${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/admin/cabinets`;

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  async getCabinets(params: { search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) {
      query.append('search', params.search);
    }

    const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des cabinets');
    }

    return response.json();
  }

  async getCabinetDetail(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Cabinet introuvable');
    }

    return response.json();
  }

  async getCabinetApporteurs(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}/apporteurs`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des apporteurs');
    }

    return response.json();
  }

  async getCabinetClients(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}/clients`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des clients');
    }

    return response.json();
  }

  async getCabinetShares(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}/shares`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des partages');
    }

    return response.json();
  }

  async getCabinetTimeline(id: string, filters?: { days?: number; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.days) params.append('days', filters.days.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const response = await fetch(`${this.baseUrl}/${id}/timeline${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la timeline');
    }

    return response.json();
  }

  async getCabinetTasks(id: string, filters?: { status?: string; type?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const queryString = params.toString();
    const response = await fetch(`${this.baseUrl}/${id}/tasks${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des tâches');
    }

    return response.json();
  }

  async createCabinet(payload: CabinetPayload) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création du cabinet');
    }

    return response.json();
  }

  async updateCabinet(id: string, payload: Partial<CabinetPayload>) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du cabinet');
    }

    return response.json();
  }

  async updateCabinetProducts(id: string, products: CabinetProductPayload[]) {
    const response = await fetch(`${this.baseUrl}/${id}/products`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ products })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour des produits du cabinet');
    }

    return response.json();
  }

  async addCabinetMember(id: string, payload: CabinetMemberPayload) {
    const response = await fetch(`${this.baseUrl}/${id}/members`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'ajout du membre');
    }

    return response.json();
  }

  async removeCabinetMember(id: string, memberId: string) {
    const response = await fetch(`${this.baseUrl}/${id}/members/${memberId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du membre');
    }

    return response.json();
  }

  async createCabinetShare(id: string, payload: { client_produit_eligible_id: string; expert_id?: string; permissions?: Record<string, boolean> }) {
    const response = await fetch(`${this.baseUrl}/${id}/shares`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création du partage');
    }

    return response.json();
  }

  async deleteCabinetShare(id: string, shareId: string) {
    const response = await fetch(`${this.baseUrl}/${id}/shares/${shareId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du partage');
    }

    return response.json();
  }

  async getAvailableApporteurs(search?: string): Promise<{ success: boolean; data: Array<{ id: string; name: string; company_name?: string; email?: string; phone_number?: string }> }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const queryString = params.toString();
    const response = await fetch(`${this.baseUrl}/apporteurs/available${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des apporteurs');
    }

    return response.json();
  }
}

export const adminCabinetService = new AdminCabinetService();

