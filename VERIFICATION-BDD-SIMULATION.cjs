/**
 * Script de vérification complète de la base de données simulation
 * Analyse l'état actuel avant les modifications
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificationComplete() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         VÉRIFICATION COMPLÈTE BASE DE DONNÉES               ║');
  console.log('║                    SYSTÈME DE SIMULATION                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // ============================================================================
    // 1. VÉRIFICATION DES TABLES PRINCIPALES
    // ============================================================================
    console.log('📋 1. VÉRIFICATION DES TABLES PRINCIPALES\n');

    // ProduitEligible
    const { data: produits, error: prodError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .order('nom');

    if (prodError) {
      console.error('❌ Erreur ProduitEligible:', prodError.message);
    } else {
      console.log(`✅ ProduitEligible: ${produits.length} produits`);
      
      // Analyser les données manquantes
      const produitsIncomplets = produits.filter(p => 
        p.montant_min === null || p.montant_max === null || 
        p.taux_min === null || p.taux_max === null
      );
      
      if (produitsIncomplets.length > 0) {
        console.log(`⚠️  ${produitsIncomplets.length} produits avec données manquantes:`);
        produitsIncomplets.forEach(p => {
          const manquants = [];
          if (p.montant_min === null) manquants.push('montant_min');
          if (p.montant_max === null) manquants.push('montant_max');
          if (p.taux_min === null) manquants.push('taux_min');
          if (p.taux_max === null) manquants.push('taux_max');
          console.log(`   • ${p.nom}: ${manquants.join(', ')}`);
        });
      } else {
        console.log('✅ Tous les produits ont des données complètes');
      }
    }

    // EligibilityRules
    const { data: rules, error: rulesError } = await supabase
      .from('EligibilityRules')
      .select('*')
      .order('priority');

    if (rulesError) {
      console.error('❌ Erreur EligibilityRules:', rulesError.message);
    } else {
      console.log(`\n✅ EligibilityRules: ${rules.length} règles`);
      
      // Analyser les types de règles
      const simpleRules = rules.filter(r => r.rule_type === 'simple');
      const combinedRules = rules.filter(r => r.rule_type === 'combined');
      
      console.log(`   • Règles simples: ${simpleRules.length}`);
      console.log(`   • Règles combinées: ${combinedRules.length}`);
      
      // Vérifier les règles actives
      const activeRules = rules.filter(r => r.is_active);
      console.log(`   • Règles actives: ${activeRules.length}/${rules.length}`);
    }

    // Simulations
    const { data: simulations, error: simError } = await supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (simError) {
      console.error('❌ Erreur simulations:', simError.message);
    } else {
      console.log(`\n✅ Simulations: ${simulations.length} récentes`);
      
      // Analyser les statuts
      const statusCounts = simulations.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   • Statuts:', statusCounts);
      
      // Analyser les simulations avec résultats
      const avecResultats = simulations.filter(s => s.results && Object.keys(s.results).length > 0);
      console.log(`   • Avec résultats: ${avecResultats.length}/${simulations.length}`);
    }

    // ClientProduitEligible
    const { data: cpe, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (nom, categorie)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (cpeError) {
      console.error('❌ Erreur ClientProduitEligible:', cpeError.message);
    } else {
      console.log(`\n✅ ClientProduitEligible: ${cpe.length} résultats`);
      
      // Analyser les statuts
      const statutCounts = cpe.reduce((acc, c) => {
        acc[c.statut] = (acc[c.statut] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   • Statuts:', statutCounts);
      
      // Analyser les montants
      const avecMontants = cpe.filter(c => c.montantFinal && c.montantFinal > 0);
      console.log(`   • Avec montants: ${avecMontants.length}/${cpe.length}`);
    }

    // ============================================================================
    // 2. VÉRIFICATION DES QUESTIONS
    // ============================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 2. VÉRIFICATION DES QUESTIONS\n');

    const { data: questions, error: questError } = await supabase
      .from('Question')
      .select('*')
      .order('id');

    if (questError) {
      console.error('❌ Erreur Question:', questError.message);
    } else {
      console.log(`✅ Questions: ${questions.length} disponibles`);
      
      // Lister les question_id disponibles
      const questionIds = questions.map(q => q.id);
      console.log('   • IDs disponibles:', questionIds.slice(0, 10).join(', '), questionIds.length > 10 ? '...' : '');
      
      // Vérifier les question_id utilisés dans les règles
      const questionIdsUtilises = new Set();
      rules.forEach(rule => {
        if (rule.conditions) {
          try {
            const conditions = typeof rule.conditions === 'string' 
              ? JSON.parse(rule.conditions) 
              : rule.conditions;
            
            if (conditions.question_id) {
              questionIdsUtilises.add(conditions.question_id);
            }
            if (conditions.rules) {
              conditions.rules.forEach(r => {
                if (r.question_id) {
                  questionIdsUtilises.add(r.question_id);
                }
              });
            }
          } catch (error) {
            console.log(`⚠️  Erreur parsing conditions pour règle ${rule.id}:`, error.message);
          }
        }
      });
      
      console.log(`   • IDs utilisés dans les règles: ${Array.from(questionIdsUtilises).join(', ')}`);
      
      // Vérifier les question_id manquants
      const questionIdsManquants = Array.from(questionIdsUtilises).filter(id => !questionIds.includes(id));
      if (questionIdsManquants.length > 0) {
        console.log(`⚠️  Question IDs manquants: ${questionIdsManquants.join(', ')}`);
      } else {
        console.log('✅ Tous les question_id des règles existent');
      }
    }

    // ============================================================================
    // 3. ANALYSE DES DONNÉES MANQUANTES
    // ============================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔍 3. ANALYSE DES DONNÉES MANQUANTES\n');

    // Produits avec données manquantes
    const produitsManquants = produits.filter(p => 
      p.montant_min === null || p.montant_max === null || 
      p.taux_min === null || p.taux_max === null
    );

    if (produitsManquants.length > 0) {
      console.log('📦 PRODUITS AVEC DONNÉES MANQUANTES:');
      produitsManquants.forEach(p => {
        console.log(`   • ${p.nom} (${p.categorie})`);
        if (p.montant_min === null) console.log('     - montant_min: NULL');
        if (p.montant_max === null) console.log('     - montant_max: NULL');
        if (p.taux_min === null) console.log('     - taux_min: NULL');
        if (p.taux_max === null) console.log('     - taux_max: NULL');
      });
    } else {
      console.log('✅ Tous les produits ont des données complètes');
    }

    // ============================================================================
    // 4. RECOMMANDATIONS
    // ============================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 4. RECOMMANDATIONS\n');

    const recommendations = [];

    if (produitsManquants.length > 0) {
      recommendations.push('🔧 Corriger les données ProduitEligible manquantes');
    }

    // Vérifier les question_id manquants pour les recommandations
    let questionIdsManquants = [];
    if (questions && rules) {
      const questionIds = questions.map(q => q.id);
      const questionIdsUtilises = new Set();
      rules.forEach(rule => {
        if (rule.conditions) {
          try {
            const conditions = typeof rule.conditions === 'string' 
              ? JSON.parse(rule.conditions) 
              : rule.conditions;
            
            if (conditions.question_id) {
              questionIdsUtilises.add(conditions.question_id);
            }
            if (conditions.rules) {
              conditions.rules.forEach(r => {
                if (r.question_id) {
                  questionIdsUtilises.add(r.question_id);
                }
              });
            }
          } catch (error) {
            // Ignorer les erreurs de parsing
          }
        }
      });
      questionIdsManquants = Array.from(questionIdsUtilises).filter(id => !questionIds.includes(id));
    }
    
    if (questionIdsManquants.length > 0) {
      recommendations.push('🔧 Créer les questions manquantes ou corriger les règles');
    }

    const simulationsBloquees = simulations.filter(s => s.status === 'in_progress' || s.status === 'en_cours');
    if (simulationsBloquees.length > 0) {
      recommendations.push('🔧 Corriger les simulations bloquées');
    }

    const cpeManquants = simulations.filter(s => s.status === 'completed' && !cpe.some(c => c.simulationId === s.id));
    if (cpeManquants.length > 0) {
      recommendations.push('🔧 Créer les ClientProduitEligible manquants');
    }

    if (recommendations.length > 0) {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('✅ Aucune correction majeure nécessaire');
    }

    // ============================================================================
    // 5. RÉSUMÉ FINAL
    // ============================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RÉSUMÉ FINAL\n');

    console.log(`📦 Produits: ${produits.length} (${produitsManquants.length} incomplets)`);
    console.log(`📋 Règles: ${rules.length} (${rules.filter(r => r.is_active).length} actives)`);
    console.log(`🎯 Simulations: ${simulations.length} (${simulationsBloquees.length} bloquées)`);
    console.log(`🔗 Résultats: ${cpe.length} ClientProduitEligible`);
    console.log(`📝 Questions: ${questions.length} disponibles`);

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    VÉRIFICATION TERMINÉE                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

verificationComplete().catch(console.error);
