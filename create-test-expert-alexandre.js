import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestExpert() {
  console.log('👨‍💼 Création d\'un expert de test complet...\n');

  try {
    // 1. Créer un utilisateur Supabase Auth
    console.log('📝 Étape 1: Création de l\'utilisateur Supabase Auth...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'alexandre@profitum.fr',
      password: 'Expertprofitum',
      email_confirm: true,
      user_metadata: {
        name: 'Alexandre Expert',
        company_name: 'Profitum Expert Consulting',
        siren: '123456789',
        specializations: ['TICPE', 'DFS', 'CEE', 'Audit énergétique'],
        experience: '5-10 ans',
        location: 'Paris',
        user_type: 'expert'
      }
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur expert:', userError.message);
      return;
    }

    const authId = userData.user.id;
    console.log('✅ Utilisateur Supabase créé:', authId);

    // 2. Créer l'expert dans la table Expert
    console.log('📝 Étape 2: Création de l\'expert dans la table Expert...');
    const expertData = {
      id: authId, // Utiliser l'ID Supabase Auth
      auth_id: authId,
      email: 'alexandre@profitum.fr',
      password: '', // Ne pas stocker le mot de passe en clair
      name: 'Alexandre Expert',
      company_name: 'Profitum Expert Consulting',
      siren: '123456789',
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
      .select('*')
      .single();

    if (expertError) {
      console.error('❌ Erreur création expert dans la base:', expertError);
      // Supprimer l'utilisateur Supabase Auth en cas d'erreur
      await supabase.auth.admin.deleteUser(authId);
      return;
    }

    console.log('✅ Expert créé dans la base:', expert.id);

    // 3. Créer des données de test pour le dashboard expert
    console.log('📝 Étape 3: Création des données de test pour le dashboard...');
    
    // Créer quelques clients de test
    const testClients = [
      {
        id: 'client-test-1',
        email: 'client1@test.fr',
        company_name: 'Transport Express',
        city: 'Lyon',
        phone: '+33 4 12 34 56 78',
        statut: 'actif',
        created_at: new Date().toISOString(),
        auth_id: 'auth-client-1'
      },
      {
        id: 'client-test-2',
        email: 'client2@test.fr',
        company_name: 'Logistique Pro',
        city: 'Marseille',
        phone: '+33 4 98 76 54 32',
        statut: 'actif',
        created_at: new Date().toISOString(),
        auth_id: 'auth-client-2'
      }
    ];

    // Insérer les clients de test
    for (const client of testClients) {
      const { error: clientError } = await supabase
        .from('Client')
        .upsert([client], { onConflict: 'id' });
      
      if (clientError) {
        console.warn('⚠️ Erreur création client test:', clientError.message);
      }
    }

    // Créer des assignations d'experts
    const assignments = [
      {
        id: 'assignment-1',
        expert_id: expert.id,
        client_id: 'client-test-1',
        status: 'accepted',
        assignment_date: new Date().toISOString(),
        accepted_date: new Date().toISOString(),
        compensation_amount: 2500.0,
        compensation_status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'assignment-2',
        expert_id: expert.id,
        client_id: 'client-test-2',
        status: 'pending',
        assignment_date: new Date().toISOString(),
        compensation_amount: 1800.0,
        compensation_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insérer les assignations
    for (const assignment of assignments) {
      const { error: assignmentError } = await supabase
        .from('ExpertAssignment')
        .upsert([assignment], { onConflict: 'id' });
      
      if (assignmentError) {
        console.warn('⚠️ Erreur création assignation:', assignmentError.message);
      }
    }

    // 4. Créer des notifications de test
    const notifications = [
      {
        id: 'notif-1',
        user_id: expert.id,
        user_type: 'expert',
        type: 'assignment',
        title: 'Nouvelle mission disponible',
        content: 'Un nouveau client a besoin de vos services pour une optimisation TICPE.',
        priority: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'notif-2',
        user_id: expert.id,
        user_type: 'expert',
        type: 'message',
        title: 'Message reçu',
        content: 'Le client Transport Express vous a envoyé un message.',
        priority: 1,
        created_at: new Date().toISOString()
      }
    ];

    // Insérer les notifications
    for (const notification of notifications) {
      const { error: notifError } = await supabase
        .from('Notification')
        .upsert([notification], { onConflict: 'id' });
      
      if (notifError) {
        console.warn('⚠️ Erreur création notification:', notifError.message);
      }
    }

    console.log('\n🎉 Expert de test créé avec succès !');
    console.log('\n📋 Informations de connexion :');
    console.log('   Email: alexandre@profitum.fr');
    console.log('   Mot de passe: Expertprofitum');
    console.log('   ID Expert:', expert.id);
    console.log('\n🔗 Vous pouvez maintenant vous connecter sur le dashboard expert');
    console.log('   URL: http://localhost:5173/expert/dashboard');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'expert:', error);
  }
}

// Exécuter le script
createTestExpert().then(() => {
  console.log('\n✅ Script terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 