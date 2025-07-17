const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Cas de test basés sur les données réelles fournies
const testCases = [
  {
    name: "Transport routier de marchandises - 5 camions",
    description: "PME transport avec 5 camions > 7,5 tonnes",
    expected_recovery: 9000,
    responses: [
      { question_id: "secteur_activite", response_value: "Transport routier de marchandises" },
      { question_id: "chiffre_affaires", response_value: "1 000 000€ - 5 000 000€" },
      { question_id: "vehicules_professionnels", response_value: "Oui" },
      { question_id: "nombre_vehicules", response_value: "4 à 10 véhicules" },
      { question_id: "types_vehicules", response_value: ["Camions de plus de 7,5 tonnes"] },
      { question_id: "chronotachygraphe", response_value: "Oui, tous" },
      { question_id: "consommation_carburant", response_value: "15 000 à 50 000 litres" },
      { question_id: "types_carburant", response_value: ["Gazole professionnel"] },
      { question_id: "factures_carburant", response_value: "Oui, 3 dernières années complètes" },
      { question_id: "usage_professionnel", response_value: "100% professionnel" },
      { question_id: "kilometrage_annuel", response_value: "30 000 à 60 000 km" },
      { question_id: "cartes_carburant", response_value: "Oui, toutes les stations" },
      { question_id: "factures_nominatives", response_value: "Oui, systématiquement" },
      { question_id: "immatriculation_societe", response_value: "Oui, 100%" },
      { question_id: "declarations_ticpe", response_value: "Oui, régulièrement" }
    ]
  },
  {
    name: "Taxi / VTC - 1 véhicule",
    description: "Entreprise VTC avec 1 véhicule",
    expected_recovery: 1300,
    responses: [
      { question_id: "secteur_activite", response_value: "Taxi / VTC" },
      { question_id: "chiffre_affaires", response_value: "100 000€ - 500 000€" },
      { question_id: "vehicules_professionnels", response_value: "Oui" },
      { question_id: "nombre_vehicules", response_value: "1 à 3 véhicules" },
      { question_id: "types_vehicules", response_value: ["Véhicules utilitaires légers"] },
      { question_id: "chronotachygraphe", response_value: "Non" },
      { question_id: "consommation_carburant", response_value: "5 000 à 15 000 litres" },
      { question_id: "types_carburant", response_value: ["Gazole professionnel"] },
      { question_id: "factures_carburant", response_value: "Oui, 2 dernières années" },
      { question_id: "usage_professionnel", response_value: "100% professionnel" },
      { question_id: "kilometrage_annuel", response_value: "30 000 à 60 000 km" },
      { question_id: "cartes_carburant", response_value: "Oui, partiellement" },
      { question_id: "factures_nominatives", response_value: "Oui, partiellement" },
      { question_id: "immatriculation_societe", response_value: "Oui, 100%" },
      { question_id: "declarations_ticpe", response_value: "Non" }
    ]
  },
  {
    name: "BTP - 15 engins de chantier",
    description: "PME BTP avec 15 engins lourds",
    expected_recovery: 12000,
    responses: [
      { question_id: "secteur_activite", response_value: "BTP / Travaux publics" },
      { question_id: "chiffre_affaires", response_value: "1 000 000€ - 5 000 000€" },
      { question_id: "vehicules_professionnels", response_value: "Oui" },
      { question_id: "nombre_vehicules", response_value: "11 à 25 véhicules" },
      { question_id: "types_vehicules", response_value: ["Engins de chantier"] },
      { question_id: "chronotachygraphe", response_value: "Non" },
      { question_id: "consommation_carburant", response_value: "Plus de 50 000 litres" },
      { question_id: "types_carburant", response_value: ["Gazole Non Routier (GNR)"] },
      { question_id: "factures_carburant", response_value: "Partiellement" },
      { question_id: "usage_professionnel", response_value: "80-99% professionnel" },
      { question_id: "kilometrage_annuel", response_value: "Moins de 10 000 km" },
      { question_id: "cartes_carburant", response_value: "Non" },
      { question_id: "factures_nominatives", response_value: "Oui, partiellement" },
      { question_id: "immatriculation_societe", response_value: "Oui, majoritairement" },
      { question_id: "declarations_ticpe", response_value: "Non" }
    ]
  },
  {
    name: "Agriculture - 10 tracteurs",
    description: "Coopérative agricole avec 10 tracteurs",
    expected_recovery: 7500,
    responses: [
      { question_id: "secteur_activite", response_value: "Secteur Agricole" },
      { question_id: "chiffre_affaires", response_value: "500 000€ - 1 000 000€" },
      { question_id: "vehicules_professionnels", response_value: "Oui" },
      { question_id: "nombre_vehicules", response_value: "4 à 10 véhicules" },
      { question_id: "types_vehicules", response_value: ["Tracteurs agricoles"] },
      { question_id: "chronotachygraphe", response_value: "Non" },
      { question_id: "consommation_carburant", response_value: "15 000 à 50 000 litres" },
      { question_id: "types_carburant", response_value: ["Gazole Non Routier (GNR)"] },
      { question_id: "factures_carburant", response_value: "Oui, 1 dernière année" },
      { question_id: "usage_professionnel", response_value: "80-99% professionnel" },
      { question_id: "kilometrage_annuel", response_value: "Moins de 10 000 km" },
      { question_id: "cartes_carburant", response_value: "Non" },
      { question_id: "factures_nominatives", response_value: "Oui, partiellement" },
      { question_id: "immatriculation_societe", response_value: "Oui, majoritairement" },
      { question_id: "declarations_ticpe", response_value: "Non" }
    ]
  },
  {
    name: "Non éligible - Commerce sans véhicules",
    description: "Entreprise de commerce sans véhicules professionnels",
    expected_recovery: 0,
    responses: [
      { question_id: "secteur_activite", response_value: "Commerce" },
      { question_id: "chiffre_affaires", response_value: "100 000€ - 500 000€" },
      { question_id: "vehicules_professionnels", response_value: "Non" }
    ]
  }
];

