-- ============================================================================
-- MIGRATION SUPABASE: Type 'apporteur' (SIMPLIFIÉ)
-- ============================================================================
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1: Vérifier la structure de ApporteurAffaires
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ApporteurAffaires'
ORDER BY ordinal_position;

-- ÉTAPE 2: Mettre à jour auth.users - user_metadata
-- Changer 'apporteur_affaires' en 'apporteur' dans les métadonnées

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"apporteur"'::jsonb
)
WHERE raw_user_meta_data->>'type' = 'apporteur_affaires';

-- ÉTAPE 3: Mettre à jour le role également
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"apporteur"'::jsonb
)
WHERE raw_user_meta_data->>'role' = 'apporteur_affaires';

-- ÉTAPE 4: Vérification - Compter les utilisateurs mis à jour
SELECT 
    COUNT(*) as total_apporteurs,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'apporteur') as avec_type_apporteur,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'apporteur_affaires') as avec_ancien_type
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'apporteur' 
   OR raw_user_meta_data->>'type' = 'apporteur'
   OR raw_user_meta_data->>'role' = 'apporteur_affaires' 
   OR raw_user_meta_data->>'type' = 'apporteur_affaires';

-- ÉTAPE 5: Invalider les sessions actives des apporteurs (si table existe)
UPDATE user_sessions
SET is_active = false,
    revoked_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'type' = 'apporteur'
       OR raw_user_meta_data->>'role' = 'apporteur'
)
AND is_active = true;

-- RÉSULTAT FINAL
SELECT 
    '✅ MIGRATION TERMINÉE' as status,
    COUNT(*) as total_apporteurs_migres
FROM auth.users
WHERE raw_user_meta_data->>'type' = 'apporteur';

