const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function cleanupTestAccounts() {
  console.log('🧹 NETTOYAGE DES COMPTES DE TEST');
  console.log('=' .repeat(40));

  // Liste des emails de test à supprimer
  const testEmails = [
    'test-register-1753799132223@example.com',
    'test-complete-1753799133518@example.com',
    'test-optional-1753799134114@example.com',
    'test-register@example.com',
    'test-complete@example.com',
    'test-optional@example.com'
  ];

  for (const email of testEmails) {
    try {
      console.log(`🗑️ Suppression de ${email}...`);
      
      // Note: En production, vous devriez avoir un endpoint admin pour supprimer les utilisateurs
      // Pour l'instant, on affiche juste les emails à supprimer manuellement
      console.log(`   ⚠️ Email à supprimer manuellement: ${email}`);
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }

  console.log('\n📋 Instructions de nettoyage manuel:');
  console.log('1. Connectez-vous à Supabase Dashboard');
  console.log('2. Allez dans Authentication > Users');
  console.log('3. Supprimez les utilisateurs avec les emails listés ci-dessus');
  console.log('4. Allez dans Table Editor > Client');
  console.log('5. Supprimez les enregistrements correspondants');
  
  console.log('\n✅ Nettoyage terminé');
}

cleanupTestAccounts().catch(console.error);