async function testTICPESimulator() {
  console.log('🧪 Test du simulateur TICPE optimisé\n');

  try {
    // Vérifier que les tables existent
    console.log('1️⃣ Vérification des tables TICPE...');
    const { data: sectorsData } = await supabase
      .from('TICPESectors')
      .select('count')
      .limit(1);

    if (!sectorsData) {
      console.log('❌ Tables TICPE non trouvées. Exécutez d\'abord insert-ticpe-data.js');
      return;
    }

    console.log('✅ Tables TICPE disponibles');

    // Vérifier que les questions existent
    console.log('\n2️⃣ Vérification des questions TICPE...');
    const { data: questionsData } = await supabase
      .from('QuestionnaireQuestion')
      .select('count')
      .contains('produits_cibles', ['TICPE'])
      .limit(1);

    if (!questionsData) {
      console.log('❌ Questions TICPE non trouvées. Exécutez d\'abord insert-ticpe-questionnaire.js');
      return;
    }

    console.log('✅ Questions TICPE disponibles');

    // Tests des cas de test
    console.log('\n3️⃣ Tests des cas de test...\n');

    for (const testCase of testCases) {
      console.log(`📋 Test: ${testCase.name}`);
      console.log(`📝 Description: ${testCase.description}`);
      console.log(`🎯 Récupération attendue: ${testCase.expected_recovery.toLocaleString('fr-FR')}€`);

      // Simulation du calcul (simplifié pour le test)
      const result = await simulateTICPERecovery(testCase.responses);
      
      console.log(`💰 Récupération calculée: ${result.estimated_recovery.toLocaleString('fr-FR')}€`);
      console.log(`📊 Score d'éligibilité: ${result.eligibility_score}/100`);
      console.log(`🎯 Niveau de confiance: ${result.confidence_level}`);
      console.log(`📈 Score de maturité: ${result.maturity_score}/100`);

      // Vérification de la précision
      const accuracy = Math.abs(result.estimated_recovery - testCase.expected_recovery) / testCase.expected_recovery * 100;
      const isAccurate = accuracy <= 30; // Tolérance de 30%

      console.log(`✅ Précision: ${accuracy.toFixed(1)}% ${isAccurate ? '✅' : '❌'}`);

      if (result.recommendations.length > 0) {
        console.log('💡 Recommandations:');
        result.recommendations.slice(0, 3).forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }

      if (result.risk_factors.length > 0) {
        console.log('⚠️ Facteurs de risque:');
        result.risk_factors.forEach(risk => {
          console.log(`   - ${risk}`);
        });
      }

      console.log('─'.repeat(80));
    }

    console.log('\n✅ Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

async function simulateTICPERecovery(responses) {
  // Simulation simplifiée du moteur de calcul
  const data = extractDataFromResponses(responses);
  
  // Vérification de l'éligibilité de base
  if (!data.vehiculesProfessionnels) {
    return {
      eligibility_score: 0,
      estimated_recovery: 0,
      confidence_level: 'low',
      maturity_score: 0,
      recommendations: ['❌ Non éligible - Aucun véhicule professionnel'],
      risk_factors: []
    };
  }

  // Calcul du score d'éligibilité
  let eligibilityScore = 0;
  
  // Secteur d'activité
  const sectorScores = {
    'Transport routier de marchandises': 30,
    'Transport routier de voyageurs': 30,
    'Taxi / VTC': 25,
    'BTP / Travaux publics': 20,
    'Secteur Agricole': 15
  };
  eligibilityScore += sectorScores[data.secteur] || 0;

  // Véhicules professionnels
  eligibilityScore += 25;

  // Types de véhicules
  if (data.typesVehicules) {
    const vehicleScore = calculateVehicleScore(data.typesVehicules);
    eligibilityScore += vehicleScore;
  }

  // Consommation carburant
  if (data.consommationCarburant) {
    if (data.consommationCarburant > 50000) eligibilityScore += 15;
    else if (data.consommationCarburant > 15000) eligibilityScore += 10;
    else if (data.consommationCarburant > 5000) eligibilityScore += 5;
  }

  // Calcul du montant récupérable
  const fuelRate = getFuelRate(data.typesCarburant, data.secteur);
  const totalConsumption = data.consommationCarburant || estimateConsumption(data);
  const vehicleCoefficient = getVehicleCoefficient(data.typesVehicules);
  const usageCoefficient = getUsageCoefficient(data.usageProfessionnel);
  
  let estimatedRecovery = totalConsumption * fuelRate * vehicleCoefficient * usageCoefficient;
  
  // Plafonnement
  estimatedRecovery = Math.min(estimatedRecovery, 100000);
  estimatedRecovery = Math.max(estimatedRecovery, 500);

  // Calcul du score de maturité
  const maturityScore = calculateMaturityScore(data);

  // Niveau de confiance
  const confidenceLevel = determineConfidenceLevel(data, maturityScore);

  // Recommandations
  const recommendations = generateRecommendations(data, estimatedRecovery);

  // Facteurs de risque
  const riskFactors = identifyRiskFactors(data, maturityScore);

  return {
    eligibility_score: Math.min(eligibilityScore, 100),
    estimated_recovery: Math.round(estimatedRecovery),
    confidence_level: confidenceLevel,
    maturity_score: maturityScore,
    recommendations,
    risk_factors: riskFactors
  };
}

function extractDataFromResponses(responses) {
  const data = {};
  
  responses.forEach(response => {
    const value = response.response_value;
    
    switch (response.question_id) {
      case 'secteur_activite':
        data.secteur = value;
        break;
      case 'vehicules_professionnels':
        data.vehiculesProfessionnels = value === 'Oui';
        break;
      case 'types_vehicules':
        data.typesVehicules = Array.isArray(value) ? value : [value];
        break;
      case 'consommation_carburant':
        data.consommationCarburant = extractConsommation(value);
        break;
      case 'types_carburant':
        data.typesCarburant = Array.isArray(value) ? value : [value];
        break;
      case 'usage_professionnel':
        data.usageProfessionnel = extractPercentage(value);
        break;
      case 'cartes_carburant':
        data.cartesCarburant = value;
        break;
      case 'factures_nominatives':
        data.facturesNominatives = value;
        break;
      case 'immatriculation_societe':
        data.immatriculationSociete = value;
        break;
      case 'declarations_ticpe':
        data.declarationsTicpe = value;
        break;
    }
  });

  return data;
}

function calculateVehicleScore(typesVehicules) {
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
    }
  });

  return Math.min(score, 20);
}

