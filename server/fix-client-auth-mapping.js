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

async function diagnoseClientAuthMapping() {
  console.log('🔍 DIAGNOSTIC DU MAPPING AUTH CLIENT');
  console.log('=====================================\n');

  try {
    // 1. Récupérer tous les utilisateurs Supabase Auth
    console.log('1. UTILISATEURS SUPABASE AUTH:');
    console.log('-------------------------------');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs Auth:', authError);
      return;
    }

    console.log(`✅ ${authUsers.users.length} utilisateurs Supabase Auth trouvés:\n`);
    
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.user_metadata?.type || 'non défini'}`);
      console.log(`   Créé le: ${user.created_at}`);
      console.log(`   Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log('');
    });

    // 2. Récupérer tous les clients
    console.log('2. CLIENTS DANS LA TABLE CLIENT:');
    console.log('---------------------------------');
    
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, name, company_name, created_at');

    if (clientsError) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return;
    }

    console.log(`✅ ${clients.length} clients trouvés:\n`);
    
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client.id}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Nom: ${client.name || 'Non défini'}`);
      console.log(`   Entreprise: ${client.company_name || 'Non définie'}`);
      console.log(`   Créé le: ${client.created_at}`);
      console.log('');
    });

    // 3. Analyser les correspondances
    console.log('3. ANALYSE DES CORRESPONDANCES:');
    console.log('--------------------------------');
    
    const emailMapping = {};
    const idMapping = {};
    
    // Mapper par email
    authUsers.users.forEach(authUser => {
      if (authUser.email) {
        emailMapping[authUser.email] = authUser;
      }
    });
    
    clients.forEach(client => {
      if (client.email) {
        if (emailMapping[client.email]) {
          console.log(`✅ Correspondance email trouvée: ${client.email}`);
          console.log(`   Auth ID: ${emailMapping[client.email].id}`);
          console.log(`   Client ID: ${client.id}`);
          console.log(`   Correspondance: ${emailMapping[client.email].id === client.id ? 'ID identiques' : 'IDs différents'}`);
          console.log('');
          
          idMapping[client.email] = {
            authId: emailMapping[client.email].id,
            clientId: client.id,
            match: emailMapping[client.email].id === client.id
          };
        } else {
          console.log(`❌ Aucun utilisateur Auth trouvé pour: ${client.email}`);
          console.log('');
        }
      }
    });

    // 4. Vérifier les ClientProduitEligible
    console.log('4. CLIENTPRODUITELIGIBLE PAR CLIENT:');
    console.log('-------------------------------------');
    
    for (const client of clients) {
      const { data: produits, error: produitsError } = await supabase
        .from('ClientProduitEligible')
        .select('id, statut, montantFinal, ProduitEligible(nom)')
        .eq('clientId', client.id);

      if (produitsError) {
        console.error(`❌ Erreur récupération produits pour ${client.email}:`, produitsError);
        continue;
      }

      console.log(`📊 ${client.email} (${client.id}):`);
      console.log(`   Produits éligibles: ${produits.length}`);
      
      if (produits.length > 0) {
        produits.forEach(produit => {
          console.log(`   - ${produit.ProduitEligible?.nom || 'Produit inconnu'}: ${produit.statut} (${produit.montantFinal}€)`);
        });
      } else {
        console.log(`   - Aucun produit éligible`);
      }
      console.log('');
    }

    // 5. Recommandations
    console.log('5. RECOMMANDATIONS:');
    console.log('-------------------');
    
    const mismatchedClients = Object.values(idMapping).filter(mapping => !mapping.match);
    
    if (mismatchedClients.length > 0) {
      console.log('❌ PROBLÈME DÉTECTÉ: Correspondances d\'ID incorrectes');
      console.log('');
      
      mismatchedClients.forEach(mapping => {
        console.log(`   Email avec problème: ${Object.keys(idMapping).find(email => idMapping[email] === mapping)}`);
        console.log(`   Auth ID: ${mapping.authId}`);
        console.log(`   Client ID: ${mapping.clientId}`);
        console.log('');
      });
      
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Utiliser la route /client/login au lieu de /login');
      console.log('   2. Ou synchroniser les IDs entre Auth et Client');
      console.log('   3. Ou modifier la logique de récupération des produits éligibles');
    } else {
      console.log('✅ Toutes les correspondances d\'ID sont correctes');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

// Exécuter le diagnostic
diagnoseClientAuthMapping().then(() => {
  console.log('🏁 Diagnostic terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 