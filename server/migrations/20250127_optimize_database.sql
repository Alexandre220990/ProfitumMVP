-- Migration d'optimisation complète de la base de données Profitum
-- Date: 2025-01-27

-- ===== 1. OPTIMISATION DE LA TABLE EXPERT =====

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_expert_approval_status" ON "Expert" ("approval_status");
CREATE INDEX IF NOT EXISTS "idx_expert_status" ON "Expert" ("status");
CREATE INDEX IF NOT EXISTS "idx_expert_email" ON "Expert" ("email");
CREATE INDEX IF NOT EXISTS "idx_expert_specializations" ON "Expert" USING GIN ("specializations");
CREATE INDEX IF NOT EXISTS "idx_expert_created_at" ON "Expert" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_expert_approved_by" ON "Expert" ("approved_by");

-- Contraintes de validation
ALTER TABLE "Expert" ADD CONSTRAINT IF NOT EXISTS "expert_approval_status_check" 
    CHECK ("approval_status" IN ('pending', 'approved', 'rejected'));
ALTER TABLE "Expert" ADD CONSTRAINT IF NOT EXISTS "expert_status_check" 
    CHECK ("status" IN ('active', 'inactive', 'suspended'));
ALTER TABLE "Expert" ADD CONSTRAINT IF NOT EXISTS "expert_email_check" 
    CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Optimiser les colonnes
ALTER TABLE "Expert" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expert" ALTER COLUMN "approval_status" SET DEFAULT 'pending';
ALTER TABLE "Expert" ALTER COLUMN "status" SET DEFAULT 'inactive';

-- ===== 2. OPTIMISATION DE LA TABLE CLIENT =====

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_client_email" ON "Client" ("email");
CREATE INDEX IF NOT EXISTS "idx_client_auth_id" ON "Client" ("auth_id");
CREATE INDEX IF NOT EXISTS "idx_client_created_at" ON "Client" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_client_secteur" ON "Client" ("secteurActivite");
CREATE INDEX IF NOT EXISTS "idx_client_type" ON "Client" ("type");

-- Contraintes de validation
ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_email_check" 
    CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_nombre_employes_check" 
    CHECK ("nombreEmployes" >= 0);
ALTER TABLE "Client" ADD CONSTRAINT IF NOT EXISTS "client_revenu_annuel_check" 
    CHECK ("revenuAnnuel" >= 0);

-- Optimiser les colonnes
ALTER TABLE "Client" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Client" ALTER COLUMN "type" SET DEFAULT 'client';

-- ===== 3. OPTIMISATION DE LA TABLE SIMULATION =====

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_simulation_clientid" ON "Simulation" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_simulation_statut" ON "Simulation" ("statut");
CREATE INDEX IF NOT EXISTS "idx_simulation_created_at" ON "Simulation" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_simulation_type" ON "Simulation" ("type");

-- Contraintes de validation
ALTER TABLE "Simulation" ADD CONSTRAINT IF NOT EXISTS "simulation_statut_check" 
    CHECK ("statut" IN ('en_cours', 'termine', 'abandonne', 'erreur'));
ALTER TABLE "Simulation" ADD CONSTRAINT IF NOT EXISTS "simulation_type_check" 
    CHECK ("type" IN ('chatbot', 'manual', 'import', 'api'));

-- Optimiser les colonnes
ALTER TABLE "Simulation" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Simulation" ALTER COLUMN "type" SET DEFAULT 'chatbot';
ALTER TABLE "Simulation" ALTER COLUMN "statut" SET DEFAULT 'en_cours';

