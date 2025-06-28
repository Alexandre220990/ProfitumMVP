-- Correction de la table ValidationState
-- Date: 2025-01-24

-- 1. Vérifier la structure actuelle
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ValidationState'
ORDER BY ordinal_position;

-- 2. Modifier la colonne products pour accepter NULL ou ajouter une valeur par défaut
ALTER TABLE "ValidationState" 
ALTER COLUMN "products" DROP NOT NULL;

-- Ou ajouter une valeur par défaut
-- ALTER TABLE "ValidationState" 
-- ALTER COLUMN "products" SET DEFAULT '[]'::jsonb;

-- 3. Vérifier les contraintes existantes
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'ValidationState';

-- 4. Mettre à jour les enregistrements existants avec des valeurs NULL
UPDATE "ValidationState" 
SET "products" = '[]'::jsonb 
WHERE "products" IS NULL;

-- 5. Remettre la contrainte NOT NULL si nécessaire
-- ALTER TABLE "ValidationState" 
-- ALTER COLUMN "products" SET NOT NULL; 