-- ============================================================================
-- CORRECTION DES CONTRAINTES ADMIN
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Ajouter une contrainte UNIQUE sur auth_user_id pour éviter
--            qu'un même utilisateur auth.users soit lié à plusieurs admins
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : VÉRIFICATION DE L'ÉTAT ACTUEL
-- ============================================================================

-- Vérifier s'il existe déjà une contrainte UNIQUE sur auth_user_id
SELECT 
    'VERIFICATION CONTRAINTE UNIQUE' as etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
            WHERE t.relname = 'Admin'
            AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND c.contype = 'u'
            AND a.attname = 'auth_user_id'
        ) THEN '✅ Contrainte UNIQUE sur auth_user_id existe déjà'
        ELSE '⚠️ Pas de contrainte UNIQUE sur auth_user_id'
    END as statut;

-- Vérifier s'il y a des doublons dans auth_user_id
SELECT 
    'VERIFICATION DOUBLONS' as etape,
    auth_user_id,
    COUNT(*) as nombre_admins,
    STRING_AGG(email, ', ') as emails_admins
FROM "Admin"
WHERE auth_user_id IS NOT NULL
GROUP BY auth_user_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- ÉTAPE 2 : AJOUTER LA CONTRAINTE UNIQUE SUR auth_user_id
-- ============================================================================

-- Ajouter la contrainte UNIQUE si elle n'existe pas et s'il n'y a pas de doublons
DO $$
BEGIN
    -- Vérifier s'il existe des doublons
    IF EXISTS (
        SELECT 1 FROM "Admin"
        WHERE auth_user_id IS NOT NULL
        GROUP BY auth_user_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION '❌ Des doublons existent dans auth_user_id. Corrigez-les avant d''ajouter la contrainte UNIQUE.';
    END IF;
    
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
        WHERE t.relname = 'Admin'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND c.contype = 'u'
        AND a.attname = 'auth_user_id'
    ) THEN
        -- Ajouter la contrainte UNIQUE
        ALTER TABLE "Admin"
        ADD CONSTRAINT Admin_auth_user_id_key UNIQUE (auth_user_id);
        
        RAISE NOTICE '✅ Contrainte UNIQUE ajoutée sur auth_user_id';
    ELSE
        RAISE NOTICE '✅ Contrainte UNIQUE sur auth_user_id existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3 : VÉRIFICATION APRÈS AJOUT
-- ============================================================================

-- Vérifier que la contrainte a été ajoutée
SELECT 
    'VERIFICATION APRES AJOUT' as etape,
    conname as nom_contrainte,
    CASE contype
        WHEN 'u' THEN 'UNIQUE'
        ELSE contype::text
    END as type_contrainte,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'Admin' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
AND conname = 'Admin_auth_user_id_key';

-- ============================================================================
-- ÉTAPE 4 : CRÉER UN INDEX POUR OPTIMISER LES REQUÊTES (si pas déjà existant)
-- ============================================================================

-- Vérifier si l'index existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'Admin'
        AND indexname = 'idx_admin_auth_user_id_unique'
    ) THEN
        -- L'index sera créé automatiquement par la contrainte UNIQUE
        -- Mais on peut créer un index supplémentaire si nécessaire
        RAISE NOTICE '✅ Index créé automatiquement par la contrainte UNIQUE';
    ELSE
        RAISE NOTICE '✅ Index existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE DES CONTRAINTES
-- ============================================================================

-- Afficher toutes les contraintes UNIQUE sur Admin
SELECT 
    'CONTRAINTES UNIQUE FINALES' as etape,
    conname as nom_contrainte,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'Admin' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
AND contype = 'u'
ORDER BY conname;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
-- Ce script :
-- 1. ✅ Vérifie l'état actuel des contraintes
-- 2. ✅ Détecte les doublons éventuels dans auth_user_id
-- 3. ✅ Ajoute une contrainte UNIQUE sur auth_user_id si nécessaire
-- 4. ✅ Vérifie que la contrainte a été ajoutée correctement
-- 
-- IMPORTANT : Cette contrainte garantit qu'un utilisateur auth.users
-- ne peut être lié qu'à un seul admin, ce qui est essentiel pour
-- la sécurité et la traçabilité.

