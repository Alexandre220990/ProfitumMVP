// Script Node.js pour appliquer la correction de la table Notification
// Date: 2025-01-03

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyNotificationFix() {
  console.log('🔧 Application de la correction de la table Notification...\n');

  try {
    // Lire le contenu de la migration
    const migrationPath = 'server/migrations/20250103_fix_notification_structure.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Contenu de la migration:');
    console.log(migrationSQL);
    console.log('');

    // Diviser la migration en commandes SQL séparées
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`🚀 Application de ${commands.length} commandes SQL...\n`);

    // Appliquer chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`📝 Commande ${i + 1}/${commands.length}:`);
      console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.log(`❌ Erreur: ${error.message}`);
        } else {
          console.log('✅ Succès');
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
      }
      
      console.log('');
    }

    // Vérifier que la table a été créée
    console.log('🔍 Vérification de la structure de la table...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('Notification')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erreur lors de la vérification:', tableError.message);
    } else {
      console.log('✅ Table Notification accessible');
      console.log('📊 Structure de la table:', Object.keys(tableInfo[0] || {}));
    }

    // Tester la création d'une notification
    console.log('\n🧪 Test de création d\'une notification...');
    
    const { data: testNotification, error: createError } = await supabase
      .from('Notification')
      .insert({
        user_id: '25274ba6-67e6-4151-901c-74851fe2d82a',
        user_type: 'client',
        title: 'Test de correction',
        message: 'Cette notification teste la correction de la table',
        notification_type: 'system',
        priority: 'normal'
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur création test:', createError.message);
    } else {
      console.log('✅ Notification de test créée:', testNotification.id);
      
      // Supprimer la notification de test
      await supabase
        .from('Notification')
        .delete()
        .eq('id', testNotification.id);
      
      console.log('✅ Notification de test supprimée');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n🎉 Correction terminée !');
}

// Exécuter le script
applyNotificationFix(); 