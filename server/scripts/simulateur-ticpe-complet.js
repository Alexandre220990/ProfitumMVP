#!/usr/bin/env node

/**
 * 🚀 SIMULATEUR TICPE COMPLET - PROFITUM
 * Tests avec différents profils clients réels
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlstubqfxdzltldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzdHVicWZ4ZHpsdGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzE5NzAsImV4cCI6MjA2NDI0Nzk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Profils de test clients réels
const PROFILS_CLIENTS = {
  // 🚛 Transport routier de marchandises - Flotte importante
  transport_marchandises: {
    nom: "Transport Martin - Flotte 15 camions",
    secteur: "Transport routier de marchandises",
    chiffreAffaires: "1 000 000€ - 5 000 000€",
    vehiculesProfessionnels: "Oui",
    nombreVehicules: "11 à 25 véhicules",
    typesVehicules: ["Camions de plus de 7,5 tonnes", "Camions de 3,5 à 7,5 tonnes"],
    chronotachygraphe: "Oui, tous",
    consommationCarburant: "Plus de 50 000 litres",
    typesCarburant: ["Gazole professionnel"],
    facturesCarburant: "Oui, 3 dernières années complètes",
    usageProfessionnel: "100% professionnel",
    kilometrageAnnuel: "Plus de 60 000 km",
    cartesCarburant: "Oui, toutes les stations",
    facturesNominatives: "Oui, systématiquement",
    immatriculationSociete: "Oui, 100%",
    declarationsTicpe: "Oui, régulièrement",
    projetsOptimisation: ["CIR (Crédit d'Impôt Recherche)", "Optimisation URSSAF"],
    objectifsPrioritaires: ["Réduire les coûts", "Gain de temps administratif"]
  },

  // 🚕 Taxi/VTC - Petit exploitant
  taxi_vtc: {
    nom: "Taxi Dupont - 2 véhicules",
    secteur: "Taxi / VTC",
    chiffreAffaires: "100 000€ - 500 000€",
    vehiculesProfessionnels: "Oui",
    nombreVehicules: "1 à 3 véhicules",
    typesVehicules: ["Véhicules de service"],
    chronotachygraphe: "Non",
    consommationCarburant: "5 000 à 15 000 litres",
    typesCarburant: ["Gazole professionnel", "Essence"],
    facturesCarburant: "Oui, 2 dernières années",
    usageProfessionnel: "100% professionnel",
    kilometrageAnnuel: "30 000 à 60 000 km",
    cartesCarburant: "Oui, partiellement",
    facturesNominatives: "Oui, partiellement",
    immatriculationSociete: "Oui, 100%",
    declarationsTicpe: "Non",
    projetsOptimisation: ["Optimisation URSSAF"],
    objectifsPrioritaires: ["Réduire les coûts", "Optimiser la fiscalité"]
  },

  // 🏗️ BTP - Entreprise moyenne
  btp_travaux_publics: {
    nom: "BTP Construction - 8 engins",
    secteur: "BTP / Travaux publics",
    chiffreAffaires: "500 000€ - 1 000 000€",
    vehiculesProfessionnels: "Oui",
    nombreVehicules: "4 à 10 véhicules",
    typesVehicules: ["Engins de chantier", "Véhicules utilitaires légers"],
    chronotachygraphe: "Oui, certains",
    consommationCarburant: "15 000 à 50 000 litres",
    typesCarburant: ["Gazole Non Routier (GNR)"],
    facturesCarburant: "Oui, 1 dernière année",
    usageProfessionnel: "80-99% professionnel",
    kilometrageAnnuel: "10 000 à 30 000 km",
    cartesCarburant: "Oui, partiellement",
    facturesNominatives: "Oui, partiellement",
    immatriculationSociete: "Oui, majoritairement",
    declarationsTicpe: "Oui, occasionnellement",
    projetsOptimisation: ["Audit énergétique"],
    objectifsPrioritaires: ["Améliorer mon fonctionnement global", "Conformité réglementaire"]
  },

  // 🚜 Agriculture - Exploitation familiale
  agriculture: {
    nom: "Ferme Dubois - 5 tracteurs",
    secteur: "Secteur Agricole",
    chiffreAffaires: "100 000€ - 500 000€",
    vehiculesProfessionnels: "Oui",
    nombreVehicules: "1 à 3 véhicules",
    typesVehicules: ["Tracteurs agricoles"],
    chronotachygraphe: "Non",
    consommationCarburant: "5 000 à 15 000 litres",
    typesCarburant: ["Gazole Non Routier (GNR)"],
    facturesCarburant: "Partiellement",
    usageProfessionnel: "100% professionnel",
    kilometrageAnnuel: "Moins de 10 000 km",
    cartesCarburant: "Non",
    facturesNominatives: "Oui, partiellement",
    immatriculationSociete: "Oui, 100%",
    declarationsTicpe: "Non",
    projetsOptimisation: ["Aucun"],
    objectifsPrioritaires: ["Réduire les coûts"]
  },

  // ❌ Client non éligible - Commerce sans véhicules
  commerce_sans_vehicules: {
    nom: "Boutique Mode - Aucun véhicule",
    secteur: "Commerce",
    chiffreAffaires: "100 000€ - 500 000€",
    vehiculesProfessionnels: "Non",
    // Toutes les autres questions ne s'appliquent pas
    projetsOptimisation: ["Optimisation URSSAF"],
    objectifsPrioritaires: ["Réduire les coûts", "Gain de temps administratif"]
  }
};

/**
 * Moteur de calcul TICPE optimisé
 */
