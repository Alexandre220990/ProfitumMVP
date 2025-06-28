-- Migration pour ajouter les colonnes d'avancement à ClientProduitEligible
-- Date: 2025-01-27
-- Description: Ajout des colonnes current_step et progress pour suivre l'avancement des dossiers

-- Ajouter les colonnes d'avancement
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Mettre à jour les enregistrements existants avec signature de charte
-- Si une signature existe, l'étape 1 est complétée (25% de progression)
UPDATE "ClientProduitEligible" 
SET 
    current_step = 1,
    progress = 25
WHERE id IN (
    SELECT DISTINCT cpe.id 
    FROM "ClientProduitEligible" cpe
    INNER JOIN "client_charte_signature" ccs 
        ON cpe."clientId" = ccs.client_id 
        AND cpe."produitId" = ccs.produit_id
);

-- Créer un index pour optimiser les requêtes par client
CREATE INDEX IF NOT EXISTS idx_client_produit_eligible_client_id 
ON "ClientProduitEligible" ("clientId");

-- Créer un index pour optimiser les requêtes par statut
CREATE INDEX IF NOT EXISTS idx_client_produit_eligible_statut 
ON "ClientProduitEligible" (statut);

-- Commentaire sur la table pour documenter les nouvelles colonnes
COMMENT ON COLUMN "ClientProduitEligible".current_step IS 'Étape actuelle du processus (0-5)';
COMMENT ON COLUMN "ClientProduitEligible".progress IS 'Pourcentage d''avancement (0-100)'; 