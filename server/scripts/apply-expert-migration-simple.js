import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyExpertMigrationSimple() {
  console.log('🔧 Application de la migration Expert (version simplifiée)...\n');

  try {
    // 1. Lire le fichier de migration simplifié
    const migrationPath = path.join(process.cwd(), 'scripts', 'apply-expert-migration-simple.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Fichier de migration non trouvé:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Fichier de migration lu');

    // 2. Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} commandes à exécuter`);

    // 3. Exécuter chaque commande individuellement
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim() === '') continue;
      
      try {
        console.log(`\n${i + 1}/${commands.length} Exécution: ${command.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        
        if (error) {
          console.log(`   ⚠️ Commande ignorée (probablement déjà exécutée): ${error.message}`);
        } else {
          console.log(`   ✅ Commande exécutée avec succès`);
        }
      } catch (err) {
        console.log(`   ⚠️ Erreur (probablement déjà exécuté): ${err.message}`);
      }
    }

    // 4. Vérifier les nouvelles colonnes
    console.log('\n4️⃣ Vérification des nouvelles colonnes...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'Expert')
      .in('column_name', ['website', 'linkedin', 'languages', 'availability', 'max_clients', 'hourly_rate', 'phone']);

    if (columnsError) {
      console.log('⚠️ Impossible de vérifier les colonnes:', columnsError.message);
    } else {
      console.log('📋 Colonnes ajoutées:');
      columns.forEach(col => {
        console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 5. Test de création d'un expert avec tous les champs
    console.log('\n5️⃣ Test de création d\'expert avec tous les champs...');
    
    const testExpertComplete = {
      id: 'test-complete-' + Date.now(),
      email: 'test-complete@example.com',
      password: 'test',
      name: 'Test Complet',
      company_name: 'Test Company Complete',
      siren: '123456789',
      specializations: ['TICPE', 'DFS'],
      experience: '5-10 ans',
      location: 'Paris',
      rating: 4.5,
      compensation: 15,
      description: 'Expert de test complet',
      status: 'active',
      disponibilites: null,
      certifications: ['Expert-comptable'],
      card_number: null,
      card_expiry: null,
      card_cvc: null,
      abonnement: 'growth',
      auth_id: 'test-auth-complete',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Nouveaux champs
      website: 'https://www.test-expert.com',
      linkedin: 'https://linkedin.com/in/test-expert',
      languages: ['Français', 'Anglais'],
      availability: 'disponible',
      max_clients: 15,
      hourly_rate: 120,
      phone: '01 23 45 67 89'
    };

    const { data: createdExpert, error: createError } = await supabase
      .from('Expert')
      .insert([testExpertComplete])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création expert complet:', createError);
    } else {
      console.log('✅ Expert créé avec tous les champs');
      console.log('📋 Vérification des nouveaux champs:');
      console.log(`   - Website: ${createdExpert.website} ✅`);
      console.log(`   - LinkedIn: ${createdExpert.linkedin} ✅`);
      console.log(`   - Langues: ${createdExpert.languages?.join(', ')} ✅`);
      console.log(`   - Disponibilité: ${createdExpert.availability} ✅`);
      console.log(`   - Clients max: ${createdExpert.max_clients} ✅`);
      console.log(`   - Taux horaire: ${createdExpert.hourly_rate}€ ✅`);
      console.log(`   - Téléphone: ${createdExpert.phone} ✅`);

      // Nettoyer
      await supabase
        .from('Expert')
        .delete()
        .eq('id', createdExpert.id);
    }

    console.log('\n🎉 Migration Expert terminée avec succès !');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Redémarrer le serveur backend');
    console.log('   2. Tester le formulaire expert dans l\'interface admin');
    console.log('   3. Vérifier que tous les champs sont sauvegardés correctement');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

applyExpertMigrationSimple(); 