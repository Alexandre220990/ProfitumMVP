-- Migration corrigée pour ClientProduitEligible
-- Date: 2025-01-24
-- Correction des noms de colonnes avec la bonne casse

-- 1. Corriger les types de données (avec les bons noms)
ALTER TABLE "ClientProduitEligible" 
ALTER COLUMN "simulationId" TYPE BIGINT USING "simulationId"::bigint;

-- 2. Ajouter des colonnes manquantes (avec les bons noms)
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "priorite" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "dateEligibilite" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Supprimer les contraintes existantes si elles existent (pour éviter les erreurs)
DO $$ 
BEGIN
    -- Supprimer les contraintes de check si elles existent
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_statut_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_statut_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_tauxFinal_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_tauxFinal_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_montantFinal_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_montantFinal_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_dureeFinale_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_dureeFinale_check";
    END IF;
END $$;

-- 4. Ajouter les contraintes de validation (avec les bons noms)
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_statut_check" 
CHECK (statut IN ('eligible', 'non_eligible', 'en_cours', 'termine', 'annule'));

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_tauxFinal_check" 
CHECK ("tauxFinal" >= 0 AND "tauxFinal" <= 1);

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_montantFinal_check" 
CHECK ("montantFinal" >= 0);

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_dureeFinale_check" 
CHECK ("dureeFinale" > 0);

-- 5. Ajouter des index pour les performances (avec les bons noms)
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_simulationId" ON "ClientProduitEligible" ("simulationId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_created_at" ON "ClientProduitEligible" ("created_at");

-- 6. Vérifier que l'auto-génération des UUIDs fonctionne
-- (Déjà fait dans les tests précédents) 