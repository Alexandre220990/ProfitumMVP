#!/usr/bin/env node

/**
 * ============================================================================
 * VÉRIFICATION CONTRAINTE DE STATUT
 * ============================================================================
 * 
 * Ce script vérifie directement la contrainte de statut via une requête SQL
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatusConstraint() {
  console.log('🔍 VÉRIFICATION CONTRAINTE DE STATUT');
  console.log('=====================================');
  console.log('');

  try {
    // 1. Vérifier les contraintes via une requête SQL directe
    console.log('📋 1. Vérification des contraintes via SQL...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(c.oid) as constraint_definition
          FROM pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname = 'ApporteurAffaires'
            AND n.nspname = 'public'
            AND c.contype = 'c'
        `
      });

    if (constraintsError) {
      console.log('⚠️ Impossible de récupérer les contraintes via SQL');
      console.log('   Erreur:', constraintsError.message);
    } else {
      console.log('✅ Contraintes trouvées:');
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_definition}`);
      });
    }
    console.log('');

    // 2. Vérifier le statut actuel de l'apporteur
    console.log('📊 2. Statut actuel de l\'apporteur...');
    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('email, status, created_at, updated_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (apporteurError) {
      console.error('❌ Erreur récupération apporteur:', apporteurError);
      return;
    }

    console.log('✅ Apporteur trouvé:');
    console.log(`   - Email: ${apporteur.email}`);
    console.log(`   - Statut: "${apporteur.status}"`);
    console.log(`   - Créé le: ${apporteur.created_at}`);
    console.log(`   - Mis à jour le: ${apporteur.updated_at}`);
    console.log('');

    // 3. Tester la mise à jour du statut vers différents valeurs
    console.log('🧪 3. Test de mise à jour du statut...');
    console.log('======================================');
    
    const testStatuses = [
      'active',
      'inactive', 
      'candidature',
      'pending_approval',
      'approved',
      'rejected',
      'suspended'
    ];

    for (const testStatus of testStatuses) {
      try {
        console.log(`🔄 Test avec statut "${testStatus}"...`);
        
        const { data, error } = await supabase
          .from('ApporteurAffaires')
          .update({ 
            status: testStatus,
            updated_at: new Date().toISOString()
          })
          .eq('email', 'conseilprofitum@gmail.com')
          .select()
          .single();

        if (error) {
          console.log(`   ❌ Échec: ${error.message}`);
        } else {
          console.log(`   ✅ Succès: Statut mis à jour vers "${testStatus}"`);
          
          // Remettre le statut à "active" pour les tests suivants
          if (testStatus !== 'active') {
            await supabase
              .from('ApporteurAffaires')
              .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('email', 'conseilprofitum@gmail.com');
            console.log(`   🔄 Statut remis à "active"`);
          }
        }
      } catch (err) {
        console.log(`   💥 Erreur inattendue: ${err.message}`);
      }
    }

    console.log('');
    console.log('📋 4. RÉSUMÉ DES STATUTS VALIDES:');
    console.log('==================================');
    console.log('D\'après les tests ci-dessus, voici les statuts qui fonctionnent:');
    console.log('(Les statuts qui ont échoué ne sont pas valides selon la contrainte)');

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter la vérification
checkStatusConstraint()
  .then(() => {
    console.log('');
    console.log('🏁 Vérification terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
