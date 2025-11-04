-- ============================================================================
-- FIX : CORRIGER LES ÉTAPES DES DOSSIERS AVEC DOCUMENTS MANQUANTS
-- ============================================================================
-- Ce script corrige les dossiers qui ont le statut 'documents_manquants'
-- mais qui sont revenus à une étape incorrecte (étape 1 ou 2).
-- Ils doivent RESTER à l'étape 3 : "Collecte des documents"
--
-- Date : 4 novembre 2025
-- ============================================================================

-- 1️⃣ DIAGNOSTIC : Afficher les dossiers avec documents manquants
-- ============================================================================
SELECT 
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    e.name as expert,
    cpe.statut as statut_actuel,
    cpe.current_step as etape_actuelle,
    cpe.progress as progression_actuelle,
    cpe.metadata->>'documents_missing' as docs_missing_flag,
    cpe.metadata->>'last_document_rejection' as dernier_rejet,
    COUNT(cpd.id) as nb_documents,
    COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
    '🔄 À CORRIGER ÉTAPE 3' as action
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.statut = 'documents_manquants'
  OR (cpe.metadata->>'documents_missing')::boolean = true
  OR EXISTS (
    SELECT 1 FROM "ClientProcessDocument" cpd2 
    WHERE cpd2.client_produit_id = cpe.id 
      AND cpd2.status = 'rejected'
  )
GROUP BY cpe.id, c.company_name, pe.nom, e.name, cpe.statut, cpe.current_step, cpe.progress, cpe.metadata
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 2️⃣ CORRECTION : Forcer l'étape 3 pour tous les dossiers avec documents manquants
-- ============================================================================

-- Mise à jour des dossiers
UPDATE "ClientProduitEligible" cpe
SET 
    current_step = 3,
    statut = 'documents_manquants',
    progress = 50,  -- Progression à 50% (étape 3 en cours)
    metadata = COALESCE(cpe.metadata, '{}'::jsonb)::jsonb || 
               jsonb_build_object(
                   'documents_missing', true,
                   'step_locked_at_3', true,
                   'corrected_at', NOW()::text
               ),
    updated_at = NOW()
WHERE 
    -- Dossiers avec statut documents_manquants mais étape incorrecte
    (cpe.statut = 'documents_manquants' AND cpe.current_step != 3)
    -- OU dossiers avec flag documents_missing mais étape incorrecte
    OR ((cpe.metadata->>'documents_missing')::boolean = true AND cpe.current_step != 3)
    -- OU dossiers avec documents rejetés
    OR EXISTS (
        SELECT 1 FROM "ClientProcessDocument" cpd2 
        WHERE cpd2.client_produit_id = cpe.id 
          AND cpd2.status = 'rejected'
          AND cpe.current_step != 3
    );

-- ============================================================================

-- 3️⃣ VÉRIFICATION : Afficher les dossiers corrigés
-- ============================================================================
SELECT 
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    e.name as expert,
    cpe.statut as statut_corrige,
    cpe.current_step as etape_corrigee,
    cpe.progress as progression_corrigee,
    cpe.metadata->>'documents_missing' as docs_missing,
    cpe.metadata->>'step_locked_at_3' as verrouille_etape_3,
    cpe.updated_at as date_correction,
    COUNT(cpd.id) as nb_documents,
    COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
    STRING_AGG(
        CASE WHEN cpd.status = 'rejected' 
        THEN cpd.filename || ' (rejeté)' 
        ELSE NULL END, 
        ', '
    ) as documents_rejetes
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.statut = 'documents_manquants'
  AND cpe.current_step = 3
  AND cpe.metadata->>'step_locked_at_3' = 'true'
GROUP BY cpe.id, c.company_name, pe.nom, e.name, cpe.statut, cpe.current_step, cpe.progress, cpe.metadata, cpe.updated_at
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 4️⃣ STATISTIQUES APRÈS CORRECTION
-- ============================================================================
SELECT 
    '📊 RÉSULTAT CORRECTION ÉTAPES' as titre,
    COUNT(*) as nb_dossiers_corriges,
    STRING_AGG(DISTINCT c.company_name, ', ') as clients_impactes,
    STRING_AGG(DISTINCT pe.nom, ', ') as produits_impactes,
    STRING_AGG(DISTINCT e.name, ', ') as experts_impactes
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.statut = 'documents_manquants'
  AND cpe.current_step = 3
  AND cpe.metadata->>'step_locked_at_3' = 'true';

-- ============================================================================
-- NOTES IMPORTANTES :
-- ============================================================================
-- 1. Ce script corrige TOUS les dossiers qui ont :
--    - Un statut 'documents_manquants'
--    - Un flag documents_missing dans metadata
--    - Des documents avec status = 'rejected'
--
-- 2. Changements appliqués :
--    - current_step → 3 (forcé)
--    - statut → 'documents_manquants' (confirmé)
--    - progress → 50 (étape 3 en cours)
--    - metadata enrichi avec flags de verrouillage
--
-- 3. Les dossiers NE PEUVENT PLUS revenir aux étapes 1 ou 2 tant que :
--    - Des documents sont manquants
--    - Le statut est 'documents_manquants'
--
-- 4. La progression vers l'étape 4 se fera quand :
--    - L'expert validera tous les documents
--    - Le statut passera à 'audit_en_cours'
-- ============================================================================

