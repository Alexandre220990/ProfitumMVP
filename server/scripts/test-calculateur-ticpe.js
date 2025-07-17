#!/usr/bin/env node

/**
 * 🧪 TEST DU CALCULATEUR TICPE
 * Vérification du moteur de calcul avec des données réelles
 */

// Données de test basées sur un profil transport
const TEST_RESPONSES = [
  {
    question_id: "secteur_activite",
    response_value: "Transport / Logistique"
  },
  {
    question_id: "vehicules_professionnels",
    response_value: "Oui"
  },
  {
    question_id: "nombre_vehicules",
    response_value: "11 à 25 véhicules"
  },
  {
    question_id: "types_vehicules",
    response_value: "Camions de plus de 7,5 tonnes"
  },
  {
    question_id: "consommation_carburant",
    response_value: "Plus de 50 000 litres"
  },
  {
    question_id: "types_carburant",
    response_value: "Gazole professionnel"
  },
  {
    question_id: "factures_carburant",
    response_value: "Oui, 3 dernières années complètes"
  },
  {
    question_id: "usage_professionnel",
    response_value: "100% professionnel"
  },
  {
    question_id: "cartes_carburant",
    response_value: "Oui, toutes les stations"
  },
  {
    question_id: "factures_nominatives",
    response_value: "Oui, systématiquement"
  },
  {
    question_id: "immatriculation_societe",
    response_value: "Oui, 100%"
  },
  {
    question_id: "declarations_ticpe",
    response_value: "Oui, régulièrement"
  },
  {
    question_id: "chiffre_affaires",
    response_value: "1 000 000€ - 5 000 000€"
  }
];

// Test avec des données minimales
const TEST_RESPONSES_MINIMAL = [
  {
    question_id: "secteur_activite",
    response_value: "Transport / Logistique"
  },
  {
    question_id: "vehicules_professionnels",
    response_value: "Oui"
  }
];

// Test avec des données BTP
const TEST_RESPONSES_BTP = [
  {
    question_id: "secteur_activite",
    response_value: "BTP / Travaux publics"
  },
  {
    question_id: "vehicules_professionnels",
    response_value: "Oui"
  },
  {
    question_id: "types_vehicules",
    response_value: "Engins de chantier"
  },
  {
    question_id: "consommation_carburant",
    response_value: "15 000 à 50 000 litres"
  },
  {
    question_id: "types_carburant",
    response_value: "Gazole Non Routier (GNR)"
  }
];

/**
 * Moteur de calcul TICPE simplifié pour test
 */
class TestTICPECalculator {
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

