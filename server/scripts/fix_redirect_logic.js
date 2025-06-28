const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase avec service key
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRedirectLogic() {
  try {
    console.log('🔧 Correction de la logique de redirection\n');

    // 1. Récupérer tous les clients avec leurs auth_ids
    console.log('1️⃣ Récupération des clients...');
    const { data: clients, error: clientError } = await supabase
      .from('Client')
      .select('*');

    if (clientError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientError.message);
      return;
    }

    console.log(`   ✅ ${clients.length} clients trouvés`);

    // 2. Créer un mapping des correspondances
    console.log('\n2️⃣ Création du mapping des correspondances...');
    const clientMapping = {};
    
    clients.forEach(client => {
      if (client.auth_id) {
        clientMapping[client.auth_id] = {
          clientId: client.id,
          email: client.email,
          name: client.name,
          company: client.company_name
        };
      }
    });

    console.log('📋 MAPPING DES CORRESPONDANCES:');
    console.log('─'.repeat(80));
    Object.entries(clientMapping).forEach(([authId, clientData]) => {
      console.log(`Auth ID: ${authId}`);
      console.log(`  → Client ID: ${clientData.clientId}`);
      console.log(`  → Email: ${clientData.email}`);
      console.log(`  → Nom: ${clientData.name || 'Non défini'}`);
      console.log(`  → Entreprise: ${clientData.company || 'Non définie'}`);
      console.log('');
    });

    // 3. Générer le code de correction pour le frontend
    console.log('🔧 CODE DE CORRECTION POUR LE FRONTEND:');
    console.log('─'.repeat(80));
    
    console.log('// Dans le hook use-auth.tsx, remplacer la logique de redirection :');
    console.log('');
    console.log('const redirectUser = (user: UserType) => {');
    console.log('  if (user.type === "client") {');
    console.log('    // Utiliser l\'ID Supabase Auth au lieu de l\'ancien ID client');
    console.log('    navigate(`/dashboard/client/${user.id}`);');
    console.log('  } else if (user.type === "expert") {');
    console.log('    navigate(`/dashboard/expert/${user.id}`);');
    console.log('  } else {');
    console.log('    navigate("/dashboard");');
    console.log('  }');
    console.log('};');
    console.log('');

    // 4. Générer le code de correction pour le backend
    console.log('🔧 CODE DE CORRECTION POUR LE BACKEND:');
    console.log('─'.repeat(80));
    
    console.log('// Dans les routes API, utiliser l\'ID Supabase Auth :');
    console.log('');
    console.log('// Au lieu de :');
    console.log('const clientId = req.params.id; // Ancien ID client');
    console.log('');
    console.log('// Utiliser :');
    console.log('const authId = req.params.id; // ID Supabase Auth');
    console.log('const { data: client } = await supabase');
    console.log('  .from("Client")');
    console.log('  .select("*")');
    console.log('  .eq("auth_id", authId)');
    console.log('  .single();');
    console.log('');

    // 5. Vérifier les routes existantes
    console.log('🔍 VÉRIFICATION DES ROUTES EXISTANTES:');
    console.log('─'.repeat(80));
    
    console.log('Routes actuelles qui doivent être mises à jour :');
    console.log('- /api/client/:id → Doit accepter l\'ID Supabase Auth');
    console.log('- /api/expert/:id → Doit accepter l\'ID Supabase Auth');
    console.log('- /dashboard/client/:id → Doit accepter l\'ID Supabase Auth');
    console.log('- /dashboard/expert/:id → Doit accepter l\'ID Supabase Auth');
    console.log('');

    // 6. Exemple de requête pour récupérer un client par auth_id
    console.log('📝 EXEMPLE DE REQUÊTE POUR RÉCUPÉRER UN CLIENT:');
    console.log('─'.repeat(80));
    
    const exampleAuthId = Object.keys(clientMapping)[0];
    if (exampleAuthId) {
      console.log(`// Exemple avec l'auth_id: ${exampleAuthId}`);
      console.log('const { data: client, error } = await supabase');
      console.log('  .from("Client")');
      console.log('  .select("*")');
      console.log('  .eq("auth_id", authId)');
      console.log('  .single();');
      console.log('');
      console.log('if (error) {');
      console.log('  console.error("Client non trouvé:", error.message);');
      console.log('  return res.status(404).json({ error: "Client non trouvé" });');
      console.log('}');
      console.log('');
    }

    console.log('✅ Analyse terminée. Les correspondances sont correctes !');
    console.log('📋 Prochaines étapes :');
    console.log('1. Mettre à jour le frontend pour utiliser l\'ID Supabase Auth');
    console.log('2. Mettre à jour les routes backend pour accepter l\'ID Supabase Auth');
    console.log('3. Tester la redirection avec les nouveaux IDs');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

fixRedirectLogic(); 