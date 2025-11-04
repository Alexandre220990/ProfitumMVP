-- ============================================================================
-- ANALYSE COMPLÈTE DE LA TIMELINE - TOUS LES TYPES D'UTILISATEURS
-- ============================================================================
-- Objectif : Identifier tous les événements manquants dans la timeline
-- Types d'acteurs : client, expert, admin, apporteur, system
-- Date : 4 novembre 2025
-- ============================================================================

-- 1️⃣ ÉVÉNEMENTS ACTUELS PAR TYPE D'ACTEUR
-- ============================================================================
SELECT 
    '📊 RÉPARTITION PAR TYPE ACTEUR' as section,
    actor_type,
    COUNT(*) as nb_evenements,
    COUNT(DISTINCT dossier_id) as nb_dossiers,
    MIN(date) as premier_evenement,
    MAX(date) as dernier_evenement
FROM dossier_timeline
GROUP BY actor_type
ORDER BY nb_evenements DESC;

-- ============================================================================

-- 2️⃣ TYPES D'ÉVÉNEMENTS PAR ACTEUR
-- ============================================================================
SELECT 
    '📋 TYPES ÉVÉNEMENTS PAR ACTEUR' as section,
    actor_type,
    type as type_evenement,
    COUNT(*) as nb_occurrences,
    STRING_AGG(DISTINCT title, ' | ' ORDER BY title) as titres_distincts
FROM dossier_timeline
GROUP BY actor_type, type
ORDER BY actor_type, nb_occurrences DESC;

-- ============================================================================

-- 3️⃣ ÉVÉNEMENTS CLIENT - ANALYSE DÉTAILLÉE
-- ============================================================================
SELECT 
    '👤 ÉVÉNEMENTS CLIENT' as section,
    dt.type,
    dt.title,
    dt.description,
    COUNT(*) as nb_occurrences,
    COUNT(DISTINCT dt.dossier_id) as nb_dossiers,
    MIN(dt.date) as premiere_occurrence,
    MAX(dt.date) as derniere_occurrence
FROM dossier_timeline dt
WHERE dt.actor_type = 'client'
GROUP BY dt.type, dt.title, dt.description
ORDER BY nb_occurrences DESC;

-- ============================================================================

-- 4️⃣ ÉVÉNEMENTS EXPERT - ANALYSE DÉTAILLÉE
-- ============================================================================
SELECT 
    '👨‍💼 ÉVÉNEMENTS EXPERT' as section,
    dt.type,
    dt.title,
    dt.description,
    dt.actor_name,
    COUNT(*) as nb_occurrences,
    COUNT(DISTINCT dt.dossier_id) as nb_dossiers,
    MIN(dt.date) as premiere_occurrence,
    MAX(dt.date) as derniere_occurrence
FROM dossier_timeline dt
WHERE dt.actor_type = 'expert'
GROUP BY dt.type, dt.title, dt.description, dt.actor_name
ORDER BY nb_occurrences DESC;

-- ============================================================================

-- 5️⃣ ÉVÉNEMENTS ADMIN - ANALYSE DÉTAILLÉE
-- ============================================================================
SELECT 
    '⚙️ ÉVÉNEMENTS ADMIN' as section,
    dt.type,
    dt.title,
    dt.description,
    dt.actor_name,
    COUNT(*) as nb_occurrences,
    COUNT(DISTINCT dt.dossier_id) as nb_dossiers,
    MIN(dt.date) as premiere_occurrence,
    MAX(dt.date) as derniere_occurrence
FROM dossier_timeline dt
WHERE dt.actor_type = 'admin'
GROUP BY dt.type, dt.title, dt.description, dt.actor_name
ORDER BY nb_occurrences DESC;

-- ============================================================================

-- 6️⃣ ÉVÉNEMENTS SYSTEM - ANALYSE DÉTAILLÉE
-- ============================================================================
SELECT 
    '🤖 ÉVÉNEMENTS SYSTEM' as section,
    dt.type,
    dt.title,
    dt.description,
    COUNT(*) as nb_occurrences,
    COUNT(DISTINCT dt.dossier_id) as nb_dossiers
