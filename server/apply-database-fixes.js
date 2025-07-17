const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDatabaseFixes() {
  console.log('🔧 Application des corrections de base de données...\n');

  try {
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'fix-database-issues.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Diviser le SQL en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 ${commands.length} commandes SQL à exécuter...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`[${i + 1}/${commands.length}] Exécution de la commande...`);
        
        // Exécuter la commande SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Si exec_sql n'existe pas, essayer une approche différente
          console.log(`   ⚠️  Commande ignorée (peut nécessiter une exécution manuelle): ${command.substring(0, 100)}...`);
        } else {
          console.log(`   ✅ Commande exécutée avec succès`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ⚠️  Commande ignorée: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ Commandes réussies: ${successCount}`);
    console.log(`   ⚠️  Commandes ignorées: ${errorCount}`);

    // Vérifier que les corrections ont été appliquées
    console.log('\n🔍 Vérification des corrections...');

    // 1. Vérifier la table ExpertNotifications
    const { data: notificationsTable, error: notificationsError } = await supabase
      .from('ExpertNotifications')
      .select('count')
      .limit(1);

    if (notificationsError) {
      console.log('❌ Table ExpertNotifications non accessible - à créer manuellement');
    } else {
      console.log('✅ Table ExpertNotifications accessible');
    }

    // 2. Vérifier la table ExpertAssignment
    const { data: assignmentTable, error: assignmentError } = await supabase
      .from('ExpertAssignment')
      .select('count')
      .limit(1);

    if (assignmentError) {
      console.log('❌ Table ExpertAssignment non accessible - à créer manuellement');
    } else {
      console.log('✅ Table ExpertAssignment accessible');
    }

    // 3. Vérifier la colonne category dans ProduitEligible
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('nom, category')
      .limit(5);

    if (produitsError) {
      console.log('❌ Erreur accès ProduitEligible:', produitsError.message);
    } else {
      console.log('✅ Colonne category accessible dans ProduitEligible');
      if (produits && produits.length > 0) {
        console.log('   Exemples:');
        produits.forEach(produit => {
          console.log(`   - ${produit.nom}: ${produit.category || 'Non définie'}`);
        });
      }
    }

    // 4. Vérifier la colonne timestamp dans message
    const { data: messages, error: messagesError } = await supabase
      .from('message')
      .select('id, timestamp')
      .limit(5);

    if (messagesError) {
      console.log('❌ Erreur accès message:', messagesError.message);
    } else {
      console.log('✅ Colonne timestamp accessible dans message');
    }

    console.log('\n📋 Instructions pour finaliser les corrections:');
    console.log('1. Connectez-vous à votre interface Supabase');
    console.log('2. Allez dans l\'éditeur SQL');
    console.log('3. Copiez-collez le contenu du fichier fix-database-issues.sql');
    console.log('4. Exécutez le script');
    console.log('5. Vérifiez que toutes les tables et colonnes sont créées');

    console.log('\n🎯 Prochaines étapes:');
    console.log('- Relancer le test: node test-marketplace-complete.js');
    console.log('- Tester la marketplace: http://localhost:3000/marketplace-experts');
    console.log('- Tester la messagerie: http://localhost:3000/messagerie-client');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application des corrections:', error);
  }
}

// Exécuter les corrections
applyDatabaseFixes(); 