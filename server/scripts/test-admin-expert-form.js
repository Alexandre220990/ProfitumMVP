const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminExpertForm() {
  console.log('🧪 Test du formulaire d\'ajout d\'expert...\n');

  try {
    // 1. Vérifier que l'admin existe
    console.log('1. Vérification de l\'admin...');
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('email', 'admin@profitum.fr')
      .single();

    if (adminError || !admin) {
      console.log('❌ Admin non trouvé, création...');
      // Créer l'admin si nécessaire
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

    // 2. Tester la création d'un expert via l'API
    console.log('\n2. Test de création d\'expert via API...');
    
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
      name: 'Jean Dupont',
      email: 'jean.dupont@test.com',
      company_name: 'Expert Conseil SARL',
      specializations: ['TICPE', 'DFS'],
      rating: 4.5,
      compensation: 15,
      status: 'active',
      approval_status: 'pending',
      experience: '5-10 ans',
      city: 'Paris',
      phone: '0123456789',
      description: 'Expert en fiscalité environnementale',
      siren: '123456789',
      abonnement: 'growth'
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

    // 3. Vérifier que l'expert existe dans la base
    console.log('\n3. Vérification en base...');
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', 'jean.dupont@test.com')
      .single();

    if (expertError) {
      console.error('❌ Expert non trouvé en base:', expertError);
      return;
    }

    console.log('✅ Expert trouvé en base:', {
      id: expert.id,
      name: expert.name,
      email: expert.email,
      specializations: expert.specializations,
      approval_status: expert.approval_status
    });

    // 4. Vérifier que l'utilisateur Auth existe
    console.log('\n4. Vérification utilisateur Auth...');
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(expert.id);

    if (authUserError) {
      console.error('❌ Utilisateur Auth non trouvé:', authUserError);
      return;
    }

    console.log('✅ Utilisateur Auth trouvé:', {
      id: authUser.user.id,
      email: authUser.user.email,
      role: authUser.user.user_metadata?.role
    });

    // 5. Vérifier le log d'audit
    console.log('\n5. Vérification log d\'audit...');
    const { data: auditLog, error: auditError } = await supabase
      .from('AdminAuditLog')
      .select('*')
      .eq('action', 'expert_created')
      .eq('record_id', expert.id)
      .single();

    if (auditError) {
      console.error('❌ Log d\'audit non trouvé:', auditError);
      return;
    }

    console.log('✅ Log d\'audit trouvé:', {
      action: auditLog.action,
      table_name: auditLog.table_name,
      record_id: auditLog.record_id
    });

    console.log('\n🎉 Tous les tests sont passés ! Le formulaire d\'ajout d\'expert fonctionne correctement.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAdminExpertForm(); 