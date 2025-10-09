-- ============================================================================
-- MIGRATION: Uniformisation du type 'apporteur_affaires' vers 'apporteur'
-- ============================================================================
-- Date: 9 octobre 2025
-- Objectif: Aligner tous les types d'utilisateurs sur 'apporteur' au lieu de 'apporteur_affaires'
-- 
-- ATTENTION: Ce script modifie les données en production
-- Faire un backup avant d'exécuter !
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. METTRE À JOUR LA TABLE ApporteurAffaires
-- ============================================================================

-- Ajouter une colonne 'type' si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ApporteurAffaires' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE "ApporteurAffaires" ADD COLUMN "type" VARCHAR(50) DEFAULT 'apporteur';
        RAISE NOTICE 'Colonne type ajoutée à ApporteurAffaires';
    END IF;
END $$;

-- Mettre à jour tous les types vers 'apporteur'
UPDATE "ApporteurAffaires"
SET "type" = 'apporteur'
WHERE "type" IS NULL OR "type" = 'apporteur_affaires' OR "type" != 'apporteur';

-- Rapport de mise à jour
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count FROM "ApporteurAffaires" WHERE "type" = 'apporteur';
    RAISE NOTICE '✅ % apporteurs mis à jour avec type = apporteur', updated_count;
END $$;

-- ============================================================================
-- 2. METTRE À JOUR auth.users (Supabase Auth) - user_metadata
-- ============================================================================

-- Note: Cette partie nécessite l'accès à auth.users (table système Supabase)
-- Si vous n'avez pas accès, cette partie doit être faite via le Dashboard Supabase

-- Mettre à jour les user_metadata pour les apporteurs
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"apporteur"'::jsonb
)
WHERE raw_user_meta_data->>'type' = 'apporteur_affaires'
   OR raw_user_meta_data->>'role' = 'apporteur_affaires';

-- Mettre à jour le rôle également si présent
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"apporteur"'::jsonb
)
WHERE raw_user_meta_data->>'role' = 'apporteur_affaires';

-- Rapport
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM auth.users 
    WHERE raw_user_meta_data->>'type' = 'apporteur';
    RAISE NOTICE '✅ % utilisateurs auth mis à jour avec type = apporteur', updated_count;
END $$;

-- ============================================================================
-- 3. METTRE À JOUR LES SESSIONS ACTIVES (si table user_sessions existe)
-- ============================================================================

-- Cette table a été créée pour les refresh tokens
-- Invalider toutes les sessions des apporteurs pour forcer une nouvelle connexion

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_sessions'
    ) THEN
        -- Invalider les anciennes sessions d'apporteurs
        UPDATE "user_sessions"
        SET "is_active" = false,
            "revoked_at" = NOW()
        WHERE "user_id" IN (
            SELECT "id" FROM "ApporteurAffaires"
        )
        AND "is_active" = true;
        
        RAISE NOTICE '✅ Sessions d''apporteurs invalidées (devront se reconnecter avec nouveau type)';
    END IF;
END $$;

-- ============================================================================
-- 4. VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- Vérifier qu'il n'y a plus de 'apporteur_affaires' dans ApporteurAffaires
DO $$
DECLARE
    old_type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_type_count 
    FROM "ApporteurAffaires" 
    WHERE "type" = 'apporteur_affaires';
    
    IF old_type_count > 0 THEN
        RAISE WARNING '⚠️ Il reste % enregistrements avec type = apporteur_affaires', old_type_count;
    ELSE
        RAISE NOTICE '✅ Aucun apporteur_affaires restant dans ApporteurAffaires';
    END IF;
END $$;

-- Vérifier auth.users
DO $$
DECLARE
    old_type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_type_count 
    FROM auth.users 
    WHERE raw_user_meta_data->>'type' = 'apporteur_affaires'
       OR raw_user_meta_data->>'role' = 'apporteur_affaires';
    
    IF old_type_count > 0 THEN
        RAISE WARNING '⚠️ Il reste % utilisateurs auth avec type/role = apporteur_affaires', old_type_count;
    ELSE
        RAISE NOTICE '✅ Aucun apporteur_affaires restant dans auth.users';
    END IF;
END $$;

-- ============================================================================
-- 5. RAPPORT FINAL
-- ============================================================================

DO $$
DECLARE
    total_apporteurs INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_apporteurs FROM "ApporteurAffaires";
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  MIGRATION TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total d''apporteurs dans le système: %', total_apporteurs;
    RAISE NOTICE 'Type standardisé: apporteur';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANT:';
    RAISE NOTICE '- Tous les apporteurs devront se reconnecter';
    RAISE NOTICE '- Leurs anciens tokens sont invalidés';
    RAISE NOTICE '- Nouveaux tokens auront type = "apporteur"';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK EN CAS D'ERREUR
-- ============================================================================
-- Si quelque chose se passe mal, exécuter:
-- ROLLBACK;

