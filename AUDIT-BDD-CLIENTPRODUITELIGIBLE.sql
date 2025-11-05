-- ============================================================================
-- AUDIT COMPLET DE LA BASE DE DONNÉES - ClientProduitEligible
-- Date: 2025-01-10
-- Objectif: Vérifier la structure avant refonte des validations
-- ============================================================================

-- ============================================================================
-- 1. STRUCTURE DE LA TABLE ClientProduitEligible
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. INDEX ET CONTRAINTES
-- ============================================================================
SELECT 
    indexname AS "Nom Index",
    indexdef AS "Définition"
FROM pg_indexes
WHERE tablename = 'ClientProduitEligible'
ORDER BY indexname;

-- Contraintes
SELECT
    tc.constraint_name AS "Contrainte",
    tc.constraint_type AS "Type",
    kcu.column_name AS "Colonne",
    ccu.table_name AS "Table Liée",
    ccu.column_name AS "Colonne Liée"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'ClientProduitEligible'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- 3. VALEURS ACTUELLES DU CHAMP statut
-- ============================================================================
SELECT 
    statut AS "Statut",
    COUNT(*) AS "Nombre",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Pourcentage %"
FROM "ClientProduitEligible"
WHERE statut IS NOT NULL
GROUP BY statut
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 4. ANALYSE DU CHAMP metadata
-- ============================================================================
-- Structure du metadata (échantillon)
SELECT 
    id,
    statut,
    metadata,
    created_at,
    updated_at
FROM "ClientProduitEligible"
WHERE metadata IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- Clés présentes dans metadata
SELECT DISTINCT
    jsonb_object_keys(metadata) AS "Clé metadata",
    COUNT(*) AS "Occurrences"
FROM "ClientProduitEligible"
WHERE metadata IS NOT NULL
GROUP BY "Clé metadata"
ORDER BY "Occurrences" DESC;

-- ============================================================================
-- 5. COLONNES LIÉES AUX VALIDATIONS EXISTANTES
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
AND (
    column_name ILIKE '%validation%' 
    OR column_name ILIKE '%validated%'
    OR column_name ILIKE '%eligib%'
    OR column_name ILIKE '%admin%'
    OR column_name ILIKE '%expert%'
)
ORDER BY column_name;

-- ============================================================================
-- 6. STATISTIQUES GLOBALES
-- ============================================================================
SELECT 
    COUNT(*) AS "Total dossiers",
    COUNT(DISTINCT statut) AS "Nombre statuts différents",
    COUNT(CASE WHEN expert_id IS NOT NULL THEN 1 END) AS "Avec expert assigné",
    COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) AS "Avec metadata",
    COUNT(CASE WHEN statut ILIKE '%eligib%' THEN 1 END) AS "Statut éligibilité",
    COUNT(CASE WHEN statut ILIKE '%admin%' OR statut ILIKE '%validated%' THEN 1 END) AS "Validés admin/expert"
FROM "ClientProduitEligible";

-- ============================================================================
-- 7. TABLES LIÉES (POUR COMPRENDRE L'IMPACT)
-- ============================================================================
-- Tables qui référencent ClientProduitEligible
SELECT 
    tc.table_name AS "Table référençante",
    kcu.column_name AS "Colonne FK",
    COUNT(*) AS "Nombre de références"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'ClientProduitEligible'
    AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name, kcu.column_name
ORDER BY tc.table_name;

-- ============================================================================
-- 8. ÉCHANTILLON DE DOSSIERS PAR STATUT
-- ============================================================================
WITH statut_samples AS (
    SELECT 
        statut,
        id,
        "clientId",
        expert_id,
        current_step,
        progress,
        metadata->>'eligibility_validation' AS admin_validation,
        metadata->>'validation_state' AS expert_validation,
        created_at,
        updated_at,
        ROW_NUMBER() OVER (PARTITION BY statut ORDER BY updated_at DESC) AS rn
    FROM "ClientProduitEligible"
)
SELECT 
    statut AS "Statut",
    id AS "ID Dossier",
    CASE WHEN expert_id IS NOT NULL THEN '✓' ELSE '✗' END AS "Expert",
    current_step AS "Étape",
    progress AS "Progress %",
    admin_validation AS "Validation Admin",
    expert_validation AS "Validation Expert",
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI') AS "Dernière MAJ"
FROM statut_samples
WHERE rn <= 2
ORDER BY statut, updated_at DESC;

-- ============================================================================
-- FIN DE L'AUDIT
-- ============================================================================

