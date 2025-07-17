#!/usr/bin/env node

/**
 * 🔄 MIGRATION DES RÉSULTATS DU SIMULATEUR VERS CLIENTPRODUITELIGIBLE
 * Migrer les résultats TemporaryEligibility vers ClientProduitEligible avec les bons montants
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculateur avancé (copie de celui du simulateur)
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

    responses.forEach((response, index) => {
      // Extraire la valeur de la réponse
      let value = '';
      if (Array.isArray(response.response_value)) {
        value = response.response_value;
      } else if (typeof response.response_value === 'string') {
        value = response.response_value;
      } else if (typeof response.response_value === 'object' && response.response_value !== null) {
        value = Object.values(response.response_value).join(', ');
      }

      const valueStr = Array.isArray(value) ? value.join(', ') : value;
      
      // Mapping des réponses
      if (valueStr?.includes('Transport') || valueStr?.includes('Logistique')) {
        if (valueStr?.includes('marchandises') || valueStr?.includes('Logistique')) {
          profile.secteur = 'Transport routier de marchandises';
        } else if (valueStr?.includes('voyageurs')) {
          profile.secteur = 'Transport routier de voyageurs';
        } else {
          profile.secteur = 'Transport routier de marchandises';
        }
      } else if (valueStr?.includes('BTP') || valueStr?.includes('Travaux')) {
        profile.secteur = 'BTP / Travaux publics';
      } else if (valueStr?.includes('Taxi') || valueStr?.includes('VTC')) {
        profile.secteur = 'Taxi / VTC';
      } else if (valueStr?.includes('Agricole')) {
        profile.secteur = 'Secteur Agricole';
      }

      if (valueStr?.includes('Oui') && (valueStr?.includes('véhicule') || valueStr?.includes('professionnel'))) {
        profile.vehiculesProfessionnels = 'Oui';
      }

      if (valueStr?.includes('1 à 3')) profile.nombreVehicules = '1 à 3 véhicules';
      else if (valueStr?.includes('4 à 10')) profile.nombreVehicules = '4 à 10 véhicules';
      else if (valueStr?.includes('11 à 25')) profile.nombreVehicules = '11 à 25 véhicules';
      else if (valueStr?.includes('Plus de 25')) profile.nombreVehicules = 'Plus de 25 véhicules';

      if (valueStr?.includes('Camion') && valueStr?.includes('7,5 tonnes')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de plus de 7,5 tonnes');
      }
      if (valueStr?.includes('Camion') && valueStr?.includes('3,5 à 7,5')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de 3,5 à 7,5 tonnes');
      }
      if (valueStr?.includes('utilitaire') || valueStr?.includes('Utilitaire')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Véhicules utilitaires légers');
      }
      if (valueStr?.includes('engin') || valueStr?.includes('Engin')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Engins de chantier');
      }
      if (valueStr?.includes('Tracteur') || valueStr?.includes('tracteur')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Tracteurs agricoles');
      }

      if (valueStr?.includes('Plus de 50 000')) {
        profile.consommationCarburant = 'Plus de 50 000 litres';
      } else if (valueStr?.includes('15 000 à 50 000')) {
        profile.consommationCarburant = '15 000 à 50 000 litres';
      } else if (valueStr?.includes('5 000 à 15 000')) {
        profile.consommationCarburant = '5 000 à 15 000 litres';
      } else if (valueStr?.includes('Moins de 5 000')) {
        profile.consommationCarburant = 'Moins de 5 000 litres';
      }

      if (valueStr?.includes('Gazole') && !valueStr?.includes('Non Routier') && !valueStr?.includes('GNR')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole professionnel');
      }
      if (valueStr?.includes('GNR') || valueStr?.includes('Non Routier')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole Non Routier (GNR)');
      }
      if (valueStr?.includes('Essence')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Essence');
      }

      if (valueStr?.includes('3 dernières années complètes')) {
        profile.facturesCarburant = 'Oui, 3 dernières années complètes';
      } else if (valueStr?.includes('2 dernières années')) {
        profile.facturesCarburant = 'Oui, 2 dernières années';
      } else if (valueStr?.includes('1 dernière année')) {
        profile.facturesCarburant = 'Oui, 1 dernière année';
      } else if (valueStr?.includes('Partiellement')) {
        profile.facturesCarburant = 'Partiellement';
      }

      if (valueStr?.includes('100% professionnel')) {
        profile.usageProfessionnel = '100% professionnel';
      } else if (valueStr?.includes('80-99%')) {
        profile.usageProfessionnel = '80-99% professionnel';
      } else if (valueStr?.includes('60-79%')) {
        profile.usageProfessionnel = '60-79% professionnel';
      }

      if (valueStr?.includes('toutes les stations')) {
        profile.cartesCarburant = 'Oui, toutes les stations';
      } else if (valueStr?.includes('partiellement')) {
        profile.cartesCarburant = 'Oui, partiellement';
      } else if (valueStr?.includes('Non')) {
        profile.cartesCarburant = 'Non';
      }

      if (valueStr?.includes('systématiquement')) {
        profile.facturesNominatives = 'Oui, systématiquement';
      } else if (valueStr?.includes('partiellement')) {
        profile.facturesNominatives = 'Oui, partiellement';
      }

      if (valueStr?.includes('100%')) {
        profile.immatriculationSociete = 'Oui, 100%';
      } else if (valueStr?.includes('majoritairement')) {
        profile.immatriculationSociete = 'Oui, majoritairement';
      }

      if (valueStr?.includes('régulièrement')) {
        profile.declarationsTicpe = 'Oui, régulièrement';
      } else if (valueStr?.includes('occasionnellement')) {
        profile.declarationsTicpe = 'Oui, occasionnellement';
      }

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

    // MÉTHODE OPTIMALE : Déduire la présence de véhicules professionnels
    if (!profile.vehiculesProfessionnels || profile.vehiculesProfessionnels !== 'Oui') {
      if (
        (profile.nombreVehicules && typeof profile.nombreVehicules === 'string' && !profile.nombreVehicules.includes('0')) ||
        (profile.typesVehicules && Array.isArray(profile.typesVehicules) && profile.typesVehicules.length > 0)
      ) {
        profile.vehiculesProfessionnels = 'Oui';
      }
    }

    return profile;
  }

  calculateTICPESavings(responses) {
    const profile = this.extractClientProfile(responses);
    
    if (!profile.vehiculesProfessionnels || profile.vehiculesProfessionnels !== 'Oui') {
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    if (!profile.typesCarburant || profile.typesCarburant.length === 0) {
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    if (!profile.consommationCarburant) {
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    const consommationAnnuelle = this.estimationsConsommation[profile.consommationCarburant] || 0;
    const tauxCarburant = this.getFuelRate(profile.typesCarburant, profile.secteur);
    const coefficientVehicule = this.getVehicleCoefficient(profile.typesVehicules || []);
    
    let economieBase = (consommationAnnuelle / 1000) * tauxCarburant * coefficientVehicule;
    let coefficientProfil = 1.0;
    
    if (profile.facturesCarburant === 'Oui, 3 dernières années complètes') {
      coefficientProfil *= 1.2;
    } else if (profile.facturesCarburant === 'Oui, 2 dernières années') {
      coefficientProfil *= 1.1;
    } else if (profile.facturesCarburant === 'Partiellement') {
      coefficientProfil *= 0.8;
    }

    if (profile.usageProfessionnel === '100% professionnel') {
      coefficientProfil *= 1.0;
    } else if (profile.usageProfessionnel === '80-99% professionnel') {
      coefficientProfil *= 0.9;
    } else if (profile.usageProfessionnel === '60-79% professionnel') {
      coefficientProfil *= 0.7;
    }

    if (profile.cartesCarburant === 'Oui, toutes les stations') {
      coefficientProfil *= 1.1;
    } else if (profile.cartesCarburant === 'Non') {
      coefficientProfil *= 0.9;
    }

    if (profile.facturesNominatives === 'Oui, systématiquement') {
      coefficientProfil *= 1.1;
    } else if (profile.facturesNominatives === 'Non') {
      coefficientProfil *= 0.8;
    }

    if (profile.immatriculationSociete === 'Oui, 100%') {
      coefficientProfil *= 1.0;
    } else if (profile.immatriculationSociete === 'Non') {
      coefficientProfil *= 0.7;
    }

    if (profile.declarationsTicpe === 'Oui, régulièrement') {
      coefficientProfil *= 0.9;
    } else if (profile.declarationsTicpe === 'Non') {
      coefficientProfil *= 1.2;
    }

    const economieFinale = economieBase * coefficientProfil;
    
    let score = 0;
    if (economieFinale > 0) score += 20;
    if (profile.facturesCarburant?.includes('3 dernières années')) score += 20;
    if (profile.usageProfessionnel === '100% professionnel') score += 15;
    if (profile.cartesCarburant === 'Oui, toutes les stations') score += 10;
    if (profile.facturesNominatives === 'Oui, systématiquement') score += 10;
    if (profile.immatriculationSociete === 'Oui, 100%') score += 10;
    if (profile.declarationsTicpe === 'Non') score += 15;

    let confidence = 'faible';
    if (score >= 80) confidence = 'élevé';
    else if (score >= 60) confidence = 'moyen';
    else if (score >= 40) confidence = 'modéré';

    return {
      savings: Math.round(economieFinale),
      score: Math.min(score, 100),
      confidence
    };
  }

  getFuelRate(typesCarburant, secteur) {
    let tauxTotal = 0;
    let poidsTotal = 0;

    typesCarburant.forEach(type => {
      const taux = this.tauxCarburant[type] || 0;
      const poids = type.includes('Gazole') ? 0.7 : 0.3;
      tauxTotal += taux * poids;
      poidsTotal += poids;
    });

    return poidsTotal > 0 ? tauxTotal / poidsTotal : 61.07;
  }

  getVehicleCoefficient(typesVehicules) {
    if (typesVehicules.length === 0) return 0.8;

    let coefficientTotal = 0;
    typesVehicules.forEach(type => {
      coefficientTotal += this.coefficientsVehicules[type] || 0.8;
    });

    return coefficientTotal / typesVehicules.length;
  }
}

async function migrateSimulatorResults() {
  console.log('🔄 MIGRATION DES RÉSULTATS DU SIMULATEUR');
  console.log('=' .repeat(60));

  try {
    // Récupérer toutes les sessions complétées avec des résultats
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select(`
        *,
        TemporaryEligibility (
          produit_id,
          eligibility_score,
          estimated_savings,
          confidence_level,
          recommendations
        )
      `)
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    console.log(`✅ ${sessions.length} sessions complétées trouvées`);

    const calculator = new AdvancedEligibilityCalculator();
    let migratedCount = 0;
    let updatedCount = 0;

    for (const session of sessions) {
      console.log(`\n📊 Traitement session: ${session.session_token}`);

      // Récupérer les réponses de cette session
      const { data: responses, error: responsesError } = await supabase
        .from('TemporaryResponse')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (responsesError || !responses) {
        console.log(`⚠️ Pas de réponses pour cette session`);
        continue;
      }

      // Récupérer ou créer le client permanent directement
      let clientId = null;
      
      // Chercher d'abord un client existant avec le même email (généré à partir du session_token)
      const generatedEmail = `simulateur_${session.session_token.substring(0, 8)}@example.com`;
      
      const { data: existingClient, error: existingError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', generatedEmail)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
        console.log(`   → Client existant trouvé: ${clientId}`);
      } else {
        // Créer un nouveau client avec des données générées
        const { data: newClient, error: newClientError } = await supabase
          .from('clients')
          .insert({
            email: generatedEmail,
            username: `Client_${session.session_token.substring(0, 8)}`,
            company_name: `Entreprise_${session.session_token.substring(0, 8)}`,
            phone_number: '01 23 45 67 89',
            address: '123 Rue du Commerce',
            city: 'Paris',
            postal_code: '75001',
            siren: '123456789',
            statut: 'Actif',
            revenuannuel: 1000000,
            secteuractivite: 'Transport',
            nombreemployes: 25,
            ancienneteentreprise: 5
          })
          .select('id')
          .single();

        if (newClientError) {
          console.log(`❌ Erreur création client: ${newClientError.message}`);
          continue;
        }

        clientId = newClient.id;
        console.log(`   → Nouveau client créé: ${clientId}`);
      }

      // Traiter chaque produit éligible
      for (const eligibility of session.TemporaryEligibility || []) {
        console.log(`   🎯 Traitement produit: ${eligibility.produit_id}`);

        // Recalculer avec le calculateur avancé
        let recalculatedResult = null;
        
        if (eligibility.produit_id === 'TICPE') {
          recalculatedResult = calculator.calculateTICPESavings(responses);
        } else {
          // Pour les autres produits, utiliser les valeurs existantes
          recalculatedResult = {
            savings: eligibility.estimated_savings || 0,
            score: eligibility.eligibility_score || 0,
            confidence: eligibility.confidence_level || 'faible'
          };
        }

        // Vérifier si l'éligibilité existe déjà
        const { data: existingEligibility, error: existingEligError } = await supabase
          .from('ClientProduitEligible')
          .select('id')
          .eq('clientId', clientId)
          .eq('produitId', eligibility.produit_id)
          .single();

        const eligibilityData = {
          clientId: clientId,
          produitId: eligibility.produit_id,
          statut: recalculatedResult.score >= 50 ? 'eligible' : 'non_eligible',
          tauxFinal: recalculatedResult.score / 100,
          montantFinal: recalculatedResult.savings,
          dureeFinale: 12, // 12 mois par défaut
          simulationId: session.id,
          metadata: {
            confidence_level: recalculatedResult.confidence,
            recommendations: eligibility.recommendations || [],
            session_token: session.session_token,
            calculated_at: new Date().toISOString()
          },
          notes: `Migration depuis simulateur - Score: ${recalculatedResult.score}%, Confiance: ${recalculatedResult.confidence}`,
          priorite: recalculatedResult.score >= 80 ? 1 : recalculatedResult.score >= 60 ? 2 : 3,
          dateEligibilite: new Date().toISOString(),
          current_step: 0,
          progress: 0
        };

        if (existingEligibility) {
          // Mettre à jour l'éligibilité existante
          const { error: updateError } = await supabase
            .from('ClientProduitEligible')
            .update(eligibilityData)
            .eq('id', existingEligibility.id);

          if (updateError) {
            console.log(`❌ Erreur mise à jour: ${updateError.message}`);
          } else {
            updatedCount++;
            console.log(`   ✅ Éligibilité mise à jour - Montant: ${recalculatedResult.savings}€`);
          }
        } else {
          // Créer une nouvelle éligibilité
          const { error: insertError } = await supabase
            .from('ClientProduitEligible')
            .insert(eligibilityData);

          if (insertError) {
            console.log(`❌ Erreur création: ${insertError.message}`);
          } else {
            migratedCount++;
            console.log(`   ✅ Nouvelle éligibilité créée - Montant: ${recalculatedResult.savings}€`);
          }
        }
      }
    }

    console.log('\n🎯 RÉSUMÉ DE LA MIGRATION:');
    console.log('─'.repeat(40));
    console.log(`📊 Sessions traitées: ${sessions.length}`);
    console.log(`🆕 Nouvelles éligibilités créées: ${migratedCount}`);
    console.log(`🔄 Éligibilités mises à jour: ${updatedCount}`);
    console.log(`✅ Migration terminée avec succès !`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  migrateSimulatorResults().catch(console.error);
}

module.exports = { migrateSimulatorResults }; 