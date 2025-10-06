import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class ApporteurRealDataService {
  private apporteurId: string;

  constructor(apporteurId: string) {
    this.apporteurId = apporteurId;
  }

  /**
   * Récupère les produits éligibles avec gestion sécurisée des valeurs
   */
  async getProduits(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('🔍 Récupération des produits depuis la base de données...');
      
      // Récupérer directement depuis Supabase (tous les produits actifs)
      const { data: produits, error } = await supabase
        .from('ProduitEligible')
        .select('*')
        .order('nom');

      if (error) {
        console.error('❌ Erreur récupération produits Supabase:', error);
        // Fallback sur données mock si Supabase échoue
        return this.getMockProduits();
      }

      console.log(`✅ ${produits?.length || 0} produits récupérés depuis la base de données`);

      // Formatage sécurisé des produits avec gestion des valeurs null/0
      const formattedProduits = (produits || []).map(produit => {
        try {
          return {
            id: produit.id || '',
            nom: produit.nom || 'Produit sans nom',
            description: produit.description || 'Description non disponible',
            categorie: produit.categorie || produit.category || 'Général',
            montant_min: produit.montant_min !== null ? Number(produit.montant_min) : null,
            montant_max: produit.montant_max !== null ? Number(produit.montant_max) : null,
            taux_min: produit.taux_min !== null ? Number(produit.taux_min) : null,
            taux_max: produit.taux_max !== null ? Number(produit.taux_max) : null,
            duree_min: produit.duree_min !== null ? Number(produit.duree_min) : null,
            duree_max: produit.duree_max !== null ? Number(produit.duree_max) : null,
            conditions: Array.isArray(produit.conditions) ? produit.conditions : [],
            avantages: Array.isArray(produit.avantages) ? produit.avantages : [],
            status: produit.status || 'active',
            created_at: produit.created_at || new Date().toISOString()
          };
        } catch (error) {
          console.error('❌ Erreur formatage produit', produit.id, ':', error);
          return {
            id: produit.id || '',
            nom: 'Produit avec erreur',
            description: 'Erreur lors du formatage',
            categorie: 'Erreur',
            montant_min: 0,
            montant_max: 0,
            taux_min: 0,
            taux_max: 0,
            duree_min: 0,
            duree_max: 0,
            conditions: [],
            avantages: [],
            status: 'error',
            created_at: new Date().toISOString()
          };
        }
      });

      console.log(`🎯 ${formattedProduits.length} produits formatés et prêts`);
      return { success: true, data: formattedProduits };

    } catch (error) {
      console.error('❌ Erreur getProduits:', error);
      // Fallback sur données mock en cas d'erreur totale
      return this.getMockProduits();
    }
  }

  /**
   * Données mock de produits en cas d'erreur
   */
  private getMockProduits(): { success: boolean; data: any[] } {
    const mockProduits = [
      {
        id: '1',
        nom: 'CIR - Crédit Impôt Recherche',
        description: 'Réduction d\'impôt pour les dépenses de R&D',
        categorie: 'Fiscal',
        montant_min: 10000,
        montant_max: 1000000,
        taux_min: 30,
        taux_max: 50,
        duree_min: 1,
        duree_max: 3,
        conditions: ['Activité de R&D', 'Personnel qualifié'],
        avantages: ['Réduction d\'impôt', 'Financement R&D'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        nom: 'TICPE - Taxe Intérieure de Consommation',
        description: 'Remboursement de la TICPE sur les carburants',
        categorie: 'Environnemental',
        montant_min: 5000,
        montant_max: 500000,
        taux_min: 20,
        taux_max: 40,
        duree_min: 1,
        duree_max: 2,
        conditions: ['Transport routier', 'Flotte de véhicules'],
        avantages: ['Remboursement TICPE', 'Économies carburant'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        nom: 'URSSAF - Réduction Charges Sociales',
        description: 'Réduction des charges sociales pour l\'embauche',
        categorie: 'Social',
        montant_min: 2000,
        montant_max: 200000,
        taux_min: 25,
        taux_max: 50,
        duree_min: 1,
        duree_max: 2,
        conditions: ['Embauche de personnel', 'Formation'],
        avantages: ['Réduction charges', 'Aide à l\'emploi'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        nom: 'DFS - Dispositif de Financement Solidaire',
        description: 'Financement participatif pour les projets solidaires',
        categorie: 'Social',
        montant_min: 1000,
        montant_max: 100000,
        taux_min: 15,
        taux_max: 35,
        duree_min: 1,
        duree_max: 3,
        conditions: ['Projet solidaire', 'Impact social'],
        avantages: ['Financement participatif', 'Impact social'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        nom: 'Audit Énergétique',
        description: 'Diagnostic et optimisation énergétique des bâtiments',
        categorie: 'Environnemental',
        montant_min: 5000,
        montant_max: 50000,
        taux_min: 40,
        taux_max: 60,
        duree_min: 1,
        duree_max: 2,
        conditions: ['Bâtiment existant', 'Surface > 1000m²'],
        avantages: ['Économies d\'énergie', 'Certification'],
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    return { success: true, data: mockProduits };
  }

  /**
   * Récupère les statistiques des produits avec gestion sécurisée
   */
  async getStatistiquesProduits(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: stats, error } = await supabase
        .from('vue_apporteur_stats_produits')
        .select('*')
        .eq('apporteur_id', this.apporteurId);

      if (error) {
        console.warn('Vue stats produits non disponible, calcul manuel');
        return this.calculerStatsManuelles();
      }

      // Formatage sécurisé des statistiques
      const formattedStats = {
        total_produits: Number(stats?.[0]?.total_produits) || 0,
        produits_actifs: Number(stats?.[0]?.produits_actifs) || 0,
        montant_total: Number(stats?.[0]?.montant_total) || 0,
        taux_reussite: Number(stats?.[0]?.taux_reussite) || 0,
        produits_populaires: stats?.[0]?.produits_populaires || []
      };

      return { success: true, data: formattedStats };

    } catch (error) {
      console.error('Erreur getStatistiquesProduits:', error);
      return this.calculerStatsManuelles();
    }
  }

  /**
   * Calcul manuel des statistiques en cas d'erreur
   */
  private async calculerStatsManuelles(): Promise<{ success: boolean; data: any }> {
    try {
      const produitsResult = await this.getProduits();
      const produits = produitsResult.data || [];

      const stats = {
        total_produits: produits.length,
        produits_actifs: produits.filter(p => p.status === 'active').length,
        montant_total: produits.reduce((sum, p) => sum + (p.montant_max || 0), 0),
        taux_reussite: 75, // Valeur par défaut
        produits_populaires: produits.slice(0, 3).map(p => ({
          nom: p.nom,
          montant: p.montant_max
        }))
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Erreur calcul stats manuelles:', error);
      return {
        success: true,
        data: {
          total_produits: 0,
          produits_actifs: 0,
          montant_total: 0,
          taux_reussite: 0,
          produits_populaires: []
        }
      };
    }
  }
}
