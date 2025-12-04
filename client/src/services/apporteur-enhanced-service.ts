/**
 * Service Apporteur Enhanced
 * Utilise les vues SQL via le backend Railway pour éviter les problèmes CORS
 */
import { getSupabaseToken } from '@/lib/auth-helpers';

export class ApporteurEnhancedService {
  private baseUrl: string;

  constructor(_apporteurId?: string) {
    // apporteurId non utilisé - l'authentification se fait via le token JWT
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  private async fetchFromBackend(endpoint: string) {
    const token = await getSupabaseToken();
    const response = await fetch(`${this.baseUrl}/api/apporteur/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Récupère toutes les données du dashboard depuis les vues corrigées
   */
  async getAllDashboardData() {
    try {
      // Récupérer toutes les données en parallèle
      const [
        dashboardResult,
        prospectsResult,
        activityResult,
        commissionsResult,
        objectivesResult,
        performanceResult
      ] = await Promise.allSettled([
        this.getDashboardPrincipal(),
        this.getProspectsDetaille(),
        this.getActiviteRecente(),
        this.getCommissionsCalculees(),
        this.getObjectifsPerformance(),
        this.getPerformanceProduits()
      ]);

      return {
        dashboard: dashboardResult.status === 'fulfilled' ? dashboardResult.value : null,
        prospects: prospectsResult.status === 'fulfilled' ? prospectsResult.value : null,
        activite: activityResult.status === 'fulfilled' ? activityResult.value : null,
        commissions: commissionsResult.status === 'fulfilled' ? commissionsResult.value : null,
        objectifs: objectivesResult.status === 'fulfilled' ? objectivesResult.value : null,
        performance: performanceResult.status === 'fulfilled' ? performanceResult.value : null
      };
    } catch (error) {
      console.error('Erreur récupération données dashboard:', error);
      throw error;
    }
  }

  /**
   * Vue principale du dashboard avec toutes les statistiques clés
   */
  async getDashboardPrincipal() {
    try {
      return await this.fetchFromBackend('views/dashboard-principal');
    } catch (error) {
      console.error('Erreur getDashboardPrincipal:', error);
      return { success: false, error: 'Erreur lors de la récupération du dashboard' };
    }
  }

  /**
   * Vue détaillée des prospects avec informations complètes
   */
  async getProspectsDetaille() {
    try {
      return await this.fetchFromBackend('views/prospects-detaille');
    } catch (error) {
      console.error('Erreur getProspectsDetaille:', error);
      return { success: false, error: 'Erreur lors de la récupération des prospects' };
    }
  }

  /**
   * Activité récente chronologique (clients, dossiers, conversions)
   */
  async getActiviteRecente() {
    try {
      return await this.fetchFromBackend('views/activite-recente');
    } catch (error) {
      console.error('Erreur getActiviteRecente:', error);
      return { success: false, error: 'Erreur lors de la récupération de l\'activité' };
    }
  }

  /**
   * Calcul automatique des commissions basé sur les dossiers acceptés
   */
  async getCommissionsCalculees() {
    try {
      // La vue existe mais utilise ApporteurCommission (table manquante)
      // Utiliser la route commissions qui utilise ProspectConversion
      return await this.fetchFromBackend('commissions');
    } catch (error) {
      console.error('Erreur getCommissionsCalculees:', error);
      return { success: false, error: 'Erreur lors de la récupération des commissions' };
    }
  }

  /**
   * Suivi des objectifs mensuels et performance
   */
  async getObjectifsPerformance() {
    try {
      return await this.fetchFromBackend('views/objectifs-performance');
    } catch (error) {
      console.error('Erreur getObjectifsPerformance:', error);
      return { success: false, error: 'Erreur lors de la récupération des objectifs' };
    }
  }

  /**
   * Performance par produit avec taux de réussite et montants
   */
  async getPerformanceProduits() {
    try {
      return await this.fetchFromBackend('views/performance-produits');
    } catch (error) {
      console.error('Erreur getPerformanceProduits:', error);
      return { success: false, error: 'Erreur lors de la récupération de la performance produits' };
    }
  }

  /**
   * Statistiques agrégées par mois pour les graphiques
   */
  async getStatistiquesMensuelles() {
    try {
      return await this.fetchFromBackend('views/statistiques-mensuelles');
    } catch (error) {
      console.error('Erreur getStatistiquesMensuelles:', error);
      return { success: false, error: 'Erreur lors de la récupération des statistiques mensuelles' };
    }
  }

  /**
   * Analyse des sources de prospects
   */
  async getSourcesProspects() {
    try {
      return await this.fetchFromBackend('views/sources-prospects');
    } catch (error) {
      console.error('Erreur getSourcesProspects:', error);
      return { success: false, error: 'Erreur lors de la récupération des sources' };
    }
  }

  /**
   * Récupérer les experts disponibles
   */
  async getExperts() {
    try {
      // Utiliser le backend au lieu de Supabase direct
      return await this.fetchFromBackend('experts');
    } catch (error) {
      console.error('Erreur getExperts:', error);
      return { success: false, error: 'Erreur lors de la récupération des experts' };
    }
  }

  /**
   * Méthode de fallback pour les données de base si les vues ne sont pas disponibles
   */
  async getFallbackData() {
    try {
      // Utiliser le service simple comme fallback
      return { success: false, error: 'Fallback désactivé - utiliser ApporteurSimpleService' };
    } catch (error) {
      console.error('Erreur fallback data:', error);
      return { success: false, error: 'Erreur lors de la récupération des données de fallback' };
    }
  }

  /**
   * Liste des produits éligibles
   */
  async getProduits() {
    try {
      return await this.fetchFromBackend('produits');
    } catch (error) {
      console.error('Erreur getProduits:', error);
      return { success: false, error: 'Erreur lors de la récupération des produits' };
    }
  }
}