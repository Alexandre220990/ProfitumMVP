import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeExpertCreation() {
  console.log('🔧 Complétion de la création de l\'expert...\n');

  try {
    // Récupérer l'utilisateur existant
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs Auth:', authError.message);
      return;
    }

    const expertUser = authUsers.users.find(user => user.email === 'alexandre@profitum.fr');
    
    if (!expertUser) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }

    const authId = expertUser.id;
    console.log('✅ Utilisateur trouvé:', authId);

    // Créer l'expert dans la table Expert
    console.log('📝 Création de l\'expert dans la table Expert...');
    const expertData = {
      id: authId, // Utiliser l'ID Supabase Auth
      auth_id: authId,
      email: 'alexandre@profitum.fr',
      password: '', // Ne pas stocker le mot de passe en clair
      name: 'Alexandre Expert',
      company_name: 'Profitum Expert Consulting',
      siren: '987654321', // SIREN unique pour éviter les conflits
      specializations: ['TICPE', 'DFS', 'CEE', 'Audit énergétique'],
      experience: '5-10 ans',
      location: 'Paris',
      rating: 4.8,
      compensation: 25.0,
      description: 'Expert spécialisé en TICPE, DFS et CEE avec 8 ans d\'expérience. Consultant senior pour les entreprises de transport et logistique.',
      status: 'active',
      approval_status: 'approved',
      disponibilites: {
        lundi: { matin: true, apres_midi: true },
        mardi: { matin: true, apres_midi: true },
        mercredi: { matin: true, apres_midi: true },
        jeudi: { matin: true, apres_midi: true },
        vendredi: { matin: true, apres_midi: false }
      },
      certifications: ['Expert-comptable', 'Certification TICPE', 'Certification CEE', 'Formation continue'],
      card_number: null,
      card_expiry: null,
      card_cvc: null,
      abonnement: 'growth',
      website: 'https://profitum-expert.fr',
      linkedin: 'https://linkedin.com/in/alexandre-expert',
      languages: ['Français', 'Anglais'],
      availability: 'disponible',
      max_clients: 15,
      hourly_rate: 150.0,
      phone: '+33 1 23 45 67 89',
      approved_by: '61797a61-edde-4816-b818-00015b627fe1', // UID de l'administrateur grandjean.alexandre5@gmail.com
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .insert([expertData])
      .select()
      .single();

    if (expertError) {
      console.error('❌ Erreur création expert dans la base:', expertError.message);
      return;
    }

    console.log('✅ Expert créé avec succès dans la table Expert!');
    console.log('📧 Email: alexandre@profitum.fr');
    console.log('🔑 Mot de passe: Expertprofitum');
    console.log('🆔 ID Expert:', expert.id);
    console.log('✅ Statut: Actif et approuvé');
    console.log('✅ Approuvé par: grandjean.alexandre5@gmail.com');
    console.log('\n🔗 Vous pouvez maintenant vous connecter sur le dashboard expert');
    console.log('   URL: http://localhost:5173/expert/dashboard');

  } catch (error) {
    console.error('❌ Erreur lors de la complétion:', error);
  }
}

completeExpertCreation().catch(console.error); 