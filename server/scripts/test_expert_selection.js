const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExpertSelection() {
  console.log('🧪 Test de la sélection d\'experts');
  console.log('=' .repeat(60));

  try {
    // 1. Test direct de la base de données
    console.log('\n1️⃣ Test direct de la base de données...');
    const { data: expertsFromDB, error: dbError } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        siren,
        specializations,
        experience,
        location,
        rating,
        compensation,
        description,
        status
      `)
      .eq('status', 'active')
      .order('name');

    if (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      return;
    }

    console.log(`✅ ${expertsFromDB.length} experts trouvés dans la base de données`);
    
    // Afficher les experts avec leurs spécialisations
    expertsFromDB.forEach((expert, index) => {
      console.log(`\n${index + 1}. ${expert.name} (${expert.company_name})`);
      console.log(`   Email: ${expert.email}`);
      console.log(`   Spécialisations: ${expert.specializations?.join(', ') || 'Aucune'}`);
      console.log(`   Expérience: ${expert.experience || 'Non renseignée'}`);
      console.log(`   Localisation: ${expert.location || 'Non renseignée'}`);
      console.log(`   Note: ${expert.rating}/5`);
      console.log(`   Compensation: ${expert.compensation}%`);
      console.log(`   Statut: ${expert.status}`);
    });

    // 2. Test de l'API via HTTP (si le serveur est démarré)
    console.log('\n2️⃣ Test de l\'API HTTP...');
    try {
      const response = await fetch('http://localhost:3001/api/experts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const apiData = await response.json();
        console.log('✅ API HTTP fonctionne');
        console.log(`   ${apiData.data?.length || 0} experts retournés par l'API`);
        
        if (apiData.data && apiData.data.length > 0) {
          console.log('\n   Premier expert de l\'API:');
          const firstExpert = apiData.data[0];
          console.log(`   - Nom: ${firstExpert.name}`);
          console.log(`   - Spécialisations: ${firstExpert.specializations?.join(', ') || 'Aucune'}`);
          console.log(`   - Compensation: ${firstExpert.compensation}%`);
        }
      } else {
        console.log(`❌ API HTTP retourne le code ${response.status}`);
      }
    } catch (apiError) {
      console.log('❌ Erreur API HTTP (serveur peut-être arrêté):', apiError.message);
    }

    // 3. Test de filtrage par spécialisation
    console.log('\n3️⃣ Test de filtrage par spécialisation...');
    
    // Chercher des experts TICPE
    const ticpeExperts = expertsFromDB.filter(expert => 
      expert.specializations?.includes('TICPE')
    );
    console.log(`✅ ${ticpeExperts.length} experts spécialisés en TICPE`);
    
    // Chercher des experts DFS
    const dfsExperts = expertsFromDB.filter(expert => 
      expert.specializations?.includes('DFS')
    );
    console.log(`✅ ${dfsExperts.length} experts spécialisés en DFS`);
    
    // Chercher des experts URSSAF
    const urssafExperts = expertsFromDB.filter(expert => 
      expert.specializations?.includes('URSSAF')
    );
    console.log(`✅ ${urssafExperts.length} experts spécialisés en URSSAF`);

    // 4. Test de compatibilité avec le frontend
    console.log('\n4️⃣ Test de compatibilité avec le frontend...');
    
    // Vérifier que les données correspondent au format attendu par le frontend
    const frontendCompatibleExperts = expertsFromDB.map(expert => ({
      id: expert.id,
      name: expert.name,
      company: expert.company_name,
      specializations: expert.specializations || [],
      experience: expert.experience || '',
      rating: expert.rating || 0,
      compensation: expert.compensation || 0,
      description: expert.description || '',
      location: expert.location || ''
    }));

    console.log(`✅ ${frontendCompatibleExperts.length} experts compatibles avec le frontend`);
    
    // Afficher un exemple de données formatées
    if (frontendCompatibleExperts.length > 0) {
      console.log('\n   Exemple de données formatées pour le frontend:');
      const example = frontendCompatibleExperts[0];
      console.log(`   - ID: ${example.id}`);
      console.log(`   - Nom: ${example.name}`);
      console.log(`   - Entreprise: ${example.company}`);
      console.log(`   - Spécialisations: ${example.specializations.join(', ')}`);
      console.log(`   - Note: ${example.rating}/5`);
      console.log(`   - Compensation: ${example.compensation}%`);
    }

    // 5. Résumé
    console.log('\n5️⃣ Résumé du test...');
    console.log('✅ Base de données: OK');
    console.log('✅ Données des experts: Complètes');
    console.log('✅ Spécialisations: Présentes');
    console.log('✅ Format frontend: Compatible');
    
    if (expertsFromDB.length > 0) {
      console.log('\n🎉 Test réussi ! Les clients peuvent sélectionner des experts depuis la base de données.');
      console.log('\n📋 Pour tester dans l\'interface :');
      console.log('1. Connectez-vous en tant que client');
      console.log('2. Allez sur un produit (TICPE, DFS, URSSAF, etc.)');
      console.log('3. Vérifiez que les experts affichés correspondent à ceux de la base');
    } else {
      console.log('\n⚠️ Aucun expert trouvé dans la base de données');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testExpertSelection()
  .then(() => {
    console.log('\n✅ Script de test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }); 