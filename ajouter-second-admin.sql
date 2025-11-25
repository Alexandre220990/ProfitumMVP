-- ============================================================================
-- AJOUT D'UN SECOND ADMIN AVEC TRACABILITÉ COMPLÈTE
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Ajouter un second admin avec les mêmes droits et accès,
--            avec traçabilité complète de toutes les actions
-- ============================================================================
-- 
-- PRÉREQUIS :
-- 1. L'utilisateur doit déjà exister dans Supabase Auth
-- 2. Remplacer les valeurs entre < > par les vraies valeurs
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : VÉRIFICATIONS PRÉALABLES
-- ============================================================================

-- Vérifier que la table Admin existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Admin'
    ) THEN
        RAISE EXCEPTION '❌ La table Admin n''existe pas';
    ELSE
        RAISE NOTICE '✅ Table Admin existe';
    END IF;
END $$;

-- Vérifier que AdminAuditLog existe (pour la traçabilité)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
    ) THEN
        RAISE WARNING '⚠️ La table AdminAuditLog n''existe pas - La traçabilité ne fonctionnera pas';
    ELSE
        RAISE NOTICE '✅ Table AdminAuditLog existe - Traçabilité disponible';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : CRÉER L'UTILISATEUR DANS SUPABASE AUTH (À FAIRE MANUELLEMENT)
-- ============================================================================

-- ⚠️ IMPORTANT : Cette étape doit être faite via l'interface Supabase ou l'API
-- 
-- Instructions :
-- 1. Aller dans Supabase Dashboard > Authentication > Users
-- 2. Cliquer sur "Add user" > "Create new user"
-- 3. Entrer l'email : <EMAIL_DU_SECOND_ADMIN>
-- 4. Générer un mot de passe temporaire
-- 5. Noter l'ID de l'utilisateur créé (auth_user_id)
-- 
-- OU utiliser l'API :
-- POST https://<PROJECT_REF>.supabase.co/auth/v1/admin/users
-- Headers: { "Authorization": "Bearer <SERVICE_ROLE_KEY>" }
-- Body: {
--   "email": "<EMAIL_DU_SECOND_ADMIN>",
--   "password": "<MOT_DE_PASSE_TEMPORAIRE>",
--   "email_confirm": true,
--   "user_metadata": { "type": "admin", "name": "<NOM_DU_SECOND_ADMIN>" }
-- }

-- ============================================================================
-- ÉTAPE 3 : CRÉER L'ENTRÉE DANS LA TABLE Admin
-- ============================================================================

-- ⚠️ REMPLACER LES VALEURS ENTRE < > PAR LES VRAIES VALEURS

INSERT INTO "Admin" (
    id,
    email,
    name,
    role,
    is_active,
    auth_user_id,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(), -- Ou spécifier un UUID spécifique
    '<EMAIL_DU_SECOND_ADMIN>', -- Exemple : 'admin2@example.com'
    '<NOM_DU_SECOND_ADMIN>', -- Exemple : 'Second Admin'
    'admin',
    true,
    '<AUTH_USER_ID_FROM_SUPABASE>', -- UUID de l'utilisateur créé dans auth.users
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    auth_user_id = EXCLUDED.auth_user_id,
    is_active = true,
    updated_at = NOW();

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION DE LA CRÉATION
-- ============================================================================

-- Vérifier que l'admin a été créé
SELECT 
    'VERIFICATION CREATION ADMIN' as etape,
    id,
    email,
    name,
    is_active,
    auth_user_id,
    created_at
FROM "Admin"
WHERE email = '<EMAIL_DU_SECOND_ADMIN>';

-- Vérifier la liaison avec auth.users
SELECT 
    'VERIFICATION LIAISON AUTH' as etape,
    a.id as admin_id,
    a.email as admin_email,
    a.name as admin_name,
    a.auth_user_id,
    au.id as auth_user_id_verifie,
    au.email as auth_email,
    CASE 
        WHEN a.auth_user_id = au.id THEN '✅ Lié correctement'
        WHEN a.auth_user_id IS NULL THEN '❌ auth_user_id NULL'
        WHEN au.id IS NULL THEN '❌ Utilisateur auth.users introuvable'
        ELSE '⚠️ Incohérence'
    END as statut_liaison
FROM "Admin" a
LEFT JOIN auth.users au ON a.auth_user_id = au.id
WHERE a.email = '<EMAIL_DU_SECOND_ADMIN>';

-- ============================================================================
-- ÉTAPE 5 : VÉRIFIER LES SESSIONS CONCURRENTES
-- ============================================================================

-- Vérifier que les deux admins peuvent exister simultanément
SELECT 
    'VERIFICATION SESSIONS CONCURRENTES' as etape,
    COUNT(*) as nombre_admins,
    COUNT(CASE WHEN is_active = true THEN 1 END) as admins_actifs,
    STRING_AGG(email, ', ') as liste_emails
FROM "Admin"
WHERE is_active = true;

-- ============================================================================
-- ÉTAPE 6 : TESTER LA TRACABILITÉ (OPTIONNEL)
-- ============================================================================

-- Tester la fonction log_admin_action pour le nouveau admin
-- (À décommenter et exécuter après la création)
/*
DO $$
DECLARE
    v_admin_id UUID;
    v_audit_id UUID;
BEGIN
    -- Récupérer l'ID du nouveau admin
    SELECT id INTO v_admin_id 
    FROM "Admin" 
    WHERE email = '<EMAIL_DU_SECOND_ADMIN>';
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin non trouvé';
    END IF;
    
    -- Tester le logging d'une action
    SELECT log_admin_action(
        v_admin_id,
        'admin_created',
        'Admin',
        v_admin_id,
        '{}'::jsonb,
        jsonb_build_object('email', '<EMAIL_DU_SECOND_ADMIN>'),
        'Test de traçabilité pour le nouveau admin',
        'info'
    ) INTO v_audit_id;
    
    RAISE NOTICE '✅ Test de traçabilité réussi - Audit ID: %', v_audit_id;
END $$;
*/

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
-- Après exécution de ce script :
-- 1. ✅ Le second admin est créé dans la table Admin
-- 2. ✅ Il est lié à auth.users via auth_user_id
-- 3. ✅ Les deux admins peuvent se connecter simultanément
-- 4. ✅ Toutes les actions seront tracées via AdminAuditLog
-- 
-- PROCHAINES ÉTAPES :
-- 1. Le second admin doit se connecter avec son email et le mot de passe temporaire
-- 2. Il devra changer son mot de passe à la première connexion
-- 3. Vérifier que les actions sont bien tracées dans AdminAuditLog

