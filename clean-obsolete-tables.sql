-- ============================================================================
-- NETTOYAGE TABLES OBSOLÈTES
-- ============================================================================
-- Date : 22 octobre 2025
-- Tables identifiées : notification_templates, performance_tests
-- Vérification : Aucune référence dans le code ✅

-- ⚠️ CE SCRIPT SUPPRIME DÉFINITIVEMENT DES DONNÉES !
-- Recommandation : Sauvegarde avant exécution

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : INFORMATION SUR LES TABLES À SUPPRIMER
-- ============================================================================

-- Afficher les infos des tables
SELECT 
    '📊 INFORMATIONS TABLES À SUPPRIMER' as section;

-- notification_templates
SELECT 
    'notification_templates' as table_name,
    COUNT(*) as nombre_lignes,
    pg_size_pretty(pg_total_relation_size('public.notification_templates')) as taille_disque
FROM notification_templates;

-- performance_tests
SELECT 
    'performance_tests' as table_name,
    COUNT(*) as nombre_lignes,
    pg_size_pretty(pg_total_relation_size('public.performance_tests')) as taille_disque
FROM performance_tests;

-- ============================================================================
-- ÉTAPE 2 : VÉRIFIER LES DÉPENDANCES (foreign keys pointant vers ces tables)
-- ============================================================================

SELECT 
    '🔗 VÉRIFICATION DÉPENDANCES' as section;

-- Vérifier si d'autres tables dépendent de notification_templates
SELECT 
    'notification_templates' as table_cible,
    tc.table_name as table_source,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name = 'notification_templates';

-- Vérifier si d'autres tables dépendent de performance_tests
SELECT 
    'performance_tests' as table_cible,
    tc.table_name as table_source,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name = 'performance_tests';

-- ============================================================================
-- ÉTAPE 3 : SAUVEGARDE (OPTIONNELLE - décommenter si besoin)
-- ============================================================================

-- Si tu veux garder une copie avant suppression :
/*
CREATE TABLE backup_notification_templates AS 
SELECT * FROM notification_templates;

CREATE TABLE backup_performance_tests AS 
SELECT * FROM performance_tests;

SELECT 
    '💾 SAUVEGARDE CRÉÉE' as info,
    (SELECT COUNT(*) FROM backup_notification_templates) as backup_notification_templates,
    (SELECT COUNT(*) FROM backup_performance_tests) as backup_performance_tests;
*/

-- ============================================================================
-- ÉTAPE 4 : SUPPRESSION DES TABLES
-- ============================================================================

-- ⚠️ CASCADE supprimera aussi toutes les dépendances (indexes, triggers, etc.)

DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS performance_tests CASCADE;

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION APRÈS SUPPRESSION
-- ============================================================================

SELECT 
    '✅ VÉRIFICATION POST-SUPPRESSION' as section;

-- Vérifier que les tables n'existent plus
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_templates')
        THEN '❌ notification_templates existe encore'
        ELSE '✅ notification_templates supprimée'
    END as status_notification_templates,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_tests')
        THEN '❌ performance_tests existe encore'
        ELSE '✅ performance_tests supprimée'
    END as status_performance_tests;

-- ============================================================================
-- ÉTAPE 6 : ESPACE DISQUE RÉCUPÉRÉ
-- ============================================================================

-- Note: L'espace sera vraiment libéré après un VACUUM
SELECT 
    '💾 ESPACE RÉCUPÉRÉ' as info,
    '~112 kB (96 kB + 16 kB)' as espace_libere,
    'Exécuter VACUUM pour libérer physiquement' as note;

-- ============================================================================
-- ÉTAPE 7 : DÉCISION FINALE
-- ============================================================================

SELECT 
    '🎯 DÉCISION' as section,
    'Si tout est OK ci-dessus, décommenter COMMIT' as action,
    'Sinon, le ROLLBACK annulera tout' as securite;

-- Par défaut, ROLLBACK (sécurité)
-- Décommenter COMMIT seulement si tu es sûr !

-- COMMIT;
ROLLBACK;

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================================

/*
COMMENT UTILISER CE SCRIPT :

1. PREMIÈRE EXÉCUTION (TEST)
   - Exécuter tel quel (avec ROLLBACK)
   - Vérifier les résultats
   - Aucune modification ne sera faite

2. SUPPRESSION RÉELLE
   - Remplacer ROLLBACK par COMMIT à la fin
   - Exécuter le script
   - Les tables seront supprimées définitivement

3. NETTOYAGE COMPLET (après suppression)
   - Exécuter : VACUUM ANALYZE;
   - Cela libère l'espace disque physiquement

ROLLBACK VS COMMIT :
- ROLLBACK = Annule tout (sécurité)
- COMMIT = Valide les suppressions (définitif)
*/

