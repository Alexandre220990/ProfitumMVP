#!/usr/bin/env node

/**
 * 🧪 TEST DU CALCULATEUR AVEC DONNÉES RÉELLES
 * Tester le calculateur TICPE avec les vraies réponses de la base
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simuler le calculateur avancé
class AdvancedEligibilityCalculator {
  constructor() {
    // Taux TICPE 2024 (€/1000L)
    this.tauxCarburant = {
      'Gazole professionnel': 61.07,
      'Gazole Non Routier (GNR)': 61.07,
      'Essence': 68.29,
      'GPL': 15.42,
      'Électricité': 0
    };

    // Coefficients par type de véhicule
    this.coefficientsVehicules = {
      'Camions de plus de 7,5 tonnes': 1.0,
      'Camions de 3,5 à 7,5 tonnes': 0.8,
      'Véhicules utilitaires légers': 0.6,
      'Engins de chantier': 1.2,
      'Véhicules de service': 0.7,
      'Véhicules de fonction': 0.5,
      'Tracteurs agricoles': 0.9
    };

    // Estimations de consommation annuelle par véhicule (litres)
    this.estimationsConsommation = {
      'Moins de 5 000 litres': 3000,
      '5 000 à 15 000 litres': 10000,
      '15 000 à 50 000 litres': 32500,
      'Plus de 50 000 litres': 75000
    };
  }

  extractClientProfile(responses) {
    const profile = {};

    console.log('🔍 Extraction du profil - Réponses reçues:', responses.length);

    // Mapper les réponses aux champs du profil
    responses.forEach((response, index) => {
      console.log(`   ${index + 1}. Question ID: ${response.question_id}`);
      
      // Extraire la valeur de la réponse (gérer les arrays et les strings)
      let value = '';
      if (Array.isArray(response.response_value)) {
        value = response.response_value;
        console.log(`      - Format: array, Valeur: ${JSON.stringify(value)}`);
      } else if (typeof response.response_value === 'string') {
        value = response.response_value;
        console.log(`      - Format: string, Valeur: "${value}"`);
      } else if (typeof response.response_value === 'object' && response.response_value !== null) {
        // Si c'est un objet, essayer d'extraire la valeur
        value = Object.values(response.response_value).join(', ');
        console.log(`      - Format: object, Valeur extraite: "${value}"`);
      }

      // Convertir en string pour le traitement
      const valueStr = Array.isArray(value) ? value.join(', ') : value;
      
      // Mapping basé sur le contenu de la réponse (plus robuste)
      
      // Secteur d'activité
      if (valueStr?.includes('Transport') || valueStr?.includes('Logistique')) {
        if (valueStr?.includes('marchandises') || valueStr?.includes('Logistique')) {
          profile.secteur = 'Transport routier de marchandises';
        } else if (valueStr?.includes('voyageurs')) {
          profile.secteur = 'Transport routier de voyageurs';
        } else {
          profile.secteur = 'Transport routier de marchandises'; // Par défaut
        }
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (valueStr?.includes('BTP') || valueStr?.includes('Travaux')) {
        profile.secteur = 'BTP / Travaux publics';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (valueStr?.includes('Taxi') || valueStr?.includes('VTC')) {
        profile.secteur = 'Taxi / VTC';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (valueStr?.includes('Agricole')) {
        profile.secteur = 'Secteur Agricole';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      }

      // Véhicules professionnels
      if (valueStr?.includes('Oui') && (valueStr?.includes('véhicule') || valueStr?.includes('professionnel'))) {
        profile.vehiculesProfessionnels = 'Oui';
        console.log(`      → Véhicules professionnels: ${profile.vehiculesProfessionnels}`);
      }

      // Nombre de véhicules
      if (valueStr?.includes('1 à 3')) profile.nombreVehicules = '1 à 3 véhicules';
      else if (valueStr?.includes('4 à 10')) profile.nombreVehicules = '4 à 10 véhicules';
      else if (valueStr?.includes('11 à 25')) profile.nombreVehicules = '11 à 25 véhicules';
      else if (valueStr?.includes('Plus de 25')) profile.nombreVehicules = 'Plus de 25 véhicules';

      // Types de véhicules
      if (valueStr?.includes('Camion') && valueStr?.includes('7,5 tonnes')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de plus de 7,5 tonnes');
        console.log(`      → Type véhicule ajouté: Camions de plus de 7,5 tonnes`);
      }
      if (valueStr?.includes('Camion') && valueStr?.includes('3,5 à 7,5')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de 3,5 à 7,5 tonnes');
        console.log(`      → Type véhicule ajouté: Camions de 3,5 à 7,5 tonnes`);
      }
      if (valueStr?.includes('utilitaire') || valueStr?.includes('Utilitaire')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Véhicules utilitaires légers');
        console.log(`      → Type véhicule ajouté: Véhicules utilitaires légers`);
      }
      if (valueStr?.includes('engin') || valueStr?.includes('Engin')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Engins de chantier');
        console.log(`      → Type véhicule ajouté: Engins de chantier`);
      }
      if (valueStr?.includes('Tracteur') || valueStr?.includes('tracteur')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Tracteurs agricoles');
        console.log(`      → Type véhicule ajouté: Tracteurs agricoles`);
      }

      // Consommation carburant
      if (valueStr?.includes('Plus de 50 000')) {
        profile.consommationCarburant = 'Plus de 50 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (valueStr?.includes('15 000 à 50 000')) {
        profile.consommationCarburant = '15 000 à 50 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (valueStr?.includes('5 000 à 15 000')) {
        profile.consommationCarburant = '5 000 à 15 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (valueStr?.includes('Moins de 5 000')) {
        profile.consommationCarburant = 'Moins de 5 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      }

      // Types de carburant
      if (valueStr?.includes('Gazole') && !valueStr?.includes('Non Routier') && !valueStr?.includes('GNR')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole professionnel');
        console.log(`      → Carburant ajouté: Gazole professionnel`);
      }
      if (valueStr?.includes('GNR') || valueStr?.includes('Non Routier')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole Non Routier (GNR)');
        console.log(`      → Carburant ajouté: Gazole Non Routier (GNR)`);
      }
      if (valueStr?.includes('Essence')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Essence');
        console.log(`      → Carburant ajouté: Essence`);
      }

      // Factures carburant
      if (valueStr?.includes('3 dernières années complètes')) {
        profile.facturesCarburant = 'Oui, 3 dernières années complètes';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      } else if (valueStr?.includes('2 dernières années')) {
        profile.facturesCarburant = 'Oui, 2 dernières années';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      } else if (valueStr?.includes('1 dernière année')) {
        profile.facturesCarburant = 'Oui, 1 dernière année';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      } else if (valueStr?.includes('Partiellement')) {
        profile.facturesCarburant = 'Partiellement';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      }

      // Usage professionnel
      if (valueStr?.includes('100% professionnel')) {
        profile.usageProfessionnel = '100% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      } else if (valueStr?.includes('80-99%')) {
        profile.usageProfessionnel = '80-99% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      } else if (valueStr?.includes('60-79%')) {
        profile.usageProfessionnel = '60-79% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      }

      // Cartes carburant
      if (valueStr?.includes('toutes les stations')) {
        profile.cartesCarburant = 'Oui, toutes les stations';
        console.log(`      → Cartes carburant: ${profile.cartesCarburant}`);
      } else if (valueStr?.includes('partiellement')) {
        profile.cartesCarburant = 'Oui, partiellement';
        console.log(`      → Cartes carburant: ${profile.cartesCarburant}`);
      } else if (valueStr?.includes('Non')) {
        profile.cartesCarburant = 'Non';
        console.log(`      → Cartes carburant: ${profile.cartesCarburant}`);
      }

      // Factures nominatives
      if (valueStr?.includes('systématiquement')) {
        profile.facturesNominatives = 'Oui, systématiquement';
        console.log(`      → Factures nominatives: ${profile.facturesNominatives}`);
      } else if (valueStr?.includes('partiellement')) {
        profile.facturesNominatives = 'Oui, partiellement';
        console.log(`      → Factures nominatives: ${profile.facturesNominatives}`);
      }

      // Immatriculation société
      if (valueStr?.includes('100%')) {
        profile.immatriculationSociete = 'Oui, 100%';
        console.log(`      → Immatriculation société: ${profile.immatriculationSociete}`);
      } else if (valueStr?.includes('majoritairement')) {
        profile.immatriculationSociete = 'Oui, majoritairement';
        console.log(`      → Immatriculation société: ${profile.immatriculationSociete}`);
      }

      // Déclarations TICPE
      if (valueStr?.includes('régulièrement')) {
        profile.declarationsTicpe = 'Oui, régulièrement';
        console.log(`      → Déclarations TICPE: ${profile.declarationsTicpe}`);
      } else if (valueStr?.includes('occasionnellement')) {
        profile.declarationsTicpe = 'Oui, occasionnellement';
        console.log(`      → Déclarations TICPE: ${profile.declarationsTicpe}`);
      }

      // Chiffre d'affaires
      if (valueStr?.includes('Plus de 5 000 000€')) {
        profile.chiffreAffaires = 'Plus de 5 000 000€';
      } else if (valueStr?.includes('1 000 000€ - 5 000 000€')) {
        profile.chiffreAffaires = '1 000 000€ - 5 000 000€';
      } else if (valueStr?.includes('500 000€ - 1 000 000€')) {
        profile.chiffreAffaires = '500 000€ - 1 000 000€';
      } else if (valueStr?.includes('100 000€ - 500 000€')) {
        profile.chiffreAffaires = '100 000€ - 500 000€';
      } else if (valueStr?.includes('Moins de 100 000€')) {
        profile.chiffreAffaires = 'Moins de 100 000€';
      }
    });

    // MÉTHODE OPTIMALE :
    // Si la détection classique n'a pas trouvé, on déduit la présence de véhicules professionnels
    if (!profile.vehiculesProfessionnels || profile.vehiculesProfessionnels !== 'Oui') {
      if (
        (profile.nombreVehicules && typeof profile.nombreVehicules === 'string' && !profile.nombreVehicules.includes('0')) ||
        (profile.typesVehicules && Array.isArray(profile.typesVehicules) && profile.typesVehicules.length > 0)
      ) {
        profile.vehiculesProfessionnels = 'Oui';
      }
    }

    console.log('📊 Profil final extrait:', profile);
    return profile;
  }

  calculateTICPESavings(responses) {
    console.log('🚛 Calcul des économies TICPE...');
    
    const profile = this.extractClientProfile(responses);
    
    // Vérifications d'éligibilité
    if (!profile.vehiculesProfessionnels || profile.vehiculesProfessionnels !== 'Oui') {
      console.log('❌ Pas de véhicules professionnels');
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    if (!profile.typesCarburant || profile.typesCarburant.length === 0) {
      console.log('❌ Pas de types de carburant détectés');
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    if (!profile.consommationCarburant) {
      console.log('❌ Pas de consommation carburant détectée');
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    // Calculs
    const consommationAnnuelle = this.estimationsConsommation[profile.consommationCarburant] || 0;
    const tauxCarburant = this.getFuelRate(profile.typesCarburant, profile.secteur);
    const coefficientVehicule = this.getVehicleCoefficient(profile.typesVehicules || []);
    
    // Calcul de base
    let economieBase = (consommationAnnuelle / 1000) * tauxCarburant * coefficientVehicule;
    
    // Coefficients selon le profil
    let coefficientProfil = 1.0;
    
    // Factures carburant
    if (profile.facturesCarburant === 'Oui, 3 dernières années complètes') {
      coefficientProfil *= 1.2;
    } else if (profile.facturesCarburant === 'Oui, 2 dernières années') {
      coefficientProfil *= 1.1;
    } else if (profile.facturesCarburant === 'Partiellement') {
      coefficientProfil *= 0.8;
    }

    // Usage professionnel
    if (profile.usageProfessionnel === '100% professionnel') {
      coefficientProfil *= 1.0;
    } else if (profile.usageProfessionnel === '80-99% professionnel') {
      coefficientProfil *= 0.9;
    } else if (profile.usageProfessionnel === '60-79% professionnel') {
      coefficientProfil *= 0.7;
    }

    // Cartes carburant
    if (profile.cartesCarburant === 'Oui, toutes les stations') {
      coefficientProfil *= 1.1;
    } else if (profile.cartesCarburant === 'Non') {
      coefficientProfil *= 0.9;
    }

    // Factures nominatives
    if (profile.facturesNominatives === 'Oui, systématiquement') {
      coefficientProfil *= 1.1;
    } else if (profile.facturesNominatives === 'Non') {
      coefficientProfil *= 0.8;
    }

    // Immatriculation société
    if (profile.immatriculationSociete === 'Oui, 100%') {
      coefficientProfil *= 1.0;
    } else if (profile.immatriculationSociete === 'Non') {
      coefficientProfil *= 0.7;
    }

    // Déclarations TICPE
    if (profile.declarationsTicpe === 'Oui, régulièrement') {
      coefficientProfil *= 0.9; // Déjà optimisé
    } else if (profile.declarationsTicpe === 'Non') {
      coefficientProfil *= 1.2; // Plus d'opportunités
    }

    const economieFinale = economieBase * coefficientProfil;
    
    // Score d'éligibilité
    let score = 0;
    if (economieFinale > 0) score += 20;
    if (profile.facturesCarburant?.includes('3 dernières années')) score += 20;
    if (profile.usageProfessionnel === '100% professionnel') score += 15;
    if (profile.cartesCarburant === 'Oui, toutes les stations') score += 10;
    if (profile.facturesNominatives === 'Oui, systématiquement') score += 10;
    if (profile.immatriculationSociete === 'Oui, 100%') score += 10;
    if (profile.declarationsTicpe === 'Non') score += 15;

    // Niveau de confiance
    let confidence = 'faible';
    if (score >= 80) confidence = 'élevé';
    else if (score >= 60) confidence = 'moyen';
    else if (score >= 40) confidence = 'modéré';

    console.log('📊 Résultats TICPE:');
    console.log(`   - Consommation annuelle: ${consommationAnnuelle}L`);
    console.log(`   - Taux carburant: ${tauxCarburant}€/1000L`);
    console.log(`   - Coefficient véhicule: ${coefficientVehicule}`);
    console.log(`   - Coefficient profil: ${coefficientProfil}`);
    console.log(`   - Économie de base: ${economieBase.toFixed(2)}€`);
    console.log(`   - Économie finale: ${economieFinale.toFixed(2)}€`);
    console.log(`   - Score: ${score}%`);
    console.log(`   - Confiance: ${confidence}`);

    return {
      savings: Math.round(economieFinale),
      score: Math.min(score, 100),
      confidence
    };
  }

  getFuelRate(typesCarburant, secteur) {
    // Taux moyen pondéré
    let tauxTotal = 0;
    let poidsTotal = 0;

    typesCarburant.forEach(type => {
      const taux = this.tauxCarburant[type] || 0;
      const poids = type.includes('Gazole') ? 0.7 : 0.3; // Gazole plus utilisé
      tauxTotal += taux * poids;
      poidsTotal += poids;
    });

    return poidsTotal > 0 ? tauxTotal / poidsTotal : 61.07; // Taux gazole par défaut
  }

  getVehicleCoefficient(typesVehicules) {
    if (typesVehicules.length === 0) return 0.8; // Valeur par défaut

    // Coefficient moyen pondéré
    let coefficientTotal = 0;
    typesVehicules.forEach(type => {
      coefficientTotal += this.coefficientsVehicules[type] || 0.8;
    });

    return coefficientTotal / typesVehicules.length;
  }
}

async function testCalculatorWithRealData() {
  console.log('🧪 TEST DU CALCULATEUR AVEC DONNÉES RÉELLES');
  console.log('=' .repeat(60));

  try {
    // Récupérer la session la plus récente
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Erreur récupération session:', sessionsError);
      return;
    }

    const session = sessions[0];
    console.log(`📊 Session testée: ${session.session_token}`);

    // Récupérer les réponses
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('❌ Erreur récupération réponses:', responsesError);
      return;
    }

    console.log(`✅ ${responses.length} réponses récupérées`);

    // Tester le calculateur
    const calculator = new AdvancedEligibilityCalculator();
    const result = calculator.calculateTICPESavings(responses);

    console.log('\n🎯 RÉSULTAT FINAL:');
    console.log('─'.repeat(40));
    console.log(`💰 Économies estimées: ${result.savings}€`);
    console.log(`📊 Score d'éligibilité: ${result.score}%`);
    console.log(`🎯 Niveau de confiance: ${result.confidence}`);

    // Comparer avec les résultats en base
    const { data: eligibility, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id)
      .eq('produit_id', 'TICPE')
      .single();

    if (!eligibilityError && eligibility) {
      console.log('\n📋 COMPARAISON AVEC LA BASE:');
      console.log('─'.repeat(40));
      console.log(`Base de données:`);
      console.log(`   - Score: ${eligibility.eligibility_score}%`);
      console.log(`   - Économies: ${eligibility.estimated_savings}€`);
      console.log(`   - Confiance: ${eligibility.confidence_level}`);
      
      console.log(`\nCalculateur local:`);
      console.log(`   - Score: ${result.score}%`);
      console.log(`   - Économies: ${result.savings}€`);
      console.log(`   - Confiance: ${result.confidence}`);
      
      if (eligibility.estimated_savings === 0 && result.savings > 0) {
        console.log('\n✅ SUCCÈS: Le calculateur local trouve des économies !');
        console.log('🔧 Le problème était dans le mapping des réponses.');
      } else {
        console.log('\n⚠️ Le calculateur local et la base donnent des résultats similaires.');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  testCalculatorWithRealData().catch(console.error);
}

module.exports = { testCalculatorWithRealData }; 