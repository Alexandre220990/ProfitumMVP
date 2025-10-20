/**
 * Script pour vérifier et identifier les données de démonstration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDemoData() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         Vérification des données de démonstration            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Vérifier les clients
    console.log('📋 1. CLIENTS\n');
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, company_name, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (clientsError) {
      console.error('❌ Erreur clients:', clientsError.message);
    } else {
      console.log(`   Total : ${clients.length} clients récents\n`);
      
      clients.forEach((client, index) => {
        const isDemoLike = 
          client.email?.includes('demo') ||
          client.email?.includes('test') ||
          client.company_name?.toLowerCase().includes('demo') ||
          client.company_name?.toLowerCase().includes('test') ||
          client.first_name?.toLowerCase().includes('demo') ||
          client.first_name?.toLowerCase().includes('test');
        
        const marker = isDemoLike ? '⚠️  [DEMO?]' : '✅';
        console.log(`   ${marker} ${client.company_name || 'Sans nom'}`);
        console.log(`      Email: ${client.email}`);
        console.log(`      ID: ${client.id.substring(0, 8)}...`);
        console.log(`      Créé: ${new Date(client.created_at).toLocaleDateString('fr-FR')}\n`);
      });
    }

    // 2. Vérifier les documents
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📄 2. DOCUMENTS (ClientProcessDocument)\n');
    
    const { data: documents, error: docsError } = await supabase
      .from('ClientProcessDocument')
      .select(`
        id,
        filename,
        document_type,
        status,
        created_at,
        client_id,
        Client (
          email,
          company_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (docsError) {
      console.error('❌ Erreur documents:', docsError.message);
    } else {
      console.log(`   Total : ${documents.length} documents récents\n`);
      
      documents.forEach((doc) => {
        const clientInfo = doc.Client || {};
        const isDemoLike = 
          doc.filename?.toLowerCase().includes('demo') ||
          doc.filename?.toLowerCase().includes('test') ||
          clientInfo.email?.includes('demo') ||
          clientInfo.email?.includes('test');
        
        const marker = isDemoLike ? '⚠️  [DEMO?]' : '✅';
        console.log(`   ${marker} ${doc.filename}`);
        console.log(`      Type: ${doc.document_type}`);
        console.log(`      Client: ${clientInfo.company_name || 'N/A'}`);
        console.log(`      Statut: ${doc.status}`);
        console.log(`      Créé: ${new Date(doc.created_at).toLocaleDateString('fr-FR')}\n`);
      });
    }

    // 3. Vérifier les produits
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🏷️  3. PRODUITS ÉLIGIBLES\n');
    
    const { data: products, error: productsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, type, is_active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (productsError) {
      console.error('❌ Erreur produits:', productsError.message);
    } else {
      console.log(`   Total : ${products.length} produits\n`);
      
      products.forEach((product) => {
        const isDemoLike = 
          product.nom?.toLowerCase().includes('demo') ||
          product.nom?.toLowerCase().includes('test');
        
        const marker = isDemoLike ? '⚠️  [DEMO?]' : '✅';
        const status = product.is_active ? '🟢 Actif' : '🔴 Inactif';
        console.log(`   ${marker} ${product.nom}`);
        console.log(`      Type: ${product.type}`);
        console.log(`      Statut: ${status}\n`);
      });
    }

    // 4. Vérifier les utilisateurs
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('👥 4. UTILISATEURS (auth.users)\n');
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur utilisateurs:', usersError.message);
    } else {
      console.log(`   Total : ${users.length} utilisateurs\n`);
      
      users.forEach((user) => {
        const isDemoLike = 
          user.email?.includes('demo') ||
          user.email?.includes('test');
        
        const marker = isDemoLike ? '⚠️  [DEMO?]' : '✅';
        console.log(`   ${marker} ${user.email}`);
        console.log(`      ID: ${user.id.substring(0, 8)}...`);
        console.log(`      Créé: ${new Date(user.created_at).toLocaleDateString('fr-FR')}\n`);
      });
    }

    // 5. Résumé
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RÉSUMÉ\n');
    
    const demoClients = clients?.filter(c => 
      c.email?.includes('demo') || c.email?.includes('test') ||
      c.company_name?.toLowerCase().includes('demo') ||
      c.company_name?.toLowerCase().includes('test')
    ).length || 0;
    
    const demoDocs = documents?.filter(d => 
      d.filename?.toLowerCase().includes('demo') ||
      d.filename?.toLowerCase().includes('test')
    ).length || 0;
    
    const demoProducts = products?.filter(p => 
      p.nom?.toLowerCase().includes('demo') ||
      p.nom?.toLowerCase().includes('test')
    ).length || 0;

    const demoUsers = users?.filter(u => 
      u.email?.includes('demo') || u.email?.includes('test')
    ).length || 0;

    console.log(`   Clients potentiellement démo  : ${demoClients}`);
    console.log(`   Documents potentiellement démo: ${demoDocs}`);
    console.log(`   Produits potentiellement démo : ${demoProducts}`);
    console.log(`   Utilisateurs potentiellement démo: ${demoUsers}\n`);

    if (demoClients === 0 && demoDocs === 0 && demoProducts === 0 && demoUsers === 0) {
      console.log('   ✅ Aucune donnée de démonstration détectée !\n');
    } else {
      console.log('   ⚠️  Données de démonstration potentielles détectées\n');
      console.log('   📋 Actions recommandées:');
      console.log('      1. Vérifier manuellement les entrées marquées [DEMO?]');
      console.log('      2. Supprimer si nécessaire via l\'interface admin\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkDemoData().catch(console.error);

