-- =====================================================
-- ANALYSE DE CONFORMITÉ FORMULAIRE EXPERT + VALIDATION ADMIN
-- Processus d'enregistrement et validation
-- =====================================================

-- ===== 1. ANALYSE FORMULAIRE DE DEMANDE DE CONTACT =====

-- Vérification des champs requis pour le formulaire de demande
SELECT 
    '📝 FORMULAIRE DEMANDE CONTACT' as section,
    'Champs requis formulaire' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('name', 'email', 'company_name', 'siren', 'specializations', 'experience', 'location', 'description', 'phone') 
        THEN '✅ Champ requis formulaire'
        WHEN column_name IN ('website', 'linkedin', 'languages', 'compensation', 'max_clients', 'certifications') 
        THEN '⚠️ Champ optionnel formulaire'
        ELSE 'ℹ️ Champ système'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Expert'
AND column_name IN ('name', 'email', 'company_name', 'siren', 'specializations', 'experience', 'location', 'description', 'phone', 'website', 'linkedin', 'languages', 'compensation', 'max_clients', 'certifications', 'approval_status', 'status', 'rating', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Vérification des champs de validation admin
SELECT 
    '📝 FORMULAIRE DEMANDE CONTACT' as section,
    'Champs validation admin' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('approval_status', 'approved_by', 'approved_at', 'status') 
        THEN '✅ Champ validation admin'
        WHEN column_name IN ('auth_id', 'password', 'card_number', 'card_expiry', 'card_cvc', 'abonnement') 
        THEN '⚠️ Champ post-validation'
        ELSE 'ℹ️ Champ système'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Expert'
AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'status', 'auth_id', 'password', 'card_number', 'card_expiry', 'card_cvc', 'abonnement', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- ===== 2. ANALYSE PROCESSUS DE VALIDATION ADMIN =====

-- Vérification de la table Admin pour la validation
SELECT 
    '👑 VALIDATION ADMIN' as section,
    'Table Admin requise' as test,
    tablename as table_name,
    CASE 
        WHEN tablename = 'Admin' 
        THEN '✅ Table Admin présente'
        ELSE '❌ Table Admin manquante'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Admin';

-- Vérification des champs Admin pour la validation
SELECT 
    '👑 VALIDATION ADMIN' as section,
    'Champs Admin validation' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'auth_id', 'name', 'email', 'role') 
        THEN '✅ Champ Admin requis'
        ELSE '⚠️ Champ Admin optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Admin'
ORDER BY ordinal_position;

-- Vérification des notifications pour la validation
SELECT 
    '👑 VALIDATION ADMIN' as section,
    'Notifications validation' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('user_id', 'user_type', 'title', 'message', 'notification_type', 'priority', 'action_url', 'action_data') 
        THEN '✅ Champ notification requis'
        ELSE '⚠️ Champ notification optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification'
AND column_name IN ('user_id', 'user_type', 'title', 'message', 'notification_type', 'priority', 'action_url', 'action_data', 'is_read', 'created_at')
ORDER BY ordinal_position;

-- ===== 3. ANALYSE DES ÉTAPES DU PROCESSUS =====

-- Vérification des statuts d'approbation possibles
SELECT 
    '🔄 PROCESSUS VALIDATION' as section,
    'Statuts approbation' as test,
    'Valeurs possibles' as field_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Expert' 
            AND column_name = 'approval_status'
        )
        THEN '✅ Champ approval_status présent'
        ELSE '❌ Champ approval_status manquant'
    END as status;

-- Vérification des statuts d'expert possibles
SELECT 
    '🔄 PROCESSUS VALIDATION' as section,
    'Statuts expert' as test,
    'Valeurs possibles' as field_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Expert' 
            AND column_name = 'status'
        )
        THEN '✅ Champ status présent'
        ELSE '❌ Champ status manquant'
    END as status;

-- ===== 4. ANALYSE DES LOGS ET AUDIT =====

