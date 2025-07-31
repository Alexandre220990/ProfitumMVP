-- =====================================================
-- ANALYSE DU TRIGGER PROBLÉMATIQUE
-- Date : 2025-01-05
-- Objectif : Analyser le trigger trigger_cleanup_expired_data
-- =====================================================

-- ===== 1. VÉRIFICATION DES TRIGGERS EXISTANTS =====
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'simulations'
ORDER BY trigger_name;

-- ===== 2. VÉRIFICATION DES FONCTIONS DE TRIGGER =====
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%cleanup%' 
OR proname LIKE '%expired%'
OR proname LIKE '%simulations%';

-- ===== 3. VÉRIFICATION DES TRIGGERS SUR SIMULATIONS =====
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'simulations'::regclass;

-- ===== 4. ANALYSE DE LA FONCTION trigger_cleanup_expired_data =====
SELECT 
    p.proname as function_name,
    p.prosrc as function_source,
    p.proargtypes,
    p.prorettype
FROM pg_proc p
WHERE p.proname = 'trigger_cleanup_expired_data';

-- ===== 5. VÉRIFICATION DES TABLES UNIFIED =====
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%unified%'
ORDER BY table_name;

-- ===== 6. RECOMMANDATIONS =====
SELECT 
    'ANALYSE DU TRIGGER' as section,
    '' as detail;

SELECT 
    'Le trigger trigger_cleanup_expired_data fait référence à simulations_unified' as probleme
UNION ALL
SELECT 
    'Cette table n''existe plus après le dédoublonnage'
UNION ALL
SELECT 
    'Le trigger doit être supprimé ou corrigé'
UNION ALL
SELECT 
    'Il servait probablement à nettoyer les données expirées'
UNION ALL
SELECT 
    'Peut être remplacé par un trigger sur la table simulations'
UNION ALL
SELECT 
    'Ou supprimé si le nettoyage se fait autrement'; 