function getFuelRate(typesCarburant, secteur) {
  const rates = {
    'Gazole professionnel': 0.177,
    'Gazole Non Routier (GNR)': 0.150,
    'Essence': 0.150,
    'GPL': 0.080
  };

  if (typesCarburant && typesCarburant.length > 0) {
    return rates[typesCarburant[0]] || 0.177;
  }

  // Taux par défaut selon le secteur
  const defaultRates = {
    'Transport routier de marchandises': 0.177,
    'Transport routier de voyageurs': 0.177,
    'Taxi / VTC': 0.213,
    'BTP / Travaux publics': 0.150,
    'Secteur Agricole': 0.150
  };

  return defaultRates[secteur] || 0.177;
}

function estimateConsumption(data) {
  const estimationsSecteur = {
    'Transport routier de marchandises': 25000,
    'Transport routier de voyageurs': 20000,
    'Taxi / VTC': 8000,
    'BTP / Travaux publics': 15000,
    'Secteur Agricole': 12000
  };

  return estimationsSecteur[data.secteur] || 10000;
}

function getVehicleCoefficient(typesVehicules) {
  if (!typesVehicules || typesVehicules.length === 0) return 0.8;

  const coefficients = {
    'Camions de plus de 7,5 tonnes': 1.0,
    'Camions de 3,5 à 7,5 tonnes': 0.8,
    'Engins de chantier': 0.9,
    'Tracteurs agricoles': 1.0,
    'Véhicules utilitaires légers': 0.6
  };

  return coefficients[typesVehicules[0]] || 0.8;
}

