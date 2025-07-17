-- Migration pour ajouter la colonne expert_id à ClientProduitEligible
-- Date: 2025-01-27

-- Ajouter la colonne expert_id si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'expert_id'
    ) THEN
        ALTER TABLE "ClientProduitEligible" 
        ADD COLUMN "expert_id" uuid;
        
        -- Ajouter un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS "idx_clientproduit_expert_id" 
        ON "ClientProduitEligible" ("expert_id");
        
        -- Ajouter une contrainte de clé étrangère vers la table Expert
        ALTER TABLE "ClientProduitEligible" 
        ADD CONSTRAINT "fk_clientproduiteligible_expert" 
        FOREIGN KEY ("expert_id") REFERENCES "Expert"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Colonne expert_id ajoutée avec succès à ClientProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne expert_id existe déjà dans ClientProduitEligible';
    END IF;
END $$; 