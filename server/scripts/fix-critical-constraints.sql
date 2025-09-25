-- ============================================================================
-- CORRECTION DES PROBLÈMES CRITIQUES - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Corriger les contraintes CHECK manquantes et les incohérences FK

-- ============================================================================
-- 1. CRÉATION DES CONTRAINTES CHECK MANQUANTES
-- ============================================================================

-- Contraintes CHECK pour DossierStep
ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_step_type_check" 
CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment'));

ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_status_check" 
CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'));

ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_priority_check" 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_assignee_type_check" 
CHECK (assignee_type IN ('client', 'expert', 'admin'));

ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_progress_check" 
CHECK (progress >= 0 AND progress <= 100);

-- Contraintes CHECK pour ClientProduitEligible
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "ClientProduitEligible_statut_check" 
CHECK (statut IN ('eligible', 'ineligible', 'en_cours', 'termine', 'annule'));

-- Contraintes CHECK pour GEDDocument
ALTER TABLE "GEDDocument" 
ADD CONSTRAINT "GEDDocument_category_check" 
CHECK (category IN ('facture', 'contrat', 'rapport', 'certificat', 'autre'));

-- Contraintes CHECK pour expertassignment
ALTER TABLE expertassignment 
ADD CONSTRAINT "expertassignment_status_check" 
CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- ============================================================================
-- 2. CORRECTION DES RÈGLES DE SUPPRESSION INCOHÉRENTES
-- ============================================================================

-- Corriger ClientProduitEligible pour CASCADE au lieu de SET NULL
-- Note : Cette modification peut être risquée, à tester d'abord
-- ALTER TABLE "ClientProduitEligible" 
-- DROP CONSTRAINT IF EXISTS "ClientProduitEligible_clientId_fkey";

-- ALTER TABLE "ClientProduitEligible" 
-- ADD CONSTRAINT "ClientProduitEligible_clientId_fkey" 
-- FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;

-- Corriger GEDDocument.created_by pour SET NULL au lieu de NO ACTION
-- ALTER TABLE "GEDDocument" 
-- DROP CONSTRAINT IF EXISTS "GEDDocument_created_by_fkey";

-- ALTER TABLE "GEDDocument" 
-- ADD CONSTRAINT "GEDDocument_created_by_fkey" 
-- FOREIGN KEY (created_by) REFERENCES "Client"(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. AJOUT DES INDEX MANQUANTS
-- ============================================================================

-- Index sur montantFinal pour les requêtes de calcul
CREATE INDEX IF NOT EXISTS "idx_clientproduit_montant_final" 
ON "ClientProduitEligible" USING btree ("montantFinal");

-- Index sur sessionId pour les requêtes de session
CREATE INDEX IF NOT EXISTS "idx_clientproduit_session_id" 
ON "ClientProduitEligible" USING btree ("sessionId");

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_clientproduit_client_statut" 
ON "ClientProduitEligible" USING btree ("clientId", statut);

-- ============================================================================
-- 4. VÉRIFICATION DES RELATIONS MANQUANTES
-- ============================================================================

-- Vérifier si DossierStep.assignee_id a une FK vers auth.users
-- Cette relation devrait exister selon la documentation
-- SELECT * FROM information_schema.table_constraints 
-- WHERE constraint_name LIKE '%DossierStep_assignee_id%';

-- Vérifier si GEDDocument.dossier_id a une FK vers ClientProduitEligible
-- Cette relation pourrait être utile pour lier les documents aux dossiers
-- SELECT * FROM information_schema.table_constraints 
-- WHERE constraint_name LIKE '%GEDDocument_dossier_id%';

-- ============================================================================
-- 5. NETTOYAGE DES INDEX EN DOUBLE
-- ============================================================================

-- Supprimer les index en double sur Client.auth_id
-- DROP INDEX IF EXISTS "client_auth_id_unique";
-- DROP INDEX IF EXISTS "client_siren_key";

-- Supprimer les index en double sur Expert.auth_id  
-- DROP INDEX IF EXISTS "expert_auth_id_unique";

-- ============================================================================
-- 6. VÉRIFICATION POST-CORRECTION
-- ============================================================================

-- Vérifier que toutes les contraintes CHECK ont été créées
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, constraint_name;

-- Vérifier que les index ont été créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('ClientProduitEligible', 'DossierStep', 'GEDDocument', 'expertassignment')
ORDER BY tablename, indexname;
