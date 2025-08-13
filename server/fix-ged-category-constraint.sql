-- ============================================================================
-- CORRECTION CONTRAINTE CATÉGORIE GEDDOCUMENT
-- ============================================================================

-- 1. Vérifier la contrainte actuelle
SELECT 
    'CURRENT_CONSTRAINT' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"GEDDocument"'::regclass 
    AND contype = 'c'
    AND conname = 'GEDDocument_category_check';

-- 2. Supprimer la contrainte existante
ALTER TABLE "GEDDocument" DROP CONSTRAINT IF EXISTS "GEDDocument_category_check";

-- 3. Recréer la contrainte avec les catégories autorisées
ALTER TABLE "GEDDocument" 
ADD CONSTRAINT "GEDDocument_category_check" 
CHECK (category IN (
    'business',
    'technical',
    'eligibilite_ticpe',
    'kbis',
    'immatriculation',
    'facture_carburant',
    'audit',
    'rapport',
    'charte',
    'guide',
    'formation',
    'facture',
    'other'
));

-- 4. Vérifier que la contrainte a été mise à jour
SELECT 
    'UPDATED_CONSTRAINT' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"GEDDocument"'::regclass 
    AND contype = 'c'
    AND conname = 'GEDDocument_category_check';

-- 5. Test d'insertion avec la nouvelle contrainte
BEGIN;

INSERT INTO "GEDDocument" (
    title,
    description,
    content,
    category,
    file_path,
    created_by,
    is_active,
    version
)
SELECT 
    'Test Upload TICPE - Corrigé',
    'Test pour vérifier l''upload de documents avec catégorie corrigée',
    'dossier_id:93374842-cca6-4873-b16e-0ada92e97004',
    'eligibilite_ticpe',
    '/test/upload-test-corrected.pdf',
    id,
    true,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, created_at;

ROLLBACK;

-- 6. Vérifier les catégories existantes
SELECT 
    'EXISTING_CATEGORIES' as check_type,
    category,
    COUNT(*) as count
FROM "GEDDocument" 
GROUP BY category
ORDER BY count DESC;
