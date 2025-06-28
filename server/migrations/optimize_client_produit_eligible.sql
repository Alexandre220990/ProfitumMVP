-- Migration pour optimiser la table ClientProduitEligible
-- Date: 2025-01-24

-- 1. Corriger les types de données
ALTER TABLE "ClientProduitEligible" 
ALTER COLUMN "simulationId" TYPE BIGINT USING "simulationId"::bigint;

-- 2. Ajouter des colonnes manquantes pour une gestion complète
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "priorite" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "dateEligibilite" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Standardiser les contraintes de statut
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_statut_check" 
CHECK (statut IN ('eligible', 'non_eligible', 'en_cours', 'termine', 'annule'));

-- 4. Ajouter des contraintes de validation
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_taux_check" 
CHECK (tauxFinal >= 0 AND tauxFinal <= 1);

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_montant_check" 
CHECK (montantFinal >= 0);

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_duree_check" 
CHECK (dureeFinale > 0);

-- 5. Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_clientid" ON "ClientProduitEligible" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_produitid" ON "ClientProduitEligible" ("produitId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_simulationid" ON "ClientProduitEligible" ("simulationId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_statut" ON "ClientProduitEligible" (statut);
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_created_at" ON "ClientProduitEligible" (created_at);

-- 6. Ajouter des commentaires pour la documentation
COMMENT ON TABLE "ClientProduitEligible" IS 'Table de liaison entre clients et produits éligibles';
COMMENT ON COLUMN "ClientProduitEligible"."metadata" IS 'Métadonnées supplémentaires en JSON';
COMMENT ON COLUMN "ClientProduitEligible"."notes" IS 'Notes additionnelles sur l''éligibilité';
COMMENT ON COLUMN "ClientProduitEligible"."priorite" IS 'Priorité du produit (1-5, 1=plus haute)';
COMMENT ON COLUMN "ClientProduitEligible"."dateEligibilite" IS 'Date de détermination de l''éligibilité'; 