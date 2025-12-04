import {
  CabinetContextPayload,
  CabinetHierarchyNode,
  CabinetTeamKPIs,
  CabinetTeamRole,
  CabinetTeamStatsRow
} from '@/types';
import { getSupabaseToken } from '@/lib/auth-helpers';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

type ApiError = {
  success: false;
  message?: string;
};

export type CabinetMemberInputPayload = {
  member_id: string;
  member_type: 'expert' | 'apporteur' | 'assistant' | 'responsable_cabinet';
  team_role?: CabinetTeamRole;
  manager_member_id?: string | null;
  status?: 'active' | 'invited' | 'suspended' | 'disabled';
  permissions?: Record<string, any>;
  products?: any[];
};

export type CabinetMemberUpdatePayload = Partial<{
  status: 'active' | 'invited' | 'suspended' | 'disabled';
  manager_member_id: string | null;
  team_role: CabinetTeamRole;
  permissions: Record<string, any>;
  products: any[];
}>;

class ExpertCabinetService {
  private baseUrl = `${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/expert/cabinet`;

  private async getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getSupabaseToken() || ''}`
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    });

    const payload: ApiSuccess<T> | ApiError = await response.json().catch(() => ({
      success: false,
      message: 'Réponse invalide'
    }));

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Erreur serveur cabinet');
    }

    return payload.data;
  }

  async getContext(): Promise<CabinetContextPayload> {
    return this.request<CabinetContextPayload>('/context');
  }

  async getHierarchy(): Promise<CabinetHierarchyNode[]> {
    return this.request<CabinetHierarchyNode[]>('/hierarchy');
  }

  async getTeamStats(): Promise<{ stats: CabinetTeamStatsRow[]; kpis: CabinetTeamKPIs }> {
    return this.request<{ stats: CabinetTeamStatsRow[]; kpis: CabinetTeamKPIs }>('/team-stats');
  }

  async addMember(payload: CabinetMemberInputPayload) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateMember(memberRecordId: string, payload: CabinetMemberUpdatePayload) {
    return this.request(`/members/${memberRecordId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  async removeMember(memberRecordId: string) {
    return this.request(`/members/${memberRecordId}`, {
      method: 'DELETE'
    });
  }

  async getAvailableUsers(search?: string, type?: 'expert' | 'apporteur'): Promise<Array<{ id: string; name: string; email?: string }>> {
    const adminUrl = `${import.meta.env.VITE_API_URL || 'https://profitummvp-production.up.railway.app'}/api/admin/cabinets`;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const endpoint = type === 'apporteur' ? '/apporteurs/available' : '/experts/available';
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${adminUrl}${endpoint}?${params}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des utilisateurs');
    }
    
    const result = await response.json();
    return result.data || [];
  }

  async refreshStats() {
    return this.request('/refresh-stats', {
      method: 'POST'
    });
  }
}

export const expertCabinetService = new ExpertCabinetService();

