-- ============================================================================
-- CRÉATION FONCTION RPC POUR CONFIGURATION RLS
-- ============================================================================

-- 1. Créer la fonction set_config si elle n'existe pas
CREATE OR REPLACE FUNCTION set_config(key text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config(key, value, false);
END;
$$;

-- 2. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION set_config(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(text, text) TO service_role;

-- 3. Test de la fonction
SELECT set_config('app.user_type', 'client');
SELECT set_config('app.user_id', '3d451dde-00ba-4ad2-b572-6a10bdad354f');

-- 4. Vérifier que les paramètres sont définis
SELECT 
    'RLS_CONFIG_TEST' as check_type,
    current_setting('app.user_type', true) as user_type,
    current_setting('app.user_id', true) as user_id;

-- 5. Nettoyer les paramètres de test
SELECT set_config('app.user_type', '');
SELECT set_config('app.user_id', '');
