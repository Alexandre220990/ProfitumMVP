require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNewAccountCharte() {
  console.log('🧪 Test de signature de charte avec un nouveau compte\n');

  console.log('📋 Instructions pour tester avec un nouveau compte:');
  console.log('   1. Créer un nouveau compte utilisateur dans Supabase Auth');
  console.log('   2. Créer un enregistrement correspondant dans la table Client');
  console.log('   3. Créer un ClientProduitEligible pour ce nouveau client');
  console.log('   4. Tester la signature de charte');
  console.log('   5. Vérifier que tout fonctionne correctement');

  console.log('\n🔧 Étapes à suivre:');
  console.log('   1. Aller sur http://localhost:3000');
  console.log('   2. Cliquer sur "S\'inscrire" ou "Créer un compte"');
  console.log('   3. Remplir le formulaire avec de nouvelles informations');
  console.log('   4. Valider l\'inscription');
  console.log('   5. Se connecter avec le nouveau compte');
  console.log('   6. Aller dans le dashboard client');
  console.log('   7. Cliquer sur "Audit TICPE" ou un autre produit');
  console.log('   8. Suivre le processus jusqu\'à la signature de charte');

  console.log('\n🔍 Points de vérification:');
  console.log('   1. ✅ Le nouveau compte est créé dans Supabase Auth');
  console.log('   2. ✅ Un enregistrement est créé dans la table Client');
  console.log('   3. ✅ L\'ID du Client correspond à l\'ID Supabase Auth');
  console.log('   4. ✅ Un ClientProduitEligible est créé automatiquement');
  console.log('   5. ✅ Le clientId du produit correspond à l\'utilisateur connecté');
  console.log('   6. ✅ La signature de charte fonctionne sans erreur 403');
  console.log('   7. ✅ Le dialogue affiche "Charte Validée" après signature');
  console.log('   8. ✅ L\'étape 1 devient "completed"');
  console.log('   9. ✅ L\'utilisateur peut passer à l\'étape 2');

  console.log('\n⚠️ Points d\'attention:');
  console.log('   - S\'assurer que l\'ID du Client = ID Supabase Auth');
  console.log('   - Vérifier que le ClientProduitEligible a le bon clientId');
  console.log('   - Contrôler que le statut est "eligible"');
  console.log('   - Vérifier les logs dans la console du navigateur');
  console.log('   - Contrôler les logs du serveur backend');

  console.log('\n🎯 Résultat attendu:');
  console.log('   ✅ Signature de charte réussie');
  console.log('   ✅ Pas d\'erreur 403 Forbidden');
  console.log('   ✅ Interface utilisateur mise à jour');
  console.log('   ✅ Processus fluide et sans régression');

  console.log('\n🔧 En cas de problème:');
  console.log('   1. Vérifier les logs de la console (F12)');
  console.log('   2. Contrôler l\'onglet Network pour les appels API');
  console.log('   3. Vérifier les logs du serveur backend');
  console.log('   4. Contrôler la base de données Supabase');
  console.log('   5. S\'assurer que les IDs correspondent');

  console.log('\n📝 Script SQL pour créer un ClientProduitEligible manuellement:');
  console.log(`
-- Remplacer [USER_ID] par l'ID Supabase Auth du nouveau compte
-- Remplacer [PRODUIT_ID] par l'ID du produit (ex: 32dd9cf8-15e2-4375-86ab-a95158d3ada1 pour TICPE)

INSERT INTO "ClientProduitEligible" (
  "clientId", 
  "produitId", 
  "statut", 
  "created_at", 
  "updated_at"
) VALUES (
  '[USER_ID]',
  '[PRODUIT_ID]',
  'eligible',
  NOW(),
  NOW()
);
  `);

  console.log('\n🎉 Test terminé !');
  console.log('   Créez un nouveau compte et testez le processus complet.');
}

// Exécuter le test
testNewAccountCharte().catch(error => {
  console.error('❌ Erreur lors du test:', error);
}); 