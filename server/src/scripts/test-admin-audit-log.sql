-- =====================================================
-- TEST DE LA TABLE ADMINAUDITLOG
-- Vérification complète des fonctionnalités
-- =====================================================

-- ===== 1. VÉRIFICATION DE LA CRÉATION =====

SELECT 
    '📋 VÉRIFICATION CRÉATION' as section,
    'Table AdminAuditLog' as test,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AdminAuditLog') 
        THEN '✅ Table créée avec succès'
        ELSE '❌ Table non créée'
    END as status;

-- Vérification des colonnes
SELECT 
    '📋 VÉRIFICATION CRÉATION' as section,
    'Colonnes AdminAuditLog' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'admin_id', 'action', 'table_name', 'record_id', 'old_values', 'new_values', 'description', 'severity', 'ip_address', 'user_agent', 'session_id', 'execution_time_ms', 'created_at') 
        THEN '✅ Colonne requise présente'
        ELSE '⚠️ Colonne optionnelle'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
ORDER BY ordinal_position;

-- ===== 2. VÉRIFICATION DES INDEX =====

SELECT 
    '⚡ VÉRIFICATION INDEX' as section,
    'Index AdminAuditLog' as test,
    indexname,
    CASE 
        WHEN indexname LIKE '%_pkey' OR indexname LIKE 'idx_%' 
        THEN '✅ Index créé'
        ELSE '⚠️ Index manquant'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'AdminAuditLog'
ORDER BY indexname;

-- ===== 3. VÉRIFICATION DES FONCTIONS =====

SELECT 
    '🔧 VÉRIFICATION FONCTIONS' as section,
    'Fonctions utilitaires' as test,
    proname as function_name,
    CASE 
        WHEN proname IN ('log_admin_action', 'get_admin_audit_history', 'get_actions_by_type') 
        THEN '✅ Fonction créée'
        ELSE '⚠️ Fonction manquante'
    END as status
FROM pg_proc 
WHERE proname IN ('log_admin_action', 'get_admin_audit_history', 'get_actions_by_type')
ORDER BY proname;

-- ===== 4. VÉRIFICATION DES TRIGGERS =====

SELECT 
    '🔄 VÉRIFICATION TRIGGERS' as section,
    'Triggers automatiques' as test,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE 
        WHEN tgname = 'log_expert_changes_trigger' 
        THEN '✅ Trigger créé'
        ELSE '⚠️ Trigger manquant'
    END as status
FROM pg_trigger 
WHERE tgname = 'log_expert_changes_trigger';

-- ===== 5. VÉRIFICATION DES VUES =====

SELECT 
    '👁️ VÉRIFICATION VUES' as section,
    'Vues utilitaires' as test,
    viewname as view_name,
    CASE 
        WHEN viewname IN ('admin_recent_actions', 'admin_action_stats', 'admin_critical_actions') 
        THEN '✅ Vue créée'
        ELSE '⚠️ Vue manquante'
    END as status
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('admin_recent_actions', 'admin_action_stats', 'admin_critical_actions')
ORDER BY viewname;

-- ===== 6. VÉRIFICATION DES POLITIQUES RLS =====

SELECT 
    '🔒 VÉRIFICATION RLS' as section,
    'Politiques de sécurité' as test,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN policyname IS NOT NULL 
        THEN '✅ Politique configurée'
        ELSE '⚠️ Politique manquante'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'AdminAuditLog'
ORDER BY policyname;

-- ===== 7. TEST DES FONCTIONS =====

-- Test de la fonction log_admin_action
DO $$
DECLARE
    v_admin_id UUID;
    v_audit_id UUID;
BEGIN
    -- Récupérer un admin existant
    SELECT id INTO v_admin_id FROM "Admin" LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RAISE NOTICE '⚠️ Aucun admin trouvé pour le test';
        RETURN;
    END IF;
    
    -- Tester la fonction log_admin_action
    SELECT log_admin_action(
        v_admin_id,
        'expert_created',
        'Expert',
        gen_random_uuid(),
        '{}'::jsonb,
        '{"name": "Test Expert", "email": "test@example.com"}'::jsonb,
        'Test: Expert créé via formulaire',
        'info',
        '127.0.0.1'::INET,
        'Test User Agent',
        'test-session-123'
    ) INTO v_audit_id;
    
    IF v_audit_id IS NOT NULL THEN
        RAISE NOTICE '✅ Fonction log_admin_action testée avec succès, ID: %', v_audit_id;
    ELSE
        RAISE NOTICE '❌ Échec du test de log_admin_action';
    END IF;
