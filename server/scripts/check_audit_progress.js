const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuditProgress() {
  console.log('🔍 Vérification de l\'état de la base de données pour l\'avancement des audits...\n');

  try {
    // 1. Vérifier si la table audits existe
    console.log('1️⃣ Vérification de l\'existence de la table audits...');
    const { data: auditsTable, error: auditsError } = await supabase
      .from('audits')
      .select('*')
      .limit(1);
    
    if (auditsError) {
      console.log('❌ Table audits non trouvée ou erreur:', auditsError.message);
      console.log('📋 Création de la table audits nécessaire...');
    } else {
      console.log('✅ Table audits existe');
      console.log(`📊 Nombre d'audits dans la table: ${auditsTable?.length || 0}`);
    }

    // 2. Vérifier la table ClientProduitEligible
    console.log('\n2️⃣ Vérification de la table ClientProduitEligible...');
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(5);
    
    if (clientProduitsError) {
      console.log('❌ Erreur ClientProduitEligible:', clientProduitsError.message);
    } else {
      console.log(`✅ ${clientProduits?.length || 0} produits éligibles trouvés`);
      if (clientProduits && clientProduits.length > 0) {
        console.log('📋 Exemple de produit éligible:', {
          id: clientProduits[0].id,
          clientId: clientProduits[0].clientId,
          produitId: clientProduits[0].produitId,
          statut: clientProduits[0].statut
        });
      }
    }

    // 3. Vérifier la table client_charte_signature
    console.log('\n3️⃣ Vérification de la table client_charte_signature...');
    const { data: charteSignatures, error: charteError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .limit(5);
    
    if (charteError) {
      console.log('❌ Erreur client_charte_signature:', charteError.message);
    } else {
      console.log(`✅ ${charteSignatures?.length || 0} signatures de charte trouvées`);
      if (charteSignatures && charteSignatures.length > 0) {
        console.log('📋 Exemple de signature:', {
          id: charteSignatures[0].id,
          client_id: charteSignatures[0].client_id,
          produit_id: charteSignatures[0].produit_id,
          signature_date: charteSignatures[0].signature_date
        });
      }
    }

    // 4. Vérifier la table audit_progress
    console.log('\n4️⃣ Vérification de la table audit_progress...');
    const { data: auditProgress, error: progressError } = await supabase
      .from('audit_progress')
      .select('*')
      .limit(5);
    
    if (progressError) {
      console.log('❌ Erreur audit_progress:', progressError.message);
    } else {
      console.log(`✅ ${auditProgress?.length || 0} entrées de progression trouvées`);
      if (auditProgress && auditProgress.length > 0) {
        console.log('📋 Exemple de progression:', {
          request_id: auditProgress[0].request_id,
          current_step: auditProgress[0].current_step,
          progress: auditProgress[0].progress
        });
      }
    }

    // 5. Analyser le problème principal
    console.log('\n🔍 ANALYSE DU PROBLÈME:');
    console.log('Le problème semble être que:');
    console.log('1. Les produits éligibles sont stockés dans ClientProduitEligible');
    console.log('2. Les signatures de charte sont dans client_charte_signature');
    console.log('3. Mais l\'avancement (current_step, progress) n\'est pas mis à jour');
    console.log('4. La table audits n\'existe peut-être pas ou n\'est pas utilisée');
    
    console.log('\n💡 SOLUTIONS PROPOSÉES:');
    console.log('1. Créer la table audits si elle n\'existe pas');
    console.log('2. Ajouter des colonnes current_step et progress à ClientProduitEligible');
    console.log('3. Mettre à jour la logique de signature pour incrémenter current_step');
    console.log('4. Synchroniser l\'état entre client_charte_signature et l\'avancement');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkAuditProgress(); 