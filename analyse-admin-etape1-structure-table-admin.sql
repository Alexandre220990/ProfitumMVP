-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 1 : STRUCTURE DE LA TABLE ADMIN
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Analyser la structure complète de la table Admin pour comprendre
--            l'architecture existante avant d'ajouter un second admin
-- ============================================================================

-- ============================================================================
-- 1. STRUCTURE COMPLÈTE DE LA TABLE ADMIN
-- ============================================================================

SELECT 
    'STRUCTURE TABLE ADMIN' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_par_defaut,
    ordinal_position as position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Admin'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CONTRAINTES ET INDEXES DE LA TABLE ADMIN
-- ============================================================================

-- Contraintes (primary key, foreign keys, unique, check)
SELECT 
    'CONTRAINTES' as analyse_etape,
    conname as nom_contrainte,
    contype as type_contrainte,
    -- p = primary key, f = foreign key, u = unique, c = check
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
    END as type_contrainte_lisible,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'Admin' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
ORDER BY contype, conname;

-- Indexes
SELECT 
    'INDEXES' as analyse_etape,
    indexname as nom_index,
    indexdef as definition_index
FROM pg_indexes
WHERE tablename = 'Admin'
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- 3. DONNÉES ACTUELLES DANS LA TABLE ADMIN
-- ============================================================================

SELECT 
    'DONNEES ACTUELLES' as analyse_etape,
    id,
    email,
    name,
    is_active,
    created_at,
    updated_at,
    -- Vérifier si auth_user_id existe (peut être NULL)
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Admin' AND column_name = 'auth_user_id'
        ) THEN 'Colonne auth_user_id existe'
        ELSE 'Colonne auth_user_id n''existe pas'
    END as info_auth_user_id
FROM "Admin"
ORDER BY created_at DESC;

-- ============================================================================
-- 4. VÉRIFICATION DE LA COLONNE auth_user_id (SI ELLE EXISTE)
-- ============================================================================

-- Vérifier si la colonne auth_user_id existe
DO $$
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Admin' 
        AND column_name = 'auth_user_id'
        AND table_schema = 'public'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ Colonne auth_user_id existe dans la table Admin';
        -- Afficher les valeurs
        PERFORM * FROM "Admin" WHERE auth_user_id IS NOT NULL;
    ELSE
        RAISE NOTICE '⚠️ Colonne auth_user_id n''existe PAS dans la table Admin';
    END IF;
END $$;

-- Si auth_user_id existe, afficher les correspondances avec auth.users
SELECT 
    'LIAISON AUTH.USERS' as analyse_etape,
    a.id as admin_id,
    a.email as admin_email,
    a.name as admin_name,
    a.auth_user_id,
    au.id as auth_user_id_verifie,
    au.email_confirmed_at,
    au.last_sign_in_at,
    au.raw_user_meta_data->>'type' as user_type_metadata
FROM "Admin" a
LEFT JOIN auth.users au ON a.auth_user_id = au.id
ORDER BY a.created_at DESC;

-- ============================================================================
-- 5. STATISTIQUES SUR LES ADMINS
-- ============================================================================

SELECT 
    'STATISTIQUES' as analyse_etape,
    COUNT(*) as nombre_total_admins,
    COUNT(CASE WHEN is_active = true THEN 1 END) as admins_actifs,
    COUNT(CASE WHEN is_active = false THEN 1 END) as admins_inactifs,
    COUNT(CASE WHEN is_active IS NULL THEN 1 END) as admins_statut_null,
    MIN(created_at) as premier_admin_cree,
    MAX(created_at) as dernier_admin_cree
FROM "Admin";

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Après exécution de ce script, vous aurez :
-- 1. La structure complète de la table Admin (colonnes, types, contraintes)
-- 2. Les contraintes et index existants
-- 3. Les données actuelles (admins existants)
-- 4. La vérification de la colonne auth_user_id et sa liaison avec auth.users
-- 5. Des statistiques sur les admins
-- 
-- Prochaine étape : Analyse des RLS (Row Level Security) policies sur Admin

