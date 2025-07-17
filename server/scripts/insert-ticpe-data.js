const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function insertTICPEData() {
  console.log('🚀 Insertion des données TICPE optimisées...\n');

  try {
    // 1. Insertion des secteurs d'activité
    console.log('1️⃣ Insertion des secteurs d\'activité...');
    const sectors = [
      {
        sector_name: 'Transport routier de marchandises',
        sector_code: 'TRM',
        eligibility_clarity: 5,
        documentation_quality: 5,
        recovery_rate: 5,
        performance_score: 5,
        description: 'Transport de marchandises avec véhicules > 7,5 tonnes',
        advantages: [
          'Entreprises bien structurées administrativement',
          'Utilisation fréquente de cartes carburant professionnelles',
          'Déclarations semestrielles ou automatisées'
        ],
        challenges: []
      },
      {
        sector_name: 'Transport routier de voyageurs',
        sector_code: 'TRV',
        eligibility_clarity: 5,
        documentation_quality: 5,
        recovery_rate: 5,
        performance_score: 5,
        description: 'Transport de voyageurs avec autocars et lignes',
        advantages: [
          'Majoritairement des sociétés structurées',
          'Forte traçabilité des pleins et des usages',
          'Parfois publiques (DSP)'
        ],
        challenges: []
      },
      {
        sector_name: 'Taxi / VTC',
        sector_code: 'TAXI_VTC',
        eligibility_clarity: 5,
        documentation_quality: 4,
        recovery_rate: 4,
        performance_score: 4,
        description: 'Transport de personnes avec véhicules affectés exclusivement',
        advantages: [
          'Simplicité des volumes',
          'Cartes carburant = preuve d\'achat + preuve d\'usage pro'
        ],
        challenges: [
          'Si paiements en espèces ou CB non pro : pertes fréquentes'
        ]
      },
      {
        sector_name: 'Secteur Agricole',
        sector_code: 'AGRICULTURE',
        eligibility_clarity: 3,
        documentation_quality: 3,
        recovery_rate: 3,
        performance_score: 3,
        description: 'Agriculture avec tracteurs et engins utilisant du GNR',
        advantages: [
          'Très bon potentiel de récupération (gros volumes)'
        ],
        challenges: [
          'Documents parfois mal conservés',
          'Absence de comptabilité carburant rigoureuse',
          'Difficulté à distinguer les usages privés/pro',
          'Agriculteurs peu informés sur la procédure'
        ]
      },
      {
        sector_name: 'BTP / Travaux publics',
        sector_code: 'BTP',
        eligibility_clarity: 3,
        documentation_quality: 2,
        recovery_rate: 2,
        performance_score: 2,
        description: 'BTP avec engins de chantier utilisant du GNR',
        advantages: [
          'Très bons montants potentiels (>10 000€/an)'
        ],
        challenges: [
          'Manque de centralisation des factures',
          'Plusieurs fournisseurs (dépôt, cuves, stations) = complexité',
          'Confusion fréquente entre GNR et gazole routier',
          'Faible automatisation'
        ]
      }
    ];

    for (const sector of sectors) {
      const { error } = await supabase
        .from('TICPESectors')
        .upsert(sector, { onConflict: 'sector_code' });
      
      if (error) {
        console.log(`⚠️ Erreur secteur ${sector.sector_code}: ${error.message}`);
      } else {
        console.log(`✅ Secteur ${sector.sector_code} inséré`);
      }
    }

    // 2. Insertion des taux de carburant
    console.log('\n2️⃣ Insertion des taux de carburant...');
    const rates = [
      {
        fuel_type: 'Gazole professionnel',
        fuel_code: 'GAZOLE_PRO',
        rate_2024: 0.177,
        rate_2023: 0.175,
        rate_2022: 0.173,
        description: 'Gazole routier pour véhicules professionnels',
        eligibility_conditions: 'Véhicules > 7,5 tonnes, usage professionnel'
      },
      {
        fuel_type: 'Gazole Non Routier (GNR)',
        fuel_code: 'GNR',
        rate_2024: 0.150,
        rate_2023: 0.148,
        rate_2022: 0.146,
        description: 'Gazole pour engins non routiers',
        eligibility_conditions: 'Engins agricoles, BTP, usage professionnel'
      },
      {
        fuel_type: 'Essence',
        fuel_code: 'ESSENCE',
        rate_2024: 0.150,
        rate_2023: 0.148,
        rate_2022: 0.146,
        description: 'Essence pour véhicules professionnels',
        eligibility_conditions: 'Véhicules affectés exclusivement à l\'activité'
      },
      {
        fuel_type: 'GPL',
        fuel_code: 'GPL',
        rate_2024: 0.080,
        rate_2023: 0.079,
        rate_2022: 0.078,
        description: 'Gaz de pétrole liquéfié',
        eligibility_conditions: 'Véhicules équipés GPL, usage professionnel'
      }
    ];

    for (const rate of rates) {
      const { error } = await supabase
        .from('TICPERates')
        .upsert(rate, { onConflict: 'fuel_code' });
      
      if (error) {
        console.log(`⚠️ Erreur taux ${rate.fuel_code}: ${error.message}`);
      } else {
        console.log(`✅ Taux ${rate.fuel_code} inséré`);
      }
    }

    // 3. Insertion des types de véhicules
    console.log('\n3️⃣ Insertion des types de véhicules...');
    const vehicleTypes = [
      {
        vehicle_type: 'Camions de plus de 7,5 tonnes',
        vehicle_code: 'CAMION_7_5T_PLUS',
        weight_min: 7.5,
        weight_max: null,
        eligibility_coefficient: 1.0,
        description: 'Véhicules lourds pour transport de marchandises',
        usage_conditions: 'Usage professionnel routier',
        documentation_requirements: [
          'Carte grise avec PTAC > 7,5 tonnes',
          'Chronotachygraphe obligatoire',
          'Factures carburant nominatives'
        ]
      },
      {
        vehicle_type: 'Camions de 3,5 à 7,5 tonnes',
        vehicle_code: 'CAMION_3_5_7_5T',
        weight_min: 3.5,
        weight_max: 7.5,
        eligibility_coefficient: 0.8,
        description: 'Véhicules moyens pour transport',
        usage_conditions: 'Usage professionnel routier',
        documentation_requirements: [
          'Carte grise avec PTAC entre 3,5 et 7,5 tonnes',
          'Factures carburant nominatives'
        ]
      },
      {
        vehicle_type: 'Véhicules utilitaires légers',
        vehicle_code: 'VUL',
        weight_min: 0,
        weight_max: 3.5,
        eligibility_coefficient: 0.6,
        description: 'Véhicules utilitaires légers',
        usage_conditions: 'Usage professionnel exclusif',
        documentation_requirements: [
          'Carte grise VUL',
          'Factures carburant nominatives',
          'Preuve d\'usage professionnel'
        ]
      },
      {
        vehicle_type: 'Engins de chantier',
        vehicle_code: 'ENGINS_CHANTIER',
        weight_min: 0,
        weight_max: null,
        eligibility_coefficient: 0.9,
        description: 'Engins non routiers pour BTP',
        usage_conditions: 'Usage professionnel sur chantier',
        documentation_requirements: [
          'Certificat d\'immatriculation',
          'Factures GNR',
          'Attestation d\'usage professionnel'
        ]
      },
      {
        vehicle_type: 'Tracteurs agricoles',
        vehicle_code: 'TRACTEURS_AGRICOLE',
        weight_min: 0,
        weight_max: null,
        eligibility_coefficient: 1.0,
        description: 'Tracteurs et engins agricoles',
        usage_conditions: 'Usage agricole professionnel',
        documentation_requirements: [
          'Certificat d\'immatriculation',
          'Factures GNR',
          'Attestation d\'usage agricole'
        ]
      }
    ];

    for (const vehicle of vehicleTypes) {
      const { error } = await supabase
        .from('TICPEVehicleTypes')
        .upsert(vehicle, { onConflict: 'vehicle_code' });
      
      if (error) {
        console.log(`⚠️ Erreur véhicule ${vehicle.vehicle_code}: ${error.message}`);
      } else {
        console.log(`✅ Véhicule ${vehicle.vehicle_code} inséré`);
      }
    }

    // 4. Insertion des scénarios d'usage
    console.log('\n4️⃣ Insertion des scénarios d\'usage...');
    const usageScenarios = [
      {
        scenario_name: 'Usage 100% professionnel',
        professional_percentage_min: 100,
        professional_percentage_max: 100,
        coefficient: 1.0,
        description: 'Véhicule utilisé exclusivement à des fins professionnelles',
        conditions: [
          'Aucun usage privé',
          'Documentation complète',
          'Traçabilité parfaite'
        ]
      },
      {
        scenario_name: 'Usage 80-99% professionnel',
        professional_percentage_min: 80,
        professional_percentage_max: 99,
        coefficient: 0.9,
        description: 'Usage majoritairement professionnel',
        conditions: [
          'Usage privé limité',
          'Documentation majoritairement complète',
          'Traçabilité bonne'
        ]
      },
      {
        scenario_name: 'Usage 60-79% professionnel',
        professional_percentage_min: 60,
        professional_percentage_max: 79,
        coefficient: 0.7,
        description: 'Usage professionnel significatif',
        conditions: [
          'Usage privé notable',
          'Documentation partielle',
          'Traçabilité moyenne'
        ]
      },
      {
        scenario_name: 'Usage moins de 60% professionnel',
        professional_percentage_min: 0,
        professional_percentage_max: 59,
        coefficient: 0.0,
        description: 'Usage majoritairement privé',
        conditions: [
          'Usage privé majoritaire',
          'Non éligible à la récupération TICPE'
        ]
      }
    ];

    for (const scenario of usageScenarios) {
      const { error } = await supabase
        .from('TICPEUsageScenarios')
        .upsert(scenario, { onConflict: 'scenario_name' });
      
      if (error) {
        console.log(`⚠️ Erreur scénario ${scenario.scenario_name}: ${error.message}`);
      } else {
        console.log(`✅ Scénario ${scenario.scenario_name} inséré`);
      }
    }

    // 5. Insertion des benchmarks
    console.log('\n5️⃣ Insertion des benchmarks...');
    
    // Récupérer les IDs des secteurs
    const { data: sectorData } = await supabase
      .from('TICPESectors')
      .select('id, sector_code');

    const sectorMap = {};
    sectorData?.forEach(sector => {
      sectorMap[sector.sector_code] = sector.id;
    });

    const benchmarks = [
      {
        sector_id: sectorMap['TRM'],
        vehicle_count_min: 5,
        vehicle_count_max: 5,
        fuel_type: 'Gazole professionnel',
        average_recovery: 9000,
        min_recovery: 7000,
        max_recovery: 12000,
        description: 'Transport routier de marchandises - 5 camions > 7,5t',
        sample_size: 150,
        confidence_level: 0.95
      },
      {
        sector_id: sectorMap['TAXI_VTC'],
        vehicle_count_min: 1,
        vehicle_count_max: 1,
        fuel_type: 'Gazole professionnel',
        average_recovery: 1300,
        min_recovery: 1000,
        max_recovery: 1800,
        description: 'Entreprise VTC ou Taxi - 1 véhicule',
        sample_size: 200,
        confidence_level: 0.90
      },
      {
        sector_id: sectorMap['AGRICULTURE'],
        vehicle_count_min: 10,
        vehicle_count_max: 10,
        fuel_type: 'GNR',
        average_recovery: 7500,
        min_recovery: 5000,
        max_recovery: 10000,
        description: 'Coopérative agricole - 10 tracteurs ou engins GNR',
        sample_size: 80,
        confidence_level: 0.85
      },
      {
        sector_id: sectorMap['BTP'],
        vehicle_count_min: 15,
        vehicle_count_max: 15,
        fuel_type: 'GNR',
        average_recovery: 12000,
        min_recovery: 8000,
        max_recovery: 18000,
        description: 'PME du BTP - 15 engins lourds de chantier',
        sample_size: 60,
        confidence_level: 0.80
      },
      {
        sector_id: sectorMap['TRV'],
        vehicle_count_min: 3,
        vehicle_count_max: 3,
        fuel_type: 'Gazole professionnel',
        average_recovery: 8500,
        min_recovery: 6000,
        max_recovery: 11000,
        description: 'Autocariste régional - 3 autocars interurbains',
        sample_size: 100,
        confidence_level: 0.90
      }
    ];

    for (const benchmark of benchmarks) {
      if (benchmark.sector_id) {
        const { error } = await supabase
          .from('TICPEBenchmarks')
          .insert(benchmark);
        
        if (error) {
          console.log(`⚠️ Erreur benchmark: ${error.message}`);
        } else {
          console.log(`✅ Benchmark inséré: ${benchmark.description}`);
        }
      }
    }

    // 6. Insertion des indicateurs de maturité administrative
    console.log('\n6️⃣ Insertion des indicateurs de maturité administrative...');
    const maturityIndicators = [
      {
        indicator_name: 'Cartes carburant professionnelles',
        question_text: 'Disposez-vous de cartes carburant professionnelles ?',
        max_points: 20,
        scoring_rules: {
          'Oui, toutes les stations': 20,
          'Oui, partiellement': 10,
          'Non': 0
        },
        category: 'technology',
        description: 'Utilisation de cartes carburant professionnelles',
        best_practices: [
          'Cartes Total, AS24, ou équivalent',
          'Centralisation des achats',
          'Traçabilité automatique'
        ]
      },
      {
        indicator_name: 'Factures nominatives',
        question_text: 'Conservez-vous les factures nominatives avec numéro d\'immatriculation ?',
        max_points: 20,
        scoring_rules: {
          'Oui, systématiquement': 20,
          'Oui, partiellement': 10,
          'Non': 0
        },
        category: 'documentation',
        description: 'Conservation des factures avec identification véhicule',
        best_practices: [
          'Factures avec numéro d\'immatriculation',
          'Archivage systématique',
          'Classement par véhicule'
        ]
      },
      {
        indicator_name: 'Immatriculation société',
        question_text: 'Vos véhicules sont-ils tous immatriculés au nom de la société ?',
        max_points: 15,
        scoring_rules: {
          'Oui, 100%': 15,
          'Oui, majoritairement': 10,
          'Non': 0
        },
        category: 'compliance',
        description: 'Propriété des véhicules par la société',
        best_practices: [
          'Carte grise au nom de la société',
          'Aucun véhicule personnel',
          'Gestion centralisée'
        ]
      },
      {
        indicator_name: 'Déclarations TICPE',
        question_text: 'Faites-vous déjà une déclaration semestrielle ou annuelle de TICPE ?',
        max_points: 25,
        scoring_rules: {
          'Oui, régulièrement': 25,
          'Oui, occasionnellement': 15,
          'Non': 0
        },
        category: 'process',
        description: 'Déclarations TICPE existantes',
        best_practices: [
          'Déclarations semestrielles',
          'Déclarations annuelles',
          'Suivi régulier'
        ]
      }
    ];

    for (const indicator of maturityIndicators) {
      const { error } = await supabase
        .from('TICPEAdminMaturity')
        .upsert(indicator, { onConflict: 'indicator_name' });
      
      if (error) {
        console.log(`⚠️ Erreur indicateur ${indicator.indicator_name}: ${error.message}`);
      } else {
        console.log(`✅ Indicateur ${indicator.indicator_name} inséré`);
      }
    }

    // 7. Insertion des règles de calcul avancées
    console.log('\n7️⃣ Insertion des règles de calcul avancées...');
    const advancedRules = [
      {
        rule_name: 'Éligibilité secteur transport',
        rule_type: 'eligibility',
        conditions: {
          'secteur': ['Transport routier de marchandises', 'Transport routier de voyageurs', 'Taxi / VTC']
        },
        calculation_formula: 'score += 30',
        weight: 30,
        description: 'Bonus pour les secteurs transport',
        examples: ['TRM', 'Autocars', 'Taxis']
      },
      {
        rule_name: 'Véhicules lourds',
        rule_type: 'calculation',
        conditions: {
          'vehicle_type': ['Camions de plus de 7,5 tonnes'],
          'count': { 'min': 1 }
        },
        calculation_formula: 'coefficient = 1.0',
        weight: 25,
        description: 'Coefficient maximum pour véhicules lourds',
        examples: ['Camions > 7,5t', 'Semi-remorques']
      },
      {
        rule_name: 'Usage professionnel exclusif',
        rule_type: 'bonus',
        conditions: {
          'professional_percentage': { 'min': 100 }
        },
        calculation_formula: 'bonus = 20%',
        weight: 20,
        description: 'Bonus pour usage 100% professionnel',
        examples: ['Véhicules de service', 'Flottes dédiées']
      },
      {
        rule_name: 'Documentation complète',
        rule_type: 'bonus',
        conditions: {
          'factures': 'complètes',
          'cartes_carburant': true
        },
        calculation_formula: 'bonus = 15%',
        weight: 15,
        description: 'Bonus pour documentation parfaite',
        examples: ['Cartes carburant', 'Factures nominatives']
      }
    ];

    for (const rule of advancedRules) {
      const { error } = await supabase
        .from('TICPEAdvancedRules')
        .upsert(rule, { onConflict: 'rule_name' });
      
      if (error) {
        console.log(`⚠️ Erreur règle ${rule.rule_name}: ${error.message}`);
      } else {
        console.log(`✅ Règle ${rule.rule_name} insérée`);
      }
    }

    console.log('\n✅ Toutes les données TICPE ont été insérées avec succès !');
    console.log('\n📊 Résumé :');
    console.log(`- ${sectors.length} secteurs d'activité`);
    console.log(`- ${rates.length} types de carburant`);
    console.log(`- ${vehicleTypes.length} types de véhicules`);
    console.log(`- ${usageScenarios.length} scénarios d'usage`);
    console.log(`- ${benchmarks.length} benchmarks`);
    console.log(`- ${maturityIndicators.length} indicateurs de maturité`);
    console.log(`- ${advancedRules.length} règles de calcul`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données TICPE:', error);
  }
}

// Exécution du script
if (require.main === module) {
  insertTICPEData();
}

module.exports = { insertTICPEData }; 