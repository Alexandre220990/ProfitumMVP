-- Migration pour ajouter les champs manquants à la table Expert
-- Date: 2025-01-27
-- Description: Ajout des champs manquants pour le formulaire expert complet

-- 1. Ajouter les nouveaux champs manquants
ALTER TABLE "Expert" 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['Français'],
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'disponible',
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Ajouter des contraintes de validation (avec gestion d'erreur)
DO $$ 
BEGIN
    -- Contrainte availability
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expert_availability_check' 
        AND table_name = 'Expert'
    ) THEN
        ALTER TABLE "Expert" 
        ADD CONSTRAINT "expert_availability_check" 
        CHECK (availability IN ('disponible', 'partiel', 'limite', 'indisponible'));
    END IF;

    -- Contrainte max_clients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expert_max_clients_check' 
        AND table_name = 'Expert'
    ) THEN
        ALTER TABLE "Expert" 
        ADD CONSTRAINT "expert_max_clients_check" 
        CHECK (max_clients >= 1 AND max_clients <= 100);
    END IF;

    -- Contrainte hourly_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expert_hourly_rate_check' 
        AND table_name = 'Expert'
    ) THEN
        ALTER TABLE "Expert" 
        ADD CONSTRAINT "expert_hourly_rate_check" 
        CHECK (hourly_rate >= 0);
    END IF;
END $$;

-- 3. Créer des index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS "idx_expert_availability" ON "Expert" ("availability");
CREATE INDEX IF NOT EXISTS "idx_expert_languages" ON "Expert" USING GIN ("languages");
CREATE INDEX IF NOT EXISTS "idx_expert_phone" ON "Expert" ("phone");
CREATE INDEX IF NOT EXISTS "idx_expert_website" ON "Expert" ("website");

-- 4. Mettre à jour les types TypeScript
-- Note: Ces types seront mis à jour dans les fichiers de types

-- 5. Vérification des modifications
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Expert' 
AND column_name IN ('website', 'linkedin', 'languages', 'availability', 'max_clients', 'hourly_rate', 'phone')
ORDER BY column_name; 