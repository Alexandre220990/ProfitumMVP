const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExpertTable() {
  try {
    console.log('🔍 Vérification de la structure de la table Expert...');
    
    // Récupérer un exemple d'expert pour voir la structure
    const { data: experts, error } = await supabase
      .from('Expert')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur lors de l\'accès à la table Expert:', error);
      return;
    }
    
    if (experts && experts.length > 0) {
      console.log('✅ Table Expert accessible');
      console.log('📋 Structure d\'un expert:');
      const expert = experts[0];
      Object.keys(expert).forEach(key => {
        console.log(`  - ${key}: ${typeof expert[key]} = ${expert[key]}`);
      });
    } else {
      console.log('⚠️ Table Expert vide, création d\'un expert de test...');
      
      const testExpert = {
        id: 'test-id-' + Date.now(),
        email: 'test@example.com',
        password: '',
        name: 'Test Expert',
        company_name: 'Test Company',
        siren: '123456789',
        specializations: ['TICPE'],
        experience: '5-10 ans',
        location: 'France',
        rating: 0,
        compensation: 0,
        description: 'Expert de test',
        status: 'active',
        disponibilites: null,
        certifications: null,
        card_number: null,
        card_expiry: null,
        card_cvc: null,
        abonnement: 'basic',
        auth_id: 'test-auth-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newExpert, error: insertError } = await supabase
        .from('Expert')
        .insert([testExpert])
        .select('*')
        .single();
      
      if (insertError) {
        console.log('❌ Erreur lors de la création de l\'expert de test:', insertError);
      } else {
        console.log('✅ Expert de test créé avec succès');
        console.log('📋 Structure de l\'expert créé:');
        Object.keys(newExpert).forEach(key => {
          console.log(`  - ${key}: ${typeof newExpert[key]} = ${newExpert[key]}`);
        });
        
        // Supprimer l'expert de test
        await supabase
          .from('Expert')
          .delete()
          .eq('id', newExpert.id);
        console.log('🗑️ Expert de test supprimé');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkExpertTable(); 