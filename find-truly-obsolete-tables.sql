-- ============================================================================
-- RECHERCHE DES TABLES VRAIMENT OBSOLÈTES/INUTILES
-- ============================================================================
-- Date : 22 octobre 2025
-- Note : CalendarEvent et RDV sont TOUTES LES DEUX en production !

-- 1. Lister TOUTES les tables avec leur taille
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as taille,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as nb_colonnes
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 50;

-- 2. Tables avec noms suspects (backup, old, temp, test)
-- ============================================================================
SELECT 
    '🗑️ TABLES SUSPECTES' as categorie,
    tablename,
    pg_size_pretty(pg_total_relation_size('public'||'.'||tablename)) as taille
FROM pg_tables
WHERE schemaname = 'public'
AND (
    tablename LIKE '%_old%'
    OR tablename LIKE '%_backup%'
    OR tablename LIKE '%_temp%'
    OR tablename LIKE '%_test%'
    OR tablename LIKE '%_migration%'
    OR tablename LIKE '%bak%'
    OR tablename LIKE 'tmp_%'
    OR tablename LIKE 'test_%'
)
ORDER BY tablename;

-- 3. Tables sans foreign keys ET sans indexes (potentiellement isolées)
-- ============================================================================
WITH table_fks AS (
    SELECT 
        tc.table_name,
        COUNT(*) as nb_fk
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    GROUP BY tc.table_name
),
table_indexes AS (
    SELECT 
        tablename as table_name,
        COUNT(*) as nb_indexes
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY tablename
)
SELECT 
    '⚠️ TABLES ISOLÉES (0 FK, peu d''indexes)' as categorie,
    t.tablename,
    COALESCE(fks.nb_fk, 0) as nb_foreign_keys,
    COALESCE(idx.nb_indexes, 0) as nb_indexes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as nb_colonnes
FROM pg_tables t
LEFT JOIN table_fks fks ON t.tablename = fks.table_name
LEFT JOIN table_indexes idx ON t.tablename = idx.table_name
WHERE t.schemaname = 'public'
AND COALESCE(fks.nb_fk, 0) = 0
AND COALESCE(idx.nb_indexes, 0) <= 2
AND t.tablename NOT IN ('RDV', 'CalendarEvent', 'Client', 'Expert', 'ApporteurAffaires', 'ProduitEligible')
ORDER BY t.tablename;

-- 4. Tables de migration Supabase (peuvent être nettoyées)
-- ============================================================================
SELECT 
    '📦 TABLES SYSTÈME/MIGRATION' as categorie,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND (
    tablename LIKE 'schema_migrations%'
    OR tablename LIKE 'supabase_%'
    OR tablename LIKE '_prisma%'
)
ORDER BY tablename;

-- 5. Vérifier si ClientRDV existe (ancienne version remplacée par RDV)
-- ============================================================================
SELECT 
    '🔍 VÉRIFICATION ClientRDV' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClientRDV') 
        THEN 'ClientRDV existe - à migrer vers RDV'
        ELSE 'ClientRDV n''existe pas (OK)'
    END as statut;

-- 6. Tables avec 0 lignes (potentiellement inutilisées)
-- ============================================================================
-- Note: À exécuter manuellement pour les tables suspectes identifiées

-- 7. RÉSUMÉ FINAL
-- ============================================================================
SELECT 
    '✅ RÉSUMÉ' as section,
    'CalendarEvent : PRODUCTION (ne pas supprimer)' as calendrier,
    'RDV : PRODUCTION (ne pas supprimer)' as rdv,
    'Chercher : tables _old, _backup, _temp, _test' as a_verifier;