class TICPESimulator {
  constructor() {
    this.tauxCarburant = {
      'Gazole professionnel': 0.177,
      'Gazole Non Routier (GNR)': 0.150,
      'Essence': 0.177,
      'GPL': 0.177,
      'Électricité': 0.177
    };

    this.coefficientsVehicules = {
      'Camions de plus de 7,5 tonnes': 1.0,
      'Camions de 3,5 à 7,5 tonnes': 0.8,
      'Véhicules utilitaires légers': 0.6,
      'Engins de chantier': 0.9,
      'Véhicules de service': 0.7,
      'Véhicules de fonction': 0.5,
      'Tracteurs agricoles': 0.9
    };

    this.coefficientsUsage = {
      '100% professionnel': 1.0,
      '80-99% professionnel': 0.9,
      '60-79% professionnel': 0.7,
      'Moins de 60% professionnel': 0.5
    };

    this.estimationsConsommation = {
      'Moins de 5 000 litres': 3000,
      '5 000 à 15 000 litres': 10000,
      '15 000 à 50 000 litres': 32500,
      'Plus de 50 000 litres': 75000
    };

    this.estimationsKilometrage = {
      'Moins de 10 000 km': 8000,
      '10 000 à 30 000 km': 20000,
      '30 000 à 60 000 km': 45000,
      'Plus de 60 000 km': 80000
    };
  }

  /**
   * Calcul principal TICPE
   */
  calculateTICPERecovery(profil) {
    console.log(`\n🧮 CALCUL TICPE - ${profil.nom}`);
    console.log('=' .repeat(50));

    // 1. Vérification éligibilité
    const eligibility = this.checkEligibility(profil);
    if (!eligibility.isEligible) {
      return {
        eligible: false,
        raison: eligibility.raison,
        score_eligibilite: 0,
        montant_estime: 0,
        niveau_confiance: 'faible',
        recommandations: ['❌ Non éligible à la récupération TICPE']
      };
    }

    // 2. Calcul du score d'éligibilité
    const scoreEligibilite = this.calculateEligibilityScore(profil);

    // 3. Calcul du montant récupérable
    const calculMontant = this.calculateRecoveryAmount(profil);

    // 4. Calcul du score de maturité administrative
    const scoreMaturite = this.calculateMaturityScore(profil);

    // 5. Détermination du niveau de confiance
    const niveauConfiance = this.determineConfidenceLevel(profil, scoreMaturite);

    // 6. Génération des recommandations
    const recommandations = this.generateRecommendations(profil, calculMontant, scoreMaturite);

    return {
      eligible: true,
      score_eligibilite: scoreEligibilite,
      montant_estime: Math.round(calculMontant.final_amount),
      niveau_confiance: niveauConfiance,
      score_maturite: scoreMaturite,
      details_calcul: {
        montant_base: Math.round(calculMontant.base_amount),
        coefficient_vehicule: calculMontant.vehicle_coefficient,
        coefficient_usage: calculMontant.usage_coefficient,
        taux_carburant: calculMontant.fuel_rate,
        consommation_totale: calculMontant.total_consumption
      },
      recommandations: recommandations,
      secteur_performance: eligibility.secteurPerformance
    };
  }

