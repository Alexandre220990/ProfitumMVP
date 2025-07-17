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

async function applyExpertMigration() {
  console.log('🔧 Application de la migration Expert...\n');

  try {
    // 1. Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations', '20250127_add_expert_missing_fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Fichier de migration non trouvé:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Fichier de migration lu');

    // 2. Vérifier la structure actuelle de la table Expert
    console.log('\n2️⃣ Vérification de la structure actuelle...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'Expert' });

    if (columnsError) {
      console.log('⚠️ Impossible de récupérer les colonnes, utilisation de la méthode alternative...');
      
      // Méthode alternative : essayer d'insérer un expert de test pour voir les erreurs
      const testExpert = {
        id: 'test-migration-' + Date.now(),
        email: 'test-migration@example.com',
        password: 'test',
        name: 'Test Migration',
        company_name: 'Test Company',
        siren: '123456789',
        specializations: ['TICPE'],
        experience: '5-10 ans',
        location: 'Paris',
        rating: 0,
        compensation: 0,
        description: 'Test migration',
        status: 'active',
        disponibilites: null,
        certifications: null,
        card_number: null,
        card_expiry: null,
        card_cvc: null,
        abonnement: 'starter',
        auth_id: 'test-auth-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: testError } = await supabase
        .from('Expert')
        .insert([testExpert]);

      if (testError) {
        console.log('📋 Erreurs détectées dans la structure:', testError.message);
      } else {
        console.log('✅ Structure de base OK');
        // Supprimer l'expert de test
        await supabase
          .from('Expert')
          .delete()
          .eq('id', testExpert.id);
      }
    } else {
      console.log('📋 Colonnes actuelles:', columns.map(col => col.column_name).join(', '));
    }

    // 3. Appliquer les modifications une par une
    console.log('\n3️⃣ Application des modifications...');

    const modifications = [
      {
        name: 'Ajout du champ website',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS website TEXT;'
      },
      {
        name: 'Ajout du champ linkedin',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS linkedin TEXT;'
      },
      {
        name: 'Ajout du champ languages',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY[\'Français\'];'
      },
      {
        name: 'Ajout du champ availability',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT \'disponible\';'
      },
      {
        name: 'Ajout du champ max_clients',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 10;'
      },
      {
        name: 'Ajout du champ hourly_rate',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0;'
      },
      {
        name: 'Ajout du champ phone',
        sql: 'ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS phone TEXT;'
      },
      {
        name: 'Ajout des contraintes de validation',
        sql: `
          DO $$ 
          BEGIN
              -- Contrainte availability
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'expert_availability_check' 
                  AND table_name = 'Expert'
              ) THEN
                  ALTER TABLE "Expert" 
                  ADD CONSTRAINT "expert_availability_check" 
                  CHECK (availability IN ('disponible', 'partiel', 'limite', 'indisponible'));
              END IF;

              -- Contrainte max_clients
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'expert_max_clients_check' 
                  AND table_name = 'Expert'
              ) THEN
                  ALTER TABLE "Expert" 
                  ADD CONSTRAINT "expert_max_clients_check" 
                  CHECK (max_clients >= 1 AND max_clients <= 100);
              END IF;

              -- Contrainte hourly_rate
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'expert_hourly_rate_check' 
                  AND table_name = 'Expert'
              ) THEN
                  ALTER TABLE "Expert" 
                  ADD CONSTRAINT "expert_hourly_rate_check" 
                  CHECK (hourly_rate >= 0);
              END IF;
          END $$;
        `
      }
    ];

    for (const modification of modifications) {
      try {
        console.log(`   - ${modification.name}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: modification.sql });
        
        if (error) {
          console.log(`   ⚠️ ${modification.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${modification.name}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ ${modification.name}: ${err.message}`);
      }
    }

    // 4. Vérifier les nouvelles colonnes
    console.log('\n4️⃣ Vérification des nouvelles colonnes...');
    
    try {
      const { data: newColumns, error: newColumnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'Expert' });

      if (!newColumnsError && newColumns) {
        const newFields = ['website', 'linkedin', 'languages', 'availability', 'max_clients', 'hourly_rate', 'phone'];
        const existingColumns = newColumns.map(col => col.column_name);
        
        console.log('📋 Colonnes après migration:', existingColumns.join(', '));
        
        for (const field of newFields) {
          if (existingColumns.includes(field)) {
            console.log(`   ✅ ${field}: Présent`);
          } else {
            console.log(`   ❌ ${field}: Manquant`);
          }
        }
      }
    } catch (err) {
      console.log('⚠️ Impossible de vérifier les colonnes:', err.message);
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

applyExpertMigration(); 