-- ===== 4. OPTIMISATION DE LA TABLE CLIENTPRODUITELIGIBLE =====

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_clientid" ON "ClientProduitEligible" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_produitid" ON "ClientProduitEligible" ("produitId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_simulationid" ON "ClientProduitEligible" ("simulationId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_statut" ON "ClientProduitEligible" ("statut");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_created_at" ON "ClientProduitEligible" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_expert_id" ON "ClientProduitEligible" ("expert_id");

-- Index composites pour les requêtes complexes
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_client_statut" ON "ClientProduitEligible" ("clientId", "statut");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_expert_statut" ON "ClientProduitEligible" ("expert_id", "statut");

-- Contraintes de validation
ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_statut_check" 
    CHECK ("statut" IN ('eligible', 'non_eligible', 'en_cours', 'termine', 'annule'));
ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_taux_check" 
    CHECK ("tauxFinal" >= 0 AND "tauxFinal" <= 1);
ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_montant_check" 
    CHECK ("montantFinal" >= 0);
ALTER TABLE "ClientProduitEligible" ADD CONSTRAINT IF NOT EXISTS "client_produit_eligible_duree_check" 
    CHECK ("dureeFinale" > 0);

-- Optimiser les colonnes
ALTER TABLE "ClientProduitEligible" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ClientProduitEligible" ALTER COLUMN "statut" SET DEFAULT 'en_cours';
ALTER TABLE "ClientProduitEligible" ALTER COLUMN "progress" SET DEFAULT 0;

-- ===== 5. OPTIMISATION DE LA TABLE AUDIT =====

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_audit_clientid" ON "Audit" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_audit_expertid" ON "Audit" ("expertId");
CREATE INDEX IF NOT EXISTS "idx_audit_type" ON "Audit" ("type");
CREATE INDEX IF NOT EXISTS "idx_audit_status" ON "Audit" ("status");
CREATE INDEX IF NOT EXISTS "idx_audit_created_at" ON "Audit" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_assigned_by_admin" ON "Audit" ("assigned_by_admin");

-- Index composites
CREATE INDEX IF NOT EXISTS "idx_audit_client_status" ON "Audit" ("clientId", "status");
CREATE INDEX IF NOT EXISTS "idx_audit_expert_status" ON "Audit" ("expertId", "status");

-- Contraintes de validation
ALTER TABLE "Audit" ADD CONSTRAINT IF NOT EXISTS "audit_status_check" 
    CHECK ("status" IN ('non_démarré', 'en_cours', 'terminé'));
ALTER TABLE "Audit" ADD CONSTRAINT IF NOT EXISTS "audit_progress_check" 
    CHECK ("progress" >= 0 AND "progress" <= 100);
ALTER TABLE "Audit" ADD CONSTRAINT IF NOT EXISTS "audit_current_step_check" 
    CHECK ("current_step" >= 0);

-- Optimiser les colonnes
ALTER TABLE "Audit" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Audit" ALTER COLUMN "status" SET DEFAULT 'non_démarré';
ALTER TABLE "Audit" ALTER COLUMN "progress" SET DEFAULT 0;
ALTER TABLE "Audit" ALTER COLUMN "current_step" SET DEFAULT 0;

-- ===== 6. OPTIMISATION DE LA TABLE ADMIN =====

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_admin_email" ON "Admin" ("email");
CREATE INDEX IF NOT EXISTS "idx_admin_auth_id" ON "Admin" ("auth_id");
CREATE INDEX IF NOT EXISTS "idx_admin_created_at" ON "Admin" ("created_at");

-- Contraintes de validation
ALTER TABLE "Admin" ADD CONSTRAINT IF NOT EXISTS "admin_email_check" 
    CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE "Admin" ADD CONSTRAINT IF NOT EXISTS "admin_role_check" 
    CHECK ("role" IN ('super_admin', 'admin', 'moderator'));

-- Optimiser les colonnes
ALTER TABLE "Admin" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Admin" ALTER COLUMN "role" SET DEFAULT 'admin';

-- ===== 7. ANALYSE DES TABLES POUR OPTIMISER LES STATISTIQUES =====

ANALYZE "Expert";
ANALYZE "Client";
ANALYZE "Simulation";
ANALYZE "ClientProduitEligible";
ANALYZE "Audit";
ANALYZE "Admin";

-- ===== 8. VÉRIFICATION DES OPTIMISATIONS =====

-- Vérifier les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Expert', 'Client', 'Simulation', 'ClientProduitEligible', 'Audit', 'Admin')
ORDER BY tablename, indexname;

-- Vérifier les contraintes ajoutées
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('Expert', 'Client', 'Simulation', 'ClientProduitEligible', 'Audit', 'Admin')
ORDER BY tc.table_name, tc.constraint_name; 