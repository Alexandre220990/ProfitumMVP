const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxanFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProduitsEligibles() {
  console.log('🔍 Analyse détaillée des produits éligibles\n');
  
  const clientId = '25274ba6-67e6-4151-901c-74851fe2d82a';
  const clientEmail = 'grandjean.laporte@gmail.com';
  
  try {
    // 1. Vérifier si le client existe
    console.log('1️⃣ Vérification de l\'existence du client...');
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.log('❌ Erreur client:', clientError.message);
      return;
    }
    
    if (!client) {
      console.log('❌ Client non trouvé');
      return;
    }
    
    console.log('✅ Client trouvé:', {
      id: client.id,
      email: client.email,
      user_type: client.user_type,
      created_at: client.created_at
    });

    // 2. Vérifier les produits éligibles directement
    console.log('\n2️⃣ Vérification des produits éligibles...');
    const { data: produitsEligibles, error: produitsError } = await supabase
      .from('client_produit_eligible')
      .select('*')
      .eq('client_id', clientId);
    
    if (produitsError) {
      console.log('❌ Erreur produits éligibles:', produitsError.message);
      return;
    }
    
    console.log('📊 Produits éligibles trouvés:', produitsEligibles.length);
    if (produitsEligibles.length > 0) {
      produitsEligibles.forEach((produit, index) => {
        console.log(`   ${index + 1}. ID: ${produit.id}`);
        console.log(`      Produit: ${produit.produit_id}`);
        console.log(`      Statut: ${produit.statut}`);
        console.log(`      Créé le: ${produit.created_at}`);
        console.log(`      Modifié le: ${produit.updated_at}`);
        console.log('');
      });
    }

    // 3. Vérifier les politiques RLS
    console.log('3️⃣ Vérification des politiques RLS...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'client_produit_eligible' });
    
    if (rlsError) {
      console.log('⚠️ Impossible de récupérer les politiques RLS:', rlsError.message);
    } else {
      console.log('📋 Politiques RLS trouvées:', rlsPolicies?.length || 0);
    }

    // 4. Tester avec un token utilisateur
    console.log('\n4️⃣ Test avec authentification utilisateur...');
    
    // Simuler une connexion utilisateur
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: clientEmail,
      password: 'profitum'
    });
    
    if (authError) {
      console.log('❌ Erreur authentification:', authError.message);
    } else {
      console.log('✅ Authentification réussie');
      console.log('Token utilisateur:', authData.session?.access_token ? 'Présent' : 'Absent');
      
      // Tester la requête avec le token utilisateur
      const { data: produitsWithAuth, error: produitsAuthError } = await supabase
        .from('client_produit_eligible')
        .select('*')
        .eq('client_id', clientId);
      
      if (produitsAuthError) {
        console.log('❌ Erreur avec auth:', produitsAuthError.message);
      } else {
        console.log('✅ Produits avec auth:', produitsWithAuth.length);
      }
    }

    // 5. Vérifier la structure de la table
    console.log('\n5️⃣ Vérification de la structure de la table...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'client_produit_eligible' });
    
    if (tableError) {
      console.log('⚠️ Impossible de récupérer les infos de table:', tableError.message);
    } else {
      console.log('📋 Structure de la table:', tableInfo);
    }

    // 6. Vérifier les contraintes et index
    console.log('\n6️⃣ Vérification des contraintes...');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'client_produit_eligible' });
    
    if (constraintsError) {
      console.log('⚠️ Impossible de récupérer les contraintes:', constraintsError.message);
    } else {
      console.log('🔒 Contraintes trouvées:', constraints?.length || 0);
    }

    // 7. Test de requête brute
    console.log('\n7️⃣ Test de requête brute...');
    const { data: rawQuery, error: rawError } = await supabase
      .rpc('test_raw_query', { 
        query: `SELECT COUNT(*) as count FROM client_produit_eligible WHERE client_id = '${clientId}'` 
      });
    
    if (rawError) {
      console.log('⚠️ Impossible d\'exécuter la requête brute:', rawError.message);
    } else {
      console.log('🔍 Résultat requête brute:', rawQuery);
    }

    // 8. Vérifier les logs d'accès
    console.log('\n8️⃣ Vérification des logs...');
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.log('⚠️ Impossible de récupérer les logs:', logsError.message);
    } else {
      console.log('📝 Logs récents:', logs?.length || 0);
      if (logs && logs.length > 0) {
        logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.action} - ${log.created_at}`);
        });
      }
    }

    // 9. Test de l'API backend
    console.log('\n9️⃣ Test de l\'API backend...');
    const axios = require('axios');
    
    try {
      const response = await axios.get(`http://localhost:5001/api/produits-eligibles/client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${authData?.session?.access_token || 'test-token'}`
        }
      });
      
      console.log('✅ API backend - Status:', response.status);
      console.log('✅ API backend - Data:', response.data);
    } catch (apiError) {
      console.log('❌ Erreur API backend:', apiError.response?.status, apiError.response?.data);
    }

    console.log('\n🎯 Résumé de l\'analyse:');
    console.log(`   - Client: ${client ? 'Trouvé' : 'Non trouvé'}`);
    console.log(`   - Produits éligibles: ${produitsEligibles.length}`);
    console.log(`   - Authentification: ${authData ? 'Réussie' : 'Échec'}`);
    console.log(`   - Problème probable: ${produitsEligibles.length === 0 ? 'Aucun produit éligible en base' : 'Politiques RLS ou permissions'}`);

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter l'analyse
testProduitsEligibles(); 