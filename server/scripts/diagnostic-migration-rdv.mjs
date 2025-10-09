/**
 * Script de Diagnostic - État Migration RDV
 * Vérifie l'état actuel de la base de données et identifie les corrections nécessaires
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnosticMigration() {
  console.log('\n🔍 DIAGNOSTIC MIGRATION RDV - État Actuel\n');
  console.log('═'.repeat(60));

  const rapport = {
    tables: {},
    colonnes: {},
    donnees: {},
    corrections: []
  };

  try {
    // ========================================
    // 1. VÉRIFIER LES TABLES
    // ========================================
    console.log('\n📋 1. VÉRIFICATION DES TABLES\n');

    // Vérifier ClientRDV
    const { error: clientRDVError } = await supabase
      .from('ClientRDV')
      .select('*')
      .limit(1);

    if (clientRDVError && clientRDVError.message.includes('does not exist')) {
      console.log('✅ ClientRDV : N\'existe plus (déjà renommée)');
      rapport.tables.clientRDV = 'renommée';
    } else if (!clientRDVError) {
      console.log('⚠️  ClientRDV : Existe encore (doit être renommée en RDV)');
      rapport.tables.clientRDV = 'existe';
      rapport.corrections.push('Renommer ClientRDV en RDV');
    }

    // Vérifier RDV
    const { error: rdvError } = await supabase
      .from('RDV')
      .select('*')
      .limit(1);

    if (rdvError && rdvError.message.includes('does not exist')) {
      console.log('❌ RDV : N\'existe pas (migration non effectuée)');
      rapport.tables.rdv = 'inexistante';
      rapport.corrections.push('Créer table RDV ou renommer ClientRDV');
    } else if (!rdvError) {
      console.log('✅ RDV : Existe');
      rapport.tables.rdv = 'existe';
    }

    // Vérifier ClientRDV_Produits
    const { error: clientRDVProduitsError } = await supabase
      .from('ClientRDV_Produits')
      .select('*')
      .limit(1);

    if (clientRDVProduitsError && clientRDVProduitsError.message.includes('does not exist')) {
      console.log('✅ ClientRDV_Produits : N\'existe plus (déjà renommée)');
      rapport.tables.clientRDVProduits = 'renommée';
    } else if (!clientRDVProduitsError) {
      console.log('⚠️  ClientRDV_Produits : Existe encore');
      rapport.tables.clientRDVProduits = 'existe';
      rapport.corrections.push('Renommer ClientRDV_Produits en RDV_Produits');
    }

    // Vérifier RDV_Produits
    const { error: rdvProduitsError } = await supabase
      .from('RDV_Produits')
      .select('*')
      .limit(1);

    if (!rdvProduitsError) {
      console.log('✅ RDV_Produits : Existe');
      rapport.tables.rdvProduits = 'existe';
    } else {
      console.log('❌ RDV_Produits : N\'existe pas');
      rapport.tables.rdvProduits = 'inexistante';
    }

    // ========================================
    // 2. VÉRIFIER LES COLONNES (si table RDV existe)
    // ========================================
    if (rapport.tables.rdv === 'existe') {
      console.log('\n📋 2. VÉRIFICATION DES COLONNES DE LA TABLE RDV\n');

      const { data: sampleRDV } = await supabase
        .from('RDV')
        .select('*')
        .limit(1)
        .single();

      const colonnesRequises = {
        'title': 'Titre du RDV',
        'category': 'Catégorie',
        'source': 'Source',
        'priority': 'Priorité',
        'metadata': 'Métadonnées JSON',
        'created_by': 'Créateur',
        'meeting_url': 'URL de réunion',
        'timezone': 'Fuseau horaire',
        'internal_notes': 'Notes internes',
        'reminder_sent': 'Rappel envoyé',
        'confirmation_sent': 'Confirmation envoyée',
        'original_date': 'Date originale',
        'original_time': 'Heure originale'
      };

      rapport.colonnes.manquantes = [];
      rapport.colonnes.presentes = [];

      for (const [colonne, description] of Object.entries(colonnesRequises)) {
        if (sampleRDV && colonne in sampleRDV) {
          console.log(`✅ ${colonne} : Présente`);
          rapport.colonnes.presentes.push(colonne);
        } else {
          console.log(`❌ ${colonne} : Manquante - ${description}`);
          rapport.colonnes.manquantes.push(colonne);
          rapport.corrections.push(`Ajouter colonne ${colonne}`);
        }
      }

      // Vérifier la colonne rdv_id dans RDV_Produits
      if (rapport.tables.rdvProduits === 'existe') {
        console.log('\n📋 3. VÉRIFICATION COLONNES RDV_PRODUITS\n');
        
        const { data: sampleProduit } = await supabase
          .from('RDV_Produits')
          .select('*')
          .limit(1)
          .single();

        if (sampleProduit) {
          if ('rdv_id' in sampleProduit) {
            console.log('✅ rdv_id : Présente dans RDV_Produits');
          } else if ('client_rdv_id' in sampleProduit) {
            console.log('❌ client_rdv_id : Doit être renommée en rdv_id');
            rapport.corrections.push('Renommer colonne client_rdv_id en rdv_id');
          }
        }
      }
    }

    // ========================================
    // 3. COMPTER LES DONNÉES
    // ========================================
    console.log('\n📊 4. COMPTAGE DES DONNÉES\n');

    if (rapport.tables.rdv === 'existe') {
      const { count: rdvCount } = await supabase
        .from('RDV')
        .select('*', { count: 'exact', head: true });
      
      console.log(`✅ RDV : ${rdvCount || 0} enregistrements`);
      rapport.donnees.rdv = rdvCount || 0;
    }

    if (rapport.tables.clientRDV === 'existe') {
      const { count: clientRDVCount } = await supabase
        .from('ClientRDV')
        .select('*', { count: 'exact', head: true });
      
      console.log(`⚠️  ClientRDV : ${clientRDVCount || 0} enregistrements (à migrer)`);
      rapport.donnees.clientRDV = clientRDVCount || 0;
    }

    if (rapport.tables.rdvProduits === 'existe') {
      const { count: rdvProduitsCount } = await supabase
        .from('RDV_Produits')
        .select('*', { count: 'exact', head: true });
      
      console.log(`✅ RDV_Produits : ${rdvProduitsCount || 0} enregistrements`);
      rapport.donnees.rdvProduits = rdvProduitsCount || 0;
    }

    if (rapport.tables.clientRDVProduits === 'existe') {
      const { count: clientRDVProduitsCount } = await supabase
        .from('ClientRDV_Produits')
        .select('*', { count: 'exact', head: true });
      
      console.log(`⚠️  ClientRDV_Produits : ${clientRDVProduitsCount || 0} enregistrements (à migrer)`);
      rapport.donnees.clientRDVProduits = clientRDVProduitsCount || 0;
    }

    // ========================================
    // 4. RÉSUMÉ ET CORRECTIONS NÉCESSAIRES
    // ========================================
    console.log('\n═'.repeat(60));
    console.log('\n📝 RÉSUMÉ DU DIAGNOSTIC\n');

    // État des tables
    console.log('📋 État des tables :');
    console.log(`   - ClientRDV : ${rapport.tables.clientRDV || 'inconnue'}`);
    console.log(`   - RDV : ${rapport.tables.rdv || 'inconnue'}`);
    console.log(`   - ClientRDV_Produits : ${rapport.tables.clientRDVProduits || 'inconnue'}`);
    console.log(`   - RDV_Produits : ${rapport.tables.rdvProduits || 'inconnue'}`);

    // Colonnes manquantes
    if (rapport.colonnes.manquantes && rapport.colonnes.manquantes.length > 0) {
      console.log(`\n⚠️  Colonnes manquantes (${rapport.colonnes.manquantes.length}) :`);
      rapport.colonnes.manquantes.forEach(col => {
        console.log(`   - ${col}`);
      });
    }

    // Corrections nécessaires
    console.log('\n🔧 CORRECTIONS NÉCESSAIRES\n');
    
    if (rapport.corrections.length === 0) {
      console.log('✅ Aucune correction nécessaire - Migration complète !');
      
      console.log('\n🎉 MIGRATION RÉUSSIE !\n');
      console.log('Prochaines étapes :');
      console.log('  1. Redémarrer le serveur : cd server && npm run dev');
      console.log('  2. Tester l\'API RDV');
      
      return;
    }

    // Déduplication des corrections
    const correctionsUniques = [...new Set(rapport.corrections)];
    
    correctionsUniques.forEach((correction, index) => {
      console.log(`${index + 1}. ${correction}`);
    });

    // ========================================
    // 5. GÉNÉRER SCRIPT DE CORRECTION
    // ========================================
    console.log('\n═'.repeat(60));
    console.log('\n🔧 GÉNÉRATION SCRIPT DE CORRECTION\n');

    let scriptCorrection = '-- Script de correction automatique généré\n\n';

    // Ajouter colonnes manquantes
    if (rapport.colonnes.manquantes && rapport.colonnes.manquantes.length > 0) {
      scriptCorrection += '-- Ajout des colonnes manquantes\n';
      rapport.colonnes.manquantes.forEach(colonne => {
        switch (colonne) {
          case 'title':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS title VARCHAR(255);\n';
            break;
          case 'category':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT \'client_rdv\';\n';
            break;
          case 'source':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT \'apporteur\';\n';
            break;
          case 'priority':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;\n';
            break;
          case 'metadata':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'::jsonb;\n';
            break;
          case 'created_by':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS created_by UUID;\n';
            break;
          case 'meeting_url':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS meeting_url TEXT;\n';
            break;
          case 'timezone':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT \'Europe/Paris\';\n';
            break;
          case 'internal_notes':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS internal_notes TEXT;\n';
            break;
          case 'reminder_sent':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;\n';
            break;
          case 'confirmation_sent':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT FALSE;\n';
            break;
          case 'original_date':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS original_date DATE;\n';
            break;
          case 'original_time':
            scriptCorrection += 'ALTER TABLE "RDV" ADD COLUMN IF NOT EXISTS original_time TIME;\n';
            break;
        }
      });
      scriptCorrection += '\n';
    }

    // Renommer colonne client_rdv_id si nécessaire
    if (rapport.corrections.includes('Renommer colonne client_rdv_id en rdv_id')) {
      scriptCorrection += '-- Renommer colonne dans RDV_Produits\n';
      scriptCorrection += 'ALTER TABLE "RDV_Produits" RENAME COLUMN "client_rdv_id" TO "rdv_id";\n\n';
    }

    // Populer les nouveaux champs
    if (rapport.colonnes.manquantes && rapport.colonnes.manquantes.includes('title')) {
      scriptCorrection += '-- Générer les titres pour les RDV existants\n';
      scriptCorrection += `UPDATE "RDV" 
SET title = CASE 
  WHEN meeting_type = 'physical' THEN 'RDV Physique - '
  WHEN meeting_type = 'video' THEN 'RDV Visio - '
  WHEN meeting_type = 'phone' THEN 'RDV Téléphone - '
  ELSE 'RDV - '
END || COALESCE((SELECT company_name FROM "Client" WHERE id = "RDV".client_id), 'Client')
WHERE title IS NULL OR title = '';\n\n`;
    }

    if (rapport.colonnes.manquantes && rapport.colonnes.manquantes.includes('created_by')) {
      scriptCorrection += '-- Définir created_by\n';
      scriptCorrection += `UPDATE "RDV" SET created_by = apporteur_id WHERE created_by IS NULL AND apporteur_id IS NOT NULL;
UPDATE "RDV" SET created_by = expert_id WHERE created_by IS NULL AND expert_id IS NOT NULL;
UPDATE "RDV" SET created_by = client_id WHERE created_by IS NULL AND client_id IS NOT NULL;\n\n`;
    }

    // Créer index si nécessaire
    scriptCorrection += '-- Créer les index manquants\n';
    scriptCorrection += 'CREATE INDEX IF NOT EXISTS idx_rdv_created_by ON "RDV"(created_by);\n';
    scriptCorrection += 'CREATE INDEX IF NOT EXISTS idx_rdv_category ON "RDV"(category);\n';
    scriptCorrection += 'CREATE INDEX IF NOT EXISTS idx_rdv_source ON "RDV"(source);\n\n';

    scriptCorrection += 'RAISE NOTICE \'✅ Corrections appliquées avec succès\';\n';

    // Sauvegarder le script
    const fs = await import('fs');
    const scriptPath = 'server/migrations/20250110_correction_rdv.sql';
    fs.writeFileSync(scriptPath, scriptCorrection);

    console.log(`✅ Script de correction généré : ${scriptPath}`);
    console.log('\n📝 Contenu du script :\n');
    console.log('─'.repeat(60));
    console.log(scriptCorrection);
    console.log('─'.repeat(60));

    console.log('\n🚀 POUR APPLIQUER LES CORRECTIONS :\n');
    console.log('1. Copier le contenu ci-dessus');
    console.log('2. Aller sur Supabase Dashboard > SQL Editor');
    console.log('3. Coller et exécuter');
    console.log('\nOu exécuter le fichier : ' + scriptPath);

  } catch (error) {
    console.error('\n❌ Erreur lors du diagnostic:', error);
    process.exit(1);
  }
}

// Exécuter le diagnostic
diagnosticMigration().then(() => {
  console.log('\n═'.repeat(60));
  console.log('\n✅ Diagnostic terminé\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

