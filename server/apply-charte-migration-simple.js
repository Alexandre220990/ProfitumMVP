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
    // 1. Vérifier si les colonnes existent déjà
    console.log('🔍 Vérification des colonnes existantes...');
    
    const { data: existingColumns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'ClientProduitEligible')
      .in('column_name', ['charte_signed', 'charte_signed_at']);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }

    const existingColumnNames = existingColumns.map(col => col.column_name);
    console.log('📊 Colonnes existantes:', existingColumnNames);

    if (existingColumnNames.includes('charte_signed') && existingColumnNames.includes('charte_signed_at')) {
      console.log('✅ Les colonnes existent déjà !');
      return;
    }

    // 2. Ajouter les colonnes une par une
    console.log('📝 Ajout des colonnes...');
    
    if (!existingColumnNames.includes('charte_signed')) {
      console.log('➕ Ajout de la colonne charte_signed...');
      // Note: Nous ne pouvons pas exécuter ALTER TABLE directement via l'API
      // Il faudra le faire manuellement dans l'interface Supabase
      console.log('⚠️  Veuillez ajouter manuellement la colonne charte_signed BOOLEAN DEFAULT FALSE dans l\'interface Supabase');
    }

    if (!existingColumnNames.includes('charte_signed_at')) {
      console.log('➕ Ajout de la colonne charte_signed_at...');
      console.log('⚠️  Veuillez ajouter manuellement la colonne charte_signed_at TIMESTAMP WITH TIME ZONE dans l\'interface Supabase');
    }

    // 3. Vérifier la table ChartesProduits
    console.log('📋 Vérification de la table ChartesProduits...');
    
    const { data: tables, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'ChartesProduits');

    if (tableCheckError) {
      console.error('❌ Erreur lors de la vérification de la table:', tableCheckError);
      return;
    }

    if (tables.length === 0) {
      console.log('⚠️  Veuillez créer manuellement la table ChartesProduits dans l\'interface Supabase');
      console.log('📋 Structure requise:');
      console.log(`
        CREATE TABLE "ChartesProduits" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          produit_id UUID REFERENCES "ProduitEligible"(id) ON DELETE CASCADE,
          nom_charte VARCHAR(255) NOT NULL,
          contenu_charte TEXT NOT NULL,
          version VARCHAR(10) DEFAULT '1.0',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    } else {
      console.log('✅ Table ChartesProduits existe déjà');
    }

    console.log('📋 Instructions pour finaliser la migration:');
    console.log('1. Allez dans l\'interface Supabase > Table Editor');
    console.log('2. Sélectionnez la table ClientProduitEligible');
    console.log('3. Ajoutez les colonnes:');
    console.log('   - charte_signed (BOOLEAN, DEFAULT FALSE)');
    console.log('   - charte_signed_at (TIMESTAMP WITH TIME ZONE)');
    console.log('4. Créez la table ChartesProduits si elle n\'existe pas');
    console.log('5. Activez RLS sur ChartesProduits');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
  }
}

applyCharteMigration(); 