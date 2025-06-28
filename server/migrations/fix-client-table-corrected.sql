-- Migration corrigée pour la table Client
-- Date: 2025-01-24
-- Correction des noms de colonnes avec la bonne casse

-- 1. Vérifier et corriger les types de données (avec les bons noms)
ALTER TABLE "Client" 
ALTER COLUMN "nombreEmployes" TYPE INTEGER USING "nombreEmployes"::integer;

-- 2. Ajouter des colonnes manquantes (avec les bons noms)
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "secteurActivite" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "chiffreAffaires" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "dateCreation" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "derniereConnexion" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "statut" VARCHAR(20) DEFAULT 'actif',
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- 3. Supprimer les contraintes existantes si elles existent
DO $$ 
BEGIN
    -- Supprimer les contraintes de check si elles existent
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'Client' 
               AND constraint_name = 'client_statut_check') THEN
        ALTER TABLE "Client" DROP CONSTRAINT "client_statut_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'Client' 
               AND constraint_name = 'client_nombreEmployes_check') THEN
        ALTER TABLE "Client" DROP CONSTRAINT "client_nombreEmployes_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'Client' 
               AND constraint_name = 'client_chiffreAffaires_check') THEN
        ALTER TABLE "Client" DROP CONSTRAINT "client_chiffreAffaires_check";
    END IF;
END $$;

-- 4. Ajouter les contraintes de validation (avec les bons noms)
ALTER TABLE "Client" 
ADD CONSTRAINT "client_statut_check" 
CHECK (statut IN ('actif', 'inactif', 'suspendu', 'supprime'));

ALTER TABLE "Client" 
ADD CONSTRAINT "client_nombreEmployes_check" 
CHECK ("nombreEmployes" >= 0);

ALTER TABLE "Client" 
ADD CONSTRAINT "client_chiffreAffaires_check" 
CHECK ("chiffreAffaires" >= 0);

-- 5. Ajouter des index pour les performances (avec les bons noms)
CREATE INDEX IF NOT EXISTS "idx_client_statut" ON "Client" (statut);
CREATE INDEX IF NOT EXISTS "idx_client_secteurActivite" ON "Client" ("secteurActivite");
CREATE INDEX IF NOT EXISTS "idx_client_dateCreation" ON "Client" ("dateCreation");
CREATE INDEX IF NOT EXISTS "idx_client_derniereConnexion" ON "Client" ("derniereConnexion");

-- 6. Ajouter des commentaires pour la documentation
COMMENT ON TABLE "Client" IS 'Table des clients de la plateforme Profitum';
COMMENT ON COLUMN "Client"."nombreEmployes" IS 'Nombre d''employés de l''entreprise';
COMMENT ON COLUMN "Client"."secteurActivite" IS 'Secteur d''activité de l''entreprise';
COMMENT ON COLUMN "Client"."chiffreAffaires" IS 'Chiffre d''affaires annuel en euros';
COMMENT ON COLUMN "Client"."statut" IS 'Statut du client (actif, inactif, suspendu, supprime)'; 