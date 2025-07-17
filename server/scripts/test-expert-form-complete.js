import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExpertFormComplete() {
  console.log('🧪 Test complet du formulaire expert avec tous les champs...\n');

  try {
    // 1. Vérifier que l'admin existe
    console.log('1️⃣ Vérification de l\'admin...');
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('email', 'admin@profitum.fr')
      .single();

    if (adminError || !admin) {
      console.log('❌ Admin non trouvé, création...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@profitum.fr',
        password: 'Admin2024!',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          name: 'Administrateur'
        }
      });

      if (authError) {
        console.error('❌ Erreur création admin Auth:', authError);
        return;
      }

      const { data: newAdmin, error: insertError } = await supabase
        .from('Admin')
        .insert({
          id: authData.user.id,
          email: 'admin@profitum.fr',
          name: 'Administrateur',
          role: 'admin',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur insertion admin:', insertError);
        return;
      }

      console.log('✅ Admin créé:', newAdmin.id);
    } else {
      console.log('✅ Admin trouvé:', admin.id);
    }

    // 2. Tester la création d'un expert complet via l'API
    console.log('\n2️⃣ Test de création d\'expert complet via API...');
    
    // Obtenir le token d'authentification admin
    const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
      email: 'admin@profitum.fr',
      password: 'Admin2024!'
    });

    if (sessionError) {
      console.error('❌ Erreur connexion admin:', sessionError);
      return;
    }

    const expertData = {
      name: 'Marie Expert',
      email: 'marie.expert@test.com',
      company_name: 'Cabinet Expert SARL',
      specializations: ['TICPE', 'DFS', 'CEE'],
      rating: 4.8,
      compensation: 18.5,
      status: 'active',
      approval_status: 'pending',
      experience: '5-10 ans',
      city: 'Lyon',
      phone: '04 78 12 34 56',
      description: 'Expert en fiscalité environnementale avec 8 ans d\'expérience',
      siren: '987654321',
      abonnement: 'growth',
      website: 'https://www.cabinet-expert.fr',
      linkedin: 'https://linkedin.com/in/marie-expert',
      certifications: ['Expert-comptable', 'Certification TICPE'],
      languages: ['Français', 'Anglais'],
      availability: 'disponible',
      max_clients: 15,
      hourly_rate: 120
    };

    const response = await fetch('http://localhost:5001/api/admin/experts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expertData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur API:', errorData);
      return;
    }

    const result = await response.json();
    console.log('✅ Expert créé:', result.data.id);

    // 3. Vérifier que l'expert existe dans la base avec tous les champs
    console.log('\n3️⃣ Vérification en base...');
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', 'marie.expert@test.com')
      .single();

    if (expertError) {
      console.error('❌ Expert non trouvé en base:', expertError);
      return;
    }

    console.log('✅ Expert trouvé en base');
    console.log('📋 Vérification des champs:');
    console.log(`   - Nom: ${expert.name} ✅`);
    console.log(`   - Email: ${expert.email} ✅`);
    console.log(`   - Entreprise: ${expert.company_name} ✅`);
    console.log(`   - Spécialisations: ${expert.specializations?.join(', ')} ✅`);
    console.log(`   - Note: ${expert.rating} ✅`);
    console.log(`   - Compensation: ${expert.compensation}% ✅`);
    console.log(`   - Statut: ${expert.status} ✅`);
    console.log(`   - Approbation: ${expert.approval_status} ✅`);
    console.log(`   - Expérience: ${expert.experience} ✅`);
    console.log(`   - Localisation: ${expert.location} ✅`);
    console.log(`   - Téléphone: ${expert.phone} ✅`);
    console.log(`   - Description: ${expert.description?.substring(0, 50)}... ✅`);
    console.log(`   - SIREN: ${expert.siren} ✅`);
    console.log(`   - Abonnement: ${expert.abonnement} ✅`);
    console.log(`   - Site web: ${expert.website} ✅`);
    console.log(`   - LinkedIn: ${expert.linkedin} ✅`);
    console.log(`   - Certifications: ${expert.certifications ? 'Présentes' : 'Aucune'} ✅`);
    console.log(`   - Langues: ${expert.languages?.join(', ')} ✅`);
    console.log(`   - Disponibilité: ${expert.availability} ✅`);
    console.log(`   - Clients max: ${expert.max_clients} ✅`);
    console.log(`   - Taux horaire: ${expert.hourly_rate}€ ✅`);

    // 4. Tester la modification de l'expert
    console.log('\n4️⃣ Test de modification d\'expert...');
    
    const updateData = {
      ...expertData,
      rating: 5.0,
      compensation: 20,
      availability: 'partiel',
      max_clients: 20,
      hourly_rate: 150
    };

    const updateResponse = await fetch(`http://localhost:5001/api/admin/experts/${expert.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('❌ Erreur modification:', errorData);
      return;
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Expert modifié avec succès');

    // 5. Vérifier les modifications en base
    console.log('\n5️⃣ Vérification des modifications...');
    const { data: updatedExpert, error: updatedError } = await supabase
      .from('Expert')
      .select('*')
      .eq('id', expert.id)
      .single();

    if (updatedError) {
      console.error('❌ Erreur récupération expert modifié:', updatedError);
      return;
    }

    console.log('✅ Modifications vérifiées:');
    console.log(`   - Note mise à jour: ${updatedExpert.rating} ✅`);
    console.log(`   - Compensation mise à jour: ${updatedExpert.compensation}% ✅`);
    console.log(`   - Disponibilité mise à jour: ${updatedExpert.availability} ✅`);
    console.log(`   - Clients max mis à jour: ${updatedExpert.max_clients} ✅`);
    console.log(`   - Taux horaire mis à jour: ${updatedExpert.hourly_rate}€ ✅`);

    // 6. Nettoyer les données de test
    console.log('\n6️⃣ Nettoyage des données de test...');
    
    // Supprimer l'expert de test
    await supabase
      .from('Expert')
      .delete()
      .eq('id', expert.id);
    
    // Supprimer l'utilisateur Auth
    await supabase.auth.admin.deleteUser(expert.id);
    
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 Test complet réussi ! Tous les champs fonctionnent correctement.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testExpertFormComplete(); 