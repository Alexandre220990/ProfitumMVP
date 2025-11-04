-- ============================================================================
-- FIX : DOSSIERS AVEC TOUS LES DOCUMENTS VALIDÉS
-- ============================================================================
-- Ce script fait passer automatiquement les dossiers qui ont TOUS leurs
-- documents validés vers l'étape 4 (Audit) avec le statut approprié.
--
-- Date : 4 novembre 2025
-- ============================================================================

-- 1️⃣ DIAGNOSTIC : Afficher les dossiers concernés
-- ============================================================================
SELECT 
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    e.name as expert,
    cpe.statut as statut_actuel,
    cpe.current_step as etape_actuelle,
    cpe.progress as progression_actuelle,
    COUNT(cpd.id) as nb_documents,
    COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides,
    MAX(cpd.validated_at) as derniere_validation,
    '🔄 À PASSER ÉTAPE 4' as action
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.expert_id IS NOT NULL  -- Expert assigné
  AND cpe.current_step < 4       -- Pas encore à l'étape 4
GROUP BY cpe.id, c.company_name, pe.nom, e.name, cpe.statut, cpe.current_step, cpe.progress
HAVING COUNT(cpd.id) > 0  -- Au moins 1 document
   AND COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) = COUNT(cpd.id)  -- Tous validés
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 2️⃣ MISE À JOUR : Passer à l'étape 4 (Audit)
-- ============================================================================

-- Mise à jour des dossiers avec tous documents validés
WITH dossiers_a_corriger AS (
    SELECT 
        cpe.id as dossier_id,
        COUNT(cpd.id) as nb_docs,
        COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides
    FROM "ClientProduitEligible" cpe
    LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
    WHERE cpe.expert_id IS NOT NULL
      AND cpe.current_step < 4
    GROUP BY cpe.id
    HAVING COUNT(cpd.id) > 0
       AND COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) = COUNT(cpd.id)
)
UPDATE "ClientProduitEligible" cpe
SET 
    statut = 'audit_en_cours',
    current_step = 4,
    progress = 70,  -- Progression à 70% (étape audit)
    metadata = (
        COALESCE(cpe.metadata::text, '{}')::jsonb || 
        jsonb_build_object(
            'all_documents_validated', true,
            'audit_ready', true,
            'auto_progressed_to_audit', true,
            'progressed_at', NOW()::text
        )
    )::json,
    updated_at = NOW()
FROM dossiers_a_corriger dac
WHERE cpe.id = dac.dossier_id;

-- ============================================================================

-- 3️⃣ VÉRIFICATION : Afficher les dossiers corrigés
-- ============================================================================
SELECT 
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    e.name as expert,
    cpe.statut as nouveau_statut,
    cpe.current_step as nouvelle_etape,
    cpe.progress as nouvelle_progression,
    cpe.metadata->>'all_documents_validated' as tous_docs_valides,
    cpe.metadata->>'audit_ready' as pret_audit,
    cpe.metadata->>'auto_progressed_to_audit' as progression_auto,
    cpe.updated_at as date_mise_a_jour,
    COUNT(cpd.id) as nb_documents,
    STRING_AGG(cpd.filename, ', ' ORDER BY cpd.created_at) as liste_documents
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.statut = 'audit_en_cours'
  AND cpe.current_step = 4
  AND cpe.metadata->>'auto_progressed_to_audit' = 'true'
GROUP BY cpe.id, c.company_name, pe.nom, e.name, cpe.statut, cpe.current_step, cpe.progress, cpe.metadata, cpe.updated_at
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 4️⃣ STATISTIQUES APRÈS FIX
-- ============================================================================
SELECT 
    '📊 RÉSULTAT' as titre,
    COUNT(*) as nb_dossiers_corriges,
    STRING_AGG(DISTINCT c.company_name, ', ') as clients_impactes,
    STRING_AGG(DISTINCT pe.nom, ', ') as produits_impactes,
    STRING_AGG(DISTINCT e.name, ', ') as experts_impactes
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.statut = 'audit_en_cours'
  AND cpe.current_step = 4
  AND cpe.metadata->>'auto_progressed_to_audit' = 'true';

-- ============================================================================
-- NOTES IMPORTANTES :
-- ============================================================================
-- 1. Ce script fait passer automatiquement les dossiers à l'étape 4 quand :
--    - Un expert est assigné (expert_id IS NOT NULL)
--    - TOUS les documents sont validés (status = 'validated')
--    - L'étape actuelle est < 4
--
-- 2. Changements appliqués :
--    - statut → 'audit_en_cours'
--    - current_step → 4
--    - progress → 70
--    - metadata enrichi avec flags de suivi
--
-- 3. Les nouveaux dossiers utiliseront le workflow automatique du backend
--    qui fera cette transition automatiquement lors de la validation du
--    dernier document.
--
-- 4. Après l'exécution, l'expert peut :
--    - Lancer l'audit technique
--    - Demander des documents complémentaires (retour étape 3)
-- ============================================================================

