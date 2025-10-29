/**
 * Script pour lister tous les utilisateurs (Supabase Auth + Expert table)
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllUsers() {
  try {
    console.log('🔍 VÉRIFICATION DES UTILISATEURS\n');
    console.log('📍 Base de données:', supabaseUrl);
    console.log('=' .repeat(80), '\n');
    
    // 1. SUPABASE AUTH USERS
    console.log('👥 SUPABASE AUTH - AUTHENTICATED USERS\n');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (authError) {
      console.error('❌ Erreur récupération auth users:', authError.message);
    } else {
      console.log(`Total : ${authUsers.users.length} utilisateur(s)\n`);
      
      if (authUsers.users.length === 0) {
        console.log('⚠️ Aucun utilisateur dans Supabase Auth\n');
      } else {
        authUsers.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email}`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
          console.log(`   Type: ${user.user_metadata?.type || 'non défini'}`);
          console.log(`   Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
          console.log('');
        });
      }
    }
    
    console.log('=' .repeat(80), '\n');
    
    // 2. TABLE EXPERT
    console.log('🎯 TABLE EXPERT\n');
    
    const { data: experts, error: expertError, count } = await supabase
      .from('Expert')
      .select('id, email, first_name, last_name, name, auth_user_id, approval_status, status, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (expertError) {
      console.error('❌ Erreur récupération experts:', expertError.message);
    } else {
      console.log(`Total : ${experts?.length || 0} expert(s)\n`);
      
      if (!experts || experts.length === 0) {
        console.log('⚠️ Aucun expert dans la table Expert\n');
      } else {
        experts.forEach((expert, index) => {
          const name = expert.name || `${expert.first_name || ''} ${expert.last_name || ''}`.trim();
          console.log(`${index + 1}. ${expert.email} - ${name}`);
          console.log(`   ID: ${expert.id}`);
          console.log(`   auth_user_id: ${expert.auth_user_id || '❌ MANQUANT'}`);
          console.log(`   Status: ${expert.status || 'non défini'}`);
          console.log(`   Approval: ${expert.approval_status || 'non défini'}`);
          console.log(`   Active: ${expert.is_active !== undefined ? (expert.is_active ? '✅' : '❌') : 'non défini'}`);
          console.log(`   Created: ${expert.created_at ? new Date(expert.created_at).toLocaleString() : 'non défini'}`);
          console.log('');
        });
      }
    }
    
    console.log('=' .repeat(80), '\n');
    
    // 3. CORRESPONDANCE AUTH ↔ EXPERT
    console.log('🔗 CORRESPONDANCE AUTH ↔ EXPERT\n');
    
    if (authUsers && authUsers.users.length > 0 && experts && experts.length > 0) {
      const expertAuthIds = new Set(experts.map(e => e.auth_user_id).filter(Boolean));
      const authUserIds = new Set(authUsers.users.map(u => u.id));
      
      // Auth users sans profil Expert
      const authWithoutExpert = authUsers.users.filter(u => 
        u.user_metadata?.type === 'expert' && !expertAuthIds.has(u.id)
      );
      
      // Experts sans Auth user
      const expertWithoutAuth = experts.filter(e => 
        e.auth_user_id && !authUserIds.has(e.auth_user_id)
      );
      
      // Experts sans auth_user_id
      const expertNoAuthId = experts.filter(e => !e.auth_user_id);
      
      if (authWithoutExpert.length > 0) {
        console.log('⚠️ Comptes Auth "expert" sans profil Expert:');
        authWithoutExpert.forEach(u => {
          console.log(`   - ${u.email} (${u.id})`);
        });
        console.log('');
      }
      
      if (expertWithoutAuth.length > 0) {
        console.log('⚠️ Experts avec auth_user_id invalide:');
        expertWithoutAuth.forEach(e => {
          console.log(`   - ${e.email} (auth_user_id: ${e.auth_user_id})`);
        });
        console.log('');
      }
      
      if (expertNoAuthId.length > 0) {
        console.log('⚠️ Experts sans auth_user_id (ne peuvent pas se connecter):');
        expertNoAuthId.forEach(e => {
          console.log(`   - ${e.email} (ID: ${e.id})`);
        });
        console.log('');
      }
      
      const matchedCount = experts.filter(e => 
        e.auth_user_id && authUserIds.has(e.auth_user_id)
      ).length;
      
      console.log(`✅ ${matchedCount} expert(s) correctement lié(s) à un compte Auth\n`);
    }
    
    console.log('=' .repeat(80), '\n');
    
    // 4. RECHERCHE EXPERT SPÉCIFIQUE
    console.log('🔎 RECHERCHE: expert@profitum.fr\n');
    
    // Dans Auth
    const expertAuthUser = authUsers?.users.find(u => u.email === 'expert@profitum.fr');
    if (expertAuthUser) {
      console.log('✅ Trouvé dans Supabase Auth:');
      console.log(`   ID: ${expertAuthUser.id}`);
      console.log(`   Type: ${expertAuthUser.user_metadata?.type || 'non défini'}`);
    } else {
      console.log('❌ NON trouvé dans Supabase Auth');
    }
    console.log('');
    
    // Dans Expert table
    const expertInTable = experts?.find(e => e.email === 'expert@profitum.fr');
    if (expertInTable) {
      console.log('✅ Trouvé dans table Expert:');
      console.log(`   ID: ${expertInTable.id}`);
      console.log(`   auth_user_id: ${expertInTable.auth_user_id || '❌ MANQUANT'}`);
      console.log(`   Status: ${expertInTable.status}`);
      console.log(`   Approval: ${expertInTable.approval_status}`);
    } else {
      console.log('❌ NON trouvé dans table Expert');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

listAllUsers();

