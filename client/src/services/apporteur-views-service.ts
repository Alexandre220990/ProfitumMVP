/**
 * Service Apporteur Views
 * Accès aux vues SQL via le backend Railway (évite les problèmes CORS)
 * Utilise les 16 vues disponibles dans Supabase
 */
export class ApporteurViewsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  private async fetchFromBackend(endpoint: string) {
    const token = localStorage.getItem('token');
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
   * Vue 1: Dashboard Principal
   * Statistiques principales de l'apporteur
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
   * Vue 2: Prospects Détaillés
   * Liste complète des prospects avec détails
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
   * Vue 3: Objectifs et Performance
   * Suivi des objectifs mensuels
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
   * Vue 4: Activité Récente
   * Dernières activités de l'apporteur
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
   * Vue 5: Produits
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

  /**
   * Vue 6: Performance Produits
   * Performance par produit pour l'apporteur
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
   * Vue 7: Statistiques Mensuelles
   * Évolution mensuelle des métriques
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
   * Vue 8: Sources Prospects
   * Analyse des sources d'acquisition
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
   * Vue 9: KPIs Globaux
   * KPIs globaux de l'apporteur
   */
  async getKpisGlobaux() {
    try {
      return await this.fetchFromBackend('views/kpis-globaux');
    } catch (error) {
      console.error('Erreur getKpisGlobaux:', error);
      return { success: false, error: 'Erreur lors de la récupération des KPIs' };
    }
  }
}