FROM dossier_timeline dt
WHERE dt.actor_type = 'system'
GROUP BY dt.type, dt.title, dt.description
ORDER BY nb_occurrences DESC;

-- ============================================================================

-- 7️⃣ ÉVÉNEMENTS APPORTEUR - ANALYSE DÉTAILLÉE
-- ============================================================================
SELECT 
    '🤝 ÉVÉNEMENTS APPORTEUR' as section,
    dt.type,
    dt.title,
    dt.description,
    COUNT(*) as nb_occurrences,
    COUNT(DISTINCT dt.dossier_id) as nb_dossiers
FROM dossier_timeline dt
WHERE dt.actor_type = 'apporteur'
GROUP BY dt.type, dt.title, dt.description
ORDER BY nb_occurrences DESC;

-- ============================================================================

-- 8️⃣ DOSSIERS SANS ÉVÉNEMENTS TIMELINE
-- ============================================================================
SELECT 
    '⚠️ DOSSIERS SANS TIMELINE' as section,
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    cpe.statut,
    cpe.current_step as etape,
    cpe.created_at as date_creation,
    cpe.updated_at as derniere_maj
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE NOT EXISTS (
    SELECT 1 FROM dossier_timeline dt 
    WHERE dt.dossier_id = cpe.id
)
ORDER BY cpe.created_at DESC;

-- ============================================================================

-- 9️⃣ ACTIONS CLIENT NON TRACÉES DANS LA TIMELINE
-- ============================================================================
-- A. Documents uploadés sans événement timeline
SELECT 
    '📤 UPLOADS SANS TIMELINE' as section,
    cpd.id as document_id,
    cpd.client_produit_id as dossier_id,
    cpd.filename,
    cpd.created_at as date_upload,
    c.company_name as client,
    pe.nom as produit,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.date::date = cpd.created_at::date
              AND dt.actor_type = 'client'
              AND dt.type = 'document'
        ) THEN '✅ Tracé'
        ELSE '❌ NON TRACÉ'
    END as statut_timeline
FROM "ClientProcessDocument" cpd
JOIN "ClientProduitEligible" cpe ON cpe.id = cpd.client_produit_id
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE NOT EXISTS (
    SELECT 1 FROM dossier_timeline dt 
    WHERE dt.dossier_id = cpd.client_produit_id 
      AND dt.date::date = cpd.created_at::date
      AND dt.metadata::text LIKE '%' || cpd.filename || '%'
)
ORDER BY cpd.created_at DESC
LIMIT 50;

-- ============================================================================

-- 🔟 ACTIONS EXPERT NON TRACÉES DANS LA TIMELINE
-- ============================================================================
-- A. Validations de documents individuels
SELECT 
    '✅ VALIDATIONS DOCS SANS TIMELINE' as section,
    cpd.id as document_id,
    cpd.client_produit_id as dossier_id,
    cpd.filename,
    cpd.status,
    cpd.validated_at as date_validation,
    e.name as expert,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.date::date = cpd.validated_at::date
              AND dt.actor_type = 'expert'
              AND dt.title LIKE '%validé%'
              AND dt.metadata::text LIKE '%' || cpd.filename || '%'
        ) THEN '✅ Tracé'
        ELSE '❌ NON TRACÉ'
    END as statut_timeline
FROM "ClientProcessDocument" cpd
JOIN "ClientProduitEligible" cpe ON cpe.id = cpd.client_produit_id
LEFT JOIN "Expert" e ON e.id = cpd.validated_by
WHERE cpd.status = 'validated' 
  AND cpd.validated_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM dossier_timeline dt 
    WHERE dt.dossier_id = cpd.client_produit_id 
      AND dt.date::date = cpd.validated_at::date
      AND dt.actor_type = 'expert'
      AND dt.metadata::text LIKE '%' || cpd.filename || '%'
)
ORDER BY cpd.validated_at DESC
LIMIT 50;

