import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

export interface ClientProfile {
  secteur?: string;
  vehiculesProfessionnels?: boolean;
  proprietaireLocaux?: boolean;
  activitesRD?: boolean;
  masseSalariale?: string;
  nombreEmployes?: number;
  chiffreAffaires?: string;
  besoinsSpecifiques?: string[];
}

export interface Product {
  id: string;
  nom: string;
  description: string;
  conditions: any; // JSON des conditions d'éligibilité
  criteres: any; // JSON des critères de pondération
  formulePotentiel: any; // JSON de la formule de calcul du gain
  tauxMin: number;
  tauxMax: number;
  montantMin: number;
  montantMax: number;
  dureeMin: number;
  dureeMax: number;
  questionsRequises?: number[]; // Questions nécessaires pour évaluer ce produit
}

export interface EligibilityRule {
  id: number;
  produit_id: string;
  condition_type: string;
  condition_operator: string;
  condition_value: string;
  points: number;
  obligatoire: boolean;
}

export interface ProductEligibility {
  product: Product;
  score: number;
  maxScore: number;
  isEligible: boolean;
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
  missingRequirements: string[];
}

export class EligibilityEngine {
  
  // Évaluer l'éligibilité d'un client pour tous les produits
  async evaluateClientEligibility(clientProfile: ClientProfile): Promise<ProductEligibility[]> {
    try {
      console.log('🔍 Évaluation éligibilité pour profil:', clientProfile);
      
      // 1. Récupérer tous les produits avec leurs règles
      const products = await this.getAllProducts();
      const rules = await this.getAllRules();
      
      console.log(`📦 Évaluation de ${products.length} produits`);
      
      // 2. Évaluer chaque produit
      const eligibilities: ProductEligibility[] = [];
      
      for (const product of products) {
        const productRules = rules.filter(r => r.produit_id === product.id);
        const eligibility = this.evaluateProductEligibility(product, productRules, clientProfile);
        eligibilities.push(eligibility);
      }
      
      // 3. Trier par score décroissant
      eligibilities.sort((a, b) => b.score - a.score);
      
      console.log(`✅ Éligibilité évaluée: ${eligibilities.filter(e => e.isEligible).length}/${eligibilities.length} produits éligibles`);
      
      return eligibilities;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'évaluation d\'éligibilité:', error);
      throw error;
    }
  }
  
  // Évaluer l'éligibilité pour un produit spécifique selon les conditions JSON
  private evaluateProductEligibility(
    product: Product, 
    rules: EligibilityRule[], 
    profile: ClientProfile
  ): ProductEligibility {
    
    let score = 0;
    let maxScore = 100; // Score maximum standardisé
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // Évaluation basée sur les conditions JSON du produit
    const eligibilityResult = this.evaluateProductConditions(product, profile);
    score = eligibilityResult.score;
    reasons.push(...eligibilityResult.reasons);
    missingRequirements.push(...eligibilityResult.missingRequirements);
    
    const isEligible = eligibilityResult.isEligible;
    
    // Déterminer la priorité basée sur le score et la correspondance du profil
    let priority: 'high' | 'medium' | 'low';
    if (score >= 80) priority = 'high';
    else if (score >= 60) priority = 'medium';
    else priority = 'low';
    
    return {
      product,
      score,
      maxScore,
      isEligible,
      priority,
      reasons,
      missingRequirements
    };
  }
  
  // Évaluer les conditions spécifiques de chaque produit
  private evaluateProductConditions(product: Product, profile: ClientProfile): {
    score: number;
    isEligible: boolean;
    reasons: string[];
    missingRequirements: string[];
  } {
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    let score = 0;
    
    switch (product.nom) {
      case 'TICPE':
        return this.evaluateTICPE(product, profile);
      case 'CIR':
        return this.evaluateCIR(product, profile);
      case 'CII':
        return this.evaluateCII(product, profile);
      case 'Foncier':
        return this.evaluateFoncier(product, profile);
      case 'URSSAF':
        return this.evaluateURSSAF(product, profile);
      case 'DFS':
        return this.evaluateDFS(product, profile);
      case 'MSA':
        return this.evaluateMSA(product, profile);
      default:
        return {
          score: 0,
          isEligible: false,
          reasons: [],
          missingRequirements: [`Produit ${product.nom} non reconnu`]
        };
    }
  }
  
  // Évaluer une règle individuelle
  private evaluateRule(rule: EligibilityRule, profile: ClientProfile): { matches: boolean; reason: string } {
    const { condition_type, condition_operator, condition_value } = rule;
    
    switch (condition_type) {
      case 'secteur':
        const matches_secteur = profile.secteur === condition_value;
        return {
          matches: matches_secteur,
          reason: matches_secteur 
            ? `✅ Secteur ${profile.secteur} compatible`
            : `❌ Secteur requis: ${condition_value} (actuel: ${profile.secteur || 'non défini'})`
        };
        
      case 'vehicules_professionnels':
        const has_vehicules = profile.vehiculesProfessionnels === (condition_value === 'true');
        return {
          matches: has_vehicules,
          reason: has_vehicules
            ? `✅ Véhicules professionnels: ${profile.vehiculesProfessionnels ? 'Oui' : 'Non'}`
            : `❌ Véhicules professionnels requis: ${condition_value === 'true' ? 'Oui' : 'Non'}`
        };
        
      case 'nb_employes':
        const nb_employes = profile.nombreEmployes || 0;
        const required_nb = parseInt(condition_value);
        let matches_employes = false;
        
        switch (condition_operator) {
          case '>=': matches_employes = nb_employes >= required_nb; break;
          case '>': matches_employes = nb_employes > required_nb; break;
          case '=': matches_employes = nb_employes === required_nb; break;
          case '<=': matches_employes = nb_employes <= required_nb; break;
          case '<': matches_employes = nb_employes < required_nb; break;
        }
        
        return {
          matches: matches_employes,
          reason: matches_employes
            ? `✅ Nombre d'employés: ${nb_employes} (requis: ${condition_operator} ${required_nb})`
            : `❌ Nombre d'employés requis: ${condition_operator} ${required_nb} (actuel: ${nb_employes})`
        };
        
      case 'ca_min':
        // Pour l'instant, on considère que sans CA déclaré, la règle n'est pas respectée
        if (!profile.chiffreAffaires) {
          return {
            matches: false,
            reason: `❌ Chiffre d'affaires requis: ${condition_operator} ${condition_value}€ (non renseigné)`
          };
        }
        
        // Extraction du CA depuis le texte (à améliorer avec parsing plus robuste)
        const ca_value = this.extractChiffreAffaires(profile.chiffreAffaires);
        const required_ca = parseInt(condition_value);
        let matches_ca = false;
        
        switch (condition_operator) {
          case '>=': matches_ca = ca_value >= required_ca; break;
          case '>': matches_ca = ca_value > required_ca; break;
          case '=': matches_ca = ca_value === required_ca; break;
        }
        
        return {
          matches: matches_ca,
          reason: matches_ca
            ? `✅ Chiffre d'affaires: ${ca_value}€ (requis: ${condition_operator} ${required_ca}€)`
            : `❌ Chiffre d'affaires requis: ${condition_operator} ${required_ca}€ (actuel: ${ca_value}€)`
        };
        
      case 'besoin':
        const hasNeed = profile.besoinsSpecifiques?.includes(condition_value) || false;
        return {
          matches: hasNeed,
          reason: hasNeed
            ? `✅ Besoin identifié: ${condition_value}`
            : `ℹ️ Besoin non exprimé: ${condition_value}`
        };
        
      case 'proprietaire_locaux':
        const is_proprietaire = profile.proprietaireLocaux === (condition_value === 'true');
        return {
          matches: is_proprietaire,
          reason: is_proprietaire
            ? `✅ Propriétaire locaux: ${profile.proprietaireLocaux ? 'Oui' : 'Non'}`
            : `❌ Propriétaire locaux requis: ${condition_value === 'true' ? 'Oui' : 'Non'}`
        };
        
      default:
        return {
          matches: false,
          reason: `❓ Condition non reconnue: ${condition_type}`
        };
    }
  }
  
  // Extraire le chiffre d'affaires depuis une chaîne de texte
  private extractChiffreAffaires(text: string): number {
    const normalizedText = text.toLowerCase().replace(/\s+/g, '');
    
    // Chercher des patterns comme "500k€", "1.5m€", "750000€"
    const patterns = [
      /(\d+(?:\.\d+)?)\s*m[€e]/,    // millions
      /(\d+(?:\.\d+)?)\s*k[€e]/,    // milliers
      /(\d+)\s*[€e]/,               // unités
      /(\d+)/                       // nombre seul
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = normalizedText.match(patterns[i]);
      if (match) {
        const value = parseFloat(match[1]);
        switch (i) {
          case 0: return value * 1000000; // millions
          case 1: return value * 1000;    // milliers
          case 2: 
          case 3: return value;           // unités ou nombre seul
        }
      }
    }
    
    return 0;
  }
  
  // Évaluations spécifiques par produit
  private evaluateTICPE(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // TICPE : Transport avec véhicules lourds
    if (profile.secteur === 'transport') {
      score += 40;
      reasons.push('✅ Secteur transport éligible');
      
      if (profile.vehiculesProfessionnels) {
        score += 40;
        reasons.push('✅ Véhicules professionnels déclarés');
      } else {
        missingRequirements.push('❌ Véhicules professionnels requis');
      }
    } else {
      missingRequirements.push('❌ Secteur transport requis pour TICPE');
    }
    
    // Bonus pour la taille de l'entreprise
    if (profile.nombreEmployes && profile.nombreEmployes >= 3) {
      score += 20;
      reasons.push(`✅ Taille d'entreprise favorable (${profile.nombreEmployes} employés)`);
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }
  
  private evaluateCIR(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // CIR : Activités de R&D
    if (profile.activitesRD) {
      score += 70;
      reasons.push('✅ Activités de R&D confirmées');
    } else {
      missingRequirements.push('❌ Activités de R&D requises pour le CIR');
    }
    
    // Bonus selon le secteur
    if (['industrie', 'services'].includes(profile.secteur || '')) {
      score += 20;
      reasons.push(`✅ Secteur ${profile.secteur} favorable au CIR`);
    }
    
    // Bonus pour les employés qualifiés
    if (profile.nombreEmployes && profile.nombreEmployes >= 5) {
      score += 10;
      reasons.push('✅ Équipe suffisante pour projets R&D');
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }
  
  private evaluateCII(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // CII : Innovation pour PME
    if (profile.nombreEmployes && profile.nombreEmployes <= 250) {
      score += 50;
      reasons.push('✅ Taille PME éligible au CII');
      
      // Bonus pour secteurs innovants
      if (['industrie', 'services'].includes(profile.secteur || '')) {
        score += 30;
        reasons.push(`✅ Secteur ${profile.secteur} favorable à l'innovation`);
      }
      
      // Bonus si déjà des activités R&D
      if (profile.activitesRD) {
        score += 20;
        reasons.push('✅ Contexte R&D favorable au CII');
      }
    } else {
      missingRequirements.push('❌ CII réservé aux PME (< 250 employés)');
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }
  
  private evaluateFoncier(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // Foncier : Propriétaire de locaux
    if (profile.proprietaireLocaux) {
      score += 80;
      reasons.push('✅ Propriétaire des locaux');
      
      // Bonus selon le secteur
      if (['industrie', 'commerce'].includes(profile.secteur || '')) {
        score += 20;
        reasons.push(`✅ Secteur ${profile.secteur} avec forts enjeux fonciers`);
      }
    } else {
      missingRequirements.push('❌ Propriété des locaux requise pour optimisation foncière');
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }
  
  private evaluateURSSAF(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // URSSAF : Optimisation charges sociales
    if (profile.nombreEmployes && profile.nombreEmployes >= 3) {
      score += 60;
      reasons.push(`✅ ${profile.nombreEmployes} employés - charges sociales significatives`);
      
      // Bonus pour CA élevé
      if (profile.chiffreAffaires) {
        const ca = this.extractChiffreAffaires(profile.chiffreAffaires);
        if (ca >= 200000) {
          score += 30;
          reasons.push(`✅ CA ${ca}€ - potentiel d'optimisation important`);
        } else {
          score += 10;
          reasons.push(`✅ CA ${ca}€ - optimisation possible`);
        }
      }
      
      // Bonus selon le secteur
      if (['transport', 'industrie'].includes(profile.secteur || '')) {
        score += 10;
        reasons.push(`✅ Secteur ${profile.secteur} avec charges sociales importantes`);
      }
    } else {
      missingRequirements.push('❌ Minimum 3 employés requis pour optimisation URSSAF');
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }
  
  private evaluateDFS(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // DFS : Dispositifs fiscaux spéciaux selon secteur et localisation
    let eligible = false;
    
    // Éligibilité par secteur
    if (['industrie', 'transport', 'agriculture'].includes(profile.secteur || '')) {
      score += 40;
      reasons.push(`✅ Secteur ${profile.secteur} éligible aux dispositifs fiscaux`);
      eligible = true;
    }
    
    // Bonus pour investissements importants
    if (profile.nombreEmployes && profile.nombreEmployes >= 10) {
      score += 30;
      reasons.push('✅ Taille d\'entreprise favorable aux dispositifs fiscaux');
    }
    
    // Bonus pour propriétaires de locaux
    if (profile.proprietaireLocaux) {
      score += 30;
      reasons.push('✅ Propriété des locaux - éligibilité renforcée');
    }
    
    if (!eligible) {
      missingRequirements.push('❌ Secteur non éligible aux dispositifs fiscaux spéciaux');
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }
  
  private evaluateMSA(product: Product, profile: ClientProfile) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    // MSA : Secteur agricole uniquement
    if (profile.secteur === 'agriculture') {
      score += 80;
      reasons.push('✅ Secteur agricole - éligible MSA');
      
      // Bonus pour employés saisonniers
      if (profile.nombreEmployes && profile.nombreEmployes >= 2) {
        score += 20;
        reasons.push(`✅ ${profile.nombreEmployes} employés - optimisation MSA possible`);
      }
    } else {
      missingRequirements.push('❌ Secteur agricole requis pour optimisation MSA');
    }
    
    const isEligible = score >= 60;
    
    return { score, isEligible, reasons, missingRequirements };
  }

  // Récupérer tous les produits
  private async getAllProducts(): Promise<Product[]> {
    const { rows } = await pool.query(
      'SELECT * FROM "ProduitEligible" ORDER BY nom ASC'
    );
    return rows;
  }
  
  // Récupérer toutes les règles d'éligibilité
  private async getAllRules(): Promise<EligibilityRule[]> {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM "RegleEligibilite" ORDER BY produit_id, obligatoire DESC, points DESC'
      );
      return rows;
    } catch (error) {
      console.log('⚠️ Table RegleEligibilite non trouvée, utilisation de règles par défaut');
      return [];
    }
  }
  
  // Assigner automatiquement les produits éligibles à un client
  async assignEligibleProducts(clientId: string, clientProfile: ClientProfile): Promise<void> {
    try {
      console.log(`🎯 Attribution des produits éligibles pour client ${clientId}`);
      
      const eligibilities = await this.evaluateClientEligibility(clientProfile);
      const eligibleProducts = eligibilities.filter(e => e.isEligible);
      
      // Supprimer les anciennes attributions
      await pool.query(
        'DELETE FROM "ClientProduitEligible" WHERE "clientId" = $1',
        [clientId]
      );
      
      // Insérer les nouveaux produits éligibles
      for (const eligibility of eligibleProducts) {
        // Calculer les valeurs finales
        const tauxFinal = Math.min(0.95, Math.max(0.60, eligibility.score / 100));
        const montantFinal = Math.min(
          eligibility.product.montantMax, 
          Math.max(eligibility.product.montantMin, eligibility.score * 100)
        );
        const dureeFinale = Math.min(
          eligibility.product.dureeMax, 
          Math.max(eligibility.product.dureeMin, 12)
        );
        
        await pool.query(
          `INSERT INTO "ClientProduitEligible" (
            "clientId", "produitId", "statut", "tauxFinal", "montantFinal", 
            "dureeFinale", "simulationId", "created_at", "updated_at"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            clientId,
            eligibility.product.id,
            'eligible',
            tauxFinal,
            montantFinal,
            dureeFinale,
            Date.now() // simulationId temporaire
          ]
        );
      }
      
      console.log(`✅ ${eligibleProducts.length} produits assignés au client ${clientId}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'attribution des produits:', error);
      throw error;
    }
  }
}

export default EligibilityEngine; 