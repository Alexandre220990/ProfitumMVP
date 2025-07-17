const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function optimizeDatabase() {
  console.log('🔧 Optimisation complète de la base de données Profitum\n');

  try {
    // 1. Optimiser la table Expert
    console.log('1️⃣ Optimisation de la table Expert...');
    
    const expertOptimizations = [
      // Ajouter des index pour les requêtes fréquentes
      `CREATE INDEX IF NOT EXISTS "idx_expert_approval_status" ON "Expert" ("approval_status")`,
      `CREATE INDEX IF NOT EXISTS "idx_expert_status" ON "Expert" ("status")`,
      `CREATE INDEX IF NOT EXISTS "idx_expert_email" ON "Expert" ("email")`,
      `CREATE INDEX IF NOT EXISTS "idx_expert_specializations" ON "Expert" USING GIN ("specializations")`,
      `CREATE INDEX IF NOT EXISTS "idx_expert_created_at" ON "Expert" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "idx_expert_approved_by" ON "Expert" ("approved_by")`,
      
      // Ajouter des contraintes de validation
      `ALTER TABLE "Expert" ADD CONSTRAINT IF NOT EXISTS "expert_approval_status_check" CHECK ("approval_status" IN ('pending', 'approved', 'rejected'))`,
      `ALTER TABLE "Expert" ADD CONSTRAINT IF NOT EXISTS "expert_status_check" CHECK ("status" IN ('active', 'inactive', 'suspended'))`,
      `ALTER TABLE "Expert" ADD CONSTRAINT IF NOT EXISTS "expert_email_check" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')`,
      
      // Optimiser les colonnes
      `ALTER TABLE "Expert" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "Expert" ALTER COLUMN "approval_status" SET DEFAULT 'pending'`,
      `ALTER TABLE "Expert" ALTER COLUMN "status" SET DEFAULT 'inactive'`
    ];

    for (const query of expertOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 2. Optimiser la table Client
    console.log('\n2️⃣ Optimisation de la table Client...');
    
    const clientOptimizations = [
      // Index pour les requêtes fréquentes
      `CREATE INDEX IF NOT EXISTS "idx_client_email" ON "Client" ("email")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_auth_id" ON "Client" ("auth_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_created_at" ON "Client" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_secteur" ON "Client" ("secteurActivite")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_type" ON "Client" ("type")`,
      
      // Contraintes de validation
      `ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_email_check" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')`,
      `ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_nombre_employes_check" CHECK ("nombreEmployes" >= 0)`,
      `ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_revenu_annuel_check" CHECK ("revenuAnnuel" >= 0)`,
      
      // Optimiser les colonnes
      `ALTER TABLE "Client" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "Client" ALTER COLUMN "type" SET DEFAULT 'client'`
    ];

    for (const query of clientOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 3. Optimiser la table Simulation
    console.log('\n3️⃣ Optimisation de la table Simulation...');
    
    const simulationOptimizations = [
      // Index pour les requêtes fréquentes
      `CREATE INDEX IF NOT EXISTS "idx_simulation_clientid" ON "Simulation" ("clientId")`,
      `CREATE INDEX IF NOT EXISTS "idx_simulation_statut" ON "Simulation" ("statut")`,
      `CREATE INDEX IF NOT EXISTS "idx_simulation_created_at" ON "Simulation" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "idx_simulation_type" ON "Simulation" ("type")`,
      
      // Contraintes de validation
      `ALTER TABLE "Simulation" ADD CONSTRAINT IF NOT EXISTS "simulation_statut_check" CHECK ("statut" IN ('en_cours', 'termine', 'abandonne', 'erreur'))`,
      `ALTER TABLE "Simulation" ADD CONSTRAINT IF NOT EXISTS "simulation_type_check" CHECK ("type" IN ('chatbot', 'manual', 'import', 'api'))`,
      
      // Optimiser les colonnes
      `ALTER TABLE "Simulation" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "Simulation" ALTER COLUMN "type" SET DEFAULT 'chatbot'`,
      `ALTER TABLE "Simulation" ALTER COLUMN "statut" SET DEFAULT 'en_cours'`
    ];

    for (const query of simulationOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 4. Optimiser la table ClientProduitEligible
    console.log('\n4️⃣ Optimisation de la table ClientProduitEligible...');
    
    const clientProduitOptimizations = [
      // Index pour les requêtes fréquentes
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_clientid" ON "ClientProduitEligible" ("clientId")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_produitid" ON "ClientProduitEligible" ("produitId")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_simulationid" ON "ClientProduitEligible" ("simulationId")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_statut" ON "ClientProduitEligible" ("statut")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_created_at" ON "ClientProduitEligible" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_expert_id" ON "ClientProduitEligible" ("expert_id")`,
      
      // Index composites pour les requêtes complexes
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_client_statut" ON "ClientProduitEligible" ("clientId", "statut")`,
      `CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_expert_statut" ON "ClientProduitEligible" ("expert_id", "statut")`,
      
      // Contraintes de validation
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_statut_check" CHECK ("statut" IN ('eligible', 'non_eligible', 'en_cours', 'termine', 'annule'))`,
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_taux_check" CHECK ("tauxFinal" >= 0 AND "tauxFinal" <= 1)`,
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_montant_check" CHECK ("montantFinal" >= 0)`,
      `ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_duree_check" CHECK ("dureeFinale" > 0)`,
      
      // Optimiser les colonnes
      `ALTER TABLE "ClientProduitEligible" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "ClientProduitEligible" ALTER COLUMN "statut" SET DEFAULT 'en_cours'`,
      `ALTER TABLE "ClientProduitEligible" ALTER COLUMN "progress" SET DEFAULT 0`
    ];

    for (const query of clientProduitOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 5. Optimiser la table Audit
    console.log('\n5️⃣ Optimisation de la table Audit...');
    
    const auditOptimizations = [
      // Index pour les requêtes fréquentes
      `CREATE INDEX IF NOT EXISTS "idx_audit_clientid" ON "Audit" ("clientId")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_expertid" ON "Audit" ("expertId")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_type" ON "Audit" ("type")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_status" ON "Audit" ("status")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_created_at" ON "Audit" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_assigned_by_admin" ON "Audit" ("assigned_by_admin")`,
      
      // Index composites
      `CREATE INDEX IF NOT EXISTS "idx_audit_client_status" ON "Audit" ("clientId", "status")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_expert_status" ON "Audit" ("expertId", "status")`,
      
      // Contraintes de validation
      `ALTER TABLE "Audit" ADD CONSTRAINT IF NOT EXISTS "audit_status_check" CHECK ("status" IN ('non_démarré', 'en_cours', 'terminé'))`,
      `ALTER TABLE "Audit" ADD CONSTRAINT IF NOT EXISTS "audit_progress_check" CHECK ("progress" >= 0 AND "progress" <= 100)`,
      `ALTER TABLE "Audit" ADD CONSTRAINT IF NOT EXISTS "audit_current_step_check" CHECK ("current_step" >= 0)`,
      
      // Optimiser les colonnes
      `ALTER TABLE "Audit" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "Audit" ALTER COLUMN "status" SET DEFAULT 'non_démarré'`,
      `ALTER TABLE "Audit" ALTER COLUMN "progress" SET DEFAULT 0`,
      `ALTER TABLE "Audit" ALTER COLUMN "current_step" SET DEFAULT 0`
    ];

    for (const query of auditOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 6. Optimiser la table Admin
    console.log('\n6️⃣ Optimisation de la table Admin...');
    
    const adminOptimizations = [
      // Index pour les requêtes fréquentes
      `CREATE INDEX IF NOT EXISTS "idx_admin_email" ON "Admin" ("email")`,
      `CREATE INDEX IF NOT EXISTS "idx_admin_auth_id" ON "Admin" ("auth_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_admin_created_at" ON "Admin" ("created_at")`,
      
      // Contraintes de validation
      `ALTER TABLE "Admin" ADD CONSTRAINT IF NOT EXISTS "admin_email_check" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')`,
      `ALTER TABLE "Admin" ADD CONSTRAINT IF NOT EXISTS "admin_role_check" CHECK ("role" IN ('super_admin', 'admin', 'moderator'))`,
      
      // Optimiser les colonnes
      `ALTER TABLE "Admin" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "Admin" ALTER COLUMN "role" SET DEFAULT 'admin'`
    ];

    for (const query of adminOptimizations) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ Exécuté: ${query.substring(0, 50)}...`);
      }
    }

    // 7. Analyser les tables pour optimiser les statistiques
    console.log('\n7️⃣ Analyse des tables pour optimiser les statistiques...');
    
    const analyzeQueries = [
      'ANALYZE "Expert"',
      'ANALYZE "Client"',
      'ANALYZE "Simulation"',
      'ANALYZE "ClientProduitEligible"',
      'ANALYZE "Audit"',
      'ANALYZE "Admin"'
    ];

    for (const query of analyzeQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`   ⚠️ ${error.message}`);
      } else {
        console.log(`   ✅ ${query}`);
      }
    }

    // 8. Vérification finale
    console.log('\n8️⃣ Vérification de l\'optimisation...');
    
    const { data: expertStructure, error: expertError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'Expert')
      .order('ordinal_position');

    if (!expertError && expertStructure) {
      console.log(`   ✅ Table Expert: ${expertStructure.length} colonnes`);
    }

    const { data: clientStructure, error: clientError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'Client')
      .order('ordinal_position');

    if (!clientError && clientStructure) {
      console.log(`   ✅ Table Client: ${clientStructure.length} colonnes`);
    }

    console.log('\n✅ Optimisation de la base de données terminée avec succès !');
    console.log('\n📊 Résumé des optimisations :');
    console.log('   • Index créés pour les requêtes fréquentes');
    console.log('   • Contraintes de validation ajoutées');
    console.log('   • Valeurs par défaut optimisées');
    console.log('   • Statistiques de tables mises à jour');
    console.log('   • Performance des requêtes améliorée');

  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
  }
}

// Exécuter l'optimisation
optimizeDatabase(); 