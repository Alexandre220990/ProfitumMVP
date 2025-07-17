const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement directement définies
const supabaseUrl = "https://gvvlsgtubqfxdztldunj.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2a3ZrcGZ0YWt5dHhwc2Jra2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk0MDc0NjEsImV4cCI6MjAyNDk4MzQ2MX0.ckc2_CK5yDRBG5Z5yxYJgXGzGJGpMf-dHDMHk-8GHxs";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDossiersStructure() {
  try {
    console.log('🔍 Analyse de la structure des dossiers clients...\n');
    
    // 1. Structure de la table ClientProduitEligible
    console.log('1. Structure de ClientProduitEligible:');
    const { data: cpeSample, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(1);
    
    if (cpeError) {
      console.error('❌ Erreur ClientProduitEligible:', cpeError);
    } else if (cpeSample && cpeSample.length > 0) {
      console.log('✅ Colonnes disponibles:', Object.keys(cpeSample[0]));
      console.log('📋 Exemple de données:', JSON.stringify(cpeSample[0], null, 2));
    }
    
    // 2. Structure de la table ProduitEligible
    console.log('\n2. Structure de ProduitEligible:');
    const { data: peSample, error: peError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(1);
    
    if (peError) {
      console.error('❌ Erreur ProduitEligible:', peError);
    } else if (peSample && peSample.length > 0) {
      console.log('✅ Colonnes disponibles:', Object.keys(peSample[0]));
    }
    
    // 3. Structure de la table Expert
    console.log('\n3. Structure de Expert:');
    const { data: expertSample, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .limit(1);
    
    if (expertError) {
      console.error('❌ Erreur Expert:', expertError);
    } else if (expertSample && expertSample.length > 0) {
      console.log('✅ Colonnes disponibles:', Object.keys(expertSample[0]));
    }
    
    // 4. Structure de la table Client
    console.log('\n4. Structure de Client:');
    const { data: clientSample, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Erreur Client:', clientError);
    } else if (clientSample && clientSample.length > 0) {
      console.log('✅ Colonnes disponibles:', Object.keys(clientSample[0]));
    }
    
    // 5. Relations et données réelles
    console.log('\n5. Relations et données réelles:');
    
    // Compter les dossiers par statut
    const { data: statusCount, error: statusError } = await supabase
      .from('ClientProduitEligible')
      .select('validation_state');
    
    if (!statusError && statusCount) {
      const statusStats = {};
      statusCount.forEach(item => {
        statusStats[item.validation_state] = (statusStats[item.validation_state] || 0) + 1;
      });
      console.log('📊 Répartition par statut:', statusStats);
    }
    
    // Dossiers avec experts sélectionnés
    const { data: dossiersWithExperts, error: expertsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        client_id,
        produit_eligible_id,
        validation_state,
        expert_id,
        created_at,
        updated_at,
        Client:Client!inner(email, company_name),
        ProduitEligible:ProduitEligible!inner(nom, description),
        Expert:Expert!inner(name, email, company_name)
      `)
      .not('expert_id', 'is', null)
      .limit(5);
    
    if (expertsError) {
      console.error('❌ Erreur dossiers avec experts:', expertsError);
    } else {
      console.log('✅ Dossiers avec experts sélectionnés:', dossiersWithExperts?.length || 0);
      if (dossiersWithExperts && dossiersWithExperts.length > 0) {
        console.log('📋 Exemple de dossier avec expert:', JSON.stringify(dossiersWithExperts[0], null, 2));
      }
    }
    
    // 6. Vérifier les colonnes de progression
    console.log('\n6. Colonnes de progression disponibles:');
    if (cpeSample && cpeSample.length > 0) {
      const progressionColumns = Object.keys(cpeSample[0]).filter(col => 
        col.includes('progress') || col.includes('step') || col.includes('etape')
      );
      console.log('📈 Colonnes de progression:', progressionColumns);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

analyzeDossiersStructure(); 