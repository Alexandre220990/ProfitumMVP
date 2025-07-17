-- Script simple pour ajouter les champs manquants à la table Expert
-- Date: 2025-01-27
-- Description: Ajout des champs manquants pour le formulaire expert complet

-- 1. Ajouter les nouveaux champs manquants
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['Français'];
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'disponible';
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 10;
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Créer des index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS "idx_expert_availability" ON "Expert" ("availability");
CREATE INDEX IF NOT EXISTS "idx_expert_languages" ON "Expert" USING GIN ("languages");
CREATE INDEX IF NOT EXISTS "idx_expert_phone" ON "Expert" ("phone");
CREATE INDEX IF NOT EXISTS "idx_expert_website" ON "Expert" ("website");

-- 3. Vérification des modifications
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Expert' 
AND column_name IN ('website', 'linkedin', 'languages', 'availability', 'max_clients', 'hourly_rate', 'phone')
ORDER BY column_name; 