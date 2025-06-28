require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCharteProcess() {
  console.log('🧪 Test du processus complet de signature de charte\n');

  const CLIENT_PRODUIT_ID = 'e87d3ef4-a394-4505-8fcc-41a56005c344';
  const USER_ID = '0538de29-4287-4c28-b76a-b65ef993f393';

  console.log('📋 Processus attendu:');
  console.log('   1. ✅ Page TICPE chargée');
  console.log('   2. ✅ Hook useCharteSignature initialisé');
  console.log('   3. ✅ Vérification de signature existante');
  console.log('   4. ✅ isCharterSigned = false (pas de signature)');
  console.log('   5. ✅ Étape 1 affichée comme "current"');
  console.log('   6. ✅ Bouton "Signer la charte" visible');
  console.log('   7. ✅ Clic sur "Signer la charte"');
  console.log('   8. ✅ Dialogue de charte ouvert');
  console.log('   9. ✅ Case "J\'accepte les CGU" cochée');
  console.log('   10. ✅ Clic sur "Signer la charte" dans le dialogue');
  console.log('   11. ✅ handleCharterSign() appelé');
  console.log('   12. ✅ signCharte() du hook appelé');
  console.log('   13. ✅ API POST /api/charte-signature appelée');
  console.log('   14. ✅ Signature créée en base de données');
  console.log('   15. ✅ isCharterSigned devient true');
  console.log('   16. ✅ Dialogue affiche "Charte Validée"');
  console.log('   17. ✅ Étape 1 devient "completed"');
  console.log('   18. ✅ Étape 2 devient "current"');
  console.log('   19. ✅ Utilisateur peut passer à l\'étape 2');

  console.log('\n🔍 Points de vérification côté frontend:');
  console.log('   1. Ouvrir la console du navigateur (F12)');
  console.log('   2. Aller sur la page TICPE');
  console.log('   3. Vérifier les logs du hook:');
  console.log('      - "Hook useCharteSignature appelé"');
  console.log('      - "clientProduitEligibleId reçu: [ID]"');
  console.log('      - "checkSignature appelée"');
  console.log('      - "Vérification de la signature pour: [ID]"');
  console.log('      - "Aucune signature trouvée" (si pas de signature)');
  console.log('   4. Vérifier que l\'étape 1 est bleue (current)');
  console.log('   5. Cliquer sur "Signer la charte"');
  console.log('   6. Vérifier que le dialogue s\'ouvre');
  console.log('   7. Cocher "J\'accepte les CGU"');
  console.log('   8. Cliquer sur "Signer la charte"');
  console.log('   9. Vérifier les logs:');
  console.log('      - "Début de la signature de la charte"');
  console.log('      - "Signature de la charte pour: [ID]"');
  console.log('      - "Charte signée avec succès"');
  console.log('   10. Vérifier que le dialogue change pour "Charte Validée"');
  console.log('   11. Vérifier que l\'étape 1 devient verte (completed)');
  console.log('   12. Vérifier que l\'étape 2 devient bleue (current)');

  console.log('\n🔍 Points de vérification côté backend:');
  console.log('   1. Vérifier les logs du serveur:');
  console.log('      - "Enregistrement signature charte"');
  console.log('      - "ClientProduitEligible trouvé"');
  console.log('      - "Signature enregistrée avec succès"');
  console.log('   2. Vérifier l\'onglet Network du navigateur:');
  console.log('      - Requête POST /api/charte-signature');
  console.log('      - Status 200 OK');
  console.log('      - Body avec clientProduitEligibleId');
  console.log('      - Headers avec Authorization (token Supabase)');

  console.log('\n🔍 Points de vérification en base de données:');
  console.log('   1. Vérifier la table client_charte_signature:');
  console.log('      - Nouvelle ligne créée');
  console.log('      - client_id = [USER_ID]');
  console.log('      - client_produit_eligible_id = [CLIENT_PRODUIT_ID]');
  console.log('      - signature_date = timestamp actuel');
  console.log('      - ip_address et user_agent renseignés');

  console.log('\n🎯 Résultat attendu:');
  console.log('   ✅ La signature est enregistrée en base');
  console.log('   ✅ Le frontend affiche "Charte Validée"');
  console.log('   ✅ L\'étape 1 est marquée comme completed');
  console.log('   ✅ L\'utilisateur peut passer à l\'étape 2');
  console.log('   ✅ Le processus est fluide et sans erreur');

  console.log('\n⚠️ Problèmes potentiels:');
  console.log('   1. Token Supabase manquant ou invalide');
  console.log('   2. clientProduitEligibleId incorrect');
  console.log('   3. Erreur CORS ou réseau');
  console.log('   4. Hook useCharteSignature non appelé');
  console.log('   5. État isCharterSigned non mis à jour');
  console.log('   6. Dialogue ne change pas d\'apparence');

  console.log('\n🔧 Solutions:');
  console.log('   1. Vérifier que l\'utilisateur est connecté');
  console.log('   2. Vérifier que le token Supabase est valide');
  console.log('   3. Vérifier les logs de la console');
  console.log('   4. Vérifier l\'onglet Network');
  console.log('   5. Vérifier les logs du serveur');
  console.log('   6. Vérifier la base de données');

  console.log('\n🎉 Test terminé !');
  console.log('   Suivez les étapes ci-dessus pour diagnostiquer le problème.');
}

// Exécuter le test
testCharteProcess().catch(error => {
  console.error('❌ Erreur lors du test:', error);
}); 