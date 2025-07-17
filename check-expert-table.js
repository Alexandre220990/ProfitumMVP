import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExpertTable() {
  console.log('🔍 Vérification de la structure de la table Expert...\n');

  try {
    // Essayer de récupérer un expert existant pour voir la structure
    const { data: experts, error } = await supabase
      .from('Expert')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erreur accès table Expert:', error.message);
      return;
    }

    if (experts && experts.length > 0) {
      console.log('✅ Structure de la table Expert:');
      console.log(JSON.stringify(experts[0], null, 2));
    } else {
      console.log('📋 Table Expert vide, création d\'un expert de test...');
      
      // Créer un expert simple
      const expertData = {
        id: '10064b1d-09ec-40f0-9d47-869615069113', // ID de l'utilisateur créé
        username: 'Expert Test',
        email: 'expert.test@profitum.com',
        phone: '+33123456789',
        specialization: 'TICPE',
        experience_years: 5,
        is_verified: true,
        is_available: true
      };

      const { data: newExpert, error: createError } = await supabase
        .from('Expert')
        .insert([expertData])
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création expert:', createError.message);
        console.log('📋 Tentative avec structure minimale...');
        
        // Essayer avec juste les champs essentiels
        const minimalExpertData = {
          id: '10064b1d-09ec-40f0-9d47-869615069113',
          username: 'Expert Test',
          email: 'expert.test@profitum.com'
        };

        const { data: minimalExpert, error: minimalError } = await supabase
          .from('Expert')
          .insert([minimalExpertData])
          .select()
          .single();

        if (minimalError) {
          console.error('❌ Erreur création expert minimal:', minimalError.message);
        } else {
          console.log('✅ Expert créé avec structure minimale:', minimalExpert);
        }
      } else {
        console.log('✅ Expert créé avec succès:', newExpert);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkExpertTable().catch(console.error); 