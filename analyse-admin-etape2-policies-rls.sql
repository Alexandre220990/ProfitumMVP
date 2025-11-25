-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 2 : POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Analyser les politiques RLS de la table Admin pour comprendre
--            les règles de sécurité et d'accès
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION SI RLS EST ACTIVÉ SUR LA TABLE ADMIN
-- ============================================================================

SELECT 
    'RLS STATUS' as analyse_etape,
    schemaname,
    tablename,
    rowsecurity as rls_actif,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ACTIVÉ'
        ELSE '❌ RLS DÉSACTIVÉ'
    END as statut_rls
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'Admin';

-- ============================================================================
-- 2. TOUTES LES POLITIQUES RLS SUR LA TABLE ADMIN
-- ============================================================================

SELECT 
    'POLITIQUES RLS' as analyse_etape,
    schemaname,
    tablename,
    policyname as nom_politique,
    permissive,
    roles as roles_concernes,
    cmd as commande_sql, -- SELECT, INSERT, UPDATE, DELETE, ALL
    qual as condition_where,
    with_check as condition_with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'Admin'
ORDER BY policyname;

-- ============================================================================
-- 3. DÉTAILS COMPLETS DES POLITIQUES (VERSION ALTERNATIVE)
-- ============================================================================

SELECT 
    'DETAILS POLITIQUES' as analyse_etape,
    n.nspname as schemaname,
    c.relname as tablename,
    p.polname as policyname,
    p.polpermissive as permissive,
    p.polroles::regrole[]::text[] as roles,
    CASE p.polcmd
        WHEN 'r' THEN 'SELECT (lecture)'
        WHEN 'a' THEN 'INSERT (ajout)'
        WHEN 'w' THEN 'UPDATE (modification)'
        WHEN 'd' THEN 'DELETE (suppression)'
        WHEN '*' THEN 'ALL (toutes opérations)'
        ELSE p.polcmd::text
    END as operation_type,
    -- Extraire la définition complète
    pg_get_expr(p.polqual, p.polrelid) as expression_where,
    pg_get_expr(p.polwithcheck, p.polrelid) as expression_with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'Admin'
  AND n.nspname = 'public'
ORDER BY p.polname;

-- ============================================================================
-- 4. VÉRIFICATION DES PERMISSIONS PAR RÔLE
-- ============================================================================

-- Rôles pouvant accéder à la table Admin
SELECT 
    'PERMISSIONS ROLES' as analyse_etape,
    grantee as role_utilisateur,
    privilege_type as type_privilege,
    is_grantable as peut_octroyer
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'Admin'
ORDER BY grantee, privilege_type;

-- ============================================================================
-- 5. COMPARAISON AVEC D'AUTRES TABLES (Client, Expert) POUR RÉFÉRENCE
-- ============================================================================

-- Vérifier si les autres tables ont des patterns similaires
SELECT 
    'COMPARAISON AUTRES TABLES' as analyse_etape,
    tablename,
    rowsecurity as rls_actif,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as nombre_policies
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN ('Admin', 'Client', 'Expert', 'Apporteur')
ORDER BY tablename;

-- ============================================================================
-- 6. VÉRIFICATION DES FONCTIONS UTILISÉES DANS LES POLITIQUES
-- ============================================================================

-- Chercher les fonctions référencées dans les politiques RLS
SELECT DISTINCT
    'FONCTIONS RLS' as analyse_etape,
    proname as nom_fonction,
    pg_get_functiondef(oid) as definition_fonction
FROM pg_proc
WHERE prosrc LIKE '%Admin%'
  AND proname NOT LIKE 'pg_%'
ORDER BY proname;

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Après exécution de ce script, vous aurez :
-- 1. Le statut RLS (activé/désactivé) sur la table Admin
-- 2. Toutes les politiques RLS avec leurs conditions (WHERE, WITH CHECK)
-- 3. Les types d'opérations couvertes (SELECT, INSERT, UPDATE, DELETE)
-- 4. Les rôles et permissions sur la table
-- 5. Une comparaison avec d'autres tables (Client, Expert)
-- 
-- Prochaine étape : Analyse des systèmes d'audit et de logging existants

