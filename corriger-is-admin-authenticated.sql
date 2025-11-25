-- ============================================================================
-- CORRECTION DE LA FONCTION is_admin_authenticated
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Corriger la fonction pour utiliser auth_user_id au lieu de auth_id
--            pour être cohérent avec le reste du système
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : VÉRIFIER LA VERSION ACTUELLE
-- ============================================================================

SELECT 
    'VERSION ACTUELLE' as etape,
    proname as nom_fonction,
    pg_get_functiondef(oid) as definition_actuelle
FROM pg_proc
WHERE proname = 'is_admin_authenticated'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- ÉTAPE 2 : CRÉER/REMPLACER LA FONCTION CORRIGÉE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Vérifier si l'utilisateur authentifié est un admin
  -- Utilise auth_user_id (cohérent avec le reste du système)
  -- Garde aussi la vérification par id pour compatibilité
  SELECT EXISTS (
    SELECT 1
    FROM "Admin"
    WHERE (
        -- Vérification principale via auth_user_id
        "Admin".auth_user_id = auth.uid()
        -- Vérification alternative via id (pour compatibilité)
        OR "Admin".id = auth.uid()
        -- Vérification via auth_id (pour compatibilité avec l'ancien système)
        OR "Admin".auth_id = auth.uid()
    )
    -- Vérifier que l'admin est actif
    AND "Admin".is_active = true
  );
$$;

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LA NOUVELLE VERSION
-- ============================================================================

SELECT 
    'VERSION CORRIGEE' as etape,
    proname as nom_fonction,
    pg_get_functiondef(oid) as definition_nouvelle
FROM pg_proc
WHERE proname = 'is_admin_authenticated'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- ÉTAPE 4 : TESTER LA FONCTION (OPTIONNEL)
-- ============================================================================

-- Note : Cette requête nécessite d'être exécutée dans le contexte d'un utilisateur authentifié
-- Pour tester, connectez-vous en tant qu'admin et exécutez :
-- SELECT is_admin_authenticated();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION public.is_admin_authenticated() IS 
'Vérifie si l''utilisateur authentifié actuel est un admin actif. 
Utilise auth_user_id en priorité, avec fallback sur id et auth_id pour compatibilité.';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
-- La fonction a été corrigée pour :
-- 1. ✅ Utiliser auth_user_id en priorité (cohérent avec le système)
-- 2. ✅ Garder la compatibilité avec id et auth_id
-- 3. ✅ Vérifier que l'admin est actif
-- 
-- Cette fonction est utilisée dans les politiques RLS et les vérifications d'accès