END $$;

-- ===== 8. TEST DES VUES =====

-- Test de la vue admin_recent_actions
SELECT 
    '👁️ TEST VUES' as section,
    'Vue admin_recent_actions' as test,
    CASE 
        WHEN EXISTS (SELECT FROM admin_recent_actions LIMIT 1) 
        THEN '✅ Vue fonctionnelle'
        ELSE '⚠️ Vue vide ou erreur'
    END as status;

-- Test de la vue admin_action_stats
SELECT 
    '👁️ TEST VUES' as section,
    'Vue admin_action_stats' as test,
    CASE 
        WHEN EXISTS (SELECT FROM admin_action_stats LIMIT 1) 
        THEN '✅ Vue fonctionnelle'
        ELSE '⚠️ Vue vide ou erreur'
    END as status;

-- Test de la vue admin_critical_actions
SELECT 
    '👁️ TEST VUES' as section,
    'Vue admin_critical_actions' as test,
    CASE 
        WHEN EXISTS (SELECT FROM admin_critical_actions LIMIT 1) 
        THEN '✅ Vue fonctionnelle'
        ELSE '⚠️ Vue vide ou erreur'
    END as status;

-- ===== 9. TEST DES CONTRAINTES =====

-- Test de la contrainte CHECK sur action
DO $$
BEGIN
    BEGIN
        INSERT INTO "AdminAuditLog" (admin_id, action, table_name, description)
        VALUES (
            (SELECT id FROM "Admin" LIMIT 1),
            'invalid_action',
            'Test',
            'Test contrainte'
        );
        RAISE NOTICE '❌ Contrainte CHECK sur action non respectée';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ Contrainte CHECK sur action respectée';
    END;
END $$;

-- Test de la contrainte CHECK sur severity
DO $$
BEGIN
    BEGIN
        INSERT INTO "AdminAuditLog" (admin_id, action, table_name, description, severity)
        VALUES (
            (SELECT id FROM "Admin" LIMIT 1),
            'expert_created',
            'Test',
            'Test contrainte',
            'invalid_severity'
        );
        RAISE NOTICE '❌ Contrainte CHECK sur severity non respectée';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ Contrainte CHECK sur severity respectée';
    END;
END $$;

-- ===== 10. RAPPORT FINAL DE CONFORMITÉ =====

WITH audit_scores AS (
    SELECT 
        -- Score Création (30 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AdminAuditLog') THEN 10 ELSE 0 END +
        CASE WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AdminAuditLog') >= 13 THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'AdminAuditLog') THEN 10 ELSE 0 END as creation_score,
        
        -- Score Fonctionnalités (40 points)
        CASE WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'log_admin_action') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'get_admin_audit_history') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'get_actions_by_type') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_trigger WHERE tgname = 'log_expert_changes_trigger') THEN 10 ELSE 0 END as functionality_score,
        
        -- Score Vues et Sécurité (30 points)
        CASE WHEN EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'admin_recent_actions') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'admin_action_stats') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'AdminAuditLog') THEN 10 ELSE 0 END as security_score
)
SELECT 
    '🎯 CONFORMITÉ ADMINAUDITLOG' as section,
    'Score Création' as test,
    creation_score as score,
    CASE 
        WHEN creation_score >= 25 THEN '✅ Excellent'
        WHEN creation_score >= 20 THEN '✅ Bon'
        WHEN creation_score >= 15 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM audit_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ ADMINAUDITLOG' as section,
    'Score Fonctionnalités' as test,
    functionality_score as score,
    CASE 
        WHEN functionality_score >= 35 THEN '✅ Excellent'
        WHEN functionality_score >= 30 THEN '✅ Bon'
        WHEN functionality_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM audit_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ ADMINAUDITLOG' as section,
    'Score Vues/Sécurité' as test,
    security_score as score,
    CASE 
        WHEN security_score >= 25 THEN '✅ Excellent'
        WHEN security_score >= 20 THEN '✅ Bon'
        WHEN security_score >= 15 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM audit_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ ADMINAUDITLOG' as section,
    'Score Total AdminAuditLog' as test,
    (creation_score + functionality_score + security_score) as score,
    CASE 
        WHEN (creation_score + functionality_score + security_score) >= 85 THEN '✅ Excellent'
        WHEN (creation_score + functionality_score + security_score) >= 70 THEN '✅ Bon'
        WHEN (creation_score + functionality_score + security_score) >= 55 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM audit_scores; 