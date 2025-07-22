require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Créer le client Supabase avec la clé de service
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function unifyAuthSystem() {
  console.log('🔄 UNIFICATION DU SYSTÈME D\'AUTHENTIFICATION');
  console.log('=============================================\n');

  try {
    // 1. ANALYSE DE L'ÉTAT ACTUEL
    console.log('1. ANALYSE DE L\'ÉTAT ACTUEL:');
    console.log('----------------------------');
    
    // Récupérer tous les utilisateurs Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs Auth:', authError);
      return;
    }
    console.log(`✅ ${authUsers.users.length} utilisateurs Supabase Auth trouvés`);

    // Récupérer tous les clients
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, name, company_name');
    if (clientsError) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return;
    }
    console.log(`✅ ${clients.length} clients trouvés`);

    // Récupérer tous les experts
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, email, name, company_name');
    if (expertsError) {
      console.error('❌ Erreur récupération experts:', expertsError);
      return;
    }
    console.log(`✅ ${experts.length} experts trouvés\n`);

    // 2. ANALYSE DES CORRESPONDANCES
    console.log('2. ANALYSE DES CORRESPONDANCES:');
    console.log('-------------------------------');
    
    const emailMapping = {};
    const idMapping = {};
    
    // Mapper par email
    authUsers.users.forEach(authUser => {
      if (authUser.email) {
        emailMapping[authUser.email] = authUser;
      }
    });

    // Analyser les correspondances clients
    console.log('📊 Correspondances clients:');
    let clientsWithAuth = 0;
    let clientsWithoutAuth = 0;
    
    clients.forEach(client => {
      if (client.email && emailMapping[client.email]) {
        const authUser = emailMapping[client.email];
        const match = authUser.id === client.id;
        
        console.log(`   ${client.email}:`);
        console.log(`     Auth ID: ${authUser.id}`);
        console.log(`     Client ID: ${client.id}`);
        console.log(`     Correspondance: ${match ? '✅' : '❌'}`);
        
        idMapping[client.email] = {
          type: 'client',
          authId: authUser.id,
          tableId: client.id,
          match: match
        };
        
        if (match) clientsWithAuth++;
        else clientsWithoutAuth++;
      } else {
        console.log(`   ${client.email}: ❌ Aucun utilisateur Auth`);
        clientsWithoutAuth++;
      }
    });

    // Analyser les correspondances experts
    console.log('\n📊 Correspondances experts:');
    let expertsWithAuth = 0;
    let expertsWithoutAuth = 0;
    
    experts.forEach(expert => {
      if (expert.email && emailMapping[expert.email]) {
        const authUser = emailMapping[expert.email];
        const match = authUser.id === expert.id;
        
        console.log(`   ${expert.email}:`);
        console.log(`     Auth ID: ${authUser.id}`);
        console.log(`     Expert ID: ${expert.id}`);
        console.log(`     Correspondance: ${match ? '✅' : '❌'}`);
        
        idMapping[expert.email] = {
          type: 'expert',
          authId: authUser.id,
          tableId: expert.id,
          match: match
        };
        
        if (match) expertsWithAuth++;
        else expertsWithoutAuth++;
      } else {
        console.log(`   ${expert.email}: ❌ Aucun utilisateur Auth`);
        expertsWithoutAuth++;
      }
    });

    // 3. PLAN DE CORRECTION
    console.log('\n3. PLAN DE CORRECTION:');
    console.log('----------------------');
    
    const mismatchedUsers = Object.values(idMapping).filter(mapping => !mapping.match);
    
    if (mismatchedUsers.length > 0) {
      console.log(`❌ ${mismatchedUsers.length} utilisateurs avec IDs non correspondants:`);
      mismatchedUsers.forEach(mapping => {
        const email = Object.keys(idMapping).find(email => idMapping[email] === mapping);
        console.log(`   - ${email} (${mapping.type}): Auth=${mapping.authId}, Table=${mapping.tableId}`);
      });
      
      console.log('\n🔧 ACTIONS REQUISES:');
      console.log('   1. Mettre à jour les IDs dans les tables pour correspondre aux IDs Supabase Auth');
      console.log('   2. Mettre à jour les références dans ClientProduitEligible et ExpertAssignment');
      console.log('   3. Supprimer les routes d\'authentification obsolètes');
    } else {
      console.log('✅ Toutes les correspondances d\'ID sont correctes !');
    }

    // 4. VÉRIFICATION DES RÉFÉRENCES
    console.log('\n4. VÉRIFICATION DES RÉFÉRENCES:');
    console.log('--------------------------------');
    
    // Vérifier ClientProduitEligible
    const { data: clientProduits, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, ProduitEligible(nom)');
    
    if (cpeError) {
      console.error('❌ Erreur récupération ClientProduitEligible:', cpeError);
    } else {
      console.log(`📊 ${clientProduits.length} ClientProduitEligible trouvés`);
      
      const orphanedCPE = clientProduits.filter(cpe => 
        !clients.some(client => client.id === cpe.clientId)
      );
      
      if (orphanedCPE.length > 0) {
        console.log(`⚠️  ${orphanedCPE.length} ClientProduitEligible orphelins:`);
        orphanedCPE.forEach(cpe => {
          console.log(`   - ID: ${cpe.id}, ClientId: ${cpe.clientId}, Produit: ${cpe.ProduitEligible?.nom}`);
        });
      } else {
        console.log('✅ Tous les ClientProduitEligible ont des clients valides');
      }
    }

    // Vérifier ExpertAssignment
    const { data: expertAssignments, error: eaError } = await supabase
      .from('expertassignment')
      .select('id, expert_id, client_produit_eligible_id');
    
    if (eaError) {
      console.error('❌ Erreur récupération ExpertAssignment:', eaError);
    } else {
      console.log(`📊 ${expertAssignments.length} ExpertAssignment trouvés`);
      
      const orphanedEA = expertAssignments.filter(ea => 
        !experts.some(expert => expert.id === ea.expert_id)
      );
      
      if (orphanedEA.length > 0) {
        console.log(`⚠️  ${orphanedEA.length} ExpertAssignment orphelins:`);
        orphanedEA.forEach(ea => {
          console.log(`   - ID: ${ea.id}, ExpertId: ${ea.expert_id}, CPE: ${ea.client_produit_eligible_id}`);
        });
      } else {
        console.log('✅ Tous les ExpertAssignment ont des experts valides');
      }
    }

    // 5. RECOMMANDATIONS FINALES
    console.log('\n5. RECOMMANDATIONS FINALES:');
    console.log('----------------------------');
    
    if (mismatchedUsers.length > 0) {
      console.log('🔧 ACTIONS IMMÉDIATES:');
      console.log('   1. Créer un script de migration pour corriger les IDs');
      console.log('   2. Tester la migration sur un environnement de développement');
      console.log('   3. Appliquer la migration en production');
      console.log('   4. Supprimer les routes /client/login et /auth/login obsolètes');
      console.log('   5. Unifier toutes les routes vers Supabase Auth');
    } else {
      console.log('✅ Système déjà unifié !');
      console.log('   Actions restantes:');
      console.log('   1. Supprimer les routes d\'authentification obsolètes');
      console.log('   2. Nettoyer le code frontend pour utiliser uniquement Supabase Auth');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
unifyAuthSystem().then(() => {
  console.log('\n🏁 Analyse terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 