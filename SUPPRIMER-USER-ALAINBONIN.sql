-- =====================================================
-- SUPPRESSION COMPLÈTE: alainbonin@gmail.com
-- =====================================================

-- ⚠️ ATTENTION: Cette suppression est IRRÉVERSIBLE
-- ⚠️ Assurez-vous que c'est bien l'utilisateur à supprimer

-- ============================================================================
-- ÉTAPE 1: VÉRIFIER L'UTILISATEUR
-- ============================================================================

SELECT '════════════════════════════════════════════════' as sep;
SELECT '🔍 VÉRIFICATION UTILISATEUR' as titre;

-- Informations du client
SELECT 
    id as client_id,
    email,
    username,
    company_name,
    auth_user_id,
    created_at,
    type
FROM "Client"
WHERE email = 'alainbonin@gmail.com';

-- Produits associés
SELECT 
    COUNT(*) as nb_produits,
    COALESCE(SUM(montantFinal), 0) as total_montant
FROM "ClientProduitEligible"
WHERE clientId IN (
    SELECT id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- Simulations associées
SELECT 
    COUNT(*) as nb_simulations
FROM "simulations"
WHERE client_id IN (
    SELECT id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- ============================================================================
-- ÉTAPE 2: SUPPRIMER LES DONNÉES ASSOCIÉES
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '🗑️ SUPPRESSION DES DONNÉES ASSOCIÉES' as titre;

-- 2.1 Supprimer les produits éligibles
DELETE FROM "ClientProduitEligible"
WHERE clientId IN (
    SELECT id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- Vérifier
SELECT '✅ Produits éligibles supprimés' as statut;

-- 2.2 Supprimer les simulations
DELETE FROM "simulations"
WHERE client_id IN (
    SELECT id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- Vérifier
SELECT '✅ Simulations supprimées' as statut;

-- 2.3 Supprimer les notifications (si existantes)
DELETE FROM "Notification"
WHERE user_id IN (
    SELECT auth_user_id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- Vérifier
SELECT '✅ Notifications supprimées' as statut;

-- 2.4 Supprimer les messages (si existants)
DELETE FROM "Message"
WHERE sender_id IN (
    SELECT auth_user_id FROM "Client" WHERE email = 'alainbonin@gmail.com'
)
OR recipient_id IN (
    SELECT auth_user_id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- Vérifier
SELECT '✅ Messages supprimés' as statut;

-- 2.5 Supprimer les sessions utilisateur
DELETE FROM "user_sessions"
WHERE user_id IN (
    SELECT auth_user_id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- Vérifier
SELECT '✅ Sessions utilisateur supprimées' as statut;

-- ============================================================================
-- ÉTAPE 3: SUPPRIMER LE CLIENT DE LA TABLE "Client"
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '🗑️ SUPPRESSION DU CLIENT' as titre;

-- Sauvegarder l'auth_user_id pour Supabase Auth
DO $$
DECLARE
    v_auth_user_id uuid;
BEGIN
    -- Récupérer l'auth_user_id
    SELECT auth_user_id INTO v_auth_user_id
    FROM "Client"
    WHERE email = 'alainbonin@gmail.com';
    
    -- Supprimer le client
    DELETE FROM "Client"
    WHERE email = 'alainbonin@gmail.com';
    
    RAISE NOTICE '✅ Client supprimé de la table Client';
    RAISE NOTICE '📝 auth_user_id à supprimer de Supabase Auth: %', v_auth_user_id;
END $$;

-- ============================================================================
-- ÉTAPE 4: SUPPRESSION SUPABASE AUTH (À FAIRE MANUELLEMENT)
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '⚠️ SUPPRESSION SUPABASE AUTH (MANUEL)' as titre;

SELECT 'ATTENTION: La suppression de Supabase Auth doit être faite:' as note
UNION ALL SELECT ''
UNION ALL SELECT '1. Via le Dashboard Supabase:'
UNION ALL SELECT '   → Aller dans Authentication > Users'
UNION ALL SELECT '   → Chercher: alainbonin@gmail.com'
UNION ALL SELECT '   → Cliquer sur les 3 points > Delete user'
UNION ALL SELECT ''
UNION ALL SELECT '2. OU via SQL (si accès direct à auth.users):'
UNION ALL SELECT '   → DELETE FROM auth.users WHERE email = ''alainbonin@gmail.com'';'
UNION ALL SELECT ''
UNION ALL SELECT '⚠️ Sans cette étape, l''utilisateur pourra toujours se connecter!';

-- ============================================================================
-- ÉTAPE 5: VÉRIFICATION FINALE
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '✅ VÉRIFICATION FINALE' as titre;

-- Vérifier que le client n'existe plus
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Client supprimé avec succès'
        ELSE '❌ ERREUR: Le client existe encore'
    END as verification_client
FROM "Client"
WHERE email = 'alainbonin@gmail.com';

-- Vérifier que les produits n'existent plus
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Tous les produits supprimés'
        ELSE '❌ ERREUR: ' || COUNT(*) || ' produit(s) restant(s)'
    END as verification_produits
FROM "ClientProduitEligible" cpe
WHERE EXISTS (
    SELECT 1 FROM "Client" c 
    WHERE c.id = cpe.clientId 
    AND c.email = 'alainbonin@gmail.com'
);

-- Vérifier que les simulations n'existent plus
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Toutes les simulations supprimées'
        ELSE '❌ ERREUR: ' || COUNT(*) || ' simulation(s) restante(s)'
    END as verification_simulations
FROM "simulations" s
WHERE EXISTS (
    SELECT 1 FROM "Client" c 
    WHERE c.id = s.client_id 
    AND c.email = 'alainbonin@gmail.com'
);

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '📊 RÉSUMÉ DE LA SUPPRESSION' as titre;

SELECT '✅ Données supprimées de la base de données PostgreSQL' as etape_1
UNION ALL SELECT '⚠️ Supprimer manuellement de Supabase Auth (Dashboard ou SQL)' as etape_2
UNION ALL SELECT '✅ Vérification finale effectuée' as etape_3;

