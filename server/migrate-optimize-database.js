const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function optimizeDatabase() {
  console.log('🔧 Optimisation complète de la base de données\n');

  try {
    // 1. Optimiser la table Simulation
    console.log('1️⃣ Optimisation de la table Simulation...');
    
    const simulationOptimizations = [
      // Ajouter les colonnes manquantes
      `ALTER TABLE "Simulation" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'chatbot'`,
      `ALTER TABLE "Simulation" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'profitum'`,
      `ALTER TABLE "Simulation" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb`,
      
      // Ajouter des contraintes
      `ALTER TABLE "Simulation" ADD CONSTRAINT IF NOT EXISTS "simulation_statut_check" CHECK (statut IN ('en_cours', 'termine', 'abandonne', 'erreur'))`,
      `ALTER TABLE "Simulation" ADD CONSTRAINT IF NOT EXISTS "simulation_type_check" CHECK (type IN ('chatbot', 'manual', 'import', 'api'))`,
      
      // Ajouter des index
      `CREATE INDEX IF NOT EXISTS "idx_simulation_clientid" ON "Simulation" ("clientId")`,
      `CREATE INDEX IF NOT EXISTS "idx_simulation_statut" ON "Simulation" (statut)`,
      `CREATE INDEX IF NOT EXISTS "idx_simulation_type" ON "Simulation" (type)`,
      `CREATE INDEX IF NOT EXISTS "idx_simulation_created_at" ON "Simulation" (created_at)`
    ];

    for (const query of simulationOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 2. Optimiser la table ClientProduitEligible
    console.log('\n2️⃣ Optimisation de la table ClientProduitEligible...');
    
    const clientProduitOptimizations = [
      // Corriger les types
      `ALTER TABLE "ClientProduitEligible" ALTER COLUMN "simulationId" TYPE BIGINT USING "simulationId"::bigint`,
      
      // Ajouter des colonnes
      `ALTER TABLE "ClientProduitEligible" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb`,
      `ALTER TABLE "ClientProduitEligible" ADD COLUMN IF NOT EXISTS "notes" TEXT`,
      `ALTER TABLE "ClientProduitEligible" ADD COLUMN IF NOT EXISTS "priorite" INTEGER DEFAULT 1`,
      `ALTER TABLE "ClientProduitEligible" ADD COLUMN IF NOT EXISTS "dateEligibilite" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      
      // Ajouter des contraintes
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_statut_check" CHECK (statut IN ('eligible', 'non_eligible', 'en_cours', 'termine', 'annule'))`,
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_taux_check" CHECK (tauxFinal >= 0 AND tauxFinal <= 1)`,
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_montant_check" CHECK (montantFinal >= 0)`,
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_duree_check" CHECK (dureeFinale > 0)`,
      
      // Ajouter des index
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_clientid" ON "ClientProduitEligible" ("clientId")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_produitid" ON "ClientProduitEligible" ("produitId")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_simulationid" ON "ClientProduitEligible" ("simulationId")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_statut" ON "ClientProduitEligible" (statut)`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_created_at" ON "ClientProduitEligible" (created_at)`
    ];

    for (const query of clientProduitOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 3. Optimiser la table Client
    console.log('\n3️⃣ Optimisation de la table Client...');
    
    const clientOptimizations = [
      // Corriger les types
      `ALTER TABLE "Client" ALTER COLUMN "simulationId" TYPE BIGINT USING "simulationId"::bigint`,
      
      // Standardiser les valeurs par défaut
      `ALTER TABLE "Client" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      
      // Ajouter des contraintes
      `ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_email_check" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')`,
      `ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_nombre_employes_check" CHECK (nombreEmployes >= 0)`,
      `ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_revenu_annuel_check" CHECK (revenuAnnuel >= 0)`,
      
      // Ajouter des index
      `CREATE INDEX IF NOT EXISTS "idx_client_email" ON "Client" (email)`,
      `CREATE INDEX IF NOT EXISTS "idx_client_type" ON "Client" (type)`,
      `CREATE INDEX IF NOT EXISTS "idx_client_secteur" ON "Client" (secteurActivite)`,
      `CREATE INDEX IF NOT EXISTS "idx_client_created_at" ON "Client" (created_at)`
    ];

    for (const query of clientOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 4. Vérification finale
    console.log('\n4️⃣ Vérification de l\'optimisation...');
    
    const { data: simulationStructure, error: simError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'Simulation')
      .order('ordinal_position');

    if (!simError && simulationStructure) {
      console.log(`   ✅ Table Simulation: ${simulationStructure.length} colonnes`);
    }

    const { data: clientProduitStructure, error: cpeError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'ClientProduitEligible')
      .order('ordinal_position');

    if (!cpeError && clientProduitStructure) {
      console.log(`   ✅ Table ClientProduitEligible: ${clientProduitStructure.length} colonnes`);
    }

    console.log('\n✅ Optimisation de la base de données terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
  }
}

// Exécuter l'optimisation
optimizeDatabase(); 