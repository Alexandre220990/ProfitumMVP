-- ============================================================================
-- ANALYSE COMPLÈTE DE LA BASE DE DONNÉES
-- ============================================================================
-- Date : 1er octobre 2025
-- Objectif : Analyser toute la structure de la BDD pour optimiser les requêtes
-- ============================================================================

-- ============================================================================
-- 1. LISTE DE TOUTES LES TABLES
-- ============================================================================

SELECT 
    '=== LISTE DES TABLES ===' as section;

SELECT 
    schemaname,
    tablename as nom_table,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = schemaname 
     AND table_name = tablename) as nb_colonnes,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as taille_totale
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. DÉTAIL DE CHAQUE TABLE IMPORTANTE
-- ============================================================================

SELECT 
    '=== STRUCTURE TABLE: Client ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Client'
ORDER BY ordinal_position;

-- ---

SELECT 
    '=== STRUCTURE TABLE: Expert ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Expert'
ORDER BY ordinal_position;

-- ---

SELECT 
    '=== STRUCTURE TABLE: Admin ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Admin'  -- A majuscule car table créée avec guillemets
ORDER BY ordinal_position;

-- ---

SELECT 
    '=== STRUCTURE TABLE: ProduitEligible ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- ---

SELECT 
    '=== STRUCTURE TABLE: ClientProduitEligible ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- ---

SELECT 
    '=== STRUCTURE TABLE: ApporteurAffaires ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ApporteurAffaires'
ORDER BY ordinal_position;

-- ---

SELECT 
    '=== STRUCTURE TABLE: Prospect ===' as section;

SELECT 
    column_name as colonne,
    data_type as type,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Prospect'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. TOUTES LES AUTRES TABLES
-- ============================================================================

SELECT 
    '=== LISTE COMPLÈTE DES COLONNES PAR TABLE ===' as section;

SELECT 
    table_name as table_nom,
    column_name as colonne,
    data_type as type,
    is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name NOT IN ('Client', 'Expert', 'Admin', 'ProduitEligible', 'ClientProduitEligible', 'ApporteurAffaires', 'Prospect')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 4. CLÉS ÉTRANGÈRES (RELATIONS)
-- ============================================================================

SELECT 
    '=== CLÉS ÉTRANGÈRES (RELATIONS) ===' as section;

SELECT
    tc.table_name as table_source,
    kcu.column_name as colonne_source,
    ccu.table_name as table_cible,
    ccu.column_name as colonne_cible,
    tc.constraint_name as nom_contrainte
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 5. INDEX SUR LES TABLES
-- ============================================================================

SELECT 
    '=== INDEX PAR TABLE ===' as section;

SELECT
    schemaname,
    tablename as table_nom,
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 6. VUES EXISTANTES
-- ============================================================================

SELECT 
    '=== VUES EXISTANTES ===' as section;

SELECT 
    table_name as nom_vue,
    view_definition as definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 7. NOMBRE DE LIGNES PAR TABLE
-- ============================================================================

SELECT 
    '=== NOMBRE DE LIGNES PAR TABLE ===' as section;

SELECT 
    schemaname,
    relname as table_nom,
    n_live_tup as nb_lignes,
    n_dead_tup as lignes_mortes,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- 8. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================================

SELECT 
    '=== POLITIQUES RLS ===' as section;

SELECT 
    schemaname,
    tablename as table_nom,
    policyname as nom_politique,
    permissive,
    roles,
    cmd as commande,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING défini'
        ELSE 'Pas de USING'
    END as condition_using,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK défini'
        ELSE 'Pas de WITH CHECK'
    END as condition_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. TYPES DE DONNÉES UTILISÉS
-- ============================================================================

SELECT 
    '=== TYPES DE DONNÉES UTILISÉS ===' as section;

SELECT 
    data_type as type_donnee,
    COUNT(*) as nb_colonnes,
    ARRAY_AGG(DISTINCT table_name) as tables_utilisees
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY data_type
ORDER BY nb_colonnes DESC;

-- ============================================================================
-- 10. COLONNES AVEC VALEURS PAR DÉFAUT
-- ============================================================================

SELECT 
    '=== COLONNES AVEC VALEURS PAR DÉFAUT ===' as section;

SELECT 
    table_name as table_nom,
    column_name as colonne,
    data_type as type,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_default IS NOT NULL
ORDER BY table_name, column_name;

-- ============================================================================
-- 11. COLONNES NULLABLES VS NON-NULLABLES
-- ============================================================================

SELECT 
    '=== STATISTIQUES NULLABLE PAR TABLE ===' as section;

