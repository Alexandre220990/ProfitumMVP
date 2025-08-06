-- ============================================================================
-- VÉRIFICATION DES TABLES D'UTILISATEURS
-- ============================================================================

-- 1. Lister toutes les tables contenant "user" dans le nom
SELECT 
    'USER_TABLES' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name ILIKE '%user%'
ORDER BY table_name;

-- 2. Lister toutes les tables contenant "auth" dans le nom
SELECT 
    'AUTH_TABLES' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name ILIKE '%auth%'
ORDER BY table_name;

-- 3. Vérifier les tables Client, Expert, Admin
SELECT 
    'EXISTING_USER_TABLES' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'Client' THEN 'CLIENT'
        WHEN table_name = 'Expert' THEN 'EXPERT'
        WHEN table_name = 'Admin' THEN 'ADMIN'
        ELSE 'OTHER'
    END as user_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('Client', 'Expert', 'Admin')
ORDER BY table_name;

-- 4. Vérifier la structure de la table Client
SELECT 
    'CLIENT_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Client'
    AND column_name IN ('id', 'email', 'name')
ORDER BY column_name;

-- 5. Vérifier la structure de la table Expert
SELECT 
    'EXPERT_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Expert'
    AND column_name IN ('id', 'email', 'name')
ORDER BY column_name; 