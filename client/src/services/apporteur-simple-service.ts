/**
 * Service simplifié pour le dashboard apporteur
 * Utilise les routes API existantes au lieu des vues SQL inexistantes
 */

import { getSupabaseToken } from '@/lib/auth-helpers';

interface ApporteurKPIs {
  mesProspects: number;
  prospectsQualifies: number;
  nouveauxProspects30j: number;
  mesClientsActifs: number;
  nouveauxClients30j: number;
  dossiersMesClients: number;
  dossiersTerminesMesClients: number;
  montantTotalMesClients: number;
  montantRealiseMesClients: number;
  commissionsTotales: number;
  commissionsPayees: number;
  tauxConversionProspects: number;
}

interface ActivityItem {
  typeEntite: string;
  entiteId: string;
  reference: string;
  nom: string;
  statut: string;
  dateAction: string;
  action: string;
  montant: number | null;
}

interface ProspectDetail {
  id: string;
  email: string;
  name: string;
  companyName: string;
  createdAt: string;
  derniereConnexion: string | null;
  statutActivite: string;
  anciennete: string;
  nbDossiers: number;
  montantTotalDossiers: number;
}

interface AlertItem {
  typeAlerte: string;
  severity: string;
  nombre: number;
  message: string;
  entitesConcernees: string[];
}

export class ApporteurSimpleService {
  constructor(_apporteurId: string) {
    // apporteurId non utilisé - authentification via JWT
  }

  /**
   * Récupère les KPIs simplifiés basés sur les données disponibles
   */
  async getPersonalKPIs(): Promise<{ success: boolean; data?: ApporteurKPIs; error?: string }> {
    try {
      // Pour l'instant, retourner des KPIs par défaut
      // TODO: Implémenter avec les vraies données quand les routes seront disponibles
      const kpis: ApporteurKPIs = {
        mesProspects: 0,
        prospectsQualifies: 0,
        nouveauxProspects30j: 0,
        mesClientsActifs: 0,
        nouveauxClients30j: 0,
        dossiersMesClients: 0,
        dossiersTerminesMesClients: 0,
        montantTotalMesClients: 0,
        montantRealiseMesClients: 0,
        commissionsTotales: 0,
        commissionsPayees: 0,
        tauxConversionProspects: 0
      };

      return {
        success: true,
        data: kpis
      };
    } catch (error) {
      console.error('Erreur récupération KPIs apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des KPIs personnels'
      };
    }
  }

  /**
   * Récupère l'activité simplifiée
   */
  async getPersonalActivity(): Promise<{ success: boolean; data?: ActivityItem[]; error?: string }> {
    try {
      // Pour l'instant, retourner une liste vide
      // TODO: Implémenter avec les vraies données
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Erreur récupération activité apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de l\'activité personnelle'
      };
    }
  }

  /**
   * Récupère les prospects via l'API existante
   */
  async getPersonalProspects(): Promise<{ success: boolean; data?: ProspectDetail[]; error?: string }> {
    try {
      const token = await getSupabaseToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/apporteur/prospects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des prospects');
      }

      // Transformer les données Client en ProspectDetail
      const prospects: ProspectDetail[] = (result.data || []).map((client: any) => ({
        id: client.id,
        email: client.email,
        name: client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
        companyName: client.company_name || '',
        createdAt: client.created_at,
        derniereConnexion: null, // Pas disponible pour l'instant
        statutActivite: client.status || 'prospect',
        anciennete: this.calculateAnciennete(client.created_at),
        nbDossiers: 0, // Pas disponible pour l'instant
        montantTotalDossiers: 0 // Pas disponible pour l'instant
      }));

      return {
        success: true,
        data: prospects
      };
    } catch (error) {
      console.error('Erreur récupération prospects apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des prospects'
      };
    }
  }

  /**
   * Récupère les alertes simplifiées
   */
  async getPersonalAlerts(): Promise<{ success: boolean; data?: AlertItem[]; error?: string }> {
    try {
      // Pour l'instant, retourner une liste vide
      // TODO: Implémenter avec les vraies données
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Erreur récupération alertes apporteur:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des alertes'
      };
    }
  }

  /**
   * Récupère les statistiques de produits
   */
  async getProductStats(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Pour l'instant, retourner une liste vide
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Erreur récupération stats produits:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques produits'
      };
    }
  }

  /**
   * Récupère les sessions actives
   */
  async getActiveSessions(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Pour l'instant, retourner une liste vide
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Erreur récupération sessions actives:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des sessions actives'
      };
    }
  }

  /**
   * Calcule l'ancienneté d'un prospect
   */
  private calculateAnciennete(createdAt: string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return 'nouveau';
    if (diffDays < 30) return 'récent';
    if (diffDays < 90) return 'ancien';
    return 'très ancien';
  }
}
