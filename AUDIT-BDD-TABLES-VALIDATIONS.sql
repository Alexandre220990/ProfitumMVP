-- ============================================================================
-- AUDIT COMPLET - TABLES LIÉES AUX VALIDATIONS
-- Date: 2025-01-10
-- Objectif: Identifier toutes les tables et colonnes liées aux validations
-- ============================================================================

-- ============================================================================
-- 1. TABLE DossierStep (Étapes du workflow)
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type",
    is_nullable AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'DossierStep'
ORDER BY ordinal_position;

-- Valeurs actuelles
SELECT 
    step_name AS "Nom Étape",
    status AS "Statut",
    COUNT(*) AS "Nombre"
FROM "DossierStep"
GROUP BY step_name, status
ORDER BY step_name, COUNT(*) DESC;

-- ============================================================================
-- 2. TABLE ClientProcessDocument (Documents avec validation)
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ClientProcessDocument'
AND (
    column_name ILIKE '%validation%' 
    OR column_name ILIKE '%status%'
    OR column_name ILIKE '%approved%'
    OR column_name ILIKE '%rejected%'
)
ORDER BY column_name;

-- Statuts de validation des documents
SELECT 
    validation_status AS "Statut Validation",
    COUNT(*) AS "Nombre",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "% du total"
FROM "ClientProcessDocument"
WHERE validation_status IS NOT NULL
GROUP BY validation_status
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 3. TABLE document_request (Demandes de documents)
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'document_request'
ORDER BY ordinal_position;

-- Statuts des demandes
SELECT 
    status AS "Statut",
    COUNT(*) AS "Nombre"
FROM "document_request"
GROUP BY status
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 4. TABLE dossier_timeline (Timeline des événements)
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'dossier_timeline'
ORDER BY ordinal_position;

-- Types d'événements liés aux validations
SELECT 
    type AS "Type Événement",
    COUNT(*) AS "Nombre"
FROM "dossier_timeline"
WHERE type ILIKE '%validation%' 
   OR type ILIKE '%approved%' 
   OR type ILIKE '%rejected%'
   OR type ILIKE '%eligib%'
GROUP BY type
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 5. TABLE notification (Notifications de validation)
-- ============================================================================
SELECT 
    notification_type AS "Type Notification",
    COUNT(*) AS "Nombre"
FROM "notification"
WHERE notification_type ILIKE '%eligib%'
   OR notification_type ILIKE '%validation%'
   OR notification_type ILIKE '%approved%'
   OR notification_type ILIKE '%rejected%'
GROUP BY notification_type
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 6. RECHERCHE GLOBALE - Toutes colonnes liées aux validations
-- ============================================================================
SELECT 
    table_name AS "Table",
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name ILIKE '%eligib%' 
    OR column_name ILIKE '%validation%'
    OR column_name ILIKE '%validated%'
    OR column_name ILIKE '%approved%'
    OR column_name ILIKE '%admin%status%'
    OR column_name ILIKE '%expert%status%'
)
ORDER BY table_name, column_name;

-- ============================================================================
-- 7. ANALYSE DES DÉPENDANCES - Impact d'une migration
-- ============================================================================
-- Requêtes qui utilisent le champ statut
WITH queries_sample AS (
    SELECT 
        statut,
        COUNT(*) as count
    FROM "ClientProduitEligible"
    GROUP BY statut
)
SELECT 
    statut AS "Statut actuel",
    count AS "Nombre d'utilisations",
    CASE 
        WHEN statut ILIKE '%eligib%validated%' THEN 'Admin validé'
        WHEN statut ILIKE '%expert%' THEN 'Expert assigné'
        WHEN statut ILIKE '%rejected%' THEN 'Rejeté'
        WHEN statut ILIKE '%pending%' THEN 'En attente'
        WHEN statut = 'en_cours' THEN 'En cours'
        ELSE 'Autre'
    END AS "Catégorie suggérée"
FROM queries_sample
ORDER BY count DESC;

-- ============================================================================
-- 8. TABLES AVEC JSONB (Pour metadata)
-- ============================================================================
SELECT 
    table_name AS "Table",
    column_name AS "Colonne JSONB"
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type = 'jsonb'
AND (
    table_name ILIKE '%client%'
    OR table_name ILIKE '%dossier%'
    OR table_name ILIKE '%expert%'
)
ORDER BY table_name;

-- ============================================================================
-- 9. RÉSUMÉ POUR MIGRATION
-- ============================================================================
SELECT 
    '📊 RÉSUMÉ DE L''AUDIT' AS "Section",
    '' AS "Détail";

SELECT 'ClientProduitEligible' AS "Table", COUNT(*) AS "Lignes" FROM "ClientProduitEligible"
UNION ALL
SELECT 'DossierStep', COUNT(*) FROM "DossierStep"
UNION ALL
SELECT 'ClientProcessDocument', COUNT(*) FROM "ClientProcessDocument"
UNION ALL
SELECT 'document_request', COUNT(*) FROM "document_request"
UNION ALL
SELECT 'dossier_timeline', COUNT(*) FROM "dossier_timeline"
UNION ALL
SELECT 'notification', COUNT(*) FROM "notification"
ORDER BY "Table";

-- ============================================================================
-- FIN DE L'AUDIT
-- ============================================================================
SELECT 
    '✅ Audit terminé !' AS "Statut",
    NOW() AS "Horodatage";

