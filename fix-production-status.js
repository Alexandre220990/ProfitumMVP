#!/usr/bin/env node

/**
 * ============================================================================
 * CORRECTION STATUT EN PRODUCTION
 * ============================================================================
 * 
 * Ce script corrige le statut de l'apporteur directement en production
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

async function fixProductionStatus() {
  console.log('🔧 CORRECTION STATUT EN PRODUCTION');
  console.log('===================================');
  console.log('');

  try {
    // 1. Vérifier le statut actuel en production
    console.log('📊 1. Vérification statut actuel en production...');
    const { data: currentApporteur, error: currentError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, status, created_at, updated_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (currentError) {
      console.error('❌ Erreur récupération apporteur:', currentError);
      return;
    }

    if (!currentApporteur) {
      console.log('❌ Apporteur non trouvé en production');
      return;
    }

    console.log('✅ Apporteur trouvé en production:');
    console.log(`   - ID: ${currentApporteur.id}`);
    console.log(`   - Email: ${currentApporteur.email}`);
    console.log(`   - Nom: ${currentApporteur.first_name} ${currentApporteur.last_name}`);
    console.log(`   - STATUT ACTUEL: "${currentApporteur.status}"`);
    console.log(`   - Créé le: ${currentApporteur.created_at}`);
    console.log(`   - Mis à jour le: ${currentApporteur.updated_at}`);
    console.log('');

    // 2. Analyser le problème
    console.log('🔍 2. Analyse du problème...');
    if (currentApporteur.status === 'active') {
      console.log('✅ Le statut est déjà "active"');
      console.log('   → Le problème vient d\'ailleurs');
    } else {
      console.log(`❌ Le statut est "${currentApporteur.status}" au lieu de "active"`);
      console.log('   → Correction nécessaire');
    }
    console.log('');

    // 3. Corriger le statut
    console.log('🔧 3. Correction du statut vers "active"...');
    
    const { data: updatedApporteur, error: updateError } = await supabase
      .from('ApporteurAffaires')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentApporteur.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      return;
    }

    console.log('✅ Statut mis à jour avec succès !');
    console.log(`   - Nouveau statut: "${updatedApporteur.status}"`);
    console.log(`   - Mis à jour le: ${updatedApporteur.updated_at}`);
    console.log('');

    // 4. Vérification finale
    console.log('🔍 4. Vérification finale...');
    const { data: finalApporteur, error: finalError } = await supabase
      .from('ApporteurAffaires')
      .select('email, status, updated_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
      return;
    }

    console.log('✅ Vérification finale réussie:');
    console.log(`   - Email: ${finalApporteur.email}`);
    console.log(`   - Statut: "${finalApporteur.status}"`);
    console.log(`   - Mis à jour le: ${finalApporteur.updated_at}`);
    console.log('');

    if (finalApporteur.status === 'active') {
      console.log('🎉 CORRECTION RÉUSSIE !');
      console.log('========================');
      console.log('Le statut de l\'apporteur est maintenant "active" en production');
      console.log('L\'authentification devrait maintenant fonctionner');
    } else {
      console.log('❌ CORRECTION ÉCHOUÉE');
      console.log('Le statut n\'est toujours pas "active"');
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter la correction
fixProductionStatus()
  .then(() => {
    console.log('');
    console.log('🏁 Correction terminée !');
    console.log('');
    console.log('🧪 TEST RECOMMANDÉ:');
    console.log('===================');
    console.log('Maintenant, testez la connexion apporteur sur:');
    console.log('https://www.profitum.app/connexion-apporteur');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