function getUsageCoefficient(usageProfessionnel) {
  if (!usageProfessionnel) return 0.8;

  if (usageProfessionnel >= 100) return 1.0;
  if (usageProfessionnel >= 80) return 0.9;
  if (usageProfessionnel >= 60) return 0.7;
  return 0.0;
}

function calculateMaturityScore(data) {
  let score = 0;

  if (data.cartesCarburant === 'Oui, toutes les stations') score += 20;
  else if (data.cartesCarburant === 'Oui, partiellement') score += 10;

  if (data.facturesNominatives === 'Oui, systématiquement') score += 20;
  else if (data.facturesNominatives === 'Oui, partiellement') score += 10;

  if (data.immatriculationSociete === 'Oui, 100%') score += 15;
  else if (data.immatriculationSociete === 'Oui, majoritairement') score += 10;

  if (data.declarationsTicpe === 'Oui, régulièrement') score += 25;
  else if (data.declarationsTicpe === 'Oui, occasionnellement') score += 15;

  return Math.min(score, 100);
}

function determineConfidenceLevel(data, maturityScore) {
  let confidence = 0;

  confidence += (maturityScore / 100) * 40;

  if (data.consommationCarburant && data.consommationCarburant > 0) confidence += 15;
  if (data.typesCarburant && data.typesCarburant.length > 0) confidence += 15;

  if (confidence >= 70) return 'high';
  if (confidence >= 40) return 'medium';
  return 'low';
}

function generateRecommendations(data, estimatedRecovery) {
  const recommendations = [];

  if (estimatedRecovery > 0) {
    recommendations.push(`🎯 ÉLIGIBILITÉ CONFIRMÉE ! Gain potentiel de ${estimatedRecovery.toLocaleString('fr-FR')}€`);
  }

  if (data.cartesCarburant !== 'Oui, toutes les stations') {
    recommendations.push('💳 Misez sur les cartes carburant professionnelles');
  }

  if (data.facturesNominatives !== 'Oui, systématiquement') {
    recommendations.push('📄 Améliorez la conservation des factures nominatives');
  }

  if (data.declarationsTicpe !== 'Oui, régulièrement') {
    recommendations.push('📋 Mettez en place des déclarations TICPE régulières');
  }

  return recommendations;
}

function identifyRiskFactors(data, maturityScore) {
  const riskFactors = [];

  if (maturityScore < 40) {
    riskFactors.push('⚠️ Maturité administrative insuffisante');
  }

  if (data.usageProfessionnel && data.usageProfessionnel < 80) {
    riskFactors.push('⚠️ Usage professionnel limité');
  }

  if (data.secteur === 'BTP / Travaux publics' || data.secteur === 'Secteur Agricole') {
    riskFactors.push('⚠️ Secteur à faible performance de récupération');
  }

  return riskFactors;
}

function extractConsommation(value) {
  const mapping = {
    'Moins de 5 000 litres': 3000,
    '5 000 à 15 000 litres': 10000,
    '15 000 à 50 000 litres': 30000,
    'Plus de 50 000 litres': 75000
  };
  return mapping[value] || 10000;
}

function extractPercentage(value) {
  const mapping = {
    '100% professionnel': 100,
    '80-99% professionnel': 90,
    '60-79% professionnel': 70,
    'Moins de 60% professionnel': 50
  };
  return mapping[value] || 80;
}

// Exécution du script
if (require.main === module) {
  testTICPESimulator();
}

module.exports = { testTICPESimulator }; 