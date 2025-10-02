#!/usr/bin/env node

/**
 * ============================================================================
 * DEBUG STATUT APPORTEUR
 * ============================================================================
 * 
 * Ce script vérifie le statut réel de l'apporteur dans la base de données
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

async function debugApporteurStatus() {
  console.log('🔍 DEBUG STATUT APPORTEUR');
  console.log('=========================');
  console.log('');

  try {
    // 1. Vérifier le statut réel dans la base
    console.log('📊 1. Vérification statut réel dans ApporteurAffaires...');
    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (apporteurError) {
      console.error('❌ Erreur récupération apporteur:', apporteurError);
      return;
    }

    if (!apporteur) {
      console.log('❌ Apporteur non trouvé');
      return;
    }

    console.log('✅ Apporteur trouvé:');
    console.log(`   - Email: ${apporteur.email}`);
    console.log(`   - Nom: ${apporteur.first_name} ${apporteur.last_name}`);
    console.log(`   - Entreprise: ${apporteur.company_name}`);
    console.log(`   - Type: ${apporteur.company_type}`);
    console.log(`   - Commission: ${apporteur.commission_rate}%`);
    console.log(`   - STATUT: ${apporteur.status}`);
    console.log(`   - Créé le: ${apporteur.created_at}`);
    console.log('');

    // 2. Vérifier tous les statuts possibles
    console.log('📋 2. Statuts possibles dans la base:');
    const { data: allStatuses, error: statusError } = await supabase
      .from('ApporteurAffaires')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('❌ Erreur récupération statuts:', statusError);
    } else {
      const uniqueStatuses = [...new Set(allStatuses.map(a => a.status))];
      console.log('   Statuts trouvés:', uniqueStatuses);
    }
    console.log('');

    // 3. Test de la logique d'authentification
    console.log('🧪 3. Test logique d\'authentification...');
    
    if (apporteur.status === 'active') {
      console.log('✅ Statut est "active" - Authentification devrait réussir');
    } else {
      console.log(`❌ Statut est "${apporteur.status}" - Authentification va échouer`);
      console.log('🔧 CORRECTION NÉCESSAIRE:');
      console.log(`   Mettre à jour le statut vers "active"`);
    }
    console.log('');

    // 4. Proposer la correction
    if (apporteur.status !== 'active') {
      console.log('🔧 4. CORRECTION PROPOSÉE:');
      console.log('==========================');
      console.log(`Statut actuel: "${apporteur.status}"`);
      console.log(`Statut requis: "active"`);
      console.log('');
      console.log('Voulez-vous corriger le statut ? (O/N)');
      
      // Simulation de la correction
      console.log('🔧 Correction simulée...');
      console.log(`UPDATE "ApporteurAffaires" SET status = 'active' WHERE email = '${apporteur.email}';`);
    } else {
      console.log('✅ 4. STATUT CORRECT:');
      console.log('====================');
      console.log('Le statut est déjà "active" - pas de correction nécessaire');
      console.log('Le problème vient peut-être d\'ailleurs...');
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter le debug
debugApporteurStatus()
  .then(() => {
    console.log('');
    console.log('🏁 Debug terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