-- Vérification de la table AdminAuditLog
SELECT 
    '📋 AUDIT ET LOGS' as section,
    'Table AdminAuditLog' as test,
    tablename as table_name,
    CASE 
        WHEN tablename = 'AdminAuditLog' 
        THEN '✅ Table audit présente'
        ELSE '❌ Table audit manquante'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'AdminAuditLog';

-- Vérification des champs AdminAuditLog
SELECT 
    '📋 AUDIT ET LOGS' as section,
    'Champs AdminAuditLog' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('admin_id', 'action', 'table_name', 'record_id', 'new_values', 'ip_address', 'user_agent', 'created_at') 
        THEN '✅ Champ audit requis'
        ELSE '⚠️ Champ audit optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
ORDER BY ordinal_position;

-- ===== 5. ANALYSE DES RELATIONS DE VALIDATION =====

-- Vérification des clés étrangères pour la validation
SELECT 
    '🔗 RELATIONS VALIDATION' as section,
    'Clés étrangères validation' as test,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.constraint_name IS NOT NULL 
        THEN '✅ Relation configurée'
        ELSE '❌ Relation manquante'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('Expert', 'notification', 'AdminAuditLog')
AND kcu.column_name IN ('approved_by', 'user_id', 'admin_id')
ORDER BY tc.table_name, kcu.column_name;

-- ===== 6. ANALYSE DES INDEX POUR PERFORMANCE =====

-- Vérification des index pour la validation admin
SELECT 
    '⚡ PERFORMANCE VALIDATION' as section,
    'Index validation admin' as test,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%_pkey' OR indexname LIKE 'idx_%' 
        THEN '✅ Index présent'
        ELSE '⚠️ Index manquant'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Expert', 'Admin', 'notification', 'AdminAuditLog')
AND (indexname LIKE '%_pkey' OR indexname LIKE 'idx_%')
ORDER BY tablename, indexname;

-- ===== 7. RAPPORT FINAL DE CONFORMITÉ =====

WITH validation_scores AS (
    SELECT 
        -- Score Formulaire de demande (40 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'name') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'email') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'company_name') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'siren') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'specializations') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'experience') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'location') THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'phone') THEN 5 ELSE 0 END as form_score,
        
        -- Score Validation Admin (40 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Admin') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'approval_status') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'approved_by') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Expert' AND column_name = 'approved_at') THEN 10 ELSE 0 END as validation_score,
        
        -- Score Notifications et Audit (20 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AdminAuditLog') THEN 10 ELSE 0 END as notification_score
)
SELECT 
    '🎯 CONFORMITÉ ENREGISTREMENT EXPERT' as section,
    'Score Formulaire demande' as test,
    form_score as score,
    CASE 
        WHEN form_score >= 35 THEN '✅ Excellent'
        WHEN form_score >= 30 THEN '✅ Bon'
        WHEN form_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM validation_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ ENREGISTREMENT EXPERT' as section,
    'Score Validation Admin' as test,
    validation_score as score,
    CASE 
        WHEN validation_score >= 35 THEN '✅ Excellent'
        WHEN validation_score >= 30 THEN '✅ Bon'
        WHEN validation_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM validation_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ ENREGISTREMENT EXPERT' as section,
    'Score Notifications/Audit' as test,
    notification_score as score,
    CASE 
        WHEN notification_score >= 15 THEN '✅ Excellent'
        WHEN notification_score >= 10 THEN '✅ Bon'
        WHEN notification_score >= 5 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM validation_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ ENREGISTREMENT EXPERT' as section,
    'Score Total Enregistrement' as test,
    (form_score + validation_score + notification_score) as score,
    CASE 
        WHEN (form_score + validation_score + notification_score) >= 85 THEN '✅ Excellent'
        WHEN (form_score + validation_score + notification_score) >= 70 THEN '✅ Bon'
        WHEN (form_score + validation_score + notification_score) >= 55 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM validation_scores; 