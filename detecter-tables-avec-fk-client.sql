-- ============================================================================
-- SCRIPT DE DÉTECTION AUTOMATIQUE DES TABLES AVEC FK VERS CLIENT
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Détecter automatiquement toutes les tables qui référencent Client
-- Usage: Exécuter pour connaître toutes les dépendances avant suppression
-- ============================================================================

-- ============================================================================
-- DÉTECTION AUTOMATIQUE DES CONTRAINTES FK VERS CLIENT
-- ============================================================================

SELECT 
    '🔍 DÉTECTION DES TABLES AVEC FOREIGN KEY VERS CLIENT' as info;

-- Trouver toutes les tables qui ont une FK vers Client
SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name as fk_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CASCADE'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ SET NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ RESTRICT'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ NO ACTION'
        ELSE '❓ ' || rc.delete_rule
    END as delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'Client'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- DÉTECTION DES COLONNES POUVANT RÉFÉRENCER CLIENT (MÊME SANS FK)
-- ============================================================================

SELECT 
    '🔍 COLONNES POTENTIELLES RÉFÉRENCANT CLIENT (sans FK formelle)' as info;

-- Trouver toutes les colonnes qui pourraient référencer Client
-- par leur nom (client_id, clientId, etc.)
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name LIKE '%client%' THEN '✅ Probable référence Client'
        ELSE '⚠️ À vérifier manuellement'
    END as observation
FROM information_schema.columns
WHERE table_schema = 'public'
    AND (
        LOWER(column_name) LIKE '%client%'
        OR LOWER(column_name) LIKE '%clientid%'
    )
    AND table_name NOT IN (
        SELECT DISTINCT tc.table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'Client'
            AND kcu.column_name = information_schema.columns.column_name
    )
ORDER BY table_name, column_name;

-- ============================================================================
-- GÉNÉRATION AUTOMATIQUE DE REQUÊTES DE VÉRIFICATION
-- ============================================================================

SELECT 
    '📋 REQUÊTES SQL GÉNÉRÉES POUR VÉRIFIER LES DÉPENDANCES' as info;

-- Générer les requêtes COUNT pour chaque table avec FK
SELECT 
    'SELECT ''' || tc.table_name || ''' as table_name, COUNT(*) as nombre_dependances FROM "' || tc.table_name || '" WHERE "' || kcu.column_name || '" IN (SELECT id FROM temp_client_ids);' as requete_verification
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'Client'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- GÉNÉRATION AUTOMATIQUE DE REQUÊTES DE SUPPRESSION
-- ============================================================================

SELECT 
    '🗑️ REQUÊTES SQL GÉNÉRÉES POUR SUPPRIMER LES DÉPENDANCES' as info;

-- Générer les requêtes DELETE pour chaque table avec FK (dans l'ordre)
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE 
            WHEN tc.table_name LIKE '%document%' THEN 1
            WHEN tc.table_name LIKE '%dossier%' OR tc.table_name LIKE '%produit%' THEN 2
            WHEN tc.table_name LIKE '%charte%' OR tc.table_name LIKE '%signature%' THEN 3
            WHEN tc.table_name LIKE '%audit%' THEN 4
            WHEN tc.table_name LIKE '%simulation%' THEN 5
            ELSE 10
        END,
        tc.table_name
    ) as ordre_suppression,
    'DELETE FROM "' || tc.table_name || '" WHERE "' || kcu.column_name || '" IN (SELECT id FROM temp_client_ids);' as requete_suppression,
    '-- ' || tc.table_name || ' (' || kcu.column_name || ')' as commentaire
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'Client'
    AND tc.table_schema = 'public'
ORDER BY ordre_suppression;

-- ============================================================================
-- VÉRIFICATION DES RÈGLES DE SUPPRESSION CASCADE
-- ============================================================================

SELECT 
    '⚠️ TABLES AVEC CASCADE - SUPPRESSION AUTOMATIQUE' as info;

SELECT 
    tc.table_name,
    kcu.column_name,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Supprimé automatiquement si Client supprimé'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ Colonne mise à NULL si Client supprimé'
        ELSE '❌ Erreur si Client supprimé - Suppression manuelle requise'
    END as comportement_suppression
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'Client'
    AND tc.table_schema = 'public'
ORDER BY 
    CASE rc.delete_rule 
        WHEN 'CASCADE' THEN 1
        WHEN 'SET NULL' THEN 2
        ELSE 3
    END,
    tc.table_name;

\echo ''
\echo '✅ DÉTECTION TERMINÉE'
\echo ''
\echo '📝 UTILISATION:'
\echo '1. Vérifiez les tables listées ci-dessus'
\echo '2. Utilisez les requêtes générées dans vos scripts de nettoyage'
\echo '3. Les tables avec CASCADE seront supprimées automatiquement'
\echo '4. Les autres nécessitent une suppression manuelle avant Client'
\echo ''

