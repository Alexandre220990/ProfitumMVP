-- =====================================================
-- DIAGNOSTIC: ERREURS INSCRIPTION CLIENT
-- =====================================================

-- ============================================================================
-- PROBLÈME 1: CONTRAINTE AdminNotification_priority_check
-- ============================================================================

SELECT '════════════════════════════════════════════════' as sep;
SELECT '🔍 CONTRAINTE PRIORITY - AdminNotification' as titre;

-- Vérifier la contrainte sur la colonne priority
SELECT 
    conname as nom_contrainte,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'AdminNotification_priority_check'
   OR conrelid = (SELECT oid FROM pg_class WHERE relname = 'AdminNotification');

-- Vérifier le type ENUM si c'est un ENUM
SELECT 
    t.typname as type_name,
    e.enumlabel as valeurs_autorisees
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%priority%'
ORDER BY e.enumsortorder;

-- Vérifier la structure de la colonne priority
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'AdminNotification'
  AND column_name = 'priority';

SELECT '';
SELECT '💡 VALEUR UTILISÉE DANS LE CODE: "normal"' as info;
SELECT '⚠️  Cette valeur doit être changée pour respecter la contrainte' as action;

-- ============================================================================
-- PROBLÈME 2: TABLE TemporarySession MANQUANTE
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '🔍 VÉRIFICATION TABLE TemporarySession' as titre;

-- Vérifier si la table existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'TemporarySession'
        ) THEN '✅ Table TemporarySession existe'
        ELSE '❌ Table TemporarySession n''existe PAS'
    END as statut_table;

-- Lister toutes les tables liées aux sessions
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name ILIKE '%session%'
  AND table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- PROBLÈME 3: MIGRATION SESSION ÉCHOUÉE
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '🔍 VÉRIFICATION SESSIONS ET SIMULATIONS' as titre;

-- Vérifier la structure des tables de session
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('SimulatorSession', 'Simulation')
  AND column_name IN ('session_token', 'expires_at', 'migrated', 'client_id', 'status')
ORDER BY table_name, ordinal_position;

-- Vérifier les colonnes de la table Simulation
SELECT '';
SELECT '📋 Colonnes table Simulation:' as info;
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Simulation'
ORDER BY ordinal_position;

-- ============================================================================
-- PROBLÈME 4: VÉRIFIER LA NOTIFICATION ADMIN
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '🔍 STRUCTURE AdminNotification' as titre;

SELECT 
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'AdminNotification'
ORDER BY ordinal_position;

-- ============================================================================
-- RÉSUMÉ DES CORRECTIONS NÉCESSAIRES
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '📊 RÉSUMÉ DES CORRECTIONS' as titre;

SELECT 
    '1. AdminNotification.priority' as probleme,
    'Changer "normal" en valeur autorisée (low/medium/high)' as solution
UNION ALL
SELECT 
    '2. Table TemporarySession',
    'Supprimer les références ou créer la table'
UNION ALL
SELECT 
    '3. Migration session',
    'Vérifier logique de migration dans le backend';