-- B. Rejets de documents individuels
SELECT 
    '❌ REJETS DOCS SANS TIMELINE' as section,
    cpd.id as document_id,
    cpd.client_produit_id as dossier_id,
    cpd.filename,
    cpd.status,
    cpd.rejection_reason,
    cpd.validated_at as date_rejet,
    e.name as expert,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.date::date = cpd.validated_at::date
              AND dt.actor_type = 'expert'
              AND dt.title LIKE '%rejeté%'
        ) THEN '✅ Tracé'
        ELSE '❌ NON TRACÉ'
    END as statut_timeline
FROM "ClientProcessDocument" cpd
JOIN "ClientProduitEligible" cpe ON cpe.id = cpd.client_produit_id
LEFT JOIN "Expert" e ON e.id = cpd.validated_by
WHERE cpd.status = 'rejected' 
  AND cpd.validated_at IS NOT NULL
ORDER BY cpd.validated_at DESC
LIMIT 50;

-- ============================================================================

-- 1️⃣1️⃣ ASSIGNATIONS EXPERT
-- ============================================================================
SELECT 
    '👨‍💼 ASSIGNATIONS EXPERT' as section,
    cpe.id as dossier_id,
    e.name as expert,
    cpe.created_at as date_creation_dossier,
    cpe.updated_at as derniere_maj,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpe.id 
              AND dt.actor_type = 'expert'
              AND (dt.title LIKE '%accepté%' OR dt.title LIKE '%assigné%')
        ) THEN '✅ Tracé'
        ELSE '❌ NON TRACÉ'
    END as statut_timeline
FROM "ClientProduitEligible" cpe
JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.expert_id IS NOT NULL
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 1️⃣2️⃣ CHANGEMENTS DE STATUT
-- ============================================================================
SELECT 
    '🔄 CHANGEMENTS STATUT' as section,
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    cpe.statut as statut_actuel,
    cpe.current_step as etape_actuelle,
    cpe.updated_at as derniere_maj,
    COUNT(dt.id) as nb_evenements_timeline
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN dossier_timeline dt ON dt.dossier_id = cpe.id AND dt.type = 'status_change'
GROUP BY cpe.id, c.company_name, pe.nom, cpe.statut, cpe.current_step, cpe.updated_at
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 1️⃣3️⃣ RÉSUMÉ DES ÉVÉNEMENTS MANQUANTS
-- ============================================================================
WITH stats AS (
    SELECT 
        'Documents uploadés' as type_action,
        COUNT(*) as total_actions,
        COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.date::date = cpd.created_at::date
        ) THEN 1 END) as traces,
        COUNT(*) - COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.date::date = cpd.created_at::date
        ) THEN 1 END) as non_traces
    FROM "ClientProcessDocument" cpd
    
    UNION ALL
    
    SELECT 
        'Documents validés par expert',
        COUNT(*),
        COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.actor_type = 'expert'
              AND dt.title LIKE '%validé%'
        ) THEN 1 END),
        COUNT(*) - COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.actor_type = 'expert'
        ) THEN 1 END)
    FROM "ClientProcessDocument" cpd
    WHERE cpd.status = 'validated'
    
    UNION ALL
    
    SELECT 
        'Documents rejetés par expert',
        COUNT(*),
        COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.actor_type = 'expert'
              AND dt.title LIKE '%rejeté%'
        ) THEN 1 END),
        COUNT(*) - COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM dossier_timeline dt 
            WHERE dt.dossier_id = cpd.client_produit_id 
              AND dt.actor_type = 'expert'
        ) THEN 1 END)
    FROM "ClientProcessDocument" cpd
    WHERE cpd.status = 'rejected'
)
SELECT 
    '📊 RÉSUMÉ ÉVÉNEMENTS MANQUANTS' as section,
    type_action,
    total_actions,
    traces as nb_traces,
    non_traces as nb_non_traces,
    ROUND((traces::numeric / NULLIF(total_actions, 0)) * 100, 2) || '%' as pct_traces
FROM stats
ORDER BY non_traces DESC;

-- ============================================================================
-- FIN DE L'ANALYSE
-- ============================================================================

