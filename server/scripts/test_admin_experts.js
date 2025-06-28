const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminExperts() {
  try {
    console.log('🔍 Test de la route admin experts...');
    
    // 1. Vérifier que la table Expert contient des données
    console.log('\n1. Vérification de la table Expert...');
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, name, email, company_name, specializations, rating, compensation, status, approval_status, created_at')
      .limit(5);
    
    if (expertsError) {
      console.error('❌ Erreur lors de la récupération des experts:', expertsError);
      return;
    }
    
    console.log(`✅ ${experts?.length || 0} experts trouvés dans la base`);
    if (experts && experts.length > 0) {
      console.log('📋 Premier expert:', {
        id: experts[0].id,
        name: experts[0].name,
        email: experts[0].email,
        specializations: experts[0].specializations,
        status: experts[0].status,
        approval_status: experts[0].approval_status
      });
    }
    
    // 2. Vérifier qu'il y a au moins un admin
    console.log('\n2. Vérification de la table Admin...');
    const { data: admins, error: adminsError } = await supabase
      .from('Admin')
      .select('id, email, name')
      .limit(1);
    
    if (adminsError) {
      console.error('❌ Erreur lors de la récupération des admins:', adminsError);
      return;
    }
    
    console.log(`✅ ${admins?.length || 0} admin(s) trouvé(s) dans la base`);
    if (admins && admins.length > 0) {
      console.log('📋 Premier admin:', {
        id: admins[0].id,
        email: admins[0].email,
        name: admins[0].name
      });
    }
    
    // 3. Test direct de la requête SQL qui pose problème
    console.log('\n3. Test de la requête SQL problématique...');
    const { data: testExperts, error: testError } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        specializations,
        rating,
        compensation,
        status,
        approval_status,
        created_at,
        approved_at,
        approved_by,
        experience
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (testError) {
      console.error('❌ Erreur dans la requête SQL:', testError);
      console.error('Message:', testError.message);
      console.error('Details:', testError.details);
      console.error('Hint:', testError.hint);
    } else {
      console.log('✅ Requête SQL fonctionne correctement !');
      console.log(`📊 ${testExperts?.length || 0} experts retournés`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testAdminExperts(); 