    this.estimationsConsommation = {
      'Moins de 5 000 litres': 3000,
      '5 000 à 15 000 litres': 10000,
      '15 000 à 50 000 litres': 32500,
      'Plus de 50 000 litres': 75000
    };
  }

  /**
   * Extraction des données du profil client depuis les réponses
   */
  extractClientProfile(responses) {
    const profile = {};

    console.log('🔍 Extraction du profil:');
    responses.forEach((response, index) => {
      console.log(`   ${index + 1}. ${response.question_id}: "${response.response_value}"`);
      
      const value = response.response_value;
      
      // Secteur d'activité
      if (value?.includes('Transport') || value?.includes('Logistique')) {
        profile.secteur = 'Transport routier de marchandises';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (value?.includes('BTP') || value?.includes('Travaux')) {
        profile.secteur = 'BTP / Travaux publics';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (value?.includes('Taxi') || value?.includes('VTC')) {
        profile.secteur = 'Taxi / VTC';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (value?.includes('Agricole') || value?.includes('Ferme')) {
        profile.secteur = 'Secteur Agricole';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      }

      // Véhicules professionnels
      if (value?.includes('Oui') && (response.question_id?.includes('vehicule') || response.question_id?.includes('professionnel'))) {
        profile.vehiculesProfessionnels = 'Oui';
        console.log(`      → Véhicules professionnels: ${profile.vehiculesProfessionnels}`);
      }

      // Types de véhicules
      if (value?.includes('Camion') || value?.includes('camion')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de plus de 7,5 tonnes');
        console.log(`      → Type véhicule ajouté: Camions de plus de 7,5 tonnes`);
      }
      if (value?.includes('engin') || value?.includes('Engin')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Engins de chantier');
        console.log(`      → Type véhicule ajouté: Engins de chantier`);
      }

      // Consommation carburant
      if (value?.includes('Plus de 50 000')) {
        profile.consommationCarburant = 'Plus de 50 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (value?.includes('15 000 à 50 000')) {
        profile.consommationCarburant = '15 000 à 50 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      }

      // Types de carburant
      if (value?.includes('Gazole') && !value?.includes('Non Routier')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole professionnel');
        console.log(`      → Carburant ajouté: Gazole professionnel`);
      }
      if (value?.includes('GNR') || value?.includes('Non Routier')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole Non Routier (GNR)');
        console.log(`      → Carburant ajouté: Gazole Non Routier (GNR)`);
      }

      // Usage professionnel
      if (value?.includes('100% professionnel')) {
        profile.usageProfessionnel = '100% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      }
    });

    console.log('📊 Profil final extrait:', profile);
    return profile;
  }

  /**
   * Calcul TICPE
   */
  calculateTICPESavings(responses) {
    console.log('\n🧮 CALCUL TICPE - Début');
    console.log('=' .repeat(50));
    
    console.log(`📋 Nombre de réponses: ${responses.length}`);
    
    const profile = this.extractClientProfile(responses);
    
    // Vérification éligibilité de base
    const secteursEligibles = [
      'Transport routier de marchandises',
      'Transport routier de voyageurs',
      'Taxi / VTC',
      'BTP / Travaux publics',
      'Secteur Agricole'
    ];

    console.log('\n🔍 Vérification éligibilité:');
    console.log(`   - Secteur détecté: ${profile.secteur}`);
    console.log(`   - Véhicules professionnels: ${profile.vehiculesProfessionnels}`);
    console.log(`   - Secteur éligible: ${secteursEligibles.includes(profile.secteur)}`);

    if (!secteursEligibles.includes(profile.secteur) || profile.vehiculesProfessionnels !== 'Oui') {
      console.log('❌ Non éligible: secteur ou véhicules manquants');
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    // Calcul du montant récupérable
    let estimatedSavings = 0;
    let score = 0;

    // Score d'éligibilité (0-100)
    const scoresSecteur = {
      'Transport routier de marchandises': 30,
      'Transport routier de voyageurs': 30,
      'Taxi / VTC': 25,
      'BTP / Travaux publics': 20,
      'Secteur Agricole': 15
    };
    score += scoresSecteur[profile.secteur] || 0;
    console.log(`\n📊 Calcul du score:`);
    console.log(`   - Score secteur: ${score}`);

    // Véhicules professionnels (25 points)
    score += 25;
    console.log(`   - Score après véhicules: ${score}`);

    // Types de véhicules (20 points)
    if (profile.typesVehicules) {
      let vehicleScore = 0;
      profile.typesVehicules.forEach((type) => {
        switch (type) {
          case 'Camions de plus de 7,5 tonnes': vehicleScore += 20; break;
          case 'Camions de 3,5 à 7,5 tonnes': vehicleScore += 15; break;
          case 'Engins de chantier': vehicleScore += 15; break;
          case 'Tracteurs agricoles': vehicleScore += 15; break;
          case 'Véhicules utilitaires légers': vehicleScore += 10; break;
          case 'Véhicules de service': vehicleScore += 10; break;
        }
      });
      score += Math.min(vehicleScore, 20);
      console.log(`   - Score après types véhicules: ${score} (types: ${profile.typesVehicules.join(', ')})`);
    }

    // Consommation carburant (15 points)
    if (profile.consommationCarburant) {
      if (profile.consommationCarburant === 'Plus de 50 000 litres') score += 15;
      else if (profile.consommationCarburant === '15 000 à 50 000 litres') score += 10;
      else if (profile.consommationCarburant === '5 000 à 15 000 litres') score += 5;
      console.log(`   - Score après consommation: ${score} (consommation: ${profile.consommationCarburant})`);
    }

    console.log(`   - Score final: ${score}`);

    // Calcul du montant récupérable
    if (score > 0) {
      const fuelRate = this.getFuelRate(profile.typesCarburant, profile.secteur);
      const totalConsumption = this.estimationsConsommation[profile.consommationCarburant] || 10000;
      const vehicleCoefficient = this.getVehicleCoefficient(profile.typesVehicules);
      const usageCoefficient = profile.usageProfessionnel === '100% professionnel' ? 1.0 : 0.8;
      
      estimatedSavings = totalConsumption * fuelRate * vehicleCoefficient * usageCoefficient;
      
      // Plafonnement
      estimatedSavings = Math.min(estimatedSavings, 100000);
      estimatedSavings = Math.max(estimatedSavings, 500);

      console.log(`\n💰 Calcul du montant:`);
      console.log(`   - Taux carburant: ${fuelRate}€/L`);
      console.log(`   - Consommation totale: ${totalConsumption}L`);
      console.log(`   - Coefficient véhicule: ${vehicleCoefficient}`);
      console.log(`   - Coefficient usage: ${usageCoefficient}`);
      console.log(`   - Montant calculé: ${estimatedSavings.toLocaleString('fr-FR')}€`);
    }

    const confidence = score >= 70 ? 'élevé' : score >= 40 ? 'moyen' : 'faible';
    console.log(`\n✅ Résultat final: ${estimatedSavings.toLocaleString('fr-FR')}€, score: ${score}/100, confiance: ${confidence}`);
    
    return { savings: Math.round(estimatedSavings), score: Math.min(score, 100), confidence };
  }

  getFuelRate(typesCarburant, secteur) {
    if (!typesCarburant || typesCarburant.length === 0) {
      const tauxDefaut = {
        'Transport routier de marchandises': 0.177,
        'Transport routier de voyageurs': 0.177,
        'Taxi / VTC': 0.213,
        'BTP / Travaux publics': 0.150,
        'Secteur Agricole': 0.150
      };
      return tauxDefaut[secteur] || 0.177;
    }

    let maxRate = 0;
    typesCarburant.forEach(type => {
      const rate = this.tauxCarburant[type] || 0.177;
      if (rate > maxRate) maxRate = rate;
    });

    return maxRate;
  }

  getVehicleCoefficient(typesVehicules) {
    if (!typesVehicules || typesVehicules.length === 0) return 0.7;

    let totalCoefficient = 0;
    typesVehicules.forEach(type => {
      totalCoefficient += this.coefficientsVehicules[type] || 0.5;
    });

    return totalCoefficient / typesVehicules.length;
  }
}

/**
 * Tests
 */
async function runTests() {
  console.log('🧪 TESTS DU CALCULATEUR TICPE');
  console.log('=' .repeat(60));
  
  const calculator = new TestTICPECalculator();

  // Test 1: Profil transport complet
  console.log('\n\n📋 TEST 1: Profil Transport complet');
  console.log('─'.repeat(40));
  const result1 = calculator.calculateTICPESavings(TEST_RESPONSES);

  // Test 2: Profil minimal
  console.log('\n\n📋 TEST 2: Profil minimal');
  console.log('─'.repeat(40));
  const result2 = calculator.calculateTICPESavings(TEST_RESPONSES_MINIMAL);

  // Test 3: Profil BTP
  console.log('\n\n📋 TEST 3: Profil BTP');
  console.log('─'.repeat(40));
  const result3 = calculator.calculateTICPESavings(TEST_RESPONSES_BTP);

  // Résumé
  console.log('\n\n📊 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(60));
  console.log(`Test 1 (Transport complet): ${result1.savings.toLocaleString('fr-FR')}€ - Score: ${result1.score}/100`);
  console.log(`Test 2 (Minimal): ${result2.savings.toLocaleString('fr-FR')}€ - Score: ${result2.score}/100`);
  console.log(`Test 3 (BTP): ${result3.savings.toLocaleString('fr-FR')}€ - Score: ${result3.score}/100`);
}

// Exécution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { TestTICPECalculator, TEST_RESPONSES }; 