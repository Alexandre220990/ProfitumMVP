import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis le fichier .env à la racine du projet server
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface UserToMigrate {
  id: string;
  email: string;
  name: string;
  type: 'admin' | 'expert' | 'client' | 'apporteur';
  auth_user_id: string | null;
  tableName: string;
}

const DEFAULT_PASSWORD = 'Profitum2025!'; // Mot de passe temporaire FORT

async function migrateUsers() {
  console.log('🚀 MIGRATION DES UTILISATEURS VERS SUPABASE AUTH');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('📋 Configuration:');
  console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL}`);
  console.log(`   - SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   - Mot de passe temporaire: ${DEFAULT_PASSWORD}\n`);
  
  const usersToMigrate: UserToMigrate[] = [];
  
  // ============================================================================
  // 1. RÉCUPÉRATION DES ADMINS ACTIFS
  // ============================================================================
  console.log('👤 1. Récupération des Admins...');
  try {
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('Admin')
      .select('id, email, name, auth_user_id, is_active');
    
    if (adminsError) {
      console.error('   ❌ Erreur:', adminsError.message);
    } else if (admins) {
      admins.forEach(admin => {
        usersToMigrate.push({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          type: 'admin',
          auth_user_id: admin.auth_user_id,
          tableName: 'Admin'
        });
      });
      console.log(`   ✅ ${admins.length} admins trouvés`);
    }
  } catch (error) {
    console.error('   ❌ Erreur fatale:', error);
  }
  
  // ============================================================================
  // 2. RÉCUPÉRATION DES EXPERTS APPROUVÉS ET ACTIFS
  // ============================================================================
  console.log('🎓 2. Récupération des Experts...');
  try {
    const { data: experts, error: expertsError } = await supabaseAdmin
      .from('Expert')
      .select('id, email, name, auth_user_id, is_active, approval_status')
      .eq('approval_status', 'approved');
    
    if (expertsError) {
      console.error('   ❌ Erreur:', expertsError.message);
    } else if (experts) {
      experts.forEach(expert => {
        usersToMigrate.push({
          id: expert.id,
          email: expert.email,
          name: expert.name,
          type: 'expert',
          auth_user_id: expert.auth_user_id,
          tableName: 'Expert'
        });
      });
      console.log(`   ✅ ${experts.length} experts trouvés`);
    }
  } catch (error) {
    console.error('   ❌ Erreur fatale:', error);
  }
  
  // ============================================================================
  // 3. RÉCUPÉRATION DES CLIENTS ACTIFS (LIMITÉ À 100 POUR COMMENCER)
  // ============================================================================
  console.log('💼 3. Récupération des Clients (limité à 100)...');
  try {
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('Client')
      .select('id, email, name, auth_user_id, is_active')
      .eq('is_active', true)
      .limit(100);
    
    if (clientsError) {
      console.error('   ❌ Erreur:', clientsError.message);
    } else if (clients) {
      clients.forEach(client => {
        usersToMigrate.push({
          id: client.id,
          email: client.email,
          name: client.name,
          type: 'client',
          auth_user_id: client.auth_user_id,
          tableName: 'Client'
        });
      });
      console.log(`   ✅ ${clients.length} clients trouvés`);
    }
  } catch (error) {
    console.error('   ❌ Erreur fatale:', error);
  }
  
  // ============================================================================
  // 4. RÉCUPÉRATION DES APPORTEURS ACTIFS
  // ============================================================================
  console.log('🤝 4. Récupération des Apporteurs...');
  try {
    const { data: apporteurs, error: apporteursError } = await supabaseAdmin
      .from('ApporteurAffaires')
      .select('id, email, company_name, auth_user_id, is_active');
    
    if (apporteursError) {
      console.error('   ❌ Erreur:', apporteursError.message);
    } else if (apporteurs) {
      apporteurs.forEach(apporteur => {
        usersToMigrate.push({
          id: apporteur.id,
          email: apporteur.email,
          name: apporteur.company_name || apporteur.email,
          type: 'apporteur',
          auth_user_id: apporteur.auth_user_id,
          tableName: 'ApporteurAffaires'
        });
      });
      console.log(`   ✅ ${apporteurs.length} apporteurs trouvés`);
    }
  } catch (error) {
    console.error('   ❌ Erreur fatale:', error);
  }
  
  console.log(`\n📊 TOTAL: ${usersToMigrate.length} utilisateurs à traiter\n`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // ============================================================================
  // MIGRATION
  // ============================================================================
  let created = 0;
  let alreadyLinked = 0;
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < usersToMigrate.length; i++) {
    const user = usersToMigrate[i];
    const progress = `[${i + 1}/${usersToMigrate.length}]`;
    
    try {
      console.log(`\n${progress} 🔄 ${user.email} (${user.type})`);
      
      // Vérifier si l'utilisateur a déjà un auth_user_id valide
      let authUserId = user.auth_user_id;
      
      if (authUserId) {
        // Vérifier que le compte Auth existe toujours
        try {
          const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(authUserId);
          
          if (existingAuthUser?.user) {
            console.log(`       ✅ Déjà lié au compte Auth: ${authUserId}`);
            
            // Mettre à jour les metadata pour être sûr
            await supabaseAdmin.auth.admin.updateUserById(authUserId, {
              user_metadata: {
                type: user.type,
                database_id: user.id,
                email: user.email,
                name: user.name
              }
            });
            console.log(`       ✅ Metadata mis à jour`);
            alreadyLinked++;
            continue;
          } else {
            console.log(`       ⚠️  Compte Auth ${authUserId} introuvable, recréation...`);
            authUserId = null; // Forcer la recréation
          }
        } catch (err: any) {
          console.log(`       ⚠️  Erreur vérification compte Auth (${err.message}), recréation...`);
          authUserId = null; // Forcer la recréation
        }
      }
      
      if (!authUserId) {
        // Vérifier si un compte Auth existe déjà avec cet email
        console.log(`       🔍 Recherche compte Auth existant pour ${user.email}...`);
        const { data: listUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error(`       ❌ Erreur listUsers:`, listError.message);
          errors++;
          continue;
        }
        
        const existingUser = listUsersData?.users.find(u => u.email === user.email);
        
        if (existingUser) {
          console.log(`       ℹ️  Compte Auth existant trouvé: ${existingUser.id}`);
          authUserId = existingUser.id;
          updated++;
        } else {
          // Créer le compte Auth
          console.log(`       🆕 Création du compte Auth...`);
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Confirmer l'email automatiquement
            user_metadata: {
              type: user.type,
              database_id: user.id,
              email: user.email,
              name: user.name
            }
          });
          
          if (authError) {
            console.error(`       ❌ Erreur création Auth:`, authError.message);
            errors++;
            continue;
          }
          
          if (!authData.user) {
            console.error(`       ❌ Pas d'utilisateur créé`);
            errors++;
            continue;
          }
          
          authUserId = authData.user.id;
          created++;
          console.log(`       ✅ Compte Auth créé: ${authUserId}`);
          console.log(`       🔑 Mot de passe: ${DEFAULT_PASSWORD}`);
        }
        
        // Mettre à jour la table métier avec auth_user_id
        console.log(`       💾 Mise à jour de la table ${user.tableName}...`);
        const { error: updateError } = await supabaseAdmin
          .from(user.tableName)
          .update({ 
            auth_user_id: authUserId,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`       ❌ Erreur mise à jour table:`, updateError.message);
          errors++;
        } else {
          console.log(`       ✅ Table ${user.tableName} mise à jour avec auth_user_id`);
        }
      }
      
      // Petite pause pour éviter le rate limiting
      if (i % 10 === 0 && i > 0) {
        console.log(`\n⏸️  Pause de 2 secondes (rate limiting)...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error: any) {
      console.error(`       ❌ Erreur inattendue:`, error.message);
      errors++;
    }
  }
  
  // ============================================================================
  // RÉSULTATS
  // ============================================================================
  console.log(`\n\n═══════════════════════════════════════════════════`);
  console.log(`📊 RÉSULTATS DE LA MIGRATION`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`✅ Comptes créés:          ${created}`);
  console.log(`🔗 Comptes liés:           ${updated}`);
  console.log(`✔️  Déjà correctement liés: ${alreadyLinked}`);
  console.log(`❌ Erreurs:                ${errors}`);
  console.log(`📊 Total traité:           ${usersToMigrate.length}`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`\n🔑 MOT DE PASSE TEMPORAIRE: ${DEFAULT_PASSWORD}`);
  console.log(`⚠️  Les utilisateurs devront changer leur mot de passe lors de leur première connexion\n`);
  
  if (created > 0) {
    console.log(`📧 PROCHAINE ÉTAPE: Envoyer des emails de réinitialisation aux nouveaux comptes\n`);
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================
console.log(`\n`);
console.log(`╔═══════════════════════════════════════════════════════════════╗`);
console.log(`║  MIGRATION DES UTILISATEURS VERS SUPABASE AUTH               ║`);
console.log(`║  ─────────────────────────────────────────────────────────  ║`);
console.log(`║  Ce script va créer des comptes Supabase Auth pour tous     ║`);
console.log(`║  les utilisateurs existants dans les tables métier.         ║`);
console.log(`║                                                               ║`);
console.log(`║  ⚠️  Mot de passe temporaire: ${DEFAULT_PASSWORD}          ║`);
console.log(`╚═══════════════════════════════════════════════════════════════╝`);
console.log(`\n`);

migrateUsers()
  .then(() => {
    console.log('✅ Migration terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