SELECT 
    table_name as table_nom,
    COUNT(*) as total_colonnes,
    COUNT(*) FILTER (WHERE is_nullable = 'YES') as colonnes_nullable,
    COUNT(*) FILTER (WHERE is_nullable = 'NO') as colonnes_non_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- 12. COLONNES TIMESTAMP (pour tracking dates)
-- ============================================================================

SELECT 
    '=== COLONNES TIMESTAMP ===' as section;

SELECT 
    table_name as table_nom,
    column_name as colonne,
    data_type as type,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date')
ORDER BY table_name, column_name;

-- ============================================================================
-- 13. COLONNES JSONB (métadonnées)
-- ============================================================================

SELECT 
    '=== COLONNES JSONB ===' as section;

SELECT 
    table_name as table_nom,
    column_name as colonne,
    column_default as valeur_defaut
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type = 'jsonb'
ORDER BY table_name, column_name;

-- ============================================================================
-- 14. CONTRAINTES CHECK
-- ============================================================================

SELECT 
    '=== CONTRAINTES CHECK ===' as section;

SELECT 
    tc.table_name as table_nom,
    tc.constraint_name as nom_contrainte,
    cc.check_clause as condition
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 15. SÉQUENCES (AUTO-INCREMENT)
-- ============================================================================

SELECT 
    '=== SÉQUENCES ===' as section;

SELECT 
    sequence_schema,
    sequence_name as nom_sequence,
    data_type as type,
    start_value as valeur_debut,
    minimum_value as valeur_min,
    maximum_value as valeur_max,
    increment as increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================================================
-- 16. FONCTIONS ET TRIGGERS
-- ============================================================================

SELECT 
    '=== FONCTIONS CUSTOM ===' as section;

SELECT 
    routine_name as nom_fonction,
    routine_type as type,
    data_type as type_retour,
    routine_definition as definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ---

SELECT 
    '=== TRIGGERS ===' as section;

SELECT 
    event_object_table as table_nom,
    trigger_name as nom_trigger,
    event_manipulation as evenement,
    action_timing as timing,
    action_statement as action
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 17. STATISTIQUES DE PERFORMANCE
-- ============================================================================

SELECT 
    '=== STATISTIQUES D''UTILISATION DES TABLES ===' as section;

SELECT 
    relname as table_nom,
    seq_scan as nb_scans_sequentiels,
    seq_tup_read as lignes_lues_seq,
    idx_scan as nb_scans_index,
    idx_tup_fetch as lignes_lues_index,
    n_tup_ins as insertions,
    n_tup_upd as updates,
    n_tup_del as deletions,
    n_tup_hot_upd as hot_updates
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- ============================================================================
-- 18. TAILLE DES TABLES
-- ============================================================================

SELECT 
    '=== TAILLE DES TABLES ===' as section;

SELECT 
    schemaname,
    tablename as table_nom,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as taille_totale,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as taille_table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as taille_index
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 19. RÉSUMÉ FINAL
-- ============================================================================

SELECT 
    '=== RÉSUMÉ FINAL ===' as section;

SELECT 
    'Tables' as type_objet,
    COUNT(*) as nombre
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Vues' as type_objet,
    COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Colonnes (total)' as type_objet,
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Clés étrangères' as type_objet,
    COUNT(*)
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 
    'Index' as type_objet,
    COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Fonctions' as type_objet,
    COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
    'Triggers' as type_objet,
    COUNT(DISTINCT trigger_name)
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
    'Politiques RLS' as type_objet,
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- FIN DE L'ANALYSE
-- ============================================================================

SELECT 
    '=== ANALYSE TERMINÉE ===' as section,
    NOW() as heure_execution;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
/*
COMMENT UTILISER CE SCRIPT :

1. Copier-coller TOUT le script dans Supabase SQL Editor
2. Exécuter le script complet
3. Copier TOUS les résultats (toutes les sections)
4. Me les envoyer pour que je puisse :
   - Corriger les noms de colonnes dans les vues
   - Optimiser les requêtes selon votre structure exacte
   - Créer des index supplémentaires si nécessaire
   - Vérifier la cohérence des relations

RÉSULTATS ATTENDUS :
✅ Structure complète de toutes les tables
✅ Toutes les colonnes avec leurs types
✅ Toutes les relations (clés étrangères)
✅ Tous les index existants
✅ Statistiques d'utilisation
✅ Taille des tables

Une fois que j'aurai ces informations, je pourrai créer :
- Des vues 100% optimisées et fonctionnelles
- Des requêtes qui utilisent exactement les bons noms de colonnes
- Des index supplémentaires si nécessaire
- Une documentation complète de votre schéma
*/

