-- Script de correction pour ValidationState
-- Problème : Pas de clé primaire, types text au lieu de uuid

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ValidationState' 
ORDER BY ordinal_position;

-- 2. Vérifier s'il y a déjà une clé primaire
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'ValidationState' AND constraint_type = 'PRIMARY KEY';

-- 3. Ajouter une colonne id si elle n'existe pas
ALTER TABLE "ValidationState" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 4. Définir la clé primaire seulement si elle n'existe pas déjà
-- (Décommenter si pas de clé primaire existante)
-- ALTER TABLE "ValidationState" 
-- ADD CONSTRAINT "ValidationState_pkey" PRIMARY KEY (id);

-- 4. Vérifier les types de données
-- Les colonnes simulation_id et client_id sont en text
-- Si besoin de les convertir en uuid (optionnel)
-- ALTER TABLE "ValidationState" ALTER COLUMN simulation_id TYPE UUID USING simulation_id::UUID;
-- ALTER TABLE "ValidationState" ALTER COLUMN client_id TYPE UUID USING client_id::UUID;

-- 5. Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_validation_state_client_id ON "ValidationState"(client_id);
CREATE INDEX IF NOT EXISTS idx_validation_state_simulation_id ON "ValidationState"(simulation_id);
CREATE INDEX IF NOT EXISTS idx_validation_state_phase ON "ValidationState"(phase);
CREATE INDEX IF NOT EXISTS idx_validation_state_created_at ON "ValidationState"(created_at);

-- 6. Vérification finale
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as with_id,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as with_client_id,
    COUNT(CASE WHEN simulation_id IS NOT NULL THEN 1 END) as with_simulation_id
FROM "ValidationState"; 