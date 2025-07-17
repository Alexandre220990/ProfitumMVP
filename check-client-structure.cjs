const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxza3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3NDkzMywiZXhwIjoyMDUwNTUwOTMzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClientStructure() {
  console.log('🔍 Vérification structure ClientProduitEligible...\n');

  try {
    // 1. Vérifier la structure de la table
    console.log('1️⃣ Structure de la table ClientProduitEligible...');
    const { data: structure, error: structureError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erreur structure:', structureError);
    } else {
      console.log('✅ Structure OK');
      if (structure && structure.length > 0) {
        const columns = Object.keys(structure[0]);
        console.log('   Colonnes disponibles:', columns);
      }
    }

    // 2. Récupérer un dossier avec la bonne structure
    console.log('\n2️⃣ Récupération d\'un dossier...');
    const { data: dossiers, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(1);

    if (dossiersError) {
      console.error('❌ Erreur récupération dossiers:', dossiersError);
    } else if (dossiers && dossiers.length > 0) {
      const dossier = dossiers[0];
      console.log('✅ Dossier trouvé:', dossier);
      console.log('   ID:', dossier.id);
      console.log('   Client ID:', dossier.clientId || dossier.client_id);
      console.log('   Expert ID:', dossier.expertId || dossier.expert_id);
    } else {
      console.log('⚠️ Aucun dossier trouvé');
    }

    // 3. Tester avec les différents noms de colonnes possibles
    console.log('\n3️⃣ Test avec différents noms de colonnes...');
    
    // Test avec clientId
    const { data: testClientId, error: errorClientId } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, expertId')
      .limit(1);

    if (errorClientId) {
      console.log('❌ clientId/expertId ne fonctionne pas:', errorClientId.message);
    } else {
      console.log('✅ clientId/expertId fonctionne:', testClientId);
    }

    // Test avec client_id
    const { data: testClientUnderscore, error: errorClientUnderscore } = await supabase
      .from('ClientProduitEligible')
      .select('id, client_id, expert_id')
      .limit(1);

    if (errorClientUnderscore) {
      console.log('❌ client_id/expert_id ne fonctionne pas:', errorClientUnderscore.message);
    } else {
      console.log('✅ client_id/expert_id fonctionne:', testClientUnderscore);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkClientStructure().then(() => {
  console.log('\n✅ Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 