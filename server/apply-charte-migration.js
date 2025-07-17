const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCharteMigration() {
  console.log('🚀 Application de la migration de signature de charte...');
  
  try {
    // 1. Ajouter les colonnes à ClientProduitEligible
    console.log('📝 Ajout des colonnes charte_signed et charte_signed_at...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE "ClientProduitEligible" 
        ADD COLUMN IF NOT EXISTS charte_signed BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS charte_signed_at TIMESTAMP WITH TIME ZONE;
      `
    });

    if (alterError) {
      console.error('❌ Erreur lors de l\'ajout des colonnes:', alterError);
      return;
    }

    // 2. Créer les index
    console.log('🔍 Création des index...');
    
    const { error: indexError1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_client_produit_charte_signed 
        ON "ClientProduitEligible" (charte_signed, client_id);
      `
    });

    const { error: indexError2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_client_produit_charte_signed_at 
        ON "ClientProduitEligible" (charte_signed_at);
      `
    });

    if (indexError1 || indexError2) {
      console.error('❌ Erreur lors de la création des index:', indexError1 || indexError2);
      return;
    }

    // 3. Créer la table ChartesProduits
    console.log('📋 Création de la table ChartesProduits...');
    
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "ChartesProduits" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          produit_id UUID REFERENCES "ProduitEligible"(id) ON DELETE CASCADE,
          nom_charte VARCHAR(255) NOT NULL,
          contenu_charte TEXT NOT NULL,
          version VARCHAR(10) DEFAULT '1.0',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.error('❌ Erreur lors de la création de la table ChartesProduits:', tableError);
      return;
    }

    // 4. Créer les index pour ChartesProduits
    console.log('🔍 Création des index pour ChartesProduits...');
    
    const { error: charteIndexError1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_chartes_produits_produit_id 
        ON "ChartesProduits" (produit_id);
      `
    });

    const { error: charteIndexError2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_chartes_produits_active 
        ON "ChartesProduits" (active);
      `
    });

    if (charteIndexError1 || charteIndexError2) {
      console.error('❌ Erreur lors de la création des index ChartesProduits:', charteIndexError1 || charteIndexError2);
      return;
    }

    // 5. Activer RLS et créer les politiques
    console.log('🔒 Configuration RLS pour ChartesProduits...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE "ChartesProduits" ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Erreur lors de l\'activation RLS:', rlsError);
      return;
    }

    // 6. Vérifier que les colonnes ont été ajoutées
    console.log('✅ Vérification de la migration...');
    
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name IN ('charte_signed', 'charte_signed_at');
      `
    });

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }

    console.log('📊 Colonnes ajoutées:', columns);

    console.log('✅ Migration de signature de charte appliquée avec succès !');
    console.log('📝 Colonnes ajoutées à ClientProduitEligible: charte_signed, charte_signed_at');
    console.log('📋 Table créée: ChartesProduits');
    console.log('🔍 Index créés pour optimiser les performances');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
  }
}

applyCharteMigration(); 