-- ============================================================================
-- CORRECTION DES CONTRAINTES GEDDOCUMENT
-- ============================================================================

-- 1. Vérifier la contrainte foreign key problématique
SELECT 
    'PROBLEMATIC_CONSTRAINT' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'GEDDocument'
    AND kcu.column_name = 'created_by';

-- 2. Vérifier si la table users existe
SELECT 
    'USERS_TABLE_CHECK' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'users';

-- 3. Supprimer la contrainte foreign key problématique
ALTER TABLE "GEDDocument" DROP CONSTRAINT IF EXISTS "GEDDocument_created_by_fkey";

-- 4. Recréer la contrainte avec la bonne table (Client)
ALTER TABLE "GEDDocument" 
ADD CONSTRAINT "GEDDocument_created_by_fkey" 
FOREIGN KEY (created_by) REFERENCES "Client"(id);

-- 5. Vérifier que la contrainte a été mise à jour
SELECT 
    'UPDATED_CONSTRAINT' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'GEDDocument'
    AND kcu.column_name = 'created_by'; 