  /**
   * Vérification de l'éligibilité de base
   */
  checkEligibility(profil) {
    const secteursEligibles = [
      'Transport routier de marchandises',
      'Transport routier de voyageurs',
      'Taxi / VTC',
      'BTP / Travaux publics',
      'Secteur Agricole'
    ];

    if (!secteursEligibles.includes(profil.secteur)) {
      return { isEligible: false, raison: 'Secteur non éligible', secteurPerformance: 0 };
    }

    if (profil.vehiculesProfessionnels !== 'Oui') {
      return { isEligible: false, raison: 'Aucun véhicule professionnel', secteurPerformance: 0 };
    }

    // Performance du secteur
    const performancesSecteur = {
      'Transport routier de marchandises': 95,
      'Transport routier de voyageurs': 90,
      'Taxi / VTC': 75,
      'BTP / Travaux publics': 70,
      'Secteur Agricole': 60
    };

    return { 
      isEligible: true, 
      raison: 'Éligible', 
      secteurPerformance: performancesSecteur[profil.secteur] || 0 
    };
  }

  /**
   * Calcul du score d'éligibilité (0-100)
   */
  calculateEligibilityScore(profil) {
    let score = 0;

    // Secteur d'activité (30 points)
    const scoresSecteur = {
      'Transport routier de marchandises': 30,
      'Transport routier de voyageurs': 30,
      'Taxi / VTC': 25,
      'BTP / Travaux publics': 20,
      'Secteur Agricole': 15
    };
    score += scoresSecteur[profil.secteur] || 0;

    // Véhicules professionnels (25 points)
    score += 25;

    // Types de véhicules (20 points)
    if (profil.typesVehicules) {
      const scoreVehicules = this.calculateVehicleScore(profil.typesVehicules);
      score += scoreVehicules;
    }

    // Consommation carburant (15 points)
    if (profil.consommationCarburant) {
      if (profil.consommationCarburant === 'Plus de 50 000 litres') score += 15;
      else if (profil.consommationCarburant === '15 000 à 50 000 litres') score += 10;
      else if (profil.consommationCarburant === '5 000 à 15 000 litres') score += 5;
    }

    // Documents disponibles (10 points)
    if (profil.facturesCarburant && profil.facturesCarburant.includes('complètes')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calcul du score des véhicules
   */
  calculateVehicleScore(typesVehicules) {
    let score = 0;
    
    typesVehicules.forEach(type => {
      switch (type) {
        case 'Camions de plus de 7,5 tonnes':
          score += 20;
          break;
        case 'Camions de 3,5 à 7,5 tonnes':
          score += 15;
          break;
        case 'Engins de chantier':
          score += 15;
          break;
        case 'Tracteurs agricoles':
          score += 15;
          break;
        case 'Véhicules utilitaires légers':
          score += 10;
          break;
        case 'Véhicules de service':
          score += 10;
          break;
      }
    });

    return Math.min(score, 20);
  }

  /**
   * Calcul du montant récupérable
   */
  calculateRecoveryAmount(profil) {
    // 1. Détermination du taux de carburant
    const fuelRate = this.getFuelRate(profil.typesCarburant, profil.secteur);
    
    // 2. Calcul de la consommation totale
    const totalConsumption = this.estimationsConsommation[profil.consommationCarburant] || 10000;
    
    // 3. Calcul du montant de base
    const baseAmount = totalConsumption * fuelRate;
    
    // 4. Application du coefficient véhicule
    const vehicleCoefficient = this.getVehicleCoefficient(profil.typesVehicules);
    
    // 5. Application du coefficient d'usage professionnel
    const usageCoefficient = this.coefficientsUsage[profil.usageProfessionnel] || 0.7;
    
    // 6. Calcul du montant final
    let finalAmount = baseAmount * vehicleCoefficient * usageCoefficient;
    
    // 7. Facteur de correction selon la taille
    const sizeCorrection = this.getSizeCorrection(profil.nombreVehicules, profil.chiffreAffaires);
    finalAmount *= sizeCorrection;
    
    // 8. Plafonnement réaliste
    finalAmount = Math.min(finalAmount, 100000); // Plafond 100k€
    finalAmount = Math.max(finalAmount, 500);    // Minimum 500€

    return {
      base_amount: baseAmount,
      vehicle_coefficient: vehicleCoefficient,
      usage_coefficient: usageCoefficient,
      fuel_rate: fuelRate,
      total_consumption: totalConsumption,
      final_amount: finalAmount
    };
  }

  /**
   * Récupération du taux de carburant
   */
  getFuelRate(typesCarburant, secteur) {
    if (!typesCarburant || typesCarburant.length === 0) {
      // Taux par défaut selon le secteur
      const tauxDefaut = {
        'Transport routier de marchandises': 0.177,
        'Transport routier de voyageurs': 0.177,
        'Taxi / VTC': 0.213,
        'BTP / Travaux publics': 0.150,
        'Secteur Agricole': 0.150
      };
      return tauxDefaut[secteur] || 0.177;
    }

    // Prendre le taux le plus élevé parmi les carburants utilisés
    let maxRate = 0;
    typesCarburant.forEach(type => {
      const rate = this.tauxCarburant[type] || 0.177;
      if (rate > maxRate) maxRate = rate;
    });

    return maxRate;
  }

  /**
   * Calcul du coefficient véhicule
   */
  getVehicleCoefficient(typesVehicules) {
    if (!typesVehicules || typesVehicules.length === 0) return 0.7;

    let totalCoefficient = 0;
    typesVehicules.forEach(type => {
      totalCoefficient += this.coefficientsVehicules[type] || 0.5;
    });

    return totalCoefficient / typesVehicules.length;
  }

  /**
   * Facteur de correction selon la taille
   */
  getSizeCorrection(nombreVehicules, chiffreAffaires) {
    let correction = 1.0;

    // Correction selon le nombre de véhicules
    if (nombreVehicules === 'Plus de 25 véhicules') correction *= 1.1;
    else if (nombreVehicules === '11 à 25 véhicules') correction *= 1.05;
    else if (nombreVehicules === '1 à 3 véhicules') correction *= 0.9;

    // Correction selon le chiffre d'affaires
    if (chiffreAffaires === 'Plus de 5 000 000€') correction *= 1.1;
    else if (chiffreAffaires === 'Moins de 100 000€') correction *= 0.9;

    return correction;
  }

  /**
   * Calcul du score de maturité administrative (0-100)
   */
  calculateMaturityScore(profil) {
    let score = 0;

    // Cartes carburant professionnelles (20 points)
    if (profil.cartesCarburant === 'Oui, toutes les stations') score += 20;
    else if (profil.cartesCarburant === 'Oui, partiellement') score += 10;

    // Factures nominatives (20 points)
    if (profil.facturesNominatives === 'Oui, systématiquement') score += 20;
    else if (profil.facturesNominatives === 'Oui, partiellement') score += 10;

    // Immatriculation société (15 points)
    if (profil.immatriculationSociete === 'Oui, 100%') score += 15;
    else if (profil.immatriculationSociete === 'Oui, majoritairement') score += 10;

    // Déclarations TICPE (25 points)
    if (profil.declarationsTicpe === 'Oui, régulièrement') score += 25;
    else if (profil.declarationsTicpe === 'Oui, occasionnellement') score += 15;

    // Factures carburant (20 points)
    if (profil.facturesCarburant === 'Oui, 3 dernières années complètes') score += 20;
    else if (profil.facturesCarburant === 'Oui, 2 dernières années') score += 15;
    else if (profil.facturesCarburant === 'Oui, 1 dernière année') score += 10;
    else if (profil.facturesCarburant === 'Partiellement') score += 5;

    return Math.min(score, 100);
  }

  /**
   * Détermination du niveau de confiance
   */
  determineConfidenceLevel(profil, scoreMaturite) {
    let confiance = 0;

    // Score de maturité (40 points max)
    confiance += (scoreMaturite / 100) * 40;

    // Qualité des données (30 points max)
    if (profil.consommationCarburant) confiance += 15;
    if (profil.typesCarburant && profil.typesCarburant.length > 0) confiance += 15;

    // Secteur performant (30 points max)
    const secteursPerformants = ['Transport routier de marchandises', 'Transport routier de voyageurs'];
    if (secteursPerformants.includes(profil.secteur)) confiance += 30;

    if (confiance >= 70) return 'élevé';
    if (confiance >= 40) return 'moyen';
    return 'faible';
  }

  /**
   * Génération des recommandations
   */
  generateRecommendations(profil, calculMontant, scoreMaturite) {
    const recommandations = [];

    // Recommandations selon le score de maturité
    if (scoreMaturite >= 80) {
      recommandations.push('✅ Maturité administrative élevée - Récupération optimale possible');
    } else if (scoreMaturite >= 60) {
      recommandations.push('⚠️ Maturité administrative moyenne - Amélioration possible');
    } else if (scoreMaturite >= 40) {
      recommandations.push('🔧 Maturité administrative faible - Accompagnement nécessaire');
    } else {
      recommandations.push('❌ Maturité administrative insuffisante - Formation requise');
    }

    // Recommandations spécifiques
    if (profil.cartesCarburant !== 'Oui, toutes les stations') {
      recommandations.push('💳 Misez sur les cartes carburant professionnelles');
    }

    if (profil.facturesNominatives !== 'Oui, systématiquement') {
      recommandations.push('📄 Améliorez la conservation des factures nominatives');
    }

    if (profil.declarationsTicpe !== 'Oui, régulièrement') {
      recommandations.push('📋 Mettez en place des déclarations TICPE régulières');
    }

    // Recommandations selon le montant
    if (calculMontant.final_amount > 20000) {
      recommandations.push('💰 Montant élevé - Audit approfondi recommandé');
    } else if (calculMontant.final_amount < 5000) {
      recommandations.push('🔍 Montant modeste - Vérifiez l\'optimisation');
    }

    return recommandations;
  }
}

/**
 * Fonction principale de test
 */
async function testSimulateurTICPE() {
  console.log('🚀 SIMULATEUR TICPE COMPLET - TESTS CLIENTS');
  console.log('=' .repeat(60));
  console.log('Date:', new Date().toLocaleString('fr-FR'));
  console.log('');

  const simulateur = new TICPESimulator();

  // Test de chaque profil client
  for (const [key, profil] of Object.entries(PROFILS_CLIENTS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`👤 PROFIL: ${profil.nom}`);
    console.log(`🏢 Secteur: ${profil.secteur}`);
    console.log(`💰 CA: ${profil.chiffreAffaires}`);
    
    if (profil.vehiculesProfessionnels === 'Oui') {
      console.log(`🚛 Véhicules: ${profil.nombreVehicules} (${profil.typesVehicules?.join(', ')})`);
      console.log(`⛽ Consommation: ${profil.consommationCarburant}`);
    } else {
      console.log(`❌ Aucun véhicule professionnel`);
    }

    const resultat = simulateur.calculateTICPERecovery(profil);

    // Affichage des résultats
    console.log('\n📊 RÉSULTATS:');
    console.log('─'.repeat(30));
    
    if (resultat.eligible) {
      console.log(`✅ Éligible: OUI`);
      console.log(`🎯 Score d'éligibilité: ${resultat.score_eligibilite}/100`);
      console.log(`💰 Montant estimé: ${resultat.montant_estime.toLocaleString('fr-FR')}€`);
      console.log(`📈 Niveau de confiance: ${resultat.niveau_confiance.toUpperCase()}`);
      console.log(`🏆 Score de maturité: ${resultat.score_maturite}/100`);
      console.log(`📊 Performance secteur: ${resultat.secteur_performance}%`);
      
      console.log('\n🔧 DÉTAILS DU CALCUL:');
      console.log(`   • Montant de base: ${resultat.details_calcul.montant_base.toLocaleString('fr-FR')}€`);
      console.log(`   • Coefficient véhicule: ${resultat.details_calcul.coefficient_vehicule.toFixed(2)}`);
      console.log(`   • Coefficient usage: ${resultat.details_calcul.coefficient_usage.toFixed(2)}`);
      console.log(`   • Taux carburant: ${resultat.details_calcul.taux_carburant}€/L`);
      console.log(`   • Consommation totale: ${resultat.details_calcul.consommation_totale.toLocaleString('fr-FR')}L`);
      
      console.log('\n💡 RECOMMANDATIONS:');
      resultat.recommandations.forEach(rec => console.log(`   • ${rec}`));
    } else {
      console.log(`❌ Éligible: NON`);
      console.log(`📝 Raison: ${resultat.raison}`);
      console.log(`💡 Recommandations: ${resultat.recommandations.join(', ')}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ TESTS TERMINÉS');
  console.log('📊 Résumé des simulations disponibles dans PROFILS_CLIENTS');
}

// Exécution du test
if (require.main === module) {
  testSimulateurTICPE().catch(console.error);
}

module.exports = { TICPESimulator, PROFILS_CLIENTS }; 