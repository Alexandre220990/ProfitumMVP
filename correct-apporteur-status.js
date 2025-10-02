#!/usr/bin/env node

/**
 * ============================================================================
 * CORRECTION STATUT APPORTEUR
 * ============================================================================
 * 
 * Ce script corrige le statut de l'apporteur pour s'assurer qu'il est "active"
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

async function correctApporteurStatus() {
  console.log('🔧 CORRECTION STATUT APPORTEUR');
  console.log('===============================');
  console.log('');

  try {
    // 1. Vérifier le statut actuel
    console.log('📊 1. Vérification statut actuel...');
    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, status, created_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (apporteurError || !apporteur) {
      console.error('❌ Apporteur non trouvé:', apporteurError?.message);
      return;
    }

    console.log('✅ Apporteur trouvé:');
    console.log(`   - ID: ${apporteur.id}`);
    console.log(`   - Email: ${apporteur.email}`);
    console.log(`   - Nom: ${apporteur.first_name} ${apporteur.last_name}`);
    console.log(`   - STATUT ACTUEL: "${apporteur.status}"`);
    console.log(`   - Créé le: ${apporteur.created_at}`);
    console.log('');

    // 2. Corriger le statut vers "active"
    console.log('🔧 2. Correction du statut vers "active"...');
    
    const { data: updatedApporteur, error: updateError } = await supabase
      .from('ApporteurAffaires')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', apporteur.id)
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

    // 3. Vérification finale
    console.log('🔍 3. Vérification finale...');
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
    console.log(`   - Statut: ${finalApporteur.status}`);
    console.log(`   - Mis à jour le: ${finalApporteur.updated_at}`);
    console.log('');

    if (finalApporteur.status === 'active') {
      console.log('🎉 CORRECTION RÉUSSIE !');
      console.log('========================');
      console.log('Le statut de l\'apporteur est maintenant "active"');
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
correctApporteurStatus()
  .then(() => {
    console.log('');
    console.log('🏁 Correction terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
